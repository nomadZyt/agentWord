# agentWord Task Board

Last updated: 2026-06-02

Status legend:

- `[ ]` Not started
- `[~]` In progress
- `[x]` Done
- `[!]` Blocked

Priority legend:

- `P0` Required for MVP direction
- `P1` Required for first playable prototype
- `P2` Useful after prototype

## Current Sprint: 第一版可玩原型与动态场景

目标：让应用第一屏保持“像游戏一样活着”，同时继续补齐看板筛选和本机基础监控。

### A1. 项目任务入口

- `[x]` `P0` A1.1 创建项目目录 `/Users/user/PersonalSpace/macMini/ideas/agentWord`。
- `[x]` `P0` A1.2 保存主计划到 `IMPLEMENTATION_PLAN.md`。
- `[x]` `P0` A1.3 保存素材规范到 `ASSET_SPEC.md`。
- `[x]` `P0` A1.4 创建任务看板文档 `TASKS.md`。
- `[x]` `P1` A1.5 创建 `docs/` 目录，并链接核心文档供后续代码项目沿用。

Acceptance:

- 三份文档存在并能作为后续执行入口。
- `IMPLEMENTATION_PLAN.md` 负责方向，`ASSET_SPEC.md` 负责素材标准，`TASKS.md` 负责任务推进。

### A2. MVP 首屏定义

- `[x]` `P0` A2.1 定义首屏信息架构：主场景、任务看板、详情面板、事件流的位置。
- `[x]` `P0` A2.2 定义首屏默认视角：园区地图默认展示哪些房间和 agent。
- `[x]` `P0` A2.3 定义右侧任务看板列：队列中、规划中、执行中、验证中、阻塞、完成。
- `[x]` `P0` A2.4 定义选中态：点击任务如何高亮地图里的 agent / 房间。
- `[x]` `P1` A2.5 定义空状态和基础监控模式提示。

Acceptance:

- 可以用一段文字或低保真草图说明用户打开应用第一眼看到什么。
- 不需要实现代码，但需要足够指导前端布局。
- 首屏规格见 `MVP_SCREEN_SPEC.md`。

### A3. 第一批素材生产清单

- `[x]` `P0` A3.1 从 `ASSET_SPEC.md` 确认第一批必须生成的场景资产。
- `[x]` `P0` A3.2 确认第一批角色数量：动物 agent 团队和原创猫咪团队各选哪些角色进 MVP。
- `[x]` `P0` A3.3 确认每个 MVP 角色必须包含的动作：idle、walk、planning、working、verifying、blocked、done。
- `[x]` `P1` A3.4 为每个角色写生成提示词和负面约束。
- `[x]` `P1` A3.5 定义 spritesheet 文件名和输出目录。

Acceptance:

- 素材生成前，已经明确要生成哪些图、每张图做什么、输出到哪里。
- 猫咪团队使用原创 kawaii cat agent team，不使用受保护 IP 名称或完整外观组合。
- 第一批素材生产清单见 `ASSET_PRODUCTION_LIST.md`。

### A4. 视觉原型准备

- `[x]` `P0` A4.1 输出一版文字版首屏 wireframe。
- `[x]` `P1` A4.2 生成或绘制第一张园区概念图。
- `[x]` `P1` A4.3 生成或绘制第一组 agent 团队立绘。
- `[x]` `P1` A4.4 生成或绘制第一组原创猫咪团队立绘。
- `[x]` `P1` A4.5 评估角色缩小到 64-96px 后是否仍然可识别。

Acceptance:

- 场景、动物 agent 团队、原创猫咪团队三类素材方向都可见。
- 通过视觉检查后，再制作动作 spritesheet。
- 首屏 wireframe 见 `FIRST_SCREEN_WIREFRAME.md`。
- 视觉原型评估见 `VISUAL_PROTOTYPE_REVIEW.md`。

## Next Sprint: 第一版可玩原型

目标：进入代码，但只做静态数据驱动的可玩场景，不急着做真实监控。

### B1. 项目骨架

- `[x]` `P0` B1.1 初始化 Tauri 2 + React + TypeScript + Vite 项目。
  - `[x]` B1.1a React + TypeScript + Vite 浏览器骨架已创建。
  - `[x]` B1.1b Tauri 2 Rust shell 已生成：`src-tauri`。
- `[x]` `P0` B1.2 安装 PixiJS、Zustand、dnd-kit、lucide-react。
- `[x]` `P1` B1.3 建立目录：`src/scene`、`src/kanban`、`src/store`、`src/types`、`src/monitor`。
- `[x]` `P1` B1.4 配置基础主题：颜色、字体、间距、面板、状态徽章。
- `[x]` `P1` B1.5 添加开发脚本：前端启动、Tauri 启动、类型检查、构建。
- `[x]` `P0` B1.6 安装或确认 Rust / Cargo 后，运行 Tauri 2 初始化并生成 `src-tauri`。
- `[x]` `P0` B1.7 运行 `pnpm tauri dev`，完成桌面窗口级启动验证。

Acceptance:

- 本地能启动浏览器开发预览：`http://127.0.0.1:5173/`。
- `pnpm build` 已通过，园区底图和 3 个 MVP 角色 spritesheet 已进入构建产物。
- `cargo check --manifest-path src-tauri/Cargo.toml` 已通过，Rust / Tauri 侧能编译。
- 首屏有基本布局容器：左侧基础监控和事件流，中间 PixiJS 场景，右侧任务看板和详情。
- 桌面应用壳已生成，`pnpm tauri dev` 已能打开 `agentWord` 窗口。

### B2. 静态数据模型

- `[x]` `P0` B2.1 定义 `AgentSession`、`TaskCard`、`MapEntity`、`SceneEvent`。
- `[x]` `P0` B2.2 写 3-6 个模拟 agent。当前已有 8 个演示 agent：6 个主角色、1 个 mini subagent 和 1 个 monitor wall。
- `[x]` `P0` B2.3 写 10-20 条模拟任务。当前已有 17 条任务样例，覆盖队列、规划、执行、验证、阻塞、完成。
- `[x]` `P1` B2.4 写事件时间线样例。
- `[x]` `P1` B2.5 建立 Zustand store，支持选择任务、选择 agent、筛选状态。当前已支持任务 / agent / 房间选中，并接入状态、agent、阻塞筛选状态。

Acceptance:

- 看板和场景可以从同一份模拟数据读取状态。
- 任务和 agent 的关联关系清楚。

### B3. 游戏场景原型

- `[x]` `P0` B3.1 用 PixiJS 渲染园区背景或临时占位地图。Tauri 窗口 QA 已确认园区底图可见。
- `[x]` `P0` B3.2 渲染 agent 占位角色。已接入 3 个 MVP spritesheet 并在桌面窗口可见。
- `[x]` `P0` B3.3 按任务状态把 agent 放到对应房间。已实现 `TaskStatus -> roomId -> spawnPoint` 动态映射，并按房间占用做偏移。
- `[x]` `P1` B3.4 实现场景拖拽和缩放。已支持拖拽、滚轮缩放、按钮缩放和复位视角。
- `[x]` `P1` B3.5 实现 agent 点击、房间点击、悬浮提示。已支持 agent / 房间点击、视角聚焦、选中高亮和原生 title。
- `[x]` `P1` B3.6 桌面窗口视觉 QA：`assets/review/app/agentword_b3_viewport_qa.png`。
- `[x]` `P1` B3.7 动态位置与动作播放 QA：`assets/review/app/agentword_c1_animation_mapping_qa.png`。

Acceptance:

- 应用第一屏已经有可交互游戏地图。
- 即使用占位素材，也能看出任务和 agent 的空间关系。
- 拖拽 / 缩放后，房间热点层跟随 PixiJS viewport，不与地图错位。

### B4. 任务看板原型

- `[x]` `P0` B4.1 渲染 6 列任务看板。
- `[x]` `P0` B4.2 渲染任务卡片：标题、状态、进度、agent、最近事件。
- `[x]` `P1` B4.3 渲染任务详情面板。
- `[x]` `P1` B4.4 选中任务后高亮地图上的 agent。当前已联动选中 agent / 房间，并显示 PixiJS 高亮环。
- `[x]` `P1` B4.5 支持状态、agent、阻塞筛选。
- `[x]` `P1` B4.6 桌面窗口筛选 QA：`assets/review/app/agentword_b4_filters_qa.png`。

Acceptance:

- 用户能通过看板理解每个任务现在在哪里、谁在做、是否阻塞。
- 看板和场景之间已经联动。

## Later Sprint: 动态与本地监控

目标：让原型开始“活起来”，再接入本机真实信号。

### C1. 场景动画

- `[x]` `P1` C1.1 实现 agent 在房间之间移动。已由 demo flow 驱动任务状态变化，并让 agent 平滑移动到目标房间 spawn point。
- `[x]` `P1` C1.2 接入 idle / walking / working / blocked / done 动作。移动中按方向切换 walk_down / walk_up / walk_left / walk_right，停下后按任务状态播放 planning / working / verifying / blocked / done。
- `[x]` `P1` C1.3 添加任务新建、阻塞、完成的视觉反馈。已接入新任务卡、阻塞警告、完成勾选三类地图反馈。
- `[x]` `P2` C1.4 添加 subagent 生成和回收动画。demo flow 会触发 `subagent_spawned` / `subagent_recycled`，地图显示 mini subagent 路线角色。
- `[~]` `P2` C1.5 添加事件流与地图动作的同步。当前 demo flow 已同步状态变更、事件流和地图移动，待补真实触发和更明确的视觉事件效果。
- `[x]` `P1` C1.6 桌面窗口动态移动 QA：`assets/review/app/agentword_c1_movement_qa.png`。
- `[x]` `P1` C1.7 将 PixiJS 场景改为持久 stage，只在任务流变化时更新 agent sprite state，避免每次 `sceneAgents` 变化重建 Pixi app。QA：`assets/review/app/agentword_persistent_pixi_qa.png`。
- `[x]` `P1` C1.8 桌面窗口事件反馈 QA：`assets/review/app/agentword_c1_event_feedback_qa.png`。
- `[x]` `P2` C1.9 桌面窗口 subagent 路线 QA：`assets/review/app/agentword_c1_subagent_route_qa.png`。

Acceptance:

- 任务状态变化能在地图里被看见，agent 会移动到对应房间。
- 角色不再只是静态贴图，会按移动方向和当前任务状态播放 spritesheet 动作。
- demo flow 会周期性推进任务状态，事件流、看板和地图位置同步变化。
- PixiJS app 不会因为 demo flow 状态更新反复重建，后续扩展更多 agent 前有更稳的渲染基础。
- 任务新建、阻塞、完成会在地图对应位置出现视觉反馈。
- subagent 生成和回收会同步事件流，并在地图上出现临时路线角色。

### C2. 本地进程监控

- `[x]` `P1` C2.1 Rust 侧扫描 Codex / Claude 相关进程。
- `[x]` `P1` C2.2 区分 Codex App、Codex app-server、Codex CLI、Claude CLI。
- `[x]` `P1` C2.3 返回 PID、父子进程关系、启动时间、最后发现时间。
- `[x]` `P1` C2.4 前端展示真实会话数量。
- `[x]` `P2` C2.5 将真实进程映射到基础 `AgentSession`。
- `[x]` `P1` C2.6 桌面窗口进程扫描 QA：`assets/review/app/agentword_c2_process_scan_qa.png`。
- `[x]` `P2` C2.7 真实进程 agent 场景 QA：`assets/review/app/agentword_c2_real_agents_qa.png`。
- `[x]` `P2` C2.8 将真实进程进一步关联到窗口 / 工作区 / 任务来源，只保存进程级和窗口级元数据，不读取终端正文。
- `[x]` `P2` C2.9 为真实会话增加 stale / gone 状态，关闭会话后地图和看板能更清晰地退场；地图中的退场真实 agent 会降低透明度并改变色调。
- `[x]` `P1` C2.10 桌面窗口真实会话来源 / presence QA：`assets/review/app/agentword_c2_sources_presence_qa.png`。
- `[x]` `P2` C2.11 选中真实会话时，在详情面板展示窗口、工作区、任务来源和退场状态；左侧真实会话行可点击，详情面板展示窗口、工作区、任务来源、PID、presence 和最近发现；QA：`assets/review/app/agentword_c2_session_detail_qa.png`。
- `[x]` `P2` C2.12 基于工作区标签，为真实会话推荐关联到更可能相关的任务卡；第一版只展示候选关系，不自动绑定任务；候选卡点击只查看任务详情，不修改任务归属。
- `[x]` `P2` C2.13 增强监控墙真实会话交互：点击地图里的真实会话、左侧 process 行、右侧 session 面板定位按钮会通过同一套 agent 聚焦请求保持同步；QA：`assets/review/app/agentword_c2_recommendation_sync_qa.png`。

Acceptance:

- 启动或关闭 Codex / Claude 相关进程后，应用会更新会话数量。
- 不读取终端正文，不展示真实命令内容。

### C3. 持久化与设置

- `[x]` `P1` C3.0 保存首屏视角、看板筛选和基础偏好设置到 `localStorage`，作为 SQLite 前置层。
- `[x]` `P2` C3.1 接入 SQLite。Rust 侧新增 `agentword.sqlite3` 和单条最新快照表。
- `[x]` `P2` C3.2 保存任务、agent 快照、事件日志。当前保存任务、事件和非真实 agent 场景状态，真实进程重启后重新扫描。
- `[x]` `P2` C3.3 添加首屏设置控件：模拟数据、进程监控、刷新频率、隐私模式。
- `[x]` `P2` C3.4 设置事件日志上限。
- `[x]` `P2` C3.5 应用重启后恢复最近任务和事件。
- `[x]` `P1` C3.6 桌面窗口偏好设置 QA：`assets/review/app/agentword_c3_preferences_qa.png`。
- `[x]` `P1` C3.7 桌面窗口 SQLite 快照保存 / 重启恢复 QA：`assets/review/app/agentword_c3_sqlite_snapshot_qa.png`、`assets/review/app/agentword_c3_sqlite_restore_qa.png`。

Acceptance:

- 关闭再打开应用后，最近任务和事件仍在。
- 用户能关闭真实进程监控，只保留模拟模式。
- 关闭再打开应用后，地图视角、任务筛选和基础设置会恢复。

## Asset Backlog

### D1. 场景资产

- `[x]` `P0` D1.1 园区概念图：`scene_campus_concept_1920x1280.png`。
- `[x]` `P1` D1.2 可交互背景：`scene_campus_base_1920x1280.png`。
- `[x]` `P1` D1.3 房间热点坐标 JSON。
- `[x]` `P2` D1.4 第一批 tile：草地、木地板、石路、圆角墙、门、窗、栅栏。文件见 `assets/scene/tiles/tiles_manifest.json`，预览见 `assets/review/d/d1_tile_prop_contact_sheet.png`。
- `[x]` `P2` D1.5 第一批家具：桌子、电脑、任务板、服务器柜、验证台、归档柜。文件见 `assets/scene/props/props_manifest.json`，预览见 `assets/review/d/d1_tile_prop_contact_sheet.png`。

### D2. 动物 agent 团队

- `[x]` `P1` D2.1 `red-panda-manager` 立绘。
- `[x]` `P1` D2.2 `frog-verifier` 立绘。
- `[x]` `P1` D2.3 `beaver-builder` 立绘。
- `[x]` `P1` D2.4 `penguin-runner` 立绘。
- `[x]` `P1` D2.5 `otter-ops` 立绘。
- `[x]` `P2` D2.6 `owl-planner`、`rabbit-timer`、`turtle-archivist` 立绘。

D2 立绘预览：`assets/review/d/d2_d3_portrait_contact_sheet_96.png`。

### D3. 原创猫咪 agent 团队

- `[x]` `P1` D3.1 `white-bow-cat-pm` 立绘。
- `[x]` `P1` D3.2 `black-fur-cat-ops` 立绘。
- `[x]` `P1` D3.3 `tea-cat-engineer` 立绘。
- `[x]` `P1` D3.4 `china-style-cat-planner` 立绘。
- `[x]` `P1` D3.5 `japan-style-cat-verifier` 立绘。
- `[x]` `P1` D3.6 `mini-cat-subagent` 立绘。

D3 立绘预览：`assets/review/d/d2_d3_portrait_contact_sheet_96.png`。

### D4. 动作素材

- `[x]` `P1` D4.1 为 1 个主角色制作完整 MVP 动作集，验证 spritesheet 流程。白猫 PM 完整 MVP 动作集已通过 96px 预览。
  - `[x]` D4.1a `white-bow-cat-pm_idle_refined.png`：逐动作 4 帧行图已通过 96px 预览。
  - `[x]` D4.1b `white-bow-cat-pm_walk_down_refined.png`：逐动作 4 帧行图已通过 96px 预览。
  - `[x]` D4.1c `white-bow-cat-pm_walk_up_refined.png`：逐动作 4 帧行图已通过 96px 预览。
  - `[x]` D4.1d `white-bow-cat-pm_walk_left_refined.png`：逐动作 4 帧行图已通过 96px 预览。
  - `[x]` D4.1e `white-bow-cat-pm_walk_right_refined.png`：逐动作 4 帧行图已通过 96px 预览。
  - `[x]` D4.1f `white-bow-cat-pm_movement_spritesheet.png`：idle + 四方向移动已合并为统一 movement spritesheet。
  - `[x]` D4.1g `white-bow-cat-pm_planning_refined.png`：逐动作 4 帧行图已通过 96px 预览。
  - `[x]` D4.1h `white-bow-cat-pm_working_refined.png`：逐动作 4 帧行图已通过 96px 预览。
  - `[x]` D4.1i `white-bow-cat-pm_verifying_refined.png`：逐动作 4 帧行图已通过 96px 预览。
  - `[x]` D4.1j `white-bow-cat-pm_blocked_refined.png`：逐动作 4 帧行图已通过 96px 预览。
  - `[x]` D4.1k `white-bow-cat-pm_done_refined.png`：逐动作 4 帧行图已通过 96px 预览。
  - `[x]` D4.1l `white-bow-cat-pm_mvp_spritesheet.png`：10 个 MVP 动作已合并为完整 spritesheet。
- `[x]` `P1` D4.2 扩展到 3 个 MVP 角色。
  - `[x]` D4.2a `beaver-builder_idle_refined.png`：逐动作 4 帧行图已通过 96px 预览。
  - `[x]` D4.2b `beaver-builder_walk_down_refined.png`：逐动作 4 帧行图已通过 96px 预览。
  - `[x]` D4.2c `beaver-builder_walk_up_refined.png`：逐动作 4 帧行图已通过 96px 预览。
  - `[x]` D4.2d `beaver-builder_walk_left_refined.png`：逐动作 4 帧行图已通过 96px 预览。
  - `[x]` D4.2e `beaver-builder_walk_right_refined.png`：逐动作 4 帧行图已通过 96px 预览。
  - `[x]` D4.2f `beaver-builder_movement_spritesheet.png`：idle + 四方向移动已合并为统一 movement spritesheet。
  - `[x]` D4.2g `beaver-builder_planning_refined.png`：逐动作 4 帧行图已通过 96px 预览。
  - `[x]` D4.2h `beaver-builder_working_refined.png`：逐动作 4 帧行图已通过 96px 预览。
  - `[x]` D4.2i `beaver-builder_verifying_refined.png`：逐动作 4 帧行图已通过 96px 预览。
  - `[x]` D4.2j `beaver-builder_blocked_refined.png`：逐动作 4 帧行图已通过 96px 预览。
  - `[x]` D4.2k `beaver-builder_done_refined.png`：逐动作 4 帧行图已通过 96px 预览。
  - `[x]` D4.2l `beaver-builder_mvp_spritesheet.png`：10 个 MVP 动作已合并为完整 spritesheet。
  - `[x]` D4.2m `mini-cat-subagent_idle_refined.png`：逐动作 4 帧行图已通过 96px 预览。
  - `[x]` D4.2n `mini-cat-subagent_movement_spritesheet.png`：idle + 四方向移动已合并为统一 movement spritesheet。
  - `[x]` D4.2o `mini-cat-subagent_carry_task_refined.png`：逐动作 4 帧行图已通过 96px 预览。
  - `[x]` D4.2p `mini-cat-subagent_working_refined.png`：逐动作 4 帧行图已通过 96px 预览。
  - `[x]` D4.2q `mini-cat-subagent_done_refined.png`：逐动作 4 帧行图已通过 96px 预览。
  - `[x]` D4.2r `mini-cat-subagent_mvp_spritesheet.png`：8 个 mini subagent 动作已合并为完整 spritesheet。
- `[x]` `P2` D4.3 扩展到 6 个主角色。白猫 PM 与 beaver 保留精修生产 sheet，`red-panda-manager`、`frog-verifier`、`black-fur-cat-ops`、`tea-cat-engineer` 增加可播放 MVP proxy spritesheet，并已注册到 `src/data/assets.ts`。
- `[x]` `P2` D4.4 制作 subagent 动作集。`mini-cat-subagent` MVP 动作集已完成。
- `[x]` `P2` D4.5 增加 handoff、summon_subagent、merge_result 等进阶动作。6 个主角色已生成 `advanced_spritesheet`，预览见 `assets/review/d/d4_advanced_actions_contact_sheet.png`。

D 阶段总 manifest：`assets/d_stage_manifest.json`。

## Next Backlog

### E1. D 阶段素材接入

- `[x]` `P1` E1.1 将 `assets/d_stage_manifest.json` 的 tile / prop 接入 PixiJS 装饰层，让独立素材能覆盖或增强整张底图。摆放清单见 `assets/scene/decorations/scene_decorations.json`，桌面 QA：`assets/review/app/agentword_e1_decoration_layer_qa.png`。
- `[x]` `P1` E1.2 在演示数据中加入角色阵容切换或密度模式，验证 6 主角色 + mini subagent 同屏时的可读性。新增 `readability` 阵容模式和左侧「阵容」开关，QA：`assets/review/app/agentword_e1_2_density_mode_qa.png`。
- `[x]` `P2` E1.3 将 handoff、summon_subagent、merge_result 进阶动作接入 demo flow。demo flow 会生成对应事件，PixiJS 为主角色播放短时进阶动作覆盖，并继续保留 subagent 路线效果；QA：`assets/review/app/agentword_e1_3_advanced_actions_qa.png`。
- `[x]` `P2` E1.4 为 D 阶段素材增加自动化透明边缘检查和 64px / 96px 批量缩放报告。新增 `pnpm asset:quality`，报告见 `assets/review/d/e1_4_asset_quality_report.md`，64px / 96px 预览见 `assets/review/d/e1_4_scale_64_contact_sheet.png`、`assets/review/d/e1_4_scale_96_contact_sheet.png`。
- `[x]` `P2` E1.5 将 `readability` 阵容模式扩展为 12 / 24 / 30 agent 压力档位。新增 `stress12` / `stress24` / `stress30` 阵容模式，压力 agent 只作为场景层复制体，不写回任务数据；QA：`assets/review/app/agentword_e1_5_density_tiers_qa.png`。
- `[x]` `P2` E1.6 补真实 agent 状态到进阶动作事件的触发规则，让进阶动作不只来自 demo flow。真实进程扫描新增 / 恢复 / 来源变化会触发 `handoff` 或 `summon_subagent`，退场会触发 `merge_result`；事件文案不包含 PID、完整路径或终端正文。
- `[x]` `P2` E1.7 让任务详情能解释地图动作来自哪条事件，方便从看板理解场景反馈。任务详情和真实 Session 详情新增「地图动作」追踪块，展示事件类型、时间、actor 和对应地图反馈；QA：`assets/review/app/agentword_e1_7_map_action_trace_qa.png`。
- `[x]` `P2` E1.8 观察 30 agent 压力档位下的 PixiJS 更新成本，必要时增加轻量性能采样。`stress30` 模式新增场景顶部性能 chip，每约 1.2s 统计 FPS、平均 frame ms、sprite 数和效果数量；QA：`assets/review/app/agentword_e1_8_perf_sample_qa.png`。
- `[x]` `P2` E1.9 将真实 agent 事件规则抽成可配置映射，方便不同用户按工作流调整动作语义。新增 `realAgentEventRuleMode` 偏好和 `realAgentEventRules.ts` 规则预设，左侧监控面板可切换默认 / 安静 / 协作+。
- `[x]` `P1` E1.10 真实 session 可手动绑定到任务卡，让真实 Codex / Claude 会话进入任务看板和地图房间。真实 Session 详情中的候选任务点击后会写入 assignee / currentTaskId，生成绑定事件并聚焦地图；已绑定任务可一键解除。
- `[x]` `P1` E1.11 事件流和地图动作支持点击定位 actor / 房间，形成“事件 -> 地图反馈 -> 任务详情”的可追踪闭环。新增 `focusSceneEvent` 和房间聚焦请求，全局事件流与地图动作卡都可点击定位。
- `[x]` `P1` E1.12 完成迁移前桌面验收和可运行版本打包。`pnpm typecheck`、`pnpm build`、`cargo check --manifest-path src-tauri/Cargo.toml`、`pnpm tauri build` 均通过；正式 app smoke 截图：`assets/review/app/agentword_release_app_smoke.png`；产物：`src-tauri/target/release/bundle/macos/agentWord.app`、`src-tauri/target/release/bundle/dmg/agentWord_0.1.0_aarch64.dmg`。
- `[x]` `P0` E1.13 将默认启动改为真实优先模式，避免把演示 agent / 演示开发任务误认为真实运行。默认关闭模拟流，偏好 key 升级到 `agentword.preferences.v2`，旧 v1 演示偏好不再自动生效；看板无真实任务时显示空状态，左侧统计改为「演示」和「进程」。`pnpm tauri build` 已重新产出可运行包；QA：`assets/review/app/agentword_real_first_default_qa.png`。

## Current Sprint: F 阶段硬验收（原型图优先修正版）

目标：最终产品必须和用户提供的原型图在布局、信息层级、视觉密度、配色气质和交互结构上高度一致。旧 `scene_campus_base_1920x1280.png` 不再作为默认目标地图；它只可作为 fallback/reference。

执行入口：

- Pipeline：`docs/F_TEAM_DASHBOARD_PIPELINE.md`
- Atomic tasks：`docs/F_ATOMIC_TASKS.md`

### F0. 文档与任务拆分落盘

- `[x]` `P0` F0.1 新增 F 阶段 pipeline 文档。
- `[x]` `P0` F0.2 新增 F 阶段 atomic task 文档。
- `[x]` `P0` F0.3 根据用户反馈重写 pipeline：原型图优先、动态地图、动态任务桌。

Acceptance:

- 新会话只读 F 阶段文档即可接手。
- 文档明确禁止继续旧“固定底图 + overlay”路线。

### F1. App Shell 与折叠状态

- `[~]` `P0` F1.1 扩展偏好：`isLeftPanelCollapsed`、`isRightPanelCollapsed`、`rightPanelMode`。
- `[~]` `P0` F1.2 改造为左 rail、左 panel、center、右 panel、右 rail 五列 shell。
- `[~]` `P0` F1.3 左右面板折叠后保留窄 Rail。
- `[~]` `P0` F1.4 折叠状态持久化，地图随面板折叠自动变宽。

Acceptance:

- 默认展开、左折叠、右折叠、左右都折叠四种状态可用。
- 地图不能因为折叠出现空白或消失。

### F2. 新版 Team Dashboard 数据模型

- `[x]` `P0` F2.1 新增 `TeamDashboardSummary`、`TeamSourceBreakdown`、`TeamCardView`、`SystemHealthView`、`ActivityFeedItem`。
- `[x]` `P0` F2.2 从 `tasks + agents + events + processScan + preferences` 派生数据。
- `[x]` `P0` F2.3 真实优先，demo 明确标识。

Acceptance:

- 无任务、demo、真实 session、阻塞任务四种状态都有稳定输出。

### F3. 右侧 Team Dashboard

- `[~]` `P0` F3.1 替换旧 Kanban 主视图。
- `[~]` `P0` F3.2 实现 Live Overview、Sources、System Health、Team Cards、Activity Feed。
- `[~]` `P0` F3.3 Team Card 包含 `Open Window`。
- `[~]` `P0` F3.4 阻塞卡红色高亮，选中卡蓝色高亮。

Acceptance:

- 右侧必须接近原型图，旧多列 Kanban 不作为主界面出现。

### F4. 左侧 Live Monitor 与导航 Rail

- `[~]` `P0` F4.1 实现深绿色导航 Rail。
- `[~]` `P0` F4.2 实现左侧 Live Overview、Sources、System Health、Activity Feed。
- `[~]` `P0` F4.3 折叠后 Rail 保留关键 badge。

Acceptance:

- 左侧视觉接近原型图，不再是当前基础监控样式。

### F5. 原型图地图与道具素材生成

- `[x]` `P0` F5.1 用模型生成 `scene_prototype_base_1536x1024.png`：无角色、无固定任务卡、无文字。已替换为无侧房间版本，只保留上方 team work hall、中间 dispatch/block centers、底部 waiting/idle zone 和花园路径。
- `[~]` `P0` F5.2 用模型生成 `scene_prototype_ui_props_sheet.png`：团队桌、中心台、阻塞台、waiting 长桌、路径箭头、椅子、植物、墙角、终端、警示 props。当前 raw sheet 已保存为 `assets/scene/prototype/scene_prototype_ui_props_sheet_raw.png`，待去背景/切分。
- `[x]` `P0` F5.3 将最终图复制到 `assets/scene/prototype/`。当前已复制 clean base map、clean raw trace copy、rejected side-room copy 和 raw prop sheet。
- `[x]` `P0` F5.4 记录 prompt、源路径和验收说明。当前记录见 `assets/scene/prototype/README.md`。

Acceptance:

- base map 和原型图构图相近。
- base map 只保留必要功能区：上方 team work hall、中间 dispatch/block centers、底部 waiting/idle zone；无功能侧房间先去掉。
- prop sheet 可用于动态层。
- 不包含固定任务文字、数字、角色或完整 UI 面板。

### F6. 动态 Team Desk 布局

- `[x]` `P0` F6.1 从 active teams/tasks 派生任务桌数量。当前排除 queued/done，demo flow 推进后任务桌数量会从 0/10/14 等状态动态变化，不再固定 12。
- `[x]` `P0` F6.2 一个主 agent + N 个 subagent 显示为同桌 N+1 个角色位。重复参与多个任务时只生成视觉 seat instance，不新增真实会话。
- `[x]` `P0` F6.3 阻塞状态只改变桌子样式和路径提示，不把 team desk 搬到 Blocked Center。
- `[x]` `P0` F6.4 Waiting / Idle Zone 只展示待分配/空闲统计或空闲团队，不替代 team desk。
- `[x]` `P0` F6.5 新增容量驱动区域布局：team work area、Task Dispatch Center、Blocked Center、Waiting / Idle Zone 可根据 agent / subagent / blocked / waiting 数量在 min/max 范围内变大或变小。

Acceptance:

- 添加/减少任务会改变桌子数量。
- 添加/减少 subagent 会改变桌上人数。
- 桌子不能压中心、墙、主路径。
- 区域不再是固定尺寸；容量上升时扩展或降密度，容量下降时收拢。
- QA 截图：`output/playwright/f6_clean_base_no_old_hotspots.png`。

### F7. 原型图地图渲染接入

- `[x]` `P0` F7.1 接入生成的 prototype base map。
- `[x]` `P0` F7.2 默认不再渲染旧 campus base。
- `[x]` `P0` F7.3 桌子、角色、标签、中心节点、路线和选中态作为动态层渲染。

Acceptance:

- 截图第一眼接近用户原型图。
- 地图不是旧校园图，也不是简化色块图。
- 旧房间 hotspot 层已移除，避免 `入口队列` / `规划室` 等旧地图标签漂在新底图上。

### F8. 地图与 Dashboard 联动

- `[x]` `P0` F8.1 点击 Team Card 定位地图任务桌。
- `[x]` `P0` F8.2 点击地图任务桌选中右侧 Team Card。
- `[x]` `P0` F8.3 点击 Activity Feed 定位地图事件。
- `[x]` `P0` F8.4 阻塞任务显示到 Blocked Center 的路径/高亮。

Acceptance:

- 看板、地图、事件流选中态一致。
- Team Cards 只展示 active desk tasks；queued 留在 Waiting / Idle，done 留在 Activity Feed，避免右侧卡片指向不存在的桌子。
- QA 截图：`output/playwright/f8_blocked_route_immediate.png`。

### F9. Open Window 接入 Team Card

- `[x]` `P0` F9.1 Rust 扫描结果增加 `workspacePath`、`windowOwnerLabel`、`canNavigateToWindow`。
- `[x]` `P0` F9.2 新增 Tauri command：`focus_agent_window`。
- `[x]` `P0` F9.3 真实绑定任务启用 `Open Window`。代码路径会为 ready real session 构造 `FocusAgentWindowRequest`，完整桌面 smoke 放入 F10。
- `[x]` `P0` F9.4 demo/browser preview 明确不可真实导航。浏览器预览中所有按钮为 disabled `Preview only`，并显示 desktop app 才可导航。

Acceptance:

- 按钮不误导用户，失败有反馈。
- QA：browser preview DOM 验证通过；`cargo check --manifest-path src-tauri/Cargo.toml` 通过。

### F10. Final QA 与版本提交

- `[x]` `P0` F10.1 跑 `pnpm typecheck`、`pnpm build`、`cargo check --manifest-path src-tauri/Cargo.toml`、`pnpm tauri build`。2026-06-03 在默认视角修正后重新验证通过；`pnpm tauri build` 重新生成 `src-tauri/target/release/bundle/macos/agentWord.app` 和 `src-tauri/target/release/bundle/dmg/agentWord_0.1.0_aarch64.dmg`。
- `[x]` `P0` F10.2 Playwright 截图：默认展开、左折叠、右折叠、左右都折叠、demo 态、阻塞态、真实 session 绑定态。浏览器截图已更新：`output/playwright/f10_default_expanded.png`、`f10_left_collapsed.png`、`f10_right_collapsed.png`、`f10_both_collapsed.png`、`f10_demo_state.png`、`f10_blocked_state.png`；最新折叠/demo/blocked 截图使用 1728x967 宽屏视口和 100% 地图视角，真实 session 绑定以桌面 smoke 为强证据，旧 `f10_real_session_bound_state.png` 仅保留历史对照。
- `[x]` `P0` F10.3 桌面 smoke：启动 app、打开/关闭 Codex 或 Claude、绑定任务、点击 `Open Window`、重启确认折叠状态恢复。2026-06-03 验证：重启后左/右折叠状态恢复；真实绑定卡 `补齐 Tauri Rust shell` 保留 `Codex app-server` 来源；点击 `Open Window` 后卡片反馈 `Focused Codex.`。
- `[x]` `P0` F10.4 提交前 staged diff review。2026-06-03 已完成 staged diff review，`git diff --cached --check` 通过；review 中修复了 Team Card 嵌套交互元素、Team filter 假控件，以及筛选无结果时的误导性空状态文案。非阻塞风险：`SceneCanvas.tsx` 仍然较大，后续视觉迭代前建议拆分场景层模块。
- `[x]` `P0` F10.5 提交并推送可迁移版本。Commit: `5988a18 Implement agentWord F-stage dashboard prototype`；push: `origin/main`。

Acceptance:

- 最终 app 与用户原型图高度一致，所有检查通过。

## Immediate Next Actions

当前最推荐的下一步：

1. 迁移仓库前先用已推送 commit `5988a18` 做一次人工预览确认。
2. 如果继续追求“和原型图更像”，下一步进入视觉精修：对 raw prop sheet 做 chroma-key 清理和可选切分，替换当前 CSS 临时桌子、中心节点和路径箭头。
3. 代码结构后续：拆分 `SceneCanvas.tsx` 的场景绘制、任务桌 overlay、路线/反馈层，降低后续视觉迭代风险。

## Notes

- 素材规范以 `ASSET_SPEC.md` 为准。
- 产品和开发方向以 `IMPLEMENTATION_PLAN.md` 为准。
- 任何涉及猫咪团队的素材，都使用原创 kawaii cat agent team，不使用受保护 IP 名称或完整外观组合。
