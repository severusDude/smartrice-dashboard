import { NextResponse } from "next/server";
import { getLatestData, initMQTT } from "@/lib/mqtt";

export async function GET() {
  initMQTT(); // make sure MQTT is alive
  return NextResponse.json(getLatestData());
}
