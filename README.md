# opencode-context-sidebar

[English](README.md) | [简体中文](README.zh-CN.md)

Provider-agnostic Context Usage sidebar for OpenCode TUI.

<p align="center">
  <img src="images/opencode-context-sidebar.png" alt="Context Usage sidebar preview" width="600">
</p>

## Features

- Latest assistant call token totals
- Input, cache hit, cache miss, and cache write breakdown
- Output, thinking, and response breakdown
- Cache hit rate and colored distribution bar
- Context-window usage with green, yellow, and red thresholds
- Session cumulative cost, matching OpenCode's built-in Context behavior
- Dynamic separators that follow the available sidebar width

The plugin works with any provider that reports standard OpenCode token usage fields.

## Install

Install the package with OpenCode, then disable the built-in Context panel in `~/.config/opencode/tui.json` or `.opencode/tui.json`:

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": ["opencode-context-sidebar"],
  "plugin_enabled": {
    "internal:sidebar-context": false
  }
}
```

Restart OpenCode after changing the configuration.

## How It Works

The plugin uses data already normalized by OpenCode; it does not call provider APIs directly.

```text
Provider response
  -> OpenCode normalizes token usage
  -> Plugin reads the latest assistant message
  -> Sidebar calculates and renders the breakdown
```

| Display | OpenCode field | Meaning |
| --- | --- | --- |
| Cache miss | `tokens.input` | Regular input not read from or written to cache |
| Cache hit | `tokens.cache.read` | Input reused from cache |
| Cache write | `tokens.cache.write` | Input written to cache for later requests |
| Response | `tokens.output` | Generated output excluding reasoning |
| Thinking | `tokens.reasoning` | Reasoning tokens reported by the model |

The displayed totals are calculated as follows:

```text
Input         = Cache miss + Cache hit + Cache write
Output        = Response + Thinking
Total         = Input + Output
Context usage = Total / model context limit * 100%
```

The context limit comes from the active model metadata. The displayed cost is OpenCode's cumulative `session.cost`, so provider-specific token pricing remains OpenCode's responsibility. Because the values are derived from the current session state, the sidebar updates as new assistant messages arrive.

## Development

```bash
npm install
npm run build
```

For local loading:

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": ["file:///root/opencode-context-sidebar"],
  "plugin_enabled": {
    "internal:sidebar-context": false
  }
}
```

## License

MIT
