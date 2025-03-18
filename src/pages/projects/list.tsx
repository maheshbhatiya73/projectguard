// App.tsx
import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Add, Delete, PlayArrow, Stop, Terminal } from "@mui/icons-material";
import AddProjectModal from "./add";
import TerminalView from "./Terminal";

interface Project {
  name: string;
  path: string;
  desc: string;
  script: string;
}

interface ProjectStatus {
  running: boolean;
  pid?: number;
}

const App = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [statuses, setStatuses] = useState<Record<string, ProjectStatus>>({});
  const [showForm, setShowForm] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", path: "", desc: "", script: "start" });
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      const fetchedProjects: Project[] = await invoke("get_projects");
      console.log("Frontend: Fetched projects:", fetchedProjects);
      setProjects(fetchedProjects);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      setProjects([]);
    }
  }, []);

  const fetchStatuses = useCallback(async () => {
    try {
      const newStatuses: Record<string, ProjectStatus> = {};
      for (const project of projects) {
        const status: ProjectStatus = await invoke("get_project_status", { name: project.name });
        newStatuses[project.name] = status;
      }
      console.log("Frontend: Fetched statuses:", newStatuses);
      setStatuses(newStatuses);
    } catch (error) {
      console.error("Failed to fetch statuses:", error);
    }
  }, [projects]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  useEffect(() => {
    const unlistenStatus = listen("project_status_update", (event) => {
      const status = event.payload as ProjectStatus;
      console.log("Frontend: Received status update:", status);
      setStatuses(prev => {
        const updated = { ...prev };
        for (const [name, prevStatus] of Object.entries(prev)) {
          if (prevStatus.pid === status.pid || (!status.running && !status.pid)) {
            updated[name] = status;
            console.log(`Frontend: Updated status for ${name}:`, status);
            break;
          }
        }
        return updated;
      });
    });

    return () => {
      unlistenStatus.then(f => f());
    };
  }, []);

  const handleAddProject = async () => {
    if (!newProject.name.trim()) return;
    try {
      await invoke("add_project", { project: newProject });
      setNewProject({ name: "", path: "", desc: "", script: "start" });
      setShowForm(false);
      await fetchProjects();
      await fetchStatuses();
    } catch (error) {
      console.error("Failed to add project:", error);
    }
  };

  const handleRunProject = async (project: Project) => {
    try {
      await invoke("start_project", { name: project.name, path: project.path, script: project.script });
      await fetchStatuses();
    } catch (error) {
      console.error(`Failed to run ${project.name}:`, error);
    }
  };

  const handleStopProject = async (name: string) => {
    try {
      console.log(`Frontend: Stopping project ${name}`);
      await invoke("stop_project", { name });
      await fetchStatuses();
    } catch (error) {
      console.error(`Failed to stop ${name}:`, error);
    }
  };

  const handleDeleteProject = async (name: string) => {
    try {
      await invoke("delete_project", { name });
      await fetchProjects();
      await fetchStatuses();
    } catch (error) {
      console.error(`Failed to delete ${name}:`, error);
    }
  };

  const handleShowTerminal = (name: string) => {
    setSelectedProject(name);
  };

  if (selectedProject) {
    return <TerminalView projectName={selectedProject} onClose={() => setSelectedProject(null)} />;
  }

  return (
    <div style={{ color: "#333", padding: "20px" }}>
      <header style={{ display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>Local Projects</h1>
      </header>

      {projects.length === 0 ? (
        <p style={{ marginTop: "20px", color: "#666" }}>No projects yet. Add one to get started!</p>
      ) : (
        <motion.div
          style={{
            marginTop: "20px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: "20px",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {projects.map((project) => {
            const status = statuses[project.name] || { running: false };
            return (
              <motion.div
                key={project.name}
                style={{
                  background: "#ffffff",
                  padding: "15px",
                  borderRadius: "10px",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                }}
                whileHover={{ scale: 1.05, boxShadow: "0 6px 12px rgba(0,0,0,0.15)" }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <h2 style={{ fontSize: "18px", marginBottom: "10px" }}>{project.name}</h2>
                <p style={{ fontSize: "14px", color: "#666" }}>{project.path}</p>
                <p style={{ fontSize: "12px", color: "#888" }}>Script: {project.script}</p>
                <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
                  {!status.running ? (
                    <motion.button
                      onClick={() => handleRunProject(project)}
                      style={{
                        padding: "8px",
                        borderRadius: "5px",
                        border: "none",
                        backgroundColor: "white",
                        cursor: "pointer",
                      }}
                      whileHover={{ backgroundColor: "#e0e0e0" }}
                    >
                      <PlayArrow style={{ color: "green" }} />
                    </motion.button>
                  ) : (
                    <motion.button
                      onClick={() => handleStopProject(project.name)}
                      style={{
                        padding: "8px",
                        borderRadius: "5px",
                        border: "none",
                        backgroundColor: "white",
                        cursor: "pointer",
                      }}
                      whileHover={{ backgroundColor: "#e0e0e0" }}
                    >
                      <Stop style={{ color: "red" }} />
                    </motion.button>
                  )}
                  <motion.button
                    onClick={() => handleShowTerminal(project.name)}
                    style={{
                      padding: "8px",
                      borderRadius: "5px",
                      border: "none",
                      backgroundColor: "white",
                      cursor: "pointer",
                    }}
                    whileHover={{ backgroundColor: "#e0e0e0" }}
                    >
                    <Terminal style={{ color: "blue" }} />
                  </motion.button>
                  <motion.button
                    onClick={() => handleDeleteProject(project.name)}
                    style={{
                      padding: "8px",
                      borderRadius: "5px",
                      border: "none",
                      backgroundColor: "white",
                      cursor: "pointer",
                    }}
                    whileHover={{ backgroundColor: "#e0e0e0" }}
                    >
                    <Delete style={{ color: "red" }} />
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <motion.button
        onClick={() => setShowForm(true)}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          background: "#2196f3",
          padding: "15px",
          borderRadius: "50%",
          border: "none",
          cursor: "pointer",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "50px",
          height: "50px",
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Add style={{ fontSize: 20, color: "white" }} />
      </motion.button>
      <AnimatePresence>
        {showForm && (
          <AddProjectModal
            newProject={newProject}
            setNewProject={setNewProject}
            handleAddProject={handleAddProject}
            setShowForm={setShowForm}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;