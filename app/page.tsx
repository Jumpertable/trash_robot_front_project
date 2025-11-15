"use client";

import Home from "./Home";
import MQTTProvider from "./components/MQTT";

export default function Page() {
  return (
    <MQTTProvider>
      <Home />
    </MQTTProvider>
  );
}
