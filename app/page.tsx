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

  const clientRef = useRef<mqtt.MqttClient | null>(null);
  const queueRef = useRef<Destination[]>([]);
  const busyRef = useRef(false);
  const visitedRef = useRef<Visited[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocRef = useRef("Home");
  const lastDistRef = useRef(0);
  const cancelActiveRef = useRef(false);


  //mQTT setup

  useEffect(() => {
    const url = "ws://192.168.1.116:9001";
    const mqttClient = mqtt.connect(url);
    clientRef.current = mqttClient;
    mqttClient.subscribe("trashrobot/status");

    mqttClient.on("connect", () => {
      setStatus("Connected to MQTT");
      mqttClient.subscribe("destination");
      mqttClient.subscribe("logs");
      setLogs(prev => [...prev, "✅ Connected to MQTT"]);
    });

mqttClient.on("message", (topic, message) => {
  const payload = message.toString();

  if (topic === "logs") {
    setLogs(prev => [...prev, payload]);
  } else if (topic === "destination") {
    try {
      const data = JSON.parse(payload);
      setDestination(data.location || "Unknown");
    } catch {
      setDestination(payload);
    }
  } else if (topic === "trashrobot/status") {
    setLogs(prev => [...prev, payload]);
  }
});


    mqttClient.on("error", (err) => {
      console.error("MQTT Error:", err);
      setStatus("MQTT Connection Error");
      setLogs(prev => [...prev, "MQTT Connection Error"]);
    });

    return () => {
      mqttClient.end();
    };
  }, []);


  //Process next destination
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
          visitedRef.current.push({ location: current.location, timestamp: Date.now() });
          setLogs(prev => [...prev, `Arrived at ${current.location}`]);
        }
        setTimeout(processNext, 3000);
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


//Cancel and return home
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


  //Send command
  const sendCommand = (loc: string, dist: number) => {
    clientRef.current?.publish("buttons/robot", JSON.stringify({ location: loc, distance: dist }));
    setLogs(prev => [...prev, `Sent: ${loc}`]);
    addDestination(loc, dist);
  };

  const clearLogs = () => setLogs([]);

  //UI

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
        Status: <strong>{status}</strong> | Current: <strong>{destination || "—"}</strong>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-6 w-full max-w-md">
        {destinations.map(d => (
          <button
            key={d.name}
            onClick={() => sendCommand(d.name, d.distance)}
            className={`bg-${d.color}-400 hover:bg-${d.color}-500 text-white py-3 px-6 rounded-xl shadow`}
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
