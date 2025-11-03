import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastToSession } from "@/lib/sse";
import { SessionStatus } from "@prisma/client";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        template: {
          include: {
            questions: {
              orderBy: { order: "asc" },
            },
          },
        },
        participants: {
          orderBy: { score: "desc" },
        },
        responses: {
          include: {
            question: true,
            participant: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, currentQuestionId } = body;

    // Handle status update
    if (status) {
      if (
        !["WAITING", "IN_PROGRESS", "COMPLETED", "CANCELLED"].includes(status)
      ) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }

      const updateData: {
        status: SessionStatus;
        startedAt?: Date;
        endedAt?: Date;
      } = { status: status as SessionStatus };

      if (status === "IN_PROGRESS") {
        updateData.startedAt = new Date();
      } else if (status === "COMPLETED") {
        updateData.endedAt = new Date();
      }

      const session = await prisma.session.update({
        where: { id },
        data: updateData,
        include: {
          participants: {
            orderBy: { score: "desc" },
          },
        },
      });

      // Broadcast status change
      broadcastToSession(id, {
        type: "status_changed",
        status,
      });

      return NextResponse.json(session);
    }

    // Handle currentQuestionId update (for HOST_CONTROLLED mode)
    if (currentQuestionId !== undefined) {
      const session = await prisma.session.update({
        where: { id },
        data: { currentQuestionId },
        include: {
          template: {
            include: {
              questions: {
                orderBy: { order: "asc" },
              },
            },
          },
        },
      });

      // Broadcast question change to all participants
      broadcastToSession(id, {
        type: "question_changed",
        currentQuestionId,
      });

      return NextResponse.json(session);
    }

    return NextResponse.json(
      { error: "No valid update provided" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}
