import {
  Cpu,
  FolderKanban,
  GitBranch,
  Link2,
  ListChecks,
  LocateFixed,
  Monitor,
  Radar,
  TimerReset,
  Unlink2,
  UserRound,
  Workflow,
} from "lucide-react";
import { useAgentWorldStore } from "../store/useAgentWorldStore";
import type {
  AgentSession,
  SceneEvent,
  TaskCard,
  TaskStatus,
} from "../types/domain";

const presenceLabel: Record<
  NonNullable<AgentSession["presenceStatus"]>,
  string
> = {
  gone: "gone",
  live: "live",
  stale: "stale",
};

const taskStatusLabel: Record<TaskStatus, string> = {
  blocked: "阻塞",
  done: "完成",
  planning: "规划中",
  queued: "队列中",
  running: "执行中",
  verifying: "验证中",
};

const mapActionByEventType: Record<
  SceneEvent["type"],
  {
    detail: string;
    label: string;
    token: string;
  }
> = {
  agent_seen: {
    detail: "事件识别到 actor，地图会把角色放到对应房间或监控墙。",
    label: "角色入场",
    token: "agent_seen",
  },
  blocked: {
    detail: "地图在阻塞处理室显示警报反馈，并把任务状态推到阻塞。",
    label: "阻塞警报",
    token: "blocked",
  },
  completed: {
    detail: "地图显示完成反馈，任务进入归档室。",
    label: "完成归档",
    token: "completed",
  },
  handoff: {
    detail: "触发 actor 播放 handoff 进阶动作，并显示蓝色交接反馈。",
    label: "交接动作",
    token: "handoff",
  },
  merge_result: {
    detail: "触发 actor 播放 merge_result 进阶动作，并显示合并反馈。",
    label: "结果合并",
    token: "merge_result",
  },
  status_changed: {
    detail: "任务状态驱动 agent 移动到对应房间，并切换常规状态动作。",
    label: "房间迁移",
    token: "status_changed",
  },
  subagent_recycled: {
    detail: "mini subagent 沿路线返回工位，表示协作结果已回收。",
    label: "subagent 回收",
    token: "subagent_recycled",
  },
  subagent_spawned: {
    detail: "mini subagent 从工位出发，沿路径前往任务房间。",
    label: "subagent 出发",
    token: "subagent_spawned",
  },
  summon_subagent: {
    detail: "触发 actor 播放 summon_subagent 进阶动作，并显示协作召唤反馈。",
    label: "召唤协作",
    token: "summon_subagent",
  },
  task_created: {
    detail: "地图在入口队列显示新任务反馈。",
    label: "新任务入场",
    token: "task_created",
  },
};

const candidateStatusWeight: Record<TaskStatus, number> = {
  blocked: 8,
  running: 7,
  verifying: 6,
  planning: 5,
  queued: 4,
  done: 0,
};

interface TaskRecommendation {
  reasons: string[];
  score: number;
  task: TaskCard;
}

const tokenize = (value?: string | null) =>
  (value ?? "")
    .toLowerCase()
    .split(/[^a-z0-9\u4e00-\u9fa5]+/u)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !/^\d+$/.test(token));

const unique = (values: string[]) => Array.from(new Set(values));

const addReason = (reasons: string[], reason: string) => {
  if (!reasons.includes(reason)) {
    reasons.push(reason);
  }
};

const getTaskSearchText = (task: TaskCard) =>
  `${task.title} ${task.details} ${task.status}`.toLowerCase();

const getSourceReason = (agent: AgentSession) => {
  if (agent.source === "codex") {
    return "命中 Codex";
  }

  if (agent.source === "claude") {
    return "命中 Claude";
  }

  return "来源相关";
};

const getDisplayName = (
  agent: AgentSession | undefined,
  isPrivacyModeEnabled: boolean,
) => {
  if (!agent) {
    return "Unassigned";
  }

  if (!agent.isReal) {
    return agent.displayName;
  }

  return isPrivacyModeEnabled ? "真实会话" : agent.displayName.split(" #")[0];
};

const isMonitorTask = (task: TaskCard) =>
  /codex|claude|进程|监控|会话|隐私|tauri|rust/i.test(
    `${task.title} ${task.details}`,
  );

const getTaskRecommendations = ({
  agent,
  isPrivacyModeEnabled,
  tasks,
}: {
  agent: AgentSession;
  isPrivacyModeEnabled: boolean;
  tasks: TaskCard[];
}): TaskRecommendation[] => {
  const signals = unique([
    ...tokenize(agent.workspaceLabel),
    ...tokenize(agent.windowLabel),
    ...tokenize(agent.taskSourceLabel),
    ...tokenize(agent.displayName),
    agent.source,
  ]);
  const workspaceReason = isPrivacyModeEnabled
    ? "同工作区"
    : `同工作区 ${agent.workspaceLabel}`;

  return tasks
    .map((task) => {
      const reasons: string[] = [];
      const taskText = getTaskSearchText(task);
      const matchedSignals = signals.filter((signal) =>
        taskText.includes(signal),
      );
      const hasSourceMatch = taskText.includes(agent.source);
      let score = candidateStatusWeight[task.status];

      if (agent.workspaceLabel && task.status !== "done") {
        score += 8;
        addReason(reasons, workspaceReason);
      }

      if (matchedSignals.length > 0) {
        score += matchedSignals.length * 10;
        addReason(
          reasons,
          hasSourceMatch ? getSourceReason(agent) : "来源关键词",
        );
      }

      if (isMonitorTask(task)) {
        score += agent.source === "simulated" ? 3 : 12;
        addReason(reasons, "监控类任务");
      }

      if (task.assigneeAgentId === "agent-monitor-wall") {
        score += 7;
        addReason(reasons, "Monitor Wall");
      }

      if (task.status === "done") {
        score -= 8;
      }

      return { reasons, score, task };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);
};

const formatTimestamp = (value: string) => {
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

const getActorLabel = (event: SceneEvent, agents: AgentSession[]) => {
  const actor = agents.find((agent) => agent.id === event.actorId);

  if (actor?.isReal) {
    return actor.displayName.split(" #")[0];
  }

  if (actor) {
    return actor.displayName;
  }

  if (event.actorId?.startsWith("real-agent-")) {
    return "真实会话";
  }

  return event.actorId ?? "room";
};

function MapActionTrace({
  agents,
  emptyLabel,
  events,
  onFocusEvent,
}: {
  agents: AgentSession[];
  emptyLabel: string;
  events: SceneEvent[];
  onFocusEvent: (eventId: string) => void;
}) {
  const mapEvents = events
    .map((event) => ({
      descriptor: mapActionByEventType[event.type],
      event,
    }))
    .filter(({ descriptor }) => Boolean(descriptor))
    .slice(0, 5);

  return (
    <div className="map-action-trace" aria-label="Map action source">
      <div className="map-action-header">
        <span>地图动作</span>
        <small>事件驱动</small>
      </div>
      {mapEvents.length > 0 ? (
        mapEvents.map(({ descriptor, event }) => (
          <button
            className="map-action-item"
            key={event.id}
            onClick={() => onFocusEvent(event.id)}
            title="定位地图动作"
            type="button"
          >
            <div className="map-action-meta">
              <code>{descriptor.token}</code>
              <time>{event.createdAt}</time>
            </div>
            <strong>{descriptor.label}</strong>
            <p>{descriptor.detail}</p>
            <small>actor · {getActorLabel(event, agents)}</small>
          </button>
        ))
      ) : (
        <div className="map-action-empty">{emptyLabel}</div>
      )}
    </div>
  );
}

function RealAgentDetails({
  agent,
  agents,
  boundTask,
  onBindTask,
  onClearTaskBinding,
  onFocusEvent,
  events,
  onFocusAgent,
  isPrivacyModeEnabled,
  recommendedTasks,
  selectedTaskId,
}: {
  agent: AgentSession;
  agents: AgentSession[];
  boundTask?: TaskCard;
  events: SceneEvent[];
  onBindTask: (agentId: string, taskId: string) => void;
  onClearTaskBinding: (agentId: string) => void;
  onFocusEvent: (eventId: string) => void;
  onFocusAgent: (agentId: string) => void;
  isPrivacyModeEnabled: boolean;
  recommendedTasks: TaskRecommendation[];
  selectedTaskId: string;
}) {
  const presence = agent.presenceStatus ?? "live";
  const sourceLabel =
    agent.taskSourceLabel ??
    agent.workspaceLabel ??
    agent.windowLabel ??
    agent.role;
  const summary = isPrivacyModeEnabled
    ? "隐私模式已隐藏窗口、工作区、任务来源和 PID。"
    : agent.role;
  const displayName = getDisplayName(agent, isPrivacyModeEnabled);
  const visibleRecommendations =
    boundTask &&
    !recommendedTasks.some(({ task }) => task.id === boundTask.id)
      ? [
          {
            reasons: ["当前绑定"],
            score: Number.MAX_SAFE_INTEGER,
            task: boundTask,
          },
          ...recommendedTasks,
        ]
      : recommendedTasks;
  const detailRows = [
    {
      icon: Link2,
      label: "绑定",
      value: boundTask?.title ?? "未绑定",
    },
    {
      icon: Monitor,
      label: "窗口",
      value: isPrivacyModeEnabled
        ? "已隐藏"
        : (agent.windowLabel ?? "未识别"),
    },
    {
      icon: FolderKanban,
      label: "工作区",
      value: isPrivacyModeEnabled
        ? "已隐藏"
        : (agent.workspaceLabel ?? "未识别"),
    },
    {
      icon: Workflow,
      label: "任务来源",
      value: isPrivacyModeEnabled ? "已隐藏" : sourceLabel,
    },
    {
      icon: Cpu,
      label: "PID",
      value: isPrivacyModeEnabled ? "已隐藏" : (agent.pid?.toString() ?? "-"),
    },
    {
      icon: Radar,
      label: "presence",
      value: presenceLabel[presence],
    },
    {
      icon: TimerReset,
      label: "最近发现",
      value: formatTimestamp(agent.lastSeenAt),
    },
  ];

  return (
    <section className="details-panel" aria-label="Agent session details">
      <div className="panel-header">
        <div>
          <span className="eyebrow">Session</span>
          <h2>{displayName}</h2>
        </div>
        <div className="session-actions">
          {boundTask ? (
            <button
              className="icon-button"
              onClick={() => onClearTaskBinding(agent.id)}
              title="解除任务绑定"
              type="button"
            >
              <Unlink2 size={17} aria-hidden="true" />
            </button>
          ) : null}
          <button
            className="icon-button"
            onClick={() => onFocusAgent(agent.id)}
            title="定位地图"
            type="button"
          >
            <LocateFixed size={17} aria-hidden="true" />
          </button>
          <span className={`status-badge presence-badge presence-${presence}`}>
            {presenceLabel[presence]}
          </span>
        </div>
      </div>
      <p className="task-detail-copy">{summary}</p>
      <div className="agent-detail-grid">
        {detailRows.map(({ icon: Icon, label, value }) => (
          <div key={label}>
            <Icon size={15} aria-hidden="true" />
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <MapActionTrace
        agents={agents}
        emptyLabel="暂无真实会话地图动作"
        events={events}
        onFocusEvent={onFocusEvent}
      />
      <div className="session-candidates" aria-label="Candidate tasks">
        <div className="session-candidates-header">
          <span>候选任务</span>
          <small>{boundTask ? "已绑定" : "点击绑定"}</small>
        </div>
        {visibleRecommendations.length > 0 ? (
          visibleRecommendations.map(({ reasons, task }) => (
            <button
              className={[
                "session-candidate",
                selectedTaskId === task.id ? "is-selected" : "",
                boundTask?.id === task.id ? "is-bound" : "",
              ].join(" ")}
              key={task.id}
              onClick={() => onBindTask(agent.id, task.id)}
              type="button"
              title={boundTask?.id === task.id ? "已绑定任务" : "绑定任务"}
            >
              <span className="session-candidate-title">
                <Link2 size={14} aria-hidden="true" />
                <strong>{task.title}</strong>
              </span>
              <span className="session-candidate-meta">
                {taskStatusLabel[task.status]} · {task.progress}%
              </span>
              <small>
                {boundTask?.id === task.id ? "已绑定 · " : ""}
                {reasons.slice(0, 2).join(" · ")}
              </small>
            </button>
          ))
        ) : (
          <div className="session-candidate-empty">暂无候选任务</div>
        )}
      </div>
    </section>
  );
}

export function TaskDetails() {
  const { selectedTaskId, selectedAgentId, tasks, agents, events, preferences } =
    useAgentWorldStore((state) => state);
  const bindRealAgentToTask = useAgentWorldStore(
    (state) => state.bindRealAgentToTask,
  );
  const clearRealAgentTaskBinding = useAgentWorldStore(
    (state) => state.clearRealAgentTaskBinding,
  );
  const focusAgent = useAgentWorldStore((state) => state.focusAgent);
  const focusSceneEvent = useAgentWorldStore((state) => state.focusSceneEvent);
  const task = tasks.find((item) => item.id === selectedTaskId);
  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId);
  const assignee = agents.find((agent) => agent.id === task?.assigneeAgentId);
  const taskEvents = events.filter((event) => task?.eventIds.includes(event.id));
  const selectedAgentEvents = selectedAgent
    ? events.filter((event) => event.actorId === selectedAgent.id)
    : [];
  const selectedRealAgentBoundTask = selectedAgent?.isReal
    ? tasks.find(
        (item) =>
          item.id === selectedAgent.currentTaskId ||
          item.assigneeAgentId === selectedAgent.id,
      )
    : undefined;

  if (selectedAgent?.isReal) {
    return (
      <RealAgentDetails
        agent={selectedAgent}
        agents={agents}
        boundTask={selectedRealAgentBoundTask}
        events={selectedAgentEvents}
        onBindTask={bindRealAgentToTask}
        onClearTaskBinding={clearRealAgentTaskBinding}
        onFocusEvent={focusSceneEvent}
        onFocusAgent={focusAgent}
        isPrivacyModeEnabled={preferences.isPrivacyModeEnabled}
        recommendedTasks={getTaskRecommendations({
          agent: selectedAgent,
          isPrivacyModeEnabled: preferences.isPrivacyModeEnabled,
          tasks,
        })}
        selectedTaskId={selectedTaskId}
      />
    );
  }

  if (!task) {
    return (
      <section className="details-panel">
        <div className="empty-state">暂无选中任务</div>
      </section>
    );
  }

  return (
    <section className="details-panel" aria-label="Task details">
      <div className="panel-header">
        <div>
          <span className="eyebrow">Detail</span>
          <h2>{task.title}</h2>
        </div>
        <span className={`status-badge status-${task.status}`}>{task.status}</span>
      </div>
      <p className="task-detail-copy">{task.details}</p>
      <div className="detail-metrics">
        <div>
          <UserRound size={16} aria-hidden="true" />
          <span>{getDisplayName(assignee, preferences.isPrivacyModeEnabled)}</span>
        </div>
        <div>
          <GitBranch size={16} aria-hidden="true" />
          <span>{task.subagentIds.length} subagent</span>
        </div>
        <div>
          <ListChecks size={16} aria-hidden="true" />
          <span>{task.progress}%</span>
        </div>
      </div>
      <MapActionTrace
        agents={agents}
        emptyLabel="暂无地图动作事件"
        events={taskEvents}
        onFocusEvent={focusSceneEvent}
      />
      <ol className="event-list">
        {taskEvents.map((event) => (
          <li key={event.id}>
            <time>{event.createdAt}</time>
            <span>{event.message}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
