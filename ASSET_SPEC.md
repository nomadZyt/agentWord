# agentWord Asset Specification

Last updated: 2026-05-29

## 1. 资产目标

这份规范用于统一 agentWord 第一版的场景、角色、动作、UI 图标和后续生成素材的标准。

第一版素材目标：

- 让应用首屏像一个正在运行的俯视管理游戏。
- 让 agent / subagent 在地图中有明确身份、状态和行动。
- 让任务状态可以通过房间、动作、气泡和警报区被快速看懂。
- 让后续图片生成、切图、spritesheet 制作和 PixiJS 接入有一致规格。

第一版不追求大型完整美术包，优先保证核心循环可跑：

任务进入 -> agent 规划 -> agent 执行 -> 验证 -> 阻塞或完成 -> 归档。

## 2. 已提供参考素材

这些图片作为风格、构图和角色方向参考，不直接复制、不嵌入、不当作最终商业素材。

### 2.1 场景参考

- 路径：`/Users/user/Library/Containers/com.bytedance.macos.feishu/Data/Library/Application Support/LarkShell/sdk_storage/447e4fa78a752495a88bfe318cf7c676/resources/images/img_v3_02124_77307329-e154-4617-9a9b-527eb2c13bfg.jpg`
- 用途：俯视园区场景参考。
- 可借鉴点：房间分区、开放庭院、走廊连接、警报区、办公区、休息区、温暖卡通色彩。
- 不复制点：具体角色造型、具体房间布局、完整画面构图。

### 2.2 Agent 团队参考

- 路径 A：`/Users/user/Library/Containers/com.bytedance.macos.feishu/Data/Library/Application Support/LarkShell/sdk_storage/447e4fa78a752495a88bfe318cf7c676/resources/images/img_v3_02124_0142f194-8bce-4fe0-b0a5-0a34fb5c591g.jpg`
- 路径 B：`/Users/user/Library/Containers/com.bytedance.macos.feishu/Data/Library/Application Support/LarkShell/sdk_storage/447e4fa78a752495a88bfe318cf7c676/resources/images/img_v3_02124_032a4286-e198-46a2-938f-cf049fe4aeag.jpg`
- 路径 C：`/Users/user/Library/Containers/com.bytedance.macos.feishu/Data/Library/Application Support/LarkShell/sdk_storage/447e4fa78a752495a88bfe318cf7c676/resources/images/img_v3_02124_59498b76-7be4-4621-90e3-44d9a678990g.jpg`
- 用途：agent 团队角色风格参考。
- 可借鉴点：圆润比例、粗描边、不同职业道具、团队站位、动物角色差异化。
- 不复制点：单张图中的具体角色组合、服装细节、姿势和构图。

## 3. 版权与原创边界

猫咪团队采用原创 kawaii cat agent team，不使用受保护角色的名称、标识和完整外观组合。

必须避免：

- 不使用 `Hello Kitty`、`Sanrio`、`Kitty` 等作为资产文件名、角色名或 UI 文案。
- 不做经典无嘴白猫 + 左耳红蝴蝶结 + 固定脸型比例的组合。
- 不复刻具体已知衍生造型、服装、配色和标志性元素。
- 不把“稍微改一点以规避版权”作为生成目标。

允许采用：

- 原创白猫、黑毛猫、奶茶猫、三花猫等可爱猫咪角色。
- 蝴蝶结、领结、工牌、发卡、围巾、工具包等通用可爱元素。
- 中国风、日本风、工程师、测试员、运维员等原创职业设定。
- 小嘴、不同鼻型、不同眼睛比例、不同耳朵形状、不同配饰位置等差异化设计。

## 4. 总体美术规范

视角：

- 主场景采用俯视 2.5D 管理游戏视角。
- 房间和家具可以略带透视，但角色要保持正面 / 侧面易识别。

线条：

- 使用圆润粗描边。
- 主角色描边比场景装饰略粗。
- UI 图标描边和角色描边保持同一手感。

色彩：

- 场景基调：草绿、木色、暖黄、浅米色。
- 警报区：橙红、黄色、黑黄警示线。
- Codex 相关角色：蓝色、深色工装、冷色徽章。
- Claude 相关角色：暖色、紫色或橙色徽章。
- 模拟 / 原创猫咪角色：粉、奶白、黑、茶色、红、青绿等区分身份。

可读性：

- 角色缩小到 64px 高时仍能看出身份。
- 状态气泡缩小到 32px 时仍能看出状态。
- 房间缩小到 25% 缩放时仍能区分功能区。

## 5. 场景资产规范

### 5.1 MVP 场景房间

第一版固定 6 个核心房间：

- `room_queue`：入口队列，新任务进入。
- `room_planning`：规划室，任务拆解、调度、生成 subagent。
- `room_execution`：执行室，agent 敲电脑、跑命令、处理文件。
- `room_verification`：验证室，测试、检查清单、结果确认。
- `room_blocked`：阻塞处理室，等待用户、权限失败、外部依赖失败。
- `room_archive`：归档室，完成任务、保存结果、沉淀记录。

辅助区域：

- `garden_path`：主路径和庭院。
- `rest_area`：空闲 agent 停留区。
- `monitor_wall`：本机 Codex / Claude 会话数量展示墙。
- `subagent_nest`：subagent 生成和回收的小型工位区。

### 5.2 场景资产清单

基础 tile：

- grass
- wood_floor
- stone_path
- wall_round
- door_arch
- window
- fence
- flower_bed
- pond

家具：

- desk_single
- desk_team
- computer
- terminal_station
- task_board
- server_cabinet
- checklist_table
- archive_shelf
- waiting_chair

状态装饰：

- alert_sign
- warning_line
- blocked_lamp
- done_stamp
- progress_board
- process_counter_panel

### 5.3 场景输出规格

MVP 可以先用整张背景图加少量可交互热点，后续再切成 tilemap。

- 概念图：`scene_campus_concept_1920x1280.png`
- 可交互背景：`scene_campus_base_1920x1280.png`
- tile 尺寸：64x64 或 128x128。
- 热点坐标：用 JSON 保存房间矩形和路径点。
- 透明物件：PNG，透明背景，保留 8px 安全边距。

## 6. Agent 团队规范

第一版有两套角色线：

- 动物职业团队：基于用户提供团队图的方向，适合表达不同 agent 职能。
- 原创猫咪团队：基于 kawaii cat agent team，适合做品牌化主角团队。

### 6.1 动物职业团队

角色建议：

- `red-panda-manager`：主调度 / 项目经理，负责规划和看板。
- `frog-verifier`：验证员，负责测试、检查、打勾。
- `beaver-builder`：执行工程师，负责构建、改代码、跑命令。
- `penguin-runner`：任务搬运员，负责执行流转、播放、启动。
- `otter-ops`：运维员，负责包裹、发布、环境。
- `owl-planner`：架构规划，负责阅读文档、设计方案。
- `rabbit-timer`：等待 / 排期，负责时间、提醒、阻塞等待。
- `turtle-archivist`：归档员，负责沉淀、文档和知识库。

### 6.2 原创猫咪团队

命名禁止使用受保护 IP 名称。文件名统一使用原创描述。

角色建议：

- `white-bow-cat-pm`：白猫项目经理，负责规划任务和分派 agent。使用白色皮毛、非经典位置蝴蝶结、小嘴、工牌或夹板。
- `black-fur-cat-ops`：黑毛运维猫，负责警报、阻塞、监控和夜间任务。使用深色皮毛、亮色工装、警报徽章。
- `tea-cat-engineer`：奶茶工程猫，负责执行、编码、命令处理。使用奶茶色皮毛、工程背心、电脑或扳手。
- `china-style-cat-planner`：中国风规划猫，负责需求拆解和策略。使用盘扣马甲、云纹工牌、卷轴形任务板。
- `japan-style-cat-verifier`：日本风验证猫，负责验收和清单。使用和风外套、御守形状态牌、检查清单。
- `mini-cat-subagent`：小猫 subagent，负责搬任务卡、传文件、跟随主 agent。

差异化要求：

- 每只猫都必须有嘴或不同表情，不采用经典无嘴识别点。
- 蝴蝶结不能固定为左耳红色经典组合，可以改为领结、头顶发卡、工牌挂饰或不同位置的小配饰。
- 脸型、耳朵、眼距、鼻型、身体比例需要形成原创设定。
- 中国风 / 日本风只使用通用服饰语言，不复刻任何具体 IP 造型。

## 7. 动作素材规范

因为第一版优先游戏场景体验，角色必须包含动作素材。只给静态图会让地图像贴纸，动作素材是 MVP 体验的一部分。

### 7.1 MVP 必备动作

每个主角色至少需要：

- `idle`：待机，站立或轻微呼吸。
- `walk_down`：向下走。
- `walk_up`：向上走。
- `walk_left`：向左走。
- `walk_right`：向右走。
- `planning`：看板、看夹板、思考。
- `working`：敲电脑、拿工具、处理任务。
- `verifying`：拿清单、放大镜、打勾。
- `blocked`：警告、困惑、冒汗、举牌。
- `done`：开心、打勾、归档文件。

subagent 最少需要：

- `idle`
- `walk_down`
- `walk_up`
- `walk_left`
- `walk_right`
- `carry_task`
- `working`
- `done`

### 7.2 进阶动作

第二批再补：

- `handoff`：两个 agent 交接任务卡。
- `summon_subagent`：主 agent 召唤小助手。
- `merge_result`：subagent 回收结果。
- `error`：执行失败、红色警报。
- `sleep`：长时间空闲。
- `celebrate`：任务批量完成。

### 7.3 Spritesheet 规格

推荐帧规格：

- 主角色单帧：256x256 PNG，透明背景。
- subagent 单帧：192x192 PNG，透明背景。
- UI 头像：256x256 PNG。
- 地图内显示：主角色约 64-96px 高，subagent 约 44-64px 高。
- 每个动作 4-8 帧，优先 4 帧保证第一版速度。
- 行走动画 8-12 fps，工作动画 6-8 fps，待机动画 4-6 fps。
- 锚点统一使用底部中心点，方便 PixiJS 放到地图路径上。

Spritesheet 命名：

```text
assets/characters/{team}/{character}/{character}_{action}.png
assets/characters/{team}/{character}/{character}_{action}.json
```

示例：

```text
assets/characters/kawaii-cat-team/white-bow-cat-pm/white-bow-cat-pm_walk_down.png
assets/characters/animal-agent-team/frog-verifier/frog-verifier_verifying.png
```

## 8. UI 与状态资产规范

状态图标：

- `status_idle`
- `status_planning`
- `status_running`
- `status_verifying`
- `status_blocked`
- `status_done`
- `status_real_session`
- `status_simulated`

任务图标：

- `task_new`
- `task_split`
- `task_running`
- `task_test`
- `task_blocked`
- `task_archive`

气泡：

- `bubble_thinking`
- `bubble_warning`
- `bubble_waiting`
- `bubble_check`
- `bubble_command`
- `bubble_subagent`

UI 图标优先使用 lucide-react；只有地图内状态气泡和游戏化符号需要自制图片。

## 9. 目录结构建议

后续创建项目代码时使用：

```text
agentWord/
  docs/
  assets/
    references/
    scene/
      concepts/
      tiles/
      props/
      maps/
    characters/
      animal-agent-team/
      kawaii-cat-team/
    ui/
      status/
      task/
      bubbles/
    spritesheets/
  src/
```

当前阶段只记录参考图路径，不复制飞书缓存目录中的图片。真正进入制作阶段后，再把可使用的源文件整理到 `assets/references/`。

## 10. 生成提示词基准

### 10.1 场景生成提示词

```text
Warm cute top-down 2.5D management game campus for AI agents, cozy rooms connected by garden paths, planning room, execution room, verification room, blocked alert room, archive room, monitor wall, rounded walls, desks with computers, task board, plants, pond, soft green and warm wood palette, thick rounded outlines, clean readable layout, no text, no logos, original characters only, game asset concept art.
```

### 10.2 动物团队角色提示词

```text
Original cute animal AI agent team, rounded proportions, thick clean outlines, warm management game style, each character has a distinct job tool such as clipboard, laptop, magnifier, wrench, package, checklist, transparent background, consistent scale, no text, no logos, not based on any existing IP.
```

### 10.3 原创猫咪团队提示词

```text
Original kawaii cat AI agent team, not based on Hello Kitty or any existing IP, cute rounded cats with visible small mouths and distinct face shapes, white bow cat project manager, black fur operations cat, tea color engineer cat, Chinese style planner cat, Japanese style verifier cat, mini subagent kitten, different accessories and costumes, thick rounded outlines, warm game asset style, transparent background, no text, no logos.
```

### 10.4 动作 spritesheet 提示词

```text
Spritesheet for one original kawaii cat AI agent character, transparent background, consistent size and pose, 4 frames per row, actions include idle, walk down, walk up, walk left, walk right, working at computer, planning with clipboard, blocked with warning, done with check mark, thick rounded outlines, warm cute management game style, no text, no logos, not based on existing IP.
```

## 11. 验收标准

素材进入项目之前必须满足：

- 角色和场景风格统一。
- 角色在 64px 高度下仍能区分职业。
- 每个主角色至少有 MVP 动作集。
- 场景房间能对应任务状态。
- PNG 透明背景干净，无白边。
- 文件名不包含受保护 IP 名称。
- 图片中不包含文字、商标、真实品牌 logo。
- 所有素材能映射到 PixiJS 中的 `AgentSession`、`TaskCard`、`MapEntity` 和 `SceneEvent`。

## 12. 决策记录

- 2026-05-29：确认用户提供 1 张场景参考和 3 张 agent 团队参考。
- 2026-05-29：确认第一版素材优先支持游戏场景体验。
- 2026-05-29：确认猫咪团队采用原创 kawaii cat agent team，不直接使用受保护角色名称和完整外观组合。
- 2026-05-29：确认动作素材是 MVP 必备项，而不是后期可选项。
