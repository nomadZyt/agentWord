import { invoke, isTauri } from "@tauri-apps/api/core";
import type { AgentProcessScan } from "../types/domain";

export async function scanAgentProcesses(): Promise<AgentProcessScan | null> {
  if (!isTauri()) {
    return null;
  }

  return invoke<AgentProcessScan>("scan_agent_processes");
}
