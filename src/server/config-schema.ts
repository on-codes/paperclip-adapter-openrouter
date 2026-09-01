import type { AdapterConfigSchema } from "@paperclipai/adapter-utils";
import { models } from "../index.js";

/**
 * Declarative form fields for the agent Configuration page. No secret field
 * here on purpose — the API key travels through Environment variables +
 * Secrets (bind OPENROUTER_API_KEY), matching how the rest of this Paperclip
 * instance already handles per-agent provider credentials.
 */
export function getConfigSchema(): AdapterConfigSchema {
  return {
    fields: [
      {
        key: "model",
        label: "Model",
        type: "combobox",
        options: models.map((m) => ({ label: m.label, value: m.id })),
        default: "deepseek/deepseek-chat",
        hint: "Any OpenRouter model id (provider/model). Full catalog at openrouter.ai/models.",
        required: true,
      },
      {
        key: "temperature",
        label: "Temperature",
        type: "number",
        default: 0.7,
        hint: "Sampling temperature, 0–2.",
      },
      {
        key: "maxTokens",
        label: "Max tokens",
        type: "number",
        default: 4096,
        hint: "Max completion tokens per run.",
      },
      {
        key: "systemPrompt",
        label: "System prompt",
        type: "textarea",
        hint: "Optional system prompt prepended to every run.",
      },
    ],
  };
}
