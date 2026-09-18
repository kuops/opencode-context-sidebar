/** @jsxImportSource @opentui/solid */
import type { TuiPlugin, TuiPluginApi, TuiPluginModule } from "@opencode-ai/plugin/tui";
import { RGBA } from "@opentui/core";
import { createMemo, createSignal } from "solid-js";

const BAR_WIDTH = 28;
const INTEGER_FORMAT = new Intl.NumberFormat("en-US");

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function safeNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function formatInteger(value: number): string {
  return INTEGER_FORMAT.format(Math.max(0, Math.round(value)));
}

function ContextUsage(props: { api: TuiPluginApi; sessionID: string }) {
  const theme = () => props.api.theme.current;
  const [separatorWidth, setSeparatorWidth] = createSignal(BAR_WIDTH);
  let panel: any;
  const messages = createMemo(() => props.api.state.session.messages(props.sessionID));
  const session = createMemo(() => {
    const sessionApi = props.api.state.session as unknown as {
      get?: (sessionID: string) => unknown;
    };
    return asRecord(sessionApi.get?.(props.sessionID));
  });

  const usage = createMemo(() => {
    const list = messages();
    let last: (typeof list)[number] | undefined;
    for (let index = list.length - 1; index >= 0; index--) {
      const message = list[index];
      if (message.role !== "assistant") continue;
      const tokens = message.tokens;
      const total =
        safeNumber(tokens.input) +
        safeNumber(tokens.output) +
        safeNumber(tokens.reasoning) +
        safeNumber(tokens.cache?.read) +
        safeNumber(tokens.cache?.write);
      if (total > 0) {
        last = message;
        break;
      }
    }

    const tokens = last?.role === "assistant" ? last.tokens : undefined;
    const miss = safeNumber(tokens?.input);
    const hit = safeNumber(tokens?.cache?.read);
    const write = safeNumber(tokens?.cache?.write);
    const response = safeNumber(tokens?.output);
    const thinking = safeNumber(tokens?.reasoning);
    const input = miss + hit + write;
    const output = response + thinking;
    const total = input + output;
    const hitRate = input > 0 ? (hit / input) * 100 : 0;
    const model =
      last?.role === "assistant"
        ? props.api.state.provider.find((item) => item.id === last.providerID)?.models[last.modelID]
        : undefined;
    const contextLimit = safeNumber(model?.limit?.context);
    const contextUsage = contextLimit > 0 ? (total / contextLimit) * 100 : 0;
    const contextWidth = Math.min(
      BAR_WIDTH,
      Math.round((Math.max(0, contextUsage) / 100) * BAR_WIDTH),
    );
    const hitWidth = Math.min(BAR_WIDTH, Math.round((hit / Math.max(input, 1)) * BAR_WIDTH));
    const writeWidth = Math.min(
      BAR_WIDTH - hitWidth,
      Math.round((write / Math.max(input, 1)) * BAR_WIDTH),
    );
    const missWidth = input > 0 ? BAR_WIDTH - hitWidth - writeWidth : 0;
    return {
      total,
      input,
      hit,
      miss,
      write,
      output,
      thinking,
      response,
      hitRate,
      contextLimit,
      contextUsage,
      contextWidth,
      hitWidth,
      writeWidth,
      missWidth,
      emptyWidth: input > 0 ? 0 : BAR_WIDTH,
      cost: safeNumber(session()?.cost),
    };
  });

  const row = (
    label: string,
    value: number,
    color: RGBA,
    indent = false,
    symbol = "■",
  ) => (
    <box flexDirection="row" width="100%" paddingLeft={indent ? 2 : 0}>
      <text fg={theme().textMuted}>
        <span style={{ fg: color }}>{symbol}</span> {label}
      </text>
      <box flexGrow={1} />
      <text fg={theme().textMuted}>{formatInteger(value)}</text>
    </box>
  );
  const separator = () => "─".repeat(separatorWidth());

  return (
    <box
      ref={panel}
      gap={0}
      width="100%"
      onSizeChange={() => {
        const width = Math.max(1, panel?.width ?? BAR_WIDTH);
        setSeparatorWidth((current) => (current === width ? current : width));
      }}
    >
      <box flexDirection="row" width="100%">
        <text fg={theme().text}>
          <b>Context</b>
        </text>
        <box flexGrow={1} />
        <text fg={theme().textMuted}>Total {formatInteger(usage().total)}</text>
      </box>
      {row("Input", usage().input, theme().info, false, "↓")}
      {row("Cache hit", usage().hit, theme().success, true)}
      {row("Cache miss", usage().miss, theme().error, true)}
      {row("Cache write", usage().write, theme().warning, true)}
      <text fg={theme().border}>{separator()}</text>
      {row("Output", usage().output, theme().secondary, false, "↑")}
      {row("Thinking", usage().thinking, theme().accent, true)}
      {row("Response", usage().response, theme().textMuted, true)}
      <text fg={theme().border}>{separator()}</text>
      <box flexDirection="row" width="100%">
        <text fg={theme().textMuted}>
          <span style={{ fg: theme().success }}>↺</span> Cache hit rate
        </text>
        <box flexGrow={1} />
        <text fg={theme().success}>{usage().hitRate.toFixed(1)}%</text>
      </box>
      <text>
        <span style={{ fg: theme().success }}>{"━".repeat(usage().hitWidth)}</span>
        <span style={{ fg: theme().warning }}>{"━".repeat(usage().writeWidth)}</span>
        <span style={{ fg: theme().error }}>{"━".repeat(usage().missWidth)}</span>
        <span style={{ fg: theme().border }}>{"─".repeat(usage().emptyWidth)}</span>
      </text>
      <box flexDirection="row" gap={1}>
        <text fg={theme().textMuted}>
          <span style={{ fg: theme().success }}>■</span> Hit
        </text>
        <text fg={theme().textMuted}>
          <span style={{ fg: theme().warning }}>■</span> Write
        </text>
        <text fg={theme().textMuted}>
          <span style={{ fg: theme().error }}>■</span> Miss
        </text>
      </box>
      <text fg={theme().border}>{separator()}</text>
      <box flexDirection="row" width="100%">
        <text fg={theme().textMuted}>
          <span
            style={{
              fg:
                usage().contextUsage >= 90
                  ? theme().error
                  : usage().contextUsage >= 80
                    ? theme().warning
                    : theme().success,
            }}
          >
            ◉
          </span>{" "}
          Context usage
        </text>
        <box flexGrow={1} />
        <text
          fg={
            usage().contextUsage >= 90
              ? theme().error
              : usage().contextUsage >= 80
                ? theme().warning
                : theme().success
          }
        >
          {usage().contextLimit > 0 ? `${usage().contextUsage.toFixed(1)}%` : "--"}
        </text>
      </box>
      <text>
        <span
          style={{
            fg:
              usage().contextUsage >= 90
                ? theme().error
                : usage().contextUsage >= 80
                  ? theme().warning
                  : theme().success,
          }}
        >
          {"━".repeat(usage().contextWidth)}
        </span>
        <span style={{ fg: theme().border }}>
          {"━".repeat(BAR_WIDTH - usage().contextWidth)}
        </span>
      </text>
      <box flexDirection="row" gap={1}>
        <text fg={theme().textMuted}>
          <span style={{ fg: theme().success }}>■</span> &lt;80%
        </text>
        <text fg={theme().textMuted}>
          <span style={{ fg: theme().warning }}>■</span> 80-89%
        </text>
        <text fg={theme().textMuted}>
          <span style={{ fg: theme().error }}>■</span> ≥90%
        </text>
      </box>
      <text fg={theme().border}>{separator()}</text>
      <box flexDirection="row" width="100%">
        <text fg={theme().textMuted}>
          <span style={{ fg: theme().warning }}>$</span> Spent
        </text>
        <box flexGrow={1} />
        <text fg={theme().textMuted}>${usage().cost.toFixed(2)}</text>
      </box>
    </box>
  );
}

const tui: TuiPlugin = async (api, options) => {
  if (options?.enabled === false) return;
  api.slots.register({
    order: 100,
    slots: {
      sidebar_content(_ctx, props) {
        return <ContextUsage api={api} sessionID={props.session_id} />;
      },
    },
  });
};

const plugin: TuiPluginModule & { id: string } = {
  id: "opencode-context-sidebar-tui",
  tui,
};

export default plugin;
