import { useRef } from "react";
import { useMQTT } from "../components/MQTT";

interface Destination {
  location: string;
  distance: number;
}

export default function useTrashRobot() {
  const { sendCommand, cancel: mqttCancel } = useMQTT();

  const queueRef = useRef<Destination[]>([]);
  const busyRef = useRef(false);
  const lastLocRef = useRef("Home");
  const lastDistRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const cancelActiveRef = useRef(false);

  const processNext = (onArrive?: (loc: string) => void) => {
    if (queueRef.current.length === 0) {
      busyRef.current = false;
      return;
    }

    busyRef.current = true;
    const current = queueRef.current.shift()!;
    lastLocRef.current = current.location;
    lastDistRef.current = current.distance;

    console.log("Starting trip to:", current.location, "Distance:", current.distance);

    let dist = current.distance;

    intervalRef.current = setInterval(() => {
      if (cancelActiveRef.current) {
        console.log("Trip cancelled mid-way!");
        clearInterval(intervalRef.current!);
        busyRef.current = false;
        return;
      }

      dist = Math.max(0, dist - 20);
      sendCommand(current.location, dist);

      if (dist === 0) {
        console.log("Arrived at:", current.location);
        clearInterval(intervalRef.current!);
        cancelActiveRef.current = false;
        onArrive?.(current.location);

        setTimeout(() => processNext(onArrive), 3000);
      }
    }, 1000);
  };

  const addDestination = (loc: string, dist: number, onArrive?: (loc: string) => void) => {
    if (!busyRef.current && lastLocRef.current === loc && loc !== "Home") return;
    queueRef.current.push({ location: loc, distance: dist });
    if (!busyRef.current) processNext(onArrive);
  };

  //Cancel trip and return home
  const cancel = (onArrive?: (loc: string) => void) => {
    console.log("Cancel triggered!");  //log
    cancelActiveRef.current = true;
    queueRef.current = [];

    if (lastLocRef.current !== "Home") {
      queueRef.current.push({
        location: "Home",
        distance: lastDistRef.current,
      });
    }


    mqttCancel();  

    processNext(onArrive);
  };

  return {
    sendCommand,
    addDestination,
    cancel,
    processNext,
  };
}
