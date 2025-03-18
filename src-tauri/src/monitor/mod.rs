// src/monitor.rs
use std::collections::HashMap;
use std::process::{Command, Child, Stdio};
use std::sync::Mutex;
use tauri::{State, AppHandle, Emitter};
use serde::{Serialize, Deserialize};
use std::io::{BufRead, BufReader};

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct ProjectStatus {
    pub running: bool,
    pub pid: Option<u32>,
}

pub struct MonitorState {
    pub statuses: Mutex<HashMap<String, ProjectStatus>>,
    pub processes: Mutex<HashMap<String, Child>>,
}

#[tauri::command]
pub fn start_project(
    name: String,
    path: String,
    script: String,
    state: State<MonitorState>,
    app: AppHandle,
) -> Result<(), String> {
    let mut statuses = state.statuses.lock().unwrap();
    let mut processes = state.processes.lock().unwrap();

    if statuses.get(&name).map_or(false, |s| s.running) {
        return Err("Project is already running".to_string());
    }

    let command = if cfg!(target_os = "windows") { "cmd" } else { "sh" };
    let arg = if cfg!(target_os = "windows") { "/C" } else { "-c" };
    let npm_command = format!("npm run {}", script);

    let mut child = Command::new(command)
        .arg(arg)
        .arg(&npm_command)
        .current_dir(&path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start project: {}", e))?;

    let pid = child.id();
    let stdout = child.stdout.take().unwrap();
    let stderr = child.stderr.take().unwrap();

    processes.insert(name.clone(), child);
    statuses.insert(name.clone(), ProjectStatus {
        running: true,
        pid: Some(pid),
    });

    let app_clone = app.clone();
    let name_clone = name.clone();
    std::thread::spawn(move || {
        let stdout_reader = BufReader::new(stdout);
        let stderr_reader = BufReader::new(stderr);

        for line in stdout_reader.lines().chain(stderr_reader.lines()) {
            if let Ok(line) = line {
                let _ = app_clone.emit("terminal_log", format!("{}: {}", name_clone, line));
            }
        }
    });

    app.emit("project_status_update", &statuses.get(&name))
        .map_err(|e| format!("Failed to emit status update: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn stop_project(name: String, state: State<MonitorState>, app: AppHandle) -> Result<(), String> {
    let mut statuses = state.statuses.lock().unwrap();
    let mut processes = state.processes.lock().unwrap();

    if let Some(mut process) = processes.remove(&name) {
        let pid = process.id();
        println!("Stopping project: {} with PID: {}", name, pid);

        // Attempt graceful shutdown first
        #[cfg(target_os = "windows")]
        {
            let _ = Command::new("taskkill")
                .args(&["/PID", &pid.to_string(), "/T"])
                .output();
            // Force kill if still running after a short delay
            std::thread::sleep(std::time::Duration::from_millis(500));
            let _ = Command::new("taskkill")
                .args(&["/PID", &pid.to_string(), "/T", "/F"])
                .output()
                .map_err(|e| format!("Failed to forcefully kill process: {}", e))?;
        }
        #[cfg(not(target_os = "windows"))]
        {
            let _ = Command::new("kill")
                .arg(&pid.to_string())
                .output();
            // Force kill with process group
            std::thread::sleep(std::time::Duration::from_millis(500));
            let _ = Command::new("kill")
                .args(&["-9", &format!("-{}", pid)]) // Kill process group
                .output()
                .map_err(|e| format!("Failed to forcefully kill process group: {}", e))?;
        }

        // Wait for the process to terminate
        match process.wait() {
            Ok(status) => println!("Process {} terminated with status: {}", pid, status),
            Err(e) => println!("Failed to wait for process {}: {}", pid, e),
        }

        // Verify process is dead by checking if PID exists
        let is_running = cfg!(target_os = "windows")
            .then(|| {
                Command::new("tasklist")
                    .arg("/FI")
                    .arg(format!("PID eq {}", pid))
                    .output()
                    .map(|o| String::from_utf8_lossy(&o.stdout).contains(&pid.to_string()))
                    .unwrap_or(false)
            })
            .unwrap_or_else(|| {
                Command::new("ps")
                    .arg("-p")
                    .arg(pid.to_string())
                    .output()
                    .map(|o| o.status.success())
                    .unwrap_or(false)
            });

        if is_running {
            return Err(format!("Failed to stop project: Process {} still running", pid));
        }

        statuses.insert(name.clone(), ProjectStatus {
            running: false,
            pid: None,
        });

        app.emit("project_status_update", &statuses.get(&name))
            .map_err(|e| format!("Failed to emit status update: {}", e))?;
        println!("Project {} stopped successfully", name);
        Ok(())
    } else {
        Err("Project is not running".to_string())
    }
}

#[tauri::command]
pub fn get_project_status(name: String, state: State<MonitorState>) -> Result<ProjectStatus, String> {
    let statuses = state.statuses.lock().unwrap();
    statuses
        .get(&name)
        .cloned()
        .ok_or_else(|| "Project not found".to_string())
}

pub fn initialize_monitoring() {
    println!("Monitor module initialized");
}