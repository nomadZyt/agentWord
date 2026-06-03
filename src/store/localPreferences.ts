import type {
  AppPreferences,
  RealAgentEventRuleMode,
  RightPanelMode,
  SceneDensityMode,
  SceneViewportPreference,
  TaskFilters,
  TaskStatus,
} from "../types/domain";

const storageKey = "agentword.preferences.v2";

const allowedStatuses = new Set<TaskStatus | "all">([
  "all",
  "queued",
  "planning",
  "running",
  "verifying",
  "blocked",
  "done",
]);

const allowedSceneDensityModes = new Set<SceneDensityMode>([
  "live",
  "readability",
  "stress12",
  "stress24",
  "stress30",
]);

const allowedRealAgentEventRuleModes = new Set<RealAgentEventRuleMode>([
  "balanced",
  "quiet",
  "subagent-heavy",
]);

const allowedRightPanelModes = new Set<RightPanelMode>(["team-dashboard"]);
const overviewSceneZoom = 1;
const maxRestoredOverviewZoom = 1.08;

export const defaultAppPreferences: AppPreferences = {
  eventLogLimit: 24,
  isLeftPanelCollapsed: false,
  isRightPanelCollapsed: false,
  isDemoFlowEnabled: false,
  isPrivacyModeEnabled: false,
  isProcessMonitorEnabled: true,
  processRefreshIntervalMs: 12000,
  realAgentEventRuleMode: "balanced",
  rightPanelMode: "team-dashboard",
  sceneDensityMode: "live",
};

export const defaultSceneViewportPreference: SceneViewportPreference = {
  panX: 0,
  panY: 0,
  zoom: overviewSceneZoom,
};

export interface PersistedAgentWorldPreferences {
  preferences: AppPreferences;
  sceneViewportPreference: SceneViewportPreference;
  taskFilters: TaskFilters;
}

interface RawPreferences {
  preferences?: Partial<AppPreferences>;
  sceneViewportPreference?: Partial<SceneViewportPreference>;
  taskFilters?: Partial<TaskFilters>;
}

const isBrowserStorageAvailable = () =>
  typeof window !== "undefined" && "localStorage" in window;

const toFiniteNumber = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const normalizePreferences = (
  value: RawPreferences["preferences"],
): AppPreferences => {
  const refreshInterval = toFiniteNumber(
    value?.processRefreshIntervalMs,
    defaultAppPreferences.processRefreshIntervalMs,
  );
  const eventLogLimit = toFiniteNumber(
    value?.eventLogLimit,
    defaultAppPreferences.eventLogLimit,
  );

  return {
    eventLogLimit: [12, 24, 48].includes(eventLogLimit)
      ? eventLogLimit
      : defaultAppPreferences.eventLogLimit,
    isLeftPanelCollapsed:
      typeof value?.isLeftPanelCollapsed === "boolean"
        ? value.isLeftPanelCollapsed
        : defaultAppPreferences.isLeftPanelCollapsed,
    isRightPanelCollapsed:
      typeof value?.isRightPanelCollapsed === "boolean"
        ? value.isRightPanelCollapsed
        : defaultAppPreferences.isRightPanelCollapsed,
    isDemoFlowEnabled:
      typeof value?.isDemoFlowEnabled === "boolean"
        ? value.isDemoFlowEnabled
        : defaultAppPreferences.isDemoFlowEnabled,
    isPrivacyModeEnabled:
      typeof value?.isPrivacyModeEnabled === "boolean"
        ? value.isPrivacyModeEnabled
        : defaultAppPreferences.isPrivacyModeEnabled,
    isProcessMonitorEnabled:
      typeof value?.isProcessMonitorEnabled === "boolean"
        ? value.isProcessMonitorEnabled
        : defaultAppPreferences.isProcessMonitorEnabled,
    processRefreshIntervalMs: [6000, 12000, 30000].includes(refreshInterval)
      ? refreshInterval
      : defaultAppPreferences.processRefreshIntervalMs,
    realAgentEventRuleMode:
      value?.realAgentEventRuleMode &&
      allowedRealAgentEventRuleModes.has(value.realAgentEventRuleMode)
        ? value.realAgentEventRuleMode
        : defaultAppPreferences.realAgentEventRuleMode,
    rightPanelMode:
      value?.rightPanelMode && allowedRightPanelModes.has(value.rightPanelMode)
        ? value.rightPanelMode
        : defaultAppPreferences.rightPanelMode,
    sceneDensityMode:
      value?.sceneDensityMode &&
      allowedSceneDensityModes.has(value.sceneDensityMode)
        ? value.sceneDensityMode
        : defaultAppPreferences.sceneDensityMode,
  };
};

const normalizeSceneViewport = (
  value: RawPreferences["sceneViewportPreference"],
): SceneViewportPreference => {
  const zoom = toFiniteNumber(value?.zoom, defaultSceneViewportPreference.zoom);
  const shouldResetToOverview = zoom > maxRestoredOverviewZoom;

  return {
    panX: shouldResetToOverview
      ? defaultSceneViewportPreference.panX
      : toFiniteNumber(value?.panX, defaultSceneViewportPreference.panX),
    panY: shouldResetToOverview
      ? defaultSceneViewportPreference.panY
      : toFiniteNumber(value?.panY, defaultSceneViewportPreference.panY),
    zoom: shouldResetToOverview ? defaultSceneViewportPreference.zoom : zoom,
  };
};

const normalizeTaskFilters = (
  value: RawPreferences["taskFilters"],
  fallback: TaskFilters,
): TaskFilters => ({
  agentId:
    typeof value?.agentId === "string" ? value.agentId : fallback.agentId,
  blockedOnly:
    typeof value?.blockedOnly === "boolean"
      ? value.blockedOnly
      : fallback.blockedOnly,
  status:
    value?.status && allowedStatuses.has(value.status)
      ? value.status
      : fallback.status,
});

export const loadAgentWorldPreferences = (
  defaultTaskFilters: TaskFilters,
): PersistedAgentWorldPreferences => {
  if (!isBrowserStorageAvailable()) {
    return {
      preferences: defaultAppPreferences,
      sceneViewportPreference: defaultSceneViewportPreference,
      taskFilters: defaultTaskFilters,
    };
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    const parsed = raw ? (JSON.parse(raw) as RawPreferences) : {};

    return {
      preferences: normalizePreferences(parsed.preferences),
      sceneViewportPreference: normalizeSceneViewport(
        parsed.sceneViewportPreference,
      ),
      taskFilters: normalizeTaskFilters(parsed.taskFilters, defaultTaskFilters),
    };
  } catch {
    return {
      preferences: defaultAppPreferences,
      sceneViewportPreference: defaultSceneViewportPreference,
      taskFilters: defaultTaskFilters,
    };
  }
};

export const saveAgentWorldPreferences = (
  preferences: PersistedAgentWorldPreferences,
) => {
  if (!isBrowserStorageAvailable()) {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(preferences));
  } catch {
    // Preferences are a convenience layer; failing to save should not break the scene.
  }
};
