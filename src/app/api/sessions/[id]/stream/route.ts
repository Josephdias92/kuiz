import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { addConnection, removeConnection } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;

  // Verify session exists
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    return new Response("Session not found", { status: 404 });
  }

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      // Add this connection
      addConnection(sessionId, controller);

      // Send initial connection message
      const data = `data: ${JSON.stringify({
        type: "connected",
        sessionId,
      })}\n\n`;
      controller.enqueue(new TextEncoder().encode(data));

      // Set up heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          const heartbeatData = `data: ${JSON.stringify({
            type: "heartbeat",
            timestamp: Date.now(),
          })}\n\n`;
          controller.enqueue(new TextEncoder().encode(heartbeatData));
        } catch {
          clearInterval(heartbeat);
          cleanup();
        }
      }, 30000); // Every 30 seconds

      // Cleanup function
      const cleanup = () => {
        clearInterval(heartbeat);
        removeConnection(sessionId, controller);
      };

      // Handle client disconnect
      request.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
