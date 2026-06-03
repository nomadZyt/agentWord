import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const tempDir = join(projectRoot, "tmp", "d-assets");
const sourceDir = join(projectRoot, "assets", "source", "imagegen");
const reviewDir = join(projectRoot, "assets", "review", "d");
const tileDir = join(projectRoot, "assets", "scene", "tiles");
const propDir = join(projectRoot, "assets", "scene", "props");
const animalDir = join(projectRoot, "assets", "characters", "animal-agent-team");
const catDir = join(projectRoot, "assets", "characters", "kawaii-cat-team");

const d1EnvironmentAtlas = join(sourceDir, "d1_environment_atlas.png");
const d1PropsAtlas = join(sourceDir, "d1_props_atlas.png");
const d2AnimalAtlas = join(sourceDir, "d2_animal_agents_atlas.png");
const d3CatAtlas = join(sourceDir, "d3_kawaii_cats_atlas.png");

const mvpActions = [
  { id: "idle", fps: 5 },
  { id: "walk_down", fps: 10 },
  { id: "walk_up", fps: 10 },
  { id: "walk_left", fps: 10 },
  { id: "walk_right", fps: 10 },
  { id: "planning", fps: 7 },
  { id: "working", fps: 7 },
  { id: "verifying", fps: 7 },
  { id: "blocked", fps: 7 },
  { id: "done", fps: 7 },
];

const advancedActions = [
  { id: "handoff", fps: 7 },
  { id: "summon_subagent", fps: 7 },
  { id: "merge_result", fps: 7 },
];

const tileAssets = [
  { id: "grass", filename: "tile_grass.png", atlas: d1EnvironmentAtlas, cols: 4, rows: 4, col: 0, row: 0 },
  { id: "wood_floor", filename: "tile_wood_floor.png", atlas: d1EnvironmentAtlas, cols: 4, rows: 4, col: 1, row: 0 },
  { id: "stone_path", filename: "tile_stone_path.png", atlas: d1EnvironmentAtlas, cols: 4, rows: 4, col: 2, row: 0 },
  { id: "wall_round", filename: "tile_wall_round.png", atlas: d1EnvironmentAtlas, cols: 4, rows: 4, col: 3, row: 0 },
  { id: "door_arch", filename: "tile_door_arch.png", atlas: d1EnvironmentAtlas, cols: 4, rows: 4, col: 0, row: 1 },
  { id: "window", filename: "tile_window.png", atlas: d1EnvironmentAtlas, cols: 4, rows: 4, col: 1, row: 1 },
  { id: "fence", filename: "tile_fence.png", atlas: d1EnvironmentAtlas, cols: 4, rows: 4, col: 2, row: 1 },
];

const propAssets = [
  { id: "desk_single", filename: "prop_desk_single.png", atlas: d1EnvironmentAtlas, cols: 4, rows: 4, col: 3, row: 1 },
  { id: "computer", filename: "prop_computer.png", atlas: d1EnvironmentAtlas, cols: 4, rows: 4, col: 0, row: 2 },
  { id: "task_board", filename: "prop_task_board.png", atlas: d1EnvironmentAtlas, cols: 4, rows: 4, col: 1, row: 2 },
  { id: "server_cabinet", filename: "prop_server_cabinet.png", atlas: d1EnvironmentAtlas, cols: 4, rows: 4, col: 2, row: 2 },
  { id: "terminal_station", filename: "prop_terminal_station.png", atlas: d1PropsAtlas, cols: 3, rows: 2, col: 0, row: 0 },
  { id: "archive_shelf", filename: "prop_archive_shelf.png", atlas: d1PropsAtlas, cols: 3, rows: 2, col: 1, row: 0 },
  { id: "checklist_table", filename: "prop_checklist_table.png", atlas: d1PropsAtlas, cols: 3, rows: 2, col: 2, row: 0 },
  { id: "alert_lamp", filename: "prop_alert_lamp.png", atlas: d1PropsAtlas, cols: 3, rows: 2, col: 0, row: 1 },
  { id: "waiting_chair", filename: "prop_waiting_chair.png", atlas: d1PropsAtlas, cols: 3, rows: 2, col: 1, row: 1 },
  { id: "process_counter_panel", filename: "prop_process_counter_panel.png", atlas: d1PropsAtlas, cols: 3, rows: 2, col: 2, row: 1 },
];

const animalPortraits = [
  { id: "red-panda-manager", label: "Red Panda Manager", dir: animalDir, atlas: d2AnimalAtlas, cols: 4, rows: 2, col: 0, row: 0, role: "task planning and dispatch" },
  { id: "frog-verifier", label: "Frog Verifier", dir: animalDir, atlas: d2AnimalAtlas, cols: 4, rows: 2, col: 1, row: 0, role: "test and verification" },
  { id: "beaver-builder", label: "Beaver Builder", dir: animalDir, atlas: d2AnimalAtlas, cols: 4, rows: 2, col: 2, row: 0, role: "build and code execution" },
  { id: "penguin-runner", label: "Penguin Runner", dir: animalDir, atlas: d2AnimalAtlas, cols: 4, rows: 2, col: 3, row: 0, role: "task transfer and launch" },
  { id: "otter-ops", label: "Otter Ops", dir: animalDir, atlas: d2AnimalAtlas, cols: 4, rows: 2, col: 0, row: 1, role: "operations and blocked task recovery" },
  { id: "owl-planner", label: "Owl Planner", dir: animalDir, atlas: d2AnimalAtlas, cols: 4, rows: 2, col: 1, row: 1, role: "architecture planning" },
  { id: "rabbit-timer", label: "Rabbit Timer", dir: animalDir, atlas: d2AnimalAtlas, cols: 4, rows: 2, col: 2, row: 1, role: "waiting, scheduling, and reminders" },
  { id: "turtle-archivist", label: "Turtle Archivist", dir: animalDir, atlas: d2AnimalAtlas, cols: 4, rows: 2, col: 3, row: 1, role: "archive and knowledge capture" },
];

const catPortraits = [
  { id: "white-bow-cat-pm", label: "White Bow Cat PM", dir: catDir, atlas: d3CatAtlas, cols: 3, rows: 2, col: 0, row: 0, role: "project management and planning" },
  { id: "black-fur-cat-ops", label: "Black Fur Cat Ops", dir: catDir, atlas: d3CatAtlas, cols: 3, rows: 2, col: 1, row: 0, role: "operations, alerting, and monitoring" },
  { id: "tea-cat-engineer", label: "Tea Cat Engineer", dir: catDir, atlas: d3CatAtlas, cols: 3, rows: 2, col: 2, row: 0, role: "engineering and command execution" },
  { id: "china-style-cat-planner", label: "China Style Cat Planner", dir: catDir, atlas: d3CatAtlas, cols: 3, rows: 2, col: 0, row: 1, role: "strategy and requirement breakdown" },
  { id: "japan-style-cat-verifier", label: "Japan Style Cat Verifier", dir: catDir, atlas: d3CatAtlas, cols: 3, rows: 2, col: 1, row: 1, role: "acceptance and checklist verification" },
  { id: "mini-cat-subagent", label: "Mini Cat Subagent", dir: catDir, atlas: d3CatAtlas, cols: 3, rows: 2, col: 2, row: 1, role: "task carrying and subagent support" },
];

const proxyMvpCharacters = [
  "red-panda-manager",
  "frog-verifier",
  "black-fur-cat-ops",
  "tea-cat-engineer",
];

const advancedCharacters = [
  "white-bow-cat-pm",
  "beaver-builder",
  "red-panda-manager",
  "frog-verifier",
  "black-fur-cat-ops",
  "tea-cat-engineer",
];

const allPortraits = [...animalPortraits, ...catPortraits];

function runMagick(args) {
  execFileSync("magick", args, { stdio: "inherit" });
}

function identify(path) {
  const output = execFileSync("magick", ["identify", "-format", "%w %h", path], {
    encoding: "utf8",
  });
  const [width, height] = output.trim().split(/\s+/).map(Number);
  return { width, height };
}

function ensureParent(path) {
  mkdirSync(dirname(path), { recursive: true });
}

function rel(path) {
  return relative(projectRoot, path);
}

function writeJsonFile(path, value) {
  ensureParent(path);
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function cropAtlasCell(asset, outputPath, outputSize, inset = 10) {
  const { width, height } = identify(asset.atlas);
  const cellWidth = Math.floor(width / asset.cols);
  const cellHeight = Math.floor(height / asset.rows);
  const x = asset.col * cellWidth + inset;
  const y = asset.row * cellHeight + inset;
  const cropWidth = cellWidth - inset * 2;
  const cropHeight = cellHeight - inset * 2;
  const tempCrop = join(tempDir, `${asset.id || asset.filename}.crop.png`);
  ensureParent(outputPath);

  runMagick([
    asset.atlas,
    "-crop",
    `${cropWidth}x${cropHeight}+${x}+${y}`,
    "+repage",
    tempCrop,
  ]);

  runMagick([
    tempCrop,
    "-alpha",
    "set",
    "-fuzz",
    "40%",
    "-fill",
    "none",
    "-draw",
    "alpha 0,0 floodfill",
    "-trim",
    "+repage",
    "-resize",
    `${outputSize - 16}x${outputSize - 16}>`,
    "-gravity",
    "center",
    "-background",
    "none",
    "-extent",
    `${outputSize}x${outputSize}`,
    "-fuzz",
    "40%",
    "-fill",
    "none",
    "-draw",
    "alpha 0,0 floodfill",
    "-channel",
    "A",
    "-morphology",
    "Erode",
    "Diamond:1",
    "+channel",
    "PNG32:" + outputPath,
  ]);
}

function createTileAndPropAssets() {
  mkdirSync(tileDir, { recursive: true });
  mkdirSync(propDir, { recursive: true });

  const tiles = tileAssets.map((asset) => {
    const output = join(tileDir, asset.filename);
    cropAtlasCell(asset, output, 128, 9);
    return {
      id: asset.id,
      file: rel(output),
      size: { width: 128, height: 128 },
      sourceAtlas: rel(asset.atlas),
      sourceCell: { columns: asset.cols, rows: asset.rows, column: asset.col, row: asset.row },
    };
  });

  const props = propAssets.map((asset) => {
    const output = join(propDir, asset.filename);
    cropAtlasCell(asset, output, 256, 9);
    return {
      id: asset.id,
      file: rel(output),
      size: { width: 256, height: 256 },
      sourceAtlas: rel(asset.atlas),
      sourceCell: { columns: asset.cols, rows: asset.rows, column: asset.col, row: asset.row },
    };
  });

  writeJsonFile(join(tileDir, "tiles_manifest.json"), {
    schemaVersion: 1,
    generatedAt: "2026-05-31",
    style: "warm cute top-down AI agent campus",
    source: "imagegen atlas with local chroma-key removal",
    assets: tiles,
  });

  writeJsonFile(join(propDir, "props_manifest.json"), {
    schemaVersion: 1,
    generatedAt: "2026-05-31",
    style: "warm cute top-down AI agent campus",
    source: "imagegen atlas with local chroma-key removal",
    assets: props,
  });

  return { tiles, props };
}

function createPortraitAssets() {
  return allPortraits.map((asset) => {
    const outputDir = join(asset.dir, asset.id);
    const output = join(outputDir, `${asset.id}_portrait.png`);
    cropAtlasCell(asset, output, asset.id === "mini-cat-subagent" ? 192 : 256, 10);
    const metadata = {
      schemaVersion: 1,
      characterId: asset.id,
      label: asset.label,
      team: asset.dir.endsWith("animal-agent-team") ? "animal-agent-team" : "kawaii-cat-team",
      role: asset.role,
      file: rel(output),
      sourceAtlas: rel(asset.atlas),
      sourceCell: { columns: asset.cols, rows: asset.rows, column: asset.col, row: asset.row },
      status: "validated-candidate",
      notes: [
        "Generated from imagegen atlas and locally chroma-keyed to alpha PNG.",
        "Portrait is intended for task cards, documentation, and spritesheet proxy source.",
      ],
    };
    writeJsonFile(join(outputDir, `${asset.id}_portrait.json`), metadata);
    return metadata;
  });
}

function portraitPath(characterId) {
  const record = allPortraits.find((item) => item.id === characterId);
  if (!record) {
    throw new Error(`Missing portrait source for ${characterId}`);
  }
  return join(record.dir, record.id, `${record.id}_portrait.png`);
}

function teamForCharacter(characterId) {
  const record = allPortraits.find((item) => item.id === characterId);
  if (!record) {
    throw new Error(`Missing team source for ${characterId}`);
  }
  return record.dir.endsWith("animal-agent-team")
    ? "animal-agent-team"
    : "kawaii-cat-team";
}

function characterDir(characterId) {
  const record = allPortraits.find((item) => item.id === characterId);
  if (!record) {
    throw new Error(`Missing character dir for ${characterId}`);
  }
  return join(record.dir, record.id);
}

function actionOffset(actionId, frameIndex) {
  const bounce = [0, -4, 0, -2][frameIndex];
  const side = [-3, 2, -2, 3][frameIndex];

  if (actionId === "walk_down") return { x: side, y: [3, 8, 3, 6][frameIndex], scale: 232 };
  if (actionId === "walk_up") return { x: -side, y: [-5, -9, -5, -7][frameIndex], scale: 232 };
  if (actionId === "walk_left") return { x: [-8, -13, -8, -11][frameIndex], y: bounce, scale: 232 };
  if (actionId === "walk_right") return { x: [8, 13, 8, 11][frameIndex], y: bounce, scale: 232 };

  return { x: side, y: bounce, scale: 236 };
}

function overlayDraws(actionId, frameIndex) {
  const pulse = frameIndex % 2 === 0 ? 0 : 3;

  if (actionId === "planning") {
    return [
      "-fill", "#f4dca7", "-stroke", "#2d241c", "-strokewidth", "5",
      "-draw", `roundrectangle ${166 - pulse},148 ${226 + pulse},214 10,10`,
      "-fill", "#7ca35b", "-stroke", "none",
      "-draw", "rectangle 178,164 214,172 rectangle 178,184 208,192",
    ];
  }

  if (actionId === "working") {
    return [
      "-fill", "#26313b", "-stroke", "#14171a", "-strokewidth", "5",
      "-draw", "roundrectangle 154,165 232,209 8,8",
      "-fill", "#6ee7d8", "-stroke", "none",
      "-draw", `circle ${198 + pulse},186 ${204 + pulse},186`,
      "-fill", "#2d241c",
      "-draw", "rectangle 184,211 204,219 rectangle 169,220 219,227",
    ];
  }

  if (actionId === "verifying" || actionId === "done" || actionId === "merge_result") {
    const cx = actionId === "merge_result" ? 202 : 205;
    const cy = actionId === "merge_result" ? 160 : 72;
    return [
      "-fill", "#e8fff0", "-stroke", "#2c7a45", "-strokewidth", "6",
      "-draw", `circle ${cx},${cy} ${cx + 30 + pulse},${cy}`,
      "-fill", "none", "-stroke", "#2c7a45", "-strokewidth", "8",
      "-draw", `path 'M ${cx - 16},${cy + 1} L ${cx - 4},${cy + 14} L ${cx + 19},${cy - 17}'`,
    ];
  }

  if (actionId === "blocked") {
    return [
      "-fill", "#ffd66e", "-stroke", "#8a3b18", "-strokewidth", "6",
      "-draw", "polygon 204,44 238,107 170,107",
      "-fill", "#8a3b18", "-stroke", "none",
      "-draw", `roundrectangle ${201},${65 - pulse} ${207},${88 - pulse} 3,3 circle 204,98 208,98`,
    ];
  }

  if (actionId === "handoff") {
    return [
      "-fill", "#fff3bf", "-stroke", "#2d241c", "-strokewidth", "5",
      "-draw", `roundrectangle ${154 + pulse},146 ${204 + pulse},194 8,8 roundrectangle ${190 - pulse},126 ${238 - pulse},174 8,8`,
      "-fill", "none", "-stroke", "#5f8fca", "-strokewidth", "7",
      "-draw", "path 'M 164,118 C 186,104 208,104 226,118'",
    ];
  }

  if (actionId === "summon_subagent") {
    return [
      "-fill", "#fff5d6", "-stroke", "#2d241c", "-strokewidth", "5",
      "-draw", `circle 205,154 ${225 + pulse},154`,
      "-fill", "#f5b44b", "-stroke", "none",
      "-draw", "polygon 196,124 201,139 216,139 204,148 209,164 196,154 184,164 189,148 177,139 192,139",
      "-fill", "#2d241c",
      "-draw", "circle 198,152 201,152 circle 213,152 216,152",
    ];
  }

  return [];
}

function createActionFrame(characterId, actionId, frameIndex, outputPath) {
  const source = portraitPath(characterId);
  const { x, y, scale } = actionOffset(actionId, frameIndex);
  const offsetX = 10 + x;
  const offsetY = 10 + y;
  ensureParent(outputPath);
  runMagick([
    "-size",
    "256x256",
    "xc:none",
    "(",
    source,
    "-resize",
    `${scale}x${scale}`,
    ")",
    "-geometry",
    `${offsetX >= 0 ? "+" : ""}${offsetX}${offsetY >= 0 ? "+" : ""}${offsetY}`,
    "-composite",
    ...overlayDraws(actionId, frameIndex),
    "PNG32:" + outputPath,
  ]);
}

function createActionRows(characterId, actions, suffix) {
  const outputDir = characterDir(characterId);
  const rows = [];
  for (const action of actions) {
    const framePaths = [];
    for (let frame = 0; frame < 4; frame += 1) {
      const framePath = join(tempDir, `${characterId}_${action.id}_${suffix}_${frame}.png`);
      createActionFrame(characterId, action.id, frame, framePath);
      framePaths.push(framePath);
    }
    const rowPath = join(outputDir, `${characterId}_${action.id}_${suffix}.png`);
    runMagick([...framePaths, "+append", "PNG32:" + rowPath]);
    writeJsonFile(join(outputDir, `${characterId}_${action.id}_${suffix}.json`), {
      schemaVersion: 1,
      characterId,
      actionId: action.id,
      source: rel(rowPath),
      frameWidth: 256,
      frameHeight: 256,
      columns: 4,
      rows: 1,
      frames: 4,
      fps: action.fps,
      status: "playable-proxy",
      notes: [
        "Generated from the character portrait with deterministic pose offsets and state props.",
        "This is a playable D-stage proxy spritesheet, ready to replace with hand-authored animation later.",
      ],
    });
    rows.push(rowPath);
  }
  return rows;
}

function createSheet(characterId, actions, suffix, sheetName) {
  const outputDir = characterDir(characterId);
  const rowPaths = createActionRows(characterId, actions, suffix);
  const sheetPath = join(outputDir, `${characterId}_${sheetName}.png`);
  runMagick([...rowPaths, "-append", "PNG32:" + sheetPath]);

  const metadata = {
    schemaVersion: 1,
    characterId,
    team: teamForCharacter(characterId),
    source: rel(sheetPath),
    frameWidth: 256,
    frameHeight: 256,
    columns: 4,
    rows: actions.length,
    anchor: { x: 0.5, y: 1.0 },
    status: "playable-proxy",
    actions: actions.map((action, row) => ({
      id: action.id,
      row,
      frames: 4,
      fps: action.fps,
      source: rel(join(outputDir, `${characterId}_${action.id}_${suffix}.png`)),
    })),
    notes: [
      "Generated from the D-stage portrait art with deterministic pose offsets and state props.",
      "Suitable for PixiJS playback and prototype state mapping.",
      "Future production pass can replace individual action rows without changing the JSON shape.",
    ],
  };
  writeJsonFile(join(outputDir, `${characterId}_${sheetName}.json`), metadata);
  return metadata;
}

function createSpritesheetAssets() {
  const mvpSheets = proxyMvpCharacters.map((characterId) =>
    createSheet(characterId, mvpActions, "proxy", "mvp_proxy_spritesheet"),
  );
  const advancedSheets = advancedCharacters.map((characterId) =>
    createSheet(characterId, advancedActions, "advanced_proxy", "advanced_spritesheet"),
  );
  return { mvpSheets, advancedSheets };
}

function createMontage(paths, outputPath, geometry, tile) {
  ensureParent(outputPath);
  runMagick([
    "montage",
    ...paths,
    "-background",
    "none",
    "-geometry",
    geometry,
    "-tile",
    tile,
    "PNG32:" + outputPath,
  ]);
}

function createReviewPreviews(tileManifest, propManifest, portraits, spritesheets) {
  const tileAndPropPaths = [...tileManifest.assets, ...propManifest.assets].map((item) =>
    join(projectRoot, item.file),
  );
  createMontage(
    tileAndPropPaths,
    join(reviewDir, "d1_tile_prop_contact_sheet.png"),
    "96x96+8+8",
    "7x",
  );

  createMontage(
    portraits.map((item) => join(projectRoot, item.file)),
    join(reviewDir, "d2_d3_portrait_contact_sheet_96.png"),
    "96x96+8+8",
    "7x",
  );

  const mvpPreviewFrames = spritesheets.mvpSheets.map((sheet) => join(projectRoot, sheet.source));
  createMontage(
    mvpPreviewFrames,
    join(reviewDir, "d4_mvp_proxy_spritesheets_contact_sheet.png"),
    "384x960+12+12",
    "4x",
  );

  const advancedPreviewFrames = spritesheets.advancedSheets.map((sheet) => join(projectRoot, sheet.source));
  createMontage(
    advancedPreviewFrames,
    join(reviewDir, "d4_advanced_actions_contact_sheet.png"),
    "384x288+12+12",
    "3x",
  );
}

function main() {
  rmSync(tempDir, { force: true, recursive: true });
  mkdirSync(tempDir, { recursive: true });
  mkdirSync(reviewDir, { recursive: true });

  const tileAndProp = createTileAndPropAssets();
  const portraits = createPortraitAssets();
  const spritesheets = createSpritesheetAssets();

  const tileManifest = JSON.parse(readFileSync(join(tileDir, "tiles_manifest.json"), "utf8"));
  const propManifest = JSON.parse(readFileSync(join(propDir, "props_manifest.json"), "utf8"));
  createReviewPreviews(tileManifest, propManifest, portraits, spritesheets);

  writeJsonFile(join(projectRoot, "assets", "d_stage_manifest.json"), {
    schemaVersion: 1,
    generatedAt: "2026-05-31",
    sourceMode: "built-in imagegen atlas plus local ImageMagick slicing",
    tiles: tileAndProp.tiles,
    props: tileAndProp.props,
    portraits,
    playableProxyMvpSheets: spritesheets.mvpSheets,
    advancedActionSheets: spritesheets.advancedSheets,
    reviewPreviews: {
      d1TileProps: "assets/review/d/d1_tile_prop_contact_sheet.png",
      d2d3Portraits: "assets/review/d/d2_d3_portrait_contact_sheet_96.png",
      d4MvpProxySheets: "assets/review/d/d4_mvp_proxy_spritesheets_contact_sheet.png",
      d4AdvancedSheets: "assets/review/d/d4_advanced_actions_contact_sheet.png",
    },
    notes: [
      "D2 and D3 portraits are generated from original character atlases and do not use protected IP names.",
      "D4 proxy sheets are playable prototype animation assets, not final hand-authored animation.",
      "Existing refined production sheets for white-bow-cat-pm, beaver-builder, and mini-cat-subagent remain the preferred in-app sheets.",
    ],
  });
}

main();
