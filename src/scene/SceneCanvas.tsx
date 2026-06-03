import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import { Gauge, Minus, Move, Plus, RotateCcw } from "lucide-react";
import {
  Application,
  Assets,
  Container,
  Graphics,
  Rectangle,
  Sprite,
  Texture,
} from "pixi.js";
import {
  advancedSpriteSheetById,
  sceneAssets,
  spriteSheetById,
} from "../data/assets";
import {
  buildSceneAgents,
  buildSceneFlowNodes,
  buildRealSessionWaitingZone,
  buildTaskDeskPlacements,
  getPrototypeFocusForTaskStatus,
  getRoomIdForTaskStatus,
} from "./sceneLayout";
import { useAgentWorldStore } from "../store/useAgentWorldStore";
import type {
  AgentAction,
  AgentSession,
  Point,
  SceneDensityMode,
  SceneEvent,
  SpriteSheetDefinition,
  TaskCard,
  TaskStatus,
} from "../types/domain";

const MIN_ZOOM = 0.72;
const MAX_ZOOM = 2.35;
const OVERVIEW_ZOOM = 1;
const TASK_FOCUS_ZOOM = 1;
const NODE_FOCUS_ZOOM = 1;
const AGENT_FOCUS_ZOOM = 1;
const STATIC_WORLD_LAYER_COUNT = 3;
const SUBAGENT_NEST_ROOM_ID = "subagent_nest";
const SUBAGENT_SHEET_ID = "mini-cat-subagent";
const ADVANCED_ACTION_DURATION = 2.35;
const PERFORMANCE_SAMPLE_WINDOW_MS = 1200;

const statusToAction: Record<AgentSession["status"], AgentAction> = {
  idle: "idle",
  planning: "planning",
  running: "working",
  verifying: "verifying",
  blocked: "blocked",
  done: "done",
};

const taskStatusLabel: Record<TaskStatus, string> = {
  blocked: "Blocked",
  done: "Done",
  planning: "Plan",
  queued: "Queue",
  running: "Build",
  verifying: "Verify",
};

const taskSourceLabel: Record<AgentSession["source"], string> = {
  claude: "Claude",
  codex: "Codex",
  simulated: "Demo",
};

const taskStatusAccent: Record<TaskStatus, string> = {
  blocked: "#ef7b45",
  done: "#b48a4c",
  planning: "#7ca66a",
  queued: "#d8b16a",
  running: "#5d8fc7",
  verifying: "#58a976",
};

const getAgentAction = (agent: AgentSession): AgentAction => {
  if (agent.appType === "subagent" && agent.status === "running") {
    return "carry_task";
  }

  return statusToAction[agent.status];
};

const getWalkingAction = (from: Point, to: Point): AgentAction => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? "walk_right" : "walk_left";
  }

  return dy > 0 ? "walk_down" : "walk_up";
};

const getDistance = (from: Point, to: Point) =>
  Math.hypot(to.x - from.x, to.y - from.y);

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const animatedActions: AgentAction[] = [
  "idle",
  "walk_down",
  "walk_up",
  "walk_left",
  "walk_right",
  "planning",
  "working",
  "verifying",
  "blocked",
  "done",
  "carry_task",
  "handoff",
  "summon_subagent",
  "merge_result",
];

const advancedActions: AgentAction[] = [
  "handoff",
  "summon_subagent",
  "merge_result",
];

const advancedActionByEventType: Partial<
  Record<SceneEvent["type"], AgentAction>
> = {
  handoff: "handoff",
  merge_result: "merge_result",
  summon_subagent: "summon_subagent",
};

const densityViewportByMode: Partial<
  Record<SceneDensityMode, { focus: Point; zoom: number }>
> = {
  readability: { focus: { x: 842, y: 318 }, zoom: 1.12 },
  stress12: { focus: { x: 852, y: 330 }, zoom: 1.02 },
  stress24: { focus: { x: 850, y: 360 }, zoom: 0.9 },
  stress30: { focus: { x: 845, y: 382 }, zoom: 0.82 },
};

interface ViewportState {
  fitScale: number;
  panX: number;
  panY: number;
  stageWidth: number;
  stageHeight: number;
  zoom: number;
}

const constrainViewport = (viewport: ViewportState): ViewportState => {
  if (viewport.stageWidth <= 0 || viewport.stageHeight <= 0) {
    return viewport;
  }

  const scale = viewport.fitScale * viewport.zoom;
  const mapWidth = sceneAssets.coordinateSpace.width * scale;
  const mapHeight = sceneAssets.coordinateSpace.height * scale;
  const maxPanX = Math.max(0, (mapWidth - viewport.stageWidth) / 2);
  const maxPanY = Math.max(0, (mapHeight - viewport.stageHeight) / 2);

  return {
    ...viewport,
    panX: clamp(viewport.panX, -maxPanX, maxPanX),
    panY: clamp(viewport.panY, -maxPanY, maxPanY),
  };
};

interface ScenePerformanceSample {
  effectCount: number;
  fps: number;
  frameMs: number;
  routeCount: number;
  spriteCount: number;
  status: "ok" | "watch";
}

interface PerformanceAccumulator {
  elapsedMs: number;
  frameCount: number;
  frameMsTotal: number;
}

interface AnimatedAgentSprite {
  advancedFramesByAction?: Partial<Record<AgentAction, Texture[]>>;
  advancedSheet?: SpriteSheetDefinition;
  framesByAction: Partial<Record<AgentAction, Texture[]>>;
  id: string;
  layer: Container;
  phase: number;
  selectionRing: Graphics;
  sheet: SpriteSheetDefinition;
  sprite: Sprite;
  spriteSheetId: string;
  statusAction: AgentAction;
  target: Point;
}

interface AgentActionOverride {
  action: AgentAction;
  duration: number;
  eventId: string;
  startedAt: number;
}

interface SceneEventEffect {
  badge: Graphics;
  glyph: Graphics;
  id: string;
  ring: Graphics;
  root: Container;
  startedAt: number;
  duration: number;
  type: SceneEvent["type"];
}

interface SubagentRouteEffect {
  beacon: Graphics;
  duration: number;
  framesByAction: Partial<Record<AgentAction, Texture[]>>;
  id: string;
  mode: "recycle" | "spawn";
  path: Point[];
  phase: number;
  root: Container;
  sheet: SpriteSheetDefinition;
  sprite: Sprite;
  startedAt: number;
  trail: Graphics;
}

interface SceneFeedback {
  id: string;
  position: Point;
  type: "blocked" | "completed" | "task_created";
}

const visualEventStyles: Partial<
  Record<SceneEvent["type"], { color: number; fill: number; duration: number }>
> = {
  blocked: { color: 0xff7a45, fill: 0xffeadc, duration: 4.8 },
  completed: { color: 0x5fbf74, fill: 0xe9fff0, duration: 4.4 },
  handoff: { color: 0x559fe8, fill: 0xeaf5ff, duration: 3.4 },
  merge_result: { color: 0x8a7bd7, fill: 0xf1efff, duration: 3.6 },
  summon_subagent: { color: 0xd59b33, fill: 0xfff3d6, duration: 3.6 },
  task_created: { color: 0x559fe8, fill: 0xeaf5ff, duration: 4.2 },
};

const getEffectStatus = (event: SceneEvent, task?: TaskCard): TaskStatus => {
  if (event.type === "blocked") {
    return "blocked";
  }

  if (event.type === "completed") {
    return "done";
  }

  if (event.type === "task_created") {
    return "queued";
  }

  return task?.status ?? "running";
};

const getRoomPosition = (roomId: string): Point => {
  const spawnPoint = sceneAssets.spawnPoints.find(
    (spawn) => spawn.roomId === roomId,
  );
  const room = sceneAssets.rooms.find((item) => item.id === roomId);

  return (
    spawnPoint?.position ??
    room?.center ?? {
      x: sceneAssets.coordinateSpace.width / 2,
      y: sceneAssets.coordinateSpace.height / 2,
    }
  );
};

const getRoomEffectPosition = (status: TaskStatus): Point =>
  getRoomPosition(getRoomIdForTaskStatus(status));

const isSubagentRouteEvent = (type: SceneEvent["type"]) =>
  type === "subagent_spawned" || type === "subagent_recycled";

const getPathDistance = (path: Point[]) =>
  path
    .slice(1)
    .reduce(
      (total, point, index) => total + getDistance(path[index], point),
      0,
    );

const getPointOnPath = (path: Point[], progress: number): Point => {
  if (path.length === 0) {
    return { x: 0, y: 0 };
  }

  if (path.length === 1) {
    return path[0];
  }

  const totalDistance = getPathDistance(path);
  let remainingDistance = totalDistance * clamp(progress, 0, 1);

  for (let index = 1; index < path.length; index += 1) {
    const start = path[index - 1];
    const end = path[index];
    const segmentDistance = getDistance(start, end);

    if (remainingDistance <= segmentDistance || index === path.length - 1) {
      const ratio =
        segmentDistance === 0 ? 1 : remainingDistance / segmentDistance;

      return {
        x: start.x + (end.x - start.x) * ratio,
        y: start.y + (end.y - start.y) * ratio,
      };
    }

    remainingDistance -= segmentDistance;
  }

  return path[path.length - 1];
};

const createTaskRoutePath = (from: Point, to: Point, lift = 48) => {
  const controlY = Math.min(from.y, to.y) - lift;
  const firstControl = {
    x: from.x + (to.x - from.x) * 0.28,
    y: controlY,
  };
  const secondControl = {
    x: from.x + (to.x - from.x) * 0.72,
    y: controlY,
  };

  return `M ${Math.round(from.x)} ${Math.round(from.y)} C ${Math.round(firstControl.x)} ${Math.round(firstControl.y)}, ${Math.round(secondControl.x)} ${Math.round(secondControl.y)}, ${Math.round(to.x)} ${Math.round(to.y)}`;
};

const createSubagentPath = (from: Point, to: Point): Point[] => {
  const gardenPath = sceneAssets.rooms.find(
    (room) => room.id === "garden_path",
  );
  const midpoint = gardenPath?.center ?? {
    x: (from.x + to.x) / 2,
    y: Math.max(from.y, to.y) + 60,
  };

  return [from, midpoint, to];
};

const drawEffectGlyph = (
  glyph: Graphics,
  type: SceneEvent["type"],
  color: number,
) => {
  if (type === "completed") {
    glyph.moveTo(-15, -2).lineTo(-4, 11).lineTo(17, -14).stroke({
      color,
      width: 7,
      cap: "round",
      join: "round",
    });
    return;
  }

  if (type === "blocked") {
    glyph
      .moveTo(0, -18)
      .lineTo(18, 15)
      .lineTo(-18, 15)
      .closePath()
      .fill({ color, alpha: 0.18 })
      .stroke({ color, width: 5, join: "round" });
    glyph.roundRect(-3, -6, 6, 13, 3).fill({ color });
    glyph.circle(0, 13, 3.5).fill({ color });
    return;
  }

  if (type === "handoff") {
    glyph
      .moveTo(-18, -8)
      .lineTo(10, -8)
      .lineTo(3, -15)
      .moveTo(10, -8)
      .lineTo(3, -1)
      .moveTo(18, 9)
      .lineTo(-10, 9)
      .lineTo(-3, 2)
      .moveTo(-10, 9)
      .lineTo(-3, 16)
      .stroke({ color, width: 5, cap: "round", join: "round" });
    return;
  }

  if (type === "summon_subagent") {
    glyph
      .circle(0, 2, 11)
      .fill({ color: 0xffffff, alpha: 0.45 })
      .stroke({ color, width: 5 });
    glyph
      .moveTo(-4, 2)
      .lineTo(4, 2)
      .moveTo(0, -2)
      .lineTo(0, 6)
      .stroke({ color, width: 4, cap: "round" });
    glyph
      .moveTo(-19, -12)
      .lineTo(-25, -19)
      .moveTo(19, -12)
      .lineTo(25, -19)
      .moveTo(-22, 17)
      .lineTo(-29, 23)
      .moveTo(22, 17)
      .lineTo(29, 23)
      .stroke({ color, width: 4, cap: "round" });
    return;
  }

  if (type === "merge_result") {
    glyph
      .moveTo(-19, -14)
      .lineTo(-4, -2)
      .lineTo(17, -2)
      .moveTo(-19, 14)
      .lineTo(-4, 2)
      .lineTo(17, 2)
      .stroke({ color, width: 5, cap: "round", join: "round" });
    glyph
      .moveTo(9, -10)
      .lineTo(18, 0)
      .lineTo(9, 10)
      .stroke({ color, width: 5, cap: "round", join: "round" });
    return;
  }

  glyph
    .roundRect(-16, -13, 32, 26, 5)
    .fill({ color: 0xffffff, alpha: 0.6 })
    .stroke({ color, width: 5 });
  glyph.moveTo(-7, -3).lineTo(7, -3).moveTo(-7, 6).lineTo(4, 6).stroke({
    color,
    width: 3,
    cap: "round",
  });
};

const createSceneEventEffect = (
  event: SceneEvent,
  position: Point,
  startedAt: number,
): SceneEventEffect | undefined => {
  const style = visualEventStyles[event.type];
  if (!style) {
    return undefined;
  }

  const root = new Container();
  const ring = new Graphics()
    .circle(0, 0, 38)
    .fill({ color: style.color, alpha: 0.12 })
    .stroke({ color: style.color, alpha: 0.92, width: 6 });
  const badge = new Graphics()
    .roundRect(-28, -64, 56, 34, 12)
    .fill({ color: style.fill, alpha: 0.96 })
    .stroke({ color: style.color, alpha: 0.9, width: 4 });
  const glyph = new Graphics();

  drawEffectGlyph(glyph, event.type, style.color);
  glyph.position.set(0, -47);
  root.position.set(position.x, position.y);
  root.addChild(ring);
  root.addChild(badge);
  root.addChild(glyph);

  return {
    badge,
    duration: style.duration,
    glyph,
    id: event.id,
    ring,
    root,
    startedAt,
    type: event.type,
  };
};

const updateSceneEventEffect = (effect: SceneEventEffect, now: number) => {
  const progress = clamp((now - effect.startedAt) / effect.duration, 0, 1);
  const easeOut = 1 - (1 - progress) ** 3;
  const fade = progress < 0.68 ? 1 : clamp((1 - progress) * 3.15, 0, 1);
  const badgeFloat = effect.type === "blocked" ? 26 : 18;

  effect.ring.scale.set(0.72 + easeOut * 1.65);
  effect.ring.alpha = fade;
  effect.badge.y = -easeOut * badgeFloat;
  effect.badge.alpha = clamp(fade + 0.15, 0, 1);
  effect.glyph.y = -47 - easeOut * badgeFloat;
  effect.glyph.alpha = effect.badge.alpha;

  return progress >= 1;
};

const createSpriteFrames = (
  sheet: SpriteSheetDefinition,
  baseTexture: Texture,
  action: AgentAction,
) => {
  const row = sheet.actionRows[action] ?? sheet.actionRows.idle ?? 0;
  const frameCount =
    sheet.actionFrameCounts[action] ??
    sheet.actionFrameCounts.idle ??
    sheet.columns;

  return Array.from({ length: frameCount }, (_, frameIndex) => {
    const frame = new Rectangle(
      frameIndex * sheet.frameWidth,
      row * sheet.frameHeight,
      sheet.frameWidth,
      sheet.frameHeight,
    );

    return new Texture({ source: baseTexture.source, frame });
  });
};

const getDecorationTextureKey = (assetType: string, assetId: string) =>
  `${assetType}:${assetId}`;

const renderDecorationLayer = (
  layer: Container,
  texturesByDecorationKey: Map<string, Texture>,
) => {
  layer.removeChildren();
  layer.sortableChildren = true;

  sceneAssets.decorations.forEach((decoration, index) => {
    const texture = texturesByDecorationKey.get(
      getDecorationTextureKey(decoration.assetType, decoration.assetId),
    );

    if (!texture) {
      return;
    }

    const sprite = new Sprite(texture);

    sprite.anchor.set(decoration.anchor.x, decoration.anchor.y);
    sprite.position.set(decoration.position.x, decoration.position.y);
    sprite.scale.set(decoration.scale);
    sprite.rotation = decoration.rotation;
    sprite.alpha = decoration.alpha;
    sprite.eventMode = "none";
    sprite.zIndex = decoration.layer === "floor" ? index : index + 100;
    layer.addChild(sprite);
  });
};

const drawRoundedZone = ({
  borderColor,
  borderWidth = 8,
  fillColor,
  height,
  layer,
  radius = 24,
  shadow = true,
  width,
  x,
  y,
}: {
  borderColor: number;
  borderWidth?: number;
  fillColor: number;
  height: number;
  layer: Container;
  radius?: number;
  shadow?: boolean;
  width: number;
  x: number;
  y: number;
}) => {
  if (shadow) {
    layer.addChild(
      new Graphics()
        .roundRect(x + 10, y + 12, width, height, radius)
        .fill({ color: 0x364526, alpha: 0.16 }),
    );
  }

  layer.addChild(
    new Graphics()
      .roundRect(x, y, width, height, radius)
      .fill({ color: fillColor, alpha: 0.92 })
      .stroke({ color: borderColor, width: borderWidth, alpha: 0.82 }),
  );
};

const drawStonePath = (layer: Container, points: Point[], color = 0xe4d2aa) => {
  points.forEach((point, index) => {
    const stone = new Graphics()
      .ellipse(point.x, point.y, 18 + (index % 3) * 3, 10 + (index % 2) * 2)
      .fill({ color, alpha: 0.82 })
      .stroke({ color: 0x9b8a66, width: 2, alpha: 0.26 });

    stone.rotation = (index % 5) * 0.1 - 0.2;
    layer.addChild(stone);
  });
};

const getInterpolatedPathPoints = (points: Point[], step = 34) => {
  const result: Point[] = [];

  points.slice(1).forEach((point, index) => {
    const start = points[index];
    const distance = getDistance(start, point);
    const count = Math.max(2, Math.floor(distance / step));

    for (let itemIndex = 0; itemIndex < count; itemIndex += 1) {
      const ratio = itemIndex / count;

      result.push({
        x: start.x + (point.x - start.x) * ratio,
        y: start.y + (point.y - start.y) * ratio,
      });
    }
  });

  result.push(points[points.length - 1]);
  return result;
};

const drawDottedRoute = (
  layer: Container,
  points: Point[],
  color: number,
  dotRadius = 5,
) => {
  getInterpolatedPathPoints(points, 30).forEach((point, index) => {
    layer.addChild(
      new Graphics()
        .circle(point.x, point.y, index % 4 === 0 ? dotRadius + 1 : dotRadius)
        .fill({ color, alpha: 0.8 }),
    );
  });
};

const drawPlant = (
  layer: Container,
  point: Point,
  scale = 1,
  trunk = false,
) => {
  if (trunk) {
    layer.addChild(
      new Graphics()
        .roundRect(point.x - 7 * scale, point.y + 8 * scale, 14 * scale, 22 * scale, 5 * scale)
        .fill({ color: 0x8b653b, alpha: 0.88 }),
    );
  }

  [
    { x: 0, y: 0, r: 22 },
    { x: -16, y: 8, r: 15 },
    { x: 17, y: 8, r: 16 },
    { x: -7, y: -13, r: 14 },
  ].forEach((leaf, index) => {
    layer.addChild(
      new Graphics()
        .circle(
          point.x + leaf.x * scale,
          point.y + leaf.y * scale,
          leaf.r * scale,
        )
        .fill({
          color: index % 2 === 0 ? 0x4e8b47 : 0x6aa45a,
          alpha: 0.96,
        })
        .stroke({ color: 0x2f6638, width: 2 * scale, alpha: 0.28 }),
    );
  });
};

const drawWallSegments = (layer: Container) => {
  const wallColor = 0x8a7550;
  const trimColor = 0x52452e;

  [
    { x: 260, y: 18, width: 960, height: 24 },
    { x: 280, y: 36, width: 22, height: 575 },
    { x: 1180, y: 36, width: 22, height: 405 },
    { x: 335, y: 612, width: 345, height: 22 },
    { x: 450, y: 714, width: 645, height: 22 },
    { x: 1030, y: 430, width: 300, height: 22 },
    { x: 1378, y: 490, width: 22, height: 405 },
    { x: 232, y: 894, width: 1136, height: 22 },
  ].forEach((segment) => {
    layer.addChild(
      new Graphics()
        .roundRect(segment.x, segment.y, segment.width, segment.height, 10)
        .fill({ color: wallColor, alpha: 0.9 })
        .stroke({ color: trimColor, width: 3, alpha: 0.45 }),
    );
  });
};

const addCampusSprite = (
  layer: Container,
  texturesByDecorationKey: Map<string, Texture>,
  assetType: "prop" | "tile",
  assetId: string,
  point: Point,
  scale: number,
  alpha = 0.9,
  rotation = 0,
) => {
  const texture = texturesByDecorationKey.get(`${assetType}:${assetId}`);

  if (!texture) {
    return;
  }

  const sprite = new Sprite(texture);

  sprite.anchor.set(0.5, 0.58);
  sprite.position.set(point.x, point.y);
  sprite.scale.set(scale);
  sprite.rotation = rotation;
  sprite.alpha = alpha;
  sprite.eventMode = "none";
  layer.addChild(sprite);
};

const createPrototypeBaseLayer = (texture: Texture) => {
  const layer = new Container();
  const sprite = new Sprite(texture);

  sprite.position.set(0, 0);
  sprite.width = sceneAssets.coordinateSpace.width;
  sprite.height = sceneAssets.coordinateSpace.height;
  sprite.eventMode = "none";
  layer.addChild(sprite);

  return layer;
};

const createDynamicCampusLayer = (
  texturesByDecorationKey: Map<string, Texture>,
) => {
  const layer = new Container();

  layer.addChild(
    new Graphics()
      .rect(0, 0, sceneAssets.coordinateSpace.width, sceneAssets.coordinateSpace.height)
      .fill({ color: 0x78b766, alpha: 1 }),
  );

  for (let y = 50; y < sceneAssets.coordinateSpace.height; y += 120) {
    for (let x = 54; x < sceneAssets.coordinateSpace.width; x += 138) {
      layer.addChild(
        new Graphics()
          .circle(x + ((x + y) % 30), y + ((x * 2 + y) % 24), 2.4)
          .fill({ color: 0xe6f0b6, alpha: 0.38 }),
      );
    }
  }

  drawStonePath(
    layer,
    getInterpolatedPathPoints(
      [
        { x: 170, y: 825 },
        { x: 265, y: 735 },
        { x: 500, y: 640 },
        { x: 735, y: 615 },
        { x: 930, y: 610 },
        { x: 1145, y: 560 },
        { x: 1325, y: 735 },
      ],
      38,
    ),
  );
  drawStonePath(
    layer,
    getInterpolatedPathPoints(
      [
        { x: 750, y: 610 },
        { x: 715, y: 700 },
        { x: 700, y: 820 },
      ],
      34,
    ),
    0xead9b6,
  );

  drawRoundedZone({
    borderColor: 0x65543a,
    fillColor: 0xd9b77b,
    height: 565,
    layer,
    radius: 28,
    width: 930,
    x: 300,
    y: 48,
  });
  drawRoundedZone({
    borderColor: 0x63503a,
    fillColor: 0xcaa16a,
    height: 195,
    layer,
    radius: 28,
    width: 415,
    x: 540,
    y: 560,
  });
  drawRoundedZone({
    borderColor: 0x9a4432,
    fillColor: 0xd86a4b,
    height: 220,
    layer,
    radius: 26,
    width: 300,
    x: 1010,
    y: 500,
  });
  drawRoundedZone({
    borderColor: 0x705b3e,
    fillColor: 0xcda46d,
    height: 185,
    layer,
    radius: 26,
    width: 765,
    x: 425,
    y: 745,
  });
  drawRoundedZone({
    borderColor: 0x705b3e,
    fillColor: 0xcaa36e,
    height: 188,
    layer,
    radius: 24,
    width: 230,
    x: 96,
    y: 720,
  });
  drawRoundedZone({
    borderColor: 0x705b3e,
    fillColor: 0xcaa36e,
    height: 190,
    layer,
    radius: 24,
    width: 210,
    x: 1280,
    y: 720,
  });

  drawWallSegments(layer);

  drawDottedRoute(
    layer,
    [
      { x: 310, y: 620 },
      { x: 525, y: 620 },
      { x: 680, y: 654 },
      { x: 908, y: 650 },
      { x: 1055, y: 600 },
    ],
    0xffcf4c,
    5.5,
  );
  drawDottedRoute(
    layer,
    [
      { x: 940, y: 620 },
      { x: 1010, y: 610 },
      { x: 1070, y: 560 },
      { x: 1125, y: 510 },
    ],
    0xff9860,
    5,
  );
  drawDottedRoute(
    layer,
    [
      { x: 700, y: 744 },
      { x: 720, y: 690 },
      { x: 742, y: 630 },
    ],
    0xffcf4c,
    5,
  );

  [
    { x: 120, y: 80, scale: 1.05, trunk: true },
    { x: 185, y: 112, scale: 0.9, trunk: true },
    { x: 1328, y: 88, scale: 1.06, trunk: true },
    { x: 1430, y: 132, scale: 0.94, trunk: true },
    { x: 128, y: 590, scale: 0.78, trunk: false },
    { x: 244, y: 650, scale: 0.76, trunk: false },
    { x: 1358, y: 395, scale: 0.82, trunk: false },
    { x: 1422, y: 632, scale: 0.88, trunk: false },
    { x: 360, y: 880, scale: 0.72, trunk: false },
    { x: 1224, y: 885, scale: 0.74, trunk: false },
  ].forEach((plant) => drawPlant(layer, plant, plant.scale, plant.trunk));

  addCampusSprite(layer, texturesByDecorationKey, "prop", "task_board", { x: 385, y: 114 }, 0.32, 0.86);
  addCampusSprite(layer, texturesByDecorationKey, "prop", "terminal_station", { x: 735, y: 622 }, 0.32, 0.8);
  addCampusSprite(layer, texturesByDecorationKey, "prop", "alert_lamp", { x: 1048, y: 540 }, 0.22, 0.88);
  addCampusSprite(layer, texturesByDecorationKey, "prop", "checklist_table", { x: 1242, y: 622 }, 0.28, 0.84);
  addCampusSprite(layer, texturesByDecorationKey, "prop", "archive_shelf", { x: 1358, y: 785 }, 0.3, 0.82);
  addCampusSprite(layer, texturesByDecorationKey, "prop", "waiting_chair", { x: 205, y: 805 }, 0.25, 0.84);
  addCampusSprite(layer, texturesByDecorationKey, "prop", "server_cabinet", { x: 260, y: 165 }, 0.25, 0.8);

  layer.addChild(
    new Graphics()
      .circle(145, 610, 56)
      .fill({ color: 0x83c5cf, alpha: 0.82 })
      .stroke({ color: 0x5a8d96, width: 5, alpha: 0.42 }),
  );
  layer.addChild(
    new Graphics()
      .circle(145, 610, 27)
      .fill({ color: 0x5ba8b7, alpha: 0.74 }),
  );

  return layer;
};

const createSubagentRouteEffect = (
  id: string,
  mode: SubagentRouteEffect["mode"],
  path: Point[],
  sheet: SpriteSheetDefinition,
  framesByAction: Partial<Record<AgentAction, Texture[]>>,
  startedAt: number,
): SubagentRouteEffect => {
  const root = new Container();
  const trail = new Graphics();
  const beacon = new Graphics()
    .ellipse(0, 18, 46, 14)
    .fill({ color: mode === "spawn" ? 0x6fbf78 : 0xc89745, alpha: 0.22 })
    .stroke({
      color: mode === "spawn" ? 0x4d9b58 : 0xb07b2d,
      alpha: 0.75,
      width: 3,
    });
  const sprite = new Sprite(
    framesByAction[mode === "spawn" ? "walk_down" : "carry_task"]?.[0] ??
      framesByAction.idle?.[0],
  );

  trail.moveTo(path[0].x, path[0].y);
  path.slice(1).forEach((point) => trail.lineTo(point.x, point.y));
  trail.stroke({
    color: mode === "spawn" ? 0x67b96f : 0xc99b45,
    width: 6,
    alpha: 0.48,
    cap: "round",
    join: "round",
  });

  sprite.anchor.set(sheet.anchor.x, sheet.anchor.y);
  sprite.scale.set(0.38);
  root.addChild(trail);
  root.addChild(beacon);
  root.addChild(sprite);

  return {
    beacon,
    duration: mode === "spawn" ? 6.2 : 6.6,
    framesByAction,
    id,
    mode,
    path,
    phase: mode === "spawn" ? 0.17 : 0.61,
    root,
    sheet,
    sprite,
    startedAt,
    trail,
  };
};

const updateSubagentRouteEffect = (
  effect: SubagentRouteEffect,
  now: number,
) => {
  const progress = clamp((now - effect.startedAt) / effect.duration, 0, 1);
  const point = getPointOnPath(effect.path, progress);
  const lookAhead = getPointOnPath(effect.path, Math.min(progress + 0.035, 1));
  const action =
    effect.mode === "recycle"
      ? "carry_task"
      : getWalkingAction(point, lookAhead);
  const frames =
    effect.framesByAction[action] ??
    effect.framesByAction.walk_down ??
    effect.framesByAction.idle;
  const fade =
    progress < 0.12
      ? progress / 0.12
      : progress > 0.88
        ? clamp((1 - progress) / 0.12, 0, 1)
        : 1;
  const bob = Math.sin(now * 9 + effect.phase) * 7;

  effect.sprite.position.set(point.x, point.y + bob);
  effect.beacon.position.set(point.x, point.y + 20);
  effect.sprite.alpha = fade;
  effect.beacon.alpha = fade;
  effect.trail.alpha = fade * 0.72;

  if (frames?.length) {
    const fps =
      effect.sheet.actionFps[action] ??
      effect.sheet.actionFps.carry_task ??
      (action.startsWith("walk_") ? 10 : 7);
    const frameIndex = Math.floor(now * fps + effect.phase) % frames.length;
    effect.sprite.texture = frames[frameIndex];
  }

  return progress >= 1;
};

export function SceneCanvas() {
  const frameRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const decorationLayerRef = useRef<Container | null>(null);
  const effectsLayerRef = useRef<Container | null>(null);
  const eventEffectsRef = useRef(new Map<string, SceneEventEffect>());
  const subagentRouteEffectsRef = useRef(
    new Map<string, SubagentRouteEffect>(),
  );
  const worldRef = useRef<Container | null>(null);
  const actionOverridesRef = useRef(new Map<string, AgentActionOverride>());
  const agentSpritesRef = useRef(new Map<string, AnimatedAgentSprite>());
  const lastAgentPositionRef = useRef(new Map<string, Point>());
  const seenEventIdsRef = useRef(new Set<string>());
  const feedbackTimersRef = useRef<number[]>([]);
  const subagentRouteFramesRef = useRef<Partial<
    Record<AgentAction, Texture[]>
  > | null>(null);
  const texturesBySheetIdRef = useRef(new Map<string, Texture>());
  const advancedTexturesBySheetIdRef = useRef(new Map<string, Texture>());
  const focusMapPointRef = useRef<(point: Point, targetZoom?: number) => void>(
    () => undefined,
  );
  const selectAgentRef = useRef<(agentId: string) => void>(() => undefined);
  const selectTaskRef = useRef<(taskId: string) => void>(() => undefined);
  const performanceAccumulatorRef = useRef<PerformanceAccumulator>({
    elapsedMs: 0,
    frameCount: 0,
    frameMsTotal: 0,
  });
  const sceneDensityModeRef = useRef<SceneDensityMode>("live");
  const sceneViewportPreference = useAgentWorldStore(
    (state) => state.sceneViewportPreference,
  );
  const setSceneViewportPreference = useAgentWorldStore(
    (state) => state.setSceneViewportPreference,
  );
  const viewportRef = useRef<ViewportState>({
    fitScale: 1,
    panX: sceneViewportPreference.panX,
    panY: sceneViewportPreference.panY,
    stageWidth: 0,
    stageHeight: 0,
    zoom: clamp(sceneViewportPreference.zoom, MIN_ZOOM, MAX_ZOOM),
  });
  const dragStartRef = useRef({ clientX: 0, clientY: 0, panX: 0, panY: 0 });
  const hasHydratedEventsRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragMovedRef = useRef(false);
  const viewportPersistTimerRef = useRef<number | null>(null);
  const lastHandledFocusRequestRef = useRef(0);
  const lastHandledRoomFocusRequestRef = useRef(0);
  const lastHandledTaskFocusRequestRef = useRef(0);
  const lastHandledSceneDensityModeRef = useRef<string | null>(null);
  const agentFocusRequest = useAgentWorldStore(
    (state) => state.agentFocusRequest,
  );
  const roomFocusRequest = useAgentWorldStore(
    (state) => state.roomFocusRequest,
  );
  const taskFocusRequest = useAgentWorldStore(
    (state) => state.taskFocusRequest,
  );
  const agents = useAgentWorldStore((state) => state.agents);
  const events = useAgentWorldStore((state) => state.events);
  const tasks = useAgentWorldStore((state) => state.tasks);
  const sceneDensityMode = useAgentWorldStore(
    (state) => state.preferences.sceneDensityMode,
  );
  const selectedAgentId = useAgentWorldStore((state) => state.selectedAgentId);
  const selectedTaskId = useAgentWorldStore((state) => state.selectedTaskId);
  const selectAgent = useAgentWorldStore((state) => state.selectAgent);
  const selectTask = useAgentWorldStore((state) => state.selectTask);
  const [isDragging, setIsDragging] = useState(false);
  const [isSceneReady, setIsSceneReady] = useState(false);
  const [performanceSample, setPerformanceSample] =
    useState<ScenePerformanceSample | null>(null);
  const [sceneFeedbacks, setSceneFeedbacks] = useState<SceneFeedback[]>([]);
  const [viewport, setViewport] = useState<ViewportState>(viewportRef.current);
  const sceneAgents = useMemo(
    () => buildSceneAgents(agents, tasks, sceneDensityMode),
    [agents, sceneDensityMode, tasks],
  );
  const taskDeskPlacements = useMemo(
    () => buildTaskDeskPlacements(tasks),
    [tasks],
  );
  const sceneFlowNodes = useMemo(() => buildSceneFlowNodes(tasks), [tasks]);
  const realSessionWaitingZone = useMemo(
    () => buildRealSessionWaitingZone(agents, tasks),
    [agents, tasks],
  );
  const selectedTaskPlacement = useMemo(
    () => taskDeskPlacements.find((item) => item.task.id === selectedTaskId),
    [selectedTaskId, taskDeskPlacements],
  );
  const selectedTaskRoute = useMemo(() => {
    if (!selectedTaskPlacement) {
      return null;
    }

    const taskCenter = sceneFlowNodes.find((node) => node.id === "task-center");
    const blockedCenter = sceneFlowNodes.find(
      (node) => node.id === "blocked-center",
    );
    const targetNode =
      selectedTaskPlacement.task.status === "blocked"
        ? blockedCenter
        : taskCenter;

    if (!targetNode) {
      return null;
    }

    return {
      className:
        selectedTaskPlacement.task.status === "blocked"
          ? "route-selected route-selected-blocked"
          : "route-selected",
      path: createTaskRoutePath(
        {
          x: selectedTaskPlacement.position.x,
          y: selectedTaskPlacement.position.y + 44,
        },
        targetNode.position,
        selectedTaskPlacement.task.status === "blocked" ? 72 : 54,
      ),
    };
  }, [sceneFlowNodes, selectedTaskPlacement]);
  const agentsById = useMemo(
    () => new Map(agents.map((agent) => [agent.id, agent] as const)),
    [agents],
  );

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId),
    [selectedTaskId, tasks],
  );

  const getTaskSourceLabel = useCallback(
    (task: TaskCard) => {
      const assignee = task.assigneeAgentId
        ? agentsById.get(task.assigneeAgentId)
        : undefined;

      return assignee ? taskSourceLabel[assignee.source] : "Unassigned";
    },
    [agentsById],
  );

  const applyViewport = useCallback((nextViewport: ViewportState) => {
    const world = worldRef.current;
    if (!world) {
      return;
    }

    const scale = nextViewport.fitScale * nextViewport.zoom;
    world.scale.set(scale);
    world.position.set(
      (nextViewport.stageWidth - sceneAssets.coordinateSpace.width * scale) /
        2 +
        nextViewport.panX,
      (nextViewport.stageHeight - sceneAssets.coordinateSpace.height * scale) /
        2 +
        nextViewport.panY,
    );
  }, []);

  const persistViewportPreference = useCallback(
    (nextViewport: ViewportState) => {
      if (viewportPersistTimerRef.current) {
        window.clearTimeout(viewportPersistTimerRef.current);
      }

      viewportPersistTimerRef.current = window.setTimeout(() => {
        setSceneViewportPreference({
          panX: Math.round(nextViewport.panX),
          panY: Math.round(nextViewport.panY),
          zoom: Number(nextViewport.zoom.toFixed(3)),
        });
        viewportPersistTimerRef.current = null;
      }, 180);
    },
    [setSceneViewportPreference],
  );

  const setNextViewport = useCallback(
    (
      updater: (current: ViewportState) => ViewportState,
      options: { persist?: boolean } = {},
    ) => {
      setViewport((current) => {
        const next = constrainViewport(updater(current));
        viewportRef.current = next;
        applyViewport(next);
        if (options.persist) {
          persistViewportPreference(next);
        }
        return next;
      });
    },
    [applyViewport, persistViewportPreference],
  );

  const focusMapPoint = useCallback(
    (
      point: Point,
      targetZoom = TASK_FOCUS_ZOOM,
      options: { persist?: boolean } = {},
    ) => {
      setNextViewport(
        (current) => {
          const zoom = clamp(targetZoom, MIN_ZOOM, MAX_ZOOM);
          const scale = current.fitScale * zoom;
          const originX =
            (current.stageWidth - sceneAssets.coordinateSpace.width * scale) /
            2;
          const originY =
            (current.stageHeight - sceneAssets.coordinateSpace.height * scale) /
            2;

          return {
            ...current,
            panX: current.stageWidth / 2 - originX - point.x * scale,
            panY: current.stageHeight / 2 - originY - point.y * scale,
            zoom,
          };
        },
        { persist: options.persist ?? false },
      );
    },
    [setNextViewport],
  );

  const zoomAtStagePoint = useCallback(
    (stageX: number, stageY: number, targetZoom: number) => {
      setNextViewport(
        (current) => {
          const zoom = clamp(targetZoom, MIN_ZOOM, MAX_ZOOM);
          const currentScale = current.fitScale * current.zoom;
          const currentOriginX =
            (current.stageWidth -
              sceneAssets.coordinateSpace.width * currentScale) /
              2 +
            current.panX;
          const currentOriginY =
            (current.stageHeight -
              sceneAssets.coordinateSpace.height * currentScale) /
              2 +
            current.panY;
          const mapX = (stageX - currentOriginX) / currentScale;
          const mapY = (stageY - currentOriginY) / currentScale;
          const nextScale = current.fitScale * zoom;
          const nextOriginX =
            (current.stageWidth -
              sceneAssets.coordinateSpace.width * nextScale) /
            2;
          const nextOriginY =
            (current.stageHeight -
              sceneAssets.coordinateSpace.height * nextScale) /
            2;

          return {
            ...current,
            panX: stageX - nextOriginX - mapX * nextScale,
            panY: stageY - nextOriginY - mapY * nextScale,
            zoom,
          };
        },
        { persist: true },
      );
    },
    [setNextViewport],
  );

  const resetViewport = useCallback(() => {
    setNextViewport(
      (current) => ({
        ...current,
        panX: 0,
        panY: 0,
        zoom: OVERVIEW_ZOOM,
      }),
      { persist: true },
    );
  }, [setNextViewport]);

  useEffect(() => {
    if (!isSceneReady) {
      return;
    }

    const preferredZoom = clamp(
      sceneViewportPreference.zoom,
      MIN_ZOOM,
      MAX_ZOOM,
    );
    const current = viewportRef.current;
    const isAlreadyApplied =
      Math.round(current.panX) === Math.round(sceneViewportPreference.panX) &&
      Math.round(current.panY) === Math.round(sceneViewportPreference.panY) &&
      Math.abs(current.zoom - preferredZoom) < 0.002;

    if (isAlreadyApplied) {
      return;
    }

    setNextViewport((latest) => ({
      ...latest,
      panX: sceneViewportPreference.panX,
      panY: sceneViewportPreference.panY,
      zoom: preferredZoom,
    }));
  }, [
    isSceneReady,
    sceneViewportPreference.panX,
    sceneViewportPreference.panY,
    sceneViewportPreference.zoom,
    setNextViewport,
  ]);

  useEffect(() => {
    focusMapPointRef.current = focusMapPoint;
    selectAgentRef.current = selectAgent;
    selectTaskRef.current = selectTask;
  }, [focusMapPoint, selectAgent, selectTask]);

  useEffect(() => {
    sceneDensityModeRef.current = sceneDensityMode;
    performanceAccumulatorRef.current = {
      elapsedMs: 0,
      frameCount: 0,
      frameMsTotal: 0,
    };

    if (sceneDensityMode !== "stress30") {
      setPerformanceSample(null);
    }
  }, [sceneDensityMode]);

  useEffect(() => {
    if (
      !isSceneReady ||
      lastHandledSceneDensityModeRef.current === sceneDensityMode
    ) {
      return;
    }

    lastHandledSceneDensityModeRef.current = sceneDensityMode;

    const densityViewport = densityViewportByMode[sceneDensityMode];

    if (densityViewport) {
      focusMapPoint(densityViewport.focus, densityViewport.zoom);
    }
  }, [focusMapPoint, isSceneReady, sceneDensityMode]);

  useEffect(
    () => () => {
      if (viewportPersistTimerRef.current) {
        window.clearTimeout(viewportPersistTimerRef.current);
      }
    },
    [],
  );

  const overlayStyle = useMemo(() => {
    const scale = viewport.fitScale * viewport.zoom;
    const x =
      (viewport.stageWidth - sceneAssets.coordinateSpace.width * scale) / 2 +
      viewport.panX;
    const y =
      (viewport.stageHeight - sceneAssets.coordinateSpace.height * scale) / 2 +
      viewport.panY;

    return {
      height: sceneAssets.coordinateSpace.height,
      transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`,
      width: sceneAssets.coordinateSpace.width,
    };
  }, [viewport]);

  useEffect(() => {
    const host = stageRef.current;
    const frame = frameRef.current;
    if (!host || !frame) {
      return undefined;
    }

    let isMounted = true;
    let isTickerAttached = false;
    const app = new Application();
    const world = new Container();
    const updateAnimations = () => {
      const now = performance.now() / 1000;
      const step = Math.max(app.ticker.deltaMS / 1000, 0.016);

      agentSpritesRef.current.forEach((item) => {
        const current = { x: item.layer.position.x, y: item.layer.position.y };
        const distance = getDistance(current, item.target);
        const isMoving = distance > 2;
        const override = actionOverridesRef.current.get(item.id);
        const activeOverride =
          override &&
          now - override.startedAt < override.duration &&
          item.advancedFramesByAction?.[override.action]?.length
            ? override
            : undefined;
        const action = activeOverride
          ? activeOverride.action
          : isMoving
            ? getWalkingAction(current, item.target)
            : item.statusAction;
        const frames = activeOverride
          ? (item.advancedFramesByAction?.[activeOverride.action] ??
            item.framesByAction[item.statusAction] ??
            item.framesByAction.idle)
          : (item.framesByAction[action] ??
            item.framesByAction[item.statusAction] ??
            item.framesByAction.idle);

        if (!frames?.length) {
          return;
        }

        if (override && !activeOverride) {
          actionOverridesRef.current.delete(item.id);
        }

        if (isMoving) {
          const travel = Math.min(distance, step * 260);
          const ratio = distance === 0 ? 1 : travel / distance;

          item.layer.position.set(
            current.x + (item.target.x - current.x) * ratio,
            current.y + (item.target.y - current.y) * ratio,
          );
        } else {
          item.layer.position.set(item.target.x, item.target.y);
        }

        lastAgentPositionRef.current.set(item.id, {
          x: item.layer.position.x,
          y: item.layer.position.y,
        });

        const fps =
          (activeOverride
            ? item.advancedSheet?.actionFps[action]
            : undefined) ??
          item.sheet.actionFps[action] ??
          item.sheet.actionFps[item.statusAction] ??
          (action.startsWith("walk_") ? 10 : 6);
        const frameIndex = Math.floor(now * fps + item.phase) % frames.length;
        item.sprite.texture = frames[frameIndex];
      });

      eventEffectsRef.current.forEach((effect, id) => {
        if (updateSceneEventEffect(effect, now)) {
          effect.root.destroy({ children: true, texture: false });
          eventEffectsRef.current.delete(id);
        }
      });

      subagentRouteEffectsRef.current.forEach((effect, id) => {
        if (updateSubagentRouteEffect(effect, now)) {
          effect.root.destroy({ children: true, texture: false });
          subagentRouteEffectsRef.current.delete(id);
        }
      });

      if (sceneDensityModeRef.current === "stress30") {
        const deltaMs = clamp(app.ticker.deltaMS, 1, 120);
        const accumulator = performanceAccumulatorRef.current;

        accumulator.elapsedMs += deltaMs;
        accumulator.frameCount += 1;
        accumulator.frameMsTotal += deltaMs;

        if (accumulator.elapsedMs >= PERFORMANCE_SAMPLE_WINDOW_MS) {
          const frameMs = accumulator.frameMsTotal / accumulator.frameCount;
          const fps = (accumulator.frameCount * 1000) / accumulator.elapsedMs;

          setPerformanceSample({
            effectCount: eventEffectsRef.current.size,
            fps: Math.round(fps),
            frameMs: Number(frameMs.toFixed(1)),
            routeCount: subagentRouteEffectsRef.current.size,
            spriteCount: agentSpritesRef.current.size,
            status: fps >= 50 && frameMs <= 20 ? "ok" : "watch",
          });

          performanceAccumulatorRef.current = {
            elapsedMs: 0,
            frameCount: 0,
            frameMsTotal: 0,
          };
        }
      }
    };
    const resize = () => {
      const { width, height } = frame.getBoundingClientRect();
      app.renderer.resize(Math.max(1, width), Math.max(1, height));
      const scale = Math.max(
        width / sceneAssets.coordinateSpace.width,
        height / sceneAssets.coordinateSpace.height,
      );

      setNextViewport((current) => ({
        ...current,
        fitScale: scale,
        stageHeight: height,
        stageWidth: width,
      }));
    };

    const resizeObserver = new ResizeObserver(resize);

    void (async () => {
      await app.init({
        antialias: true,
        autoDensity: true,
        backgroundAlpha: 0,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        resizeTo: host,
      });

      if (!isMounted) {
        app.destroy();
        return;
      }

      app.canvas.className = "scene-canvas-surface";
      host.replaceChildren(app.canvas);
      worldRef.current = world;
      app.stage.addChild(world);

      const baseTexture = await Assets.load<Texture>(sceneAssets.prototypeBaseImage);
      world.addChild(createPrototypeBaseLayer(baseTexture));

      const decorationLayer = new Container();
      decorationLayerRef.current = decorationLayer;
      world.addChild(decorationLayer);

      const effectsLayer = new Container();
      effectsLayerRef.current = effectsLayer;
      world.addChild(effectsLayer);

      const textureEntries = await Promise.all(
        Array.from(spriteSheetById.values()).map(async (sheet) => {
          const texture = await Assets.load<Texture>(sheet.image);
          return [sheet.id, texture] as const;
        }),
      );
      const advancedTextureEntries = await Promise.all(
        Array.from(advancedSpriteSheetById.values()).map(async (sheet) => {
          const texture = await Assets.load<Texture>(sheet.image);
          return [sheet.id, texture] as const;
        }),
      );
      texturesBySheetIdRef.current = new Map(textureEntries);
      advancedTexturesBySheetIdRef.current = new Map(advancedTextureEntries);
      app.ticker.add(updateAnimations);
      isTickerAttached = true;
      setIsSceneReady(true);

      resizeObserver.observe(frame);
      resize();
    })();

    return () => {
      isMounted = false;
      if (isTickerAttached) {
        app.ticker.remove(updateAnimations);
      }
      resizeObserver.disconnect();
      eventEffectsRef.current.forEach((effect) =>
        effect.root.destroy({ children: true, texture: false }),
      );
      eventEffectsRef.current.clear();
      subagentRouteEffectsRef.current.forEach((effect) =>
        effect.root.destroy({ children: true, texture: false }),
      );
      subagentRouteEffectsRef.current.clear();
      feedbackTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      feedbackTimersRef.current = [];
      decorationLayerRef.current = null;
      effectsLayerRef.current = null;
      subagentRouteFramesRef.current = null;
      agentSpritesRef.current.forEach((item) =>
        item.layer.destroy({ children: true, texture: false }),
      );
      actionOverridesRef.current.clear();
      agentSpritesRef.current.clear();
      texturesBySheetIdRef.current.clear();
      advancedTexturesBySheetIdRef.current.clear();
      worldRef.current = null;
      host.replaceChildren();
      app.destroy(true, { children: true, texture: false });
    };
  }, [setNextViewport]);

  useEffect(() => {
    const world = worldRef.current;
    if (!isSceneReady || !world) {
      return;
    }

    const activeAgentIds = new Set(sceneAgents.map((agent) => agent.id));

    agentSpritesRef.current.forEach((item, agentId) => {
      if (!activeAgentIds.has(agentId)) {
        item.layer.destroy({ children: true, texture: false });
        agentSpritesRef.current.delete(agentId);
        lastAgentPositionRef.current.delete(agentId);
      }
    });

    sceneAgents.forEach((agent, index) => {
      const sheet = spriteSheetById.get(agent.spriteSheetId);
      const baseTexture = texturesBySheetIdRef.current.get(agent.spriteSheetId);
      if (!sheet || !baseTexture) {
        return;
      }
      const advancedSheet = advancedSpriteSheetById.get(agent.spriteSheetId);
      const advancedBaseTexture = advancedTexturesBySheetIdRef.current.get(
        agent.spriteSheetId,
      );

      const statusAction = getAgentAction(agent);
      let item = agentSpritesRef.current.get(agent.id);

      if (item?.spriteSheetId !== agent.spriteSheetId) {
        item?.layer.destroy({ children: true, texture: false });
        item = undefined;
      }

      if (!item) {
        const framesByAction = Object.fromEntries(
          animatedActions.map((action) => [
            action,
            createSpriteFrames(sheet, baseTexture, action),
          ]),
        ) as Partial<Record<AgentAction, Texture[]>>;
        const advancedFramesByAction =
          advancedSheet && advancedBaseTexture
            ? (Object.fromEntries(
                advancedActions.map((action) => [
                  action,
                  createSpriteFrames(advancedSheet, advancedBaseTexture, action),
                ]),
              ) as Partial<Record<AgentAction, Texture[]>>)
            : undefined;
        const startingPosition =
          lastAgentPositionRef.current.get(agent.id) ?? agent.scene.position;
        const sprite = new Sprite(
          framesByAction[statusAction]?.[0] ?? framesByAction.idle?.[0],
        );
        const agentLayer = new Container();
        const selectionRing = new Graphics()
          .ellipse(0, -18, 82, 24)
          .fill({ color: 0xffd463, alpha: 0.28 })
          .stroke({ color: 0xffc331, alpha: 0.95, width: 5 });

        agentLayer.position.set(startingPosition.x, startingPosition.y);
        agentLayer.eventMode = "static";
        agentLayer.cursor = "pointer";
        agentLayer.on("pointertap", () => {
          if (agent.currentTaskId) {
            selectTaskRef.current(agent.currentTaskId);
            return;
          }

          selectAgentRef.current(agent.id);
        });

        sprite.anchor.set(sheet.anchor.x, sheet.anchor.y);
        agentLayer.addChild(selectionRing);
        agentLayer.addChild(sprite);
        world.addChild(agentLayer);

        item = {
          advancedFramesByAction,
          advancedSheet,
          framesByAction,
          id: agent.id,
          layer: agentLayer,
          phase: index * 0.37,
          selectionRing,
          sheet,
          sprite,
          spriteSheetId: agent.spriteSheetId,
          statusAction,
          target: agent.scene.position,
        };
        agentSpritesRef.current.set(agent.id, item);
      }

      const isSelected =
        agent.id === selectedAgentId ||
        (Boolean(agent.currentTaskId) && agent.currentTaskId === selectedTaskId);
      const presenceStatus = agent.presenceStatus ?? "live";
      const presenceAlpha =
        presenceStatus === "gone"
          ? 0.38
          : presenceStatus === "stale"
            ? 0.62
            : isSelected
              ? 1
              : 0.9;
      const presenceTint =
        presenceStatus === "gone"
          ? 0xc8aa8c
          : presenceStatus === "stale"
            ? 0xffdf9d
            : isSelected
              ? 0xfff3b0
              : 0xffffff;

      item.layer.scale.set(agent.scene.scale);
      item.selectionRing.visible = isSelected;
      item.sprite.alpha = presenceAlpha;
      item.sprite.tint = presenceTint;
      item.statusAction = statusAction;
      item.target = agent.scene.position;
      world.setChildIndex(
        item.layer,
        Math.min(index + STATIC_WORLD_LAYER_COUNT, world.children.length - 1),
      );
    });
  }, [isSceneReady, sceneAgents, selectedAgentId, selectedTaskId]);

  useEffect(() => {
    if (
      !isSceneReady ||
      !agentFocusRequest ||
      agentFocusRequest.requestId === lastHandledFocusRequestRef.current
    ) {
      return;
    }

    const agent = sceneAgents.find(
      (item) => item.id === agentFocusRequest.agentId,
    );
    if (!agent) {
      return;
    }

    lastHandledFocusRequestRef.current = agentFocusRequest.requestId;
    const currentItem = agentSpritesRef.current.get(agent.id);
    focusMapPoint(
      currentItem?.target ?? agent.scene.position,
      agent.isReal ? AGENT_FOCUS_ZOOM : TASK_FOCUS_ZOOM,
    );
  }, [agentFocusRequest, focusMapPoint, isSceneReady, sceneAgents]);

  useEffect(() => {
    if (
      !isSceneReady ||
      !roomFocusRequest ||
      roomFocusRequest.requestId === lastHandledRoomFocusRequestRef.current
    ) {
      return;
    }

    const room = sceneAssets.rooms.find(
      (item) => item.id === roomFocusRequest.roomId,
    );
    if (!room) {
      return;
    }

    lastHandledRoomFocusRequestRef.current = roomFocusRequest.requestId;
    focusMapPoint(
      room.cameraFocus ?? room.center,
      NODE_FOCUS_ZOOM,
    );
  }, [focusMapPoint, isSceneReady, roomFocusRequest]);

  useEffect(() => {
    if (
      !isSceneReady ||
      !taskFocusRequest ||
      taskFocusRequest.requestId === lastHandledTaskFocusRequestRef.current
    ) {
      return;
    }

    const placement = taskDeskPlacements.find(
      (item) => item.task.id === taskFocusRequest.taskId,
    );
    if (!placement) {
      const task = tasks.find((item) => item.id === taskFocusRequest.taskId);
      if (!task) {
        return;
      }

      lastHandledTaskFocusRequestRef.current = taskFocusRequest.requestId;
      focusMapPoint(
        getPrototypeFocusForTaskStatus(task.status),
        NODE_FOCUS_ZOOM,
      );
      return;
    }

    lastHandledTaskFocusRequestRef.current = taskFocusRequest.requestId;
    focusMapPoint(placement.position, TASK_FOCUS_ZOOM);
  }, [focusMapPoint, isSceneReady, taskDeskPlacements, taskFocusRequest, tasks]);

  useEffect(() => {
    const effectsLayer = effectsLayerRef.current;
    if (!isSceneReady || !effectsLayer) {
      return;
    }

    if (!hasHydratedEventsRef.current) {
      events.forEach((event) => seenEventIdsRef.current.add(event.id));
      hasHydratedEventsRef.current = true;
      return;
    }

    const nextEvents = events
      .filter((event) => !seenEventIdsRef.current.has(event.id))
      .reverse();
    const now = performance.now() / 1000;

    nextEvents.forEach((event) => {
      seenEventIdsRef.current.add(event.id);

      const task = tasks.find((item) => item.id === event.taskId);
      const effectStatus = getEffectStatus(event, task);
      const actorPosition = event.actorId
        ? agentSpritesRef.current.get(event.actorId)?.target
        : undefined;
      const position = actorPosition ?? getRoomEffectPosition(effectStatus);
      const effect = createSceneEventEffect(event, position, now);
      const advancedAction = advancedActionByEventType[event.type];

      if (advancedAction && event.actorId) {
        const actorSprite = agentSpritesRef.current.get(event.actorId);

        if (actorSprite?.advancedFramesByAction?.[advancedAction]?.length) {
          actionOverridesRef.current.set(event.actorId, {
            action: advancedAction,
            duration: ADVANCED_ACTION_DURATION,
            eventId: event.id,
            startedAt: now,
          });
        }
      }

      if (isSubagentRouteEvent(event.type)) {
        const sheet = spriteSheetById.get(SUBAGENT_SHEET_ID);
        const baseTexture = texturesBySheetIdRef.current.get(SUBAGENT_SHEET_ID);

        if (sheet && baseTexture) {
          if (!subagentRouteFramesRef.current) {
            subagentRouteFramesRef.current = Object.fromEntries(
              animatedActions.map((action) => [
                action,
                createSpriteFrames(sheet, baseTexture, action),
              ]),
            ) as Partial<Record<AgentAction, Texture[]>>;
          }

          subagentRouteEffectsRef.current.get(event.id)?.root.destroy({
            children: true,
            texture: false,
          });
          const taskRoomId = task
            ? getRoomIdForTaskStatus(task.status)
            : "room_execution";
          const nestPosition = getRoomPosition(SUBAGENT_NEST_ROOM_ID);
          const taskPosition = getRoomPosition(taskRoomId);
          const isSpawn = event.type === "subagent_spawned";
          const routeEffect = createSubagentRouteEffect(
            event.id,
            isSpawn ? "spawn" : "recycle",
            createSubagentPath(
              isSpawn ? nestPosition : taskPosition,
              isSpawn ? taskPosition : nestPosition,
            ),
            sheet,
            subagentRouteFramesRef.current,
            now,
          );

          effectsLayer.addChild(routeEffect.root);
          subagentRouteEffectsRef.current.set(event.id, routeEffect);
        }
      }

      if (
        event.type === "blocked" ||
        event.type === "completed" ||
        event.type === "task_created"
      ) {
        const feedbackType = event.type;

        setSceneFeedbacks((current) =>
          [
            ...current.filter((item) => item.id !== event.id),
            { id: event.id, position, type: feedbackType },
          ].slice(-5),
        );

        const timer = window.setTimeout(() => {
          setSceneFeedbacks((current) =>
            current.filter((item) => item.id !== event.id),
          );
        }, 4400);
        feedbackTimersRef.current.push(timer);
      }

      if (!effect) {
        return;
      }

      effectsLayer.addChild(effect.root);
      eventEffectsRef.current.set(effect.id, effect);
    });

    if (seenEventIdsRef.current.size > 80) {
      seenEventIdsRef.current = new Set(
        Array.from(seenEventIdsRef.current).slice(-48),
      );
    }
  }, [events, isSceneReady, tasks]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (
      event.button !== 0 ||
      target.closest(".scene-controls, .task-desk-layer")
    ) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    isDraggingRef.current = true;
    dragMovedRef.current = false;
    dragStartRef.current = {
      clientX: event.clientX,
      clientY: event.clientY,
      panX: viewportRef.current.panX,
      panY: viewportRef.current.panY,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) {
      return;
    }

    const deltaX = event.clientX - dragStartRef.current.clientX;
    const deltaY = event.clientY - dragStartRef.current.clientY;

    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      dragMovedRef.current = true;
    }

    setNextViewport(
      (current) => ({
        ...current,
        panX: dragStartRef.current.panX + deltaX,
        panY: dragStartRef.current.panY + deltaY,
      }),
      { persist: true },
    );
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) {
      return;
    }

    event.currentTarget.releasePointerCapture(event.pointerId);
    isDraggingRef.current = false;
    setIsDragging(false);
    window.setTimeout(() => {
      dragMovedRef.current = false;
    }, 0);
  };

  const handleWheel = useCallback((event: globalThis.WheelEvent) => {
    event.preventDefault();
    const frame = frameRef.current;
    if (!frame) {
      return;
    }

    const bounds = frame.getBoundingClientRect();
    const stageX = event.clientX - bounds.left;
    const stageY = event.clientY - bounds.top;
    const zoomDirection = event.deltaY > 0 ? 0.9 : 1.1;
    zoomAtStagePoint(stageX, stageY, viewportRef.current.zoom * zoomDirection);
  }, [zoomAtStagePoint]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) {
      return undefined;
    }

    frame.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      frame.removeEventListener("wheel", handleWheel);
    };
  }, [handleWheel]);

  return (
    <section className="scene-panel" aria-label="Agent campus scene">
      <div className="scene-toolbar">
        <div>
          <span className="eyebrow">Campus</span>
          <h1>agentWord</h1>
        </div>
        <div className="scene-toolbar-actions">
          {sceneDensityMode === "stress30" ? (
            <div
              className={`scene-perf-chip ${performanceSample?.status === "watch" ? "is-watch" : ""}`}
              title={
                performanceSample
                  ? `30 agent performance sample: ${performanceSample.effectCount} effects, ${performanceSample.routeCount} routes`
                  : "30 agent performance sample"
              }
            >
              <Gauge size={15} aria-hidden="true" />
              <span>30 perf</span>
              <strong>
                {performanceSample ? `${performanceSample.fps} fps` : "sampling"}
              </strong>
              <small>
                {performanceSample
                  ? `${performanceSample.frameMs} ms · ${performanceSample.spriteCount} sprites`
                  : `${sceneAgents.length} sprites`}
              </small>
            </div>
          ) : null}
          <div
            className="scene-room-chip"
            style={{
              borderColor: selectedTask
                ? taskStatusAccent[selectedTask.status]
                : undefined,
            }}
          >
            {selectedTask
              ? taskStatusLabel[selectedTask.status]
              : `${taskDeskPlacements.length} teams · ${realSessionWaitingZone.count} sessions`}
          </div>
        </div>
      </div>

      <div
        ref={frameRef}
        className={`scene-stage-frame ${isDragging ? "is-dragging" : ""}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div ref={stageRef} className="scene-stage" />
        <div className="task-desk-layer" style={overlayStyle}>
          <svg
            aria-hidden="true"
            className="task-route-layer"
            viewBox={`0 0 ${sceneAssets.coordinateSpace.width} ${sceneAssets.coordinateSpace.height}`}
          >
            <path
              className="route-main"
              d="M 766 705 C 730 640, 676 574, 600 522 S 486 438, 430 378"
            />
            <path
              className="route-blocked"
              d="M 600 522 C 720 478, 858 478, 1004 520"
            />
            <path
              className="route-waiting"
              d="M 766 705 C 820 642, 900 584, 1004 520"
            />
            {selectedTaskRoute ? (
              <path
                className={selectedTaskRoute.className}
                d={selectedTaskRoute.path}
              />
            ) : null}
          </svg>
          {sceneFlowNodes.map((node) => (
            <button
              className={`flow-node ${node.className}`}
              key={node.id}
              onClick={() => focusMapPoint(node.focus, NODE_FOCUS_ZOOM)}
              style={{
                height: node.height,
                left: node.position.x,
                top: node.position.y,
                width: node.width,
              }}
              type="button"
            >
              {node.label}
            </button>
          ))}
          {realSessionWaitingZone.count > 0 ? (
            <div
              aria-hidden="true"
              className="real-session-waiting-zone"
              style={{
                height: realSessionWaitingZone.height,
                left: realSessionWaitingZone.position.x,
                top: realSessionWaitingZone.position.y,
                width: realSessionWaitingZone.width,
              }}
            >
              <span>{realSessionWaitingZone.label}</span>
              <small>Unbound live sessions</small>
            </div>
          ) : null}
          {taskDeskPlacements.map((placement) => {
            const task = placement.task;
            const isSelected = task.id === selectedTaskId;
            const deskStyle = {
              "--desk-scale": placement.deskScale,
              "--table": placement.tableColor,
              left: placement.position.x,
              top: placement.position.y,
            } as CSSProperties;

            return (
              <button
                className={[
                  "task-desk",
                  `status-${task.status}`,
                  `density-${placement.capacityTier}`,
                  isSelected ? "is-selected" : "",
                ].join(" ")}
                key={task.id}
                onClick={() => {
                  selectTask(task.id);
                  focusMapPoint(placement.position, TASK_FOCUS_ZOOM);
                }}
                style={deskStyle}
                title={task.title}
                type="button"
              >
                <span className="task-desk-table" />
                <span className="task-desk-label">
                  <strong>
                    {placement.index + 1}. {task.title}
                  </strong>
                  <span>
                    <em>{taskStatusLabel[task.status]}</em>
                    <i>{getTaskSourceLabel(task)}</i>
                    <b>{task.progress}%</b>
                  </span>
                  <small>
                    {placement.occupantIds.length} seats ·{" "}
                    {task.subagentIds.length} subagents
                  </small>
                </span>
              </button>
            );
          })}
        </div>
        <div className="scene-feedback-layer" style={overlayStyle}>
          {sceneFeedbacks.map((feedback) => (
            <span
              className={`scene-feedback feedback-${feedback.type.replace("_", "-")}`}
              key={feedback.id}
              style={{ left: feedback.position.x, top: feedback.position.y }}
            >
              <span className="feedback-pulse" />
              <span className="feedback-badge" />
              <span className="feedback-glyph" />
            </span>
          ))}
        </div>
        <div className="scene-controls">
          <div className="scene-control-hint" title="拖拽地图">
            <Move size={16} aria-hidden="true" />
            <span>{Math.round(viewport.zoom * 100)}%</span>
          </div>
          <button
            className="icon-button compact"
            type="button"
            title="缩小"
            onClick={() =>
              zoomAtStagePoint(
                viewport.stageWidth / 2,
                viewport.stageHeight / 2,
                viewport.zoom * 0.88,
              )
            }
          >
            <Minus size={17} aria-hidden="true" />
          </button>
          <button
            className="icon-button compact"
            type="button"
            title="放大"
            onClick={() =>
              zoomAtStagePoint(
                viewport.stageWidth / 2,
                viewport.stageHeight / 2,
                viewport.zoom * 1.14,
              )
            }
          >
            <Plus size={17} aria-hidden="true" />
          </button>
          <button
            className="icon-button compact"
            type="button"
            title="复位视角"
            onClick={resetViewport}
          >
            <RotateCcw size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
