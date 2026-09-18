import type { Plugin } from "@opencode-ai/plugin";

export const ContextSidebarPlugin: Plugin = async () => ({});

export default {
  id: "opencode-context-sidebar",
  server: ContextSidebarPlugin,
};
