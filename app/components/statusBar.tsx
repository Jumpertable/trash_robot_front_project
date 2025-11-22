"use client";

interface StatusBarProps {
  status: string;
  destination: string;
  lidState: string;
  lineStatus: string;
}

export default function StatusBar({status, destination, lidState, lineStatus }: StatusBarProps) {
return (
  <div className="
    mb-4 px-6 py-3 
    rounded-3xl 
    shadow-xl 
    w-full max-w-md 
    text-center text-gray-700 
    border border-white/50 
    backdrop-blur-xl 
    bg-white/40 
    flex flex-col gap-1
  ">
    <div className="text-2xl font-semibold tracking-wide text-sky-400 drop-shadow">
      Robot Status
    </div>

    <div className="text-lg">
      <span className="font-medium text-emerald-600 drop-shadow">Status:</span> {status}
    </div>

    <div className="text-lg">
      <span className="font-medium text-amber-300 drop-shadow">Current:</span> {destination}
    </div>

    <div className="text-lg">
      <span className="font-medium text-pink-300 drop-shadow">Lid:</span> {lidState}
    </div>

    <div className="text-lg">
      <span className="font-medium text-purple-400 drop-shadow">Line:</span> {lineStatus}
    </div>
  </div>
);
}
