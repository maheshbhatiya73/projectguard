// src/projects.rs
use rusqlite::{Connection, params, Result as SqliteResult};
use std::sync::Mutex;
use tauri::{State, AppHandle};
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Project {
    pub name: String,
    pub path: String,
    pub desc: String,
    pub script: String,
}

pub struct DbState {
    pub conn: Mutex<Connection>,
}

pub fn init_database(conn: &Connection) -> SqliteResult<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS projects (
            name TEXT PRIMARY KEY,
            path TEXT NOT NULL,
            desc TEXT NOT NULL,
            script TEXT NOT NULL
        )",
        [],
    )?;
    Ok(())
}

#[tauri::command]
pub fn get_projects(state: State<DbState>) -> Vec<Project> {
    let conn = state.conn.lock().unwrap();
    let mut stmt = conn
        .prepare("SELECT name, path, desc, script FROM projects")
        .unwrap();
    
    let project_iter = stmt
        .query_map([], |row| {
            Ok(Project {
                name: row.get(0)?,
                path: row.get(1)?,
                desc: row.get(2)?,
                script: row.get(3)?,
            })
        })
        .unwrap();

    let mut projects = Vec::new();
    for project in project_iter {
        projects.push(project.unwrap());
    }
    projects
}

#[tauri::command]
pub fn add_project(project: Project, state: State<DbState>, _app: AppHandle) -> Result<(), String> {
    let conn = state.conn.lock().unwrap();

    if project.name.trim().is_empty() {
        return Err("Project name cannot be empty".to_string());
    }
    if project.path.trim().is_empty() {
        return Err("Project path cannot be empty".to_string());
    }

    let exists: bool = conn
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM projects WHERE name = ?1)",
            [&project.name],
            |row| row.get(0),
        )
        .unwrap_or(false);

    if exists {
        return Err("Project with this name already exists".to_string());
    }

    conn.execute(
        "INSERT INTO projects (name, path, desc, script) VALUES (?1, ?2, ?3, ?4)",
        params![project.name, project.path, project.desc, project.script],
    )
    .map_err(|e| format!("Failed to add project: {}", e))?;

    Ok(())
}

#[tauri::command]
pub fn delete_project(name: String, state: State<DbState>, _app: AppHandle) -> Result<(), String> {
    let conn = state.conn.lock().unwrap();

    let affected = conn
        .execute("DELETE FROM projects WHERE name = ?1", [&name])
        .map_err(|e| format!("Failed to delete project: {}", e))?;

    if affected == 0 {
        return Err("Project not found".to_string());
    }

    Ok(())
}