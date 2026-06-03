# agentWord Implementation Plan

Last updated: 2026-06-01

## 1. 项目定位

agentWord 是一个本地桌面应用，用游戏化方式展示本机 Claude / Codex agent 的工作状态、任务流和会话数量。

第一版目标不是做完整监控后台，而是先做出一个可感知、可观看、可交互的俯视管理游戏场景：

- 主体验：像一个温暖的 AI 工作园区，agent 和 subagent 以角色形式在不同房间之间移动。
- 核心画面：俯视地图、房间、走廊、工位、任务看板、状态气泡、警报区域、完成归档区。
- 数据策略：模拟数据驱动游戏体验，同时接入少量真实本机信号。
- 真实监控范围：第一版只做 Codex / Claude 进程级识别、会话数量统计、CLI / App 粗分类。
- 隐私边界：第一版不读取终端正文，不采集敏感命令内容，不自动控制 Claude / Codex。

MVP 成功标准：

- 打开应用后，第一眼像一个正在运行的俯视管理游戏，而不是普通仪表盘。
- 用户能看到 agent 正在处理哪些任务、哪些任务阻塞、哪些任务完成。
- 本机启动或关闭 Claude / Codex 相关进程后，应用中的真实会话数量可以刷新。
- 任务看板和游戏场景可以互相联动。

## 2. 视觉参考与素材准备

### 2.1 视觉方向

第一版视觉方向采用温暖、可爱、俯视管理游戏风格。参考重点是：

- 场景以园区 / 工作室 / 房间为主体。
- 角色是可爱小型工作者，有明确职责和状态。
- 房间之间用路径连接，agent 可以在房间之间移动。
- 阻塞、等待、完成等状态用清晰的区域和气泡表达。
- 整体氛围偏轻松、明亮、亲和，避免军事化或压迫感。

视觉参考图路径：

- 场景参考：`/Users/user/Library/Containers/com.bytedance.macos.feishu/Data/Library/Application Support/LarkShell/sdk_storage/447e4fa78a752495a88bfe318cf7c676/resources/images/img_v3_02124_77307329-e154-4617-9a9b-527eb2c13bfg.jpg`
- 团队参考 A：`/Users/user/Library/Containers/com.bytedance.macos.feishu/Data/Library/Application Support/LarkShell/sdk_storage/447e4fa78a752495a88bfe318cf7c676/resources/images/img_v3_02124_0142f194-8bce-4fe0-b0a5-0a34fb5c591g.jpg`
- 团队参考 B：`/Users/user/Library/Containers/com.bytedance.macos.feishu/Data/Library/Application Support/LarkShell/sdk_storage/447e4fa78a752495a88bfe318cf7c676/resources/images/img_v3_02124_032a4286-e198-46a2-938f-cf049fe4aeag.jpg`
- 团队参考 C：`/Users/user/Library/Containers/com.bytedance.macos.feishu/Data/Library/Application Support/LarkShell/sdk_storage/447e4fa78a752495a88bfe318cf7c676/resources/images/img_v3_02124_59498b76-7be4-4621-90e3-44d9a678990g.jpg`

这些图片只作为风格参考，不直接复制、不嵌入、不作为最终商业素材。完整素材规范见 `ASSET_SPEC.md`。

### 2.2 第一批素材清单

地图素材：

- 地板、草地、墙体、门、窗、栅栏、路径、花坛、水池。
- 办公桌、电脑、任务公告板、服务器柜、验证台、归档柜。
- 阻塞警报区、安全线、警示牌、等待座位、休息角。

房间素材：

- 入口队列：新任务进入的位置。
- 规划室：agent 分析任务和拆解子任务。
- 执行室：agent / subagent 正在工作。
- 验证室：运行测试、检查产物、确认结果。
- 阻塞处理室：等待用户、权限失败、依赖缺失。
- 归档室：完成任务、保存结果、沉淀记录。

角色素材：

- Codex agent：主要执行者，可使用偏蓝或深色工作服。
- Claude agent：协作执行者，可使用偏紫或暖色标识。
- subagent：体型更小，跟随主 agent 或在执行室内工作。
- 系统观察者：负责监控进程和状态，可以是拿放大镜或剪贴板的角色。
- 原创猫咪团队：白猫、黑毛猫、奶茶猫、中国风猫、日本风猫和 mini subagent，作为品牌化主角团队。

状态素材：

- 空闲：坐在工位或休息区。
- 规划中：在规划室看任务板。
- 执行中：在电脑前工作。
- 验证中：在验证室检查。
- 阻塞：前往警报区，头顶显示等待或警告气泡。
- 完成：移动到归档室，任务卡进入完成列。

UI 素材：

- 任务卡片图标、agent 头像、状态徽章、进度条、筛选图标。
- 事件日志图标：新任务、状态变更、进程发现、阻塞、完成。
- 地图交互图标：放大、缩小、居中、跟随选中 agent。

## 3. 技术栈

推荐技术栈：

- 桌面应用：Tauri 2。
- 本地采集层：Rust sidecar / Tauri commands。
- 前端框架：React + TypeScript + Vite。
- 游戏场景：PixiJS。
- 状态管理：Zustand。
- 看板拖拽：dnd-kit。
- 本地数据库：SQLite。
- 图标：lucide-react。
- 图表：ECharts 或 Recharts，第一版可延后。

选择理由：

- Tauri 适合本地桌面工具，体积轻，Rust 侧更适合进程扫描和文件监听。
- React 适合任务看板、详情面板、设置页等管理界面。
- PixiJS 适合 2D 俯视场景、角色动画、地图拖拽和缩放。
- Zustand 足够轻量，适合管理 agent、任务、事件和 UI 选中状态。
- SQLite 可以保存任务、事件、会话快照和用户设置。

## 4. 阶段任务拆分

### 阶段 1：前期定义与素材准备

- T1.1 定义场景名称、房间类型、agent 类型、任务状态、事件日志文案。
- T1.2 确定主界面布局：俯视场景 + 任务看板 + 详情面板。
- T1.3 基于参考图整理视觉规范：色板、线条、角色比例、房间比例。
- T1.4 生成或绘制第一批 tileset、角色 sprites、状态气泡和任务图标。
- T1.5 准备模拟数据：10-20 条任务、3-6 个 agent、若干 subagent、事件日志样例。

### 阶段 2：交互与视觉原型

- T2.1 制作低保真线框：首屏、任务详情、agent 详情、设置页。
- T2.2 定义场景规则：房间位置、agent 移动路径、状态到房间的映射。
- T2.3 定义交互规则：点击 agent、点击任务、点击房间、悬浮提示、筛选。
- T2.4 明确地图比例：tile 尺寸、角色尺寸、可视区域、缩放范围。
- T2.5 验收原型：首屏必须像可运行的管理游戏，不像普通监控后台。

### 阶段 3：项目骨架

- T3.1 初始化 Tauri 2 + React + TypeScript + Vite 项目。
- T3.2 安装 PixiJS、Zustand、SQLite、dnd-kit、lucide-react。
- T3.3 建立核心目录：`src/scene`、`src/kanban`、`src/monitor`、`src/store`、`src/types`。
- T3.4 配置开发脚本：前端启动、Tauri 启动、类型检查、构建。
- T3.5 建立基础主题：颜色、字体、间距、按钮、面板、状态徽章。

### 阶段 4：核心数据模型

- T4.1 定义 `AgentSession`：来源、类型、状态、PID、当前任务、最后活跃时间。
- T4.2 定义 `TaskCard`：标题、状态、进度、负责人、详情、事件。
- T4.3 定义 `MapEntity`：地图对象、房间、坐标、关联 agent。
- T4.4 定义 `SceneEvent`：事件类型、触发者、任务、消息、时间。
- T4.5 实现模拟数据生成器，周期性产生任务流、状态变化和 agent 移动事件。

### 阶段 5：游戏场景开发

- T5.1 渲染俯视地图：房间、走廊、地板、墙体、工位和警报区。
- T5.2 渲染 agent：不同来源和状态使用不同颜色、图标和气泡。
- T5.3 实现移动动画：agent 根据任务状态在房间之间移动。
- T5.4 实现场景交互：缩放、拖拽、点击 agent、点击房间、悬浮提示。
- T5.5 接入事件动画：新任务闪烁、阻塞警报、完成归档动效。

### 阶段 6：任务看板开发

- T6.1 建立看板列：队列中、规划中、执行中、验证中、阻塞、完成。
- T6.2 渲染任务卡片：标题、状态、进度、agent、最近事件。
- T6.3 实现任务详情：描述、关联 agent / subagent、事件时间线、文件 / 命令摘要占位。
- T6.4 打通场景联动：选中任务时，高亮地图中的 agent 和房间。
- T6.5 支持基础筛选：来源、状态、agent、是否阻塞。

### 阶段 7：本地监控接入

- T7.1 Rust 侧实现进程扫描，识别 Codex App、Codex app-server、Codex CLI、Claude CLI。
- T7.2 建立采集接口，周期性返回会话数量、PID、父子进程关系、启动时间。
- T7.3 将真实进程映射到 `AgentSession`，并标记为 `real` 数据来源。
- T7.4 前端展示真实检测到的会话数和模拟 agent 数。
- T7.5 增加权限说明，未读取终端内容时显示基础监控模式。

### 阶段 8：持久化与设置

- T8.1 SQLite 保存任务、agent 快照、事件日志和用户设置。
- T8.2 设置页支持开关：模拟数据、进程监控、刷新频率、隐私模式。
- T8.3 应用重启后恢复任务看板和最近事件。
- T8.4 限制日志规模，避免本地数据库无限增长。

### 阶段 9：测试与验收

- T9.1 单元测试：数据模型、状态流转、模拟数据生成、进程解析。
- T9.2 组件测试：看板列、任务卡片、详情面板、筛选逻辑。
- T9.3 场景验收：地图非空、角色可见、动画运行、点击 / 缩放 / 拖拽正常。
- T9.4 集成验收：启动 / 关闭 Codex 或 Claude 后，会话数量能刷新。
- T9.5 性能验收：30 个 agent、100 个任务下交互不卡顿。

### 阶段 10：后续增强

- E10.1 接入 Codex / Claude 本地日志，只读取用户明确授权的摘要信息。
- E10.2 识别 subagent 更细状态：工具调用、等待输入、执行命令、报错。
- E10.3 增加回放模式，按时间线重播一天内 agent 工作流。
- E10.4 增加房间建设 / 升级，任务越多，场景里自动扩展工位和区域。
- E10.5 增加通知系统，长时间阻塞、失败、无人处理时提醒。

## 5. MVP 数据模型

### AgentSession

```ts
type AgentSource = "codex" | "claude" | "simulated";
type AgentAppType = "app" | "cli" | "subagent" | "unknown";
type AgentStatus = "idle" | "planning" | "running" | "verifying" | "blocked" | "done";

interface AgentSession {
  id: string;
  source: AgentSource;
  appType: AgentAppType;
  status: AgentStatus;
  pid?: number;
  parentPid?: number;
  currentTaskId?: string;
  displayName: string;
  lastSeenAt: string;
  isReal: boolean;
}
```

### TaskCard

```ts
type TaskStatus = "queued" | "planning" | "running" | "verifying" | "blocked" | "done";

interface TaskCard {
  id: string;
  title: string;
  status: TaskStatus;
  progress: number;
  assigneeAgentId?: string;
  subagentIds: string[];
  details: string;
  eventIds: string[];
  createdAt: string;
  updatedAt: string;
}
```

### MapEntity

```ts
interface MapEntity {
  id: string;
  type: "agent" | "room" | "task" | "decoration" | "alert";
  roomId?: string;
  linkedAgentId?: string;
  linkedTaskId?: string;
  position: { x: number; y: number };
  state: string;
}
```

### SceneEvent

```ts
interface SceneEvent {
  id: string;
  type: "task_created" | "status_changed" | "agent_seen" | "blocked" | "completed";
  actorId?: string;
  taskId?: string;
  message: string;
  createdAt: string;
}
```

## 6. 测试与验收

功能验收：

- 应用启动后可以看到俯视地图、房间、角色、状态气泡和任务看板。
- 模拟任务会自动流转，agent 会跟随任务状态移动。
- 点击任务能高亮对应 agent，点击 agent 能看到当前任务和状态。
- 看板可以展示任务详情、事件时间线、关联 agent / subagent。
- 真实进程监控可以统计 Codex / Claude 相关进程数量。

视觉验收：

- 首屏具有明确的游戏场景感。
- 房间、路径、角色和警报区一眼可识别。
- 看板不遮挡主要游戏场景。
- 颜色温暖但不影响状态辨识。

隐私验收：

- 未授权时不读取终端正文。
- 第一版不展示真实命令内容。
- 真实监控状态明确标注为进程级基础监控。

性能验收：

- 30 个 agent 和 100 个任务时，拖拽、缩放、点击仍流畅。
- 进程扫描不造成明显 CPU 占用。
- 事件日志有保留上限，数据库不会无限增长。

## 7. 后续增强

- 精准读取 Codex / Claude 会话摘要。
- 支持 subagent 真实识别和任务层级展示。
- 支持从任务看板发起本地自动化流程。
- 支持历史回放和工作日报。
- 支持多工作区、多项目和多 agent 群组。
- 支持更完整的房间建设系统，让用户能扩建 AI 工作园区。

## 8. 决策记录

- 2026-05-29：创建 `agentWord` 文件夹。
- 2026-05-29：确定第一版优先游戏场景体验。
- 2026-05-29：确定数据策略为模拟数据 + 少量真实进程信号。
- 2026-05-29：确定视觉方向为温暖、可爱、俯视管理游戏场景。
- 2026-05-29：确定第一版只保存计划文档，后续再创建真实项目代码。
- 2026-05-29：新增 `ASSET_SPEC.md`，落地场景、agent 团队、原创猫咪团队和动作素材规范。
- 2026-05-29：新增 `TASKS.md`，将计划拆成当前冲刺、可玩原型、监控接入和素材 backlog。
- 2026-05-29：创建 `docs/` 目录，并用相对符号链接暴露三份核心文档。
- 2026-05-29：新增 `MVP_SCREEN_SPEC.md`，完成首屏信息架构、默认地图视角、看板列、选中态和空状态定义。
- 2026-05-29：新增 `ASSET_PRODUCTION_LIST.md`，锁定第一批场景、角色、动作、提示词和输出目录。
- 2026-05-29：新增 `FIRST_SCREEN_WIREFRAME.md` 和 `VISUAL_PROTOTYPE_REVIEW.md`，完成 A4 视觉原型准备。
- 2026-05-29：修正 `TASKS.md` Immediate Next Actions，明确先补齐可交互背景、热点 JSON 和首套动作素材，再进入 B1 项目骨架。
- 2026-05-29：新增 `ASSET_PIPELINE_VALIDATION.md`，完成底图和场景 JSON，跑通白猫动作 spritesheet 流程，但因边缘和裁切质量暂缓扩展其他角色。
- 2026-05-29：完成 `white-bow-cat-pm_idle_refined.png` 逐动作返工验证，并将下一步更新为 `walk_down`。
- 2026-05-29：完成 `white-bow-cat-pm_walk_down_refined.png` 逐动作返工验证，并将下一步更新为 `walk_up`。
- 2026-05-29：完成 `white-bow-cat-pm_walk_up_refined.png` 逐动作返工验证，并将下一步更新为 `walk_left`。
- 2026-05-29：完成 `white-bow-cat-pm_walk_left_refined.png` 逐动作返工验证，并将下一步更新为 `walk_right`。
- 2026-05-29：完成 `white-bow-cat-pm_walk_right_refined.png` 和基础 movement spritesheet，并将下一步更新为 `planning`。
- 2026-05-29：完成 `white-bow-cat-pm_planning_refined.png` 逐动作返工验证，并将下一步更新为 `working`。
- 2026-05-30：完成 `white-bow-cat-pm_working_refined.png` 逐动作返工验证，并将下一步更新为 `verifying`。
- 2026-05-30：完成 `white-bow-cat-pm_verifying_refined.png` 逐动作返工验证，并将下一步更新为 `blocked`。
- 2026-05-30：完成 `white-bow-cat-pm_blocked_refined.png` 逐动作返工验证，并将下一步更新为 `done`。
- 2026-05-30：完成 `white-bow-cat-pm_done_refined.png` 和完整 MVP spritesheet，并将下一步更新为 `beaver-builder_idle`。
- 2026-05-30：完成 `beaver-builder_idle_refined.png` 逐动作返工验证，并将下一步更新为 `beaver-builder_walk_down`。
- 2026-05-30：完成 `beaver-builder_walk_down_refined.png` 逐动作返工验证，并将下一步更新为 `beaver-builder_walk_up`。
- 2026-05-30：完成 `beaver-builder_walk_up_refined.png` 逐动作返工验证，并将下一步更新为 `beaver-builder_walk_left`。
- 2026-05-30：完成 `beaver-builder_walk_left_refined.png` 逐动作返工验证，并将下一步更新为 `beaver-builder_walk_right`。
- 2026-05-30：完成 `beaver-builder_walk_right_refined.png` 和基础 movement spritesheet，并将下一步更新为任务状态动作整合。
- 2026-05-30：完成 `beaver-builder_planning/working/verifying/blocked/done_refined.png` 和完整 MVP spritesheet，并将下一步更新为 `mini-cat-subagent_idle`。
- 2026-05-30：完成 `mini-cat-subagent_idle_refined.png` 逐动作返工验证，并将下一步更新为 mini subagent 剩余动作并行验收。
- 2026-05-31：完成 `mini-cat-subagent_movement/carry_task/working/done` 和完整 MVP spritesheet，三角色 MVP 素材闭环完成，并将下一步更新为 B1 项目骨架。
- 2026-05-31：进入 B1，完成 React + TypeScript + Vite + PixiJS 浏览器骨架，接入园区底图、3 个 MVP 角色 spritesheet、任务看板、详情面板和基础监控面板；Tauri 2 Rust shell 因本机未发现 `cargo` / `rustc` 暂列为环境阻塞。
- 2026-05-31：安装 Rust / Cargo toolchain，验证 `cargo 1.96.0` 与 `rustc 1.96.0` 可用；生成 `src-tauri`，并通过 `cargo check --manifest-path src-tauri/Cargo.toml` 验证 Tauri/Rust 侧可编译。
- 2026-05-31：修正 `package.json` 的 `tauri` 脚本为标准透传命令，运行 `pnpm tauri dev`，验证 Tauri 能启动 `agentWord` 桌面窗口。
- 2026-05-31：进入 B3，完成 PixiJS viewport 拖拽、滚轮 / 按钮缩放、复位视角、agent / 房间点击聚焦和选中高亮，并输出桌面窗口 QA 截图 `assets/review/app/agentword_b3_viewport_qa.png`。
- 2026-05-31：完成 B3.3 动态位置映射，新增 `sceneLayout` 将 `TaskStatus -> roomId -> spawnPoint` 统一给 store 和 PixiJS 使用；同时接入 spritesheet 多帧播放，输出 QA 截图 `assets/review/app/agentword_c1_animation_mapping_qa.png`。
- 2026-05-31：完成 C1.1 / C1.2，新增 demo flow 周期推进任务状态，agent 会在房间之间平滑移动，移动中切换四方向 walk 动作，停下后播放对应任务状态动作；输出 QA 截图 `assets/review/app/agentword_c1_movement_qa.png`。
- 2026-05-31：完成 C1 渲染结构优化，将 PixiJS app、world、纹理和 agent sprite 持久化，任务流变化时只更新 sprite 目标位置、状态动作和选中态；输出 QA 截图 `assets/review/app/agentword_persistent_pixi_qa.png`。
- 2026-05-31：完成 C1.3 事件视觉反馈，demo flow 会产生 `task_created`、`blocked`、`completed` 事件，地图对应位置显示新任务、阻塞和完成反馈；输出 QA 截图 `assets/review/app/agentword_c1_event_feedback_qa.png`。
- 2026-05-31：完成 B2.3，将模拟任务从 7 条扩展到 17 条，并让 demo flow 自动遍历完整任务池，覆盖队列、规划、执行、验证、阻塞、完成六类状态。
- 2026-05-31：完成 B2.5 / B4.5 任务看板筛选，Zustand store 增加状态、agent、阻塞筛选条件；看板支持筛选、清除筛选和空状态；输出 QA 截图 `assets/review/app/agentword_b4_filters_qa.png`。
- 2026-05-31：完成 C2.1-C2.4 进程级监控，Rust 侧通过 `ps` 扫描 Codex / Claude 相关进程，前端展示真实进程数量、Codex / Claude 分类和 PID 摘要；不读取终端正文或完整命令内容；输出 QA 截图 `assets/review/app/agentword_c2_process_scan_qa.png`。
- 2026-05-31：完成 C2.5，将真实 Codex / Claude 进程映射为只读 `AgentSession`，进入 agent 列表、筛选入口和地图监控墙；输出 QA 截图 `assets/review/app/agentword_c2_real_agents_qa.png`。
- 2026-05-31：完成 C1.4 subagent 生成和回收动画，demo flow 增加 `subagent_spawned` / `subagent_recycled` 事件，PixiJS 地图会显示 mini subagent 路线角色；输出 QA 截图 `assets/review/app/agentword_c1_subagent_route_qa.png`。
- 2026-05-31：进入 C3，先用 `localStorage` 完成偏好持久化前置层，保存地图视角、看板筛选、模拟流开关、进程监控开关、刷新频率、隐私模式和事件日志上限；SQLite 仍作为后续任务 / agent / 事件快照层；输出 QA 截图 `assets/review/app/agentword_c3_preferences_qa.png`。
- 2026-05-31：完成 C3 SQLite 快照层，Rust 侧创建 `agentword.sqlite3` 和 `agent_world_snapshots` 单行表，前端保存任务、事件、选中态和非真实 agent 场景快照；真实进程不长期复用旧 PID，重启后继续由扫描命令刷新；输出 QA 截图 `assets/review/app/agentword_c3_sqlite_snapshot_qa.png`、`assets/review/app/agentword_c3_sqlite_restore_qa.png`。
- 2026-05-31：完成 C2.8 / C2.9，真实 Codex / Claude 进程新增窗口、工作区、任务来源短标签；前端增加 `live / stale / gone` presence 生命周期，消失的真实会话会先退场再移除，地图上同步降低透明度并改变色调；不读取终端正文、不展示完整命令或完整路径；输出 QA 截图 `assets/review/app/agentword_c2_sources_presence_qa.png`。
- 2026-05-31：完成 C2.11，左侧真实会话行可点击并与右侧详情面板联动；选中真实会话时优先展示 Session 详情，包括窗口、工作区、任务来源、PID、presence 和最近发现；隐私模式下隐藏 PID、窗口、工作区和任务来源标签；输出 QA 截图 `assets/review/app/agentword_c2_session_detail_qa.png`。
- 2026-05-31：完成 C2.12 / C2.13，真实 Session 详情增加候选任务推荐区，基于工作区、任务来源、Codex / Claude 关键词和监控类任务权重排序；候选任务只用于查看，不自动绑定归属；地图真实 agent、左侧 process 行和右侧 Session 定位按钮统一走 `agentFocusRequest`，保持选中态和地图聚焦同步；输出 QA 截图 `assets/review/app/agentword_c2_recommendation_sync_qa.png`。
- 2026-05-31：完成 D 阶段素材 backlog，使用模型生成 atlas 并本地切图去底，产出第一批 tile、家具、动物团队立绘、原创猫咪团队立绘、4 个新增主角色 MVP proxy spritesheet，以及 6 个主角色进阶动作 spritesheet；总 manifest 为 `assets/d_stage_manifest.json`，D 阶段预览位于 `assets/review/d/`。
- 2026-06-01：完成 E1.1，将 D 阶段 tile / prop manifest 接入 PixiJS 静态装饰层，新增 `assets/scene/decorations/scene_decorations.json` 管理摆放位置；桌面 QA 截图为 `assets/review/app/agentword_e1_decoration_layer_qa.png`。
- 2026-06-01：完成 E1.2，新增 `sceneDensityMode` 偏好和 `readability` 阵容模式，左侧「阵容」开关可将 6 个主角色 + mini subagent 摆到同屏验证布局；QA 截图为 `assets/review/app/agentword_e1_2_density_mode_qa.png`。
- 2026-06-01：完成 E1.3，注册 6 个主角色 advanced spritesheet，并让 demo flow 触发 `handoff`、`summon_subagent`、`merge_result` 事件；PixiJS 会对事件 actor 播放短时进阶动作覆盖，QA 截图为 `assets/review/app/agentword_e1_3_advanced_actions_qa.png`。
- 2026-06-01：完成 E1.4，新增 `pnpm asset:quality` 自动生成 D 阶段素材透明边缘检查和 64px / 96px 批量缩放报告；当前检查 41 个 manifest 资产，34 个透明素材通过、7 个 tile 仅报告、失败 0。
- 2026-06-01：完成 E1.5，将 `sceneDensityMode` 扩展为 `stress12` / `stress24` / `stress30`，用于 12 / 24 / 30 agent 场景压力档位；压力 agent 为场景层复制体，不写回任务和真实进程数据，QA 截图为 `assets/review/app/agentword_e1_5_density_tiers_qa.png`。
- 2026-06-01：完成 E1.6，真实 Codex / Claude 进程扫描会根据新增、恢复、来源变化和退场生成进阶动作事件；新会话 / 来源变化触发 `handoff`，Codex app-server 触发 `summon_subagent`，退场触发 `merge_result`，事件文案继续遵守隐私边界。
- 2026-06-01：完成 E1.7，任务详情和真实 Session 详情新增「地图动作」追踪块，展示事件类型、时间、actor 和对应地图反馈；真实会话 actor 显示会剥离 PID，QA 截图为 `assets/review/app/agentword_e1_7_map_action_trace_qa.png`。
- 2026-06-01：完成 E1.8，`stress30` 模式新增 PixiJS 轻量性能 chip，每约 1.2s 采样 FPS、平均 frame ms、sprite 数和效果数量；QA 截图为 `assets/review/app/agentword_e1_8_perf_sample_qa.png`。
- 2026-06-01：完成 E1.9，真实 agent 生命周期事件抽为 `realAgentEventRules.ts` 规则预设，并新增 `realAgentEventRuleMode` 偏好；左侧监控面板可切换默认、安静和协作+ 事件语义。
- 2026-06-01：完成 E1.10，真实 Session 详情候选任务支持手动绑定 / 解绑；绑定会写入任务 assignee 和真实 agent `currentTaskId`，让真实 Codex / Claude 会话进入看板和地图任务流。
- 2026-06-01：完成 E1.11，新增统一 `focusSceneEvent` 与房间聚焦请求；全局事件流和「地图动作」卡片可点击定位 actor / 房间，形成事件到地图反馈的闭环。
- 2026-06-02：完成迁移前验收与可运行版本打包，`pnpm tauri build` 产出 `agentWord.app` 和 `agentWord_0.1.0_aarch64.dmg`；迁移源码时应排除 `node_modules/`、`dist/`、`src-tauri/target/`，可运行包单独分发。
- 2026-06-02：根据真实体验反馈，将默认启动改为真实优先模式；演示 agent / 演示任务需要手动点击「模拟流」开启，左侧统计改为区分「演示」和「进程」，避免把进程级扫描误读为真实 agent 工作数。
