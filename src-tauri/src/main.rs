// src/main.rs
use std::collections::HashMap;
use std::path::Path;
mod monitor;
mod projects;

use crate::monitor::{MonitorState, start_project, stop_project, get_project_status};
use crate::projects::{DbState, Project, get_projects, add_project, delete_project, init_database};

fn main() {
    let db_path = Path::new("projects.db");
    let conn = rusqlite::Connection::open(db_path).expect("Failed to open SQLite database");
    init_database(&conn).expect("Failed to initialize database");

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(DbState {
            conn: std::sync::Mutex::new(conn),
        })
        .manage(MonitorState {
            statuses: std::sync::Mutex::new(HashMap::new()),
            processes: std::sync::Mutex::new(HashMap::new()),
        })
        .invoke_handler(tauri::generate_handler![
            get_projects,
            add_project,
            delete_project,
            start_project,
            stop_project,
            get_project_status
        ])
        .setup(|_app| {
            monitor::initialize_monitoring();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}