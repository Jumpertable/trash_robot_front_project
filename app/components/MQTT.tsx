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
  lineStatus: string;
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
  const [lidState, setLidState] = useState("Closed");
  const [lineStatus, setLineStatus] = useState("I'm lost");
  const [destination, setDestination] = useState("Home");

  const clientRef = useRef<MqttClient | null>(null);
  const lastDistanceRef = useRef<number>(0);

  // MQTT CONNECT
  useEffect(() => {
    const url = "ws://10.245.47.109:9001"//"wss://broker.emqx.io/mqtt";
    const client = mqtt.connect(url);
    clientRef.current = client;

    client.on("connect", () => {
      setStatus("Connected");
      client.subscribe(["trashrobot/status", "trashrobot/line", "destination", "logs"]);
      setLogs((prev) => [...prev, "✅ Connected to MQTT"]);
    });

    client.on("message", (topic, message) => {
      const payload = message.toString();
//lid please work
      if (topic === "trashrobot/status") {
        if (payload.includes("Lid Open")) setLidState("Open");
        else if (payload.includes("Lid Closed")) setLidState("Closed");

        if (payload.startsWith("Arrived at")) {
          const loc = payload.replace("Arrived at ", "").replace("!", "");
          setDestination(loc);
          setLogs((prev) => [...prev, `Arrived at ${loc}`]);
        }

        setLogs((prev) => [...prev, payload]);
      }

      //LINEFOLLWR
      if (topic === "trashrobot/line") {
        setLineStatus(payload);
      }

      //log
      if (topic === "logs") {
        setLogs((prev) => [...prev, payload]);
      }

      // DESTINATION AND DISTANCE PLEASE PLEASE
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

  //CANCEL!!!!!
const cancel = () => {
  if (!clientRef.current || status !== "Connected") {
    setLogs((prev) => [...prev, "Canot cancel. MQTT not ready"]);
    return;
  }

  console.log("Cancel triggered! Publishing to topic 'cancel'"); //debuggre
  setLogs((prev) => [...prev, "Cancel! Binny is returning home!"]);
  clientRef.current.publish("cancel", "cancel");
};

  //send da commands
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
        lineStatus
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
