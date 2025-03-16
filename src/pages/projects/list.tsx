import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { invoke } from "@tauri-apps/api/core";
import { Add, Delete, PlayArrow, Stop } from "@mui/icons-material";
import AddProjectModal from "./add";

interface Project {
  name: string;
  path: string;
  desc: string;
  script: string;
}

const App = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", path: "", desc: "", script: "start" });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const projects: Project[] = await invoke("get_projects");
      console.log("Frontend: Fetched projects:", projects);
      setProjects(projects);
    } catch (error) {
      console.error("Frontend: Failed to fetch projects:", error);
      setProjects([]); // Default to empty array on error
    }
  };

  const handleAddProject = async () => {
    if (!newProject.name.trim()) return;
    try {
      console.log("Frontend: Adding project:", newProject);
      await invoke("add_project", { project: newProject });
      setNewProject({ name: "", path: "", desc: "", script: "start" });
      setShowForm(false);
      await fetchProjects(); // Refresh the project list
    } catch (error) {
      console.error("Frontend: Failed to add project:", error);
    }
  };

  const handleRunProject = (name: string) => {
    console.log(`Frontend: Running ${name}...`);
  };

  const handleDeleteProject = async (name: string) => {
    try {
      console.log(`Frontend: Deleting ${name}...`);
      await invoke("delete_project", { name }); // Assuming delete_project is added
      await fetchProjects(); // Refresh the list
    } catch (error) {
      console.error(`Frontend: Failed to delete ${name}:`, error);
    }
  };

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
          {projects.map((project) => (
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
                <motion.button
                  onClick={() => handleRunProject(project.name)}
                  style={{
                    padding: "8px",
                    borderRadius: "5px",
                    border: "none",
                    backgroundColor: "white",
                    cursor: "pointer",
                  }}
                >
                  <PlayArrow style={{ color: "green" }} />
                </motion.button>
                <motion.button
                  style={{
                    background: "white",
                    padding: "8px",
                    borderRadius: "5px",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <Stop />
                </motion.button>
                <motion.button
                  onClick={() => handleDeleteProject(project.name)}
                  style={{
                    background: "white",
                    padding: "8px",
                    borderRadius: "5px",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <Delete style={{ color: "red" }} />
                </motion.button>
              </div>
            </motion.div>
          ))}
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
        <Add style={{ fontSize: 20, color: "white", display: "block" }} />
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