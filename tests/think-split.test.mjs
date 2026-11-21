import test from "node:test";
import assert from "node:assert/strict";
import { ThinkSplitter, junctionKind } from "../lib/think-split.js";

const CLOSE = "\u003c/think\u003e";
const OPEN = "\u003cthink\u003e";

function feed(splitter, chunks, onToolCall) {
  const out = { reasoning: "", text: "" };
  for (const chunk of chunks) {
    if (chunk === "__TOOLCALL__" && onToolCall) {
      const held = splitter.resolveAsAnswer();
      out.reasoning += held.reasoning;
      out.text += held.text;
      continue;
    }
    const parts = splitter.push(chunk);
    out.reasoning += parts.reasoning;
    out.text += parts.text;
  }
  const tail = splitter.flush();
  out.reasoning += tail.reasoning;
  out.text += tail.text;
  return out;
}

test("think-split: plain text passes through untouched", () => {
  const out = feed(new ThinkSplitter(), ["你好", "，世界", "！"]);
  assert.equal(out.reasoning, "");
  assert.equal(out.text, "你好，世界！");
});

test("think-split: junction classification", () => {
  assert.equal(junctionKind("...markers like `", "`"), "thinking");
  assert.equal(junctionKind("for e.", ".g. examples"), "thinking");
  assert.equal(junctionKind("Say hello in one sentence.", "你好！"), "answer");
  assert.equal(junctionKind("The answer is", " 42"), "answer");
  assert.equal(junctionKind("Done.", "Yes, done"), "answer");
  assert.equal(junctionKind("思考中", "你好"), "ambiguous");
  assert.equal(junctionKind("这说明了", "问题很复杂"), "ambiguous");
});

test("think-split: field switch mid-token routes the continuation to reasoning", () => {
  const out = feed(new ThinkSplitter(true, "...XML-ish `"), ["`", "`` format when tools", " are present", CLOSE, "正式", "回答"]);
  assert.equal(out.reasoning, "``` format when tools are present");
  assert.equal(out.text, "正式回答");
});

test("think-split: marker split across deltas is still matched", () => {
  const out = feed(new ThinkSplitter(true, "thinking like `"), ["so", "mething", CLOSE.slice(0, 3), CLOSE.slice(3), "答案"]);
  assert.equal(out.reasoning, "something");
  assert.equal(out.text, "答案");
});

test("think-split: normal answer after reasoning stays text", () => {
  const out = feed(new ThinkSplitter(true, "The user wants a greeting."), ["你好", "，很高兴认识你"]);
  assert.equal(out.reasoning, "");
  assert.equal(out.text, "你好，很高兴认识你");
});

test("think-split: ambiguous junction resolves as text at a tool call", () => {
  const out = feed(new ThinkSplitter(true, "思考中"), ["你好", "__TOOLCALL__", "世界"], true);
  assert.equal(out.reasoning, "");
  assert.equal(out.text, "你好世界");
});

test("think-split: ambiguous junction resolves as reasoning at a marker", () => {
  const out = feed(new ThinkSplitter(true, "这说明了"), ["问题的", "根源", CLOSE, "答案"]);
  assert.equal(out.reasoning, "问题的根源");
  assert.equal(out.text, "答案");
});

test("think-split: disabled thinking holds a bare close tag out of the answer", () => {
  const out = feed(new ThinkSplitter(false, "", { guardBareClose: true }), ["先想一下", CLOSE, "391"]);
  assert.equal(out.reasoning, "先想一下");
  assert.equal(out.text, "391");
});

test("think-split: explicit open marker starts thinking even without prior reasoning", () => {
  const out = feed(new ThinkSplitter(), ["前言", OPEN, "想", CLOSE, "正文"]);
  assert.equal(out.reasoning, "想");
  assert.equal(out.text, "前言正文");
});

test("think-split: long continuation streams into reasoning live", () => {
  const prefix = "A long technical digression about tool markers and backticks. ".repeat(60);
  const chunks = [];
  for (let i = 0; i < prefix.length; i += 7) chunks.push(prefix.slice(i, i + 7));
  chunks.push(CLOSE);
  chunks.push("The real answer.");
  const out = feed(new ThinkSplitter(true, "digression like `"), chunks);
  assert.equal(out.reasoning, prefix);
  assert.equal(out.text, "The real answer.");
});