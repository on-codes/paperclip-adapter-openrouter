// ---------------------------------------------------------------------------
// paperclip-adapter-openrouter — root metadata
//
// Kept dependency-free (per Paperclip's external-adapter contract): this
// file, and everything it re-exports at the package root, must be safely
// importable without pulling in `@paperclipai/adapter-utils` at runtime.
// ---------------------------------------------------------------------------

export const type = "openrouter" as const;

export const models = [
  { id: "deepseek/deepseek-chat", label: "DeepSeek Chat" },
  { id: "deepseek/deepseek-r1", label: "DeepSeek R1 (reasoning)" },
  { id: "anthropic/claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
  { id: "anthropic/claude-opus-4-6", label: "Claude Opus 4.6" },
  { id: "openai/gpt-4.1", label: "GPT-4.1" },
  { id: "openai/o4-mini", label: "o4-mini" },
  { id: "google/gemini-2.5-pro-preview", label: "Gemini 2.5 Pro" },
  { id: "meta-llama/llama-4-maverick", label: "Llama 4 Maverick" },
  { id: "qwen/qwen3-235b-a22b", label: "Qwen3 235B" },
  { id: "openrouter/auto", label: "Auto (OpenRouter picks)" },
] as const;

export const agentConfigurationDoc = `# openrouter adapter configuration

Use when: the agent should run on a model reached through OpenRouter
(https://openrouter.ai) — DeepSeek, Llama, Qwen, or any of the 300+ models
OpenRouter proxies — rather than a vendor-specific CLI harness (Codex,
Claude Code, Gemini CLI, ...) that only authenticates against its own
vendor's API.

Don't use when: the agent should use a vendor's own subscription/CLI tooling
(e.g. a ChatGPT Plus login via the Codex adapter, or a Claude subscription
via Claude Code) — those adapters do not accept OpenRouter credentials.

Core fields:
- \`config.model\`      — OpenRouter model id, e.g. "deepseek/deepseek-chat".
                          Defaults to "deepseek/deepseek-chat" if unset.
- \`config.temperature\` — sampling temperature (default 0.7).
- \`config.maxTokens\`   — max completion tokens per run (default 4096).
- \`config.systemPrompt\`— optional system prompt prepended to every run.

Credentials: set the \`OPENROUTER_API_KEY\` environment variable on the agent
(Configuration → Environment variables → bind a secret), the same way you'd
bind OPENAI_API_KEY for the Codex adapter. Get a key at
https://openrouter.ai/keys. \`config.apiKey\` is also accepted as a
per-agent override but the environment-variable/secret path is preferred so
the key never sits in plaintext adapter config.
`;

// Required by plugin-loader convention: the package root must re-export
// createServerAdapter for Paperclip's plugin loader to find it.
export { createServerAdapter } from "./server/index.js";
