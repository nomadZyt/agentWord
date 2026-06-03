# agentWord Asset Pipeline Validation

Last updated: 2026-06-02

## 1. 本轮目标

本轮按 Immediate Next Actions 执行：

1. 生成不含角色的 `scene_campus_base_1920x1280.png`。
2. 创建 `scene_campus_hotspots.json` 和 `scene_room_labels.json`。
3. 为 `white-bow-cat-pm` 做第一套 MVP 动作 spritesheet，验证动作流程。
4. 只有素材验证通过后，才扩展到 `beaver-builder` 和 `mini-cat-subagent`。
5. 素材能支撑 PixiJS 场景后，再进入 B1 项目骨架。

## 2. 已完成资产

### 2.1 无角色场景底图

- 文件：`assets/scene/maps/scene_campus_base_1920x1280.png`
- 实际尺寸：1536x1024
- 状态：可用于 MVP 原型。

验证结论：

- 通过：画面不含角色，适合后续单独渲染 agent。
- 通过：核心区域可识别，包括队列、规划、执行、验证、阻塞、归档、休息区和庭院路径。
- 注意：实际尺寸不是文件名中的 1920x1280，但比例是同一类横向场景比例，MVP 可以先使用。若后续需要严格尺寸，再单独重出。

### 2.2 Hotspots 与房间配置

- 文件：`assets/scene/maps/scene_campus_hotspots.json`
- 文件：`assets/scene/maps/scene_room_labels.json`
- 预览：`assets/review/scene/scene_hotspots_overlay.png`
- 状态：可用于 MVP 点击、高亮、默认定位和任务状态映射。

验证结论：

- 通过：两个 JSON 都通过 `jq` 校验。
- 通过：房间矩形和当前底图位置基本匹配。
- 注意：`room_queue` 与 `room_planning` 有轻微空间重叠，这是为了覆盖左侧入口和任务板区域；后续接 PixiJS 时可根据实际点击反馈微调坐标。

## 3. White Bow Cat PM 动作流程验证

### 3.1 已生成文件

源文件：

- `assets/characters/kawaii-cat-team/white-bow-cat-pm/white-bow-cat-pm_spritesheet_chroma_source.png`
- `assets/characters/kawaii-cat-team/white-bow-cat-pm/white-bow-cat-pm_spritesheet_alpha_raw.png`
- `assets/characters/kawaii-cat-team/white-bow-cat-pm/white-bow-cat-pm_spritesheet_alpha_raw_v2.png`
- `assets/characters/kawaii-cat-team/white-bow-cat-pm/white-bow-cat-pm_spritesheet_alpha_raw_v3.png`

标准化文件：

- `assets/characters/kawaii-cat-team/white-bow-cat-pm/white-bow-cat-pm_spritesheet.png`
- `assets/characters/kawaii-cat-team/white-bow-cat-pm/white-bow-cat-pm_spritesheet.json`

动作行文件：

- `white-bow-cat-pm_idle.png`
- `white-bow-cat-pm_walk_down.png`
- `white-bow-cat-pm_walk_up.png`
- `white-bow-cat-pm_walk_left.png`
- `white-bow-cat-pm_walk_right.png`
- `white-bow-cat-pm_planning.png`
- `white-bow-cat-pm_working.png`
- `white-bow-cat-pm_verifying.png`
- `white-bow-cat-pm_blocked.png`
- `white-bow-cat-pm_done.png`

每个动作行都有对应 `.json` metadata。

### 3.2 验证结果

通过：

- 4 列 x 10 行动作结构可生成。
- Chroma-key 背景可转为 alpha 通道。
- 可标准化为 1024x2560，总体对应 256x256 帧。
- 可自动拆分成每个 action 的 1024x256 行图。
- 可生成 PixiJS 需要的基础 metadata。

未通过生产级标准：

- 角色边缘仍有绿色描边残留。
- 固定 256x256 网格裁切后，部分 96px 预览帧边界不够干净。
- 当前素材可用于流程验证，不建议直接扩展到其他角色。

预览文件：

- `assets/review/spritesheets/white-bow-cat-pm_action_preview_96.png`

## 4. 当前决策

不进入 `beaver-builder` 和 `mini-cat-subagent` 扩展，也不进入 B1。

原因：

- 第 1、2 步已完成。
- 第 3 步已跑通流程，但视觉质量未达到生产级。
- 按计划第 4 步需要在验证通过后才扩展；当前只能算流程验证通过，素材质量未完全通过。

## 4.1 Idle 动作返工结果

返工文件：

- `assets/characters/kawaii-cat-team/white-bow-cat-pm/white-bow-cat-pm_idle_refined.png`
- `assets/characters/kawaii-cat-team/white-bow-cat-pm/white-bow-cat-pm_idle_refined.json`
- `assets/review/spritesheets/white-bow-cat-pm_idle_refined_row_96.png`

处理方式：

- 逐动作生成 4 帧横行动作。
- 使用洋红色 chroma-key 背景。
- 用 ImageMagick 去背景。
- 对 alpha 边缘执行 1px edge contract，减少 chroma halo。

结论：

- `idle` 动作通过 96px 预览，可作为 MVP 候选素材。
- 旧的大 spritesheet 仍保留为流程证据，但不作为生产级素材继续扩展。
- 下一步应按同样流程生成 `walk_down`，再依次验证四方向移动。

## 4.2 Walk Down 动作返工结果

返工文件：

- `assets/characters/kawaii-cat-team/white-bow-cat-pm/white-bow-cat-pm_walk_down_refined.png`
- `assets/characters/kawaii-cat-team/white-bow-cat-pm/white-bow-cat-pm_walk_down_refined.json`
- `assets/review/spritesheets/white-bow-cat-pm_walk_down_refined_row_96.png`
- `assets/review/spritesheets/white-bow-cat-pm_idle_walk_down_compare_96.png`

处理方式：

- 逐动作生成 4 帧横行动作。
- 使用洋红色 chroma-key 背景。
- 用 ImageMagick 去背景。
- 对 alpha 边缘执行 1px edge contract。
- 与 `idle_refined` 做 96px 对比预览。

结论：

- `walk_down` 动作通过 96px 预览，可作为 MVP 候选素材。
- 角色比例、服装和身份与 `idle_refined` 基本一致。
- 下一步应按同样流程生成 `walk_up`。

## 4.3 Walk Up 动作返工结果

返工文件：

- `assets/characters/kawaii-cat-team/white-bow-cat-pm/white-bow-cat-pm_walk_up_refined.png`
- `assets/characters/kawaii-cat-team/white-bow-cat-pm/white-bow-cat-pm_walk_up_refined.json`
- `assets/review/spritesheets/white-bow-cat-pm_walk_up_refined_row_96.png`
- `assets/review/spritesheets/white-bow-cat-pm_idle_walk_down_walk_up_compare_96.png`

处理方式：

- 逐动作生成 4 帧横行动作。
- 使用洋红色 chroma-key 背景。
- 用 ImageMagick 去背景。
- 对 alpha 边缘执行 1px edge contract。
- 与 `idle_refined`、`walk_down_refined` 做 96px 对比预览。

结论：

- `walk_up` 动作通过 96px 预览，可作为 MVP 候选素材。
- 背向行走方向清楚，和已有正向动作比例一致。
- 下一步应按同样流程生成 `walk_left`。

## 4.4 Walk Left 动作返工结果

返工文件：

- `assets/characters/kawaii-cat-team/white-bow-cat-pm/white-bow-cat-pm_walk_left_refined.png`
- `assets/characters/kawaii-cat-team/white-bow-cat-pm/white-bow-cat-pm_walk_left_refined.json`
- `assets/review/spritesheets/white-bow-cat-pm_walk_left_refined_row_96.png`
- `assets/review/spritesheets/white-bow-cat-pm_idle_walk_down_walk_up_walk_left_compare_96.png`

处理方式：

- 逐动作生成 4 帧横行动作。
- 使用洋红色 chroma-key 背景。
- 用 ImageMagick 去背景。
- 对 alpha 边缘执行 1px edge contract。
- 与 `idle_refined`、`walk_down_refined`、`walk_up_refined` 做 96px 对比预览。

结论：

- `walk_left` 动作通过 96px 预览，可作为 MVP 候选素材。
- 侧向左行动作方向清楚，比例与已有动作基本一致。
- 下一步应按同样流程生成 `walk_right`。

## 4.5 Walk Right 动作返工结果

返工文件：

- `assets/characters/kawaii-cat-team/white-bow-cat-pm/white-bow-cat-pm_walk_right_refined.png`
- `assets/characters/kawaii-cat-team/white-bow-cat-pm/white-bow-cat-pm_walk_right_refined.json`
- `assets/review/spritesheets/white-bow-cat-pm_walk_right_refined_row_96.png`
- `assets/review/spritesheets/white-bow-cat-pm_movement_compare_96.png`

处理方式：

- 逐动作生成 4 帧横行动作。
- 使用洋红色 chroma-key 背景。
- 用 ImageMagick 去背景。
- 对 alpha 边缘执行 1px edge contract。
- 与 `idle_refined` 和其他方向移动做 96px 对比预览。

结论：

- `walk_right` 动作通过 96px 预览，可作为 MVP 候选素材。
- `idle` 和四方向移动已全部通过基础预览。

## 4.6 Movement Spritesheet

汇总文件：

- `assets/characters/kawaii-cat-team/white-bow-cat-pm/white-bow-cat-pm_movement_spritesheet.png`
- `assets/characters/kawaii-cat-team/white-bow-cat-pm/white-bow-cat-pm_movement_spritesheet.json`
- `assets/review/spritesheets/white-bow-cat-pm_movement_compare_96.png`

规格：

- 尺寸：1024x1280
- 帧尺寸：256x256
- 布局：4 列 x 5 行
- 行顺序：`idle`、`walk_down`、`walk_up`、`walk_left`、`walk_right`

结论：

- 白猫基础移动动作集可用于 MVP 原型验证。
- 下一步进入 `planning`、`working`、`verifying`、`blocked`、`done` 非移动动作补齐。

## 4.7 Planning 动作返工结果

返工文件：

- `assets/characters/kawaii-cat-team/white-bow-cat-pm/white-bow-cat-pm_planning_refined.png`
- `assets/characters/kawaii-cat-team/white-bow-cat-pm/white-bow-cat-pm_planning_refined.json`
- `assets/review/spritesheets/white-bow-cat-pm_planning_refined_row_96.png`
- `assets/review/spritesheets/white-bow-cat-pm_movement_planning_compare_96.png`

处理方式：

- 逐动作生成 4 帧横行动作。
- 使用洋红色 chroma-key 背景。
- 用 ImageMagick 去背景。
- 对 alpha 边缘执行 1px edge contract。
- 与 movement set 做 96px 对比预览。

结论：

- `planning` 动作通过 96px 预览，可作为 MVP 候选素材。
- 动作含义清楚，能和 `idle` 区分。
- 下一步应按同样流程生成 `working`。

## 4.8 Working 动作返工结果

返工文件：

- `assets/characters/kawaii-cat-team/white-bow-cat-pm/white-bow-cat-pm_working_refined.png`
- `assets/characters/kawaii-cat-team/white-bow-cat-pm/white-bow-cat-pm_working_refined.json`
- `assets/review/spritesheets/white-bow-cat-pm_working_refined_row_96.png`
- `assets/review/spritesheets/white-bow-cat-pm_movement_planning_working_compare_96.png`

处理方式：

- 逐动作生成 4 帧横行动作。
- 使用洋红色 chroma-key 背景。
- 用 ImageMagick 去背景。
- 对 alpha 边缘执行 1px edge contract。
- 与 movement set 和 `planning_refined` 做 96px 对比预览。

结论：

- `working` 动作通过 96px 预览，可作为 MVP 候选素材。
- 桌面电脑道具让工作状态易读，适合首屏任务执行态展示。
- 下一步应按同样流程生成 `verifying`。

## 4.9 Verifying 动作返工结果

返工文件：

- `assets/characters/kawaii-cat-team/white-bow-cat-pm/white-bow-cat-pm_verifying_refined.png`
- `assets/characters/kawaii-cat-team/white-bow-cat-pm/white-bow-cat-pm_verifying_refined.json`
- `assets/review/spritesheets/white-bow-cat-pm_verifying_refined_row_96.png`
- `assets/review/spritesheets/white-bow-cat-pm_movement_planning_working_verifying_compare_96.png`

处理方式：

- 逐动作生成 4 帧横行动作。
- 使用洋红色 chroma-key 背景。
- 用 ImageMagick 去背景。
- 先整体 trim 到内容区域，再居中扩展为 4:1 行图，避免强制拉伸原始 2:1 画布。
- 对 alpha 边缘执行 1px edge contract。
- 与 movement set、`planning_refined`、`working_refined` 做 96px 对比预览。

结论：

- `verifying` 动作通过 96px 预览，可作为 MVP 候选素材。
- 清单、放大镜、打勾和确认手势能表达验证状态。
- 下一步应按同样流程生成 `blocked`。

## 4.10 Blocked 动作返工结果

返工文件：

- `assets/characters/kawaii-cat-team/white-bow-cat-pm/white-bow-cat-pm_blocked_refined.png`
- `assets/characters/kawaii-cat-team/white-bow-cat-pm/white-bow-cat-pm_blocked_refined.json`
- `assets/review/spritesheets/white-bow-cat-pm_blocked_refined_row_96.png`
- `assets/review/spritesheets/white-bow-cat-pm_movement_planning_working_verifying_blocked_compare_96.png`

处理方式：

- 逐动作生成 4 帧横行动作。
- 使用洋红色 chroma-key 背景。
- 用 ImageMagick 去背景。
- 先整体 trim 到内容区域，再居中扩展为 4:1 行图。
- 对 alpha 边缘执行 1px edge contract。
- 与 movement set、`planning_refined`、`working_refined`、`verifying_refined` 做 96px 对比预览。

结论：

- `blocked` 动作通过 96px 预览，可作为 MVP 候选素材。
- 问号、警告、停止和求助姿态能表达阻塞状态。
- 下一步应按同样流程生成 `done`。

## 4.11 Done 动作返工结果

返工文件：

- `assets/characters/kawaii-cat-team/white-bow-cat-pm/white-bow-cat-pm_done_refined.png`
- `assets/characters/kawaii-cat-team/white-bow-cat-pm/white-bow-cat-pm_done_refined.json`
- `assets/review/spritesheets/white-bow-cat-pm_done_refined_row_96.png`

处理方式：

- 逐动作生成 4 帧横行动作。
- 使用洋红色 chroma-key 背景。
- 用 ImageMagick 去背景。
- 先整体 trim 到内容区域，再居中扩展为 4:1 行图。
- 对 alpha 边缘执行 1px edge contract。

结论：

- `done` 动作通过 96px 预览，可作为 MVP 候选素材。
- 完成清单、交付物、庆祝和确认手势能表达完成状态。

## 4.12 MVP Spritesheet 汇总

汇总文件：

- `assets/characters/kawaii-cat-team/white-bow-cat-pm/white-bow-cat-pm_mvp_spritesheet.png`
- `assets/characters/kawaii-cat-team/white-bow-cat-pm/white-bow-cat-pm_mvp_spritesheet.json`
- `assets/review/spritesheets/white-bow-cat-pm_mvp_spritesheet_compare_96.png`

规格：

- 尺寸：1024x2560
- 帧尺寸：256x256
- 布局：4 列 x 10 行
- 行顺序：`idle`、`walk_down`、`walk_up`、`walk_left`、`walk_right`、`planning`、`working`、`verifying`、`blocked`、`done`

结论：

- `white-bow-cat-pm` 完整 MVP 动作集已通过 96px 预览。
- 下一步扩展到 `beaver-builder`，先复用同一管线验证 `idle` 动作。

## 4.13 Beaver Builder Idle 扩展结果

返工文件：

- `assets/characters/animal-agent-team/beaver-builder/beaver-builder_idle_refined.png`
- `assets/characters/animal-agent-team/beaver-builder/beaver-builder_idle_refined.json`
- `assets/review/spritesheets/beaver-builder_idle_refined_row_96.png`
- `assets/review/spritesheets/white-cat-mvp_beaver-builder-idle_compare_96.png`

处理方式：

- 逐动作生成 4 帧横行动作。
- 使用洋红色 chroma-key 背景。
- 用 ImageMagick 去背景。
- 先整体 trim 到内容区域，再居中扩展为 4:1 行图。
- 对 alpha 边缘执行 1px edge contract。
- 与白猫完整 MVP 动作集做 96px 对比预览。

结论：

- `beaver-builder_idle` 动作通过 96px 预览，可作为第二个角色的候选素材。
- 笔记本、扳手、工装和尾巴能明确表达执行工程师身份。
- 下一步应按同样流程生成 `beaver-builder_walk_down`。

## 4.14 Beaver Builder Walk Down 扩展结果

返工文件：

- `assets/characters/animal-agent-team/beaver-builder/beaver-builder_walk_down_refined.png`
- `assets/characters/animal-agent-team/beaver-builder/beaver-builder_walk_down_refined.json`
- `assets/review/spritesheets/beaver-builder_walk_down_refined_row_96.png`
- `assets/review/spritesheets/beaver-builder_idle_walk_down_compare_96.png`

处理方式：

- 逐动作生成 4 帧横行动作。
- 使用洋红色 chroma-key 背景。
- 用 ImageMagick 去背景。
- 先整体 trim 到内容区域，再居中扩展为 4:1 行图。
- 对 alpha 边缘执行 1px edge contract。
- 与 `beaver-builder_idle_refined` 做 96px 对比预览。

结论：

- `beaver-builder_walk_down` 动作通过 96px 预览，可作为第二个角色的候选素材。
- 正面步态可读，工具没有遮挡腿部。
- 下一步应按同样流程生成 `beaver-builder_walk_up`。

## 4.15 Beaver Builder Walk Up 扩展结果

返工文件：

- `assets/characters/animal-agent-team/beaver-builder/beaver-builder_walk_up_refined.png`
- `assets/characters/animal-agent-team/beaver-builder/beaver-builder_walk_up_refined.json`
- `assets/review/spritesheets/beaver-builder_walk_up_refined_row_96.png`
- `assets/review/spritesheets/beaver-builder_idle_walk_down_up_compare_96.png`

处理方式：

- 逐动作生成 4 帧横行动作。
- 使用洋红色 chroma-key 背景。
- 用 ImageMagick 去背景。
- 先整体 trim 到内容区域，再居中扩展为 4:1 行图。
- 对 alpha 边缘执行 1px edge contract。
- 与 `idle`、`walk_down` 做 96px 对比预览。

结论：

- `beaver-builder_walk_up` 动作通过 96px 预览，可作为第二个角色的候选素材。
- 背向移动方向清楚，尾巴和工装背带在 96px 下仍可读。
- 下一步应按同样流程生成 `beaver-builder_walk_left`。

## 4.16 Beaver Builder Walk Left 扩展结果

返工文件：

- `assets/characters/animal-agent-team/beaver-builder/beaver-builder_walk_left_refined.png`
- `assets/characters/animal-agent-team/beaver-builder/beaver-builder_walk_left_refined.json`
- `assets/review/spritesheets/beaver-builder_walk_left_refined_row_96.png`
- `assets/review/spritesheets/beaver-builder_movement_left_compare_96.png`

处理方式：

- 逐动作生成 4 帧横行动作。
- 使用洋红色 chroma-key 背景。
- 用 ImageMagick 去背景。
- 先整体 trim 到内容区域，再居中扩展为 4:1 行图。
- 对 alpha 边缘执行 1px edge contract。
- 与 `idle`、`walk_down`、`walk_up` 做 96px 对比预览。

结论：

- `beaver-builder_walk_left` 动作通过 96px 预览，可作为第二个角色的候选素材。
- 左向侧身轮廓、尾巴和随身工具都清楚。
- 下一步应按同样流程生成 `beaver-builder_walk_right`。

## 4.17 Beaver Builder Walk Right 扩展结果

返工文件：

- `assets/characters/animal-agent-team/beaver-builder/beaver-builder_walk_right_refined.png`
- `assets/characters/animal-agent-team/beaver-builder/beaver-builder_walk_right_refined.json`
- `assets/review/spritesheets/beaver-builder_walk_right_refined_row_96.png`
- `assets/review/spritesheets/beaver-builder_movement_compare_96.png`

处理方式：

- 逐动作生成 4 帧横行动作。
- 使用洋红色 chroma-key 背景。
- 用 ImageMagick 去背景。
- 先整体 trim 到内容区域，再居中扩展为 4:1 行图。
- 对 alpha 边缘执行 1px edge contract。
- 与 `idle`、`walk_down`、`walk_up`、`walk_left` 做 96px 对比预览。

结论：

- `beaver-builder_walk_right` 动作通过 96px 预览，可作为第二个角色的候选素材。
- 右向侧身轮廓清楚，和 `walk_left` 形成可用的方向对。

## 4.18 Beaver Builder Movement Spritesheet

汇总文件：

- `assets/characters/animal-agent-team/beaver-builder/beaver-builder_movement_spritesheet.png`
- `assets/characters/animal-agent-team/beaver-builder/beaver-builder_movement_spritesheet.json`
- `assets/review/spritesheets/beaver-builder_movement_compare_96.png`

规格：

- 尺寸：1024x1280
- 帧尺寸：256x256
- 布局：4 列 x 5 行
- 行顺序：`idle`、`walk_down`、`walk_up`、`walk_left`、`walk_right`

结论：

- `beaver-builder` 基础移动动作集可用于 MVP 原型验证。
- 下一步验收并整合子 agent 生成的任务状态动作。

## 4.19 Beaver Builder 状态动作扩展结果

返工文件：

- `assets/characters/animal-agent-team/beaver-builder/beaver-builder_planning_refined.png`
- `assets/characters/animal-agent-team/beaver-builder/beaver-builder_planning_refined.json`
- `assets/characters/animal-agent-team/beaver-builder/beaver-builder_working_refined.png`
- `assets/characters/animal-agent-team/beaver-builder/beaver-builder_working_refined.json`
- `assets/characters/animal-agent-team/beaver-builder/beaver-builder_verifying_refined.png`
- `assets/characters/animal-agent-team/beaver-builder/beaver-builder_verifying_refined.json`
- `assets/characters/animal-agent-team/beaver-builder/beaver-builder_blocked_refined.png`
- `assets/characters/animal-agent-team/beaver-builder/beaver-builder_blocked_refined.json`
- `assets/characters/animal-agent-team/beaver-builder/beaver-builder_done_refined.png`
- `assets/characters/animal-agent-team/beaver-builder/beaver-builder_done_refined.json`
- `assets/review/spritesheets/beaver-builder_status_compare_96.png`

处理方式：

- 使用多个子 agent 并行生成状态动作资产。
- 主 agent 统一验收 JSON、尺寸和 96px 预览，并补齐 `done` 元数据。
- 所有状态动作保持 1024x256 行图、4 帧、256x256 单帧规格。

结论：

- `planning`、`working`、`verifying`、`blocked`、`done` 均通过 96px 预览。
- `done` 子 agent 曾在最终回报阶段报错，但 PNG 和预览产物有效，主 agent 已补齐 JSON 并纳入统一验收。

## 4.20 Beaver Builder MVP Spritesheet 汇总

汇总文件：

- `assets/characters/animal-agent-team/beaver-builder/beaver-builder_mvp_spritesheet.png`
- `assets/characters/animal-agent-team/beaver-builder/beaver-builder_mvp_spritesheet.json`
- `assets/review/spritesheets/beaver-builder_mvp_spritesheet_compare_96.png`

规格：

- 尺寸：1024x2560
- 帧尺寸：256x256
- 布局：4 列 x 10 行
- 行顺序：`idle`、`walk_down`、`walk_up`、`walk_left`、`walk_right`、`planning`、`working`、`verifying`、`blocked`、`done`

结论：

- `beaver-builder` 完整 MVP 动作集已通过 96px 预览。
- 并行子 agent 适合继续用于“同规格、不同角色/动作”的素材批量生产，但主 agent 需要统一验收和同步文档。

## 4.21 Mini Cat Subagent Idle 结果

返工文件：

- `assets/characters/kawaii-cat-team/mini-cat-subagent/mini-cat-subagent_idle_refined.png`
- `assets/characters/kawaii-cat-team/mini-cat-subagent/mini-cat-subagent_idle_refined.json`
- `assets/review/spritesheets/mini-cat-subagent_idle_refined_row_96.png`

处理方式：

- 逐动作生成 4 帧横行动作。
- 使用洋红色 chroma-key 背景。
- 用 ImageMagick 去背景。
- 按帧单独裁切、trim、缩放到最大 192x192，再放入 256x256 帧底部居中，保证 subagent 体量小于主角色。
- 对 alpha 边缘执行 1px edge contract。

结论：

- `mini-cat-subagent_idle` 动作通过 96px 预览，可作为第三个 MVP 角色的基准素材。
- 下一步等待并验收子 agent 并行生成的移动、搬任务、协作和完成动作。

## 4.22 Mini Cat Subagent 完整动作集结果

返工文件：

- `assets/characters/kawaii-cat-team/mini-cat-subagent/mini-cat-subagent_movement_spritesheet.png`
- `assets/characters/kawaii-cat-team/mini-cat-subagent/mini-cat-subagent_movement_spritesheet.json`
- `assets/characters/kawaii-cat-team/mini-cat-subagent/mini-cat-subagent_carry_task_refined.png`
- `assets/characters/kawaii-cat-team/mini-cat-subagent/mini-cat-subagent_carry_task_refined.json`
- `assets/characters/kawaii-cat-team/mini-cat-subagent/mini-cat-subagent_working_refined.png`
- `assets/characters/kawaii-cat-team/mini-cat-subagent/mini-cat-subagent_working_refined.json`
- `assets/characters/kawaii-cat-team/mini-cat-subagent/mini-cat-subagent_done_refined.png`
- `assets/characters/kawaii-cat-team/mini-cat-subagent/mini-cat-subagent_done_refined.json`
- `assets/characters/kawaii-cat-team/mini-cat-subagent/mini-cat-subagent_mvp_spritesheet.png`
- `assets/characters/kawaii-cat-team/mini-cat-subagent/mini-cat-subagent_mvp_spritesheet.json`
- `assets/review/spritesheets/mini-cat-subagent_mvp_spritesheet_compare_96.png`

处理方式：

- 移动动作和 `done` 由子 agent 并行生成，主 agent 统一验收。
- `carry_task` 和 `working` 子任务长时间未落盘，主 agent 本地接手生成。
- 所有 mini subagent 动作按帧单独处理，角色本体缩放到最大 192x192 后放入 256x256 帧，保持 subagent 体量。
- 最终合并 8 行完整 spritesheet。

规格：

- 尺寸：1024x2048
- 帧尺寸：256x256
- 布局：4 列 x 8 行
- 行顺序：`idle`、`walk_down`、`walk_up`、`walk_left`、`walk_right`、`carry_task`、`working`、`done`

结论：

- `mini-cat-subagent` 完整 MVP 动作集已通过 96px 预览。
- 当前三角色素材闭环完成：`white-bow-cat-pm`、`beaver-builder`、`mini-cat-subagent`。
- 下一步进入 B1 初始化 Tauri 2 + React + PixiJS 项目骨架。

## 5. D 阶段素材补齐结果

本轮目标：

1. 补齐第一批 tile 与家具资产。
2. 将动物 agent 团队和原创猫咪团队立绘正式落到角色目录。
3. 将 6 个主角色扩展到可播放动作素材，其中新增角色先使用 playable proxy spritesheet。
4. 为 6 个主角色补 handoff、summon_subagent、merge_result 进阶动作素材。

生成方式：

- 使用 built-in imagegen 生成 `assets/source/imagegen/` 下的 atlas 源图。
- 使用 `scripts/complete-d-assets.mjs` 通过 ImageMagick 切图、chroma 去底、1px alpha edge contract、生成 metadata 和预览。
- `white-bow-cat-pm`、`beaver-builder`、`mini-cat-subagent` 继续使用已有精修动作集；新增角色先使用立绘派生的 playable proxy 动作集。

关键文件：

- `assets/d_stage_manifest.json`
- `assets/scene/tiles/tiles_manifest.json`
- `assets/scene/props/props_manifest.json`
- `assets/review/d/d1_tile_prop_contact_sheet.png`
- `assets/review/d/d2_d3_portrait_contact_sheet_96.png`
- `assets/review/d/d4_mvp_proxy_spritesheets_contact_sheet.png`
- `assets/review/d/d4_advanced_actions_contact_sheet.png`

结论：

- D1 第一批 tile / 家具资产完成，可进入 PixiJS 装饰层接入。
- D2 / D3 立绘完成，角色扩展不再依赖单张团队概念图。
- D4.3 完成到 6 个主角色可播放动作素材；新增 4 个主角色为 playable proxy，后续可逐个替换为手工精修 action rows。
- D4.5 完成 6 个主角色进阶动作素材；下一步需要把进阶动作接入 demo flow。

## 5.1 E1.1 PixiJS 装饰层接入结果

完成内容：

- 新增 `assets/scene/decorations/scene_decorations.json`，用独立摆放清单管理 D 阶段 tile / prop 在园区地图中的位置、缩放、透明度、锚点和层级。
- `src/data/assets.ts` 从 `assets/d_stage_manifest.json` 构建运行时 decoration asset 表，并映射到 Vite 可打包的 PNG URL。
- `src/scene/SceneCanvas.tsx` 增加 PixiJS 静态 decoration layer，加载 tile / prop 纹理并渲染到背景之上、agent 之下。
- 桌面窗口 QA 截图：`assets/review/app/agentword_e1_decoration_layer_qa.png`。

结论：

- D1 tile / prop 已能进入运行时场景，不再只是预览图资产。
- 装饰层当前只做只读增强，不影响房间热点、agent 点击、拖拽缩放和事件反馈。
- Floor tile 的透明度已压低，避免在高缩放下形成过重的方块覆盖。

## 5.2 E1.2 阵容密度验证结果

完成内容：

- 新增 `sceneDensityMode` 偏好，支持 `live` 和 `readability` 两种场景密度模式。
- 左侧基础监控区新增「阵容」开关，开启后显示 `6 + mini` demo roster。
- `sceneLayout` 增加 readability 固定摆位：6 个主角色和 mini subagent 被放到执行室 / 阻塞室附近，真实进程 agent 被缩小并压到监控墙，避免干扰可读性验证。
- 浏览器 QA 截图：`assets/review/app/agentword_e1_2_density_mode_qa.png`。

结论：

- 6 个主角色 + mini subagent 在 112% 左右视角下可以同屏看清。
- 角色阵容模式不改任务数据，只改地图摆位、缩放和运行时偏好，因此可以作为后续 12 / 24 / 30 agent 压力档位的基础。

## 5.3 E1.3 进阶动作接入结果

完成内容：

- `src/data/assets.ts` 注册 6 个主角色的 advanced spritesheet，保留 MVP spritesheet 负责常规移动和任务状态动作。
- `SceneEventType` 与 `AgentAction` 增加 `handoff`、`summon_subagent`、`merge_result`。
- demo flow 在任务进入执行 / 验证节点时生成进阶动作事件：无 subagent 的执行节点触发 `handoff`，带 subagent 的执行节点触发 `summon_subagent`，验证节点触发 `merge_result`。
- `src/scene/SceneCanvas.tsx` 增加短时 action override，事件 actor 有 advanced frames 时会临时播放进阶动作，同时保留任务移动、事件反馈和 mini subagent 路线效果。
- QA 截图：`assets/review/app/agentword_e1_3_advanced_actions_qa.png`。

结论：

- D4.5 进阶动作不再只停留在预览 contact sheet，已经进入运行时 demo flow。
- 进阶动作作为事件驱动的短时覆盖层实现，没有改变角色常规 MVP 动作表，因此后续替换某个角色的精修动作素材时影响面较小。
- 当前触发源仍是 demo flow；真实 agent 状态进入更细颗粒度后，可以复用同一套事件类型。

## 5.4 E1.4 素材质量报告结果

完成内容：

- 新增 `scripts/report-d-asset-quality.mjs`，并通过 `pnpm asset:quality` 运行。
- 对 `assets/d_stage_manifest.json` 中的 41 个资产记录做尺寸和透明边缘检查。
- 对 spritesheet 按 action frame 逐帧检查外圈 1px 边缘，不只检查整张 sheet 外边界。
- 生成 64px / 96px 批量缩放 contact sheet，共覆盖 89 个预览样本。

输出文件：

- `assets/review/d/e1_4_asset_quality_report.md`
- `assets/review/d/e1_4_asset_quality_report.json`
- `assets/review/d/e1_4_scale_64_contact_sheet.png`
- `assets/review/d/e1_4_scale_96_contact_sheet.png`

结论：

- 34 个需要透明边缘的资产通过。
- 7 个 tile 资产只报告边缘占用，不作为失败项，因为 tile 允许铺满 128px frame。
- 失败项为 0，D 阶段资产可以继续进入压力模式和后续场景扩展。

## 5.5 E1.5 阵容压力档位结果

完成内容：

- `SceneDensityMode` 扩展为 `live`、`readability`、`stress12`、`stress24`、`stress30`。
- 左侧「阵容」设置从二态开关升级为选择器，可切换 live、6 + mini、12、24、30。
- `sceneLayout` 新增压力模式布局，复用 6 个主角色 + mini subagent 的模板，在执行室、规划室、阻塞处理室、验证室、归档室和主路径周围生成场景层复制体。
- 压力模式只影响 PixiJS 场景层和左侧 roster 文案，不写回任务数据，也不覆盖真实进程 agent。
- 30 agent 档位默认自动缩放到 82%，用于观察最大密度下的可读性。

输出文件：

- `assets/review/app/agentword_e1_5_density_tiers_qa.png`

验证结果：

- Playwright 切换 `stress12`、`stress24`、`stress30` 后，左侧 agent 计数分别显示 12、24、30。
- `demo roster` 分别显示 `12 agents`、`24 agents`、`30 agents`。
- 浏览器控制台错误 0、警告 0。

结论：

- 12 / 24 / 30 agent 压力档位已经可以支撑后续可读性和性能观察。
- 30 agent 下角色仍能辨认大体位置和状态，但后续如果要把它变成真实监控模式，需要另做聚合、分组或热力层，避免任务数据和视觉压力测试混在一起。

## 5.6 E1.6 真实 agent 进阶动作触发结果

完成内容：

- 在真实进程扫描成功后，对比上一轮真实 agent 和下一轮真实 agent。
- 新增或恢复的 Codex / Claude 真实会话会生成进阶动作事件。
- `codex_app_server` 映射为 `summon_subagent`，其余真实会话新增 / 恢复映射为 `handoff`。
- 工作区、窗口或任务来源短标签变化时，生成 `handoff` 事件，表示真实会话上下文发生交接。
- 真实会话从 `live` 进入 `stale` 或 `gone` 时，生成 `merge_result` 事件，表示场景开始回收或归档该会话。

隐私边界：

- 事件消息只显示进程类别展示名，例如 `Codex CLI`、`Claude CLI`。
- 不写入 PID、完整命令、完整路径或终端正文。
- 真实 agent 的详细窗口 / 工作区 / PID 仍受左侧隐私模式控制。

结论：

- 进阶动作不再只来自 demo flow，真实 Codex / Claude 会话的生命周期也能驱动地图反馈。
- 当前规则保持保守，只基于进程级生命周期和短标签变化；后续如需更细粒度任务语义，需要用户授权更明确的数据来源。

## 5.7 E1.7 地图动作来源说明结果

完成内容：

- `TaskDetails` 新增「地图动作」追踪块。
- 任务详情会从当前任务的 `eventIds` 中列出最多 5 条地图动作来源。
- 真实 Session 详情会从 `actorId` 匹配该真实 agent 的事件，展示真实会话触发的地图动作。
- 每条记录展示事件类型、时间、actor 和对应地图反馈说明，例如 `handoff` 对应交接动作、`subagent_spawned` 对应 mini subagent 出发路线。
- 真实 agent actor 文案剥离 `#PID`，找不到 actor 时不会回退展示 `real-agent-*` id，避免泄露 PID 或进程标识。

输出文件：

- `assets/review/app/agentword_e1_7_map_action_trace_qa.png`

结论：

- 看板右侧详情已经能解释地图反馈来自哪条事件，不再只能从事件流和地图动画之间靠记忆关联。
- 当前说明是只读解释；后续可以继续加“点击事件定位 actor / 房间”的交互。

## 5.8 E1.8 30 agent 性能采样结果

完成内容：

- `SceneCanvas` 在 `stress30` 阵容模式下启用轻量性能采样。
- PixiJS ticker 每约 1.2s 汇总一次采样，不进行逐帧 React state 更新。
- 采样指标包含 FPS、平均 frame ms、当前 agent sprite 数、事件效果数和 subagent route 效果数。
- 场景顶部新增性能 chip，只在 `stress30` 模式显示；离开 `stress30` 后清空采样显示。
- FPS 低于 50 或平均 frame ms 高于 20 时，性能 chip 切换为 watch 状态。

输出文件：

- `assets/review/app/agentword_e1_8_perf_sample_qa.png`

QA 观察：

- 桌面浏览器 QA 中，`stress30` 模式采样显示 `120 fps`、`8.3 ms`、`30 sprites`。
- 浏览器控制台错误 0、警告 0。

结论：

- 30 agent 压力档位现在有可见的运行时观测入口，可以在不接入外部 profiler 的情况下快速判断 PixiJS 场景是否明显掉帧。
- 当前采样不写入持久化状态，只服务于视觉压力验证。

## 5.9 E1.9 真实 agent 事件规则配置化结果

完成内容：

- 新增 `src/monitor/realAgentEventRules.ts`，将真实 agent 生命周期事件从 store 中抽为规则预设。
- 新增 `realAgentEventRuleMode` 偏好，支持 `balanced`、`quiet`、`subagent-heavy` 三种规则模式。
- 左侧基础监控设置新增「规则」下拉选择，用户可在默认、安静、协作+ 之间切换。
- 真实进程扫描仍只使用进程级生命周期、窗口 / 工作区 / 来源短标签，不读取终端正文。

QA 观察：

- `pnpm typecheck` 通过。
- 事件规则逻辑仍保持隐私边界：事件文案不包含 PID、完整路径或终端正文。

结论：

- 真实 agent 事件语义不再写死在 Zustand store 内，后续可以继续加团队级预设或用户自定义配置。

## 5.10 E1.10 真实 session 绑定任务卡结果

完成内容：

- Zustand store 新增 `bindRealAgentToTask` 和 `clearRealAgentTaskBinding`。
- 真实 session 详情中的候选任务从“只推荐”升级为可点击绑定。
- 绑定后会更新任务 `assigneeAgentId`、真实 agent `currentTaskId`，并生成 `handoff` 地图事件。
- 解绑后会清除任务 assignee、真实 agent `currentTaskId`，并生成 `merge_result` 地图事件。
- 真实进程刷新时会保留上一轮 `currentTaskId`，避免刷新后绑定关系立刻丢失。
- 看板和详情中的真实会话名称遵守隐私模式，不在隐私模式下展示 PID。

QA 观察：

- `pnpm typecheck` 通过。
- 绑定 / 解绑事件仍只使用进程级会话标签，不读取终端正文。

结论：

- 真实 Codex / Claude session 已经可以进入任务看板和地图房间，不再只是监控墙里的只读进程。

## 5.11 E1.11 事件点击定位结果

完成内容：

- Zustand store 新增 `focusSceneEvent`，统一处理事件定位逻辑。
- 事件有 actor 时聚焦对应 agent；没有 actor 但有关联任务时聚焦任务所在房间。
- SceneCanvas 新增 `roomFocusRequest` 响应，支持外部请求聚焦房间。
- 左侧全局事件流变为可点击事件按钮。
- 任务详情 / 真实 Session 详情中的「地图动作」卡片变为可点击定位入口。

QA 观察：

- `pnpm typecheck` 通过。
- 点击定位只使用事件已有的 actor / task / room 信息，不增加终端正文读取。

结论：

- “事件 -> 地图反馈 -> 任务详情”的追踪链路已经闭合，用户可以从文字事件直接跳回地图上的角色或房间。

## 5.12 完整桌面验收与可运行版本

完成内容：

- 正式执行 `pnpm typecheck`，TypeScript 类型检查通过。
- 正式执行 `cargo check --manifest-path src-tauri/Cargo.toml`，Rust / Tauri 侧检查通过。
- 正式执行 `pnpm build`，前端生产构建通过。
- 正式执行 `pnpm tauri build`，完成 macOS `.app` 和 `.dmg` 打包。
- 打开 release `.app` 做 smoke 验收，确认窗口能启动，园区地图、左侧监控、右侧任务看板和详情面板可见。

产物：

- `src-tauri/target/release/bundle/macos/agentWord.app`
- `src-tauri/target/release/bundle/dmg/agentWord_0.1.0_aarch64.dmg`

QA 截图：

- `assets/review/app/agentword_release_app_smoke.png`

注意：

- `src-tauri/target/`、`dist/` 和 `node_modules/` 是构建 / 依赖产物，迁移源码仓库时不应作为源码提交；如需要分发可运行包，可单独保留 `.dmg`。
- Vite 构建有大 chunk 提醒，原因是 PixiJS 和大图素材进入主包；当前不阻塞 MVP 运行，后续可用 code splitting 或资源懒加载优化。

## 5.13 真实优先默认启动结果

完成内容：

- 默认关闭 `isDemoFlowEnabled`，首次启动不再自动加载演示 agent、演示任务和演示事件。
- 偏好存储 key 从 `agentword.preferences.v1` 升级到 `agentword.preferences.v2`，避免旧版本保存的“模拟流开启”偏好继续污染新默认体验。
- 关闭模拟流时，Zustand store 会移除非真实 agent、清空演示任务和演示事件，只保留真实会话生命周期事件。
- 左侧监控统计从「场景 / 真实」改为「演示 / 进程」，明确真实扫描是进程级，不等同于正在工作的 agent 数量。
- 看板在没有真实任务绑定时显示「暂无真实任务绑定；开启模拟流可查看演示任务」。

QA 观察：

- `pnpm typecheck` 通过。
- `pnpm build` 通过。
- `pnpm tauri build` 已重新产出包含真实优先默认体验的 `.app` 和 `.dmg`。
- 使用干净 Playwright 浏览器上下文打开 `http://127.0.0.1:5173/`，默认显示 `演示 0`、`进程 0`、`demo roster off`，任务看板为空状态。
- QA 截图：`assets/review/app/agentword_real_first_default_qa.png`。

结论：

- 当前默认体验不再假装有一批开发任务和 agent 正在运行；演示内容需要用户主动点击「模拟流」开启。
- 真实进程数量仍可能高于用户直觉中的“会话数”，因为当前扫描粒度是进程级，会包含 Codex app-server、桌面宿主和不同工作区相关进程。后续可继续做进程聚合。

## 5.14 建议下一步

进入迁移准备：

1. 只迁移 `agentWord/` 源码目录，避免把父级 `autoXhs` 和其他项目状态带入新仓库。
2. 在新仓库确认 `.gitignore` 覆盖 `node_modules/`、`dist/`、`src-tauri/target/`。
3. 迁移后补 `README.md`，写清启动、打包、隐私边界、演示模式和真实进程扫描限制。

## 6. 决策记录

- 2026-05-29：完成无角色场景底图。
- 2026-05-29：完成场景 hotspots 和 room labels JSON。
- 2026-05-29：完成 `white-bow-cat-pm` 动作 spritesheet 流程验证。
- 2026-05-29：因绿色描边和部分帧边界问题，决定暂不扩展到其他角色，先返工白猫动作素材。
- 2026-05-29：完成 `white-bow-cat-pm_idle_refined.png`，逐动作 4 帧行图通过 96px 预览，下一步进入 `walk_down`。
- 2026-05-29：完成 `white-bow-cat-pm_walk_down_refined.png`，逐动作 4 帧行图通过 96px 预览，下一步进入 `walk_up`。
- 2026-05-29：完成 `white-bow-cat-pm_walk_up_refined.png`，逐动作 4 帧行图通过 96px 预览，下一步进入 `walk_left`。
- 2026-05-29：完成 `white-bow-cat-pm_walk_left_refined.png`，逐动作 4 帧行图通过 96px 预览，下一步进入 `walk_right`。
- 2026-05-29：完成 `white-bow-cat-pm_walk_right_refined.png` 和 `white-bow-cat-pm_movement_spritesheet.png`，基础移动动作集通过预览，下一步进入 `planning`。
- 2026-05-29：完成 `white-bow-cat-pm_planning_refined.png`，逐动作 4 帧行图通过 96px 预览，下一步进入 `working`。
- 2026-05-30：完成 `white-bow-cat-pm_working_refined.png`，逐动作 4 帧行图通过 96px 预览，下一步进入 `verifying`。
- 2026-05-30：完成 `white-bow-cat-pm_verifying_refined.png`，逐动作 4 帧行图通过 96px 预览，下一步进入 `blocked`。
- 2026-05-30：完成 `white-bow-cat-pm_blocked_refined.png`，逐动作 4 帧行图通过 96px 预览，下一步进入 `done`。
- 2026-05-30：完成 `white-bow-cat-pm_done_refined.png` 和 `white-bow-cat-pm_mvp_spritesheet.png`，白猫完整 MVP 动作集通过 96px 预览，下一步扩展到 `beaver-builder`。
- 2026-05-30：完成 `beaver-builder_idle_refined.png`，逐动作 4 帧行图通过 96px 预览，下一步进入 `walk_down`。
- 2026-05-30：完成 `beaver-builder_walk_down_refined.png`，逐动作 4 帧行图通过 96px 预览，下一步进入 `walk_up`。
- 2026-05-30：完成 `beaver-builder_walk_up_refined.png`，逐动作 4 帧行图通过 96px 预览，下一步进入 `walk_left`。
- 2026-05-30：完成 `beaver-builder_walk_left_refined.png`，逐动作 4 帧行图通过 96px 预览，下一步进入 `walk_right`。
- 2026-05-30：完成 `beaver-builder_walk_right_refined.png` 和 `beaver-builder_movement_spritesheet.png`，基础移动动作集通过预览，下一步整合任务状态动作。
- 2026-05-30：完成 `beaver-builder_planning/working/verifying/blocked/done_refined.png` 和 `beaver-builder_mvp_spritesheet.png`，beaver 完整 MVP 动作集通过 96px 预览，下一步扩展到 `mini-cat-subagent`。
- 2026-05-30：完成 `mini-cat-subagent_idle_refined.png`，逐动作 4 帧行图通过 96px 预览，下一步验收并行生成的 mini subagent 剩余动作。
- 2026-05-31：完成 `mini-cat-subagent_movement/carry_task/working/done` 和 `mini-cat-subagent_mvp_spritesheet.png`，三角色 MVP 素材闭环完成，下一步进入 B1 项目骨架。
- 2026-05-31：完成 D 阶段素材 backlog，生成第一批 tile / prop、14 个角色立绘、4 个新增主角色 MVP proxy spritesheet 和 6 个主角色进阶动作 spritesheet，下一步进入 E1 素材接入。
- 2026-06-01：完成 E1.1，D 阶段 tile / prop manifest 已接入 PixiJS 静态装饰层，桌面 QA 截图为 `assets/review/app/agentword_e1_decoration_layer_qa.png`，下一步进入 E1.2 角色密度可读性验证。
- 2026-06-01：完成 E1.2，新增 readability 阵容模式和左侧「阵容」开关，6 个主角色 + mini subagent 同屏 QA 截图为 `assets/review/app/agentword_e1_2_density_mode_qa.png`，下一步进入 E1.3 进阶动作接入。
- 2026-06-01：完成 E1.3，demo flow 已触发 `handoff`、`summon_subagent`、`merge_result` 事件，PixiJS 通过短时 action override 播放 6 个主角色 advanced spritesheet；QA 截图为 `assets/review/app/agentword_e1_3_advanced_actions_qa.png`，下一步进入 E1.4 素材透明边缘和缩放报告。
- 2026-06-01：完成 E1.4，新增 `pnpm asset:quality` 质量报告脚本，检查 41 个 D 阶段 manifest 资产，生成 64px / 96px contact sheet，透明边缘失败项为 0；下一步进入 E1.5 阵容压力档位。
- 2026-06-01：完成 E1.5，新增 `stress12` / `stress24` / `stress30` 阵容压力档位，30 agent QA 截图为 `assets/review/app/agentword_e1_5_density_tiers_qa.png`，下一步进入 E1.6 真实 agent 状态触发进阶动作。
- 2026-06-01：完成 E1.6，真实进程扫描已能把新增 / 恢复 / 来源变化 / 退场映射到 `handoff`、`summon_subagent`、`merge_result` 进阶动作事件，下一步进入 E1.7 任务详情解释地图动作来源。
- 2026-06-01：完成 E1.7，任务详情和真实 Session 详情新增「地图动作」追踪块，QA 截图为 `assets/review/app/agentword_e1_7_map_action_trace_qa.png`，下一步进入 E1.8 30 agent 性能采样。
- 2026-06-01：完成 E1.8，`stress30` 模式新增 PixiJS 轻量性能 chip，QA 截图为 `assets/review/app/agentword_e1_8_perf_sample_qa.png`，下一步进入 E1.9 真实 agent 事件规则配置化。
- 2026-06-01：完成 E1.9，真实 agent 生命周期事件抽为 `realAgentEventRules.ts` 规则预设，左侧监控面板新增「规则」选择，下一步进入 E1.10 真实 session 绑定任务卡。
- 2026-06-01：完成 E1.10，真实 Session 详情候选任务可手动绑定 / 解绑，绑定会写入任务 assignee、真实 agent `currentTaskId` 并驱动地图事件，下一步进入 E1.11 事件点击定位。
- 2026-06-01：完成 E1.11，新增 `focusSceneEvent` 与 `roomFocusRequest`，全局事件流和地图动作卡片均可点击定位 actor / 房间，下一步进入完整桌面验收与可运行版本。
- 2026-06-02：完成 E1.12 迁移前验收，`pnpm typecheck`、`pnpm build`、`cargo check --manifest-path src-tauri/Cargo.toml`、`pnpm tauri build` 均通过；release smoke 截图为 `assets/review/app/agentword_release_app_smoke.png`，可运行产物位于 `src-tauri/target/release/bundle/`。
- 2026-06-02：完成 E1.13 真实优先默认启动，首次打开不再自动灌入演示任务 / 演示 agent；左侧统计明确区分「演示」和「进程」，QA 截图为 `assets/review/app/agentword_real_first_default_qa.png`。
