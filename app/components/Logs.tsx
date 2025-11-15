"use client";

interface LogsPanel {
  logs: string[];
  clearLogs: () => void;
}

export default function LogsPanel({ logs, clearLogs }: LogsPanel) {
  return (
    <div className="w-full max-w-2xl mt-8 bg-white rounded-xl shadow p-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold text-gray-700">Logs</h2>

        <button
          onClick={clearLogs}
          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm"
        >
          Clear
        </button>
      </div>

      <div className="h-60 overflow-y-auto bg-gray-50 rounded-lg p-3 border">
        {logs.length === 0 ? (
          <p className="text-gray-400 text-sm">No logs yet…</p>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              className="text-sm text-gray-700 py-1 border-b last:border-none"
            >
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
