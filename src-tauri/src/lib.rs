use rusqlite::{params, Connection, Error as SqliteError};
use serde::{Deserialize, Serialize};
use std::{
    fs,
    path::{Path, PathBuf},
    process::Command,
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::{AppHandle, Manager};

const SNAPSHOT_ROW_ID: i64 = 1;

#[derive(Clone, Copy, Deserialize, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
enum AgentProcessSource {
    Codex,
    Claude,
}

#[derive(Clone, Copy, Deserialize, Serialize)]
#[serde(rename_all = "snake_case")]
enum AgentProcessKind {
    CodexApp,
    CodexAppServer,
    CodexCli,
    ClaudeCli,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AgentProcessInfo {
    pid: u32,
    parent_pid: u32,
    source: AgentProcessSource,
    kind: AgentProcessKind,
    display_name: &'static str,
    command_label: String,
    workspace_label: Option<String>,
    workspace_path: Option<String>,
    window_label: Option<String>,
    window_owner_label: Option<String>,
    can_navigate_to_window: bool,
    task_source_label: String,
    started_at: String,
    last_seen_at: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct FocusAgentWindowRequest {
    pid: Option<u32>,
    source: Option<AgentProcessSource>,
    kind: Option<AgentProcessKind>,
    workspace_path: Option<String>,
    window_owner_label: Option<String>,
    window_label: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "snake_case")]
enum FocusAgentWindowStatus {
    Focused,
    OpenedWorkspace,
    NotFound,
    PermissionRequired,
    Unsupported,
    Error,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct FocusAgentWindowResult {
    status: FocusAgentWindowStatus,
    message: String,
    window_owner_label: Option<String>,
    workspace_label: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AgentProcessScan {
    scanned_at: String,
    total: usize,
    codex_count: usize,
    claude_count: usize,
    processes: Vec<AgentProcessInfo>,
}

fn unix_seconds_now() -> String {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs().to_string())
        .unwrap_or_else(|_| "0".to_string())
}

fn snapshot_db_path(app: &AppHandle) -> Result<PathBuf, String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("failed to resolve app data dir: {error}"))?;

    fs::create_dir_all(&data_dir)
        .map_err(|error| format!("failed to create app data dir: {error}"))?;

    Ok(data_dir.join("agentword.sqlite3"))
}

fn open_snapshot_db(app: &AppHandle) -> Result<Connection, String> {
    let connection = Connection::open(snapshot_db_path(app)?)
        .map_err(|error| format!("failed to open sqlite database: {error}"))?;

    connection
        .execute_batch(
            "
            PRAGMA journal_mode = WAL;
            CREATE TABLE IF NOT EXISTS agent_world_snapshots (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                snapshot_json TEXT NOT NULL,
                saved_at TEXT NOT NULL
            );
            ",
        )
        .map_err(|error| format!("failed to prepare sqlite schema: {error}"))?;

    Ok(connection)
}

fn command_label(command: &str) -> String {
    let executable = command.split_whitespace().next().unwrap_or("unknown");
    let executable_name = Path::new(executable)
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or(executable);

    if command.to_lowercase().contains("app-server") {
        format!("{executable_name} app-server")
    } else {
        executable_name.to_string()
    }
}

fn command_output(command: &str, args: &[&str]) -> Option<String> {
    let output = Command::new(command).args(args).output().ok()?;

    if !output.status.success() {
        return None;
    }

    Some(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

fn file_name_label(value: &str) -> Option<String> {
    let trimmed = value.trim();
    let file_name = Path::new(trimmed)
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or(trimmed)
        .trim();

    if file_name.is_empty() {
        return None;
    }

    Some(file_name.trim_end_matches(".app").to_string())
}

fn workspace_label_from_path(path_text: &str) -> Option<String> {
    let trimmed = path_text.trim();
    let lower = trimmed.to_lowercase();

    if trimmed == "/"
        || lower.starts_with("/applications")
        || lower.starts_with("/system")
        || lower.starts_with("/library")
        || lower.starts_with("/usr")
        || lower.starts_with("/bin")
        || lower.starts_with("/sbin")
        || lower.starts_with("/private")
        || lower.starts_with("/var")
        || lower.contains("/library/application support/")
    {
        return None;
    }

    let label = Path::new(trimmed)
        .file_name()
        .and_then(|name| name.to_str())
        .filter(|name| !name.is_empty())
        .or_else(|| {
            Path::new(trimmed)
                .parent()
                .and_then(|parent| parent.file_name())
                .and_then(|name| name.to_str())
        })?;

    Some(label.chars().take(36).collect())
}

fn workspace_path_from_text(path_text: &str) -> Option<String> {
    let trimmed = path_text.trim();

    workspace_label_from_path(trimmed)?;

    let path = Path::new(trimmed);
    if !path.is_absolute() || !path.exists() {
        return None;
    }

    Some(trimmed.to_string())
}

fn workspace_path_for_pid(pid: u32) -> Option<String> {
    let pid_text = pid.to_string();
    let output = command_output("lsof", &["-a", "-p", &pid_text, "-d", "cwd", "-Fn"])?;

    output
        .lines()
        .find_map(|line| line.strip_prefix('n'))
        .and_then(workspace_path_from_text)
}

fn workspace_label_for_pid(pid: u32) -> Option<String> {
    let pid_text = pid.to_string();
    let output = command_output("lsof", &["-a", "-p", &pid_text, "-d", "cwd", "-Fn"])?;

    output
        .lines()
        .find_map(|line| line.strip_prefix('n'))
        .and_then(workspace_label_from_path)
}

fn parent_process_identity(pid: u32) -> Option<(u32, String)> {
    if pid == 0 {
        return None;
    }

    let pid_text = pid.to_string();
    let output = command_output("ps", &["-p", &pid_text, "-o", "ppid=,comm="])?;
    let mut parts = output.split_whitespace();
    let parent_pid = parts.next()?.parse::<u32>().ok()?;
    let command = parts.collect::<Vec<_>>().join(" ");
    let label = file_name_label(&command)?;

    Some((parent_pid, label))
}

fn is_window_owner_label(label: &str) -> bool {
    let lower = label.to_lowercase();

    lower.contains("codex")
        || lower.contains("claude")
        || lower.contains("cursor")
        || lower.contains("code")
        || lower.contains("terminal")
        || lower.contains("ghostty")
        || lower.contains("iterm")
        || lower.contains("warp")
        || lower.contains("wezterm")
        || lower.contains("orcaterm")
}

fn window_label_for_process(
    kind: AgentProcessKind,
    parent_pid: u32,
    command: &str,
) -> Option<String> {
    let lower_command = command.to_lowercase();

    if lower_command.contains("/applications/codex.app") {
        return Some("Codex App".to_string());
    }

    if lower_command.contains("/.cursor/extensions/") {
        return Some("Cursor".to_string());
    }

    if matches!(kind, AgentProcessKind::CodexApp) {
        return Some("Codex App".to_string());
    }

    let mut cursor = parent_pid;

    for _ in 0..6 {
        let (next_parent_pid, label) = parent_process_identity(cursor)?;
        let lower_label = label.to_lowercase();

        if is_window_owner_label(&label)
            && lower_label != "codex"
            && lower_label != "node_repl"
            && lower_label != "claude"
        {
            return Some(label);
        }

        cursor = next_parent_pid;
    }

    None
}

fn task_source_label_for_process(
    kind: AgentProcessKind,
    workspace_label: Option<&String>,
    window_label: Option<&String>,
) -> String {
    let base = match kind {
        AgentProcessKind::CodexApp => "Codex App",
        AgentProcessKind::CodexAppServer => "Codex app-server",
        AgentProcessKind::CodexCli => "Codex CLI",
        AgentProcessKind::ClaudeCli => "Claude CLI",
    };

    if let Some(workspace) = workspace_label {
        format!("{base} · {workspace}")
    } else if let Some(window) = window_label {
        format!("{base} · {window}")
    } else {
        base.to_string()
    }
}

fn is_cli_executable(command: &str, executable_name: &str) -> bool {
    let executable = command.split_whitespace().next().unwrap_or("");
    let file_name = Path::new(executable)
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or(executable)
        .to_lowercase();

    file_name == executable_name
}

fn classify_agent_process(command: &str) -> Option<(AgentProcessSource, AgentProcessKind)> {
    let lower_command = command.to_lowercase();

    if lower_command.contains("codex framework.framework")
        || lower_command.contains("codex computer use.app")
        || lower_command.contains("browser_crashpad_handler")
        || lower_command.contains("bare-modifier-monitor")
        || lower_command.contains("node_repl")
    {
        return None;
    }

    if command.starts_with("/Applications/Codex.app/Contents/MacOS/Codex") {
        return Some((AgentProcessSource::Codex, AgentProcessKind::CodexApp));
    }

    if lower_command.contains("codex app-server") {
        return Some((AgentProcessSource::Codex, AgentProcessKind::CodexAppServer));
    }

    if is_cli_executable(command, "codex") {
        return Some((AgentProcessSource::Codex, AgentProcessKind::CodexCli));
    }

    if is_cli_executable(command, "claude") {
        return Some((AgentProcessSource::Claude, AgentProcessKind::ClaudeCli));
    }

    None
}

fn display_name_for_process(kind: AgentProcessKind) -> &'static str {
    match kind {
        AgentProcessKind::CodexApp => "Codex App",
        AgentProcessKind::CodexAppServer => "Codex app-server",
        AgentProcessKind::CodexCli => "Codex CLI",
        AgentProcessKind::ClaudeCli => "Claude CLI",
    }
}

fn app_name_for_window_owner(label: &str) -> Option<&'static str> {
    let normalized = label
        .trim()
        .trim_end_matches(".app")
        .to_lowercase()
        .replace([' ', '-', '_'], "");

    match normalized.as_str() {
        "codex" | "codexapp" => Some("Codex"),
        "terminal" => Some("Terminal"),
        "iterm" | "iterm2" => Some("iTerm"),
        "ghostty" => Some("Ghostty"),
        "warp" => Some("Warp"),
        "wezterm" => Some("WezTerm"),
        "cursor" => Some("Cursor"),
        "code" | "visualstudiocode" | "vscode" => Some("Visual Studio Code"),
        _ => None,
    }
}

fn app_name_for_agent_request(request: &FocusAgentWindowRequest) -> Option<&'static str> {
    if let Some(label) = request
        .window_owner_label
        .as_deref()
        .or(request.window_label.as_deref())
    {
        if let Some(app_name) = app_name_for_window_owner(label) {
            return Some(app_name);
        }
    }

    match request.kind {
        Some(AgentProcessKind::CodexApp) | Some(AgentProcessKind::CodexAppServer) => {
            Some("Codex")
        }
        _ => None,
    }
}

fn run_command_status(command: &str, args: &[&str]) -> Result<(), String> {
    let output = Command::new(command)
        .args(args)
        .output()
        .map_err(|error| format!("failed to run {command}: {error}"))?;

    if output.status.success() {
        return Ok(());
    }

    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
    if stderr.is_empty() {
        Err(format!("{command} exited with status {}", output.status))
    } else {
        Err(stderr)
    }
}

fn is_permission_error(error: &str) -> bool {
    let lower = error.to_lowercase();

    lower.contains("not authorized")
        || lower.contains("not permitted")
        || lower.contains("permission")
        || lower.contains("privacy")
        || lower.contains("automation")
        || lower.contains("accessibility")
        || lower.contains("assistive")
}

fn focus_app_by_name(app_name: &str) -> Result<(), String> {
    if run_command_status("open", &["-a", app_name]).is_ok() {
        return Ok(());
    }

    let script = format!("tell application \"{app_name}\" to activate");
    run_command_status("osascript", &["-e", &script])
}

fn open_workspace_path(path_text: &str) -> Result<Option<String>, String> {
    let workspace_path = match workspace_path_from_text(path_text) {
        Some(path) => path,
        None => return Ok(None),
    };

    run_command_status("open", &[&workspace_path])?;
    Ok(workspace_label_from_path(&workspace_path))
}

fn parse_ps_line(line: &str, last_seen_at: &str) -> Option<AgentProcessInfo> {
    let mut parts = line.split_whitespace();
    let pid = parts.next()?.parse::<u32>().ok()?;
    let parent_pid = parts.next()?.parse::<u32>().ok()?;
    let started_at = [
        parts.next()?,
        parts.next()?,
        parts.next()?,
        parts.next()?,
        parts.next()?,
    ]
    .join(" ");
    let command = parts.collect::<Vec<_>>().join(" ");
    let (source, kind) = classify_agent_process(&command)?;
    let workspace_path = workspace_path_for_pid(pid);
    let workspace_label = workspace_path
        .as_deref()
        .and_then(workspace_label_from_path)
        .or_else(|| workspace_label_for_pid(pid));
    let window_label = window_label_for_process(kind, parent_pid, &command);
    let window_owner_label = window_label.clone();
    let can_navigate_to_window = window_owner_label
        .as_deref()
        .and_then(app_name_for_window_owner)
        .is_some()
        || workspace_path.is_some()
        || matches!(kind, AgentProcessKind::CodexApp | AgentProcessKind::CodexAppServer);
    let task_source_label =
        task_source_label_for_process(kind, workspace_label.as_ref(), window_label.as_ref());

    Some(AgentProcessInfo {
        pid,
        parent_pid,
        source,
        kind,
        display_name: display_name_for_process(kind),
        command_label: command_label(&command),
        workspace_label,
        workspace_path,
        window_label,
        window_owner_label,
        can_navigate_to_window,
        task_source_label,
        started_at,
        last_seen_at: last_seen_at.to_string(),
    })
}

#[tauri::command]
fn scan_agent_processes() -> Result<AgentProcessScan, String> {
    let scanned_at = unix_seconds_now();
    let output = Command::new("ps")
        .args(["-axo", "pid=,ppid=,lstart=,command="])
        .output()
        .map_err(|error| format!("failed to run ps: {error}"))?;

    if !output.status.success() {
        return Err(format!("ps exited with status: {}", output.status));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let processes = stdout
        .lines()
        .filter_map(|line| parse_ps_line(line, &scanned_at))
        .collect::<Vec<_>>();
    let codex_count = processes
        .iter()
        .filter(|process| process.source == AgentProcessSource::Codex)
        .count();
    let claude_count = processes
        .iter()
        .filter(|process| process.source == AgentProcessSource::Claude)
        .count();

    Ok(AgentProcessScan {
        scanned_at,
        total: processes.len(),
        codex_count,
        claude_count,
        processes,
    })
}

#[tauri::command]
fn focus_agent_window(request: FocusAgentWindowRequest) -> FocusAgentWindowResult {
    let window_owner_label = request
        .window_owner_label
        .clone()
        .or_else(|| request.window_label.clone());
    let workspace_label = request
        .workspace_path
        .as_deref()
        .and_then(workspace_label_from_path);

    if !cfg!(target_os = "macos") {
        return FocusAgentWindowResult {
            status: FocusAgentWindowStatus::Unsupported,
            message: "Desktop window navigation is only supported on macOS right now.".to_string(),
            window_owner_label,
            workspace_label,
        };
    }

    if let Some(app_name) = app_name_for_agent_request(&request) {
        match focus_app_by_name(app_name) {
            Ok(()) => {
                return FocusAgentWindowResult {
                    status: FocusAgentWindowStatus::Focused,
                    message: format!("Focused {app_name}."),
                    window_owner_label: Some(app_name.to_string()),
                    workspace_label,
                };
            }
            Err(error) if is_permission_error(&error) => {
                return FocusAgentWindowResult {
                    status: FocusAgentWindowStatus::PermissionRequired,
                    message:
                        "macOS blocked window activation. Grant Automation or Accessibility permission and retry."
                            .to_string(),
                    window_owner_label,
                    workspace_label,
                };
            }
            Err(_) => {}
        }
    }

    if let Some(workspace_path) = request.workspace_path.as_deref() {
        match open_workspace_path(workspace_path) {
            Ok(Some(opened_workspace_label)) => {
                return FocusAgentWindowResult {
                    status: FocusAgentWindowStatus::OpenedWorkspace,
                    message: format!("Opened workspace {opened_workspace_label}."),
                    window_owner_label,
                    workspace_label: Some(opened_workspace_label),
                };
            }
            Ok(None) => {
                return FocusAgentWindowResult {
                    status: FocusAgentWindowStatus::NotFound,
                    message: "No navigable workspace was found for this session.".to_string(),
                    window_owner_label,
                    workspace_label,
                };
            }
            Err(error) if is_permission_error(&error) => {
                return FocusAgentWindowResult {
                    status: FocusAgentWindowStatus::PermissionRequired,
                    message:
                        "macOS blocked opening the workspace. Check Finder or Automation permission."
                            .to_string(),
                    window_owner_label,
                    workspace_label,
                };
            }
            Err(_) => {
                return FocusAgentWindowResult {
                    status: FocusAgentWindowStatus::Error,
                    message: "Workspace navigation failed.".to_string(),
                    window_owner_label,
                    workspace_label,
                };
            }
        }
    }

    let process_hint = request
        .pid
        .map(|pid| format!(" for process {pid}"))
        .unwrap_or_default();
    let source_hint = match request.source {
        Some(AgentProcessSource::Codex) => "Codex",
        Some(AgentProcessSource::Claude) => "Claude",
        None => "agent",
    };

    FocusAgentWindowResult {
        status: FocusAgentWindowStatus::NotFound,
        message: format!("No supported {source_hint} window or workspace was found{process_hint}."),
        window_owner_label,
        workspace_label,
    }
}

#[tauri::command]
fn save_agent_world_snapshot(app: AppHandle, snapshot: serde_json::Value) -> Result<(), String> {
    let connection = open_snapshot_db(&app)?;
    let snapshot_json = serde_json::to_string(&snapshot)
        .map_err(|error| format!("failed to serialize snapshot: {error}"))?;
    let saved_at = unix_seconds_now();

    connection
        .execute(
            "
            INSERT INTO agent_world_snapshots (id, snapshot_json, saved_at)
            VALUES (?1, ?2, ?3)
            ON CONFLICT(id) DO UPDATE SET
                snapshot_json = excluded.snapshot_json,
                saved_at = excluded.saved_at
            ",
            params![SNAPSHOT_ROW_ID, snapshot_json, saved_at],
        )
        .map_err(|error| format!("failed to save snapshot: {error}"))?;

    Ok(())
}

#[tauri::command]
fn load_agent_world_snapshot(app: AppHandle) -> Result<Option<serde_json::Value>, String> {
    let connection = open_snapshot_db(&app)?;
    let snapshot_json = match connection.query_row(
        "SELECT snapshot_json FROM agent_world_snapshots WHERE id = ?1",
        params![SNAPSHOT_ROW_ID],
        |row| row.get::<_, String>(0),
    ) {
        Ok(value) => value,
        Err(SqliteError::QueryReturnedNoRows) => return Ok(None),
        Err(error) => return Err(format!("failed to load snapshot: {error}")),
    };

    serde_json::from_str(&snapshot_json)
        .map(Some)
        .map_err(|error| format!("failed to parse snapshot: {error}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            scan_agent_processes,
            focus_agent_window,
            save_agent_world_snapshot,
            load_agent_world_snapshot
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
