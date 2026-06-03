import { useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock3,
  Cpu,
  Database,
  EyeOff,
  Gauge,
  GitBranch,
  Leaf,
  Play,
  RefreshCw,
  SlidersHorizontal,
  UsersRound,
} from "lucide-react";
import { realAgentEventRulePresets } from "./realAgentEventRules";
import { useAgentWorldStore } from "../store/useAgentWorldStore";
import type {
  AgentSession,
  RealAgentEventRuleMode,
  SceneDensityMode,
} from "../types/domain";

const presenceLabel: Record<
  NonNullable<AgentSession["presenceStatus"]>,
  string
> = {
  gone: "gone",
  live: "live",
  stale: "stale",
};

const getRealAgentSourceLabel = (agent: AgentSession) =>
  agent.workspaceLabel ??
  agent.windowLabel ??
  agent.taskSourceLabel ??
  agent.role;

const getAgentIsLiveWorkerSession = (agent: AgentSession) =>
  agent.isReal &&
  (agent.presenceStatus ?? "live") === "live" &&
  (agent.processKind === "claude_cli" ||
    agent.processKind === "codex_app_server" ||
    agent.processKind === "codex_cli");

const sceneDensityModeLabels: Record<SceneDensityMode, string> = {
  live: "live flow",
  readability: "6 + mini",
  stress12: "12 agents",
  stress24: "24 agents",
  stress30: "30 agents",
};

const stressAgentCountByMode: Partial<Record<SceneDensityMode, number>> = {
  stress12: 12,
  stress24: 24,
  stress30: 30,
};

export function MonitorStatus() {
  const agents = useAgentWorldStore((state) => state.agents);
  const tasks = useAgentWorldStore((state) => state.tasks);
  const preferences = useAgentWorldStore((state) => state.preferences);
  const processScan = useAgentWorldStore((state) => state.processScan);
  const processScanError = useAgentWorldStore(
    (state) => state.processScanError,
  );
  const processScanStatus = useAgentWorldStore(
    (state) => state.processScanStatus,
  );
  const snapshotLastSavedAt = useAgentWorldStore(
    (state) => state.snapshotLastSavedAt,
  );
  const snapshotPersistenceError = useAgentWorldStore(
    (state) => state.snapshotPersistenceError,
  );
  const snapshotRestoreStatus = useAgentWorldStore(
    (state) => state.snapshotRestoreStatus,
  );
  const snapshotSaveStatus = useAgentWorldStore(
    (state) => state.snapshotSaveStatus,
  );
  const refreshAgentProcesses = useAgentWorldStore(
    (state) => state.refreshAgentProcesses,
  );
  const events = useAgentWorldStore((state) => state.events);
  const focusSceneEvent = useAgentWorldStore((state) => state.focusSceneEvent);
  const selectedAgentId = useAgentWorldStore((state) => state.selectedAgentId);
  const selectAgent = useAgentWorldStore((state) => state.selectAgent);
  const setAppPreferences = useAgentWorldStore(
    (state) => state.setAppPreferences,
  );
  const activeTasks = tasks.filter((task) => task.status !== "done").length;
  const runningTasks = tasks.filter(
    (task) =>
      task.status === "running" ||
      task.status === "planning" ||
      task.status === "verifying",
  ).length;
  const blockedTasks = tasks.filter((task) => task.status === "blocked").length;
  const waitingTasks = tasks.filter(
    (task) => task.status === "queued" || !task.assigneeAgentId,
  ).length;
  const doneTasks = tasks.filter((task) => task.status === "done").length;
  const successRate =
    tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;
  const realAgents = agents.filter((agent) => agent.isReal);
  const selectedRealAgent = realAgents.find(
    (agent) => agent.id === selectedAgentId,
  );
  const visibleRealAgents =
    selectedRealAgent &&
    !realAgents.slice(0, 4).some((agent) => agent.id === selectedRealAgent.id)
      ? [...realAgents.slice(0, 3), selectedRealAgent]
      : realAgents.slice(0, 4);
  const staleOrGoneAgents = realAgents.filter(
    (agent) =>
      agent.presenceStatus === "stale" || agent.presenceStatus === "gone",
  ).length;
  const liveWorkerSessionCount = realAgents.filter(getAgentIsLiveWorkerSession)
    .length;
  const sourceCount = new Set(
    realAgents
      .map((agent) => getRealAgentSourceLabel(agent))
      .filter((label) => label.length > 0),
  ).size;
  const realProcessCount = processScan?.total ?? 0;
  const codexSourceCount =
    processScan?.codexCount ?? agents.filter((agent) => agent.source === "codex").length;
  const claudeSourceCount =
    processScan?.claudeCount ?? agents.filter((agent) => agent.source === "claude").length;
  const demoSourceCount = agents.filter((agent) => !agent.isReal).length;
  const mixedSourceCount = tasks.filter((task) => {
    const linkedSources = new Set(
      [task.assigneeAgentId, ...task.subagentIds]
        .map((agentId) => agents.find((agent) => agent.id === agentId)?.source)
        .filter(Boolean),
    );

    return linkedSources.size > 1;
  }).length;
  const isBrowserPreview = processScanStatus === "unavailable";
  const demoSceneAgentCount = agents.filter((agent) => !agent.isReal).length;
  const sceneAgentCount =
    stressAgentCountByMode[preferences.sceneDensityMode] ??
    demoSceneAgentCount;
  const demoRosterLabel = preferences.isDemoFlowEnabled
    ? sceneDensityModeLabels[preferences.sceneDensityMode]
    : "off";
  const processStatusLabel =
    processScanStatus === "ready"
      ? `Codex ${processScan?.codexCount ?? 0} / Claude ${processScan?.claudeCount ?? 0}`
      : processScanStatus === "scanning"
        ? "scanning"
        : processScanStatus === "unavailable"
          ? "desktop only"
          : processScanStatus === "error"
            ? "scan error"
            : processScanStatus === "disabled"
              ? "off"
              : "not scanned";
  const snapshotStatusLabel =
    snapshotRestoreStatus === "loading"
      ? "loading"
      : snapshotSaveStatus === "saving"
        ? "saving"
        : snapshotRestoreStatus === "error" || snapshotSaveStatus === "error"
          ? "save error"
          : snapshotLastSavedAt
            ? "saved"
            : snapshotRestoreStatus === "empty"
              ? "empty"
            : "ready";
  const systemHealthStatus =
    processScanError || snapshotPersistenceError
      ? "Needs Attention"
      : isBrowserPreview
        ? "Desktop App Required"
        : "All Systems Operational";

  useEffect(() => {
    if (!preferences.isProcessMonitorEnabled) {
      void refreshAgentProcesses();
      return undefined;
    }

    void refreshAgentProcesses();
    const interval = window.setInterval(() => {
      void refreshAgentProcesses();
    }, preferences.processRefreshIntervalMs);

    return () => window.clearInterval(interval);
  }, [
    preferences.isProcessMonitorEnabled,
    preferences.processRefreshIntervalMs,
    refreshAgentProcesses,
  ]);

  return (
    <aside className="monitor-panel live-monitor-panel" aria-label="Monitor status">
      <div className="live-brand">
        <div>
          <h2>agentWord</h2>
          <span>
            <span className="live-dot" />
            Live Overview
          </span>
        </div>
        <Leaf size={19} aria-hidden="true" />
      </div>
      <section className="live-card live-overview-card" aria-label="Live Overview">
        <div className="live-row">
          <span>
            <UsersRound size={16} aria-hidden="true" />
            Active Teams
          </span>
          <strong>{activeTasks}</strong>
        </div>
        <div className="live-row">
          <span>
            <Play size={16} aria-hidden="true" />
            Running
          </span>
          <strong>{runningTasks}</strong>
        </div>
        <div className="live-row is-live">
          <span>
            <Cpu size={16} aria-hidden="true" />
            Active Sessions
          </span>
          <strong>{liveWorkerSessionCount}</strong>
        </div>
        <div className="live-row is-alert">
          <span>
            <AlertTriangle size={16} aria-hidden="true" />
            Blocked
          </span>
          <strong>{blockedTasks}</strong>
        </div>
        <div className="live-row">
          <span>
            <Clock3 size={16} aria-hidden="true" />
            Waiting
          </span>
          <strong>{waitingTasks}</strong>
        </div>
        <div className="success-row">
          <span>Success Rate</span>
          <strong>{tasks.length ? `${successRate}%` : "--"}</strong>
          <div className="success-meter" aria-hidden="true">
            <span style={{ width: `${tasks.length ? successRate : 0}%` }} />
          </div>
        </div>
      </section>
      <section className="live-card source-card" aria-label="Sources">
        <h3>Sources</h3>
        <div className="source-row source-codex">
          <span>
            <Bot size={14} aria-hidden="true" />
            Codex Sessions
          </span>
          <strong>{codexSourceCount}</strong>
        </div>
        <div className="source-row source-claude">
          <span>
            <GitBranch size={14} aria-hidden="true" />
            Claude Sessions
          </span>
          <strong>{claudeSourceCount}</strong>
        </div>
        <div className="source-row source-mixed">
          <span>
            <UsersRound size={14} aria-hidden="true" />
            Mixed
          </span>
          <strong>{mixedSourceCount}</strong>
        </div>
        {preferences.isDemoFlowEnabled ? (
          <div className="source-row source-demo">
            <span>
              <Activity size={14} aria-hidden="true" />
              Demo
            </span>
            <strong>{demoSourceCount}</strong>
          </div>
        ) : null}
      </section>
      <section className="live-card health-card" aria-label="System Health">
        <div>
          <h3>System Health</h3>
          <p>{systemHealthStatus}</p>
          <small>
            {processStatusLabel} · snapshot {snapshotStatusLabel}
            {sourceCount ? ` · ${sourceCount} sources` : ""}
            {staleOrGoneAgents ? ` · ${staleOrGoneAgents} retiring` : ""}
            {sceneAgentCount ? ` · ${demoRosterLabel}` : ""}
          </small>
        </div>
        <CheckCircle2
          className={processScanError || snapshotPersistenceError ? "is-alert" : ""}
          size={24}
          aria-hidden="true"
        />
      </section>
      {processScanError || snapshotPersistenceError || isBrowserPreview ? (
        <div className="monitor-note">
          {processScanError ?? snapshotPersistenceError}
          {isBrowserPreview
            ? "浏览器预览只跑模拟场景；真实扫描与 Open Window 请打开桌面版。"
            : null}
        </div>
      ) : null}
      <section className="live-card activity-card" aria-label="Activity Feed">
        <h3>Activity Feed</h3>
        <ol className="activity-feed-list">
          {events.slice(0, 4).map((event) => (
            <li key={event.id}>
              <button
                onClick={() => focusSceneEvent(event.id)}
                type="button"
                title="定位事件"
              >
                <time>{event.createdAt}</time>
                <span>{event.message}</span>
              </button>
            </li>
          ))}
          {events.length === 0 ? <li className="activity-empty">No activity yet</li> : null}
        </ol>
      </section>
      {preferences.isPrivacyModeEnabled && realAgents.length ? (
        <div className="monitor-note">隐私模式已隐藏 PID、窗口和工作区标签。</div>
      ) : null}
      {!preferences.isPrivacyModeEnabled && realAgents.length > 0 ? (
        <section className="live-card session-card" aria-label="Real sessions">
          <h3>Live Sessions</h3>
          <ol>
            {visibleRealAgents.map((agent) => {
              const presence = agent.presenceStatus ?? "live";
              const sourceLabel = getRealAgentSourceLabel(agent);

              return (
                <li
                  className={`presence-${presence} ${selectedAgentId === agent.id ? "is-selected" : ""}`}
                  key={agent.id}
                >
                  <button type="button" onClick={() => selectAgent(agent.id)}>
                    <span>{agent.displayName}</span>
                    <small>
                      {presenceLabel[presence]}
                      {sourceLabel ? ` · ${sourceLabel}` : ""}
                    </small>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}
      <div className="monitor-settings" aria-label="基础设置">
        <button
          className={`setting-toggle ${preferences.isDemoFlowEnabled ? "is-active" : ""}`}
          type="button"
          title="模拟任务流"
          onClick={() =>
            setAppPreferences({
              isDemoFlowEnabled: !preferences.isDemoFlowEnabled,
            })
          }
        >
          <Play size={15} aria-hidden="true" />
          <span>模拟流</span>
        </button>
        <button
          className={`setting-toggle ${preferences.isProcessMonitorEnabled ? "is-active" : ""}`}
          type="button"
          title="进程监控"
          onClick={() =>
            setAppPreferences({
              isProcessMonitorEnabled: !preferences.isProcessMonitorEnabled,
            })
          }
        >
          <Gauge size={15} aria-hidden="true" />
          <span>进程</span>
        </button>
        <button
          className={`setting-toggle ${preferences.isPrivacyModeEnabled ? "is-active" : ""}`}
          type="button"
          title="隐藏进程明细"
          onClick={() =>
            setAppPreferences({
              isPrivacyModeEnabled: !preferences.isPrivacyModeEnabled,
            })
          }
        >
          <EyeOff size={15} aria-hidden="true" />
          <span>隐私</span>
        </button>
        <label className="setting-select">
          <UsersRound size={15} aria-hidden="true" />
          <span>阵容</span>
          <select
            value={preferences.sceneDensityMode}
            onChange={(event) =>
              setAppPreferences({
                sceneDensityMode: event.currentTarget
                  .value as SceneDensityMode,
              })
            }
          >
            <option value="live">live</option>
            <option value="readability">6 + mini</option>
            <option value="stress12">12</option>
            <option value="stress24">24</option>
            <option value="stress30">30</option>
          </select>
        </label>
        <label className="setting-select">
          <RefreshCw size={15} aria-hidden="true" />
          <span>刷新</span>
          <select
            disabled={!preferences.isProcessMonitorEnabled}
            value={preferences.processRefreshIntervalMs}
            onChange={(event) =>
              setAppPreferences({
                processRefreshIntervalMs: Number(event.currentTarget.value),
              })
            }
          >
            <option value={6000}>6s</option>
            <option value={12000}>12s</option>
            <option value={30000}>30s</option>
          </select>
        </label>
        <label className="setting-select">
          <SlidersHorizontal size={15} aria-hidden="true" />
          <span>规则</span>
          <select
            value={preferences.realAgentEventRuleMode}
            onChange={(event) =>
              setAppPreferences({
                realAgentEventRuleMode: event.currentTarget
                  .value as RealAgentEventRuleMode,
              })
            }
          >
            {realAgentEventRulePresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
        </label>
        <label className="setting-select">
          <Database size={15} aria-hidden="true" />
          <span>事件</span>
          <select
            value={preferences.eventLogLimit}
            onChange={(event) =>
              setAppPreferences({
                eventLogLimit: Number(event.currentTarget.value),
              })
            }
          >
            <option value={12}>12</option>
            <option value={24}>24</option>
            <option value={48}>48</option>
          </select>
        </label>
      </div>
    </aside>
  );
}
