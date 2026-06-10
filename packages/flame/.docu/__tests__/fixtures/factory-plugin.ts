import type { PluginBuilder, DocuBookPlugin } from "../../node/plugin";

export default function createPlugin(options?: Record<string, unknown>): DocuBookPlugin {
  return {
    name: (options?.name as string) || "fixture-factory",
    setup(_build: PluginBuilder) {
      // no-op
    },
  };
}
