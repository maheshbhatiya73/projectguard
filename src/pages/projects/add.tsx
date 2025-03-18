import { motion } from "framer-motion";
import { Dispatch, SetStateAction, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";

interface Project {
    name: string;
    path: string;
    desc: string;
    script: string;
}

interface AddProjectModalProps {
    newProject: Project;
    setNewProject: Dispatch<SetStateAction<Project>>;
    handleAddProject: () => void;
    setShowForm: Dispatch<SetStateAction<boolean>>;
}

const AddProjectModal = ({
    newProject,
    setNewProject,
    handleAddProject,
    setShowForm,
}: AddProjectModalProps) => {
    const theme = {
        primary: "#ff5733",
        primaryHover: "#e64a2e",
        secondary: "#ff8c66",
        text: "#333333",
        background: "#ffffff",
        overlay: "rgba(0, 0, 0, 0.6)",
    };

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSelectingPath, setIsSelectingPath] = useState(false);

    const scriptOptions = [
        { value: "start", label: "Start" },
        { value: "dev", label: "Development" },
        { value: "build", label: "Build" },
    ];

    const handleScriptSelect = (value: string) => {
        setNewProject({ ...newProject, script: value });
        setIsDropdownOpen(false);
    };

    const handleOpenFileExplorer = async () => {
        setIsSelectingPath(true);
        try {
            const selectedPath = await open({
                directory: true,
                multiple: false,
            });
            if (selectedPath) {
                setNewProject(prev => ({ ...prev, path: selectedPath as string }));
            }
        } catch (error) {
            console.error("Failed to open file explorer:", error);
        } finally {
            setIsSelectingPath(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: theme.overlay,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1000,
            }}
            onClick={() => setShowForm(false)}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                style={{
                    background: theme.background,
                    padding: "30px",
                    borderRadius: "20px",
                    width: "500px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                    border: `1px solid ${theme.secondary}30`,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <h2
                    style={{
                        fontSize: "24px",
                        marginBottom: "30px",
                        color: theme.text,
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                    }}
                >
                    Add New Project
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
                    <input
                        type="text"
                        placeholder="Project Name"
                        value={newProject.name}
                        onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                        style={{
                            padding: "14px 18px",
                            borderRadius: "10px",
                            border: `1px solid ${theme.secondary}50`,
                            fontSize: "15px",
                            outline: "none",
                            backgroundColor: "#f9fafb",
                            transition: "border-color 0.3s ease",
                        }}
                        onFocus={(e) => (e.target.style.borderColor = theme.primary)}
                        onBlur={(e) => (e.target.style.borderColor = `${theme.secondary}50`)}
                    />
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                        <input
                            type="text"
                            placeholder="Project Path"
                            value={newProject.path}
                            onChange={(e) => setNewProject({ ...newProject, path: e.target.value })}
                            style={{
                                padding: "14px 18px",
                                borderRadius: "10px",
                                border: `1px solid ${theme.secondary}50`,
                                fontSize: "15px",
                                outline: "none",
                                backgroundColor: "#f9fafb",
                                transition: "border-color 0.3s ease",
                                flex: 1,
                            }}
                            onFocus={(e) => (e.target.style.borderColor = theme.primary)}
                            onBlur={(e) => (e.target.style.borderColor = `${theme.secondary}50`)}
                        />
                        <motion.button
                            onClick={handleOpenFileExplorer}
                            disabled={isSelectingPath}
                            style={{
                                opacity: isSelectingPath ? 0.6 : 1,
                                padding: "10px",
                                marginLeft: "10px",
                                borderRadius: "10px",
                                border: `1px solid ${theme.secondary}50`,
                                backgroundColor: "#f9fafb",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                            whileHover={{ backgroundColor: theme.secondary + "20" }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {isSelectingPath ? "..." : "📁"}
                        </motion.button>
                    </div>
                    <input
                        type="text"
                        placeholder="Project Description"
                        value={newProject.desc}
                        onChange={(e) => setNewProject({ ...newProject, desc: e.target.value })}
                        style={{
                            padding: "14px 18px",
                            borderRadius: "10px",
                            border: `1px solid ${theme.secondary}50`,
                            fontSize: "15px",
                            outline: "none",
                            backgroundColor: "#f9fafb",
                            transition: "border-color 0.3s ease",
                        }}
                        onFocus={(e) => (e.target.style.borderColor = theme.primary)}
                        onBlur={(e) => (e.target.style.borderColor = `${theme.secondary}50`)}
                    />

                    {/* Custom Dropdown */}
                    <div style={{ position: "relative" }}>
                        <div
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            style={{
                                padding: "14px 18px",
                                borderRadius: "10px",
                                border: `1px solid ${theme.secondary}50`,
                                fontSize: "15px",
                                backgroundColor: "#f9fafb",
                                cursor: "pointer",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                transition: "border-color 0.3s ease",
                            }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = theme.primary)}
                            onBlur={(e) => (e.currentTarget.style.borderColor = `${theme.secondary}50`)}
                        >
                            <span>
                                {scriptOptions.find((opt) => opt.value === newProject.script)?.label ||
                                    "Select Script"}
                            </span>
                            <span style={{ fontSize: "12px" }}>{isDropdownOpen ? "▲" : "▼"}</span>
                        </div>
                        {isDropdownOpen && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: "100%",
                                    left: 0,
                                    right: 0,
                                    background: theme.background,
                                    borderRadius: "10px",
                                    border: `1px solid ${theme.secondary}30`,
                                    boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
                                    marginTop: "5px",
                                    zIndex: 10,
                                    overflow: "hidden",
                                }}
                            >
                                {scriptOptions.map((option) => (
                                    <div
                                        key={option.value}
                                        onClick={() => handleScriptSelect(option.value)}
                                        style={{
                                            padding: "12px 18px",
                                            fontSize: "15px",
                                            color: theme.text,
                                            cursor: "pointer",
                                            transition: "background-color 0.2s ease",
                                        }}
                                        onMouseEnter={(e) =>
                                            (e.currentTarget.style.backgroundColor = `${theme.secondary}20`)
                                        }
                                        onMouseLeave={(e) =>
                                            (e.currentTarget.style.backgroundColor = "transparent")
                                        }
                                    >
                                        {option.label}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ display: "flex", gap: "20px", justifyContent: "flex-end" }}>
                        <motion.button
                            onClick={() => setShowForm(false)}
                            style={{
                                padding: "12px 30px",
                                borderRadius: "30px",
                                border: `1px solid ${theme.secondary}`,
                                background: "transparent",
                                cursor: "pointer",
                                color: theme.primary,
                                fontWeight: 600,
                                fontSize: "14px",
                                transition: "all 0.3s ease",
                            }}
                            whileHover={{ backgroundColor: `${theme.secondary}15`, scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Cancel
                        </motion.button>
                        <motion.button
                            onClick={handleAddProject}
                            style={{
                                padding: "12px 30px",
                                borderRadius: "30px",
                                border: "none",
                                background: theme.primary,
                                color: "white",
                                cursor: "pointer",
                                fontWeight: 600,
                                fontSize: "14px",
                                transition: "all 0.3s ease",
                            }}
                            whileHover={{ backgroundColor: theme.primaryHover, scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Add Project
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default AddProjectModal;