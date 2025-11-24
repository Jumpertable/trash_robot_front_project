"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DestButtons from "./components/destButtons"; 
import LogsPanel from "./components/Logs"; 
import StatusBar from "./components/statusBar";
import { useMQTT } from "./components/MQTT";
import useTrashRobot from "./hooks/trashRobot";

export default function Home() {
  const { status, logs, clearLogs, lidState, lineStatus, destination: mqttDestination } = useMQTT();
  const { sendCommand, cancel, processNext } = useTrashRobot();

  const [destination, setDestination] = useState(mqttDestination);
  const [notification, setNotification] = useState("");

  //MQTT 
  useEffect(() => {
    setDestination(mqttDestination);
  }, [mqttDestination]);

  //lid notif
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

  //start processing queue on mount
  useEffect(() => {
    processNext((loc: string) => setDestination(loc));
  }, []);

return (
<div className="min-h-screen bg-gradient-to-br from-sky-300 via-teal-200 to-emerald-300 flex flex-col items-center p-10 font-sans overflow-hidden relative">
<div className="absolute inset-0 overflow-hidden pointer-events-none">
</div>


<motion.h1
initial={{ opacity: 0, y: -20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.6 }}
className="text-5xl font-bold text-white drop-shadow-md mb-8 tracking-wide"
>
Trash Robot Dashboard
</motion.h1>


<motion.div
  className="w-full max-w-4xl mx-auto flex flex-col md:flex-row gap-6 mb-6"
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.6 }}
>
  {/*StatusBar*/}
  <div className="flex-1 backdrop-blur-xl bg-white/40 shadow-2xl rounded-3xl border border-white/50 p-6 flex items-center justify-center">
    <StatusBar
      status={status}
      destination={destination}
      lidState={lidState}
      lineStatus={lineStatus}
    />
  </div>

  {/*Buttons*/}
  <div className="flex-1 backdrop-blur-xl bg-white/40 shadow-2xl rounded-3xl border border-white/50 p-6 pb-2 flex items-center justify-center">
    <DestButtons
      sendCommand={sendCommand}
      clearLogs={clearLogs}
      cancel={() => {
        console.log("Cancel triggered from home.tsx");
        cancel((loc) => setDestination(loc));
      }}
    />
  </div>
</motion.div>

{notification && (
<div className="fixed top-4 right-4 backdrop-blur-xl bg-blue-300/70 text-white px-6 py-3 rounded-2xl shadow-lg border border-white/30">
{notification}
</div>
)}

<motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-4xl backdrop-blur-xl bg-white/40 shadow-2xl rounded-3xl border border-white/50 p-6"
    >
      <div className="flex justify-center">
        <LogsPanel logs={logs} clearLogs={clearLogs} />
      </div>
    </motion.div>
  </div>
);
}