import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSessionCode } from "@/lib/utils";
import { createSessionSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createSessionSchema.parse(body);

    // Verify template exists and user owns it
    const template = await prisma.template.findUnique({
      where: { id: validatedData.templateId },
      include: {
        questions: true,
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Allow if user owns the template OR if template is public
    if (template.creatorId !== session.user.id && !template.isPublic) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (template.questions.length === 0) {
      return NextResponse.json(
        { error: "Template must have at least one question" },
        { status: 400 }
      );
    }

    // Generate unique code
    let code = generateSessionCode();
    let existing = await prisma.session.findUnique({ where: { code } });

    while (existing) {
      code = generateSessionCode();
      existing = await prisma.session.findUnique({ where: { code } });
    }

    const quizSession = await prisma.session.create({
      data: {
        code,
        templateId: validatedData.templateId,
        hostId: session.user.id,
        status: "WAITING",
        mode: validatedData.mode,
      },
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

    return NextResponse.json(quizSession, { status: 201 });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
