import campusHotspots from "../../assets/scene/maps/scene_campus_hotspots.json";
import dStageManifest from "../../assets/d_stage_manifest.json";
import sceneDecorationsManifest from "../../assets/scene/decorations/scene_decorations.json";
import roomLabels from "../../assets/scene/maps/scene_room_labels.json";
import beaverBuilderSheet from "../../assets/characters/animal-agent-team/beaver-builder/beaver-builder_mvp_spritesheet.json";
import beaverBuilderAdvancedSheet from "../../assets/characters/animal-agent-team/beaver-builder/beaver-builder_advanced_spritesheet.json";
import frogVerifierSheet from "../../assets/characters/animal-agent-team/frog-verifier/frog-verifier_mvp_proxy_spritesheet.json";
import frogVerifierAdvancedSheet from "../../assets/characters/animal-agent-team/frog-verifier/frog-verifier_advanced_spritesheet.json";
import redPandaManagerSheet from "../../assets/characters/animal-agent-team/red-panda-manager/red-panda-manager_mvp_proxy_spritesheet.json";
import redPandaManagerAdvancedSheet from "../../assets/characters/animal-agent-team/red-panda-manager/red-panda-manager_advanced_spritesheet.json";
import blackFurCatOpsSheet from "../../assets/characters/kawaii-cat-team/black-fur-cat-ops/black-fur-cat-ops_mvp_proxy_spritesheet.json";
import blackFurCatOpsAdvancedSheet from "../../assets/characters/kawaii-cat-team/black-fur-cat-ops/black-fur-cat-ops_advanced_spritesheet.json";
import miniCatSubagentSheet from "../../assets/characters/kawaii-cat-team/mini-cat-subagent/mini-cat-subagent_mvp_spritesheet.json";
import teaCatEngineerSheet from "../../assets/characters/kawaii-cat-team/tea-cat-engineer/tea-cat-engineer_mvp_proxy_spritesheet.json";
import teaCatEngineerAdvancedSheet from "../../assets/characters/kawaii-cat-team/tea-cat-engineer/tea-cat-engineer_advanced_spritesheet.json";
import whiteBowCatPmSheet from "../../assets/characters/kawaii-cat-team/white-bow-cat-pm/white-bow-cat-pm_mvp_spritesheet.json";
import whiteBowCatPmAdvancedSheet from "../../assets/characters/kawaii-cat-team/white-bow-cat-pm/white-bow-cat-pm_advanced_spritesheet.json";
import type {
  AgentAction,
  RoomHotspot,
  RoomLabel,
  SceneDecoration,
  SceneDecorationAsset,
  SceneDecorationAssetType,
  SceneDecorationLayer,
  SpriteSheetDefinition,
  StatusColumn,
} from "../types/domain";

const campusBaseImage = new URL(
  "../../assets/scene/maps/scene_campus_base_1920x1280.png",
  import.meta.url,
).href;

const prototypeBaseImage = new URL(
  "../../assets/scene/prototype/scene_prototype_base_1536x1024.png",
  import.meta.url,
).href;

const whiteBowCatPmImage = new URL(
  "../../assets/characters/kawaii-cat-team/white-bow-cat-pm/white-bow-cat-pm_mvp_spritesheet.png",
  import.meta.url,
).href;

const whiteBowCatPmAdvancedImage = new URL(
  "../../assets/characters/kawaii-cat-team/white-bow-cat-pm/white-bow-cat-pm_advanced_spritesheet.png",
  import.meta.url,
).href;

const beaverBuilderImage = new URL(
  "../../assets/characters/animal-agent-team/beaver-builder/beaver-builder_mvp_spritesheet.png",
  import.meta.url,
).href;

const beaverBuilderAdvancedImage = new URL(
  "../../assets/characters/animal-agent-team/beaver-builder/beaver-builder_advanced_spritesheet.png",
  import.meta.url,
).href;

const frogVerifierImage = new URL(
  "../../assets/characters/animal-agent-team/frog-verifier/frog-verifier_mvp_proxy_spritesheet.png",
  import.meta.url,
).href;

const frogVerifierAdvancedImage = new URL(
  "../../assets/characters/animal-agent-team/frog-verifier/frog-verifier_advanced_spritesheet.png",
  import.meta.url,
).href;

const redPandaManagerImage = new URL(
  "../../assets/characters/animal-agent-team/red-panda-manager/red-panda-manager_mvp_proxy_spritesheet.png",
  import.meta.url,
).href;

const redPandaManagerAdvancedImage = new URL(
  "../../assets/characters/animal-agent-team/red-panda-manager/red-panda-manager_advanced_spritesheet.png",
  import.meta.url,
).href;

const blackFurCatOpsImage = new URL(
  "../../assets/characters/kawaii-cat-team/black-fur-cat-ops/black-fur-cat-ops_mvp_proxy_spritesheet.png",
  import.meta.url,
).href;

const blackFurCatOpsAdvancedImage = new URL(
  "../../assets/characters/kawaii-cat-team/black-fur-cat-ops/black-fur-cat-ops_advanced_spritesheet.png",
  import.meta.url,
).href;

const miniCatSubagentImage = new URL(
  "../../assets/characters/kawaii-cat-team/mini-cat-subagent/mini-cat-subagent_mvp_spritesheet.png",
  import.meta.url,
).href;

const teaCatEngineerImage = new URL(
  "../../assets/characters/kawaii-cat-team/tea-cat-engineer/tea-cat-engineer_mvp_proxy_spritesheet.png",
  import.meta.url,
).href;

const teaCatEngineerAdvancedImage = new URL(
  "../../assets/characters/kawaii-cat-team/tea-cat-engineer/tea-cat-engineer_advanced_spritesheet.png",
  import.meta.url,
).href;

const tileImageById = {
  door_arch: new URL(
    "../../assets/scene/tiles/tile_door_arch.png",
    import.meta.url,
  ).href,
  fence: new URL("../../assets/scene/tiles/tile_fence.png", import.meta.url)
    .href,
  grass: new URL("../../assets/scene/tiles/tile_grass.png", import.meta.url)
    .href,
  stone_path: new URL(
    "../../assets/scene/tiles/tile_stone_path.png",
    import.meta.url,
  ).href,
  wall_round: new URL(
    "../../assets/scene/tiles/tile_wall_round.png",
    import.meta.url,
  ).href,
  window: new URL("../../assets/scene/tiles/tile_window.png", import.meta.url)
    .href,
  wood_floor: new URL(
    "../../assets/scene/tiles/tile_wood_floor.png",
    import.meta.url,
  ).href,
};

const propImageById = {
  alert_lamp: new URL(
    "../../assets/scene/props/prop_alert_lamp.png",
    import.meta.url,
  ).href,
  archive_shelf: new URL(
    "../../assets/scene/props/prop_archive_shelf.png",
    import.meta.url,
  ).href,
  checklist_table: new URL(
    "../../assets/scene/props/prop_checklist_table.png",
    import.meta.url,
  ).href,
  computer: new URL(
    "../../assets/scene/props/prop_computer.png",
    import.meta.url,
  ).href,
  desk_single: new URL(
    "../../assets/scene/props/prop_desk_single.png",
    import.meta.url,
  ).href,
  process_counter_panel: new URL(
    "../../assets/scene/props/prop_process_counter_panel.png",
    import.meta.url,
  ).href,
  server_cabinet: new URL(
    "../../assets/scene/props/prop_server_cabinet.png",
    import.meta.url,
  ).href,
  task_board: new URL(
    "../../assets/scene/props/prop_task_board.png",
    import.meta.url,
  ).href,
  terminal_station: new URL(
    "../../assets/scene/props/prop_terminal_station.png",
    import.meta.url,
  ).href,
  waiting_chair: new URL(
    "../../assets/scene/props/prop_waiting_chair.png",
    import.meta.url,
  ).href,
};

interface RawSpriteSheet {
  characterId: string;
  frameWidth: number;
  frameHeight: number;
  columns: number;
  rows: number;
  anchor: { x: number; y: number };
  actions: Array<{ id: string; fps: number; frames: number; row: number }>;
}

interface RawDecorationManifestAsset {
  id: string;
  file: string;
  size: { width: number; height: number };
}

interface RawDStageManifest {
  tiles: RawDecorationManifestAsset[];
  props: RawDecorationManifestAsset[];
}

interface RawDecorationPlacement {
  id: string;
  assetId: string;
  assetType: SceneDecorationAssetType;
  roomId?: string;
  layer?: SceneDecorationLayer;
  position: { x: number; y: number };
  scale?: number;
  alpha?: number;
  anchor?: { x: number; y: number };
  rotation?: number;
}

interface RawSceneDecorationsManifest {
  placements: RawDecorationPlacement[];
}

const toSpriteSheetDefinition = (
  label: string,
  image: string,
  sheet: RawSpriteSheet,
): SpriteSheetDefinition => ({
  id: sheet.characterId,
  label,
  image,
  frameWidth: sheet.frameWidth,
  frameHeight: sheet.frameHeight,
  columns: sheet.columns,
  rows: sheet.rows,
  anchor: sheet.anchor,
  actionFps: Object.fromEntries(
    sheet.actions.map((action) => [action.id as AgentAction, action.fps]),
  ),
  actionFrameCounts: Object.fromEntries(
    sheet.actions.map((action) => [action.id as AgentAction, action.frames]),
  ),
  actionRows: Object.fromEntries(
    sheet.actions.map((action) => [action.id as AgentAction, action.row]),
  ),
});

const toDecorationAsset = (
  asset: RawDecorationManifestAsset,
  type: SceneDecorationAssetType,
  imageById: Record<string, string>,
): SceneDecorationAsset => {
  const image = imageById[asset.id];

  if (!image) {
    throw new Error(`Missing ${type} decoration image for ${asset.id}`);
  }

  return {
    id: asset.id,
    image,
    size: asset.size,
    sourceFile: asset.file,
    type,
  };
};

const rawDStageManifest = dStageManifest as RawDStageManifest;
const decorationAssets: SceneDecorationAsset[] = [
  ...rawDStageManifest.tiles.map((asset) =>
    toDecorationAsset(asset, "tile", tileImageById),
  ),
  ...rawDStageManifest.props.map((asset) =>
    toDecorationAsset(asset, "prop", propImageById),
  ),
];
const decorationAssetByKey = new Map(
  decorationAssets.map((asset) => [`${asset.type}:${asset.id}`, asset]),
);

const decorations: SceneDecoration[] = (
  sceneDecorationsManifest as RawSceneDecorationsManifest
).placements.map((placement) => {
  const asset = decorationAssetByKey.get(
    `${placement.assetType}:${placement.assetId}`,
  );

  if (!asset) {
    throw new Error(
      `Missing decoration manifest asset for ${placement.assetType}:${placement.assetId}`,
    );
  }

  return {
    alpha: placement.alpha ?? 1,
    anchor: placement.anchor ?? { x: 0.5, y: 0.5 },
    asset,
    assetId: placement.assetId,
    assetType: placement.assetType,
    id: placement.id,
    layer:
      placement.layer ?? (placement.assetType === "tile" ? "floor" : "prop"),
    position: placement.position,
    roomId: placement.roomId,
    rotation: placement.rotation ?? 0,
    scale: placement.scale ?? 1,
  };
});

export const sceneAssets = {
  campusBaseImage,
  coordinateSpace: campusHotspots.coordinateSpace,
  decorationAssets,
  decorations,
  prototypeBaseImage,
  rooms: campusHotspots.rooms as RoomHotspot[],
  paths: campusHotspots.paths,
  spawnPoints: campusHotspots.spawnPoints,
  labels: roomLabels.rooms as RoomLabel[],
  statusColumns: roomLabels.statusColumns as StatusColumn[],
};

export const spriteSheets: SpriteSheetDefinition[] = [
  toSpriteSheetDefinition("White Bow Cat PM", whiteBowCatPmImage, whiteBowCatPmSheet),
  toSpriteSheetDefinition("Beaver Builder", beaverBuilderImage, beaverBuilderSheet),
  toSpriteSheetDefinition("Red Panda Manager", redPandaManagerImage, redPandaManagerSheet),
  toSpriteSheetDefinition("Frog Verifier", frogVerifierImage, frogVerifierSheet),
  toSpriteSheetDefinition("Black Fur Cat Ops", blackFurCatOpsImage, blackFurCatOpsSheet),
  toSpriteSheetDefinition("Tea Cat Engineer", teaCatEngineerImage, teaCatEngineerSheet),
  toSpriteSheetDefinition("Mini Cat Subagent", miniCatSubagentImage, miniCatSubagentSheet),
];

export const spriteSheetById = new Map(spriteSheets.map((sheet) => [sheet.id, sheet]));

export const advancedSpriteSheets: SpriteSheetDefinition[] = [
  toSpriteSheetDefinition(
    "White Bow Cat PM Advanced",
    whiteBowCatPmAdvancedImage,
    whiteBowCatPmAdvancedSheet,
  ),
  toSpriteSheetDefinition(
    "Beaver Builder Advanced",
    beaverBuilderAdvancedImage,
    beaverBuilderAdvancedSheet,
  ),
  toSpriteSheetDefinition(
    "Red Panda Manager Advanced",
    redPandaManagerAdvancedImage,
    redPandaManagerAdvancedSheet,
  ),
  toSpriteSheetDefinition(
    "Frog Verifier Advanced",
    frogVerifierAdvancedImage,
    frogVerifierAdvancedSheet,
  ),
  toSpriteSheetDefinition(
    "Black Fur Cat Ops Advanced",
    blackFurCatOpsAdvancedImage,
    blackFurCatOpsAdvancedSheet,
  ),
  toSpriteSheetDefinition(
    "Tea Cat Engineer Advanced",
    teaCatEngineerAdvancedImage,
    teaCatEngineerAdvancedSheet,
  ),
];

export const advancedSpriteSheetById = new Map(
  advancedSpriteSheets.map((sheet) => [sheet.id, sheet]),
);
