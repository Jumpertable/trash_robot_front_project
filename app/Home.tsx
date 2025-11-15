"use client";

import { useState, useEffect } from "react";
import DestButtons from "./components/destButtons"; 
import LogsPanel from "./components/Logs"; 
import StatusBar from "./components/statusBar";
import { useMQTT } from "./components/MQTT";
import useTrashRobot from "./hooks/trashRobot";

export default function Home() {
  const { status, logs, clearLogs, lidState, destination: mqttDestination } = useMQTT();
  const { sendCommand, addDestination, cancel, processNext } = useTrashRobot();

  const [destination, setDestination] = useState(mqttDestination);
  const [notification, setNotification] = useState("");

  // Sync MQTT 
  useEffect(() => {
    setDestination(mqttDestination);
  }, [mqttDestination]);

  // lid notifications
  useEffect(() => {
    if (lidState === "Open") setNotification("Lid opened!");
    else if (lidState === "Closed") setNotification("Lid closed!");
  }, [lidState]);

  //go away notifications
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(""), 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  // Start processing queue on mount
  useEffect(() => {
    processNext((loc: string) => setDestination(loc));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Trash Robot Dashboard
      </h1>

      <StatusBar
        status={status}
        destination={destination}
        lidState={lidState}
      />

      {notification && (
        <div className="fixed top-4 right-4 bg-blue-400 text-white px-4 py-2 rounded shadow-lg">
          {notification}
        </div>
      )}

      <DestButtons
        sendCommand={sendCommand}
        clearLogs={clearLogs}
        cancel={() => cancel((loc: string) => setDestination(loc))}
      />

      <LogsPanel
        logs={logs}
        clearLogs={clearLogs}
      />
    </div>
  );
}
