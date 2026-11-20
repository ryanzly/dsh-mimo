/**
 * Streaming splitter for MiMo's mid-turn field switch.
 *
 * The ultraspeed family can move an in-flight thought from the
 * `reasoning_content` field into `content` mid-token, and then mark the real
 * answer with a close-think tag. The junction between the last reasoning
 * delta and the first content delta classifies the content phase:
 *
 * - clean answer junction (sentence-final tail plus whitespace, CJK, capital)
 *   streams as text straight away;
 * - mid-token junction (word chars meeting word chars) continues the thought
 *   and streams into the reasoning block until a close-think tag;
 * - anything ambiguous (e.g. CJK meeting CJK) is held back until a marker
 *   decides, or a tool call / stream end / overflow resolves it as text.
 */

const CLOSE_MARKERS = ["\u003c/think\u003e", "\u003cthinking\u003e"];
const OPEN_MARKERS = ["\u003cthink\u003e", "\u003cthinking\u003e"];
const MARKER_MAX = 10;
const OVERFLOW = 2000;
const CJK = /[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uff00-\uffef]/;
const JUNCTION = /[A-Za-z0-9`\\_.'\"]/

function findMarker(text, markers) {
  let best = -1;
  let bestLen = 0;
  for (const marker of markers) {
    const at = text.indexOf(marker);
    if (at >= 0 && (best < 0 || at < best)) { best = at; bestLen = marker.length; }
  }
  return best < 0 ? null : { at: best, len: bestLen };
}

/** Classify the reasoning/content junction: answer | thinking | ambiguous. */
export function junctionKind(tail, head) {
  if (head === "") return "ambiguous";
  const t = tail === "" ? "" : tail[tail.length - 1];
  const h = head[0];
  if (/\s/.test(h) || /\s/.test(t)) return "answer";
  if (/[.!?\u3002\uff01\uff1f]/.test(t) && (CJK.test(h) || /[A-Z\u201c\"'(\[]/.test(h))) return "answer";
  if (t !== "" && JUNCTION.test(t) && JUNCTION.test(h)) return "thinking";
  return "ambiguous";
}

export class ThinkSplitter {
  /**
   * @param hadReasoning whether this response emitted `reasoning_content`
   * before the content phase (the only case where the switch happens).
   * @param tail the last ~32 chars of that reasoning, for the junction test.
   */
  constructor(hadReasoning = false, tail = "") {
    this.mode = hadReasoning ? "ambiguous" : "answer";
    this.tail = tail;
    this.buffer = "";
  }

  /** Feed one content delta; returns { reasoning, text } pieces to emit now. */
  push(delta) {
    if (process.env.TS_DEBUG) console.error("TS mode=" + this.mode + " tail=" + JSON.stringify(this.tail.slice(-8)) + " delta=" + JSON.stringify(delta.slice(0, 20)));
    this.buffer += delta;
    const out = { reasoning: "", text: "" };
    for (;;) {
      if (this.mode === "ambiguous") {
        if (this.buffer === "") return out;
        const close = findMarker(this.buffer, CLOSE_MARKERS);
        const open = findMarker(this.buffer, OPEN_MARKERS);
        if (close !== null && (open === null || close.at < open.at)) {
          out.reasoning += this.buffer.slice(0, close.at);
          this.buffer = this.buffer.slice(close.at + close.len);
          this.mode = "answer";
          continue;
        }
        if (open !== null) {
          out.reasoning += this.buffer.slice(0, open.at);
          this.buffer = this.buffer.slice(open.at + open.len);
          this.mode = "thinking";
          continue;
        }
        const kind = junctionKind(this.tail, this.buffer);
        if (kind === "ambiguous" && this.buffer.length <= OVERFLOW) return out;
        this.mode = kind === "thinking" ? "thinking" : "answer";
        continue;
      }
      if (this.mode === "thinking") {
        const close = findMarker(this.buffer, CLOSE_MARKERS);
        if (close !== null) {
          out.reasoning += this.buffer.slice(0, close.at);
          this.buffer = this.buffer.slice(close.at + close.len);
          this.mode = "answer";
          continue;
        }
        const keep = Math.min(this.buffer.length, MARKER_MAX);
        const flush = this.buffer.length - keep;
        if (flush > 0) {
          out.reasoning += this.buffer.slice(0, flush);
          this.buffer = this.buffer.slice(flush);
        }
        return out;
      }
      // mode === "answer"
      const open = findMarker(this.buffer, OPEN_MARKERS);
      if (open !== null) {
        out.text += this.buffer.slice(0, open.at);
        this.buffer = this.buffer.slice(open.at + open.len);
        this.mode = "thinking";
        continue;
      }
      out.text += this.buffer;
      this.buffer = "";
      return out;
    }
  }

  /** A tool call starts: any held content must be the answer, release it. */
  resolveAsAnswer() {
    if (this.mode !== "ambiguous") return { reasoning: "", text: "" };
    this.mode = "answer";
    const out = { reasoning: "", text: this.buffer };
    this.buffer = "";
    return out;
  }

  /** Flush whatever is buffered at end of stream. */
  flush() {
    const out = { reasoning: "", text: "" };
    if (this.buffer === "") return out;
    if (this.mode === "thinking") out.reasoning = this.buffer;
    else out.text = this.buffer;
    this.buffer = "";
    return out;
  }
}