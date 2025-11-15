"use client";

interface StatusBarProps {
  status: string;
  destination: string;
  lidState: string;
}

export default function statusBar({ status, destination, lidState }: StatusBarProps) {
  return (
    <div className="mb-4 px-4 py-2 bg-white rounded-xl shadow text-gray-600 w-full max-w-md">
      Status: <strong>{status}</strong> | Current: <strong>{destination}</strong> | Lid: <strong>{lidState}</strong>
    </div>
  );
}
