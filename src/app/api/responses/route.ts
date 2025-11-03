import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { submitResponseSchema } from "@/lib/validations";
import { broadcastToSession } from "@/lib/sse";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = submitResponseSchema.parse(body);

    // Check session status
    const session = await prisma.session.findUnique({
      where: { id: validatedData.sessionId },
      select: { status: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Prevent answers if session is not in progress
    if (session.status === "CANCELLED") {
      return NextResponse.json(
        { error: "This session has been cancelled" },
        { status: 400 }
      );
    }

    if (session.status === "COMPLETED") {
      return NextResponse.json(
        { error: "This session has ended" },
        { status: 400 }
      );
    }

    if (session.status === "WAITING") {
      return NextResponse.json(
        { error: "This session hasn't started yet" },
        { status: 400 }
      );
    }

    // Get the question to check the answer
    const question = await prisma.question.findUnique({
      where: { id: validatedData.questionId },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // Check if answer is correct (timeouts are never correct)
    const isCorrect = validatedData.timedOut
      ? false
      : validatedData.answer === question.correctAnswer;
    const points = isCorrect ? question.points : 0;

    // Create response
    const response = await prisma.response.create({
      data: {
        sessionId: validatedData.sessionId,
        questionId: validatedData.questionId,
        participantId: validatedData.participantId,
        answer: validatedData.answer,
        isCorrect,
        points,
      },
    });

    // Update participant score
    if (isCorrect) {
      await prisma.participant.update({
        where: { id: validatedData.participantId },
        data: {
          score: {
            increment: points,
          },
        },
      });
    }

    // Get updated leaderboard
    const leaderboard = await prisma.participant.findMany({
      where: { sessionId: validatedData.sessionId },
      select: {
        id: true,
        name: true,
        score: true,
        joinedAt: true,
        responses: {
          select: { id: true },
        },
      },
      orderBy: [{ score: "desc" }, { joinedAt: "asc" }],
    });

    // Broadcast leaderboard update
    broadcastToSession(validatedData.sessionId, {
      type: "leaderboard_updated",
      leaderboard: leaderboard.map(
        (p: {
          id: string;
          name: string;
          score: number;
          joinedAt: Date;
          responses: { id: string }[];
        }) => ({
          id: p.id,
          name: p.name,
          score: p.score,
          answeredCount: p.responses.length,
        })
      ),
    });

    return NextResponse.json({
      ...response,
      correctAnswer: question.correctAnswer, // Send correct answer after submission
    });
  } catch (error) {
    console.error("Error submitting response:", error);
    return NextResponse.json(
      { error: "Failed to submit response" },
      { status: 500 }
    );
  }
}
