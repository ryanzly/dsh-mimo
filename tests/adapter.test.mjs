import test from "node:test";
import assert from "node:assert/strict";
import { MimoAdapter, modelSupportsThinking, modelSupportsTools, parseSse, thinkingTypeFor, toWireMessages, toWireTools } from "../lib/mimo-adapter.js";
import { MimoClient } from "../lib/mimo-api.js";

test("adapter: capability detection is per model", () => {
  assert.equal(modelSupportsThinking("mimo-v2.6-pro"), true);
  assert.equal(modelSupportsThinking("mimo-v2.6-flash"), true);
  assert.equal(modelSupportsThinking("mimo-v2.5-asr"), false);
  assert.equal(modelSupportsThinking("mimo-v2.5-tts"), false);
  assert.equal(modelSupportsTools("mimo-v2.6-pro"), true);
  assert.equal(modelSupportsTools("mimo-v2.5-asr"), false);
});

test("adapter: effort ladder adapts onto the thinking switch", () => {
  assert.equal(thinkingTypeFor("off"), "disabled");
  assert.equal(thinkingTypeFor("none"), "disabled");
  assert.equal(thinkingTypeFor(""), "disabled");
  assert.equal(thinkingTypeFor("default"), "disabled");
  assert.equal(thinkingTypeFor("Default"), "disabled");
  assert.equal(thinkingTypeFor("low"), "enabled");
  assert.equal(thinkingTypeFor("high"), "enabled");
});

test("adapter: history projection keeps reasoning_content for tool turns", async () => {
  const wire = await toWireMessages([
    { role: "system", content: [{ type: "text", text: "sys" }] },
    { role: "developer", content: [{ type: "tool-addition", toolName: "bash" }] },
    { role: "user", content: [{ type: "text", text: "hi" }] },
    {
      role: "assistant",
      content: [
        { type: "reasoning", text: "thinking…" },
        { type: "tool-call", id: "call-1", name: "bash", arguments: '{"command":"ls"}' }
      ]
    },
    { role: "tool", toolCallId: "call-1", content: [{ type: "text", text: "ok" }] },
    {
      role: "assistant",
      content: [
        { type: "reasoning", text: "more" },
        { type: "text", text: "done" }
      ]
    }
  ]);
  assert.equal(wire.length, 5);
  assert.deepEqual(wire[0], { role: "system", content: "sys" });
  assert.deepEqual(wire[1], { role: "user", content: "hi" });
  assert.equal(wire[2].role, "assistant");
  assert.equal(wire[2].reasoning_content, "thinking…");
  assert.equal(wire[2].tool_calls[0].function.name, "bash");
  assert.deepEqual(wire[3], { role: "tool", tool_call_id: "call-1", content: "ok" });
  assert.equal(wire[4].content, "done");
  assert.equal(wire[4].reasoning_content, "more");
});

test("adapter: tools projection is function shaped", () => {
  const tools = toWireTools([{ name: "mimo_quota", description: "d", parameters: { type: "object", properties: {} } }]);
  assert.deepEqual(tools[0], { type: "function", function: { name: "mimo_quota", description: "d", parameters: { type: "object", properties: {} } } });
});

function sseBody(events) {
  const encoder = new TextEncoder();
  const chunks = events.map(event => encoder.encode(`data: ${event}\n\n`));
  return {
    getReader() {
      let i = 0;
      return {
        async read() {
          if (i >= chunks.length) return { done: true, value: undefined };
          const value = chunks[i]; i += 1;
          return { done: false, value };
        },
        releaseLock() {}
      };
    }
  };
}

test("adapter: parseSse yields payloads and stops at [DONE]", async () => {
  const out = [];
  for await (const event of parseSse(sseBody(['{"a":1}', "[DONE]", '{"b":2}']), undefined)) out.push(event);
  assert.deepEqual(out, ['{"a":1}', "[DONE]"]);
});

test("adapter: stream maps reasoning, text, tool calls and usage", async () => {
  const events = [
    JSON.stringify({ choices: [{ delta: { reasoning_content: "思考" } }] }),
    JSON.stringify({ choices: [{ delta: { reasoning_content: "中" } }] }),
    JSON.stringify({ choices: [{ delta: { content: "你好" } }] }),
    JSON.stringify({ choices: [{ delta: { tool_calls: [{ index: 0, id: "call-9", function: { name: "mimo_quota", arguments: "" } }] } }] }),
    JSON.stringify({ choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: "{}" } }] } }] }),
    JSON.stringify({ choices: [{ delta: {}, finish_reason: "tool_calls" }], usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15, completion_tokens_details: { reasoning_tokens: 3 } } }),
    "[DONE]"
  ];
  const client = new MimoClient({
    apiKey: "tp-1",
    baseUrl: "https://token-plan-cn.xiaomimimo.com/v1",
    fetcher: async () => ({ ok: true, status: 200, body: sseBody(events), json: async () => ({}), text: async () => "" })
  });
  const adapter = new MimoAdapter({ client: () => client, defaultThinking: () => "high" });
  const chunks = [];
  for await (const chunk of adapter.stream({
    provider: "xiaomi-mimo",
    model: "mimo-v2.6-pro",
    messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }]
  })) chunks.push(chunk);

  const kinds = chunks.map(chunk => chunk.type);
  assert.equal(kinds[0], "block-start");
  assert.ok(kinds.includes("reasoning-delta"));
  assert.ok(kinds.includes("text-delta"));
  assert.ok(kinds.includes("tool-call-delta"));
  assert.equal(kinds.at(-1), "finish");
  const finish = chunks.at(-1);
  assert.equal(finish.reason.kind, "tool-calls");
  const usage = chunks.find(chunk => chunk.type === "usage");
  assert.equal(usage.usage.inputTokens, 10);
  assert.equal(usage.usage.reasoningTokens, 3);
  const blocks = chunks.filter(chunk => chunk.type === "block-end").map(chunk => chunk.block);
  assert.deepEqual(blocks.map(block => block.type), ["reasoning", "text", "tool-call"]);
  assert.equal(blocks[0].text, "思考中");
  assert.equal(blocks[2].name, "mimo_quota");
  assert.equal(blocks[2].arguments, "{}");
});

test("adapter: resolveModel always carries context capacity", async () => {
  const client = new MimoClient({
    apiKey: "tp-1",
    baseUrl: "https://token-plan-cn.xiaomimimo.com/v1",
    fetcher: async () => jsonResponse({ object: "list", data: [{ id: "mimo-v2.6-pro-ultraspeed" }] })
  });
  const adapter = new MimoAdapter({ client: () => client, defaultThinking: () => "high" });
  const info = await adapter.resolveModel("xiaomi-mimo", "mimo-v2.6-pro-ultraspeed");
  assert.equal(info.context.contextWindow, 1000000);
  assert.equal(info.defaultMaxTokens, 131072);
  assert.equal(info.reasoning.defaultEffort, "high");
  const custom = await adapter.resolveModel("xiaomi-mimo", "totally-unknown-model");
  assert.equal(custom.context.contextWindow > 0, true, "unknown models still need a context window");
});

test("adapter: default effort keeps a leaked thought out of the answer", async () => {
  const close = "</think>";
  const events = [
    JSON.stringify({ choices: [{ delta: { content: "先把 17*23 算成 391" + close + "391" }, finish_reason: "stop" }] }),
    "[DONE]"
  ];
  let captured;
  const client = new MimoClient({
    apiKey: "tp-1",
    baseUrl: "https://token-plan-cn.xiaomimimo.com/v1",
    fetcher: async (_url, init) => {
      captured = JSON.parse(init.body);
      return { ok: true, status: 200, body: sseBody(events), json: async () => ({}), text: async () => "" };
    }
  });
  const adapter = new MimoAdapter({ client: () => client, defaultThinking: () => "high" });
  const chunks = [];
  for await (const chunk of adapter.stream({ provider: "p", model: "mimo-v2.6-pro-ultraspeed", reasoningEffort: "default", messages: [] })) chunks.push(chunk);
  assert.equal(captured.thinking.type, "disabled");
  const blocks = chunks.filter(chunk => chunk.type === "block-end").map(chunk => chunk.block);
  assert.equal(blocks.find(block => block.type === "text")?.text, "391");
  assert.equal(blocks.find(block => block.type === "reasoning")?.text, "先把 17*23 算成 391");
});

test("adapter: stream sets thinking from the effort and reports auth failures", async () => {
  let captured;
  const client = new MimoClient({
    apiKey: "tp-1",
    baseUrl: "https://token-plan-cn.xiaomimimo.com/v1",
    fetcher: async (url, init) => {
      captured = JSON.parse(init.body);
      return { ok: true, status: 200, body: sseBody([JSON.stringify({ choices: [{ delta: { content: "hi" }, finish_reason: "stop" }] }), "[DONE]"]), json: async () => ({}), text: async () => "" };
    }
  });
  const adapter = new MimoAdapter({ client: () => client, defaultThinking: () => "high" });
  const consume = async (effort) => {
    for await (const _ of adapter.stream({ provider: "p", model: "mimo-v2.6-pro", reasoningEffort: effort, messages: [] })) { /* drain */ }
  };
  await consume("off");
  assert.equal(captured.thinking.type, "disabled");
  await consume("default");
  assert.equal(captured.thinking.type, "disabled");
  await consume("high");
  assert.equal(captured.thinking.type, "enabled");

  const empty = new MimoAdapter({ client: () => new MimoClient({ apiKey: "", baseUrl: "", fetcher: async () => { throw new Error("no"); } }) });
  await assert.rejects(async () => { for await (const _ of empty.stream({ provider: "p", model: "m", messages: [] })) { /* drain */ } }, /尚未配置密钥/);
});
