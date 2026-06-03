# F Stage Atomic Tasks

Last updated: 2026-06-02

This file is the fresh-session handoff for F stage. The current corrected goal:
the product must match the user's prototype image. Do not continue the old
fixed-campus-background interpretation.

## Shared Rules

- Work only inside `agentWord/`.
- Do not touch unrelated dirty files outside this project.
- Do not revert user or other-agent changes.
- The old `scene_campus_base_1920x1280.png` is not the default target scene.
- The map should be prototype-first: generated base art plus dynamic desks,
  agents, labels, routes, centers, and highlights.
- Every task must update:
  - `TASKS.md`
  - `docs/F_TEAM_DASHBOARD_PIPELINE.md`
  - this file
- Before every commit, review staged diff with:
  - `git diff --cached --stat`
  - `git diff --cached`
  - `git diff --cached --check`

## Atomic Prompt Template

```md
# Atomic Task: F?.?

目标：
效果图对齐要求：
输入文件：
必须修改：
禁止修改：
实现步骤：
验收标准：
验证命令：
完成后必须更新：
提交前 review 要点：
```

## F1. App Shell And Collapsible Panels

Status: in progress

```md
# Atomic Task: F1

目标：
实现可折叠 app shell：深绿色左 rail、左 Live Monitor、中间地图、右 Team Dashboard、右折叠 rail。

效果图对齐要求：
左右面板展开时结构必须接近原型图；折叠后只保留窄 rail，地图必须变宽且不消失。

输入文件：
- src/App.tsx
- src/styles.css
- src/types/domain.ts
- src/store/localPreferences.ts

必须修改：
- src/App.tsx
- src/styles.css
- src/types/domain.ts
- src/store/localPreferences.ts
- TASKS.md
- docs/F_TEAM_DASHBOARD_PIPELINE.md
- docs/F_ATOMIC_TASKS.md

禁止修改：
- src-tauri/**
- assets/characters/**

实现步骤：
1. 添加并持久化折叠偏好。
2. 用五列 grid 固定左 rail、左 panel、center、右 panel、右 rail。
3. 折叠时不要让 CSS Grid 自动重排。
4. Pixi stage resize 必须跟随外层 frame。

验收标准：
- 默认展开可用。
- 左折叠可用。
- 右折叠可用。
- 左右都折叠可用。
- 刷新后折叠状态恢复。

验证命令：
- pnpm typecheck
- pnpm build
- Playwright screenshot: default, left collapsed, right collapsed, both collapsed

完成后必须更新：
- TASKS.md
- docs/F_TEAM_DASHBOARD_PIPELINE.md
- docs/F_ATOMIC_TASKS.md

提交前 review 要点：
- Grid column placement is explicit.
- Map does not disappear or show blank right side after collapse.
```

## F2. Team Dashboard View Model

Status: complete

Completion note:

- Added dashboard view model for summary, sources, health, cards, and activity.
- Real/demo/browser-preview states are represented.

## F3. Right Team Dashboard

Status: in progress

```md
# Atomic Task: F3

目标：
实现右侧 Team Dashboard，替换旧 Kanban 主视图。

效果图对齐要求：
右侧必须按原型图显示 Team Dashboard、Live Overview、Sources、System Health、Team Cards、Activity Feed。Team Card 必须有状态 chip、进度条、来源、subagent 数量、Open Window。

输入文件：
- src/kanban/TaskBoard.tsx
- src/kanban/TeamDashboard.tsx
- src/kanban/teamDashboardModel.ts
- src/styles.css

必须修改：
- src/kanban/TeamDashboard.tsx
- src/kanban/TaskBoard.tsx
- src/styles.css
- TASKS.md
- docs/F_TEAM_DASHBOARD_PIPELINE.md
- docs/F_ATOMIC_TASKS.md

禁止修改：
- src/scene/**
- assets/**

实现步骤：
1. 右侧主界面只显示 Team Dashboard。
2. 阻塞卡红色，选中卡蓝色。
3. Open Window 在 demo/browser preview 下必须明确不可真实导航。
4. 文案不能泄露完整 workspace path。

验收标准：
- 旧六列 Kanban 不再作为主界面出现。
- 右栏结构接近原型图。
- 按钮状态真实。

验证命令：
- pnpm typecheck
- pnpm build
- Playwright screenshot

完成后必须更新：
- TASKS.md
- docs/F_TEAM_DASHBOARD_PIPELINE.md
- docs/F_ATOMIC_TASKS.md

提交前 review 要点：
- No misleading real navigation.
- Text fits compact cards.
```

## F4. Left Live Monitor And Navigation Rail

Status: in progress

```md
# Atomic Task: F4

目标：
实现左侧深绿色导航 rail 和 cream Live Monitor 面板。

效果图对齐要求：
左侧必须像原型图：agentWord 标题、Live Overview、Sources、System Health、Activity Feed，底部保留设置入口。

输入文件：
- src/App.tsx
- src/monitor/MonitorStatus.tsx
- src/styles.css

必须修改：
- src/App.tsx
- src/monitor/MonitorStatus.tsx
- src/styles.css
- TASKS.md
- docs/F_TEAM_DASHBOARD_PIPELINE.md
- docs/F_ATOMIC_TASKS.md

禁止修改：
- src-tauri/**
- assets/**

实现步骤：
1. 完成左 rail 图标、badge、collapse control。
2. Live Monitor 按原型图拆成卡片。
3. 左 panel 滚动时不破坏 rail。

验收标准：
- 左侧视觉接近原型图。
- 折叠时 rail 仍可用。

验证命令：
- pnpm typecheck
- pnpm build
- Playwright screenshot

完成后必须更新：
- TASKS.md
- docs/F_TEAM_DASHBOARD_PIPELINE.md
- docs/F_ATOMIC_TASKS.md

提交前 review 要点：
- No text overflow.
- Source counts are truthful/demo-marked.
```

## F5. Prototype Map Asset Generation

Status: active next

Current progress:

- Raw prop sheet generated and copied to
  `assets/scene/prototype/scene_prototype_ui_props_sheet_raw.png`.
- Clean prototype base map generated and copied to
  `assets/scene/prototype/scene_prototype_base_1536x1024.png`.
- Asset record added at `assets/scene/prototype/README.md`.
- Base map visual QA passed for the user-flagged side-room issue: the accepted
  candidate removes non-functional side rooms and keeps only the upper team work
  hall, middle dispatch/block centers, bottom waiting/idle zone, and decorative
  garden/path edges.
- Rejected base candidates are preserved in `assets/scene/prototype/` for
  traceability, including fixed-table and side-room versions.
- Raw prop sheet cleanup/slicing is still pending.

```md
# Atomic Task: F5

目标：
直接用模型生成原型图同构的地图底稿和可复用道具素材，不再默认使用旧 campus base。

效果图对齐要求：
生成结果必须服务用户提供的原型图：上方工作桌区域、中间 Task Dispatch Center / Blocked Center、底部 Waiting / Idle Zone、花园路径和温暖卡通管理游戏风格。

输入文件：
- 用户提供的原型图作为视觉基准
- assets/scene/**
- docs/F_TEAM_DASHBOARD_PIPELINE.md

必须修改：
- assets/scene/prototype/**
- docs/F_TEAM_DASHBOARD_PIPELINE.md
- docs/F_ATOMIC_TASKS.md
- TASKS.md

禁止修改：
- src-tauri/**
- src/store/**
- src/kanban/**

实现步骤：
1. 生成 `scene_prototype_base_1536x1024.png`：无角色、无文字、无固定任务卡。
2. 生成 `scene_prototype_ui_props_sheet.png`：桌子、中心台、阻塞台、waiting 长桌、路径箭头、椅子、绿植、墙角、电脑、警示道具。
3. 复制模型生成图到 `assets/scene/prototype/`。
4. 记录 prompt、源图路径和验收说明。
5. 如果 base map 中出现无产品功能侧房间，标记 rejected 并重新生成。
6. 已确认当前 F 阶段不要保留健身房、休息室、资料室等无核心流程作用侧房间；如后续要加，必须作为有明确功能的可选模块重新进入 pipeline。

验收标准：
- base map 和原型图构图相近。
- base map 只保留必要功能区，不包含无功能侧房间。
- prop sheet 可用于后续切分/动态层。
- 不包含固定任务文字、数字、角色或完整 UI 面板。

验证命令：
- file assets/scene/prototype/*.png
- git diff --check -- assets/scene/prototype docs/F_TEAM_DASHBOARD_PIPELINE.md docs/F_ATOMIC_TASKS.md TASKS.md

完成后必须更新：
- TASKS.md
- docs/F_TEAM_DASHBOARD_PIPELINE.md
- docs/F_ATOMIC_TASKS.md

提交前 review 要点：
- Generated assets are project-bound, not left only under ~/.codex.
- No copyrighted/brand-specific characters.
```

## F6. Dynamic Team Desk Layout

Status: complete

Completion note:

- Fixed desk slots were removed from the live layout path.
- `buildTaskDeskPlacements` now derives desks from active non-queued, non-done
  tasks and supports capacity tiers.
- Desk seats are derived from assignee plus subagents.
- `buildSceneAgents` creates task-bound visual seat instances without creating
  extra real sessions.
- Flow nodes are capacity-aware: Task Center, Blocked Center, and Waiting /
  Idle respond to queued, blocked, active, and waiting counts.
- QA screenshot: `output/playwright/f6_clean_base_no_old_hotspots.png`.

```md
# Atomic Task: F6

目标：
实现数据驱动的任务桌布局：有几个 active team/task 就显示几张桌；一个主 agent 有几个 subagent，桌边就显示对应人数。

效果图对齐要求：
上方工作区像原型图的团队桌网格，但桌子数量动态变化。Blocked Center 和 Waiting / Idle Zone 是独立节点，不是 team desk 的替代位置。

输入文件：
- src/scene/sceneLayout.ts
- src/scene/SceneCanvas.tsx
- src/types/domain.ts
- src/data/mockData.ts

必须修改：
- src/scene/sceneLayout.ts
- src/scene/SceneCanvas.tsx
- src/styles.css
- TASKS.md
- docs/F_TEAM_DASHBOARD_PIPELINE.md
- docs/F_ATOMIC_TASKS.md

禁止修改：
- src-tauri/**
- src/kanban/teamDashboardModel.ts unless data contract is required

实现步骤：
1. 从 tasks 派生 active team list。
2. 新增容量驱动 `SceneRegionLayout`：team work area、Task Dispatch Center、Blocked Center、Waiting / Idle Zone 都有 min/max bounds、capacity、columns、rows、scale。
3. 使用动态桌位网格，桌子数量等于 active team/task 数，区域可根据容量扩展或压缩。
4. 每桌 seats = assignee + subagents，subagent 多时桌子和 seat ring 可变大。
5. blocked 状态只改变桌子红色样式和到 Blocked Center 的路径，不把 team desk 搬出 team grid。
6. Waiting / Idle Zone 展示未分配/空闲统计或空闲团队，可按 waiting 容量增宽/换行。

验收标准：
- active task 数变化时桌子数量变化。
- subagent 数变化时桌上人数变化。
- 阻塞任务仍在 team grid 中，同时有阻塞路径提示。
- team work area、Blocked Center、Task Dispatch Center、Waiting / Idle Zone 可以根据容量在 min/max 范围内变大或变小。

验证命令：
- pnpm typecheck
- pnpm build
- Playwright screenshot for demo and blocked states

完成后必须更新：
- TASKS.md
- docs/F_TEAM_DASHBOARD_PIPELINE.md
- docs/F_ATOMIC_TASKS.md

提交前 review 要点：
- No fixed 12-table assumption.
- No routing of blocked team desks into Blocked Center.
- No fixed-size region assumption without min/max capacity rules.
```

## F7. Prototype Map Rendering Integration

Status: complete

Completion note:

- `sceneAssets.prototypeBaseImage` now points to the clean generated base map.
- PixiJS default base layer uses `scene_prototype_base_1536x1024.png`.
- The previous dynamic/programmatic campus layer is no longer used as the
  default scene background.
- The old room hotspot overlay was removed from the map.

```md
# Atomic Task: F7

目标：
将生成的 prototype base map 接入 PixiJS 场景，并把任务桌、角色、标签、路径作为动态层渲染。

效果图对齐要求：
默认画面必须看起来像用户原型图，而不是旧 campus 图片，也不是简化色块图。

输入文件：
- assets/scene/prototype/scene_prototype_base_1536x1024.png
- assets/scene/prototype/scene_prototype_ui_props_sheet.png
- src/data/assets.ts
- src/scene/SceneCanvas.tsx

必须修改：
- src/data/assets.ts
- src/scene/SceneCanvas.tsx
- src/styles.css
- TASKS.md
- docs/F_TEAM_DASHBOARD_PIPELINE.md
- docs/F_ATOMIC_TASKS.md

禁止修改：
- src-tauri/**
- src/store/**

实现步骤：
1. 添加 prototype base asset import。
2. 默认渲染 prototype base，不再默认渲染旧 campus base。
3. 动态层继续渲染桌位、角色、任务标签、中心节点、路线和选中态。
4. 旧 campus base 只保留 fallback/reference。

验收标准：
- 截图第一眼接近原型图。
- 任务桌/角色/标签仍由数据控制。

验证命令：
- pnpm typecheck
- pnpm build
- Playwright screenshot

完成后必须更新：
- TASKS.md
- docs/F_TEAM_DASHBOARD_PIPELINE.md
- docs/F_ATOMIC_TASKS.md

提交前 review 要点：
- No hardcoded baked task text in base image.
- Old map is not default.
```

## F8. Dashboard And Map Linkage

Status: complete

Completion note:

- Team Card click selects and focuses the matching dynamic task desk.
- Map desk click selects the matching Team Card.
- Activity Feed click focuses the event task and highlights related activity.
- Team Cards are limited to active desk tasks so every visible card has a
  rendered desk target.
- Selected task routes render on the map; blocked selected tasks use
  `route-selected-blocked` toward Blocked Center.
- QA screenshot: `output/playwright/f8_blocked_route_immediate.png`.

```md
# Atomic Task: F8

目标：
打通 Team Dashboard、地图桌位、Activity Feed 的点击定位和选中态。

效果图对齐要求：
选中 Team Card 后，右卡蓝色高亮、地图对应桌高亮、路径/中心节点同步提示。

输入文件：
- src/store/useAgentWorldStore.ts
- src/kanban/TeamDashboard.tsx
- src/scene/SceneCanvas.tsx
- src/styles.css

必须修改：
- src/store/useAgentWorldStore.ts
- src/kanban/TeamDashboard.tsx
- src/scene/SceneCanvas.tsx
- src/styles.css
- TASKS.md
- docs/F_TEAM_DASHBOARD_PIPELINE.md
- docs/F_ATOMIC_TASKS.md

禁止修改：
- assets/**
- src-tauri/**

实现步骤：
1. 添加/复用 task focus request。
2. Team Card click focus map desk。
3. Desk click select Team Card。
4. Activity Feed click focus event/task。
5. Blocked task route highlights toward Blocked Center。

验收标准：
- 看板、地图、事件流选中态一致。

验证命令：
- pnpm typecheck
- pnpm build
- Playwright click flow screenshot

完成后必须更新：
- TASKS.md
- docs/F_TEAM_DASHBOARD_PIPELINE.md
- docs/F_ATOMIC_TASKS.md

提交前 review 要点：
- Focus requests do not cause infinite loops.
- Click hit targets are stable.
```

## F9. Open Window Integration

Status: complete; final desktop smoke remains in F10

Completion note:

- Browser preview disables all Team Card window actions as `Preview only`.
- Demo teams do not expose real navigation.
- Ready real sessions build `FocusAgentWindowRequest` for Tauri.
- Rust `focus_agent_window` command compiles.
- Actual macOS host-window activation is still covered by F10 desktop smoke.

```md
# Atomic Task: F9

目标：
把真实工作窗口导航接入 Team Card。

效果图对齐要求：
Team Card 的 `Open Window` 按钮必须像原型图一样实用；demo/browser preview 明确不可真实导航。

输入文件：
- src/kanban/TeamDashboard.tsx
- src/kanban/teamDashboardModel.ts
- src/monitor/windowNavigation.ts
- src-tauri/src/lib.rs

必须修改：
- src/kanban/TeamDashboard.tsx
- src/kanban/teamDashboardModel.ts if needed
- TASKS.md
- docs/F_TEAM_DASHBOARD_PIPELINE.md
- docs/F_ATOMIC_TASKS.md

禁止修改：
- assets/**

实现步骤：
1. 真实绑定任务启用 Open Window。
2. demo/browser preview 禁用或显示明确说明。
3. 失败时展示明确反馈。
4. 多真实 session 默认打开主 assignee。

验收标准：
- 按钮不误导用户。
- 真实 app 中可尝试聚焦宿主窗口或打开 workspace fallback。

验证命令：
- pnpm typecheck
- pnpm build
- cargo check --manifest-path src-tauri/Cargo.toml

完成后必须更新：
- TASKS.md
- docs/F_TEAM_DASHBOARD_PIPELINE.md
- docs/F_ATOMIC_TASKS.md

提交前 review 要点：
- No full workspace path shown in UI.
- Permission/error states are clear.
```

## F10. Final QA And Release Commit

Status: validation mostly complete; staged pre-commit review pending

Completion notes:

- `pnpm typecheck`, `pnpm build`,
  `cargo check --manifest-path src-tauri/Cargo.toml`, and
  `pnpm tauri build` passed on 2026-06-03.
- Current browser screenshots live in `output/playwright/f10_*.png`.
- Desktop smoke verified real session binding, `Open Window` feedback
  `Focused Codex.`, and restart restoration of collapsed panel preferences.
- The clean prototype base is the default map; non-functional side-room
  candidates remain rejected assets only.
- Unstaged diff review passed `git diff --check -- agentWord` and fixed:
  nested interactive Team Card markup, plus the previously non-functional Team
  filter dropdown.
- Remaining visual risk before declaring the whole F goal complete: default and
  reset viewport should be tightened to the full prototype composition instead
  of retaining a local selected-card zoom as the apparent default.

```md
# Atomic Task: F10

目标：
完成 F 阶段硬验收、代码 review 和版本提交。

效果图对齐要求：
最终截图必须和用户原型图在结构、信息层级、视觉密度和交互布局上高度一致。

输入文件：
- 全项目

必须修改：
- TASKS.md
- docs/F_TEAM_DASHBOARD_PIPELINE.md
- docs/F_ATOMIC_TASKS.md
- assets/review/app/**

禁止修改：
- 无关文件

实现步骤：
1. 运行所有验证命令。
2. 保存 Playwright 必要截图。
3. 做桌面 smoke。
4. staged diff review。
5. 提交。

验收标准：
- `pnpm typecheck` passes。
- `pnpm build` passes。
- `cargo check --manifest-path src-tauri/Cargo.toml` passes。
- `pnpm tauri build` passes。
- 默认、折叠、demo、blocked、real binding 截图完成。
- 用户可顺着完整流程体验。
- 默认/复位视角保持原型图全局构图；点击卡片、任务桌、事件流可以定位，但不能把局部放大视角持久化为默认体验。

验证命令：
- pnpm typecheck
- pnpm build
- cargo check --manifest-path src-tauri/Cargo.toml
- pnpm tauri build
- git diff --cached --stat
- git diff --cached
- git diff --cached --check

完成后必须更新：
- TASKS.md
- docs/F_TEAM_DASHBOARD_PIPELINE.md
- docs/F_ATOMIC_TASKS.md

提交前 review 要点：
- 原型图硬目标是否满足。
- 没有把旧地图作为默认。
- 没有假装 demo 是真实工作。
```
