import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Fetch quiz data from Open Trivia DB
 * GET /api/templates/fetch?amount=10&category=9&difficulty=easy
 *
 * Categories:
 * 9: General Knowledge
 * 10: Entertainment: Books
 * 11: Entertainment: Film
 * 12: Entertainment: Music
 * 17: Science & Nature
 * 18: Science: Computers
 * 21: Sports
 * 22: Geography
 * 23: History
 * 27: Animals
 *
 * Difficulty: easy, medium, hard
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const amount = searchParams.get("amount") || "10";
    const category = searchParams.get("category") || "";
    const difficulty = searchParams.get("difficulty") || "";

    // Build Open Trivia DB API URL
    let url = `https://opentdb.com/api.php?amount=${amount}`;
    if (category) url += `&category=${category}`;
    if (difficulty) url += `&difficulty=${difficulty}`;
    url += "&type=multiple"; // Only multiple choice for now

    const response = await fetch(url);
    const data = await response.json();

    if (data.response_code !== 0) {
      return NextResponse.json(
        { error: "Failed to fetch questions from API" },
        { status: 400 }
      );
    }

    // Transform Open Trivia DB format to our format
    const questions = data.results.map(
      (q: {
        question: string;
        correct_answer: string;
        incorrect_answers: string[];
        category: string;
        difficulty: string;
      }) => {
        // Decode HTML entities
        const decodeHTML = (html: string) => {
          const txt = document.createElement("textarea");
          txt.innerHTML = html;
          return txt.value;
        };

        const allOptions = [...q.incorrect_answers, q.correct_answer];
        // Shuffle options
        const shuffledOptions = allOptions.sort(() => Math.random() - 0.5);

        return {
          text: decodeHTML(q.question),
          type: "MULTIPLE_CHOICE",
          options: shuffledOptions.map(decodeHTML),
          correctAnswer: decodeHTML(q.correct_answer),
          points:
            q.difficulty === "hard" ? 15 : q.difficulty === "medium" ? 10 : 5,
          timeLimit:
            q.difficulty === "hard" ? 30 : q.difficulty === "medium" ? 20 : 15,
        };
      }
    );

    const categoryName = data.results[0]?.category || "Trivia";
    const template = {
      title: `${categoryName} Quiz`,
      description: `Quiz with ${amount} questions from ${categoryName}`,
      category: categoryName.split(":")[0].trim(),
      isPublic: true,
      questions,
    };

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error fetching trivia:", error);
    return NextResponse.json(
      { error: "Failed to fetch trivia questions" },
      { status: 500 }
    );
  }
}
