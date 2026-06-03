export type AgentSource = "codex" | "claude" | "simulated";
export type AgentAppType = "app" | "cli" | "subagent" | "unknown";
export type AgentStatus =
  | "idle"
  | "planning"
  | "running"
  | "verifying"
  | "blocked"
  | "done";
export type AgentPresenceStatus = "live" | "stale" | "gone";
export type AgentProcessKind =
  | "codex_app"
  | "codex_app_server"
  | "codex_cli"
  | "claude_cli";
export type AgentProcessScanStatus =
  | "idle"
  | "scanning"
  | "ready"
  | "unavailable"
  | "error"
  | "disabled";
export type AgentWindowNavigationStatus =
  | "focused"
  | "opened_workspace"
  | "not_found"
  | "permission_required"
  | "unsupported"
  | "error";
export type SnapshotRestoreStatus =
  | "idle"
  | "loading"
  | "ready"
  | "empty"
  | "error";
export type SnapshotSaveStatus = "idle" | "saving" | "saved" | "error";
export type TaskStatus =
  | "queued"
  | "planning"
  | "running"
  | "verifying"
  | "blocked"
  | "done";
export type TaskFilterStatus = TaskStatus | "all";
export type TaskFilterAgentId = string | "all";
export type SceneDensityMode =
  | "live"
  | "readability"
  | "stress12"
  | "stress24"
  | "stress30";
export type RealAgentEventRuleMode = "balanced" | "quiet" | "subagent-heavy";
export type RightPanelMode = "team-dashboard";
export type SceneEventType =
  | "task_created"
  | "status_changed"
  | "agent_seen"
  | "blocked"
  | "completed"
  | "handoff"
  | "summon_subagent"
  | "merge_result"
  | "subagent_spawned"
  | "subagent_recycled";

export type AgentAction =
  | "idle"
  | "walk_down"
  | "walk_up"
  | "walk_left"
  | "walk_right"
  | "planning"
  | "working"
  | "verifying"
  | "blocked"
  | "done"
  | "carry_task"
  | "handoff"
  | "summon_subagent"
  | "merge_result";

export interface Point {
  x: number;
  y: number;
}

export interface RoomHotspot {
  id: string;
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  center: Point;
  entryPoint: Point;
  cameraFocus: Point;
}

export interface RoomLabel {
  id: string;
  displayName: string;
  taskStatus: TaskStatus | "idle" | "monitoring" | "subagent" | "transit";
  icon: string;
  accentColor: string;
  defaultAgentAction: AgentAction;
  description: string;
}

export interface StatusColumn {
  id: TaskStatus;
  displayName: string;
  roomId: string;
}

export type SceneDecorationAssetType = "tile" | "prop";
export type SceneDecorationLayer = "floor" | "prop";

export interface SceneDecorationAsset {
  id: string;
  type: SceneDecorationAssetType;
  image: string;
  sourceFile: string;
  size: {
    width: number;
    height: number;
  };
}

export interface SceneDecoration {
  id: string;
  assetId: string;
  assetType: SceneDecorationAssetType;
  roomId?: string;
  layer: SceneDecorationLayer;
  position: Point;
  scale: number;
  alpha: number;
  anchor: Point;
  rotation: number;
  asset: SceneDecorationAsset;
}

export interface SpriteSheetDefinition {
  id: string;
  label: string;
  image: string;
  frameWidth: number;
  frameHeight: number;
  columns: number;
  rows: number;
  anchor: Point;
  actionFps: Partial<Record<AgentAction, number>>;
  actionFrameCounts: Partial<Record<AgentAction, number>>;
  actionRows: Partial<Record<AgentAction, number>>;
}

export interface AgentSession {
  id: string;
  source: AgentSource;
  appType: AgentAppType;
  processKind?: AgentProcessKind;
  status: AgentStatus;
  pid?: number;
  parentPid?: number;
  canNavigateToWindow?: boolean;
  currentTaskId?: string;
  displayName: string;
  goneSince?: string;
  presenceStatus?: AgentPresenceStatus;
  role: string;
  spriteSheetId: string;
  staleSince?: string;
  taskSourceLabel?: string;
  windowLabel?: string | null;
  windowOwnerLabel?: string | null;
  workspaceLabel?: string | null;
  workspacePath?: string | null;
  roomId: string;
  scene: {
    position: Point;
    scale: number;
  };
  lastSeenAt: string;
  isReal: boolean;
}

export interface AgentProcessInfo {
  pid: number;
  parentPid: number;
  source: Exclude<AgentSource, "simulated">;
  kind: AgentProcessKind;
  displayName: string;
  commandLabel: string;
  workspaceLabel?: string | null;
  workspacePath?: string | null;
  windowLabel?: string | null;
  windowOwnerLabel?: string | null;
  canNavigateToWindow: boolean;
  taskSourceLabel: string;
  startedAt: string;
  lastSeenAt: string;
}

export interface FocusAgentWindowRequest {
  pid?: number;
  source?: Exclude<AgentSource, "simulated">;
  kind?: AgentProcessKind;
  workspacePath?: string | null;
  windowOwnerLabel?: string | null;
  windowLabel?: string | null;
}

export interface FocusAgentWindowResult {
  status: AgentWindowNavigationStatus;
  message: string;
  windowOwnerLabel?: string | null;
  workspaceLabel?: string | null;
}

export interface AgentProcessScan {
  scannedAt: string;
  total: number;
  codexCount: number;
  claudeCount: number;
  processes: AgentProcessInfo[];
}

export interface TaskCard {
  id: string;
  title: string;
  status: TaskStatus;
  progress: number;
  assigneeAgentId?: string;
  subagentIds: string[];
  details: string;
  eventIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskFilters {
  agentId: TaskFilterAgentId;
  blockedOnly: boolean;
  status: TaskFilterStatus;
}

export interface SceneViewportPreference {
  panX: number;
  panY: number;
  zoom: number;
}

export interface AppPreferences {
  eventLogLimit: number;
  isLeftPanelCollapsed: boolean;
  isRightPanelCollapsed: boolean;
  isDemoFlowEnabled: boolean;
  isPrivacyModeEnabled: boolean;
  isProcessMonitorEnabled: boolean;
  processRefreshIntervalMs: number;
  realAgentEventRuleMode: RealAgentEventRuleMode;
  rightPanelMode: RightPanelMode;
  sceneDensityMode: SceneDensityMode;
}

export interface MapEntity {
  id: string;
  type: "agent" | "room" | "task" | "decoration" | "alert";
  roomId?: string;
  linkedAgentId?: string;
  linkedTaskId?: string;
  position: Point;
  state: string;
}

export interface SceneEvent {
  id: string;
  type: SceneEventType;
  actorId?: string;
  taskId?: string;
  message: string;
  createdAt: string;
}

export interface AgentWorldSnapshot {
  version: 1;
  savedAt: string;
  agents: AgentSession[];
  tasks: TaskCard[];
  events: SceneEvent[];
  selectedTaskId: string;
  selectedAgentId: string;
  selectedRoomId: string;
  demoFlowTick: number;
}
