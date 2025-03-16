use serde::{Deserialize, Serialize};
use tauri::{State, Manager};
use std::sync::Mutex;
use std::collections::HashMap;
use std::fs;
use std::path::Path;

// Project structure matching your React frontend
#[derive(Serialize, Deserialize, Clone, Debug)]
struct Project {
    name: String,
    path: String,
    desc: String,
    script: String,
}

// Application state
struct AppState {
    projects: Mutex<HashMap<String, Project>>,
    file_path: String,
}

// Function to load projects from a JSON file
fn load_projects(file_path: &str) -> HashMap<String, Project> {
    if Path::new(file_path).exists() {
        match fs::read_to_string(file_path) {
            Ok(contents) => match serde_json::from_str(&contents) {
                Ok(projects) => {
                    println!("Backend: Loaded projects from {}: {:?}", file_path, projects);
                    return projects;
                }
                Err(e) => {
                    println!("Backend: Failed to parse JSON from {}: {}", file_path, e);
                }
            },
            Err(e) => {
                println!("Backend: Failed to read {}: {}", file_path, e);
            }
        }
    }
    // Return an empty HashMap if no file exists
    println!("Backend: No projects.json found, starting with empty state");
    HashMap::new()
}

// Function to save projects to a JSON file
fn save_projects(file_path: &str, projects: &HashMap<String, Project>) -> Result<(), String> {
    match serde_json::to_string_pretty(projects) {
        Ok(json) => match fs::write(file_path, json) {
            Ok(()) => {
                println!("Backend: Successfully saved projects to {}", file_path);
                Ok(())
            }
            Err(e) => {
                println!("Backend: Failed to write to {}: {}", file_path, e);
                Err(format!("Failed to write to file: {}", e))
            }
        },
        Err(e) => {
            println!("Backend: Failed to serialize projects: {}", e);
            Err(format!("Failed to serialize projects: {}", e))
        }
    }
}

// Tauri command to get all projects
#[tauri::command]
fn get_projects(state: State<AppState>) -> Vec<Project> {
    let projects = state.projects.lock().unwrap();
    println!("Backend: Fetching all projects. Current state: {:?}", projects);
    let project_list: Vec<Project> = projects.values().cloned().collect();
    println!("Backend: Returning projects: {:?}", project_list);
    project_list
}

// Tauri command to add a project
#[tauri::command]
fn add_project(project: Project, state: State<AppState>) -> Result<(), String> {
    println!("Backend: Received new project: {:?}", project);
    let mut projects = state.projects.lock().unwrap();
    
    if project.name.trim().is_empty() {
        println!("Backend: Validation failed - Project name is empty");
        return Err("Project name cannot be empty".to_string());
    }
    
    if projects.contains_key(&project.name) {
        println!("Backend: Validation failed - Project '{}' already exists", project.name);
        return Err("Project with this name already exists".to_string());
    }
    
    println!("Backend: Adding project '{}' to state", project.name);
    projects.insert(project.name.clone(), project.clone());
    println!("Backend: Updated projects state: {:?}", projects);
    
    save_projects(&state.file_path, &projects)?;
    Ok(())
}

#[tauri::command]
fn delete_project(name: String, state: State<AppState>) -> Result<(), String> {
    println!("Backend: Received delete request for project: {}", name);
    let mut projects = state.projects.lock().unwrap();
    
    if !projects.contains_key(&name) {
        println!("Backend: Project '{}' not found", name);
        return Err("Project not found".to_string());
    }
    
    println!("Backend: Deleting project '{}'", name);
    projects.remove(&name);
    println!("Backend: Updated projects state: {:?}", projects);
    
    save_projects(&state.file_path, &projects)?;
    Ok(())
}

fn main() {
    let file_path = "./projects.json".to_string();
    let initial_projects = load_projects(&file_path);

    println!("Backend: Using file path: {}", file_path);

    tauri::Builder::default()
        .manage(AppState {
            projects: Mutex::new(initial_projects),
            file_path,
        })
        .invoke_handler(tauri::generate_handler![get_projects, add_project, delete_project])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}