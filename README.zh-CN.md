# opencode-context-sidebar

[English](README.md) | [简体中文](README.zh-CN.md)

适用于 OpenCode TUI、不依赖特定提供商的上下文用量侧边栏。

## 功能

- 显示最近一次助手调用的 token 总量
- 分别显示输入、缓存命中、缓存未命中和缓存写入用量
- 分别显示输出、思考和响应内容用量
- 显示缓存命中率和彩色分布条
- 使用绿色、黄色和红色阈值显示上下文窗口用量
- 显示会话累计费用，与 OpenCode 内置 Context 面板的行为一致
- 分隔线宽度随侧边栏可用宽度动态调整

只要提供商通过 OpenCode 标准字段报告 token 用量，此插件即可正常工作。

## 安装

通过 OpenCode 安装此包，然后在 `~/.config/opencode/tui.json` 或 `.opencode/tui.json` 中禁用内置 Context 面板：

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": ["opencode-context-sidebar"],
  "plugin_enabled": {
    "internal:sidebar-context": false
  }
}
```

修改配置后重启 OpenCode。

## 工作原理

插件使用 OpenCode 已经标准化的数据，不会直接调用各模型提供商的 API。

```text
模型提供商响应
  -> OpenCode 标准化 Token 用量
  -> 插件读取最近一条助手消息
  -> 侧边栏计算并显示用量明细
```

| 界面项目 | OpenCode 字段 | 含义 |
| --- | --- | --- |
| Cache miss | `tokens.input` | 未读取缓存、也未写入缓存的普通输入 |
| Cache hit | `tokens.cache.read` | 从缓存复用的输入 |
| Cache write | `tokens.cache.write` | 写入缓存、供后续请求使用的输入 |
| Response | `tokens.output` | 不含思考过程的模型输出 |
| Thinking | `tokens.reasoning` | 模型报告的思考 Token |

界面中的统计值按以下方式计算：

```text
Input         = Cache miss + Cache hit + Cache write
Output        = Response + Thinking
Total         = Input + Output
Context usage = Total / 模型上下文上限 * 100%
```

上下文上限来自当前模型的元数据。费用直接使用 OpenCode 累计的 `session.cost`，不同提供商的 Token 价格仍由 OpenCode 处理。由于数据来自当前会话状态，每次产生新的助手消息后，侧边栏都会随之更新。

## 开发

```bash
npm install
npm run build
```

本地加载配置：

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": ["file:///root/opencode-context-sidebar"],
  "plugin_enabled": {
    "internal:sidebar-context": false
  }
}
```

## 许可证

MIT
