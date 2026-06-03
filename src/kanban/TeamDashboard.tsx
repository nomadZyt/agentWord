import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Cpu,
  ExternalLink,
  PlayCircle,
  RadioTower,
  UsersRound,
} from "lucide-react";
import { focusAgentWindow } from "../monitor/windowNavigation";
import { useAgentWorldStore } from "../store/useAgentWorldStore";
import { TaskDetails } from "./TaskDetails";
import { buildTeamDashboardViewModel } from "./teamDashboardModel";
import type {
  ActivityFeedItem,
  TeamCardView,
  TeamDashboardSummary,
  TeamSourceBreakdown,
} from "./teamDashboardModel";

type TeamCardFilter = "all" | "real" | "demo" | "blocked";

const toneClass = (tone: string) => `tone-${tone}`;

const sourceIconClass = (sourceId: string) => {
  if (sourceId === "codex") {
    return "source-codex";
  }

  if (sourceId === "claude") {
    return "source-claude";
  }

  return "source-mixed";
};

function SummaryStrip({ summary }: { summary: TeamDashboardSummary }) {
  const items = [
    {
      icon: UsersRound,
      label: "Active Teams",
      value: summary.activeTasks,
    },
    {
      icon: PlayCircle,
      label: "Running",
      value: summary.runningTasks,
    },
    {
      icon: RadioTower,
      label: "Active Sessions",
      tone: "good",
      value: summary.activeRealSessions,
    },
    {
      icon: AlertTriangle,
      label: "Blocked",
      value: summary.blockedTasks,
      tone: "danger",
    },
    {
      icon: Clock3,
      label: "Waiting",
      value: summary.waitingTasks,
      tone: "warning",
    },
  ];

  return (
    <div className="team-summary-grid" aria-label="Live Overview">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <div className={item.tone ? toneClass(item.tone) : ""} key={item.label}>
            <Icon size={18} aria-hidden="true" />
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function SourceBreakdown({ sources }: { sources: TeamSourceBreakdown[] }) {
  const visibleSources = sources.filter(
    (source) => source.taskCount > 0 || source.agentCount > 0 || source.processCount > 0,
  );

  if (visibleSources.length === 0) {
    return <div className="team-empty-state">No sources yet</div>;
  }

  return (
    <div className="team-source-grid" aria-label="Sources">
      {visibleSources.slice(0, 3).map((source) => (
        <div className="team-source-pill" key={source.id}>
          <span className={`source-icon ${sourceIconClass(source.id)}`}>
            <RadioTower size={13} aria-hidden="true" />
          </span>
          <span>{source.label}</span>
          <strong>
            {source.processCount > 0
              ? `${source.processCount} sessions`
              : source.taskCount || source.agentCount}
          </strong>
        </div>
      ))}
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <span className="team-progress" aria-hidden="true">
      <span style={{ width: `${value}%` }} />
    </span>
  );
}

function TeamCard({
  card,
  lastWindowMessage,
  onOpenWindow,
  onSelectTask,
}: {
  card: TeamCardView;
  lastWindowMessage?: string;
  onOpenWindow: (card: TeamCardView) => void;
  onSelectTask: (taskId: string) => void;
}) {
  const className = [
    "team-card",
    card.isSelected ? "is-selected" : "",
    card.isBlocked ? "is-blocked" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={className}>
      <button
        className="team-card-main"
        onClick={() => onSelectTask(card.taskId)}
        type="button"
      >
        <div className="team-card-title">
          <span className={`source-icon ${sourceIconClass(card.sourceBadge.toLowerCase())}`}>
            <UsersRound size={13} aria-hidden="true" />
          </span>
          <strong>{card.title}</strong>
          <span className={`team-status-chip status-${card.status}`}>
            {card.statusLabel}
          </span>
        </div>
        <div className="team-card-progress">
          <ProgressBar value={card.progress} />
          <strong>{card.progress}%</strong>
        </div>
        <div className="team-card-meta">
          <span>{card.sourceBadge}</span>
          <span>{card.assignee}</span>
          <span>{card.subagentCount} subagents</span>
        </div>
        {lastWindowMessage ? (
          <p className="window-action-message">{lastWindowMessage}</p>
        ) : null}
      </button>
      <button
        className="open-window-button"
        disabled={!card.canOpenWindow || !card.navigationRequest}
        onClick={(event) => {
          event.stopPropagation();
          onOpenWindow(card);
        }}
        title={card.windowActionDetail}
        type="button"
      >
        <ExternalLink size={14} aria-hidden="true" />
        <span>{card.windowActionLabel}</span>
      </button>
    </article>
  );
}

function ActivityFeed({
  activity,
  onFocusEvent,
}: {
  activity: ActivityFeedItem[];
  onFocusEvent: (eventId: string) => void;
}) {
  if (activity.length === 0) {
    return <div className="team-empty-state">No activity yet</div>;
  }

  return (
    <ol className="team-activity-list" aria-label="Activity feed">
      {activity.slice(0, 5).map((item) => (
        <li className={item.isSelected ? "is-selected" : ""} key={item.id}>
          <button
            aria-current={item.isSelected ? "true" : undefined}
            onClick={() => onFocusEvent(item.eventId)}
            title={item.taskTitle ? `Focus ${item.taskTitle}` : item.label}
            type="button"
          >
            <time>{item.createdAtLabel}</time>
            <span className={toneClass(item.tone)}>{item.message}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

export function TeamDashboard() {
  const agents = useAgentWorldStore((state) => state.agents);
  const events = useAgentWorldStore((state) => state.events);
  const preferences = useAgentWorldStore((state) => state.preferences);
  const processScan = useAgentWorldStore((state) => state.processScan);
  const processScanError = useAgentWorldStore(
    (state) => state.processScanError,
  );
  const processScanStatus = useAgentWorldStore(
    (state) => state.processScanStatus,
  );
  const selectedTaskId = useAgentWorldStore((state) => state.selectedTaskId);
  const tasks = useAgentWorldStore((state) => state.tasks);
  const focusSceneEvent = useAgentWorldStore((state) => state.focusSceneEvent);
  const selectTask = useAgentWorldStore((state) => state.selectTask);
  const [teamFilter, setTeamFilter] = useState<TeamCardFilter>("all");
  const [windowMessages, setWindowMessages] = useState<Record<string, string>>(
    {},
  );
  const model = buildTeamDashboardViewModel({
    agents,
    events,
    preferences,
    processScan,
    processScanError,
    processScanStatus,
    selectedTaskId,
    tasks,
  });
  const visibleCards = model.cards.filter((card) => {
    if (teamFilter === "real") {
      return card.isRealBound;
    }

    if (teamFilter === "demo") {
      return card.isDemo;
    }

    if (teamFilter === "blocked") {
      return card.isBlocked;
    }

    return true;
  });
  const cardEmptyLabel =
    model.cards.length === 0
      ? model.emptyStateLabel
      : "No team cards match the selected filter.";

  const handleOpenWindow = async (card: TeamCardView) => {
    if (!card.navigationRequest) {
      return;
    }

    setWindowMessages((current) => ({
      ...current,
      [card.taskId]: "Opening work window...",
    }));

    try {
      const result = await focusAgentWindow(card.navigationRequest);
      setWindowMessages((current) => ({
        ...current,
        [card.taskId]: result.message,
      }));
    } catch (error) {
      setWindowMessages((current) => ({
        ...current,
        [card.taskId]: error instanceof Error ? error.message : String(error),
      }));
    }
  };

  return (
    <section className="board-panel team-dashboard-panel" aria-label="Team Dashboard">
      <div className="team-dashboard-header">
        <div>
          <span className="eyebrow">Team Dashboard</span>
          <h2>Team Dashboard</h2>
        </div>
      </div>

      <div className="team-dashboard-scroll">
        <section className="team-section" aria-label="Live Overview">
          <h3>Live Overview</h3>
          <SummaryStrip summary={model.summary} />
        </section>

        <section className="team-section" aria-label="Sources">
          <h3>Sources</h3>
          <SourceBreakdown sources={model.sources} />
        </section>

        <section className={`team-health-card ${toneClass(model.health.tone)}`}>
          <div>
            <h3>System Health</h3>
            <p>{model.health.detail}</p>
          </div>
          {model.health.tone === "good" ? (
            <CheckCircle2 size={24} aria-hidden="true" />
          ) : (
            <Cpu size={24} aria-hidden="true" />
          )}
        </section>

        <section className="team-section team-card-section" aria-label="Team Cards">
          <div className="team-section-heading">
            <h3>Team Cards</h3>
            <select
              aria-label="Team filter"
              onChange={(event) =>
                setTeamFilter(event.target.value as TeamCardFilter)
              }
              value={teamFilter}
            >
              <option value="all">All Teams</option>
              <option value="real">Real</option>
              <option value="demo">Demo</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
          {visibleCards.length === 0 ? (
            <div className="team-empty-state">{cardEmptyLabel}</div>
          ) : (
            <div className="team-card-list">
              {visibleCards.map((card) => (
                <TeamCard
                  card={card}
                  key={card.id}
                  lastWindowMessage={windowMessages[card.taskId]}
                  onOpenWindow={handleOpenWindow}
                  onSelectTask={selectTask}
                />
              ))}
            </div>
          )}
        </section>

        <section className="team-section" aria-label="Activity Feed">
          <div className="team-section-heading">
            <h3>Activity Feed</h3>
            <Activity size={16} aria-hidden="true" />
          </div>
          <ActivityFeed activity={model.activity} onFocusEvent={focusSceneEvent} />
        </section>

        <section className="team-detail-section" aria-label="Selected detail">
          <h3>Selected Detail</h3>
          <TaskDetails />
        </section>
      </div>
    </section>
  );
}
