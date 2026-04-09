import { NextResponse } from "next/server";
import { publishPemanas, initMQTT } from "@/lib/mqtt";

export async function POST(request: Request) {
  initMQTT();
  try {
    const { command } = await request.json();

    if (command === "ON" || command === "OFF") {
      publishPemanas(command);
      return NextResponse.json({ success: true, command });
    }

    return NextResponse.json(
      { error: "Command must be ON or OFF" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
