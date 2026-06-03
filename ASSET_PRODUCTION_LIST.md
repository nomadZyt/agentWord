# agentWord Asset Production List

Last updated: 2026-05-29

## 1. 生产目标

这份清单锁定 agentWord 第一批要生产的素材，供图片生成、人工修图、切图、spritesheet 制作和 PixiJS 接入使用。

第一批素材只服务 MVP 首屏：

- 一张可承载交互热点的园区背景。
- 六个核心功能房间和四个辅助区域。
- 动物 agent 团队和原创猫咪 agent 团队各有可用角色。
- 主角色有基础动作集，mini subagent 有简化动作集。
- 状态气泡、任务图标和输出目录命名提前统一。

## 2. 第一批场景资产

### 2.1 必须生成

| Asset ID | 文件名 | 类型 | 用途 | 优先级 |
| --- | --- | --- | --- | --- |
| `scene-camp-concept` | `scene_campus_concept_1920x1280.png` | 概念图 | 确认园区整体风格、房间关系、色彩和氛围 | P0 |
| `scene-camp-base` | `scene_campus_base_1920x1280.png` | 背景图 | MVP PixiJS 首屏背景，可直接放交互热点 | P0 |
| `scene-hotspots` | `scene_campus_hotspots.json` | 坐标数据 | 标记房间矩形、路径点、agent 默认位置 | P0 |
| `scene-room-labels` | `scene_room_labels.json` | 配置数据 | 房间 id、显示名、状态映射、默认图标 | P1 |

### 2.2 背景必须包含的房间

| Room ID | 中文名 | 地图位置建议 | 视觉元素 | 对应状态 |
| --- | --- | --- | --- | --- |
| `room_queue` | 入口队列 | 左侧或左下 | 门、等待线、小任务包裹 | `queued` |
| `room_planning` | 规划室 | 左中或中央偏上 | 任务板、夹板、路线图 | `planning` |
| `room_execution` | 执行室 | 中央最大区域 | 多个电脑工位、终端屏幕 | `running` |
| `room_verification` | 验证室 | 执行室旁边 | 检查台、放大镜、清单 | `verifying` |
| `room_blocked` | 阻塞处理室 | 右上或右侧 | 警示灯、黑黄线、橙红地面 | `blocked` |
| `room_archive` | 归档室 | 右下或底部 | 归档柜、完成章、文件盒 | `done` |

### 2.3 背景必须包含的辅助区域

| Area ID | 中文名 | 用途 |
| --- | --- | --- |
| `garden_path` | 主路径和庭院 | agent 移动路径、视觉缓冲 |
| `rest_area` | 休息区 | idle agent 默认停留 |
| `monitor_wall` | 监控墙 | 显示真实 Codex / Claude 会话数量 |
| `subagent_nest` | subagent 工位 | mini subagent 生成、等待、回收 |

### 2.4 第一批独立 prop

这些 prop 可以先画在背景里；若后续要动态控制，再切成透明 PNG。

- `prop_task_board.png`
- `prop_terminal_station.png`
- `prop_monitor_wall.png`
- `prop_alert_lamp.png`
- `prop_archive_shelf.png`
- `prop_waiting_chair.png`
- `prop_checklist_table.png`
- `prop_subagent_nest.png`

## 3. 第一批角色数量

第一批 MVP 角色锁定为 8 个主角色 + 1 个 mini subagent。

这样做的原因：

- 动物团队能覆盖用户提供的现有团队素材方向。
- 原创猫咪团队能形成项目自己的品牌化主角。
- 8 个主角色足够覆盖规划、执行、验证、阻塞、归档和监控，不会让第一批动作资产爆炸。

### 3.1 动物 agent 团队：4 个主角色

| Character ID | 中文名 | MVP 职能 | 默认房间 | 视觉道具 |
| --- | --- | --- | --- | --- |
| `red-panda-manager` | 小熊猫项目经理 | 任务调度、看板规划 | `room_planning` | 夹板、工牌、任务卡 |
| `beaver-builder` | 海狸工程师 | 执行、构建、改代码 | `room_execution` | 扳手、笔记本电脑 |
| `frog-verifier` | 青蛙验证员 | 测试、验收、检查 | `room_verification` | 清单、打勾牌 |
| `otter-ops` | 水獭运维员 | 阻塞、环境、发布 | `room_blocked` | 工具箱、警报徽章 |

### 3.2 原创猫咪 agent 团队：4 个主角色 + 1 个 subagent

| Character ID | 中文名 | MVP 职能 | 默认房间 | 视觉道具 |
| --- | --- | --- | --- | --- |
| `white-bow-cat-pm` | 白猫项目经理 | 规划、分派、看板 | `room_planning` | 非经典位置蝴蝶结、夹板、工牌 |
| `black-fur-cat-ops` | 黑毛运维猫 | 警报、阻塞、监控 | `room_blocked` | 警示灯、监控徽章 |
| `tea-cat-engineer` | 奶茶工程猫 | 编码、执行、命令处理 | `room_execution` | 电脑、工程背心 |
| `japan-style-cat-verifier` | 日本风验证猫 | 验收、清单、确认 | `room_verification` | 和风外套、御守形状态牌 |
| `mini-cat-subagent` | 迷你猫 subagent | 搬任务、跟随、协作 | `subagent_nest` | 小任务包、文件卡 |

第二批再补：

- `china-style-cat-planner`
- `penguin-runner`
- `owl-planner`
- `rabbit-timer`
- `turtle-archivist`

## 4. 第一批动作清单

### 4.1 主角色动作

每个主角色必须包含 10 个动作文件。

| Action ID | 中文名 | 帧数 | 用途 |
| --- | --- | --- | --- |
| `idle` | 待机 | 4 | 角色没有任务或在房间内停留 |
| `walk_down` | 向下走 | 4 | 地图移动 |
| `walk_up` | 向上走 | 4 | 地图移动 |
| `walk_left` | 向左走 | 4 | 地图移动 |
| `walk_right` | 向右走 | 4 | 地图移动 |
| `planning` | 规划 | 4 | 看板、读任务、分派 subagent |
| `working` | 工作 | 4 | 敲电脑、改代码、执行命令 |
| `verifying` | 验证 | 4 | 拿清单、放大镜、打勾 |
| `blocked` | 阻塞 | 4 | 困惑、警告、等待用户 |
| `done` | 完成 | 4 | 开心、打勾、归档文件 |

### 4.2 Mini subagent 动作

`mini-cat-subagent` 必须包含 8 个动作文件。

| Action ID | 中文名 | 帧数 | 用途 |
| --- | --- | --- | --- |
| `idle` | 待机 | 4 | 在 subagent 工位等待 |
| `walk_down` | 向下走 | 4 | 地图移动 |
| `walk_up` | 向上走 | 4 | 地图移动 |
| `walk_left` | 向左走 | 4 | 地图移动 |
| `walk_right` | 向右走 | 4 | 地图移动 |
| `carry_task` | 搬任务卡 | 4 | 从规划室去执行室 |
| `working` | 协作工作 | 4 | 在执行室辅助 |
| `done` | 回收结果 | 4 | 返回主 agent 或归档室 |

### 4.3 动作生产顺序

不要一次性生成全部角色的全部动作。第一轮先验证流程：

1. `white-bow-cat-pm` 全动作集。
2. `beaver-builder` 全动作集。
3. `mini-cat-subagent` 全动作集。
4. 通过缩放和 PixiJS 试跑后，再扩到其他角色。

## 5. 生成提示词

所有提示词必须满足：

- 不包含真实品牌 logo。
- 不包含文字。
- 不直接使用受保护 IP 名称或完整识别组合。
- 背景透明的角色资产必须写明 `transparent background`。
- 每批图必须强调 consistent scale、consistent outline、same style。

### 5.1 场景概念图

```text
Warm cute top-down 2.5D management game campus for AI agents, cozy rooms connected by garden paths, planning room, execution room, verification room, blocked alert room, archive room, monitor wall, subagent nest, rounded walls, desks with computers, task board, plants, pond, soft green and warm wood palette, thick rounded outlines, clean readable layout, game asset concept art, no text, no logos, no existing IP characters.
```

Negative constraints:

```text
No brand logos, no readable text, no exact copy of reference image, no realistic photo style, no dark cyberpunk style, no cluttered unreadable rooms, no copyrighted characters.
```

### 5.2 可交互背景图

```text
Top-down 2.5D AI agent campus game background, same warm cute style, six clear rooms for queue, planning, execution, verification, blocked alert, archive, plus garden path, rest area, monitor wall, subagent nest, empty walkable paths for small characters, clear room boundaries, soft green and warm wood palette, thick rounded outlines, 1920x1280, no text, no logos, no characters baked into the background.
```

Negative constraints:

```text
No characters, no text labels, no brand logos, no heavy perspective, no dark palette, no noisy decoration blocking character paths, no copyrighted IP.
```

### 5.3 动物团队角色通用提示词

```text
Original cute animal AI agent character, rounded proportions, thick clean outlines, warm top-down management game style, full body, transparent background, consistent scale, simple readable silhouette, holding role-specific work tool, no text, no logos, not based on any existing IP.
```

Role details:

- `red-panda-manager`: project manager, clipboard, task cards, calm leader expression.
- `beaver-builder`: builder engineer, laptop and small wrench, focused working expression.
- `frog-verifier`: verifier, checklist and green check badge, careful expression.
- `otter-ops`: operations engineer, toolbox and alert badge, ready to fix blocked tasks.

Negative constraints:

```text
No copied mascot, no brand logo, no text, no overly realistic fur, no aggressive combat pose, no thin fragile outlines, no inconsistent scale.
```

### 5.4 原创猫咪团队通用提示词

```text
Original kawaii cat AI agent character, not based on Hello Kitty or any existing IP, visible small mouth, distinct face shape, rounded cute proportions, thick clean outlines, warm management game asset style, full body, transparent background, consistent scale, role-specific outfit and tool, no text, no logos.
```

Role details:

- `white-bow-cat-pm`: white cat project manager, small mouth, non-classic bow placement or bow-shaped badge, clipboard, work ID badge.
- `black-fur-cat-ops`: black fur operations cat, alert badge, monitoring tool, bright workwear accent.
- `tea-cat-engineer`: tea color engineer cat, laptop, engineering vest, focused expression.
- `japan-style-cat-verifier`: original Japanese-style verifier cat, general haori-inspired jacket, omamori-shaped status tag, checklist.
- `mini-cat-subagent`: small kitten assistant, task pouch, tiny file cards, helper expression.

Negative constraints:

```text
No Hello Kitty name, no Sanrio reference, no classic mouthless white cat face, no left-ear red bow signature look, no exact copy of any existing character, no text, no logos, no overly similar facial proportions across cats.
```

### 5.5 动作 spritesheet 通用提示词

```text
Spritesheet for one original AI agent character, transparent background, consistent character design, consistent scale, bottom-center anchor, 4 frames per action row, warm cute top-down management game style, thick rounded outlines, actions include idle, walk down, walk up, walk left, walk right, planning with clipboard, working at computer, verifying with checklist, blocked with warning, done with check mark, no text, no logos, not based on existing IP.
```

Negative constraints:

```text
No changing outfit between frames, no changing character proportions, no extra duplicate characters, no background, no shadows that break transparency, no text, no logos, no copyrighted character likeness.
```

## 6. 输出目录与命名

后续创建代码项目时，素材放入以下目录。

```text
agentWord/
  assets/
    scene/
      concepts/
        scene_campus_concept_1920x1280.png
      maps/
        scene_campus_base_1920x1280.png
        scene_campus_hotspots.json
        scene_room_labels.json
      props/
        prop_task_board.png
        prop_terminal_station.png
        prop_monitor_wall.png
        prop_alert_lamp.png
        prop_archive_shelf.png
        prop_waiting_chair.png
        prop_checklist_table.png
        prop_subagent_nest.png
    characters/
      animal-agent-team/
        red-panda-manager/
        beaver-builder/
        frog-verifier/
        otter-ops/
      kawaii-cat-team/
        white-bow-cat-pm/
        black-fur-cat-ops/
        tea-cat-engineer/
        japan-style-cat-verifier/
        mini-cat-subagent/
    ui/
      status/
      task/
      bubbles/
    spritesheets/
```

角色动作文件命名：

```text
assets/characters/{team}/{character}/{character}_{action}.png
assets/characters/{team}/{character}/{character}_{action}.json
```

示例：

```text
assets/characters/kawaii-cat-team/white-bow-cat-pm/white-bow-cat-pm_idle.png
assets/characters/kawaii-cat-team/white-bow-cat-pm/white-bow-cat-pm_walk_down.png
assets/characters/animal-agent-team/beaver-builder/beaver-builder_working.png
assets/characters/kawaii-cat-team/mini-cat-subagent/mini-cat-subagent_carry_task.png
```

UI 状态文件命名：

```text
assets/ui/status/status_idle.png
assets/ui/status/status_planning.png
assets/ui/status/status_running.png
assets/ui/status/status_verifying.png
assets/ui/status/status_blocked.png
assets/ui/status/status_done.png
assets/ui/bubbles/bubble_warning.png
assets/ui/bubbles/bubble_waiting.png
assets/ui/bubbles/bubble_check.png
assets/ui/task/task_archive.png
```

## 7. 第一批验收标准

场景验收：

- 6 个核心房间和 4 个辅助区域可识别。
- 角色路径不会被家具或装饰堵住。
- 背景不内嵌角色，方便后续单独渲染 agent。
- 缩小到 50% 时仍能区分阻塞区、执行室和归档室。

角色验收：

- 8 个主角色和 1 个 mini subagent 风格统一。
- 每个角色在 64-96px 地图尺寸下仍能识别职业。
- 猫咪团队不使用受保护 IP 名称、标志和完整识别组合。
- 动物团队和猫咪团队可以共处同一场景，不显得像两套画风。

动作验收：

- 主角色 10 个动作都存在。
- mini subagent 8 个动作都存在。
- 同一角色不同动作之间服装、比例、脸型保持一致。
- PNG 背景透明干净，无白边。
- JSON 帧数据和 PNG 文件名一一对应。

## 8. 决策记录

- 2026-05-29：第一批场景资产锁定为概念图、可交互背景、hotspots JSON 和 room labels JSON。
- 2026-05-29：第一批角色锁定为 4 个动物 agent、4 个原创猫咪 agent 和 1 个 mini subagent。
- 2026-05-29：主角色动作锁定为 10 个，mini subagent 动作锁定为 8 个。
- 2026-05-29：生成提示词和负面约束统一写入本文件。
- 2026-05-29：素材输出目录和 spritesheet 命名统一写入本文件。
