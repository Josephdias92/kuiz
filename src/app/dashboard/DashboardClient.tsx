"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Template = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    questions: number;
    sessions: number;
  };
  creator?: {
    name: string | null;
    email: string;
  };
};

type Session = {
  id: string;
  code: string;
  status: string;
  createdAt: Date;
  template: {
    title: string;
  };
  _count: {
    participants: number;
  };
};

type Props = {
  initialTemplates: Template[];
  initialPublicTemplates: Template[];
  initialSessions: Session[];
};

export default function DashboardClient({
  initialTemplates,
  initialPublicTemplates,
  initialSessions,
}: Props) {
  const router = useRouter();
  const [templates] = useState(initialTemplates);
  const [publicTemplates] = useState(initialPublicTemplates);
  const [sessions] = useState(initialSessions);
  const [creatingSession, setCreatingSession] = useState<string | null>(null);
  const [showModeModal, setShowModeModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );

  const handleShowModeSelection = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setShowModeModal(true);
  };

  const handleStartSession = async (mode: "FREE_PLAY" | "HOST_CONTROLLED") => {
    if (!selectedTemplateId) return;

    setCreatingSession(selectedTemplateId);
    setShowModeModal(false);

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplateId,
          mode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create session");
      }

      // Redirect to session management page
      router.push(`/session/${data.id}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to start session");
    } finally {
      setCreatingSession(null);
      setSelectedTemplateId(null);
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

  return (
    <div className="space-y-8">
      {/* Templates Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Your Templates</h2>
          <Link
            href="/dashboard/templates/new"
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
          >
            + New Template
          </Link>
        </div>

        {templates.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <p className="text-gray-600 mb-4">
              You haven&apos;t created any templates yet.
            </p>
            <Link
              href="/dashboard/templates/new"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              Create Your First Template
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {template.title}
                    </h3>
                    <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                      {template.category}
                    </span>
                  </div>
                </div>

                {template.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {template.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span>📝 {template._count.questions} questions</span>
                  <span>🎯 {template._count.sessions} sessions</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleShowModeSelection(template.id)}
                    disabled={
                      creatingSession === template.id ||
                      template._count.questions === 0
                    }
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
                  >
                    {creatingSession === template.id
                      ? "Starting..."
                      : "Start Session"}
                  </button>
                  <Link
                    href={`/dashboard/templates/${template.id}`}
                    className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-purple-400 transition-all text-sm font-medium"
                  >
                    Edit
                  </Link>
                </div>

                {template._count.questions === 0 && (
                  <p className="text-xs text-red-600 mt-2">
                    Add questions to start a session
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Public Templates */}
      {publicTemplates.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Public Templates
          </h2>
          <p className="text-gray-600 mb-4">
            Browse and use templates created by the community
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all border-2 border-gray-100"
              >
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {template.title}
                  </h3>
                  {template.description && (
                    <p className="text-gray-600 text-sm mb-3">
                      {template.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                      {template.category}
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                      Public
                    </span>
                  </div>
                  {template.creator && (
                    <p className="text-xs text-gray-500">
                      By {template.creator.name || template.creator.email}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <span>📝 {template._count.questions} questions</span>
                  <span>🎮 {template._count.sessions} sessions</span>
                </div>

                <button
                  onClick={() => handleShowModeSelection(template.id)}
                  disabled={
                    creatingSession === template.id ||
                    template._count.questions === 0
                  }
                  className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
                >
                  {creatingSession === template.id
                    ? "Starting..."
                    : "Use This Template"}
                </button>

                {template._count.questions === 0 && (
                  <p className="text-xs text-red-600 mt-2">
                    No questions available
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Recent Sessions
        </h2>

        {sessions.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <p className="text-gray-600">
              No sessions yet. Start your first quiz session!
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Template
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participants
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {session.template.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono font-bold text-purple-600">
                        {session.code}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          session.status
                        )}`}
                      >
                        {session.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {session._count.participants}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/session/${session.id}`}
                        className="text-purple-600 hover:text-purple-900 font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mode Selection Modal */}
      {showModeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Choose Session Mode
            </h2>
            <p className="text-gray-600 mb-6">
              Select how you want to run this quiz session
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {/* Free Play Mode */}
              <button
                onClick={() => handleStartSession("FREE_PLAY")}
                disabled={creatingSession !== null}
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl group-hover:bg-blue-200 transition-all">
                    🎮
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                    Self-Paced
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Free Play
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Participants can navigate through questions at their own pace.
                  Perfect for self-assessment and practice.
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>✓ Participants control their progress</li>
                  <li>✓ Can skip and return to questions</li>
                  <li>✓ Great for homework/practice</li>
                </ul>
              </button>

              {/* Host Controlled Mode */}
              <button
                onClick={() => handleStartSession("HOST_CONTROLLED")}
                disabled={creatingSession !== null}
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all text-left group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl group-hover:bg-purple-200 transition-all">
                    🎯
                  </div>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                    Synchronized
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Host Controlled
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  You control which question everyone sees. Perfect for live
                  presentations and classroom settings.
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>✓ You advance all participants together</li>
                  <li>✓ Synchronized quiz experience</li>
                  <li>✓ Great for live events/classes</li>
                </ul>
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModeModal(false);
                  setSelectedTemplateId(null);
                }}
                disabled={creatingSession !== null}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
