import type {
  AgentProcessInfo,
  AgentProcessKind,
  AgentProcessScan,
  AgentSession,
  RealAgentEventRuleMode,
  SceneEvent,
} from "../types/domain";

type RealAdvancedEventType = Extract<
  SceneEvent["type"],
  "handoff" | "summon_subagent" | "merge_result"
>;
type RealLifecycleEventType = Extract<
  SceneEvent["type"],
  "agent_seen" | "handoff" | "merge_result" | "status_changed" | "summon_subagent"
>;

type RealAgentLifecycleTrigger = "context_changed" | "enter" | "retiring";

interface RealAgentEventRulePreset {
  description: string;
  enterByProcessKind: Partial<Record<AgentProcessKind, RealAdvancedEventType>>;
  id: RealAgentEventRuleMode;
  label: string;
  onContextChanged?: RealAdvancedEventType;
  onRetiring?: RealAdvancedEventType;
}

export const realAgentEventRulePresets: RealAgentEventRulePreset[] = [
  {
    description: "新增 / 恢复进入实时会话区；只有已绑定任务时才触发交接或 subagent。",
    enterByProcessKind: {
      claude_cli: "handoff",
      codex_app: "handoff",
      codex_app_server: "summon_subagent",
      codex_cli: "handoff",
    },
    id: "balanced",
    label: "默认",
    onContextChanged: "handoff",
    onRetiring: "merge_result",
  },
  {
    description: "减少上下文变化事件，只保留实时会话区进场和退场反馈。",
    enterByProcessKind: {
      claude_cli: "handoff",
      codex_app: "handoff",
      codex_app_server: "summon_subagent",
      codex_cli: "handoff",
    },
    id: "quiet",
    label: "安静",
    onRetiring: "merge_result",
  },
  {
    description: "已绑定任务时，把 Codex CLI / 服务更偏向协作召唤。",
    enterByProcessKind: {
      claude_cli: "handoff",
      codex_app: "handoff",
      codex_app_server: "summon_subagent",
      codex_cli: "summon_subagent",
    },
    id: "subagent-heavy",
    label: "协作+",
    onContextChanged: "handoff",
    onRetiring: "merge_result",
  },
];

export const getRealAgentEventRulePreset = (
  mode: RealAgentEventRuleMode,
) =>
  realAgentEventRulePresets.find((preset) => preset.id === mode) ??
  realAgentEventRulePresets[0];

export const getRealAgentId = (process: AgentProcessInfo) =>
  `real-agent-${process.source}-${process.kind}-${process.pid}`;

const getAgentDisplayName = (agent: AgentSession) =>
  agent.displayName.split(" #")[0];

const realLifecycleEventMessages: Record<
  RealLifecycleEventType,
  Record<RealAgentLifecycleTrigger, (agent: AgentSession) => string>
> = {
  agent_seen: {
    context_changed: (agent) =>
      `${getAgentDisplayName(agent)}：真实会话区信息已更新，可继续绑定到任务桌。`,
    enter: (agent) =>
      `${getAgentDisplayName(agent)}：真实会话进入实时会话区，可手动绑定到任务桌。`,
    retiring: (agent) =>
      `${getAgentDisplayName(agent)}：真实会话区状态已更新。`,
  },
  handoff: {
    context_changed: (agent) =>
      `${getAgentDisplayName(agent)}：真实会话上下文变化，触发交接动作。`,
    enter: (agent) =>
      `${getAgentDisplayName(agent)}：真实会话进入监控，触发交接动作。`,
    retiring: (agent) =>
      `${getAgentDisplayName(agent)}：真实会话退场，触发交接收尾动作。`,
  },
  merge_result: {
    context_changed: (agent) =>
      `${getAgentDisplayName(agent)}：真实会话上下文变化，触发结果合并动作。`,
    enter: (agent) =>
      `${getAgentDisplayName(agent)}：真实会话进入监控，触发结果合并动作。`,
    retiring: (agent) =>
      `${getAgentDisplayName(agent)}：真实会话退场，触发结果合并动作。`,
  },
  summon_subagent: {
    context_changed: (agent) =>
      `${getAgentDisplayName(agent)}：真实会话上下文变化，触发 subagent 协作动作。`,
    enter: (agent) =>
      `${getAgentDisplayName(agent)}：已绑定任务桌，触发 subagent 协作动作。`,
    retiring: (agent) =>
      `${getAgentDisplayName(agent)}：真实协作会话退场，触发 subagent 回收动作。`,
  },
  status_changed: {
    context_changed: (agent) =>
      `${getAgentDisplayName(agent)}：真实会话状态更新，尚未绑定任务桌。`,
    enter: (agent) =>
      `${getAgentDisplayName(agent)}：真实会话进入监控。`,
    retiring: (agent) =>
      `${getAgentDisplayName(agent)}：真实会话离开实时会话区，等待下次扫描确认。`,
  },
};

const hasRealAgentContextChanged = (
  previousAgent: AgentSession,
  process: AgentProcessInfo,
) =>
  previousAgent.taskSourceLabel !== process.taskSourceLabel ||
  previousAgent.windowLabel !== process.windowLabel ||
  previousAgent.workspaceLabel !== process.workspaceLabel;

const createLifecycleEvent = ({
  agent,
  batchId,
  createdAt,
  eventIndex,
  eventType,
  trigger,
}: {
  agent: AgentSession;
  batchId: number;
  createdAt: string;
  eventIndex: number;
  eventType: RealLifecycleEventType;
  trigger: RealAgentLifecycleTrigger;
}): SceneEvent => ({
  actorId: agent.id,
  createdAt,
  id: `event-real-${batchId}-${eventIndex}-${eventType}-${agent.id}`,
  message: realLifecycleEventMessages[eventType][trigger](agent),
  type: eventType,
});

const getLifecycleEventType = (
  presetEventType: RealAdvancedEventType | undefined,
  trigger: RealAgentLifecycleTrigger,
  agent: AgentSession,
): RealLifecycleEventType | undefined => {
  if (!presetEventType) {
    return undefined;
  }

  if (agent.currentTaskId) {
    return presetEventType;
  }

  return trigger === "retiring" ? "status_changed" : "agent_seen";
};

export const getRealAgentLifecycleEvents = (
  processScan: AgentProcessScan,
  previousAgents: AgentSession[],
  nextAgents: AgentSession[],
  eventLogLimit: number,
  ruleMode: RealAgentEventRuleMode,
) => {
  const preset = getRealAgentEventRulePreset(ruleMode);
  const previousRealAgents = new Map(
    previousAgents
      .filter((agent) => agent.isReal)
      .map((agent) => [agent.id, agent] as const),
  );
  const nextRealAgents = new Map(
    nextAgents
      .filter((agent) => agent.isReal)
      .map((agent) => [agent.id, agent] as const),
  );
  const createdAt = new Date().toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const batchId = Date.now();
  const events: SceneEvent[] = [];

  processScan.processes.forEach((process) => {
    const agentId = getRealAgentId(process);
    const previousAgent = previousRealAgents.get(agentId);
    const nextAgent = nextRealAgents.get(agentId);

    if (!nextAgent) {
      return;
    }

    const isNewOrRecovered =
      !previousAgent || previousAgent.presenceStatus !== "live";
    const presetEventType = isNewOrRecovered
      ? preset.enterByProcessKind[process.kind]
      : hasRealAgentContextChanged(previousAgent, process)
        ? preset.onContextChanged
        : undefined;
    const trigger: RealAgentLifecycleTrigger = isNewOrRecovered
      ? "enter"
      : "context_changed";
    const eventType = getLifecycleEventType(presetEventType, trigger, nextAgent);

    if (!eventType) {
      return;
    }

    events.push(
      createLifecycleEvent({
        agent: nextAgent,
        batchId,
        createdAt,
        eventIndex: events.length + 1,
        eventType,
        trigger,
      }),
    );
  });

  if (!preset.onRetiring) {
    return events.slice(0, eventLogLimit);
  }

  const retiringPresetEventType = preset.onRetiring;

  nextAgents
    .filter(
      (agent) =>
        agent.isReal &&
        (agent.presenceStatus === "stale" || agent.presenceStatus === "gone"),
    )
    .forEach((agent) => {
      const previousAgent = previousRealAgents.get(agent.id);

      if (
        !previousAgent ||
        previousAgent.presenceStatus === agent.presenceStatus
      ) {
        return;
      }

      const eventType = getLifecycleEventType(
        retiringPresetEventType,
        "retiring",
        agent,
      );

      if (!eventType) {
        return;
      }

      events.push(
        createLifecycleEvent({
          agent,
          batchId,
          createdAt,
          eventIndex: events.length + 1,
          eventType,
          trigger: "retiring",
        }),
      );
    });

  return events.slice(0, eventLogLimit);
};
