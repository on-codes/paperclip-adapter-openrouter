/**
 * Shared config helpers.
 *
 * Env-var bindings ("Environment variables" on the agent's Configuration
 * page, resolved from a bound secret) arrive as `config.env.<KEY>` —
 * Paperclip resolves them server-side and merges them onto the adapter
 * config it hands to execute()/testEnvironment() (see
 * resolveAdapterConfigForRuntime / resolveExecutionRunAdapterConfig in
 * Paperclip's server). This is true regardless of whether the adapter
 * spawns a child process: `process.env` on the main server is NOT where a
 * per-agent secret binding lands — only a spawned subprocess gets it
 * injected into *its own* env. An HTTP-calling adapter like this one must
 * read `config.env`.
 */
export function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.trim().length > 0 ? v : fallback;
}

export function asNumber(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function configEnv(config: Record<string, unknown>): Record<string, unknown> {
  const env = config.env;
  return env && typeof env === "object" ? (env as Record<string, unknown>) : {};
}

/**
 * Resolve the OpenRouter API key with, in priority order:
 * 1. `config.apiKey` — explicit per-agent override in adapterConfig.
 * 2. `config.env.OPENROUTER_API_KEY` — the real path: an Environment
 *    variables binding to a secret, resolved by Paperclip before this
 *    function ever sees it.
 * 3. `process.env.OPENROUTER_API_KEY` — local/dev convenience only; never
 *    populated by Paperclip's per-agent secret bindings in production.
 */
export function readApiKey(config: Record<string, unknown>): string {
  return (
    asString(config.apiKey) ||
    asString(configEnv(config).OPENROUTER_API_KEY) ||
    asString(process.env.OPENROUTER_API_KEY)
  );
}
