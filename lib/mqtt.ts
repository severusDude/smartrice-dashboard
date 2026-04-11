import mqtt from "mqtt";
import { EventEmitter } from "events";
import {
  SensorData,
  ProcessedData,
  RiceStatus,
  RiceCookerStatus,
} from "./data";
import { processSensorData } from "./smartriceCore";

export const mqttEmitter = new EventEmitter();
let mqttClient: mqtt.MqttClient | null = null;

let rawData: SensorData = {
  temp: 0,
  weight: 0,
  gas: 0,
  humidity: 0,
};

let latestProcessed: ProcessedData = {
  freshnessScore: 0,
  status: RiceStatus.Unavailable,
};

let riceCookerStatus: RiceCookerStatus = RiceCookerStatus.Unavailable;

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
    const payload = message.toString().trim();
    console.log(`[${topic}] ${payload}`);

    // Update raw sensor data
    if (topic === "smartrice/data/temp") {
      rawData.temp = parseFloat(payload) || 0;
    } else if (topic === "smartrice/data/weight") {
      rawData.weight = parseInt(payload) || 0;
    } else if (topic === "smartrice/data/gas") {
      rawData.gas = parseInt(payload) || 0;
    } else if (topic === "smartrice/data/humidity") {
      rawData.humidity = parseFloat(payload) || 0;
    } else if (topic === "smartrice/data/riceCookerStatus") {
      riceCookerStatus = payload as RiceCookerStatus;
    }

    // Process rice condition (uses refined smartriceCore.ts logic)
    const processedData = processSensorData(rawData);
    latestProcessed = processedData;

    // Broadcast FULL data to ALL SSE clients
    mqttEmitter.emit("update", {
      ...rawData,
      ...processedData,
      riceCookerStatus,
    });
  });

  mqttClient.on("error", (err) => console.error("MQTT Error:", err));

  return mqttClient;
}

export function getLatestData() {
  return {
    ...rawData,
    ...latestProcessed,
    riceCookerStatus,
  };
}

export function publishPemanas(command: "ON" | "OFF") {
  if (mqttClient && (command === "ON" || command === "OFF")) {
    mqttClient.publish("smartrice/pemanas", command, { qos: 1 });
    console.log(`📤 Sent command: ${command}`);
  }
}
