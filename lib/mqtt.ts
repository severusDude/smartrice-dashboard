import mqtt from "mqtt";
import { EventEmitter } from "events";
import { latestData } from "./data";

export const mqttEmitter = new EventEmitter();
let mqttClient: mqtt.MqttClient | null = null;

export function initMQTT() {
  if (mqttClient) return mqttClient;

  mqttClient = mqtt.connect("mqtt://broker.hivemq.com:1883", {
    clientId: `nextjs_ricecooker_${Math.random().toString(16).slice(2)}`,
    reconnectPeriod: 5000,
  });

  mqttClient.on("connect", () => {
    console.log("✅ Connected to HiveMQ broker");
    mqttClient?.subscribe(
      ["smartrice/data/#", "smartrice/pemanas"],
      { qos: 1 },
      (err) => {
        if (err) console.error("Subscribe error:", err);
        else
          console.log("Subscribed to smartrice/data/# and smartrice/pemanas");
      },
    );
  });

  mqttClient.on("message", (topic: string, message: Buffer) => {
    const payload = message.toString();
    console.log(`[${topic}] ${payload}`);

    if (topic === "smartrice/data/temp") latestData.temp = parseFloat(payload);
    else if (topic === "smartrice/data/humidity")
      latestData.humidity = parseFloat(payload);
    else if (topic === "smartrice/data/berat")
      latestData.berat = parseInt(payload);
    else if (topic === "smartrice/data/status") latestData.status = payload;

    latestData.lastUpdated = new Date();

    // Broadcast to ALL SSE clients
    mqttEmitter.emit("update", { ...latestData });
  });

  mqttClient.on("error", (err) => console.error("MQTT Error:", err));

  return mqttClient;
}

export function getLatestData() {
  return { ...latestData };
}

export function publishPemanas(command: "ON" | "OFF") {
  if (mqttClient && (command === "ON" || command === "OFF")) {
    mqttClient.publish("smartrice/pemanas", command, { qos: 1 });
    console.log(`📤 Sent command: ${command}`);
  }
}
