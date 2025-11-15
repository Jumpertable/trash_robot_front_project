"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import mqtt, { MqttClient } from "mqtt";

interface Destination {
  location: string;
  distance: number;
}

interface MQTTContextType {
  client: MqttClient | null;
  status: string;
  logs: string[];
  lidState: string;
  destination: string;
  sendCommand: (loc: string, dist: number) => void;
}

const MQTTContext = createContext<MQTTContextType | undefined>(undefined);

interface MQTTProviderProps {
  children: ReactNode;
}

export default function MQTTProvider({ children }: MQTTProviderProps) {
  const [status, setStatus] = useState("Disconnected");
  const [logs, setLogs] = useState<string[]>([]);
  const [lidState, setLidState] = useState("Unknown");
  const [destination, setDestination] = useState("Home");

  const clientRef = useRef<MqttClient | null>(null);

  // Connect to MQTT
  useEffect(() => {
    const url = "ws://192.168.1.102:9001";
    const client = mqtt.connect(url);
    clientRef.current = client;

    client.on("connect", () => {
      setStatus("Connected");
      client.subscribe(["trashrobot/status", "destination", "logs"]);
      setLogs(prev => [...prev, "✅ Connected to MQTT"]);
    });

    client.on("message", (topic, message) => {
      const payload = message.toString();

      if (topic === "trashrobot/status") {
        if (payload.includes("Lid Open")) setLidState("Open");
        else if (payload.includes("Lid Closed")) setLidState("Closed");

        setLogs(prev => [...prev, payload]);
      }

      if (topic === "logs") setLogs(prev => [...prev, payload]);

      if (topic === "destination") {
        try {
          const data = JSON.parse(payload);
          setDestination(data.location || "Unknown");
        } catch {
          setDestination(payload);
        }
      }
    });

    client.on("error", (err) => {
      console.error("MQTT Error:", err);
      setStatus("MQTT Error");
      setLogs(prev => [...prev, "MQTT Connection Error"]);
    });

    return () => {
      client.end();
    };
  }, []);

  const sendCommand = (loc: string, dist: number) => {
    clientRef.current?.publish(
      "buttons/robot",
      JSON.stringify({ location: loc, distance: dist })
    );
    setLogs(prev => [...prev, `Sent command: ${loc}`]);
  };

  return (
    <MQTTContext.Provider value={{ client: clientRef.current, status, logs, lidState, destination, sendCommand }}>
      {children}
    </MQTTContext.Provider>
  );
}

// Custom hook to use MQTT context
export const useMQTT = () => {
  const context = useContext(MQTTContext);
  if (!context) throw new Error("useMQTT must be used within an MQTTProvider");
  return context;
};
