# F Stage Pipeline: Prototype-Accurate Team Campus

Last updated: 2026-06-02

## Goal

Finish F stage so the product matches the user's prototype image, not a generic
campus overlay. The prototype is the visual contract:

- Dark green left navigation rail.
- Cream left live monitor.
- Central top-down management game map.
- Dynamic team desks in the upper work area.
- Task Dispatch Center and Blocked Center in the middle.
- Waiting / Idle Zone at the bottom.
- Right Team Dashboard with practical cards and `Open Window`.

The map must feel like the prototype image: warm kawaii top-down management
game, cozy garden campus, task flow arrows, desks, rooms, props, agent teams,
and clear UI hierarchy.

## Corrected Product Rules

- The old `scene_campus_base_1920x1280.png` is not the target visual. It may be
  kept as fallback/reference only.
- The default scene must be rendered from dynamic layers: base campus art,
  room/zone layers, task desks, route layer, props, characters, and labels.
- Team desks are data-driven:
  - one active team/task creates one desk;
  - the desk contains the main agent plus its subagents;
  - desk count changes with active team count;
  - blocked state changes the desk style but does not move the desk out of the
    upper team grid.
- Scene regions are capacity-driven:
  - the upper team work area can grow or compact based on active team count;
  - each desk can grow its seat ring based on subagent count;
  - Task Dispatch Center can expand when queued/routing work increases;
  - Blocked Center can expand when blocked task count increases;
  - Waiting / Idle Zone can expand by row/width when idle teams or unassigned
    sessions increase.
- Task Dispatch Center, Blocked Center, and Waiting / Idle Zone are independent
  scene nodes. They are not substitutes for team desks.
- Demo data must be explicitly marked. Real sessions stay real-first.
- Browser preview must not pretend it can navigate real windows.

## Asset Baseline

The next asset set should be model-generated and project-bound:

- `scene_prototype_base_1536x1024.png`: no characters, no labels, no fixed task
  cards; contains the prototype-like garden campus, walls, rooms, top work
  area, middle dispatch/block areas, bottom waiting zone, and empty route areas.
- `scene_prototype_ui_props_sheet.png`: transparent/chroma-clean sheet for
  reusable team tables, center desks, blocked props, waiting tables, route
  arrows, chairs, shrubs, wall/corner props, terminal props, warning props.
- Optional sliced props under `assets/scene/prototype/props/` if the sheet is
  split later.

Generated asset constraints:

- No protected IP or brand assets.
- No characters inside base map.
- No baked task text or numbers.
- No full UI panels in map art.
- No non-functional side rooms in the base map unless they have a product role.
- First F-stage map should keep only three functional regions: upper team work
  hall, middle dispatch/block centers, bottom waiting/idle zone. Decorative
  garden edges are fine; extra rooms should be removed or heavily minimized.
- Warm cartoon top-down style matching the prototype.

## Execution Rules

- Regenerate the pipeline when the prototype contract changes.
- Execute each atomic task in a fresh session/subagent when possible.
- Each completed task must update:
  - `TASKS.md`
  - this file
  - `docs/F_ATOMIC_TASKS.md`
- Every commit must be preceded by staged diff review.
- Do not modify unrelated dirty files outside `agentWord/`.
- Save visual QA screenshots under `assets/review/app/`.

## Pipeline

### F0. Docs And Task Handoff

Status: complete

- F docs were created.
- This pipeline has now been corrected to prototype-first after user review.

Acceptance:

- A new session can read this document and avoid the old fixed-background
  interpretation.

### F1. App Shell And Collapsible Panels

Status: in progress

- Persist left/right collapse state.
- Render dark green nav rail and right collapsed rail.
- Ensure map resizes correctly when panels collapse.

Acceptance:

- Default expanded, left collapsed, right collapsed, and both collapsed all show
  the central map correctly.

### F2. Team Dashboard View Model

Status: complete

- Derived summary, source, health, team card, and activity models exist.
- Real/demo/browser-preview states are represented.

Acceptance:

- Empty, demo, real-session, and blocked states produce stable output.

### F3. Right Team Dashboard

Status: in progress

- Replace old Kanban as the primary right panel.
- Match prototype hierarchy: overview, sources, health, team cards, activity.
- Cards must include status chip, progress, source, subagent count, and
  `Open Window`.

Acceptance:

- Right panel visually matches the prototype and no old six-column Kanban appears
  as the main view.

### F4. Left Live Monitor And Navigation Rail

Status: in progress

- Left rail and live monitor stack should match the prototype.
- Left panel should remain practical: overview, sources, health, activity.

Acceptance:

- Left side reads like the prototype, not the old basic monitor.

### F5. Prototype Map Asset Generation

Status: in progress

- Generate the prototype-like base map and prop sheet.
- Copy final generated assets into `assets/scene/prototype/`.
- Document prompts and source paths.

Acceptance:

- Generated base map is close to the prototype composition.
- Base map has no characters, task text, fixed task cards, or baked UI labels.
- Prop sheet contains reusable desks/centers/waiting/route/props assets.

Status note:

- `scene_prototype_ui_props_sheet_raw.png` has been generated and copied into
  `assets/scene/prototype/`.
- The first base map candidate was rejected because it contained non-functional
  side rooms and baked placement distractions.
- The clean base map candidate is now saved as
  `assets/scene/prototype/scene_prototype_base_1536x1024.png`. It removes the
  non-functional side rooms and keeps the three prototype capacity regions:
  upper team work hall, middle dispatch/block centers, and bottom waiting/idle
  zone.
- The rejected side-room version is preserved as
  `assets/scene/prototype/scene_prototype_base_rejected_side_rooms.png`.
- The raw prop sheet still needs chroma-key cleanup and optional slicing before
  it can be used as production scene props.

### F6. Dynamic Team Desk Layout

Status: complete

- Replace fixed task desk slots with data-driven layout.
- Desk count equals active teams/tasks.
- Desk seats equal main agent + subagents.
- Blocked status changes desk styling but keeps the desk in the team grid.
- Region size and density are computed from capacity: team count, max subagent
  count per team, blocked count, queued count, and waiting/idle count.

Acceptance:

- Adding/removing tasks changes desk count.
- Adding/removing subagents changes visible desk occupants.
- Desks do not collide with centers, walls, or main routes.
- Work area, Blocked Center, Task Dispatch Center, and Waiting / Idle Zone can
  grow/compact within defined min/max bounds.

Status note:

- `src/scene/sceneLayout.ts` now derives desk count from active non-queued,
  non-done tasks instead of fixed 12 slots.
- Seat count is derived from main assignee plus subagents. Reused agents create
  visual seat instances only; they do not create additional real sessions.
- `Task Center`, `Blocked Center`, and `Waiting / Idle` node sizes and labels
  respond to queued, blocked, active, and waiting counts.
- QA screenshot: `output/playwright/f6_clean_base_no_old_hotspots.png`.

### F7. Prototype Map Rendering Integration

Status: complete

- Use generated base map as the scene base.
- Render team desks, agents, labels, centers, routes, and highlights as dynamic
  layers above it.
- Do not use the old campus base as the default scene.

Acceptance:

- Screenshot visually follows the provided prototype.
- Map is not the previous campus image.

Status note:

- `src/data/assets.ts` exposes `sceneAssets.prototypeBaseImage`.
- `src/scene/SceneCanvas.tsx` now loads the clean prototype base as the default
  Pixi background.
- The old room hotspot overlay was removed from the map so old room labels do
  not appear on the prototype base.

### F8. Dashboard And Map Linkage

Status: complete

- Team card click selects and focuses the matching desk.
- Desk click selects the matching Team Card.
- Activity feed click focuses event/task location.
- Blocked tasks show path/highlight toward Blocked Center.

Acceptance:

- Dashboard, map, and selected state stay synchronized.

Status note:

- Team Card click, map desk click, and Activity Feed click now all route through
  shared task/event focus state.
- Team Cards now show active desk tasks only. Queued work belongs to Waiting /
  Idle; done work belongs to Activity Feed. This prevents a dashboard card from
  pointing to a desk that is intentionally not rendered.
- Selected tasks render a dynamic route on the map. Blocked selections use
  `route-selected-blocked` and point toward Blocked Center.
- Activity Feed items related to the selected task receive a selected highlight.
- QA screenshot: `output/playwright/f8_blocked_route_immediate.png`.

### F9. Desktop Work Window Navigation

Status: complete; final desktop smoke remains in F10

- Rust scan metadata and `focus_agent_window` command are implemented.
- Team Card must call it for real bound tasks and display truthful results.

Acceptance:

- Real bound task can attempt `Open Window`.
- Demo/browser-preview tasks do not mislead.

Status note:

- `src/monitor/windowNavigation.ts` returns an unsupported desktop-navigation
  result outside Tauri.
- In browser preview, Team Card buttons are disabled with `Preview only` and the
  title `Desktop window navigation is unavailable in browser preview.`
- Ready real sessions build a `FocusAgentWindowRequest` from PID, process kind,
  window owner, window label, and workspace path.
- `cargo check --manifest-path src-tauri/Cargo.toml` passed after the F9 UI QA.
- Opening an actual host window is deferred to F10 desktop smoke.

### F10. Final QA And Release Commit

Status: validation mostly complete; staged pre-commit review pending

- Run full frontend, Rust, Tauri, Playwright, desktop smoke validation.
- Review staged diff before commit.

Acceptance:

- Final UI matches the prototype image closely and checks pass.

## Required Validation

- `pnpm typecheck`
- `pnpm build`
- `cargo check --manifest-path src-tauri/Cargo.toml`
- `pnpm tauri build`
- Playwright screenshots:
  - default expanded
  - left collapsed
  - right collapsed
  - both collapsed
  - demo state
  - blocked state
  - real session binding state
- Desktop smoke:
  - launch app
  - scan Codex / Claude process
  - bind real session to task
  - click `Open Window`
  - restart and confirm collapsed state persists

## F10 Evidence

- Commands passed on 2026-06-03:
  - `pnpm typecheck`
  - `pnpm build`
  - `cargo check --manifest-path src-tauri/Cargo.toml`
  - `pnpm tauri build`
- Rebuilt desktop bundles:
  - `src-tauri/target/release/bundle/macos/agentWord.app`
  - `src-tauri/target/release/bundle/dmg/agentWord_0.1.0_aarch64.dmg`
- Current Playwright screenshots:
  - `output/playwright/f10_default_expanded.png`
  - `output/playwright/f10_left_collapsed.png`
  - `output/playwright/f10_right_collapsed.png`
  - `output/playwright/f10_both_collapsed.png`
  - `output/playwright/f10_demo_state.png`
  - `output/playwright/f10_blocked_state.png`
  - `output/playwright/f10_real_session_bound_state.png` remains a historical
    browser-preview reference; real navigation is verified by desktop smoke.
- Desktop smoke evidence:
  - The built `agentWord.app` launches.
  - Real process metadata appears as Codex app-server sessions.
  - A real session can be bound to `补齐 Tauri Rust shell`.
  - Clicking `Open Window` returns UI feedback `Focused Codex.`.
  - Restart restores left/right collapsed preferences.
  - Restart preserves the real-bound task card and its Codex app-server source.
- Release evidence:
  - Commit `5988a18 Implement agentWord F-stage dashboard prototype`.
  - Pushed `5988a18` to `origin/main`.
- Current residual gap:
  - The accepted base map no longer includes the user-flagged non-functional
    side rooms.
  - Default/reset viewport now returns to the prototype-wide 100% composition.
    Programmatic card/table focus no longer persists local zoom, and stored
    overview preferences above 108% are normalized back to the full-map view.
- Review notes:
  - `git diff --check -- agentWord` passes.
  - `git diff --cached --check` passes after staging the F-stage migration set.
  - Review fixed nested interactive elements in Team Cards by separating the
    card-selection button from the `Open Window` button.
  - Review fixed the Team filter dropdown so `All Teams`, `Real`, `Demo`, and
    `Blocked` actually filter visible cards.
  - Review fixed the filtered empty state so it does not imply the whole system
    has no tasks when only the current filter has no matches.
  - Remaining non-blocking code risk: `SceneCanvas.tsx` now contains a large
    amount of map drawing and overlay logic. Future visual work should split it
    into smaller scene-layer modules before deeper iteration.

## Completion Log

- 2026-06-03: Unstaged diff review found and fixed two UI issues: nested
  interactive Team Card markup and non-functional Team filter. Staged diff
  review still remains if a commit is created.
- 2026-06-03: F10 command validation passed and the desktop bundle was rebuilt.
  Browser screenshots were refreshed for default, collapsed, demo, and blocked
  states. Desktop smoke verified restart persistence and `Open Window` focusing
  Codex. Pre-commit review remains pending.
- 2026-06-03: Scene viewport clamping was added so panning/focusing cannot
  expose old map edges or empty stage space. Wheel zoom handling was moved to a
  non-passive native listener to avoid QA console noise.
- 2026-06-03: Default/reset viewport was corrected to the prototype-wide 100%
  composition. Programmatic dashboard and map focus uses non-persistent 100%
  focus, and Playwright demo, blocked, left-collapsed, right-collapsed, and
  both-collapsed evidence was refreshed at a 1728x967 viewport.
- 2026-06-03: Staged diff review completed for the F-stage migration set.
  `git diff --cached --check` passed, scope was limited to `agentWord`, and
  unrelated `autoXhs` / `.DS_Store` changes were left untouched.
- 2026-06-03: F-stage migration version committed and pushed:
  `5988a18 Implement agentWord F-stage dashboard prototype`.
- 2026-06-02: User identified side rooms with no current function. The F-stage
  base map was replaced with a clean model-generated version that removes those
  rooms; future non-core rooms should be added only as optional functional
  modules after the prototype flow works.
- 2026-06-02: F6/F7 landed the clean prototype base, removed old room hotspots,
  replaced fixed task slots with capacity-driven desks, and captured
  `output/playwright/f6_clean_base_no_old_hotspots.png`.
- 2026-06-02: F8 completed dashboard/map/activity linkage and blocked-route
  highlighting. Captured
  `output/playwright/f8_blocked_route_immediate.png`.
- 2026-06-02: F9 browser-preview navigation truthfulness verified and Rust
  `focus_agent_window` still compiles. Full real-window click smoke remains in
  F10.

- 2026-06-02: F0 complete. Initial docs were created.
- 2026-06-02: F2 complete. Team Dashboard view model added.
- 2026-06-02: F7 Rust portion complete. `focus_agent_window` added.
- 2026-06-02: Pipeline corrected after user review. The scene must now be
  prototype-first, data-driven, and must not default to the old campus base.
- 2026-06-02: Raw prototype prop sheet copied to
  `assets/scene/prototype/scene_prototype_ui_props_sheet_raw.png`; cleanup and
  slicing remain pending.
- 2026-06-02: Prototype base map candidate copied to
  `assets/scene/prototype/scene_prototype_base_1536x1024.png`.
- 2026-06-02: Base map candidate marked for regeneration after user review:
  remove non-functional side rooms and keep only functional capacity regions.
