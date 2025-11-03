import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QuestionType } from "@prisma/client";

/**
 * Import quiz data from JSON format
 * POST /api/templates/import
 *
 * Expected JSON format:
 * {
 *   "title": "Quiz Title",
 *   "description": "Quiz description",
 *   "category": "Category",
 *   "isPublic": true,
 *   "questions": [
 *     {
 *       "text": "Question text",
 *       "type": "MULTIPLE_CHOICE",
 *       "options": ["Option 1", "Option 2", "Option 3"],
 *       "correctAnswer": "Option 1",
 *       "points": 10,
 *       "timeLimit": 30,
 *       "imageUrl": "optional url"
 *     }
 *   ]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, category, isPublic, questions } = body;

    // Validate required fields
    if (!title || !category || !questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: "Missing required fields: title, category, questions" },
        { status: 400 }
      );
    }

    // Only admin users can create public templates
    if (isPublic && !session.user.isAdmin) {
      return NextResponse.json(
        { error: "Only admin users can create public templates" },
        { status: 403 }
      );
    }

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "At least one question is required" },
        { status: 400 }
      );
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text || !q.type || !q.correctAnswer) {
        return NextResponse.json(
          {
            error: `Question ${
              i + 1
            } is missing required fields: text, type, correctAnswer`,
          },
          { status: 400 }
        );
      }

      if (
        ![
          "MULTIPLE_CHOICE",
          "CHECKBOX",
          "TRUE_FALSE",
          "IMAGE_CHOICE",
          "TEXT_INPUT",
        ].includes(q.type)
      ) {
        return NextResponse.json(
          { error: `Question ${i + 1} has invalid type: ${q.type}` },
          { status: 400 }
        );
      }

      if (
        ["MULTIPLE_CHOICE", "CHECKBOX", "TRUE_FALSE", "IMAGE_CHOICE"].includes(
          q.type
        ) &&
        (!q.options || !Array.isArray(q.options) || q.options.length < 2)
      ) {
        return NextResponse.json(
          { error: `Question ${i + 1} must have at least 2 options` },
          { status: 400 }
        );
      }
    }

    // Create template with questions in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create template
      const template = await tx.template.create({
        data: {
          title,
          description: description || "",
          category,
          isPublic: isPublic !== undefined ? isPublic : true,
          creatorId: session.user.id,
        },
      });

      // Create questions
      const createdQuestions = await Promise.all(
        questions.map(
          (
            q: {
              text: string;
              type: string;
              options?: string[];
              correctAnswer: string;
              imageUrl?: string;
              points?: number;
              timeLimit?: number;
            },
            index: number
          ) =>
            tx.question.create({
              data: {
                templateId: template.id,
                text: q.text,
                type: q.type as QuestionType,
                options: q.options || [],
                correctAnswer: q.correctAnswer,
                imageUrl: q.imageUrl || null,
                points: q.points || 10,
                timeLimit: q.timeLimit || null,
                order: index,
              },
            })
        )
      );

      return {
        template,
        questions: createdQuestions,
      };
    });

    return NextResponse.json(
      {
        message: "Template imported successfully",
        template: result.template,
        questionsCount: result.questions.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error importing template:", error);
    return NextResponse.json(
      { error: "Failed to import template" },
      { status: 500 }
    );
  }
}
