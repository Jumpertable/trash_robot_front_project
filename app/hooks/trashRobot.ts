import { useRef } from "react";
import { useMQTT } from "../components/MQTT";

interface Destination {
  location: string;
  distance: number;
}

export default function useTrashRobot() {
  const { sendCommand } = useMQTT();

  const queueRef = useRef<Destination[]>([]);
  const busyRef = useRef(false);
  const lastLocRef = useRef("Home");
  const lastDistRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const cancelActiveRef = useRef(false);

  const processNext = () => {
    if (queueRef.current.length === 0) {
      busyRef.current = false;
      return;
    }

    busyRef.current = true;
    const current = queueRef.current.shift()!;
    lastLocRef.current = current.location;
    lastDistRef.current = current.distance;

    let dist = current.distance;
    const direction = current.location === "Home" ? "return" : "go";

    intervalRef.current = setInterval(() => {
      if (cancelActiveRef.current) {
        clearInterval(intervalRef.current!);
        busyRef.current = false;
        return;
      }

      dist = Math.max(0, dist - 20);

      sendCommand(current.location, dist);

      if (dist === 0) {
        clearInterval(intervalRef.current!);
        setTimeout(processNext, 3000);
      }
    }, 1000);
  };

  const addDestination = (loc: string, dist: number) => {
    if (!busyRef.current && lastLocRef.current === loc && loc !== "Home") return;
    queueRef.current.push({ location: loc, distance: dist });
    if (!busyRef.current) processNext();
  };

  const cancel = () => {
    cancelActiveRef.current = true;
    queueRef.current = [];
    if (lastLocRef.current !== "Home") {
      queueRef.current.push({ location: "Home", distance: lastDistRef.current });
    }
    processNext();
    cancelActiveRef.current = false;
  };

  return {
    sendCommand,
    addDestination,
    cancel,
  };
}
