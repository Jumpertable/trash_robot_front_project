"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
} from "react";
import mqtt, { MqttClient } from "mqtt";

interface DestinationMessage {
  location: string;
  distance: number;
}

interface MQTTContextType {
  client: MqttClient | null;
  status: string;
  logs: string[];
  clearLogs: () => void;
  lidState: string;
  destination: string;
  sendCommand: (loc: string, dist: number) => void;
  cancel: () => void;
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
  const lastDistanceRef = useRef<number>(0);

  // MQTT CONNECT
  useEffect(() => {
    const url = "ws://192.168.1.102:9001";
    const client = mqtt.connect(url);
    clientRef.current = client;

    client.on("connect", () => {
      setStatus("Connected");
      client.subscribe(["trashrobot/status", "destination", "logs"]);
      setLogs((prev) => [...prev, "✅ Connected to MQTT"]);
    });

    client.on("message", (topic, message) => {
      const payload = message.toString();

      // STATUS HANDLER
      if (topic === "trashrobot/status") {
        if (payload.includes("Lid Open")) setLidState("Open");
        else if (payload.includes("Lid Closed")) setLidState("Closed");

        // ARRIVED HANDLER
        if (payload.startsWith("Arrived at")) {
          const loc = payload.replace("Arrived at ", "").replace("!", "");
          setDestination(loc); // <-- correctly update CURRENT
          setLogs((prev) => [...prev, `🚩 Arrived at ${loc}`]);
        }

        setLogs((prev) => [...prev, payload]);
      }

      // LOG
      if (topic === "logs") {
        setLogs((prev) => [...prev, payload]);
      }

      // DESTINATION + DISTANCE
      if (topic === "destination") {
        try {
          const data: DestinationMessage = JSON.parse(payload);

          if (data.location) setDestination(data.location);
          if (typeof data.distance === "number")
            lastDistanceRef.current = data.distance;
        } catch {
          setDestination(payload);
        }
      }
    });

    client.on("error", (err) => {
      console.error("MQTT Error:", err);
      setStatus("MQTT Error");
      setLogs((prev) => [...prev, "MQTT Connection Error"]);
    });

    return () => {
      client.end();
    };
  }, []);

  // CANCEL FUNCTION
const cancel = () => {
  if (!clientRef.current || status !== "Connected") {
    setLogs((prev) => [...prev, "⚠ Cannot cancel — MQTT not ready"]);
    return;
  }

  console.log("Cancel triggered! Publishing to topic 'cancel'"); // <--- debug log
  setLogs((prev) => [...prev, "Cancel — robot returning home"]);
  clientRef.current.publish("cancel", "cancel");
};

  // SEND COMMAND

  const sendCommand = (loc: string, dist: number) => {
    clientRef.current?.publish(
      "buttons/robot",
      JSON.stringify({ location: loc, distance: dist })
    );
    setLogs((prev) => [...prev, `Command sent → ${loc}`]);
  };

  const clearLogs = () => setLogs([]);

  return (
    <MQTTContext.Provider
      value={{
        client: clientRef.current,
        status,
        logs,
        clearLogs,
        lidState,
        destination,
        sendCommand,
        cancel,
      }}
    >
      {children}
    </MQTTContext.Provider>
  );
}

export const useMQTT = () => {
  const context = useContext(MQTTContext);
  if (!context) throw new Error("useMQTT must be used within an MQTTProvider");
  return context;
};
