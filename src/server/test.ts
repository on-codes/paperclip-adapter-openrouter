import type {
  AdapterEnvironmentTestContext,
  AdapterEnvironmentTestResult,
  AdapterEnvironmentCheck,
} from "@paperclipai/adapter-utils";
import { readApiKey } from "./config.js";

const OPENROUTER_KEY_URL = "https://openrouter.ai/api/v1/auth/key";

export async function testEnvironment(
  ctx: AdapterEnvironmentTestContext,
): Promise<AdapterEnvironmentTestResult> {
  const checks: AdapterEnvironmentCheck[] = [];
  const config = ctx.config ?? {};

  const apiKey = readApiKey(config);

  if (!apiKey) {
    checks.push({
      code: "openrouter_api_key_missing",
      level: "error",
      message: "No OpenRouter API key configured.",
      hint: "Bind OPENROUTER_API_KEY as an environment variable for this agent, or set config.apiKey.",
    });
    return {
      adapterType: ctx.adapterType,
      status: "fail",
      checks,
      testedAt: new Date().toISOString(),
    };
  }

  checks.push({
    code: "openrouter_api_key_present",
    level: "info",
    message: "OPENROUTER_API_KEY is set.",
  });

  try {
    const res = await fetch(OPENROUTER_KEY_URL, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (res.ok) {
      const body = (await res.json().catch(() => null)) as
        | { data?: { label?: string; limit?: number | null } }
        | null;
      const label = body?.data?.label ? ` (${body.data.label})` : "";
      checks.push({
        code: "openrouter_key_valid",
        level: "info",
        message: `OpenRouter accepted the key${label}.`,
      });
    } else {
      checks.push({
        code: "openrouter_key_invalid",
        level: "error",
        message: `OpenRouter rejected the key (HTTP ${res.status}).`,
        hint: "Check the key at https://openrouter.ai/keys.",
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    checks.push({
      code: "openrouter_key_check_failed",
      level: "warn",
      message: `Could not reach OpenRouter to validate the key: ${message}`,
    });
  }

  const model = typeof config.model === "string" && config.model.trim() ? config.model : "";
  if (!model) {
    checks.push({
      code: "openrouter_model_missing",
      level: "warn",
      message: "No model configured; runs will default to deepseek/deepseek-chat.",
    });
  } else {
    checks.push({
      code: "openrouter_model_set",
      level: "info",
      message: `Model set to ${model}.`,
    });
  }

  const status: AdapterEnvironmentTestResult["status"] = checks.some((c) => c.level === "error")
    ? "fail"
    : checks.some((c) => c.level === "warn")
      ? "warn"
      : "pass";

  return {
    adapterType: ctx.adapterType,
    status,
    checks,
    testedAt: new Date().toISOString(),
  };
}
