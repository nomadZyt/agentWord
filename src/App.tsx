import { useEffect } from "react";
import {
  BarChart3,
  Bell,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Home,
  Menu,
  Monitor,
  PanelRightOpen,
  Settings,
  SquareKanban,
  UsersRound,
} from "lucide-react";
import { SceneCanvas } from "./scene/SceneCanvas";
import { TaskBoard } from "./kanban/TaskBoard";
import { MonitorStatus } from "./monitor/MonitorStatus";
import { useAgentWorldStore } from "./store/useAgentWorldStore";

const navItems = [
  { icon: Home, id: "home", label: "Home" },
  { icon: Monitor, id: "monitor", label: "Monitor" },
  { icon: UsersRound, id: "teams", label: "Teams" },
  { icon: SquareKanban, id: "tasks", label: "Tasks" },
  { icon: BarChart3, id: "reports", label: "Reports" },
  { badge: 24, icon: Bell, id: "events", label: "Events" },
  { icon: Settings, id: "settings", label: "Settings" },
];

function DemoFlowTicker() {
  const advanceDemoFlow = useAgentWorldStore((state) => state.advanceDemoFlow);
  const isDemoFlowEnabled = useAgentWorldStore(
    (state) => state.preferences.isDemoFlowEnabled,
  );
  const snapshotRestoreStatus = useAgentWorldStore(
    (state) => state.snapshotRestoreStatus,
  );

  useEffect(() => {
    if (
      !isDemoFlowEnabled ||
      snapshotRestoreStatus === "idle" ||
      snapshotRestoreStatus === "loading"
    ) {
      return undefined;
    }

    const interval = window.setInterval(advanceDemoFlow, 5200);

    return () => window.clearInterval(interval);
  }, [advanceDemoFlow, isDemoFlowEnabled, snapshotRestoreStatus]);

  return null;
}

const sceneAgentSignature = (
  agents: ReturnType<typeof useAgentWorldStore.getState>["agents"],
) =>
  agents
    .filter((agent) => !agent.isReal)
    .map(
      (agent) =>
        `${agent.id}:${agent.status}:${agent.currentTaskId ?? ""}:${agent.roomId}:${agent.lastSeenAt}:${agent.scene.position.x},${agent.scene.position.y},${agent.scene.scale}`,
    )
    .join("|");

function SnapshotPersistenceBridge() {
  const hydratePersistentSnapshot = useAgentWorldStore(
    (state) => state.hydratePersistentSnapshot,
  );

  useEffect(() => {
    void hydratePersistentSnapshot();
  }, [hydratePersistentSnapshot]);

  useEffect(() => {
    let saveTimer: number | undefined;

    const unsubscribe = useAgentWorldStore.subscribe((state, previousState) => {
      const canPersist =
        state.snapshotRestoreStatus !== "idle" &&
        state.snapshotRestoreStatus !== "loading";
      const didSnapshotDataChange =
        state.tasks !== previousState.tasks ||
        state.events !== previousState.events ||
        state.selectedTaskId !== previousState.selectedTaskId ||
        state.selectedAgentId !== previousState.selectedAgentId ||
        state.selectedRoomId !== previousState.selectedRoomId ||
        state.demoFlowTick !== previousState.demoFlowTick ||
        sceneAgentSignature(state.agents) !==
          sceneAgentSignature(previousState.agents);

      if (!canPersist || !didSnapshotDataChange) {
        return;
      }

      if (saveTimer) {
        window.clearTimeout(saveTimer);
      }

      saveTimer = window.setTimeout(() => {
        void useAgentWorldStore.getState().persistAgentWorldSnapshot();
      }, 700);
    });

    return () => {
      if (saveTimer) {
        window.clearTimeout(saveTimer);
      }
      unsubscribe();
    };
  }, []);

  return null;
}

function LeftNavigationRail({
  isCollapsed,
  onToggleLeft,
}: {
  isCollapsed: boolean;
  onToggleLeft: () => void;
}) {
  return (
    <nav className="app-nav-rail" aria-label="Primary navigation">
      <button className="nav-menu-button" type="button" title="菜单">
        <Menu size={21} aria-hidden="true" />
      </button>
      <div className="nav-items">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === "monitor";

          return (
            <button
              className={`nav-item ${isActive ? "is-active" : ""}`}
              key={item.id}
              type="button"
              title={item.label}
            >
              <span className="nav-icon-wrap">
                <Icon size={20} aria-hidden="true" />
                {item.badge ? <strong>{item.badge}</strong> : null}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
      <button
        className="nav-collapse-button"
        onClick={onToggleLeft}
        type="button"
        title={isCollapsed ? "展开左侧面板" : "收起左侧面板"}
      >
        {isCollapsed ? (
          <ChevronsRight size={20} aria-hidden="true" />
        ) : (
          <ChevronsLeft size={20} aria-hidden="true" />
        )}
      </button>
    </nav>
  );
}

function RightDashboardRail({
  activeTeams,
  blockedTeams,
  onExpand,
}: {
  activeTeams: number;
  blockedTeams: number;
  onExpand: () => void;
}) {
  return (
    <aside className="right-dashboard-rail" aria-label="Collapsed dashboard">
      <button
        className="right-rail-toggle"
        onClick={onExpand}
        type="button"
        title="展开 Team Dashboard"
      >
        <PanelRightOpen size={20} aria-hidden="true" />
      </button>
      <div className="rail-metric">
        <strong>{activeTeams}</strong>
        <span>teams</span>
      </div>
      <div className={`rail-metric ${blockedTeams ? "is-alert" : ""}`}>
        <strong>{blockedTeams}</strong>
        <span>blocked</span>
      </div>
      <ChevronDown size={18} aria-hidden="true" />
    </aside>
  );
}

export default function App() {
  const preferences = useAgentWorldStore((state) => state.preferences);
  const setAppPreferences = useAgentWorldStore(
    (state) => state.setAppPreferences,
  );
  const tasks = useAgentWorldStore((state) => state.tasks);
  const activeTeams = tasks.filter((task) => task.status !== "done").length;
  const blockedTeams = tasks.filter((task) => task.status === "blocked").length;
  const shellClassName = [
    "app-shell",
    preferences.isLeftPanelCollapsed ? "is-left-collapsed" : "",
    preferences.isRightPanelCollapsed ? "is-right-collapsed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={shellClassName}>
      <SnapshotPersistenceBridge />
      <DemoFlowTicker />
      <LeftNavigationRail
        isCollapsed={preferences.isLeftPanelCollapsed}
        onToggleLeft={() =>
          setAppPreferences({
            isLeftPanelCollapsed: !preferences.isLeftPanelCollapsed,
          })
        }
      />
      <div className="left-column">
        <MonitorStatus />
      </div>
      <main className="center-column">
        <SceneCanvas />
      </main>
      <div className="right-column">
        <button
          className="dashboard-collapse-button"
          onClick={() => setAppPreferences({ isRightPanelCollapsed: true })}
          type="button"
          title="收起 Team Dashboard"
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
        <TaskBoard />
      </div>
      <RightDashboardRail
        activeTeams={activeTeams}
        blockedTeams={blockedTeams}
        onExpand={() => setAppPreferences({ isRightPanelCollapsed: false })}
      />
    </div>
  );
}
