/**
 * MiMo LLM adapter.
 *
 * Wire: OpenAI-compatible Chat Completions (SSE) against the endpoint the key
 * resolves to. Reasoning is MiMo's `thinking` switch: the adapter exposes an
 * authoritative per-model effort ladder and adapts every selectable level onto
 * that switch — off disables deep thinking; low/medium/high all enable it,
 * matching the platform's own semantics where every non-none level behaves
 * identically. Models without deep thinking (ASR/TTS) expose no ladder at all.
 */
import { attributionHeaders, LlmAdapter, LlmError } from "@deepseek-ai/dsh-llm";
import { ASR_MODEL, KNOWN_MODELS, TTS_MODELS } from "./mimo-api.js";

const THINKING_EFFORTS = [
  { id: "off", name: "Off · 关闭思考", description: "MiMo 深度思考关闭（thinking=disabled）" },
  { id: "low", name: "Low · 低" },
  { id: "medium", name: "Medium · 中" },
  { id: "high", name: "High · 深度思考", description: "MiMo 当前所有非 off 档位行为一致，均开启深度思考" }
];

/** Whether one model id exposes MiMo deep thinking. */
export function modelSupportsThinking(model) {
  const id = String(model ?? "");
  if (TTS_MODELS.includes(id) || id === ASR_MODEL) return false;
  return /mimo-v2\.6|mimo-v2\.5-pro|reasoner|think/i.test(id);
}

/** Whether one model id accepts tools (MiMo chat models do; ASR/TTS do not). */
export function modelSupportsTools(model) {
  const id = String(model ?? "");
  return id !== ASR_MODEL && !TTS_MODELS.includes(id);
}

/** Adaptive effort mapping: the whole ladder lands on MiMo's on/off switch. */
export function thinkingTypeFor(reasoningEffort) {
  const effort = String(reasoningEffort ?? "").toLowerCase();
  return effort === "" || effort === "off" || effort === "none" || effort === "disabled" ? "disabled" : "enabled";
}

function contentText(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.filter(block => block?.type === "text").map(block => block.text ?? "").join("");
  return "";
}

/**
 * Project durable request messages onto MiMo wire messages. Thinking-mode
 * multi-turn tool calls require the historical `reasoning_content` to be
 * passed back whenever a turn carries tool calls, or the API answers 400.
 */
export async function toWireMessages(messages, { imageAccess, signal } = {}) {
  const wire = [];
  for (const message of messages ?? []) {
    const blocks = message?.content ?? [];
    switch (message?.role) {
      case "system":
        wire.push({ role: "system", content: contentText(blocks) });
        break;
      case "developer":
        // Tool additions/removals are session bookkeeping; every request
        // declares the complete current tool list instead.
        break;
      case "user": {
        const parts = [];
        for (const block of blocks) {
          if (block?.type === "text") parts.push({ type: "text", text: block.text ?? "" });
          else if (block?.type === "image") {
            const url = await imageDataUrl(block, imageAccess, signal);
            if (url !== undefined) parts.push({ type: "image_url", image_url: { url } });
            else parts.push({ type: "text", text: `[图片: ${block.attachment?.name ?? "image"}]` });
          }
        }
        if (parts.length === 1 && parts[0].type === "text") wire.push({ role: "user", content: parts[0].text });
        else if (parts.length > 0) wire.push({ role: "user", content: parts });
        break;
      }
      case "assistant": {
        const text = contentText(blocks);
        const reasoning = blocks.filter(block => block?.type === "reasoning").map(block => block.text ?? "").join("");
        const toolCalls = blocks.filter(block => block?.type === "tool-call").map(block => ({
          id: String(block.id ?? ""),
          type: "function",
          function: { name: String(block.name ?? ""), arguments: String(block.arguments ?? "{}") }
        }));
        const entry = { role: "assistant", content: text };
        if (reasoning !== "") entry.reasoning_content = reasoning;
        if (toolCalls.length > 0) entry.tool_calls = toolCalls;
        wire.push(entry);
        break;
      }
      case "tool":
        wire.push({ role: "tool", tool_call_id: String(message.toolCallId ?? ""), content: contentText(blocks) });
        break;
      default:
        break;
    }
  }
  return wire;
}

async function imageDataUrl(block, imageAccess, signal) {
  try {
    const ref = block?.attachment;
    if (ref === undefined || typeof imageAccess !== "function") return undefined;
    const stored = await imageAccess(ref, signal);
    const bytes = stored?.bytes ?? stored?.data ?? stored?.buffer;
    if (bytes === undefined) return undefined;
    const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
    return `data:${ref.mediaType ?? "image/png"};base64,${buffer.toString("base64")}`;
  } catch {
    return undefined;
  }
}

export function toWireTools(tools) {
  return (tools ?? []).map(tool => ({
    type: "function",
    function: {
      name: String(tool.name ?? ""),
      description: String(tool.description ?? ""),
      parameters: tool.parameters ?? { type: "object", properties: {} }
    }
  }));
}

/** Translate one provider failure into harness taxonomy. */
export function providerFailure(message, status, extra = {}) {
  const code = status === 401 || status === 403 ? "AUTH" : status === 429 ? "RATE_LIMIT" : status === 400 ? "INVALID_REQUEST" : `mimo/http-${status ?? 0}`;
  return LlmError.fromFailure({ message: String(message ?? `MiMo API ${status}`), code, ...Number.isInteger(status) ? { status } : {}, ...extra });
}

function numberOr(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export class MimoAdapter extends LlmAdapter {
  /**
   * @param {{ client: () => import("./mimo-api.js").MimoClient,
   *           attachments?: () => any,
   *           defaultThinking?: () => string,
   *           providerName?: string }} dependencies
   */
  constructor(dependencies) {
    super();
    this.dependencies = dependencies;
    this.imageAccess = (ref, signal) => {
      const store = this.dependencies.attachments?.();
      return store?.readImage ? store.readImage(ref, signal) : undefined;
    };
  }

  providerInfo(provider) {
    return { id: provider, name: this.dependencies.providerName ?? "Xiaomi MiMo" };
  }

  async listModels(provider) {
    const { models } = await this.dependencies.client().listModels();
    return models.map(entry => ({
      provider,
      id: entry.id,
      name: entry.name ?? entry.id,
      ...entry.contextWindow === undefined ? {} : { description: `${Math.round(entry.contextWindow / 1000)}K context` },
      inputModalities: /mimo-v2\.6/.test(entry.id) ? ["text", "image"] : ["text"]
    }));
  }

  async resolveModel(provider, model, signal) {
    const catalog = await this.dependencies.client().listModels({ signal });
    const known = catalog.models.find(entry => entry.id === model) ?? KNOWN_MODELS.find(entry => entry.id === model);
    return {
      provider,
      id: model,
      name: known?.name ?? model,
      ...known?.contextWindow === undefined ? {} : { context: { contextWindow: known.contextWindow } },
      inputModalities: /mimo-v2\.6/.test(model) ? ["text", "image"] : ["text"],
      ...modelSupportsThinking(model) ? {
        reasoning: {
          efforts: THINKING_EFFORTS,
          defaultEffort: this.dependencies.defaultThinking?.() ?? "high"
        }
      } : {}
    };
  }

  /** Stream one Chat Completions call as harness StreamChunks. */
  async *stream(options) {
    const client = this.dependencies.client();
    if (!client.configured()) throw new LlmError("MiMo 尚未配置密钥：请在设置页完成登录或粘贴 Token Plan 密钥", "AUTH");
    const thinking = modelSupportsThinking(options.model);
    const body = {
      model: options.model,
      messages: await toWireMessages(options.messages, { imageAccess: this.imageAccess, signal: options.signal }),
      stream: true,
      stream_options: { include_usage: true }
    };
    const tools = modelSupportsTools(options.model) ? toWireTools(options.tools) : [];
    if (tools.length > 0) body.tools = tools;
    if (typeof options.maxTokens === "number") body.max_completion_tokens = options.maxTokens;
    if (Array.isArray(options.stop) && options.stop.length > 0) body.stop = options.stop;
    if (thinking) body.thinking = { type: thinkingTypeFor(options.reasoningEffort ?? this.dependencies.defaultThinking?.()) };
    else if (typeof options.temperature === "number") body.temperature = options.temperature;

    const response = await client.fetcher(`${client.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", "api-key": client.apiKey, authorization: `Bearer ${client.apiKey}`, "x-mimo-source": "dsh-mimo", ...attributionHeaders() },
      body: JSON.stringify(body),
      signal: options.signal
    });
    if (!response.ok) {
      let message = `MiMo API ${response.status}`;
      try {
        const payload = await response.json();
        message = payload?.error?.message ?? payload?.message ?? message;
      } catch { /* keep generic */ }
      throw providerFailure(message, response.status);
    }

    // Block assembly: one open block at a time, closed on kind change or at end.
    let index = -1;
    let open = null; // { kind, index, text?, arguments? }
    const toolByWireIndex = new Map();
    let usage = null;
    let finishKind = "stop";
    let pending = [];

    const closeOpen = () => {
      if (open === null) return;
      if (open.kind === "text") pending.push({ type: "block-end", index: open.index, block: { type: "text", text: open.text } });
      else if (open.kind === "reasoning") pending.push({ type: "block-end", index: open.index, block: { type: "reasoning", text: open.text } });
      else if (open.kind === "tool-call") pending.push({ type: "block-end", index: open.index, block: { type: "tool-call", id: open.id, name: open.name, arguments: open.arguments } });
      open = null;
    };
    const openBlock = (kind, seed = {}) => {
      closeOpen();
      index += 1;
      open = { kind, index, text: "", arguments: "", ...seed };
      pending.push({ type: "block-start", index, blockType: kind });
    };

    for await (const event of parseSse(response.body, options.signal)) {
      if (event === "[DONE]") break;
      let chunk;
      try { chunk = JSON.parse(event); } catch { continue; }
      if (chunk?.usage) usage = chunk.usage;
      const choice = chunk?.choices?.[0];
      const delta = choice?.delta ?? {};
      if (typeof delta.reasoning_content === "string" && delta.reasoning_content !== "") {
        if (open?.kind !== "reasoning") openBlock("reasoning");
        open.text += delta.reasoning_content;
        pending.push({ type: "reasoning-delta", index: open.index, text: delta.reasoning_content });
      }
      if (typeof delta.content === "string" && delta.content !== "") {
        if (open?.kind !== "text") openBlock("text");
        open.text += delta.content;
        pending.push({ type: "text-delta", index: open.index, text: delta.content });
      }
      for (const call of delta.tool_calls ?? []) {
        const wireIndex = typeof call.index === "number" ? call.index : 0;
        let block = toolByWireIndex.get(wireIndex);
        if (!block) {
          openBlock("tool-call", { id: call.id ? String(call.id) : `call_${index + 1}`, name: "", arguments: "" });
          block = open;
          toolByWireIndex.set(wireIndex, block);
        }
        if (call.id) block.id = String(call.id);
        if (call.function?.name) block.name += String(call.function.name);
        const args = call.function?.arguments;
        if (typeof args === "string" && args !== "") {
          block.arguments += args;
          pending.push({ type: "tool-call-delta", index: block.index, id: block.id, name: block.name, argumentsDelta: args });
        }
      }
      if (choice?.finish_reason) {
        finishKind = choice.finish_reason === "tool_calls" ? "tool-calls" : choice.finish_reason === "length" ? "max-tokens" : "stop";
      }
      if (pending.length > 0) yield* pending.splice(0, pending.length);
    }
    closeOpen();
    if (pending.length > 0) yield* pending.splice(0, pending.length);
    if (usage) {
      yield {
        type: "usage",
        usage: {
          inputTokens: numberOr(usage.prompt_tokens),
          outputTokens: numberOr(usage.completion_tokens),
          totalTokens: numberOr(usage.total_tokens),
          ...usage.prompt_tokens_details?.cached_tokens ? { cacheReadTokens: numberOr(usage.prompt_tokens_details.cached_tokens) } : {},
          ...usage.completion_tokens_details?.reasoning_tokens ? { reasoningTokens: numberOr(usage.completion_tokens_details.reasoning_tokens) } : {}
        }
      };
    }
    yield { type: "finish", reason: toolByWireIndex.size > 0 && finishKind === "stop" ? { kind: "tool-calls" } : { kind: finishKind } };
  }
}

/** Parse an SSE byte stream into `data:` payloads, yielding "[DONE]" at the terminator. */
export async function* parseSse(body, signal) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    for (;;) {
      if (signal?.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let split;
      while ((split = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, split).trim();
        buffer = buffer.slice(split + 1);
        if (line === "") continue;
        if (line.startsWith("data:")) {
          const data = line.slice(5).trim();
          if (data === "[DONE]") { yield "[DONE]"; return; }
          if (data !== "") yield data;
        }
      }
    }
    const tail = buffer.trim();
    if (tail.startsWith("data:")) {
      const data = tail.slice(5).trim();
      if (data !== "" && data !== "[DONE]") yield data;
    }
  } finally {
    try { reader.releaseLock(); } catch { /* ignore */ }
  }
}
