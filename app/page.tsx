<<<<<<< HEAD
"use client";

import { useEffect, useState } from "react";
import mqtt from "mqtt";

export default function Home() {
  const [client, setClient] = useState(null);
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState("Disconnected");
  const [destination, setDestination] = useState("Home");

  // MQTT setup
  useEffect(() => {
    const url = "ws://192.168.1.116:1883"; // Change to your MQTT WebSocket port
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
    return () => mqttClient.end();
  }, []);

  // Send button payloads
  const sendCommand = (location, distance) => {
    if (!client) return;
    const payload = JSON.stringify({ location, distance });
    client.publish("buttons/robot", payload);
    setLogs((prev) => [...prev, `📦 Sent: ${location}`]);
  };

  const clearLogs = () => setLogs([]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">🤖 Trash Robot Dashboard</h1>

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
=======
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            To get started, edit the page.tsx file.
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Looking for a starting point or more instructions? Head over to{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Learning
            </a>{" "}
            center.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
>>>>>>> 7df66c4349869c62df1cd0960d072eaba82c88c5
    </div>
  );
}
