"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type QuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";

interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options: string[];
  correctAnswer: string;
  imageUrl?: string;
  points: number;
  timeLimit?: number;
  order: number;
}

interface Template {
  id: string;
  title: string;
  description?: string;
  category: string;
  isPublic: boolean;
  questions: Question[];
  creator: {
    id: string;
    name: string | null;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface TemplateEditorProps {
  templateId: string;
  userId: string;
  isAdmin: boolean;
}

export default function TemplateEditor({
  templateId,
  userId,
  isAdmin,
}: TemplateEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [template, setTemplate] = useState<Template | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Template metadata
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  // Questions
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    fetchTemplate();
  }, [templateId]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/templates/${templateId}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError("Template not found");
        } else {
          const data = await response.json();
          setError(data.error || "Failed to load template");
        }
        setLoading(false);
        return;
      }

      const data: Template = await response.json();
      setTemplate(data);
      setTitle(data.title);
      setDescription(data.description || "");
      setCategory(data.category);
      setIsPublic(data.isPublic);
      setQuestions(data.questions);
      setLoading(false);
    } catch (err) {
      setError("Failed to load template");
      setLoading(false);
    }
  };

  const updateCurrentQuestion = (updates: Partial<Question>) => {
    const newQuestions = [...questions];
    newQuestions[currentQuestionIndex] = { ...currentQuestion, ...updates };
    setQuestions(newQuestions);
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `temp-${Date.now()}`,
      text: "",
      type: "MULTIPLE_CHOICE",
      options: ["", "", "", ""],
      correctAnswer: "",
      points: 10,
      order: questions.length,
    };
    setQuestions([...questions, newQuestion]);
    setCurrentQuestionIndex(questions.length);
  };

  const deleteQuestion = (index: number) => {
    if (questions.length === 1) {
      setError("You must have at least one question");
      return;
    }
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
    if (currentQuestionIndex >= newQuestions.length) {
      setCurrentQuestionIndex(newQuestions.length - 1);
    }
  };

  const updateOption = (optionIndex: number, value: string) => {
    const newOptions = [...currentQuestion.options];
    newOptions[optionIndex] = value;
    updateCurrentQuestion({ options: newOptions });
  };

  const addOption = () => {
    if (currentQuestion.options.length >= 6) {
      setError("Maximum 6 options allowed");
      return;
    }
    updateCurrentQuestion({ options: [...currentQuestion.options, ""] });
  };

  const removeOption = (index: number) => {
    if (currentQuestion.options.length <= 2) {
      setError("Minimum 2 options required");
      return;
    }
    const newOptions = currentQuestion.options.filter((_, i) => i !== index);
    updateCurrentQuestion({ options: newOptions });
  };

  const validateTemplate = () => {
    if (!title.trim()) return "Template title is required";
    if (!category.trim()) return "Category is required";
    if (questions.length === 0) return "At least one question is required";

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) return `Question ${i + 1}: Text is required`;

      if (q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE") {
        const filledOptions = q.options.filter((opt) => opt.trim());
        if (filledOptions.length < 2) {
          return `Question ${i + 1}: At least 2 options required`;
        }
        if (!q.correctAnswer.trim()) {
          return `Question ${i + 1}: Correct answer must be selected`;
        }
        if (!filledOptions.includes(q.correctAnswer)) {
          return `Question ${i + 1}: Correct answer must be one of the options`;
        }
      }

      if (q.type === "SHORT_ANSWER" && !q.correctAnswer.trim()) {
        return `Question ${i + 1}: Correct answer is required`;
      }

      if (q.points <= 0) {
        return `Question ${i + 1}: Points must be greater than 0`;
      }
    }

    return null;
  };

  const handleSave = async () => {
    setError("");

    const validationError = validateTemplate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      // Update template metadata
      const templateRes = await fetch(`/api/templates/${templateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          isPublic,
        }),
      });

      if (!templateRes.ok) {
        const data = await templateRes.json();
        throw new Error(data.error || "Failed to update template");
      }

      // Delete existing questions (they will be recreated)
      // Note: Questions have cascade delete on template, but we manually delete to control the process
      const existingQuestions = template?.questions || [];
      const deletePromises = existingQuestions.map((q) =>
        fetch(`/api/questions?id=${q.id}`, { method: "DELETE" }).catch((err) =>
          console.warn(`Failed to delete question ${q.id}:`, err)
        )
      );
      await Promise.all(deletePromises);

      // Create new questions
      const questionPromises = questions.map(async (q, index) => {
        const cleanOptions = q.options.filter((opt) => opt.trim());

        const response = await fetch("/api/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            templateId: templateId,
            text: q.text,
            type: q.type,
            options: cleanOptions,
            correctAnswer: q.correctAnswer,
            imageUrl: q.imageUrl || undefined,
            points: q.points,
            timeLimit: q.timeLimit || undefined,
            order: index,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(
            `Question ${index + 1}: ${data.error || "Failed to create"}`
          );
        }

        return response.json();
      });

      await Promise.all(questionPromises);

      // Refresh template data
      await fetchTemplate();
      setIsEditing(false);
      setSaving(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this template? This action cannot be undone."
      )
    ) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete template");
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-4">Loading template...</p>
        </div>
      </div>
    );
  }

  if (error && !template) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-4"
        >
          ← Back to Dashboard
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <p className="text-red-800 text-lg">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!template) {
    return null;
  }

  const isOwner = template.creator.id === userId;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-4"
        >
          ← Back to Dashboard
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              {isEditing ? "Edit Template" : "View Template"}
            </h1>
            <p className="text-gray-600 mt-2">
              {isEditing
                ? "Make changes to your template"
                : `Created by ${
                    template.creator.name || template.creator.email
                  }`}
            </p>
          </div>
          {isOwner && !isEditing && (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-6">
          {/* Template Metadata */}
          <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Template Details
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., World Flags Quiz"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Describe your quiz..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Geography, Science, History"
                required
              />
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label
                  htmlFor="isPublic"
                  className="text-sm font-medium text-gray-700"
                >
                  Make this template public (others can use it)
                </label>
              </div>
            )}
          </div>

          {/* Questions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Questions</h2>
              <button
                type="button"
                onClick={addQuestion}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                + Add Question
              </button>
            </div>

            {/* Question Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {questions.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                    index === currentQuestionIndex
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Q{index + 1}
                </button>
              ))}
            </div>

            {/* Current Question Editor */}
            {currentQuestion && (
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Question {currentQuestionIndex + 1}
                  </h3>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => deleteQuestion(currentQuestionIndex)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Delete Question
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Question Text *
                  </label>
                  <textarea
                    value={currentQuestion.text}
                    onChange={(e) =>
                      updateCurrentQuestion({ text: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Enter your question..."
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Question Type *
                    </label>
                    <select
                      value={currentQuestion.type}
                      onChange={(e) =>
                        updateCurrentQuestion({
                          type: e.target.value as QuestionType,
                          options:
                            e.target.value === "TRUE_FALSE"
                              ? ["True", "False"]
                              : e.target.value === "SHORT_ANSWER"
                              ? []
                              : ["", "", "", ""],
                          correctAnswer: "",
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                      <option value="TRUE_FALSE">True/False</option>
                      <option value="SHORT_ANSWER">Short Answer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Points *
                    </label>
                    <input
                      type="number"
                      value={currentQuestion.points}
                      onChange={(e) =>
                        updateCurrentQuestion({
                          points: parseInt(e.target.value) || 10,
                        })
                      }
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time Limit (seconds)
                    </label>
                    <input
                      type="number"
                      value={currentQuestion.timeLimit || ""}
                      onChange={(e) =>
                        updateCurrentQuestion({
                          timeLimit: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        })
                      }
                      min="5"
                      placeholder="No limit"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL (optional)
                  </label>
                  <input
                    type="url"
                    value={currentQuestion.imageUrl || ""}
                    onChange={(e) =>
                      updateCurrentQuestion({ imageUrl: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                {/* Options for Multiple Choice and True/False */}
                {(currentQuestion.type === "MULTIPLE_CHOICE" ||
                  currentQuestion.type === "TRUE_FALSE") && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Answer Options *
                      </label>
                      {currentQuestion.type === "MULTIPLE_CHOICE" && (
                        <button
                          type="button"
                          onClick={addOption}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          + Add Option
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {currentQuestion.options.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${currentQuestionIndex}`}
                            checked={currentQuestion.correctAnswer === option}
                            onChange={() =>
                              updateCurrentQuestion({ correctAnswer: option })
                            }
                            className="w-4 h-4 text-blue-600"
                          />
                          <input
                            type="text"
                            value={option}
                            onChange={(e) =>
                              updateOption(index, e.target.value)
                            }
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder={`Option ${index + 1}`}
                            disabled={currentQuestion.type === "TRUE_FALSE"}
                          />
                          {currentQuestion.type === "MULTIPLE_CHOICE" &&
                            currentQuestion.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeOption(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                ✕
                              </button>
                            )}
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Select the correct answer by clicking the radio button
                    </p>
                  </div>
                )}

                {/* Correct Answer for Short Answer */}
                {currentQuestion.type === "SHORT_ANSWER" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Correct Answer *
                    </label>
                    <input
                      type="text"
                      value={currentQuestion.correctAnswer}
                      onChange={(e) =>
                        updateCurrentQuestion({ correctAnswer: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter the correct answer..."
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Answers will be matched exactly (case-insensitive)
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                fetchTemplate();
              }}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Template Details (Read-only) */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Template Details
            </h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Title:
                </span>
                <p className="text-gray-900">{template.title}</p>
              </div>
              {template.description && (
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Description:
                  </span>
                  <p className="text-gray-900">{template.description}</p>
                </div>
              )}
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Category:
                </span>
                <p className="text-gray-900">{template.category}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Visibility:
                </span>
                <p className="text-gray-900">
                  {template.isPublic ? "Public" : "Private"}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Questions:
                </span>
                <p className="text-gray-900">{template.questions.length}</p>
              </div>
            </div>
          </div>

          {/* Questions (Read-only) */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Questions</h2>
            <div className="space-y-6">
              {template.questions.map((question, index) => (
                <div
                  key={question.id}
                  className="border-t pt-4 first:border-t-0 first:pt-0"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Question {index + 1}
                    </h3>
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>{question.points} pts</span>
                      {question.timeLimit && <span>{question.timeLimit}s</span>}
                    </div>
                  </div>
                  <p className="text-gray-900 mb-2">{question.text}</p>
                  <div className="text-sm text-gray-600 mb-2">
                    Type: {question.type.replace("_", " ")}
                  </div>
                  {question.imageUrl && (
                    <img
                      src={question.imageUrl}
                      alt="Question"
                      className="w-full max-w-md h-auto rounded-lg mb-2"
                    />
                  )}
                  {(question.type === "MULTIPLE_CHOICE" ||
                    question.type === "TRUE_FALSE") && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-700">
                        Options:
                      </p>
                      {question.options.map((option, optIndex) => (
                        <div
                          key={optIndex}
                          className={`px-3 py-2 rounded ${
                            option === question.correctAnswer
                              ? "bg-green-100 border border-green-300"
                              : "bg-gray-50"
                          }`}
                        >
                          {option}
                          {option === question.correctAnswer && (
                            <span className="text-green-600 ml-2">
                              ✓ Correct
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {question.type === "SHORT_ANSWER" && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Correct Answer:
                      </p>
                      <p className="px-3 py-2 bg-green-100 border border-green-300 rounded">
                        {question.correctAnswer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
