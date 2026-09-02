import type {
  AdapterExecutionContext,
  AdapterExecutionResult,
} from "@paperclipai/adapter-utils";
import { asString, asNumber, readApiKey } from "./config.js";

const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";

interface OpenRouterChatResponse {
  model?: string;
  choices?: Array<{ message?: { content?: string } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    cost?: number;
  };
}

/**
 * Single-turn OpenRouter chat completion.
 *
 * v0.1 scope: this adapter gets an agent thinking and replying on any
 * OpenRouter model (DeepSeek included) — it does not yet drive Paperclip's
 * own issue/comment/hire tools the way the Codex/Claude Code CLI adapters
 * do. That tool-calling loop is a natural v2 addition once this baseline is
 * confirmed working end-to-end.
 */
export async function execute(
  ctx: AdapterExecutionContext,
): Promise<AdapterExecutionResult> {
  const { config, context, onLog, onMeta } = ctx;

  const apiKey = readApiKey(config);
  const model = asString(config.model, "deepseek/deepseek-chat");
  const temperature = asNumber(config.temperature, 0.7);
  const maxTokens = asNumber(config.maxTokens, 4096);
  const systemPrompt = asString(
    config.systemPrompt,
    "You are an autonomous Paperclip agent. Be concise and direct about the action you are taking.",
  );

  if (!apiKey) {
    return {
      exitCode: 1,
      signal: null,
      timedOut: false,
      errorMessage:
        "No OpenRouter API key configured. Bind OPENROUTER_API_KEY as an environment variable for this agent (Configuration → Environment variables), or set config.apiKey.",
      errorCode: "openrouter_api_key_missing",
    };
  }

  const taskBrief =
    asString((context as Record<string, unknown> | undefined)?.["paperclipTaskMarkdown"]) ||
    "Continue your work.";

  await onLog("stdout", `[openrouter] model=${model}\n`);

  await onMeta?.({
    adapterType: "openrouter",
    command: `POST ${OPENROUTER_CHAT_URL}`,
    prompt: taskBrief.slice(0, 500),
  });

  let response: Response;
  try {
    response = await fetch(OPENROUTER_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": asString(config.httpReferer, "https://paperclip.ing"),
        "X-Title": asString(config.xTitle, "Paperclip"),
      },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: maxTokens,
        usage: { include: true },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: taskBrief },
        ],
      }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await onLog("stderr", `[openrouter] network error: ${message}\n`);
    return {
      exitCode: 1,
      signal: null,
      timedOut: false,
      errorMessage: `Failed to reach OpenRouter: ${message}`,
      errorCode: "openrouter_network_error",
      errorFamily: "transient_upstream",
    };
  }

  const bodyText = await response.text();

  if (!response.ok) {
    await onLog("stderr", `[openrouter] HTTP ${response.status}: ${bodyText}\n`);
    return {
      exitCode: 1,
      signal: null,
      timedOut: false,
      errorMessage: `OpenRouter returned ${response.status}: ${bodyText.slice(0, 1000)}`,
      errorCode: response.status === 401 ? "openrouter_unauthorized" : "openrouter_error",
      errorFamily: response.status === 401 ? undefined : "transient_upstream",
    };
  }

  let data: OpenRouterChatResponse;
  try {
    data = JSON.parse(bodyText) as OpenRouterChatResponse;
  } catch {
    await onLog("stderr", `[openrouter] could not parse response: ${bodyText.slice(0, 500)}\n`);
    return {
      exitCode: 1,
      signal: null,
      timedOut: false,
      errorMessage: "OpenRouter returned a non-JSON response.",
      errorCode: "openrouter_bad_response",
    };
  }

  const reply = data.choices?.[0]?.message?.content ?? "";
  await onLog("stdout", `${reply}\n`);

  const inputTokens = Number(data.usage?.prompt_tokens ?? 0);
  const outputTokens = Number(data.usage?.completion_tokens ?? 0);
  const costUsd = typeof data.usage?.cost === "number" ? data.usage.cost : null;

  return {
    exitCode: 0,
    signal: null,
    timedOut: false,
    provider: "openrouter",
    model: data.model ?? model,
    usage: { inputTokens, outputTokens },
    usageBasis: "per_run",
    costUsd,
    summary: reply.slice(0, 280),
  };
}
