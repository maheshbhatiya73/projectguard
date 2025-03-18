import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowBack } from "@mui/icons-material";
import { listen } from "@tauri-apps/api/event";

interface TerminalViewProps {
  projectName: string;
  onClose: () => void;
}

const TerminalView = ({ projectName, onClose }: TerminalViewProps) => {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    console.log(`Frontend: Setting up terminal listener for ${projectName}`);
    const unlisten = listen<string>("terminal_log", (event) => {
      const log = event.payload;
      console.log(`Frontend: Received log: ${log}`);
      if (log.startsWith(`${projectName}:`)) {
        setLogs(prev => [...prev, log.replace(`${projectName}: `, "")]);
      }
    });

    return () => {
      console.log(`Frontend: Cleaning up terminal listener for ${projectName}`);
      unlisten.then(f => f());
    };
  }, [projectName]);

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
        background: "#1e1e1e",
        color: "#ffffff",
        padding: "20px",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
        <motion.button
          onClick={onClose}
          style={{
            padding: "10px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#ffffff",
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ArrowBack />
        </motion.button>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", marginLeft: "10px" }}>
          Terminal - {projectName}
        </h1>
      </div>
      <div
        style={{
          flex: 1,
          background: "#2d2d2d",
          padding: "15px",
          borderRadius: "10px",
          overflowY: "auto",
          fontFamily: "monospace",
        }}
      >
        {logs.length === 0 ? (
          <p>No logs yet...</p>
        ) : (
          logs.map((log, index) => (
            <p key={index} style={{ margin: "5px 0" }}>{log}</p>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default TerminalView;