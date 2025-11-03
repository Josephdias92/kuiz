"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Participant = {
  id: string;
  name: string;
  score: number;
  joinedAt?: string | Date;
};

type Session = {
  id: string;
  code: string;
  status: string;
  mode: string;
  currentQuestionId: string | null;
  createdAt: string | Date;
  template: {
    title: string;
    description: string | null;
    questions: Array<{
      id: string;
      text: string;
      order: number;
    }>;
  };
  participants: Participant[];
};

type Props = {
  session: Session;
};

export default function SessionClient({ session: initialSession }: Props) {
  const router = useRouter();
  const [session, setSession] = useState(initialSession);
  const [updating, setUpdating] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Sync currentQuestionIndex with session.currentQuestionId
  useEffect(() => {
    if (session.currentQuestionId) {
      const index = session.template.questions.findIndex(
        (q) => q.id === session.currentQuestionId
      );
      if (index >= 0) {
        setCurrentQuestionIndex(index);
      }
    }
  }, [session.currentQuestionId, session.template.questions]);

  // Set up SSE connection for real-time updates
  useEffect(() => {
    const eventSource = new EventSource(`/api/sessions/${session.id}/stream`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "participant_joined") {
        // Add new participant to the list
        setSession((prev) => ({
          ...prev,
          participants: [...prev.participants, data.participant],
        }));
      } else if (data.type === "leaderboard_updated") {
        // Update leaderboard
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
      }
    };

    eventSource.onerror = () => {
      console.error("SSE connection error");
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [session.id]);

  const handleUpdateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update session");
      }

      router.refresh();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Failed to update session"
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleNavigateQuestion = async (
    direction: "next" | "prev" | "start"
  ) => {
    setUpdating(true);
    try {
      let newIndex = currentQuestionIndex;

      if (direction === "next") {
        newIndex = Math.min(
          currentQuestionIndex + 1,
          session.template.questions.length - 1
        );
      } else if (direction === "prev") {
        newIndex = Math.max(currentQuestionIndex - 1, 0);
      } else if (direction === "start") {
        newIndex = 0;
      }

      const questionId = session.template.questions[newIndex]?.id || null;

      const response = await fetch(`/api/sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentQuestionId: questionId }),
      });

      if (!response.ok) {
        throw new Error("Failed to update question");
      }

      setCurrentQuestionIndex(newIndex);
      setSession((prev) => ({
        ...prev,
        currentQuestionId: questionId,
      }));
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Failed to update question"
      );
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "WAITING":
        return "bg-yellow-100 text-yellow-800";
      case "IN_PROGRESS":
        return "bg-green-100 text-green-800";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const joinUrl = `${
    typeof window !== "undefined" ? window.location.origin : ""
  }/join`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            >
              ← Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Session Info Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {session.template.title}
              </h1>
              <p className="text-gray-600">{session.template.description}</p>

              <div className="mt-6 inline-block">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-2xl">
                  <p className="text-sm mb-2">Join Code</p>
                  <p className="text-5xl font-bold tracking-wider">
                    {session.code}
                  </p>
                  <p className="text-sm mt-4">Visit: {joinUrl}</p>
                </div>
              </div>

              <div className="mt-4 flex gap-2 items-center justify-center">
                <span
                  className={`px-4 py-2 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(
                    session.status
                  )}`}
                >
                  {session.status}
                </span>
                <span
                  className={`px-4 py-2 inline-flex text-sm leading-5 font-semibold rounded-full ${
                    session.mode === "HOST_CONTROLLED"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {session.mode === "HOST_CONTROLLED"
                    ? "🎯 Host Controlled"
                    : "🎮 Free Play"}
                </span>
              </div>
            </div>

            {/* Status Controls */}
            <div className="flex gap-4 justify-center mb-6">
              {session.status === "WAITING" && (
                <button
                  onClick={() => handleUpdateStatus("IN_PROGRESS")}
                  disabled={updating || session.participants.length === 0}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
                >
                  Start Quiz
                </button>
              )}

              {session.status === "IN_PROGRESS" && (
                <button
                  onClick={() => handleUpdateStatus("COMPLETED")}
                  disabled={updating}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all font-semibold"
                >
                  End Quiz
                </button>
              )}

              {session.status !== "CANCELLED" && (
                <button
                  onClick={() => handleUpdateStatus("CANCELLED")}
                  disabled={updating}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all font-semibold"
                >
                  Cancel Session
                </button>
              )}
            </div>

            {session.participants.length === 0 &&
              session.status === "WAITING" && (
                <p className="text-center text-gray-600">
                  Waiting for participants to join...
                </p>
              )}

            {/* Question Navigation for HOST_CONTROLLED mode */}
            {session.mode === "HOST_CONTROLLED" &&
              session.status === "IN_PROGRESS" && (
                <div className="mt-6 border-t pt-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
                    📋 Question Control
                  </h3>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-center mb-4">
                      <p className="text-sm text-gray-600 mb-1">
                        Current Question
                      </p>
                      <p className="text-2xl font-bold text-purple-900">
                        {currentQuestionIndex + 1} of{" "}
                        {session.template.questions.length}
                      </p>
                      <p className="text-sm text-gray-700 mt-2">
                        {session.template.questions[currentQuestionIndex]?.text}
                      </p>
                    </div>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleNavigateQuestion("start")}
                        disabled={updating || currentQuestionIndex === 0}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-sm"
                      >
                        ⏮ First
                      </button>
                      <button
                        onClick={() => handleNavigateQuestion("prev")}
                        disabled={updating || currentQuestionIndex === 0}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
                      >
                        ← Previous
                      </button>
                      <button
                        onClick={() => handleNavigateQuestion("next")}
                        disabled={
                          updating ||
                          currentQuestionIndex ===
                            session.template.questions.length - 1
                        }
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                </div>
              )}
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Participants/Leaderboard */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🏆 Leaderboard ({session.participants.length})
              </h2>

              {session.participants.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  No participants yet
                </p>
              ) : (
                <div className="space-y-3">
                  {session.participants.map((participant, index) => (
                    <div
                      key={participant.id}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        index === 0
                          ? "bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-400"
                          : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span
                          className={`text-2xl font-bold ${
                            index === 0 ? "text-yellow-600" : "text-gray-400"
                          }`}
                        >
                          {index === 0
                            ? "🥇"
                            : index === 1
                            ? "🥈"
                            : index === 2
                            ? "🥉"
                            : `#${index + 1}`}
                        </span>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {participant.name}
                          </p>
                          {participant.joinedAt && (
                            <p className="text-sm text-gray-600">
                              Joined{" "}
                              {new Date(
                                participant.joinedAt
                              ).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div
                        className={`text-2xl font-bold ${
                          index === 0 ? "text-yellow-600" : "text-purple-600"
                        }`}
                      >
                        {participant.score}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Questions */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                📝 Questions ({session.template.questions.length})
              </h2>

              <div className="space-y-2">
                {session.template.questions.map((question, index) => (
                  <div key={question.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900">
                      {index + 1}. {question.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Share Section */}
          <div className="mt-8 bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-purple-900 mb-4">
              📢 Share This Quiz
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-purple-700 mb-2">Join Code:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={session.code}
                    readOnly
                    className="flex-1 px-4 py-2 bg-white border-2 border-purple-300 rounded-lg font-mono font-bold text-center"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(session.code)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div>
                <p className="text-sm text-purple-700 mb-2">Join URL:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinUrl}
                    readOnly
                    className="flex-1 px-4 py-2 bg-white border-2 border-purple-300 rounded-lg text-sm"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(joinUrl)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
