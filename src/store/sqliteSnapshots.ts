import { invoke, isTauri } from "@tauri-apps/api/core";
import type {
  AgentAppType,
  AgentSession,
  AgentSource,
  AgentStatus,
  AgentWorldSnapshot,
  Point,
  SceneEvent,
  SceneEventType,
  TaskCard,
  TaskStatus,
} from "../types/domain";

const snapshotVersion = 1;
const agentSources = ["codex", "claude", "simulated"] satisfies AgentSource[];
const agentAppTypes = [
  "app",
  "cli",
  "subagent",
  "unknown",
] satisfies AgentAppType[];
const agentStatuses = [
  "idle",
  "planning",
  "running",
  "verifying",
  "blocked",
  "done",
] satisfies AgentStatus[];
const taskStatuses = [
  "queued",
  "planning",
  "running",
  "verifying",
  "blocked",
  "done",
] satisfies TaskStatus[];
const eventTypes = [
  "task_created",
  "status_changed",
  "agent_seen",
  "blocked",
  "completed",
  "handoff",
  "summon_subagent",
  "merge_result",
  "subagent_spawned",
  "subagent_recycled",
] satisfies SceneEventType[];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asString = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0 ? value : undefined;

const asOptionalString = (value: unknown) =>
  typeof value === "string" ? value : undefined;

const asFiniteNumber = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const asStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

const oneOf = <T extends string>(value: unknown, options: readonly T[]) =>
  typeof value === "string" && options.includes(value as T)
    ? (value as T)
    : undefined;

const normalizePoint = (value: unknown): Point | null => {
  if (!isRecord(value)) {
    return null;
  }

  return {
    x: asFiniteNumber(value.x, 0),
    y: asFiniteNumber(value.y, 0),
  };
};

const normalizeAgent = (value: unknown): AgentSession | null => {
  if (!isRecord(value) || value.isReal === true) {
    return null;
  }

  const id = asString(value.id);
  const source = oneOf(value.source, agentSources);
  const appType = oneOf(value.appType, agentAppTypes);
  const status = oneOf(value.status, agentStatuses);
  const displayName = asString(value.displayName);
  const role = asString(value.role);
  const spriteSheetId = asString(value.spriteSheetId);
  const roomId = asString(value.roomId);
  const lastSeenAt = asString(value.lastSeenAt);
  const scene = isRecord(value.scene) ? value.scene : null;
  const position = normalizePoint(scene?.position);

  if (
    !id ||
    !source ||
    !appType ||
    !status ||
    !displayName ||
    !role ||
    !spriteSheetId ||
    !roomId ||
    !lastSeenAt ||
    !scene ||
    !position
  ) {
    return null;
  }

  return {
    id,
    source,
    appType,
    status,
    currentTaskId: asOptionalString(value.currentTaskId),
    displayName,
    role,
    spriteSheetId,
    roomId,
    scene: {
      position,
      scale: asFiniteNumber(scene.scale, 0.5),
    },
    lastSeenAt,
    isReal: false,
  };
};

const normalizeTask = (value: unknown): TaskCard | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = asString(value.id);
  const title = asString(value.title);
  const status = oneOf(value.status, taskStatuses);
  const details = asString(value.details);
  const createdAt = asString(value.createdAt);
  const updatedAt = asString(value.updatedAt);

  if (!id || !title || !status || !details || !createdAt || !updatedAt) {
    return null;
  }

  return {
    id,
    title,
    status,
    progress: Math.max(0, Math.min(100, asFiniteNumber(value.progress, 0))),
    assigneeAgentId: asOptionalString(value.assigneeAgentId),
    subagentIds: asStringArray(value.subagentIds),
    details,
    eventIds: asStringArray(value.eventIds),
    createdAt,
    updatedAt,
  };
};

const normalizeEvent = (value: unknown): SceneEvent | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = asString(value.id);
  const type = oneOf(value.type, eventTypes);
  const message = asString(value.message);
  const createdAt = asString(value.createdAt);

  if (!id || !type || !message || !createdAt) {
    return null;
  }

  return {
    id,
    type,
    actorId: asOptionalString(value.actorId),
    taskId: asOptionalString(value.taskId),
    message,
    createdAt,
  };
};

export const normalizeAgentWorldSnapshot = (
  value: unknown,
): AgentWorldSnapshot | null => {
  if (!isRecord(value) || value.version !== snapshotVersion) {
    return null;
  }

  const agents = Array.isArray(value.agents)
    ? value.agents
        .map(normalizeAgent)
        .filter((agent): agent is AgentSession => Boolean(agent))
    : [];
  const tasks = Array.isArray(value.tasks)
    ? value.tasks
        .map(normalizeTask)
        .filter((task): task is TaskCard => Boolean(task))
    : [];
  const events = Array.isArray(value.events)
    ? value.events
        .map(normalizeEvent)
        .filter((event): event is SceneEvent => Boolean(event))
    : [];

  return {
    version: snapshotVersion,
    savedAt: asString(value.savedAt) ?? new Date().toISOString(),
    agents,
    tasks,
    events,
    selectedTaskId: asOptionalString(value.selectedTaskId) ?? "",
    selectedAgentId: asOptionalString(value.selectedAgentId) ?? "",
    selectedRoomId: asOptionalString(value.selectedRoomId) ?? "",
    demoFlowTick: Math.max(0, asFiniteNumber(value.demoFlowTick, 0)),
  };
};

export const createAgentWorldSnapshot = (input: {
  agents: AgentSession[];
  tasks: TaskCard[];
  events: SceneEvent[];
  selectedTaskId: string;
  selectedAgentId: string;
  selectedRoomId: string;
  demoFlowTick: number;
}): AgentWorldSnapshot => ({
  version: snapshotVersion,
  savedAt: new Date().toISOString(),
  agents: input.agents
    .filter((agent) => !agent.isReal)
    .map((agent) => ({
      ...agent,
      pid: undefined,
      parentPid: undefined,
      isReal: false,
    })),
  tasks: input.tasks,
  events: input.events,
  selectedTaskId: input.selectedTaskId,
  selectedAgentId: input.selectedAgentId,
  selectedRoomId: input.selectedRoomId,
  demoFlowTick: input.demoFlowTick,
});

export async function loadAgentWorldSnapshot(): Promise<AgentWorldSnapshot | null> {
  if (!isTauri()) {
    return null;
  }

  const snapshot = await invoke<unknown>("load_agent_world_snapshot");
  return normalizeAgentWorldSnapshot(snapshot);
}

export async function saveAgentWorldSnapshot(
  snapshot: AgentWorldSnapshot,
): Promise<void> {
  if (!isTauri()) {
    return;
  }

  await invoke("save_agent_world_snapshot", { snapshot });
}
