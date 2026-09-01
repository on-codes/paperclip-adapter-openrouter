# paperclip-adapter-openrouter

An [OpenRouter](https://openrouter.ai) adapter for [Paperclip](https://github.com/paperclipai/paperclip), built against Paperclip's [external adapter plugin contract](https://github.com/paperclipai/paperclip/blob/main/docs/adapters/external-adapters.md) (`createServerAdapter()`), so it installs from **Settings → Adapters → Install Adapter** with no changes to Paperclip's own source.

## Why this exists

Paperclip's built-in adapters (Codex, Claude Code, Cursor, Gemini CLI, Grok Build...) each wrap one vendor's own CLI, and each authenticates only against that vendor's own API — none of them can be pointed at OpenRouter, even though the agent "Model" picker lists OpenRouter-priced models like `deepseek/deepseek-chat (OpenRouter)`. Selecting one of those models with a vendor adapter still sends the request to that vendor's own endpoint and fails auth (see [paperclipai/paperclip#1068](https://github.com/paperclipai/paperclip/issues/1068), open, no official OpenRouter support yet).

This package is a minimal, dependency-free-at-runtime adapter that actually talks to OpenRouter, so agents can run on DeepSeek, Llama, Qwen, or any of the 300+ models OpenRouter proxies, through a single API key.

## v0.1 scope

- ✅ Single-turn chat completion against OpenRouter (`POST /api/v1/chat/completions`), driven by Paperclip's per-run task brief (`context.paperclipTaskMarkdown`).
- ✅ `testEnvironment()` — validates the key live against `GET /api/v1/auth/key` and checks the configured model.
- ✅ Declarative config form (`getConfigSchema()`) for Model / Temperature / Max tokens / System prompt — no React component needed.
- ✅ Real cost/usage reporting via OpenRouter's `usage: { include: true }`.
- ❌ **Not yet ported**: the Paperclip API tool-calling loop (`get_issue`, `update_issue_status`, `add_comment`, `create_sub_issue`, `hire_agent`, ...) that lets an agent actually operate the issue tracker, the way the Codex/Claude Code CLI adapters can. Today this adapter gets the agent *thinking and replying* on the chosen model — it does not yet *act*. That tool loop is the natural v2 (see `doc/plugins/PLUGIN_AUTHORING_GUIDE.md` and `docs/adapters/creating-an-adapter.md` in the Paperclip repo for the pattern).

## Install

This repo ships **source only** (`dist/` is gitignored, build it where you install it) to keep generated code out of git.

### Local path (recommended for a single self-hosted instance)

```sh
# Wherever Paperclip's server process can read it — for a Docker Compose
# deployment with `volumes: - ./data:/paperclip`, that's somewhere under
# ./data on the host, e.g. ./data/adapters/openrouter.
git clone https://github.com/on-codes/paperclip-adapter-openrouter <path>
cd <path>
npm install
npm run build
```

Then in Paperclip: **Settings → Adapters → Install Adapter → Local path**, and give the **container-visible** path (e.g. `/paperclip/adapters/openrouter` if you cloned into `./data/adapters/openrouter` on the host). Local-path adapters are loaded by a direct `import()` of `dist/index.js` — no npm resolution happens for you, so `npm install && npm run build` must be done in place before installing.

### npm

Not published yet. If you want this discoverable via **Install Adapter → npm package**, `npm publish` it under a scope you control and install by that package name instead.

## Configure an agent

1. Create/edit an agent, set **Adapter type** to `openrouter`.
2. Pick a **Model** (e.g. `deepseek/deepseek-chat`) — the field is populated by this adapter's `getConfigSchema()`.
3. Bind `OPENROUTER_API_KEY` under **Environment variables** to a secret holding your OpenRouter key (get one at <https://openrouter.ai/keys>) — the same flow you'd use to bind `OPENAI_API_KEY` for the Codex adapter.
4. Click **Test** to validate the key live before running the agent.

## Development

```sh
npm install
npm run typecheck   # tsc --noEmit against @paperclipai/adapter-utils' real published types
npm run build        # emits dist/
```

## License

MIT
