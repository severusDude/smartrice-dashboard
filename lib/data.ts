export interface SensorData {
  temp: number; // °C from DS18B20
  weight: number; // grams from HX711
  gas: number; // raw analog value from MQ sensor (0-4095)
  humidity: number; // % from DHT22
  timestamp?: string;
}

export const RiceStatus = {
  Segar: "segar",
  Waspada: "waspada",
  Basi: "basi",
  Unavailable: "unavailable",
} as const;
export type RiceStatus = (typeof RiceStatus)[keyof typeof RiceStatus];

export interface ProcessedData {
  freshnessScore: number; // 0-100
  status: RiceStatus;
}

export const RiceCookerStatus = {
  Cooking: "cooking",
  Heating: "heating",
  Spoiled: "spoiled",
  Standby: "standby",
  Off: "off",
  Unavailable: "unavailable",
} as const;

export type RiceCookerStatus =
  (typeof RiceCookerStatus)[keyof typeof RiceCookerStatus];
