import { sceneAssets } from "../data/assets";
import type {
  AgentSession,
  AgentStatus,
  Point,
  SceneDensityMode,
  TaskCard,
  TaskStatus,
} from "../types/domain";

const fallbackRoomByAgentStatus: Record<AgentStatus, string> = {
  idle: "rest_area",
  planning: "room_planning",
  running: "room_execution",
  verifying: "room_verification",
  blocked: "room_blocked",
  done: "room_archive",
};

const agentStatusByTaskStatus: Record<TaskStatus, AgentStatus> = {
  queued: "idle",
  planning: "planning",
  running: "running",
  verifying: "verifying",
  blocked: "blocked",
  done: "done",
};

const activeTaskPriority: Record<TaskStatus, number> = {
  blocked: 0,
  running: 1,
  verifying: 2,
  planning: 3,
  queued: 4,
  done: 5,
};

const positionOffsets: Point[] = [
  { x: 0, y: 0 },
  { x: -56, y: 26 },
  { x: 56, y: 26 },
  { x: -72, y: -18 },
  { x: 72, y: -18 },
  { x: 0, y: 56 },
  { x: -112, y: 42 },
  { x: 112, y: 42 },
  { x: -104, y: -52 },
  { x: 104, y: -52 },
  { x: -32, y: 86 },
  { x: 32, y: 86 },
];

export interface TaskDeskPlacement {
  capacityTier: "compact" | "comfortable" | "dense";
  column: number;
  deskScale: number;
  index: number;
  occupantIds: string[];
  roomId: string;
  row: number;
  task: TaskCard;
  tableColor: string;
  labelPosition: Point;
  position: Point;
  seats: Point[];
}

export interface SceneFlowNodePlacement {
  className: string;
  count: number;
  focus: Point;
  height: number;
  id: "task-center" | "blocked-center" | "waiting-zone";
  label: string;
  position: Point;
  width: number;
}

const prototypeRegionLayout = {
  blockedCenter: {
    focus: { x: 990, y: 520 },
    position: { x: 1004, y: 520 },
  },
  taskCenter: {
    focus: { x: 596, y: 522 },
    position: { x: 600, y: 522 },
  },
  teamWorkArea: {
    height: 340,
    width: 960,
    x: 286,
    y: 108,
  },
  waitingZone: {
    focus: { x: 766, y: 780 },
    position: { x: 766, y: 705 },
  },
};

const tablePalette = ["#3f7fa8", "#c18b35", "#7b64a7", "#b78339"];

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const getActiveTeamTasks = (tasks: TaskCard[]) =>
  tasks.filter((task) => task.status !== "done" && task.status !== "queued");

const getTaskOccupantIds = (task: TaskCard) =>
  [task.assigneeAgentId, ...task.subagentIds].filter(
    (agentId): agentId is string => Boolean(agentId),
  );

const getDeskGrid = (count: number) => {
  if (count <= 1) {
    return { columns: 1, rows: 1 };
  }

  if (count <= 4) {
    return { columns: count, rows: 1 };
  }

  if (count <= 12) {
    return { columns: 4, rows: Math.ceil(count / 4) };
  }

  if (count <= 20) {
    return { columns: 5, rows: Math.ceil(count / 5) };
  }

  return { columns: 6, rows: Math.ceil(count / 6) };
};

const getCapacityTier = (
  rows: number,
  maxOccupantCount: number,
): TaskDeskPlacement["capacityTier"] => {
  if (rows >= 4 || maxOccupantCount >= 7) {
    return "dense";
  }

  if (rows >= 3 || maxOccupantCount >= 5) {
    return "compact";
  }

  return "comfortable";
};

const getSeatOffsets = (
  occupantCount: number,
  deskScale: number,
): Point[] => {
  const normalizedCount = Math.max(1, occupantCount);
  const baseOffsets: Point[] = [
    { x: 0, y: 42 },
    { x: -48, y: 22 },
    { x: 48, y: 22 },
    { x: -58, y: -10 },
    { x: 58, y: -10 },
    { x: -24, y: 58 },
    { x: 24, y: 58 },
    { x: 0, y: -34 },
  ];

  const offsets =
    normalizedCount <= baseOffsets.length
      ? baseOffsets.slice(0, normalizedCount)
      : Array.from({ length: normalizedCount }, (_, index) => {
          const angle = -Math.PI / 2 + (index / normalizedCount) * Math.PI * 2;
          return {
            x: Math.cos(angle) * 70,
            y: Math.sin(angle) * 48 + 22,
          };
        });

  const scale = clampNumber(deskScale, 0.62, 1.06);
  return offsets.map((offset) => ({
    x: offset.x * scale,
    y: offset.y * scale,
  }));
};

export const buildTaskDeskPlacements = (tasks: TaskCard[]) => {
  const activeTasks = tasks
    .filter((task) => task.status !== "done" && task.status !== "queued")
    .slice(0, 30);
  const { columns, rows } = getDeskGrid(activeTasks.length);
  const workArea = prototypeRegionLayout.teamWorkArea;
  const maxOccupantCount = activeTasks.reduce(
    (max, task) => Math.max(max, getTaskOccupantIds(task).length || 1),
    1,
  );
  const capacityTier = getCapacityTier(rows, maxOccupantCount);
  const cellWidth = workArea.width / Math.max(columns, 1);
  const cellHeight = workArea.height / Math.max(rows, 1);
  const deskScale = clampNumber(
    Math.min(cellWidth / 210, cellHeight / 150, maxOccupantCount > 5 ? 0.76 : 1),
    capacityTier === "dense" ? 0.56 : 0.68,
    1,
  );

  return activeTasks.map((task, index): TaskDeskPlacement => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const rowOffset = rows <= 1 ? 4 : 0;
    const occupantIds = getTaskOccupantIds(task);
    const position = {
      x: workArea.x + cellWidth * (column + 0.5),
      y: workArea.y + cellHeight * (row + 0.5) + rowOffset,
    };
    const seats = getSeatOffsets(occupantIds.length || 1, deskScale).map(
      (offset) => ({
        x: position.x + offset.x,
        y: position.y + offset.y,
      }),
    );

    return {
      capacityTier,
      column,
      deskScale,
      index,
      labelPosition: { x: position.x, y: position.y - 76 },
      occupantIds,
      position,
      roomId: "room_execution",
      row,
      seats,
      tableColor:
        task.status === "blocked"
          ? "#d45c45"
          : tablePalette[index % tablePalette.length],
      task,
    };
  });
};

export const buildSceneFlowNodes = (tasks: TaskCard[]): SceneFlowNodePlacement[] => {
  const queuedCount = tasks.filter((task) => task.status === "queued").length;
  const blockedCount = tasks.filter((task) => task.status === "blocked").length;
  const activeCount = getActiveTeamTasks(tasks).length;
  const waitingCount = queuedCount + Math.max(0, Math.min(4, 12 - activeCount));

  return [
    {
      className: "task-center-node",
      count: queuedCount,
      focus: prototypeRegionLayout.taskCenter.focus,
      height: clampNumber(42 + queuedCount * 4, 42, 72),
      id: "task-center",
      label: queuedCount > 0 ? `Task Center · ${queuedCount}` : "Task Center",
      position: prototypeRegionLayout.taskCenter.position,
      width: clampNumber(122 + queuedCount * 12, 122, 196),
    },
    {
      className: "blocked-center-node",
      count: blockedCount,
      focus: prototypeRegionLayout.blockedCenter.focus,
      height: clampNumber(42 + blockedCount * 5, 42, 78),
      id: "blocked-center",
      label:
        blockedCount > 0
          ? `Blocked Center · ${blockedCount}`
          : "Blocked Center",
      position: prototypeRegionLayout.blockedCenter.position,
      width: clampNumber(146 + blockedCount * 14, 146, 220),
    },
    {
      className: "waiting-zone-node",
      count: waitingCount,
      focus: prototypeRegionLayout.waitingZone.focus,
      height: clampNumber(42 + waitingCount * 3, 42, 70),
      id: "waiting-zone",
      label:
        waitingCount > 0
          ? `Waiting / Idle · ${waitingCount}`
          : "Waiting / Idle Zone",
      position: prototypeRegionLayout.waitingZone.position,
      width: clampNumber(178 + waitingCount * 12, 178, 280),
    },
  ];
};

export const getPrototypeFocusForTaskStatus = (status: TaskStatus): Point => {
  if (status === "blocked") {
    return prototypeRegionLayout.blockedCenter.focus;
  }

  if (status === "queued") {
    return prototypeRegionLayout.waitingZone.focus;
  }

  return prototypeRegionLayout.taskCenter.focus;
};

const readabilityLayoutByAgentId: Record<
  string,
  { position: Point; roomId: string; scale: number; status: AgentStatus }
> = {
  "agent-white-bow-cat-pm": {
    position: { x: 610, y: 275 },
    roomId: "room_execution",
    scale: 0.44,
    status: "planning",
  },
  "agent-red-panda-manager": {
    position: { x: 705, y: 250 },
    roomId: "room_execution",
    scale: 0.4,
    status: "planning",
  },
  "agent-beaver-builder": {
    position: { x: 800, y: 292 },
    roomId: "room_execution",
    scale: 0.43,
    status: "running",
  },
  "agent-tea-cat-engineer": {
    position: { x: 895, y: 252 },
    roomId: "room_execution",
    scale: 0.4,
    status: "running",
  },
  "agent-frog-verifier": {
    position: { x: 990, y: 292 },
    roomId: "room_execution",
    scale: 0.4,
    status: "verifying",
  },
  "agent-black-fur-cat-ops": {
    position: { x: 1085, y: 258 },
    roomId: "room_blocked",
    scale: 0.4,
    status: "blocked",
  },
  "agent-mini-cat-subagent": {
    position: { x: 835, y: 392 },
    roomId: "room_execution",
    scale: 0.36,
    status: "running",
  },
  "agent-monitor-wall": {
    position: { x: 785, y: 168 },
    roomId: "monitor_wall",
    scale: 0.3,
    status: "idle",
  },
};

const stressDensityCounts: Partial<Record<SceneDensityMode, number>> = {
  stress12: 12,
  stress24: 24,
  stress30: 30,
};

const stressRosterTemplateIds = [
  "agent-white-bow-cat-pm",
  "agent-red-panda-manager",
  "agent-beaver-builder",
  "agent-tea-cat-engineer",
  "agent-frog-verifier",
  "agent-black-fur-cat-ops",
  "agent-mini-cat-subagent",
];

const stressLayoutSlots: Array<{
  position: Point;
  roomId: string;
  status: AgentStatus;
}> = [
  { position: { x: 610, y: 242 }, roomId: "room_execution", status: "planning" },
  { position: { x: 690, y: 242 }, roomId: "room_execution", status: "planning" },
  { position: { x: 770, y: 242 }, roomId: "room_execution", status: "running" },
  { position: { x: 850, y: 242 }, roomId: "room_execution", status: "running" },
  { position: { x: 930, y: 242 }, roomId: "room_execution", status: "verifying" },
  { position: { x: 1010, y: 242 }, roomId: "room_execution", status: "running" },
  { position: { x: 1090, y: 242 }, roomId: "room_execution", status: "blocked" },
  { position: { x: 630, y: 310 }, roomId: "room_execution", status: "running" },
  { position: { x: 710, y: 310 }, roomId: "room_execution", status: "verifying" },
  { position: { x: 790, y: 310 }, roomId: "room_execution", status: "running" },
  { position: { x: 870, y: 310 }, roomId: "room_execution", status: "planning" },
  { position: { x: 950, y: 310 }, roomId: "room_execution", status: "running" },
  { position: { x: 1030, y: 310 }, roomId: "room_execution", status: "verifying" },
  { position: { x: 1110, y: 310 }, roomId: "room_blocked", status: "blocked" },
  { position: { x: 650, y: 378 }, roomId: "room_execution", status: "running" },
  { position: { x: 730, y: 378 }, roomId: "room_execution", status: "running" },
  { position: { x: 810, y: 378 }, roomId: "room_execution", status: "verifying" },
  { position: { x: 890, y: 378 }, roomId: "room_execution", status: "planning" },
  { position: { x: 970, y: 378 }, roomId: "room_execution", status: "running" },
  { position: { x: 1050, y: 378 }, roomId: "room_execution", status: "done" },
  { position: { x: 435, y: 250 }, roomId: "room_planning", status: "planning" },
  { position: { x: 500, y: 332 }, roomId: "room_planning", status: "planning" },
  { position: { x: 1175, y: 250 }, roomId: "room_blocked", status: "blocked" },
  { position: { x: 1260, y: 322 }, roomId: "room_blocked", status: "blocked" },
  { position: { x: 1110, y: 445 }, roomId: "room_verification", status: "verifying" },
  { position: { x: 1190, y: 455 }, roomId: "room_verification", status: "verifying" },
  { position: { x: 655, y: 520 }, roomId: "garden_path", status: "idle" },
  { position: { x: 780, y: 520 }, roomId: "subagent_nest", status: "running" },
  { position: { x: 905, y: 520 }, roomId: "room_archive", status: "done" },
  { position: { x: 1030, y: 520 }, roomId: "room_archive", status: "done" },
];

const stressScaleByMode: Partial<Record<SceneDensityMode, number>> = {
  stress12: 0.38,
  stress24: 0.32,
  stress30: 0.29,
};

export const getRoomIdForTaskStatus = (status: TaskStatus) =>
  sceneAssets.statusColumns.find((column) => column.id === status)?.roomId ?? "rest_area";

export const getAgentStatusForTaskStatus = (status: TaskStatus) => agentStatusByTaskStatus[status];

export const findActiveTaskForAgent = (agent: AgentSession, tasks: TaskCard[]) => {
  return tasks
    .filter(
      (task) =>
        task.id === agent.currentTaskId ||
        task.assigneeAgentId === agent.id ||
        task.subagentIds.includes(agent.id),
    )
    .sort((left, right) => activeTaskPriority[left.status] - activeTaskPriority[right.status])[0];
};

const getRoomAnchor = (roomId: string, fallbackPosition: Point) => {
  const spawnPoint = sceneAssets.spawnPoints.find((spawn) => spawn.roomId === roomId);
  const room = sceneAssets.rooms.find((item) => item.id === roomId);

  return spawnPoint?.position ?? room?.center ?? fallbackPosition;
};

const buildReadabilitySceneAgents = (agents: AgentSession[]) => {
  let realAgentIndex = 0;

  return agents.map((agent) => {
    const readabilityLayout = readabilityLayoutByAgentId[agent.id];

    if (readabilityLayout) {
      return {
        ...agent,
        roomId: readabilityLayout.roomId,
        scene: {
          ...agent.scene,
          position: readabilityLayout.position,
          scale: readabilityLayout.scale,
        },
        status: readabilityLayout.status,
      };
    }

    if (agent.isReal) {
      const position = {
        x: 666 + (realAgentIndex % 7) * 28,
        y: 124 + Math.floor(realAgentIndex / 7) * 24,
      };
      realAgentIndex += 1;

      return {
        ...agent,
        roomId: "monitor_wall",
        scene: {
          ...agent.scene,
          position,
          scale: 0.22,
        },
        status: "idle" as AgentStatus,
      };
    }

    return agent;
  });
};

const buildStressSceneAgents = (
  agents: AgentSession[],
  sceneDensityMode: SceneDensityMode,
) => {
  const targetCount = stressDensityCounts[sceneDensityMode] ?? 12;
  const scale = stressScaleByMode[sceneDensityMode] ?? 0.34;
  const nonRealAgents = agents.filter((agent) => !agent.isReal);
  const templates = stressRosterTemplateIds
    .map((agentId) => nonRealAgents.find((agent) => agent.id === agentId))
    .filter((agent): agent is AgentSession => Boolean(agent));
  const rosterTemplates = templates.length > 0 ? templates : nonRealAgents;

  if (rosterTemplates.length === 0) {
    return [];
  }

  const stressAgents = Array.from({ length: targetCount }, (_, index) => {
    const template = rosterTemplates[index % rosterTemplates.length];
    const slot = stressLayoutSlots[index % stressLayoutSlots.length];
    const isBaseTemplate = index < rosterTemplates.length;

    return {
      ...template,
      currentTaskId: undefined,
      displayName: isBaseTemplate
        ? template.displayName
        : `${template.displayName} ${index + 1}`,
      id: isBaseTemplate
        ? template.id
        : `stress-${sceneDensityMode}-${index + 1}`,
      isReal: false,
      presenceStatus: undefined,
      roomId: slot.roomId,
      scene: {
        ...template.scene,
        position: slot.position,
        scale: template.appType === "subagent" ? scale * 0.82 : scale,
      },
      status: template.appType === "subagent" ? "running" : slot.status,
    };
  });

  return stressAgents;
};

export const buildSceneAgents = (
  agents: AgentSession[],
  tasks: TaskCard[],
  sceneDensityMode: SceneDensityMode = "live",
): AgentSession[] => {
  if (sceneDensityMode === "readability") {
    return buildReadabilitySceneAgents(agents);
  }

  if (stressDensityCounts[sceneDensityMode]) {
    return buildStressSceneAgents(agents, sceneDensityMode);
  }

  const deskPlacements = buildTaskDeskPlacements(tasks);
  const agentsById = new Map(agents.map((agent) => [agent.id, agent]));
  const usedVisualAgentIds = new Set<string>();
  const occupiedSourceAgentIds = new Set<string>();
  const visualDeskAgents: AgentSession[] = [];

  deskPlacements.forEach((placement) => {
    placement.occupantIds.forEach((agentId, seatIndex) => {
      const agent = agentsById.get(agentId);

      if (!agent) {
        return;
      }

      const visualId = usedVisualAgentIds.has(agent.id)
        ? `${agent.id}__desk__${placement.task.id}__${seatIndex}`
        : agent.id;
      const seat = placement.seats[seatIndex % placement.seats.length];
      const visualScale =
        agent.appType === "subagent"
          ? clampNumber(0.21 + placement.deskScale * 0.1, 0.24, 0.34)
          : clampNumber(0.25 + placement.deskScale * 0.13, 0.3, 0.4);

      usedVisualAgentIds.add(visualId);
      occupiedSourceAgentIds.add(agent.id);
      visualDeskAgents.push({
        ...agent,
        currentTaskId: placement.task.id,
        id: visualId,
        roomId: placement.roomId,
        scene: {
          ...agent.scene,
          position: seat,
          scale: Math.min(agent.scene.scale, visualScale),
        },
        status: getAgentStatusForTaskStatus(placement.task.status),
      });
    });
  });

  const roomOccupancy = new Map<string, number>();

  const overflowAgents = agents
    .filter((agent) => !occupiedSourceAgentIds.has(agent.id))
    .filter((agent) => agent.isReal || agent.status === "idle" || agent.currentTaskId)
    .map((agent) => {
      const activeTask = findActiveTaskForAgent(agent, tasks);
      const roomId = activeTask
        ? getRoomIdForTaskStatus(activeTask.status)
        : agent.roomId || fallbackRoomByAgentStatus[agent.status];
      const roomIndex = roomOccupancy.get(roomId) ?? 0;
      const offset = positionOffsets[roomIndex % positionOffsets.length];
      const anchor =
        activeTask && activeTask.status === "queued"
          ? getPrototypeFocusForTaskStatus("queued")
          : getRoomAnchor(roomId, agent.scene.position);

      roomOccupancy.set(roomId, roomIndex + 1);

      return {
        ...agent,
        currentTaskId: activeTask?.id ?? agent.currentTaskId,
        roomId,
        scene: {
          ...agent.scene,
          position: {
            x: anchor.x + offset.x,
            y: anchor.y + offset.y,
          },
        },
        status: activeTask
          ? getAgentStatusForTaskStatus(activeTask.status)
          : agent.status,
      };
    });

  return [...visualDeskAgents, ...overflowAgents];
};
