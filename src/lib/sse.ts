// SSE connection management
const connections = new Map<string, Set<ReadableStreamDefaultController>>();

export function addConnection(
  sessionId: string,
  controller: ReadableStreamDefaultController
) {
  if (!connections.has(sessionId)) {
    connections.set(sessionId, new Set());
  }
  connections.get(sessionId)!.add(controller);
}

export function removeConnection(
  sessionId: string,
  controller: ReadableStreamDefaultController
) {
  const sessionConnections = connections.get(sessionId);
  if (sessionConnections) {
    sessionConnections.delete(controller);
    if (sessionConnections.size === 0) {
      connections.delete(sessionId);
    }
  }
}

export interface SessionUpdateData {
  type:
    | "participant_joined"
    | "participant_left"
    | "status_changed"
    | "response_submitted"
    | "leaderboard_updated"
    | "question_changed"
    | "connected"
    | "heartbeat";
  sessionId?: string;
  timestamp?: number;
  participant?: {
    id: string;
    name: string;
    score: number;
  };
  status?: string;
  currentQuestionId?: string | null;
  leaderboard?: Array<{
    id: string;
    name: string;
    score: number;
    answeredCount: number;
  }>;
}

export function broadcastToSession(sessionId: string, data: SessionUpdateData) {
  const sessionConnections = connections.get(sessionId);
  if (!sessionConnections || sessionConnections.size === 0) {
    return;
  }

  const message = `data: ${JSON.stringify(data)}\n\n`;
  const encoded = new TextEncoder().encode(message);

  sessionConnections.forEach((controller) => {
    try {
      controller.enqueue(encoded);
    } catch {
      // Remove failed connections
      sessionConnections.delete(controller);
    }
  });
}
