"use client";

interface Destination {
  name: string;
  distance: number;
  color: string;
}

interface RobotButtons {
  sendCommand: (loc: string, dist: number) => void;
  clearLogs: () => void;
  cancel: () => void;
}

export default function RobotButtons({
  sendCommand,
  clearLogs,
  cancel,
}: RobotButtons) {
  const colorMap: Record<string, string> = {
    orange: "bg-orange-400 hover:bg-orange-500",
    green: "bg-green-400 hover:bg-green-500",
    blue: "bg-blue-400 hover:bg-blue-500",
    purple: "bg-purple-400 hover:bg-purple-500",
    pink: "bg-pink-400 hover:bg-pink-500",
  };

  const destinations: Destination[] = [
    { name: "Home", distance: 100, color: "orange" },
    { name: "Kitchen", distance: 140, color: "green" },
    { name: "Living Room", distance: 150, color: "blue" },
    { name: "Bedroom", distance: 120, color: "purple" },
    { name: "Bathroom", distance: 200, color: "pink" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 mb-6 w-full max-w-md">
      {/*Destination Buttons */}
      {destinations.map((d) => (
        <button
          key={d.name}
          onClick={() => sendCommand(d.name, d.distance)}
          className={`${colorMap[d.color]} text-white py-3 px-6 rounded-xl shadow`}
        >
          {d.name}
        </button>
      ))}

      {/* Cancel and Return */}
      <button
        onClick={cancel}
        className="bg-yellow-400 hover:bg-yellow-500 text-white py-3 px-6 rounded-xl shadow"
      >
        Cancel and Return Home
      </button>
    </div>
  );
}
