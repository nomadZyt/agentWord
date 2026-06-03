import { create } from "zustand";
import { mockAgents, mockEvents, mockTasks } from "../data/mockData";
import { scanAgentProcesses } from "../monitor/processMonitor";
import {
  getRealAgentId,
  getRealAgentLifecycleEvents,
} from "../monitor/realAgentEventRules";
import {
  findActiveTaskForAgent,
  getRoomIdForTaskStatus,
} from "../scene/sceneLayout";
import {
  loadAgentWorldPreferences,
  saveAgentWorldPreferences,
} from "./localPreferences";
import {
  createAgentWorldSnapshot,
  loadAgentWorldSnapshot,
  saveAgentWorldSnapshot,
} from "./sqliteSnapshots";
import type {
  AgentAppType,
  AppPreferences,
  AgentProcessInfo,
  AgentProcessScan,
  AgentProcessScanStatus,
  AgentSession,
  AgentStatus,
  AgentPresenceStatus,
  SnapshotRestoreStatus,
  SnapshotSaveStatus,
  SceneViewportPreference,
  TaskCard,
  TaskFilters,
  TaskStatus,
  SceneEvent,
} from "../types/domain";

const demoFlowTaskIds = mockTasks.map((task) => task.id);
const miniSubagentId = "agent-mini-cat-subagent";

const nextTaskStatus: Record<TaskStatus, TaskStatus> = {
  queued: "planning",
  planning: "running",
  running: "verifying",
  verifying: "done",
  blocked: "running",
  done: "queued",
};

const getNextDemoStatus = (status: TaskStatus, tick: number): TaskStatus => {
  if (status === "running" && tick % 4 === 2) {
    return "blocked";
  }

  return nextTaskStatus[status];
};

const getSceneEventType = (status: TaskStatus): SceneEvent["type"] => {
  if (status === "queued") {
    return "task_created";
  }

  if (status === "blocked") {
    return "blocked";
  }

  if (status === "done") {
    return "completed";
  }

  return "status_changed";
};

const statusMessages: Record<TaskStatus, string> = {
  queued: "新任务进入入口队列，等待重新分配。",
  planning: "进入规划室，开始拆解任务。",
  running: "进入执行室，agent 开始处理。",
  verifying: "进入验证室，检查产物。",
  blocked: "进入阻塞室，等待外部输入。",
  done: "进入归档室，任务完成。",
};

const getClockLabel = () =>
  new Date().toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });

const getSafeAgentDisplayName = (agent: AgentSession) =>
  agent.displayName.split(" #")[0];

const realSessionTaskPrefix = "real-session-task-";

const getRealSessionTaskId = (agentId: string) =>
  `${realSessionTaskPrefix}${agentId}`;

const isRealSessionTask = (task: Pick<TaskCard, "id">) =>
  task.id.startsWith(realSessionTaskPrefix);

const isLiveWorkerRealAgent = (agent: AgentSession) =>
  agent.isReal &&
  (agent.presenceStatus ?? "live") === "live" &&
  (agent.processKind === "claude_cli" ||
    agent.processKind === "codex_app_server" ||
    agent.processKind === "codex_cli");

const hasManualTaskBinding = (agent: AgentSession, tasks: TaskCard[]) =>
  tasks.some(
    (task) =>
      !isRealSessionTask(task) &&
      (task.id === agent.currentTaskId ||
        task.assigneeAgentId === agent.id ||
        task.subagentIds.includes(agent.id)),
  );

const getRealSessionTaskTitle = (agent: AgentSession) =>
  [
    getSafeAgentDisplayName(agent),
    agent.workspaceLabel ?? agent.windowLabel ?? undefined,
  ]
    .filter(Boolean)
    .join(" · ");

const getRealSessionTaskDetails = (agent: AgentSession) =>
  [
    "真实会话自动任务桌；只使用进程类型、窗口和工作区标签，不读取终端正文或完整命令。",
    agent.workspaceLabel ? `工作区：${agent.workspaceLabel}` : undefined,
    agent.windowLabel ? `窗口：${agent.windowLabel}` : undefined,
    agent.taskSourceLabel ? `来源：${agent.taskSourceLabel}` : undefined,
  ]
    .filter(Boolean)
    .join(" ");

const buildRealSessionTaskEvent = (
  agent: AgentSession,
  taskId: string,
): SceneEvent => ({
  actorId: agent.id,
  createdAt: getClockLabel(),
  id: `event-auto-bind-${Date.now()}-${agent.id}-${taskId}`,
  message: `${getSafeAgentDisplayName(agent)}：检测为活跃真实会话，已自动绑定到任务桌。`,
  taskId,
  type: "handoff",
});

const syncLiveRealSessionTaskBindings = ({
  agents,
  eventLogLimit,
  events,
  tasks,
}: {
  agents: AgentSession[];
  eventLogLimit: number;
  events: SceneEvent[];
  tasks: TaskCard[];
}) => {
  const activeAutoTaskIds = new Set<string>();
  const nextEvents: SceneEvent[] = [];
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const nextTaskById = new Map(
    tasks
      .filter((task) => !isRealSessionTask(task))
      .map((task) => [task.id, task] as const),
  );

  const nextAgents = agents.map((agent) => {
    if (!isLiveWorkerRealAgent(agent)) {
      return isRealSessionTask({ id: agent.currentTaskId ?? "" })
        ? { ...agent, currentTaskId: undefined }
        : agent;
    }

    if (hasManualTaskBinding(agent, tasks)) {
      return agent;
    }

    const taskId = getRealSessionTaskId(agent.id);
    const existingTask = taskById.get(taskId);
    const createdAt = existingTask?.createdAt ?? new Date().toISOString();
    const eventIds = [...(existingTask?.eventIds ?? [])];

    activeAutoTaskIds.add(taskId);

    if (!existingTask) {
      const event = buildRealSessionTaskEvent(agent, taskId);
      nextEvents.push(event);
      eventIds.unshift(event.id);
    }

    nextTaskById.set(taskId, {
      id: taskId,
      title: getRealSessionTaskTitle(agent),
      status: "running",
      progress: 62,
      assigneeAgentId: agent.id,
      subagentIds: [],
      details: getRealSessionTaskDetails(agent),
      eventIds: eventIds.slice(0, 8),
      createdAt,
      updatedAt: new Date().toISOString(),
    });

    return {
      ...agent,
      currentTaskId: taskId,
      status: "running" as AgentStatus,
    };
  });

  return {
    agents: nextAgents,
    events:
      nextEvents.length > 0
        ? [...nextEvents, ...events].slice(0, eventLogLimit)
        : events,
    tasks: Array.from(nextTaskById.values()).filter(
      (task) => !isRealSessionTask(task) || activeAutoTaskIds.has(task.id),
    ),
  };
};

const isSubagentLinkedTask = (task: TaskCard) =>
  task.assigneeAgentId === miniSubagentId ||
  task.subagentIds.includes(miniSubagentId);

const canAdvanceDemoFlowTask = (task: TaskCard) =>
  !task.assigneeAgentId || !isRealAgentId(task.assigneeAgentId);

const getSubagentEventType = (
  task: TaskCard,
  status: TaskStatus,
): SceneEvent["type"] | undefined => {
  if (!isSubagentLinkedTask(task)) {
    return undefined;
  }

  if (status === "running") {
    return "subagent_spawned";
  }

  if (status === "verifying" || status === "done") {
    return "subagent_recycled";
  }

  return undefined;
};

const getSubagentEventMessage = (
  task: TaskCard,
  eventType: SceneEvent["type"],
) => {
  if (eventType === "subagent_spawned") {
    return `${task.title}：mini subagent 从工位出发，开始搬运任务。`;
  }

  return `${task.title}：mini subagent 回收结果，返回工位。`;
};

const getAdvancedEventType = (
  task: TaskCard,
  status: TaskStatus,
): SceneEvent["type"] | undefined => {
  if (status === "running") {
    return isSubagentLinkedTask(task) ? "summon_subagent" : "handoff";
  }

  if (status === "verifying") {
    return "merge_result";
  }

  return undefined;
};

const getAdvancedEventActorId = (task: TaskCard) => {
  if (task.assigneeAgentId && task.assigneeAgentId !== miniSubagentId) {
    return task.assigneeAgentId;
  }

  return undefined;
};

const getAdvancedEventMessage = (
  task: TaskCard,
  eventType: SceneEvent["type"],
) => {
  if (eventType === "summon_subagent") {
    return `${task.title}：主 agent 呼叫 mini subagent 协作。`;
  }

  if (eventType === "merge_result") {
    return `${task.title}：合并执行结果，准备进入验证。`;
  }

  return `${task.title}：任务在 agent 之间完成交接。`;
};

const defaultTaskFilters: TaskFilters = {
  agentId: "all",
  blockedOnly: false,
  status: "all",
};

const persistedPreferences = loadAgentWorldPreferences(defaultTaskFilters);
const isRealAgentId = (agentId: string) => agentId.startsWith("real-agent-");

const realAgentAppTypeByKind: Record<AgentProcessInfo["kind"], AgentAppType> = {
  claude_cli: "cli",
  codex_app: "app",
  codex_app_server: "app",
  codex_cli: "cli",
};

const realAgentRoleByKind: Record<AgentProcessInfo["kind"], string> = {
  claude_cli: "Claude 终端会话",
  codex_app: "Codex 桌面宿主",
  codex_app_server: "Codex 会话服务",
  codex_cli: "Codex 终端会话",
};

const realAgentSpriteByKind: Record<AgentProcessInfo["kind"], string> = {
  claude_cli: "black-fur-cat-ops",
  codex_app: "white-bow-cat-pm",
  codex_app_server: "beaver-builder",
  codex_cli: "tea-cat-engineer",
};

const realAgentStatusByKind: Record<AgentProcessInfo["kind"], AgentStatus> = {
  claude_cli: "idle",
  codex_app: "idle",
  codex_app_server: "idle",
  codex_cli: "idle",
};
const retiredRealAgentRoomId = "monitor_wall";

const getDemoSceneAgents = (agents: AgentSession[]) =>
  agents.filter((agent) => !agent.isReal);

const getSceneAgents = (
  agents: AgentSession[],
  isDemoFlowEnabled: boolean,
) => {
  const sceneAgents = agents.filter((agent) => !agent.isReal);

  if (sceneAgents.length > 0) {
    return sceneAgents;
  }

  return isDemoFlowEnabled ? mockAgents : [];
};

const getRealLifecycleEvents = (
  events: SceneEvent[],
  agents: AgentSession[],
) => {
  const realAgentIds = new Set(
    agents.filter((agent) => agent.isReal).map((agent) => agent.id),
  );

  return events.filter(
    (event) =>
      event.actorId?.startsWith("real-agent-") ||
      (event.actorId && realAgentIds.has(event.actorId)),
  );
};

const toUnixSeconds = (value: string | undefined) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : Math.floor(Date.now() / 1000);
};

const buildRealAgentRole = (process: AgentProcessInfo) =>
  [
    realAgentRoleByKind[process.kind],
    process.workspaceLabel ? `工作区 ${process.workspaceLabel}` : undefined,
    process.windowLabel ? `窗口 ${process.windowLabel}` : undefined,
  ]
    .filter(Boolean)
    .join(" · ");

const realAgentPresenceRank: Record<AgentPresenceStatus, number> = {
  live: 0,
  stale: 1,
  gone: 2,
};

const toRealAgentSession = (
  process: AgentProcessInfo,
  index: number,
  previousAgent?: AgentSession,
): AgentSession => ({
  id: getRealAgentId(process),
  source: process.source,
  appType: realAgentAppTypeByKind[process.kind],
  processKind: process.kind,
  status: realAgentStatusByKind[process.kind],
  pid: process.pid,
  parentPid: process.parentPid,
  canNavigateToWindow: process.canNavigateToWindow,
  currentTaskId: previousAgent?.currentTaskId,
  displayName: `${process.displayName} #${process.pid}`,
  presenceStatus: "live",
  role: buildRealAgentRole(process),
  spriteSheetId: realAgentSpriteByKind[process.kind],
  roomId: retiredRealAgentRoomId,
  scene: previousAgent?.scene ?? {
    position: {
      x: 780 + (index % 4) * 28,
      y: 172 + Math.floor(index / 4) * 26,
    },
    scale: process.kind === "codex_app" ? 0.34 : 0.32,
  },
  taskSourceLabel: process.taskSourceLabel,
  windowLabel: process.windowLabel,
  windowOwnerLabel: process.windowOwnerLabel,
  workspaceLabel: process.workspaceLabel,
  workspacePath: process.workspacePath,
  lastSeenAt: process.lastSeenAt,
  isReal: true,
});

const getRetiringRealAgents = (
  currentAgents: AgentSession[],
  liveAgentIds: Set<string>,
  scannedAt: string,
  refreshIntervalMs: number,
) => {
  const nowSeconds = toUnixSeconds(scannedAt);
  const staleToGoneSeconds = Math.max(
    16,
    Math.ceil(refreshIntervalMs / 1000) * 2,
  );
  const removeGoneSeconds = Math.max(
    36,
    Math.ceil(refreshIntervalMs / 1000) * 4,
  );

  return currentAgents
    .filter((agent) => agent.isReal && !liveAgentIds.has(agent.id))
    .map((agent): AgentSession | null => {
      const staleSince = agent.staleSince ?? scannedAt;
      const staleAgeSeconds = nowSeconds - toUnixSeconds(staleSince);
      const nextPresenceStatus: AgentPresenceStatus =
        staleAgeSeconds >= staleToGoneSeconds ? "gone" : "stale";
      const goneSince =
        nextPresenceStatus === "gone"
          ? (agent.goneSince ?? scannedAt)
          : undefined;

      if (
        nextPresenceStatus === "gone" &&
        nowSeconds - toUnixSeconds(goneSince) >= removeGoneSeconds
      ) {
        return null;
      }

      return {
        ...agent,
        status: "idle",
        presenceStatus: nextPresenceStatus,
        roomId: retiredRealAgentRoomId,
        staleSince,
        goneSince,
      };
    })
    .filter((agent): agent is AgentSession => Boolean(agent))
    .sort(
      (left, right) =>
        realAgentPresenceRank[left.presenceStatus ?? "live"] -
        realAgentPresenceRank[right.presenceStatus ?? "live"],
    );
};

const mergeRealAgents = (
  processScan: AgentProcessScan,
  currentAgents: AgentSession[],
  refreshIntervalMs: number,
) => {
  const previousRealAgents = new Map(
    currentAgents
      .filter((agent) => agent.isReal)
      .map((agent) => [agent.id, agent] as const),
  );
  const liveAgents = processScan.processes.map((process, index) =>
    toRealAgentSession(
      process,
      index,
      previousRealAgents.get(getRealAgentId(process)),
    ),
  );
  const liveAgentIds = new Set(liveAgents.map((agent) => agent.id));
  const retiringAgents = getRetiringRealAgents(
    currentAgents,
    liveAgentIds,
    processScan.scannedAt,
    refreshIntervalMs,
  );

  return [
    ...getDemoSceneAgents(currentAgents),
    ...liveAgents,
    ...retiringAgents,
  ];
};

interface AgentWorldState {
  agentFocusRequest: { agentId: string; requestId: number } | null;
  roomFocusRequest: { requestId: number; roomId: string } | null;
  taskFocusRequest: { requestId: number; taskId: string } | null;
  agents: AgentSession[];
  tasks: TaskCard[];
  events: SceneEvent[];
  processScan: AgentProcessScan | null;
  processScanError: string | null;
  processScanStatus: AgentProcessScanStatus;
  preferences: AppPreferences;
  snapshotRestoreStatus: SnapshotRestoreStatus;
  snapshotSaveStatus: SnapshotSaveStatus;
  snapshotLastSavedAt: string | null;
  snapshotPersistenceError: string | null;
  sceneViewportPreference: SceneViewportPreference;
  taskFilters: TaskFilters;
  selectedTaskId: string;
  selectedAgentId: string;
  selectedRoomId: string;
  demoFlowTick: number;
  advanceDemoFlow: () => void;
  bindRealAgentToTask: (agentId: string, taskId: string) => void;
  clearRealAgentTaskBinding: (agentId: string) => void;
  focusAgent: (agentId: string) => void;
  focusSceneEvent: (eventId: string) => void;
  hydratePersistentSnapshot: () => Promise<void>;
  persistAgentWorldSnapshot: () => Promise<void>;
  refreshAgentProcesses: () => Promise<void>;
  resetTaskFilters: () => void;
  selectTask: (taskId: string) => void;
  selectAgent: (agentId: string) => void;
  selectRoom: (roomId: string) => void;
  setAppPreferences: (preferences: Partial<AppPreferences>) => void;
  setSceneViewportPreference: (viewport: SceneViewportPreference) => void;
  setTaskFilters: (filters: Partial<TaskFilters>) => void;
}

export const useAgentWorldStore = create<AgentWorldState>((set, get) => {
  const persistLocalPreferences = (
    nextState: Partial<
      Pick<
        AgentWorldState,
        "preferences" | "sceneViewportPreference" | "taskFilters"
      >
    > = {},
  ) => {
    const current = get();

    saveAgentWorldPreferences({
      preferences: nextState.preferences ?? current.preferences,
      sceneViewportPreference:
        nextState.sceneViewportPreference ?? current.sceneViewportPreference,
      taskFilters: nextState.taskFilters ?? current.taskFilters,
    });
  };

  return {
    agents: persistedPreferences.preferences.isDemoFlowEnabled
      ? mockAgents
      : [],
    tasks: persistedPreferences.preferences.isDemoFlowEnabled ? mockTasks : [],
    events: persistedPreferences.preferences.isDemoFlowEnabled ? mockEvents : [],
    agentFocusRequest: null,
    roomFocusRequest: null,
    taskFocusRequest: null,
    processScan: null,
    processScanError: null,
    processScanStatus: persistedPreferences.preferences.isProcessMonitorEnabled
      ? "idle"
      : "disabled",
    preferences: persistedPreferences.preferences,
    snapshotRestoreStatus: "idle",
    snapshotSaveStatus: "idle",
    snapshotLastSavedAt: null,
    snapshotPersistenceError: null,
    sceneViewportPreference: persistedPreferences.sceneViewportPreference,
    taskFilters: persistedPreferences.taskFilters,
    selectedTaskId: persistedPreferences.preferences.isDemoFlowEnabled
      ? "task-pixi-scene"
      : "",
    selectedAgentId: persistedPreferences.preferences.isDemoFlowEnabled
      ? "agent-beaver-builder"
      : "",
    selectedRoomId: persistedPreferences.preferences.isDemoFlowEnabled
      ? "room_execution"
      : retiredRealAgentRoomId,
    demoFlowTick: 0,
    advanceDemoFlow: () => {
      const { demoFlowTick, preferences, selectedTaskId, tasks } = get();
      if (!preferences.isDemoFlowEnabled) {
        return;
      }

      const preferredTaskId =
        demoFlowTaskIds[demoFlowTick % demoFlowTaskIds.length];
      const task =
        tasks.find(
          (item) =>
            item.id === preferredTaskId && canAdvanceDemoFlowTask(item),
        ) ??
        tasks.find(
          (item) => item.id === selectedTaskId && canAdvanceDemoFlowTask(item),
        ) ??
        tasks.find(canAdvanceDemoFlowTask);

      if (!task) {
        return;
      }

      const status = getNextDemoStatus(task.status, demoFlowTick);
      const eventId = `event-demo-${demoFlowTick + 1}`;
      const createdAt = new Date().toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const event: SceneEvent = {
        id: eventId,
        type: getSceneEventType(status),
        actorId: task.assigneeAgentId,
        taskId: task.id,
        message: `${task.title}：${statusMessages[status]}`,
        createdAt,
      };
      const advancedEventType = getAdvancedEventType(task, status);
      const advancedEventActorId = getAdvancedEventActorId(task);
      const advancedEvent: SceneEvent | undefined =
        advancedEventType && advancedEventActorId
          ? {
              id: `${eventId}-advanced`,
              type: advancedEventType,
              actorId: advancedEventActorId,
              taskId: task.id,
              message: getAdvancedEventMessage(task, advancedEventType),
              createdAt,
            }
          : undefined;
      const subagentEventType = getSubagentEventType(task, status);
      const subagentEvent: SceneEvent | undefined = subagentEventType
        ? {
            id: `${eventId}-subagent`,
            type: subagentEventType,
            actorId: task.subagentIds[0] ?? miniSubagentId,
            taskId: task.id,
            message: getSubagentEventMessage(task, subagentEventType),
            createdAt,
          }
        : undefined;
      const nextDemoEvents = [subagentEvent, advancedEvent, event].filter(
        (item): item is SceneEvent => Boolean(item),
      );
      const nextEventIds = nextDemoEvents.map((item) => item.id);

      set({
        demoFlowTick: demoFlowTick + 1,
        events: [...nextDemoEvents, ...get().events].slice(
          0,
          preferences.eventLogLimit,
        ),
        selectedRoomId:
          task.id === selectedTaskId
            ? getRoomIdForTaskStatus(status)
            : get().selectedRoomId,
        tasks: tasks.map((item) =>
          item.id === task.id
            ? {
                ...item,
                eventIds: [...nextEventIds, ...item.eventIds].slice(0, 8),
                progress:
                  status === "queued"
                    ? 8
                    : status === "planning"
                      ? 28
                      : status === "running"
                        ? 62
                        : status === "verifying"
                          ? 84
                          : status === "done"
                            ? 100
                            : status === "blocked"
                              ? 58
                              : item.progress,
                status,
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      });
    },
    bindRealAgentToTask: (agentId, taskId) => {
      const state = get();
      const agent = state.agents.find(
        (item) => item.id === agentId && item.isReal,
      );
      const task = state.tasks.find((item) => item.id === taskId);

      if (!agent || !task) {
        return;
      }

      if (agent.currentTaskId === taskId && task.assigneeAgentId === agentId) {
        set({
          agentFocusRequest: {
            agentId,
            requestId: (state.agentFocusRequest?.requestId ?? 0) + 1,
          },
          selectedAgentId: agentId,
          selectedRoomId: getRoomIdForTaskStatus(task.status),
          selectedTaskId: taskId,
        });
        return;
      }

      const createdAt = getClockLabel();
      const eventId = `event-bind-${Date.now()}-${agentId}-${taskId}`;
      const event: SceneEvent = {
        actorId: agentId,
        createdAt,
        id: eventId,
        message: `${getSafeAgentDisplayName(agent)}：已绑定到任务「${task.title}」，真实会话进入看板流。`,
        taskId,
        type: "handoff",
      };
      const selectedRoomId = getRoomIdForTaskStatus(task.status);

      set({
        agentFocusRequest: {
          agentId,
          requestId: (state.agentFocusRequest?.requestId ?? 0) + 1,
        },
        agents: state.agents.map((item) =>
          item.id === agentId ? { ...item, currentTaskId: taskId } : item,
        ),
        events: [event, ...state.events].slice(
          0,
          state.preferences.eventLogLimit,
        ),
        selectedAgentId: agentId,
        selectedRoomId,
        selectedTaskId: taskId,
        tasks: state.tasks
          .filter(
            (item) =>
              !(
                isRealSessionTask(item) &&
                item.assigneeAgentId === agentId &&
                item.id !== taskId
              ),
          )
          .map((item) =>
            item.id === taskId
              ? {
                  ...item,
                  assigneeAgentId: agentId,
                  eventIds: [eventId, ...item.eventIds].slice(0, 8),
                  updatedAt: new Date().toISOString(),
                }
              : item.assigneeAgentId === agentId
                ? {
                    ...item,
                    assigneeAgentId: undefined,
                    updatedAt: new Date().toISOString(),
                  }
                : item,
          ),
      });
    },
    clearRealAgentTaskBinding: (agentId) => {
      const state = get();
      const agent = state.agents.find(
        (item) => item.id === agentId && item.isReal,
      );
      const task = state.tasks.find(
        (item) =>
          item.id === agent?.currentTaskId || item.assigneeAgentId === agentId,
      );

      if (!agent || !task) {
        return;
      }

      const createdAt = getClockLabel();
      const eventId = `event-unbind-${Date.now()}-${agentId}-${task.id}`;
      const event: SceneEvent = {
        actorId: agentId,
        createdAt,
        id: eventId,
        message: `${getSafeAgentDisplayName(agent)}：已解除任务「${task.title}」绑定，回到监控墙。`,
        taskId: task.id,
        type: "merge_result",
      };

      set({
        agentFocusRequest: {
          agentId,
          requestId: (state.agentFocusRequest?.requestId ?? 0) + 1,
        },
        agents: state.agents.map((item) =>
          item.id === agentId ? { ...item, currentTaskId: undefined } : item,
        ),
        events: [event, ...state.events].slice(
          0,
          state.preferences.eventLogLimit,
        ),
        selectedAgentId: agentId,
        selectedRoomId: agent.roomId,
        selectedTaskId:
          state.selectedTaskId === task.id ? "" : state.selectedTaskId,
        tasks: state.tasks
          .filter(
            (item) =>
              !(isRealSessionTask(item) && item.assigneeAgentId === agentId),
          )
          .map((item) =>
            item.assigneeAgentId === agentId
              ? {
                  ...item,
                  assigneeAgentId: undefined,
                  eventIds:
                    item.id === task.id
                      ? [eventId, ...item.eventIds].slice(0, 8)
                      : item.eventIds,
                  updatedAt: new Date().toISOString(),
                }
              : item,
          ),
      });
    },
    focusAgent: (agentId) => {
      if (!get().agents.some((agent) => agent.id === agentId)) {
        return;
      }

      const currentRequestId = get().agentFocusRequest?.requestId ?? 0;

      set({
        agentFocusRequest: {
          agentId,
          requestId: currentRequestId + 1,
        },
      });
    },
    focusSceneEvent: (eventId) => {
      const state = get();
      const event = state.events.find((item) => item.id === eventId);

      if (!event) {
        return;
      }

      const task = event.taskId
        ? state.tasks.find((item) => item.id === event.taskId)
        : undefined;
      const actor = event.actorId
        ? state.agents.find((item) => item.id === event.actorId)
        : undefined;
      const roomId =
        task
          ? getRoomIdForTaskStatus(task.status)
          : (actor?.roomId ?? state.selectedRoomId);
      const nextRequestId =
        (actor
          ? state.agentFocusRequest?.requestId
          : state.roomFocusRequest?.requestId) ?? 0;

      set({
        agentFocusRequest: actor
          ? { agentId: actor.id, requestId: nextRequestId + 1 }
          : state.agentFocusRequest,
        roomFocusRequest:
          !actor && roomId
            ? { requestId: nextRequestId + 1, roomId }
            : state.roomFocusRequest,
        taskFocusRequest: task
          ? {
              requestId: (state.taskFocusRequest?.requestId ?? 0) + 1,
              taskId: task.id,
            }
          : state.taskFocusRequest,
        selectedAgentId: actor?.id ?? state.selectedAgentId,
        selectedRoomId: roomId,
        selectedTaskId: task?.id ?? state.selectedTaskId,
      });
    },
    hydratePersistentSnapshot: async () => {
      if (get().snapshotRestoreStatus === "loading") {
        return;
      }

      set({
        snapshotPersistenceError: null,
        snapshotRestoreStatus: "loading",
      });

      try {
        const snapshot = await loadAgentWorldSnapshot();

        if (!snapshot) {
          const current = get();
          const sceneAgents = getSceneAgents(
            current.agents,
            current.preferences.isDemoFlowEnabled,
          );
          const realAgents = current.agents.filter((agent) => agent.isReal);

          set({
            agents: [...sceneAgents, ...realAgents],
            events: current.preferences.isDemoFlowEnabled ? current.events : [],
            selectedAgentId: current.preferences.isDemoFlowEnabled
              ? current.selectedAgentId
              : "",
            selectedRoomId: current.preferences.isDemoFlowEnabled
              ? current.selectedRoomId
              : retiredRealAgentRoomId,
            selectedTaskId: current.preferences.isDemoFlowEnabled
              ? current.selectedTaskId
              : "",
            snapshotRestoreStatus: "empty",
            tasks: current.preferences.isDemoFlowEnabled ? current.tasks : [],
          });
          return;
        }

        const current = get();
        const tasks = current.preferences.isDemoFlowEnabled
          ? snapshot.tasks.length > 0
            ? snapshot.tasks
            : current.tasks.length > 0
              ? current.tasks
              : mockTasks
          : [];
        const events =
          current.preferences.isDemoFlowEnabled
            ? snapshot.events.length > 0
              ? snapshot.events.slice(0, current.preferences.eventLogLimit)
              : current.events.length > 0
                ? current.events
                : mockEvents
            : getRealLifecycleEvents(
                snapshot.events,
                current.agents,
              ).slice(0, current.preferences.eventLogLimit);
        const restoredSceneAgents =
          current.preferences.isDemoFlowEnabled
            ? snapshot.agents.length > 0
              ? snapshot.agents
              : getSceneAgents(current.agents, true)
            : [];
        const agents = [
          ...restoredSceneAgents,
          ...current.agents.filter((agent) => agent.isReal),
        ];
        const selectedTaskId = tasks.some(
          (task) => task.id === snapshot.selectedTaskId,
        )
          ? snapshot.selectedTaskId
          : (tasks[0]?.id ?? "");
        const selectedAgentId = agents.some(
          (agent) => agent.id === snapshot.selectedAgentId,
        )
          ? snapshot.selectedAgentId
          : (agents[0]?.id ?? "");
        const selectedRoomId = current.preferences.isDemoFlowEnabled
          ? snapshot.selectedRoomId || current.selectedRoomId
          : agents.find((agent) => agent.id === selectedAgentId)?.roomId ||
            retiredRealAgentRoomId;

        set({
          agents,
          demoFlowTick: snapshot.demoFlowTick,
          events,
          selectedAgentId,
          selectedRoomId,
          selectedTaskId,
          snapshotLastSavedAt: snapshot.savedAt,
          snapshotRestoreStatus: "ready",
          tasks,
        });
      } catch (error) {
        set({
          snapshotPersistenceError:
            error instanceof Error ? error.message : String(error),
          snapshotRestoreStatus: "error",
        });
      }
    },
    persistAgentWorldSnapshot: async () => {
      const state = get();
      const snapshot = createAgentWorldSnapshot({
        agents: state.agents,
        tasks: state.tasks,
        events: state.events,
        selectedTaskId: state.selectedTaskId,
        selectedAgentId: state.selectedAgentId,
        selectedRoomId: state.selectedRoomId,
        demoFlowTick: state.demoFlowTick,
      });

      set({ snapshotPersistenceError: null, snapshotSaveStatus: "saving" });

      try {
        await saveAgentWorldSnapshot(snapshot);
        set({
          snapshotLastSavedAt: snapshot.savedAt,
          snapshotSaveStatus: "saved",
        });
      } catch (error) {
        set({
          snapshotPersistenceError:
            error instanceof Error ? error.message : String(error),
          snapshotSaveStatus: "error",
        });
      }
    },
    refreshAgentProcesses: async () => {
      if (!get().preferences.isProcessMonitorEnabled) {
        set({
          agents: getSceneAgents(
            get().agents,
            get().preferences.isDemoFlowEnabled,
          ),
          processScan: null,
          processScanError: null,
          processScanStatus: "disabled",
        });
        return;
      }

      set({ processScanError: null, processScanStatus: "scanning" });

      try {
        const processScan = await scanAgentProcesses();

        if (!processScan) {
          set({
            agents: getSceneAgents(
              get().agents,
              get().preferences.isDemoFlowEnabled,
            ),
            processScan: null,
            processScanStatus: "unavailable",
          });
          return;
        }

        const currentState = get();
        const mergedAgents = mergeRealAgents(
          processScan,
          currentState.agents,
          currentState.preferences.processRefreshIntervalMs,
        );
        const realLifecycleEvents = getRealAgentLifecycleEvents(
          processScan,
          currentState.agents,
          mergedAgents,
          currentState.preferences.eventLogLimit,
          currentState.preferences.realAgentEventRuleMode,
        );
        const syncedRealSessions = syncLiveRealSessionTaskBindings({
          agents: mergedAgents,
          eventLogLimit: currentState.preferences.eventLogLimit,
          events:
            realLifecycleEvents.length > 0
              ? [...realLifecycleEvents, ...currentState.events].slice(
                  0,
                  currentState.preferences.eventLogLimit,
                )
              : currentState.events,
          tasks: currentState.tasks,
        });
        const agents = syncedRealSessions.agents;
        const selectedAgentId = currentState.selectedAgentId;
        const taskFilters = currentState.taskFilters;
        const nextTaskFilters =
          taskFilters.agentId !== "all" &&
          !agents.some((agent) => agent.id === taskFilters.agentId)
            ? { ...taskFilters, agentId: "all" }
            : taskFilters;

        if (nextTaskFilters !== taskFilters) {
          persistLocalPreferences({ taskFilters: nextTaskFilters });
        }

        set({
          agents,
          events: syncedRealSessions.events,
          processScan,
          processScanStatus: "ready",
          selectedAgentId: agents.some((agent) => agent.id === selectedAgentId)
            ? selectedAgentId
            : (agents.find((agent) => agent.isReal)?.id ?? ""),
          selectedTaskId: syncedRealSessions.tasks.some(
            (task) => task.id === currentState.selectedTaskId,
          )
            ? currentState.selectedTaskId
            : (syncedRealSessions.tasks[0]?.id ?? ""),
          taskFilters: nextTaskFilters,
          tasks: syncedRealSessions.tasks,
        });
      } catch (error) {
        set({
          agents: getSceneAgents(
            get().agents,
            get().preferences.isDemoFlowEnabled,
          ),
          processScanError:
            error instanceof Error ? error.message : String(error),
          processScanStatus: "error",
        });
      }
    },
    resetTaskFilters: () => {
      set({ taskFilters: defaultTaskFilters });
      persistLocalPreferences({ taskFilters: defaultTaskFilters });
    },
    selectTask: (taskId) => {
      const task = get().tasks.find((item) => item.id === taskId);
      const assignee = get().agents.find(
        (agent) => agent.id === task?.assigneeAgentId,
      );

      set({
        selectedTaskId: taskId,
        taskFocusRequest: task
          ? {
              requestId: (get().taskFocusRequest?.requestId ?? 0) + 1,
              taskId,
            }
          : get().taskFocusRequest,
        selectedAgentId: assignee?.id ?? get().selectedAgentId,
        selectedRoomId: task
          ? getRoomIdForTaskStatus(task.status)
          : (assignee?.roomId ?? get().selectedRoomId),
      });
    },
    selectAgent: (agentId) => {
      const agent = get().agents.find((item) => item.id === agentId);
      if (!agent) {
        return;
      }

      const task = agent
        ? findActiveTaskForAgent(agent, get().tasks)
        : undefined;

      set({
        agentFocusRequest: {
          agentId,
          requestId: (get().agentFocusRequest?.requestId ?? 0) + 1,
        },
        selectedAgentId: agentId,
        selectedTaskId: task?.id ?? (agent?.isReal ? "" : get().selectedTaskId),
        selectedRoomId: task
          ? getRoomIdForTaskStatus(task.status)
          : (agent?.roomId ?? get().selectedRoomId),
      });
    },
    selectRoom: (roomId) => {
      set({ selectedRoomId: roomId });
    },
    setAppPreferences: (preferences) => {
      set((state) => {
        const nextPreferences = { ...state.preferences, ...preferences };
        const nextState: Partial<AgentWorldState> = {
          preferences: nextPreferences,
        };
        const nextTaskFilters =
          !nextPreferences.isProcessMonitorEnabled &&
          isRealAgentId(state.taskFilters.agentId)
            ? { ...state.taskFilters, agentId: "all" }
            : state.taskFilters;

        if (preferences.isDemoFlowEnabled === true) {
          const sceneAgents = getDemoSceneAgents(state.agents);
          const nextSceneAgents =
            sceneAgents.length > 0 ? sceneAgents : mockAgents;
          const nextTasks = state.tasks.length > 0 ? state.tasks : mockTasks;
          const selectedDemoAgentId = nextSceneAgents.some(
            (agent) => agent.id === state.selectedAgentId,
          )
            ? state.selectedAgentId
            : "agent-beaver-builder";
          const selectedDemoTaskId = nextTasks.some(
            (task) => task.id === state.selectedTaskId,
          )
            ? state.selectedTaskId
            : "task-pixi-scene";
          const selectedDemoTask = nextTasks.find(
            (task) => task.id === selectedDemoTaskId,
          );
          nextState.agents = [
            ...nextSceneAgents,
            ...state.agents.filter((agent) => agent.isReal),
          ];
          nextState.events =
            state.events.length > 0 ? state.events : mockEvents;
          nextState.tasks = nextTasks;
          nextState.selectedAgentId = selectedDemoAgentId;
          nextState.selectedTaskId = selectedDemoTaskId;
          nextState.selectedRoomId =
            selectedDemoTask
              ? getRoomIdForTaskStatus(selectedDemoTask.status)
              : nextSceneAgents.find((agent) => agent.id === selectedDemoAgentId)
                  ?.roomId ?? "room_execution";
        }

        if (preferences.isDemoFlowEnabled === false) {
          const realAgents = state.agents.filter((agent) => agent.isReal);
          nextState.agents = realAgents;
          nextState.events = getRealLifecycleEvents(state.events, state.agents);
          nextState.tasks = [];
          nextState.selectedAgentId = isRealAgentId(state.selectedAgentId)
            ? state.selectedAgentId
            : (realAgents[0]?.id ?? "");
          nextState.selectedRoomId =
            realAgents.find((agent) => agent.id === nextState.selectedAgentId)
              ?.roomId ?? retiredRealAgentRoomId;
          nextState.selectedTaskId = "";
          nextState.taskFilters = defaultTaskFilters;
        }

        if (!nextPreferences.isProcessMonitorEnabled) {
          nextState.agents = getSceneAgents(
            nextState.agents ?? state.agents,
            nextPreferences.isDemoFlowEnabled,
          );
          nextState.processScan = null;
          nextState.processScanError = null;
          nextState.processScanStatus = "disabled";
          nextState.selectedAgentId =
            nextState.agents.some(
              (agent) => agent.id === nextState.selectedAgentId,
            )
              ? nextState.selectedAgentId
              : (nextState.agents[0]?.id ?? "");
          nextState.taskFilters = nextState.taskFilters ?? nextTaskFilters;
        }

        if (preferences.eventLogLimit) {
          nextState.events = (nextState.events ?? state.events).slice(
            0,
            nextPreferences.eventLogLimit,
          );
        }

        persistLocalPreferences({
          preferences: nextPreferences,
          taskFilters: nextState.taskFilters ?? nextTaskFilters,
        });
        return nextState;
      });
    },
    setSceneViewportPreference: (sceneViewportPreference) => {
      set({ sceneViewportPreference });
      persistLocalPreferences({ sceneViewportPreference });
    },
    setTaskFilters: (filters) => {
      set((state) => {
        const taskFilters = { ...state.taskFilters, ...filters };

        persistLocalPreferences({ taskFilters });
        return { taskFilters };
      });
    },
  };
});
