"use client";

import { useEffect, useState } from "react";
import {
  Thermometer,
  Droplets,
  Weight,
  Clock,
  Sun,
  PowerOff,
} from "lucide-react";

import {
  SensorData,
  ProcessedData,
  RiceStatus,
  RiceCookerStatus,
} from "@/lib/data";

interface RiceCookerData extends SensorData, ProcessedData {
  riceCookerStatus: RiceCookerStatus;
}

interface KpiCardProps {
  label: string;
  value: number | string;
  unit: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  className?: string;
}

function KpiCard({
  label,
  value,
  unit,
  icon,
  iconBg,
  iconColor,
  className = "",
}: KpiCardProps) {
  return (
    <div
      className={`bg-white border border-gray-100 rounded-2xl p-5 ${className}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}
        >
          <span className={iconColor}>{icon}</span>
        </div>
        <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-medium text-gray-900 leading-none">
          {value}
        </span>
        <span className="text-sm text-gray-400 font-normal">{unit}</span>
      </div>
    </div>
  );
}

function getRiceStatusDisplay(status: RiceStatus) {
  const map: Record<RiceStatus, { label: string; color: string; bg: string }> =
    {
      [RiceStatus.Segar]: {
        label: "Segar",
        color: "text-emerald-700",
        bg: "bg-emerald-50",
      },
      [RiceStatus.Waspada]: {
        label: "Waspada",
        color: "text-amber-700",
        bg: "bg-amber-50",
      },
      [RiceStatus.Basi]: {
        label: "Basi!",
        color: "text-red-700",
        bg: "bg-red-50",
      },
      [RiceStatus.Unavailable]: {
        label: "Unavailable",
        color: "text-gray-500",
        bg: "bg-gray-100",
      },
    };
  return map[status] || map[RiceStatus.Unavailable];
}

function getRiceCookerStatusDisplay(status: RiceCookerStatus) {
  const map: Record<RiceCookerStatus, { label: string; color: string }> = {
    [RiceCookerStatus.Cooking]: { label: "Cooking", color: "text-emerald-600" },
    [RiceCookerStatus.Heating]: { label: "Heating", color: "text-emerald-600" },
    [RiceCookerStatus.Spoiled]: { label: "Spoiled", color: "text-red-600" },
    [RiceCookerStatus.Standby]: { label: "Standby", color: "text-gray-500" },
    [RiceCookerStatus.Off]: { label: "Off", color: "text-gray-500" },
    [RiceCookerStatus.Unavailable]: {
      label: "Unavailable",
      color: "text-gray-500",
    },
  };
  return map[status] || map[RiceCookerStatus.Unavailable];
}

const getFreshnessColor = (score: number) => {
  if (score >= 70) return { text: "text-emerald-600", bg: "bg-emerald-50" };
  if (score >= 40) return { text: "text-amber-600", bg: "bg-amber-50" };
  return { text: "text-red-600", bg: "bg-red-50" };
};

export default function App() {
  const [data, setData] = useState<RiceCookerData>({
    temp: 0,
    weight: 0,
    gas: 0,
    humidity: 0,
    freshnessScore: 0,
    status: RiceStatus.Unavailable,
    riceCookerStatus: RiceCookerStatus.Unavailable,
  });

  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [relativeTime, setRelativeTime] = useState("just now");

  // SSE live updates
  useEffect(() => {
    const eventSource = new EventSource("/api/rice-cooker-updates");

    eventSource.onmessage = (event) => {
      const raw = JSON.parse(event.data);

      const updatedData: RiceCookerData = {
        ...raw,
        // Ensure all fields exist (safety)
        temp: raw.temp ?? 0,
        weight: raw.weight ?? 0,
        gas: raw.gas ?? 0,
        humidity: raw.humidity ?? 0,
        freshnessScore: raw.freshnessScore ?? 0,
        status: raw.status ?? RiceStatus.Unavailable,
        riceCookerStatus: raw.riceCookerStatus ?? RiceCookerStatus.Unavailable,
      };

      setData(updatedData);
      setLastRefresh(new Date());
    };

    eventSource.onerror = () => {
      console.error("SSE connection error");
    };

    return () => eventSource.close();
  }, []);

  // Live relative time updater
  useEffect(() => {
    const updateTime = () => setRelativeTime(getRelativeTime(lastRefresh));
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, [lastRefresh]);

  // Toggle heater
  const toggleHeater = async (cmd: "ON" | "OFF") => {
    try {
      const res = await fetch("/api/pemanas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd }),
      });

      if (!res.ok) throw new Error("Failed to send command");
    } catch (err) {
      console.error("Heater command failed:", err);
    }
  };

  const riceStatusDisplay = getRiceStatusDisplay(data.status);
  const cookerDisplay = getRiceCookerStatusDisplay(data.riceCookerStatus);
  const freshnessStyle = getFreshnessColor(data.freshnessScore);

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl uppercase font-semibold text-gray-900">
                Smartrice
              </h1>
            </div>

            <span className="text-gray-400 text-sm font-medium">
              {new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl px-6 py-4 flex justify-between items-center gap-6">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                Live Sensor Dashboard
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs text-gray-400">Last refreshed</span>
                <p className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  {relativeTime}
                </p>
              </div>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>
          </div>
        </div>

        {/* KPI Grid - 2x2 */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <KpiCard
            label="Temperature"
            value={data.temp}
            unit="°C"
            icon={<Thermometer size={16} />}
            iconBg="bg-orange-50"
            iconColor="text-orange-500"
          />
          <KpiCard
            label="Humidity"
            value={data.humidity}
            unit="%"
            icon={<Droplets size={16} />}
            iconBg="bg-blue-50"
            iconColor="text-blue-500"
          />
          <KpiCard
            label="Weight"
            value={data.weight}
            unit="g"
            icon={<Weight size={16} />}
            iconBg="bg-violet-50"
            iconColor="text-violet-500"
          />
          <KpiCard
            label="Freshness"
            value={data.freshnessScore}
            unit="%"
            icon={<Clock size={16} />}
            iconBg={freshnessStyle.bg}
            iconColor={freshnessStyle.text}
          />
        </div>

        {/* Rice Condition */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Clock size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                Status Nasi
              </p>
              <p className="text-base font-medium text-gray-900 mt-0.5">
                {riceStatusDisplay.label}
              </p>
            </div>
          </div>
          <span
            className={`text-xs font-medium px-3 py-1 rounded-full ${riceStatusDisplay.bg} ${riceStatusDisplay.color}`}
          >
            {riceStatusDisplay.label}
          </span>
        </div>

        {/* Rice Cooker Controls */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
              Rice Cooker Status
            </p>
            <span
              className={`text-xs font-medium px-3 py-1 rounded-full ${cookerDisplay.color === "text-emerald-600" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}
            >
              {cookerDisplay.label}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span
                className={`text-5xl font-semibold tracking-tighter transition-colors ${
                  data.riceCookerStatus === RiceCookerStatus.Heating ||
                  data.riceCookerStatus === RiceCookerStatus.Cooking
                    ? "text-emerald-600"
                    : "text-gray-300"
                }`}
              >
                {data.riceCookerStatus === RiceCookerStatus.Heating ||
                data.riceCookerStatus === RiceCookerStatus.Cooking
                  ? "ON"
                  : "OFF"}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => toggleHeater("ON")}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium hover:bg-emerald-100 transition-colors"
              >
                <Sun size={17} />
                ON
              </button>
              <button
                onClick={() => toggleHeater("OFF")}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                <PowerOff size={17} />
                OFF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 10) return "just now";
  if (diffSec < 60) return `${diffSec} seconds ago`;

  const minutes = Math.floor(diffSec / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  }

  const hours = Math.floor(minutes / 60);
  return `${hours} hour${hours > 1 ? "s" : ""} ago`;
};
