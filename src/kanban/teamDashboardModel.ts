import type {
  AgentProcessScan,
  AgentProcessScanStatus,
  AgentSession,
  AppPreferences,
  FocusAgentWindowRequest,
  SceneEvent,
  TaskCard,
  TaskStatus,
} from "../types/domain";

export type TeamDashboardTone =
  | "neutral"
  | "good"
  | "warning"
  | "danger"
  | "muted";

export type TeamWindowActionState =
  | "ready"
  | "not-wired"
  | "browser-preview"
  | "demo"
  | "fallback"
  | "monitor-disabled"
  | "unavailable";

export interface TeamDashboardSummary {
  totalTasks: number;
  activeTasks: number;
  runningTasks: number;
  waitingTasks: number;
  blockedTasks: number;
  completedTasks: number;
  realAgents: number;
  demoAgents: number;
  boundRealSessions: number;
  unboundRealSessions: number;
  activeRealSessions: number;
  liveAgents: number;
  staleAgents: number;
  goneAgents: number;
  averageProgress: number;
  hasDemoData: boolean;
  hasRealSessions: boolean;
}

export interface TeamSourceBreakdown {
  id: AgentSession["source"] | "unassigned";
  label: string;
  agentCount: number;
  taskCount: number;
  realAgentCount: number;
  demoAgentCount: number;
  processCount: number;
  tone: TeamDashboardTone;
}

export interface SystemHealthView {
  status: AgentProcessScanStatus;
  label: string;
  detail: string;
  tone: TeamDashboardTone;
  scannedAtLabel: string;
  monitorEnabled: boolean;
  browserPreview: boolean;
  processTotal: number;
  codexCount: number;
  claudeCount: number;
  eventLogLimit: number;
  privacyMode: boolean;
}

export interface TeamCardView {
  id: string;
  taskId: string;
  title: string;
  status: TaskStatus;
  statusLabel: string;
  progress: number;
  sourceBadge: string;
  sourceTone: TeamDashboardTone;
  assignee: string;
  assigneeId?: string;
  subagentCount: number;
  isBlocked: boolean;
  isSelected: boolean;
  isDemo: boolean;
  isRealBound: boolean;
  canOpenWindow: boolean;
  canFocusWindow: boolean;
  navigationRequest?: FocusAgentWindowRequest;
  windowActionState: TeamWindowActionState;
  windowActionLabel: string;
  windowActionDetail: string;
  updatedAtLabel: string;
}

export interface ActivityFeedItem {
  id: string;
  eventId: string;
  label: string;
  message: string;
  actor: string;
  taskId?: string;
  taskTitle?: string;
  createdAtLabel: string;
  tone: TeamDashboardTone;
  isDemo: boolean;
  isSelected: boolean;
}

export interface TeamDashboardViewModel {
  summary: TeamDashboardSummary;
  sources: TeamSourceBreakdown[];
  health: SystemHealthView;
  cards: TeamCardView[];
  activity: ActivityFeedItem[];
  emptyStateLabel: string;
}

export interface TeamDashboardModelInput {
  agents: AgentSession[];
  events: SceneEvent[];
  preferences: AppPreferences;
  processScan: AgentProcessScan | null;
  processScanError?: string | null;
  processScanStatus: AgentProcessScanStatus;
  selectedTaskId: string;
  tasks: TaskCard[];
}

const statusLabel: Record<TaskStatus, string> = {
  blocked: "Blocked",
  done: "Done",
  planning: "Planning",
  queued: "Queued",
  running: "Running",
  verifying: "Verifying",
};

const sourceLabel: Record<AgentSession["source"], string> = {
  claude: "Claude",
  codex: "Codex",
  simulated: "Demo",
};

const sourceTone: Record<AgentSession["source"] | "unassigned", TeamDashboardTone> =
  {
    claude: "warning",
    codex: "good",
    simulated: "muted",
    unassigned: "neutral",
  };

const eventTone: Record<SceneEvent["type"], TeamDashboardTone> = {
  agent_seen: "good",
  blocked: "danger",
  completed: "good",
  handoff: "neutral",
  merge_result: "neutral",
  status_changed: "neutral",
  subagent_recycled: "muted",
  subagent_spawned: "good",
  summon_subagent: "warning",
  task_created: "neutral",
};

const eventLabel: Record<SceneEvent["type"], string> = {
  agent_seen: "Agent seen",
  blocked: "Blocked",
  completed: "Completed",
  handoff: "Handoff",
  merge_result: "Merged",
  status_changed: "Status",
  subagent_recycled: "Subagent returned",
  subagent_spawned: "Subagent spawned",
  summon_subagent: "Subagent called",
  task_created: "Task created",
};

const statusWeight: Record<TaskStatus, number> = {
  blocked: 0,
  running: 1,
  verifying: 2,
  planning: 3,
  queued: 4,
  done: 5,
};

const clampProgress = (value: number) =>
  Math.max(0, Math.min(100, Math.round(value)));

const formatDateLabel = (value?: string | null) => {
  if (!value) {
    return "Not scanned";
  }

  const unixSeconds = Number(value);
  const date = Number.isFinite(unixSeconds)
    ? new Date(unixSeconds * 1000)
    : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const stripPidSuffix = (value: string) => value.replace(/\s+#\d+$/u, "");

const basename = (value: string) => {
  const cleaned = value.replace(/\\/gu, "/").replace(/\/+$/u, "");
  const parts = cleaned.split("/").filter(Boolean);

  return parts.at(-1) ?? value;
};

const sanitizeVisibleLabel = (value?: string | null, fallback = "Unknown") => {
  if (!value?.trim()) {
    return fallback;
  }

  const trimmed = stripPidSuffix(value.trim());

  if (trimmed.includes("/") || trimmed.includes("\\")) {
    return basename(trimmed);
  }

  return trimmed;
};

const getAgentLabel = (
  agent: AgentSession | undefined,
  preferences: AppPreferences,
) => {
  if (!agent) {
    return "Unassigned";
  }

  if (agent.isReal && preferences.isPrivacyModeEnabled) {
    return "Real session";
  }

  return sanitizeVisibleLabel(agent.displayName);
};

const getTaskAssignee = (task: TaskCard, agentsById: Map<string, AgentSession>) =>
  task.assigneeAgentId ? agentsById.get(task.assigneeAgentId) : undefined;

const getAgentHasTaskBinding = (agent: AgentSession, tasks: TaskCard[]) =>
  tasks.some(
    (task) =>
      task.id === agent.currentTaskId ||
      task.assigneeAgentId === agent.id ||
      task.subagentIds.includes(agent.id),
  );

const getAgentIsLiveWorkerSession = (agent: AgentSession) =>
  agent.isReal &&
  (agent.presenceStatus ?? "live") === "live" &&
  (agent.processKind === "claude_cli" ||
    agent.processKind === "codex_app_server" ||
    agent.processKind === "codex_cli");

const getTaskIsDemo = (task: TaskCard, assignee: AgentSession | undefined) =>
  Boolean(
    !assignee?.isReal &&
      (assignee ||
        task.id.startsWith("task-") ||
        task.assigneeAgentId?.startsWith("agent-")),
  );

const getWindowAction = ({
  assignee,
  processScanStatus,
  preferences,
}: {
  assignee: AgentSession | undefined;
  preferences: AppPreferences;
  processScanStatus: AgentProcessScanStatus;
}) => {
  if (!preferences.isProcessMonitorEnabled || processScanStatus === "disabled") {
    return {
      canFocusWindow: false,
      canOpenWindow: false,
      detail: "Process monitor is disabled.",
      label: "Monitor off",
      navigationRequest: undefined,
      state: "monitor-disabled" as const,
    };
  }

  if (processScanStatus === "unavailable") {
    return {
      canFocusWindow: false,
      canOpenWindow: false,
      detail: "Desktop window navigation is unavailable in browser preview.",
      label: "Preview only",
      navigationRequest: undefined,
      state: "browser-preview" as const,
    };
  }

  if (!assignee) {
    return {
      canFocusWindow: false,
      canOpenWindow: false,
      detail: "No bound agent session yet.",
      label: "No session",
      navigationRequest: undefined,
      state: "unavailable" as const,
    };
  }

  if (!assignee.isReal) {
    return {
      canFocusWindow: false,
      canOpenWindow: false,
      detail: "Demo teams cannot open desktop work windows.",
      label: "Demo",
      navigationRequest: undefined,
      state: "demo" as const,
    };
  }

  if (assignee.presenceStatus === "gone") {
    return {
      canFocusWindow: false,
      canOpenWindow: false,
      detail: "The real session has left the process scan.",
      label: "Gone",
      navigationRequest: undefined,
      state: "unavailable" as const,
    };
  }

  const hasWindow = Boolean(assignee.windowLabel || assignee.windowOwnerLabel);
  const hasWorkspace = Boolean(assignee.workspacePath);
  const canFocusWindow =
    processScanStatus === "ready" &&
    Boolean(assignee.canNavigateToWindow) &&
    hasWindow &&
    assignee.presenceStatus !== "stale";
  const canOpenWindow =
    processScanStatus === "ready" &&
    (Boolean(assignee.canNavigateToWindow) || hasWorkspace);
  const navigationRequest: FocusAgentWindowRequest = {
    kind: assignee.processKind,
    pid: assignee.pid,
    source: assignee.source === "simulated" ? undefined : assignee.source,
    windowLabel: assignee.windowLabel,
    windowOwnerLabel: assignee.windowOwnerLabel,
    workspacePath: assignee.workspacePath,
  };

  if (canFocusWindow) {
    return {
      canFocusWindow,
      canOpenWindow,
      detail: "Focus the real Codex / Claude work window for this team.",
      label: "Open Window",
      navigationRequest,
      state: "ready" as const,
    };
  }

  if (canOpenWindow) {
    return {
      canFocusWindow,
      canOpenWindow,
      detail: "Window focus may not be available; open the workspace as fallback.",
      label: "Open Workspace",
      navigationRequest,
      state: "fallback" as const,
    };
  }

  return {
    canFocusWindow: false,
    canOpenWindow: false,
    detail: "No window or workspace metadata is available for this session.",
    label: "Unavailable",
    navigationRequest: undefined,
    state: "unavailable" as const,
  };
};

const getHealthView = ({
  preferences,
  processScan,
  processScanError,
  processScanStatus,
}: Pick<
  TeamDashboardModelInput,
  "preferences" | "processScan" | "processScanError" | "processScanStatus"
>): SystemHealthView => {
  if (!preferences.isProcessMonitorEnabled || processScanStatus === "disabled") {
    return {
      browserPreview: false,
      claudeCount: 0,
      codexCount: 0,
      detail: "Process monitor is disabled.",
      eventLogLimit: preferences.eventLogLimit,
      label: "Monitor off",
      monitorEnabled: false,
      privacyMode: preferences.isPrivacyModeEnabled,
      processTotal: 0,
      scannedAtLabel: "Not scanned",
      status: processScanStatus,
      tone: "muted",
    };
  }

  if (processScanStatus === "error") {
    return {
      browserPreview: false,
      claudeCount: processScan?.claudeCount ?? 0,
      codexCount: processScan?.codexCount ?? 0,
      detail: processScanError || "Process scan failed.",
      eventLogLimit: preferences.eventLogLimit,
      label: "Scan error",
      monitorEnabled: true,
      privacyMode: preferences.isPrivacyModeEnabled,
      processTotal: processScan?.total ?? 0,
      scannedAtLabel: formatDateLabel(processScan?.scannedAt),
      status: processScanStatus,
      tone: "danger",
    };
  }

  if (processScanStatus === "unavailable") {
    return {
      browserPreview: true,
      claudeCount: 0,
      codexCount: 0,
      detail: "Browser preview cannot scan or focus desktop windows.",
      eventLogLimit: preferences.eventLogLimit,
      label: "Browser preview",
      monitorEnabled: true,
      privacyMode: preferences.isPrivacyModeEnabled,
      processTotal: 0,
      scannedAtLabel: "Not scanned",
      status: processScanStatus,
      tone: "warning",
    };
  }

  if (processScanStatus === "scanning") {
    return {
      browserPreview: false,
      claudeCount: processScan?.claudeCount ?? 0,
      codexCount: processScan?.codexCount ?? 0,
      detail: "Refreshing process scan.",
      eventLogLimit: preferences.eventLogLimit,
      label: "Scanning",
      monitorEnabled: true,
      privacyMode: preferences.isPrivacyModeEnabled,
      processTotal: processScan?.total ?? 0,
      scannedAtLabel: formatDateLabel(processScan?.scannedAt),
      status: processScanStatus,
      tone: "neutral",
    };
  }

  return {
    browserPreview: false,
    claudeCount: processScan?.claudeCount ?? 0,
    codexCount: processScan?.codexCount ?? 0,
    detail:
      processScanStatus === "ready"
        ? "Real process metadata is available."
        : "Waiting for first scan.",
    eventLogLimit: preferences.eventLogLimit,
    label: processScanStatus === "ready" ? "Live" : "Idle",
    monitorEnabled: true,
    privacyMode: preferences.isPrivacyModeEnabled,
    processTotal: processScan?.total ?? 0,
    scannedAtLabel: formatDateLabel(processScan?.scannedAt),
    status: processScanStatus,
    tone: processScanStatus === "ready" ? "good" : "neutral",
  };
};

const buildSources = (
  tasks: TaskCard[],
  agents: AgentSession[],
  processScan: AgentProcessScan | null,
) => {
  const sources = new Map<TeamSourceBreakdown["id"], TeamSourceBreakdown>();
  const ensureSource = (id: TeamSourceBreakdown["id"]) => {
    const existing = sources.get(id);

    if (existing) {
      return existing;
    }

    const next: TeamSourceBreakdown = {
      agentCount: 0,
      demoAgentCount: 0,
      id,
      label: id === "unassigned" ? "Unassigned" : sourceLabel[id],
      processCount: 0,
      realAgentCount: 0,
      taskCount: 0,
      tone: sourceTone[id],
    };

    sources.set(id, next);
    return next;
  };
  const agentsById = new Map(agents.map((agent) => [agent.id, agent]));

  agents.forEach((agent) => {
    const source = ensureSource(agent.source);
    source.agentCount += 1;

    if (agent.isReal) {
      source.realAgentCount += 1;
    } else {
      source.demoAgentCount += 1;
    }
  });

  tasks.forEach((task) => {
    const assignee = getTaskAssignee(task, agentsById);
    ensureSource(assignee?.source ?? "unassigned").taskCount += 1;
  });

  processScan?.processes.forEach((process) => {
    ensureSource(process.source).processCount += 1;
  });

  return Array.from(sources.values()).sort((left, right) => {
    if (right.taskCount !== left.taskCount) {
      return right.taskCount - left.taskCount;
    }

    if (right.processCount !== left.processCount) {
      return right.processCount - left.processCount;
    }

    return right.agentCount - left.agentCount;
  });
};

const buildCards = ({
  agents,
  preferences,
  processScanStatus,
  selectedTaskId,
  tasks,
}: Pick<
  TeamDashboardModelInput,
  "agents" | "preferences" | "processScanStatus" | "selectedTaskId" | "tasks"
>): TeamCardView[] => {
  const agentsById = new Map(agents.map((agent) => [agent.id, agent]));

  return tasks
    .filter((task) => task.status !== "done" && task.status !== "queued")
    .map((task) => {
      const assignee = getTaskAssignee(task, agentsById);
      const source = assignee?.source ?? "simulated";
      const action = getWindowAction({
        assignee,
        preferences,
        processScanStatus,
      });

      return {
        assignee: getAgentLabel(assignee, preferences),
        assigneeId: assignee?.id,
        canFocusWindow: action.canFocusWindow,
        canOpenWindow: action.canOpenWindow,
        id: `team-card-${task.id}`,
        isBlocked: task.status === "blocked",
        isDemo: getTaskIsDemo(task, assignee),
        isRealBound: Boolean(assignee?.isReal),
        isSelected: task.id === selectedTaskId,
        progress: clampProgress(task.progress),
        navigationRequest: action.navigationRequest,
        sourceBadge: assignee?.isReal ? sourceLabel[source] : "Demo",
        sourceTone: assignee?.isReal ? sourceTone[source] : "muted",
        status: task.status,
        statusLabel: statusLabel[task.status],
        subagentCount: task.subagentIds.length,
        taskId: task.id,
        title: sanitizeVisibleLabel(task.title, "Untitled task"),
        updatedAtLabel: formatDateLabel(task.updatedAt),
        windowActionDetail: action.detail,
        windowActionLabel: action.label,
        windowActionState: action.state,
      };
    })
    .sort((left, right) => {
      if (left.isSelected !== right.isSelected) {
        return left.isSelected ? -1 : 1;
      }

      const statusDelta = statusWeight[left.status] - statusWeight[right.status];

      if (statusDelta !== 0) {
        return statusDelta;
      }

      return right.progress - left.progress;
    });
};

const buildActivity = ({
  agents,
  events,
  preferences,
  selectedTaskId,
  tasks,
}: Pick<
  TeamDashboardModelInput,
  "agents" | "events" | "preferences" | "selectedTaskId" | "tasks"
>) => {
  const agentsById = new Map(agents.map((agent) => [agent.id, agent]));
  const tasksById = new Map(tasks.map((task) => [task.id, task]));

  return events.slice(0, preferences.eventLogLimit).map((event) => {
    const actor = event.actorId ? agentsById.get(event.actorId) : undefined;
    const task = event.taskId ? tasksById.get(event.taskId) : undefined;

    return {
      actor: getAgentLabel(actor, preferences),
      createdAtLabel: formatDateLabel(event.createdAt),
      eventId: event.id,
      id: `activity-${event.id}`,
      isDemo: !actor?.isReal,
      isSelected: Boolean(event.taskId && event.taskId === selectedTaskId),
      label: eventLabel[event.type],
      message: sanitizeVisibleLabel(event.message, eventLabel[event.type]),
      taskId: event.taskId,
      taskTitle: task ? sanitizeVisibleLabel(task.title) : undefined,
      tone: eventTone[event.type],
    };
  });
};

export const buildTeamDashboardViewModel = ({
  agents,
  events,
  preferences,
  processScan,
  processScanError,
  processScanStatus,
  selectedTaskId,
  tasks,
}: TeamDashboardModelInput): TeamDashboardViewModel => {
  const realAgents = agents.filter((agent) => agent.isReal);
  const demoAgents = agents.filter((agent) => !agent.isReal);
  const activeTasks = tasks.filter((task) => task.status !== "done");
  const runningTasks = tasks.filter(
    (task) =>
      task.status === "planning" ||
      task.status === "running" ||
      task.status === "verifying",
  );
  const waitingTasks = tasks.filter(
    (task) => task.status === "queued" || !task.assigneeAgentId,
  );
  const teamCardTaskCount = tasks.filter(
    (task) => task.status !== "done" && task.status !== "queued",
  ).length;
  const progressTotal = tasks.reduce((total, task) => total + task.progress, 0);
  const hasDemoData =
    preferences.isDemoFlowEnabled ||
    demoAgents.length > 0 ||
    tasks.some((task) => getTaskIsDemo(task, undefined));
  const activeRealSessions = realAgents.filter(getAgentIsLiveWorkerSession)
    .length;

  return {
    activity: buildActivity({ agents, events, preferences, selectedTaskId, tasks }),
    cards: buildCards({
      agents,
      preferences,
      processScanStatus,
      selectedTaskId,
      tasks,
    }),
    emptyStateLabel:
      teamCardTaskCount === 0
        ? processScan?.total
          ? activeRealSessions > 0
            ? "Active real sessions are live but not bound to task desks yet."
            : "Detected real sessions are available to bind to a task desk."
          : "No active task desks yet. Real sessions will appear after process scan."
        : "No team cards match the current data.",
    health: getHealthView({
      preferences,
      processScan,
      processScanError,
      processScanStatus,
    }),
    sources: buildSources(tasks, agents, processScan),
    summary: {
      activeRealSessions,
      activeTasks: activeTasks.length,
      averageProgress:
        tasks.length > 0 ? clampProgress(progressTotal / tasks.length) : 0,
      blockedTasks: tasks.filter((task) => task.status === "blocked").length,
      completedTasks: tasks.filter((task) => task.status === "done").length,
      demoAgents: demoAgents.length,
      boundRealSessions: realAgents.filter((agent) =>
        getAgentHasTaskBinding(agent, tasks),
      ).length,
      goneAgents: realAgents.filter((agent) => agent.presenceStatus === "gone")
        .length,
      hasDemoData,
      hasRealSessions: realAgents.length > 0 || Boolean(processScan?.total),
      liveAgents: realAgents.filter(
        (agent) => (agent.presenceStatus ?? "live") === "live",
      ).length,
      realAgents: realAgents.length,
      runningTasks: runningTasks.length,
      staleAgents: realAgents.filter((agent) => agent.presenceStatus === "stale")
        .length,
      totalTasks: tasks.length,
      unboundRealSessions: realAgents.filter(
        (agent) => !getAgentHasTaskBinding(agent, tasks),
      ).length,
      waitingTasks: waitingTasks.length,
    },
  };
};
