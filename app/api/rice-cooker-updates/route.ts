import { NextResponse } from "next/server";
import { mqttEmitter, initMQTT, getLatestData } from "@/lib/mqtt";

export async function GET(request: Request) {
  initMQTT();

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send latest data immediately on connect
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify(getLatestData())}\n\n`),
      );

      const listener = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      mqttEmitter.on("update", listener);

      // Cleanup when client disconnects
      request.signal.addEventListener("abort", () => {
        mqttEmitter.off("update", listener);
        console.log("SSE client disconnected");
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
