"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Question = {
  id: string;
  type: string;
  text: string;
  imageUrl: string | null;
  options: string[];
  order: number;
  points: number;
  timeLimit: number | null;
};

type Response = {
  id: string;
  questionId: string;
  participantId: string;
  answer: string;
  isCorrect: boolean;
  points: number;
};

type Session = {
  id: string;
  code: string;
  status: string;
  mode: string;
  currentQuestionId: string | null;
  template: {
    title: string;
    description: string | null;
    questions: Question[];
  };
  participants: Array<{
    id: string;
    name: string;
    score: number;
  }>;
  responses: Response[];
};

type Props = {
  session: Session;
};

export default function PlayClient({ session: initialSession }: Props) {
  const router = useRouter();
  const [session, setSession] = useState(initialSession);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState<string>("");
  const [participantId, setParticipantId] = useState<string>("");
  const [participantName, setParticipantName] = useState<string>("");
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(
    new Set()
  );
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timerExpired, setTimerExpired] = useState(false);

  useEffect(() => {
    // Get participant info from sessionStorage
    const pid = sessionStorage.getItem("participantId");
    const pname = sessionStorage.getItem("participantName");

    if (!pid || !pname) {
      router.push(`/join?redirect=/play/${session.id}`);
      return;
    }

    setParticipantId(pid);
    setParticipantName(pname);

    // Find questions this participant has already answered
    const participantResponses = session.responses.filter(
      (r) => r.participantId === pid
    );
    const answeredQuestionIds = new Set(
      participantResponses.map((r) => r.questionId)
    );
    setAnsweredQuestions(answeredQuestionIds);

    // Find the first unanswered question
    const firstUnansweredIndex = session.template.questions.findIndex(
      (q) => !answeredQuestionIds.has(q.id)
    );

    if (firstUnansweredIndex !== -1) {
      setCurrentQuestionIndex(firstUnansweredIndex);
    } else {
      // All questions answered, go to last question
      setCurrentQuestionIndex(session.template.questions.length - 1);
    }
  }, [router, session.id, session.responses, session.template.questions]);

  // Set up SSE connection for real-time leaderboard updates
  useEffect(() => {
    const eventSource = new EventSource(`/api/sessions/${session.id}/stream`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "leaderboard_updated") {
        // Update leaderboard in real-time
        setSession((prev) => ({
          ...prev,
          participants: data.leaderboard,
        }));
      } else if (data.type === "status_changed") {
        // Update status
        setSession((prev) => ({
          ...prev,
          status: data.status,
        }));
      } else if (data.type === "question_changed") {
        // Host changed the current question (HOST_CONTROLLED mode)
        setSession((prev) => ({
          ...prev,
          currentQuestionId: data.currentQuestionId,
        }));

        // Find the index of the new question and navigate to it
        if (data.currentQuestionId) {
          const newIndex = session.template.questions.findIndex(
            (q) => q.id === data.currentQuestionId
          );
          if (newIndex >= 0) {
            setCurrentQuestionIndex(newIndex);
            // Reset UI state for new question
            setSelectedAnswer("");
            setShowResult(false);
            setIsCorrect(false);
            setCorrectAnswer("");
            setTimerExpired(false);
          }
        }
      }
    };

    eventSource.onerror = () => {
      console.error("SSE connection error");
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [session.id, session.template.questions]);

  const currentQuestion = session.template.questions[currentQuestionIndex];
  const isLastQuestion =
    currentQuestionIndex === session.template.questions.length - 1;

  // Timer effect
  useEffect(() => {
    // Reset timer when question changes
    setTimerExpired(false);

    // Stop timer if session is cancelled or completed
    if (session.status === "CANCELLED" || session.status === "COMPLETED") {
      setTimeLeft(null);
      return;
    }

    const handleTimeOut = async () => {
      if (!participantId || answeredQuestions.has(currentQuestion.id)) return;

      // Don't submit timeout if session is no longer active
      if (session.status === "CANCELLED" || session.status === "COMPLETED") {
        return;
      }

      try {
        const response = await fetch("/api/responses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: session.id,
            questionId: currentQuestion.id,
            participantId,
            answer: "", // Empty answer for timeout
            timedOut: true, // Flag to indicate timeout
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setIsCorrect(false);
          setCorrectAnswer(data.correctAnswer);
          setShowResult(true);
          setAnsweredQuestions(
            (prev) => new Set([...prev, currentQuestion.id])
          );
        }
      } catch (error) {
        console.error("Error submitting timeout:", error);
      }
    };

    if (
      currentQuestion.timeLimit &&
      !answeredQuestions.has(currentQuestion.id) &&
      !showResult
    ) {
      setTimeLeft(currentQuestion.timeLimit);

      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            setTimerExpired(true);
            // Auto-submit with zero points
            handleTimeOut();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else {
      setTimeLeft(null);
    }
  }, [
    currentQuestionIndex,
    currentQuestion.id,
    currentQuestion.timeLimit,
    answeredQuestions,
    showResult,
    participantId,
    session.id,
    session.status,
  ]);

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !participantId || timerExpired) return;

    // Check if session is still active
    if (session.status === "CANCELLED" || session.status === "COMPLETED") {
      alert("This session has ended. You can no longer submit answers.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          questionId: currentQuestion.id,
          participantId,
          answer: selectedAnswer,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit answer");
      }

      setIsCorrect(data.isCorrect);
      setCorrectAnswer(data.correctAnswer);
      setShowResult(true);

      // Mark this question as answered
      setAnsweredQuestions((prev) => new Set([...prev, currentQuestion.id]));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to submit answer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      router.push(`/session/${session.id}/results`);
    } else {
      // Go to next question sequentially
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer("");
      setShowResult(false);
      setIsCorrect(false);
      setCorrectAnswer("");
    }
  };

  if (!participantId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {session.template.title}
              </h1>
              <p className="text-sm text-gray-600">
                Welcome, {participantName}!
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                Code:{" "}
                <span className="font-mono font-bold text-purple-600">
                  {session.code}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                Answered: {answeredQuestions.size} /{" "}
                {session.template.questions.length}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Host Controlled Mode Banner */}
      {session.mode === "HOST_CONTROLLED" &&
        session.status === "IN_PROGRESS" && (
          <div className="bg-purple-600 text-white py-3">
            <div className="container mx-auto px-4 text-center">
              <p className="text-sm font-medium">
                🎮 Host-Controlled Mode: The host will navigate through
                questions
              </p>
            </div>
          </div>
        )}

      {/* Session Ended Banner */}
      {(session.status === "CANCELLED" || session.status === "COMPLETED") && (
        <div
          className={`${
            session.status === "CANCELLED" ? "bg-red-600" : "bg-blue-600"
          } text-white py-4`}
        >
          <div className="container mx-auto px-4 text-center">
            <p className="text-lg font-bold">
              {session.status === "CANCELLED"
                ? "⚠️ This session has been cancelled by the host"
                : "🎉 This session has ended"}
            </p>
            <p className="text-sm mt-1">You can no longer submit answers</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>
                {answeredQuestions.size} / {session.template.questions.length}{" "}
                answered
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    (answeredQuestions.size /
                      session.template.questions.length) *
                    100
                  }%`,
                }}
              ></div>
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            {answeredQuestions.has(currentQuestion.id) && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm font-medium">
                  ✓ You have already answered this question
                </p>
              </div>
            )}

            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full">
                  {currentQuestion.type.replace(/_/g, " ")}
                </span>
                <div className="flex items-center gap-3">
                  {timeLeft !== null && (
                    <div
                      className={`flex items-center gap-2 px-3 py-1 rounded-full font-semibold text-sm ${
                        timeLeft <= 10
                          ? "bg-red-100 text-red-700 animate-pulse"
                          : timeLeft <= 30
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      <span>⏱️</span>
                      <span>{timeLeft}s</span>
                    </div>
                  )}
                  <span className="text-sm text-gray-600">
                    {currentQuestion.points} points
                  </span>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {currentQuestion.text}
              </h2>

              {currentQuestion.imageUrl && (
                <div className="mb-6">
                  <img
                    src={currentQuestion.imageUrl}
                    alt="Question"
                    className="max-w-md mx-auto rounded-lg shadow-md"
                  />
                </div>
              )}
            </div>

            {/* Answer Options */}
            {!showResult ? (
              <div className="space-y-3 mb-6">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedAnswer(option)}
                    disabled={
                      submitting ||
                      session.status === "CANCELLED" ||
                      session.status === "COMPLETED"
                    }
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      selectedAnswer === option
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-purple-300"
                    } ${
                      submitting ||
                      session.status === "CANCELLED" ||
                      session.status === "COMPLETED"
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                          selectedAnswer === option
                            ? "border-purple-500 bg-purple-500"
                            : "border-gray-300"
                        }`}
                      >
                        {selectedAnswer === option && (
                          <div className="w-3 h-3 bg-white rounded-full"></div>
                        )}
                      </div>
                      <span className="font-medium">{option}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mb-6">
                <div
                  className={`p-6 rounded-lg ${
                    timerExpired
                      ? "bg-orange-50 border-2 border-orange-200"
                      : isCorrect
                      ? "bg-green-50 border-2 border-green-200"
                      : "bg-red-50 border-2 border-red-200"
                  }`}
                >
                  <p
                    className={`text-lg font-bold mb-2 ${
                      timerExpired
                        ? "text-orange-800"
                        : isCorrect
                        ? "text-green-800"
                        : "text-red-800"
                    }`}
                  >
                    {timerExpired
                      ? "⏰ Time Expired!"
                      : isCorrect
                      ? "✅ Correct!"
                      : "❌ Incorrect"}
                  </p>
                  {timerExpired && (
                    <p className="text-gray-700">
                      Time ran out! The correct answer was:{" "}
                      <span className="font-bold">{correctAnswer}</span>
                    </p>
                  )}
                  {!isCorrect && !timerExpired && (
                    <p className="text-gray-700">
                      The correct answer was:{" "}
                      <span className="font-bold">{correctAnswer}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Action Button */}
            {!showResult ? (
              <>
                <button
                  onClick={handleSubmitAnswer}
                  disabled={
                    !selectedAnswer ||
                    submitting ||
                    answeredQuestions.has(currentQuestion.id) ||
                    timerExpired ||
                    session.status === "CANCELLED" ||
                    session.status === "COMPLETED"
                  }
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {session.status === "CANCELLED"
                    ? "Session Cancelled"
                    : session.status === "COMPLETED"
                    ? "Session Ended"
                    : submitting
                    ? "Submitting..."
                    : timerExpired
                    ? "Time Expired"
                    : answeredQuestions.has(currentQuestion.id)
                    ? "Already Answered"
                    : "Submit Answer"}
                </button>
                {timerExpired && (
                  <p className="text-center text-sm text-red-600 mt-2">
                    You ran out of time for this question (0 points)
                  </p>
                )}
                {(session.status === "CANCELLED" ||
                  session.status === "COMPLETED") && (
                  <p className="text-center text-sm text-red-600 mt-2">
                    {session.status === "CANCELLED"
                      ? "This session has been cancelled. No more answers can be submitted."
                      : "This session has ended. No more answers can be submitted."}
                  </p>
                )}
              </>
            ) : (
              <div>
                {session.mode === "HOST_CONTROLLED" ? (
                  <div className="text-center">
                    <div className="w-full px-6 py-4 bg-purple-100 border-2 border-purple-300 text-purple-800 font-semibold rounded-lg mb-2">
                      ⏳ Waiting for host to move to next question...
                    </div>
                    <p className="text-sm text-gray-600">
                      The host will advance everyone to the next question
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    disabled={
                      session.status === "CANCELLED" ||
                      session.status === "COMPLETED"
                    }
                    className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isLastQuestion ? "View Results" : "Next Question →"}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Leaderboard - Only shown on completion */}
          {session.status === "COMPLETED" &&
            session.participants.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  🏆 Final Standings
                </h3>
                <div className="space-y-2">
                  {session.participants.map((participant, index) => (
                    <div
                      key={participant.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        participant.id === participantId
                          ? "bg-purple-50"
                          : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-400">
                          #{index + 1}
                        </span>
                        <span
                          className={`font-medium ${
                            participant.id === participantId
                              ? "text-purple-700"
                              : "text-gray-900"
                          }`}
                        >
                          {participant.name}
                        </span>
                      </div>
                      <span className="font-bold text-purple-600">
                        {participant.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      </main>
    </div>
  );
}
