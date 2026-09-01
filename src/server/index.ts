import type { ServerAdapterModule } from "@paperclipai/adapter-utils";
import { type, models, agentConfigurationDoc } from "../index.js";
import { execute } from "./execute.js";
import { testEnvironment } from "./test.js";
import { getConfigSchema } from "./config-schema.js";

export function createServerAdapter(): ServerAdapterModule {
  return {
    type,
    execute,
    testEnvironment,
    models: [...models],
    agentConfigurationDoc,
    getConfigSchema,
  };
}
