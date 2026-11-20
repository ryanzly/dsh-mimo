/**
 * MiMo ASR speech provider for ctx.speechToText.
 *
 * Registers one cloud recognizer beside the local SenseVoice provider: the
 * voice-input UI lists it in the provider picker and routes recordings to it
 * when selected. MiMo ASR accepts wav/mp3 up to 10 MB base64 through the
 * shared chat-completions endpoint (mimo-v2.5-asr + input_audio + asr_options).
 */
import { ASR_MODEL, wavSeconds } from "./mimo-api.js";

export const SPEECH_PROVIDER_ID = "mimo-asr";

/** @returns {import("@deepseek-ai/dsh-experimental-speech-to-text").SpeechProvider} */
export function createMimoSpeechProvider({ client, languages = ["auto", "zh", "en"], id = SPEECH_PROVIDER_ID } = {}) {
  return {
    info: {
      id,
      name: "MiMo 语音识别（云端）",
      location: "cloud",
      languages
    },
    async transcribe(input, signal) {
      const started = Date.now();
      const startedAt = started / 1000;
      const current = client();
      if (!current.configured()) throw new Error("MiMo 尚未配置密钥：请先在设置页登录或粘贴密钥");
      const audio = input?.audio;
      if (!(audio instanceof Uint8Array) || audio.byteLength === 0) throw new Error("录音为空");
      const audioSeconds = wavSeconds(audio);
      const language = normalizeLanguage(input?.language, languages);
      const { text } = await current.transcribe(audio, { language, signal });
      return {
        text,
        audioSeconds,
        inferenceSeconds: Math.max(0, Date.now() / 1000 - startedAt)
      };
    }
  };
}

/** The Remote accepts DSH language hints; MiMo only understands auto/zh/en. */
export function normalizeLanguage(language, supported = ["auto", "zh", "en"]) {
  const value = String(language ?? "auto").toLowerCase();
  if (value === "" || value === "auto" || value === "detect") return "auto";
  if (value.startsWith("zh")) return supported.includes("zh") ? "zh" : "auto";
  if (value.startsWith("en")) return supported.includes("en") ? "en" : "auto";
  return supported.includes(value) ? value : "auto";
}
