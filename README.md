# agentWord

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**agentWord** 是一款本地桌面应用，用俯视「AI 工作园区」的游戏化界面展示本机 Claude / Codex 等 coding agent 的工作状态、任务流与会话概况。

> 第一版目标：可感知、可观看、可交互 —— 而不是传统监控后台。

## 功能概览

- **俯视场景**：Pixi.js 渲染的园区地图，agent / subagent 以角色形式在房间间移动
- **任务看板**：Kanban 视图与场景联动，展示进行中、阻塞、已完成等状态
- **本机监控**：识别 Codex / Claude 相关进程与会话数量（进程级，不读终端正文）
- **演示模式**：内置模拟数据流，无真实 agent 时也能体验完整动线
- **本地持久化**：偏好与快照通过 SQLite 保存在本机

## 隐私边界

- 不读取终端输出或命令正文
- 不远程上报用户数据
- 不自动控制 Claude / Codex 进程

详见 [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) 中的隐私说明。

## 技术栈

| 层 | 技术 |
| --- | --- |
| 桌面壳 | [Tauri 2](https://v2.tauri.app/) |
| 前端 | React 19 + TypeScript + Vite |
| 渲染 | Pixi.js 8 |
| 状态 | Zustand |
| 后端 | Rust（进程扫描、SQLite） |

## 环境要求

- macOS（当前主要开发与打包目标）
- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/)
- [Rust](https://www.rust-lang.org/tools/install)（`rustup` 推荐）
- Tauri 系统依赖：见 [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)

## 快速开始

```bash
git clone https://github.com/nomadZyt/agentWord.git
cd agentWord
pnpm install
pnpm tauri dev
```

仅启动 Web 前端（浏览器调试，部分 Tauri API 不可用）：

```bash
pnpm dev
```

构建桌面应用：

```bash
pnpm tauri build
```

其他脚本：

```bash
pnpm typecheck          # TypeScript 检查
pnpm build              # 前端产物 -> dist/
pnpm asset:quality      # 素材质量报告
```

## 项目结构

```
agentWord/
├── src/                 # React 前端（场景、看板、监控 UI）
├── src-tauri/           # Tauri / Rust 后端
├── assets/              # 场景、角色精灵图与配置
├── docs/                # 设计与任务文档（符号链接到根目录部分文档）
└── scripts/             # 素材与 QA 辅助脚本
```

设计文档入口：[IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)、[MVP_SCREEN_SPEC.md](./MVP_SCREEN_SPEC.md)、[ASSET_SPEC.md](./ASSET_SPEC.md)。

## 参与贡献

欢迎 Issue 与 Pull Request。请先阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 许可证

本项目采用 [MIT License](./LICENSE) 开源。
