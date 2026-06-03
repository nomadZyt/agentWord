import { invoke, isTauri } from "@tauri-apps/api/core";
import type {
  FocusAgentWindowRequest,
  FocusAgentWindowResult,
} from "../types/domain";

export async function focusAgentWindow(
  request: FocusAgentWindowRequest,
): Promise<FocusAgentWindowResult> {
  if (!isTauri()) {
    return {
      status: "unsupported",
      message: "Desktop window navigation is available in the macOS app.",
      windowOwnerLabel: request.windowOwnerLabel ?? request.windowLabel ?? null,
      workspaceLabel: null,
    };
  }

  return invoke<FocusAgentWindowResult>("focus_agent_window", { request });
}
