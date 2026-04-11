import { ProcessedData, RiceStatus, SensorData } from "./data";

export function calculateFreshnessScore(gasRaw: number): number {
  // Inverse linear mapping (higher gasRaw = more VOCs = lower freshness)
  // RECOMMENDATION: Calibrate baseline in fresh-cooked rice (record gasRaw when temp >=60 °C)
  // and use dynamic score = Math.max(0, Math.min(100, Math.round(((baselineMax - gasRaw) / (baselineMax - baselineMin)) * 100)));
  const score = Math.round(((4095 - gasRaw) / 4095) * 100);
  return Math.max(0, Math.min(100, score));
}

export function determineRiceStatus(
  temp: number, // °C
  humidity: number, // %
  freshnessScore: number,
): RiceStatus {
  // Temp zones based on B. cereus microbiology
  const isKeepWarmSafe = temp >= 60; // bacterial growth strongly inhibited
  const isDangerZone = temp > 5 && temp < 60; // B. cereus can grow
  const highHumidityRisk = humidity > 80;
  const moderateHumidityRisk = humidity > 70;

  // Basi = clearly spoiled (very high VOC OR danger-zone conditions + high humidity)
  if (
    freshnessScore < 40 ||
    (!isKeepWarmSafe && isDangerZone && highHumidityRisk) ||
    (isDangerZone && freshnessScore < 35)
  ) {
    return RiceStatus.Basi;
  }

  // Waspada = early warning (moderate VOC or marginal environment)
  if (
    freshnessScore < 65 ||
    moderateHumidityRisk ||
    (isDangerZone && freshnessScore < 75)
  ) {
    return RiceStatus.Waspada;
  }

  // Segar = good condition (hot + low VOC)
  return RiceStatus.Segar;
}

export function processSensorData(raw: SensorData): ProcessedData {
  const freshnessScore = calculateFreshnessScore(raw.gas);
  const status = determineRiceStatus(raw.temp, raw.humidity, freshnessScore);

  // Future extension: use raw.weight and raw.timestamp for Unavailable / time-in-danger logic
  return {
    freshnessScore,
    status,
  };
}
