export interface RiceCookerData {
  temp: number;
  humidity: number;
  berat: number;
  status: string;
  lastUpdated: Date;
}

export let latestData: RiceCookerData = {
  temp: 0,
  humidity: 0,
  berat: 0,
  status: "Unknown",
  lastUpdated: new Date(),
};
