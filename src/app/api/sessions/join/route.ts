import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { joinSessionSchema } from "@/lib/validations";
import { broadcastToSession } from "@/lib/sse";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = joinSessionSchema.parse(body);

    const session = await prisma.session.findUnique({
      where: { code: validatedData.code },
      include: {
        template: {
          include: {
            questions: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                type: true,
                text: true,
                imageUrl: true,
                options: true,
                order: true,
                points: true,
                timeLimit: true,
                // Don't send correctAnswer to participants
              },
            },
          },
        },
        participants: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found. Please check the code." },
        { status: 404 }
      );
    }

    if (session.status === "COMPLETED" || session.status === "CANCELLED") {
      return NextResponse.json(
        { error: "This session has ended." },
        { status: 400 }
      );
    }

    // Create participant
    const participant = await prisma.participant.create({
      data: {
        sessionId: session.id,
        name: validatedData.name,
      },
    });

    // Broadcast participant joined event
    broadcastToSession(session.id, {
      type: "participant_joined",
      participant: {
        id: participant.id,
        name: participant.name,
        score: participant.score,
      },
    });

    return NextResponse.json({
      session: {
        id: session.id,
        code: session.code,
        status: session.status,
        template: session.template,
      },
      participant,
    });
  } catch (error) {
    console.error("Error joining session:", error);
    return NextResponse.json(
      { error: "Failed to join session" },
      { status: 500 }
    );
  }
}
