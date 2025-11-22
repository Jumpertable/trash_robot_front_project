"use client";

interface LogsPanelProps {
  logs: string[];
  clearLogs: () => void;
}

const logColors: Record<string, string> = {
  Home: "text-orange-600",
  Kitchen: "text-green-600",
  "Living Room": "text-blue-600",
  Bedroom: "text-purple-600",
  Bathroom: "text-pink-600",
};

function getRoomNameFromLog(log: string) {
  const rooms = Object.keys(logColors);
  return rooms.find((room) => log.includes(room)) || "";
}

export default function LogsPanel({ logs, clearLogs }: LogsPanelProps) {
  return (
    <div
      className="
        w-full max-w-2xl
        rounded-3xl
        shadow-2xl 
        p-6 
        backdrop-blur-xl 
        bg-white/40
        border border-white/50
      "
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-sky-800 drop-shadow-sm">
          Logs
        </h2>

        <button
          onClick={clearLogs}
          className="
            px-4 py-1.5 
            rounded-xl 
            text-white 
            text-sm 
            shadow 
            bg-gradient-to-r from-red-400 to-red-600
            hover:opacity-90
            transition
            cursor-pointer
          "
        >
          Clear
        </button>
      </div>

      {/* Logs container */}
      <div
        className="
          h-100 
          overflow-y-auto 
          rounded-2xl 
          p-4 
          border border-white/40 
          bg-white/30 
          backdrop-blur-xl 
          shadow-inner
        "
      >
        {logs.length === 0 ? (
          <p className="text-gray-500 text-sm italic">No logs yet…</p>
        ) : (
          [...logs].reverse().map((log, index) => {
            const room = getRoomNameFromLog(log);
            const colorClass = room ? logColors[room] : "text-gray-800";

            return (
              <div
                key={index}
                className={`
                  text-sm py-1 
                  border-b border-white/40 last:border-none
                  ${colorClass}
                `}
              >
                {log}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
