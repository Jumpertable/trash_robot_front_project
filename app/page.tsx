"use client";

import { useEffect, useState, useRef } from "react";
import mqtt from "mqtt";

interface Destination {
  location: string;
  distance: number;
}

interface Visited {
  location: string;
  timestamp: number;
}

export default function Home() {
  const [status, setStatus] = useState("Disconnected");
  const [destination, setDestination] = useState("Home");
  const [logs, setLogs] = useState<string[]>([]);
  const [lidState, setLidState] = useState("Unknown");
  const [notification, setNotification] = useState("");

  const clientRef = useRef<mqtt.MqttClient | null>(null);
  const queueRef = useRef<Destination[]>([]);
  const busyRef = useRef(false);
  const lastLocRef = useRef("Home");
  const lastDistRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const cancelActiveRef = useRef(false);

  // Connect to MQTT
  useEffect(() => {
    const url = "ws://192.168.1.102:9001"; // change to your MQTT WebSocket URL
    const client = mqtt.connect(url);
    clientRef.current = client;

    client.on("connect", () => {
      setStatus("Connected to MQTT");
      client.subscribe(["trashrobot/status", "destination", "logs"]);
      setLogs(prev => [...prev, "✅ Connected to MQTT"]);
    });

    client.on("message", (topic, message) => {
      const payload = message.toString();

      // Lid monitoring
      if (topic === "trashrobot/status") {
        if (payload.includes("Lid Open")) {
          setLidState("Open");
          setNotification("Lid opened!");
        } else if (payload.includes("Lid Closed")) {
          setLidState("Closed");
          setNotification("Lid closed!");
        }
        setLogs(prev => [...prev, payload]);
      }

      // Logs
      if (topic === "logs") setLogs(prev => [...prev, payload]);

      // Destination updates
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
      setStatus("MQTT Connection Error");
      setLogs(prev => [...prev, "MQTT Connection Error"]);
    });

    return () => {
      client.end();
    };
  }, []);

  // Auto-hide lid notifications
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(""), 3000);
    return () => clearTimeout(timer);
  }, [notification]);

  // Process queued destinations
  const processNext = () => {
    if (queueRef.current.length === 0) {
      busyRef.current = false;
      return;
    }

    busyRef.current = true;
    const current = queueRef.current.shift()!;

    if (!busyRef.current && lastLocRef.current === current.location && current.location !== "Home") {
      setLogs(prev => [...prev, `⚠️ I'm already here, silly! (${current.location})`]);
      clientRef.current?.publish("trashrobot/status", `⚠️ I'm already here, silly! (${current.location})`);
      busyRef.current = false;
      processNext();
      return;
    }

    lastLocRef.current = current.location;
    if (current.location !== "Home") lastDistRef.current = current.distance;

    const direction = current.location === "Home" ? "return" : "go";
    let dist = current.distance;

    clientRef.current?.publish("destination", JSON.stringify({
      location: current.location,
      distance: current.distance,
      arrived: false
    }));

    intervalRef.current = setInterval(() => {
      if (cancelActiveRef.current) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        busyRef.current = false;
        return;
      }

      dist = Math.max(0, dist - 20);

      clientRef.current?.publish("destination", JSON.stringify({
        location: direction === "return" ? "Home" : current.location,
        distance: dist,
        arrived: false
      }));

      if (dist === 0) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;

        clientRef.current?.publish("destination", JSON.stringify({
          location: current.location,
          distance: 0,
          arrived: true
        }));

        if (direction !== "return") {
          setLogs(prev => [...prev, `Arrived at ${current.location}`]);
        }
        setTimeout(processNext, 1000);
      }
    }, 1000);
  };

  // Add new destination
  const addDestination = (loc: string, dist: number) => {
    if (!busyRef.current && lastLocRef.current === loc && loc !== "Home") {
      setLogs(prev => [...prev, `Already at ${loc}!`]);
      return;
    }

    if (!busyRef.current && queueRef.current.length === 0 && lastLocRef.current !== "Home") {
      queueRef.current.push({ location: "Home", distance: lastDistRef.current });
    }

    queueRef.current.push({ location: loc, distance: dist });

    if (!busyRef.current) processNext();
    else setLogs(prev => [...prev, "Robot busy. Added to queue."]);
  };

  // Cancel and return home
  const cancel = () => {
    setLogs(prev => [...prev, "⚠️ Cancel pressed — returning home"]);
    clientRef.current?.publish("cancel", "true");

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    cancelActiveRef.current = true;
    queueRef.current = [];

    if (lastLocRef.current !== "Home") {
      queueRef.current.push({ location: "Home", distance: lastDistRef.current });
    }

    processNext();
    cancelActiveRef.current = false;
    busyRef.current = true;
  };

  // Send movement command
  const sendCommand = (loc: string, dist: number) => {
    clientRef.current?.publish("buttons/robot", JSON.stringify({ location: loc, distance: dist }));
    setLogs(prev => [...prev, `Sent: ${loc}`]);
    addDestination(loc, dist);
  };

  const clearLogs = () => setLogs([]);

  // UI colors
  const colorMap: Record<string, string> = {
    orange: "bg-orange-400 hover:bg-orange-500",
    green: "bg-green-400 hover:bg-green-500",
    blue: "bg-blue-400 hover:bg-blue-500",
    purple: "bg-purple-400 hover:bg-purple-500",
    pink: "bg-pink-400 hover:bg-pink-500",
  };

  const destinations = [
    { name: "Home", distance: 100, color: "orange" },
    { name: "Kitchen", distance: 140, color: "green" },
    { name: "Living Room", distance: 150, color: "blue" },
    { name: "Bedroom", distance: 120, color: "purple" },
    { name: "Bathroom", distance: 200, color: "pink" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Trash Robot Dashboard</h1>

      {/* Status */}
      <div className="mb-4 px-4 py-2 bg-white rounded-xl shadow text-gray-600">
        Status: <strong>{status}</strong> | Current: <strong>{destination}</strong> | Lid: <strong>{lidState}</strong>
      </div>

      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 bg-blue-400 text-white px-4 py-2 rounded shadow-lg">
          {notification}
        </div>
      )}

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-6 w-full max-w-md">
        {destinations.map(d => (
          <button
            key={d.name}
            onClick={() => sendCommand(d.name, d.distance)}
            className={`${colorMap[d.color]} text-white py-3 px-6 rounded-xl shadow`}
          >
            {d.name}
          </button>
        ))}
        <button
          onClick={clearLogs}
          className="bg-red-400 hover:bg-red-500 text-white py-3 px-6 rounded-xl shadow"
        >
          Clear Logs
        </button>
        <button
          onClick={cancel}
          className="bg-yellow-400 hover:bg-yellow-500 text-white py-3 px-6 rounded-xl shadow"
        >
          Cancel & Return Home
        </button>
      </div>

      {/* Logs */}
      <div className="w-full max-w-md bg-white rounded-xl shadow p-4">
        <h2 className="text-lg font-semibold mb-2 text-gray-700">🧾 Logs</h2>
        <div className="h-48 overflow-y-auto text-sm text-gray-600 space-y-1">
          {logs.length > 0 ? (
            logs.map((log, i) => (
              <div key={i} className={i === logs.length - 1 ? "font-bold text-green-600" : ""}>
                • {log}
              </div>
            ))
          ) : (
            <div>No logs yet...</div>
          )}
        </div>
      </div>
    </div>
  );
}
