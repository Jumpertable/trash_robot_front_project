"use client";

import { useEffect, useState } from "react";
import mqtt from "mqtt";

export default function Home() {
  const [client, setClient] = useState<mqtt.MqttClient | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState("Disconnected");
  const [destination, setDestination] = useState<string>("");

  // MQTT setup
useEffect(() => {
  const url = "ws://192.168.1.116:1883";
  const mqttClient = mqtt.connect(url);

  mqttClient.on("connect", () => {
    setStatus("Connected to MQTT");
    mqttClient.subscribe("destination");
    mqttClient.subscribe("logs");
  });

mqttClient.on("message", (topic, message) => {
  const payload = message.toString();
  if (topic === "logs") {
    setLogs((prev) => [...prev, payload]);
  } else if (topic === "destination") {
    try {
      const data = JSON.parse(payload);
      setDestination(data.location || "Unknown");
    } catch {
      setDestination(payload);
    }
  }
});

  mqttClient.on("error", (err) => {
    console.error("MQTT Error:", err);
    setStatus("MQTT Connection Error");
  });

  setClient(mqttClient);

  return () => { mqttClient.end(); };
}, []);


  // Send button payloads
  const sendCommand = (location: string, distance: number) => {
    if (!client) return;
    const payload = JSON.stringify({ location, distance });
    client.publish("buttons/robot", payload);
    setLogs((prev) => [...prev, `Sent: ${location}`]);
  };

  const clearLogs = () => setLogs([]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Trash Robot Dashboard</h1>

      {/* Connection Status */}
      <div className="mb-4 px-4 py-2 bg-white rounded-xl shadow text-gray-600">
        Status: <strong>{status}</strong> | Current: <strong>{destination}</strong>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => sendCommand("Home", 100)}
          className="bg-orange-300 hover:bg-orange-400 text-white py-3 px-6 rounded-xl shadow"
        >
          Go Back Home
        </button>
        <button
          onClick={() => sendCommand("Kitchen", 100)}
          className="bg-green-400 hover:bg-green-500 text-white py-3 px-6 rounded-xl shadow"
        >
          Kitchen
        </button>
        <button
          onClick={() => sendCommand("Living Room", 150)}
          className="bg-blue-400 hover:bg-blue-500 text-white py-3 px-6 rounded-xl shadow"
        >
          Living Room
        </button>
        <button
          onClick={() => sendCommand("Bedroom", 120)}
          className="bg-purple-400 hover:bg-purple-500 text-white py-3 px-6 rounded-xl shadow"
        >
          Bedroom
        </button>
        <button
          onClick={() => sendCommand("Bathroom", 200)}
          className="bg-pink-400 hover:bg-pink-500 text-white py-3 px-6 rounded-xl shadow"
        >
          Bathroom
        </button>
        <button
          onClick={clearLogs}
          className="bg-red-400 hover:bg-red-500 text-white py-3 px-6 rounded-xl shadow"
        >
          Clear Logs
        </button>
      </div>

      {/* Logs */}
      <div className="w-full max-w-md bg-white rounded-xl shadow p-4">
        <h2 className="text-lg font-semibold mb-2 text-gray-700">🧾 Logs</h2>
        <div className="h-48 overflow-y-auto text-sm text-gray-600 space-y-1">
          {logs.length > 0 ? (
            logs.map((log, i) => <div key={i}>• {log}</div>)
          ) : (
            <div>No logs yet...</div>
          )}
        </div>
      </div>
    </div>
  );
}
