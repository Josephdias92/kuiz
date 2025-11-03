"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ImportTemplatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [jsonInput, setJsonInput] = useState("");

  const exampleJson = {
    title: "World Capitals Quiz",
    description: "Test your knowledge of world capitals",
    category: "Geography",
    isPublic: true,
    questions: [
      {
        text: "What is the capital of France?",
        type: "MULTIPLE_CHOICE",
        options: ["London", "Berlin", "Paris", "Madrid"],
        correctAnswer: "Paris",
        points: 10,
        timeLimit: 15,
      },
      {
        text: "What is the capital of Japan?",
        type: "MULTIPLE_CHOICE",
        options: ["Seoul", "Beijing", "Tokyo", "Bangkok"],
        correctAnswer: "Tokyo",
        points: 10,
        timeLimit: 15,
      },
      {
        text: "The capital of Australia is Sydney.",
        type: "TRUE_FALSE",
        options: ["True", "False"],
        correctAnswer: "False",
        points: 10,
        timeLimit: 10,
      },
    ],
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setSuccess("");

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      setJsonInput(JSON.stringify(json, null, 2));
    } catch {
      setError("Invalid JSON file");
    }
  };

  const handleImport = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const data = JSON.parse(jsonInput);

      const response = await fetch("/api/templates/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to import template");
      }

      setSuccess(
        `Successfully imported "${result.template.title}" with ${result.questionsCount} questions!`
      );
      setJsonInput("");

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to import template"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadExample = () => {
    setJsonInput(JSON.stringify(exampleJson, null, 2));
    setError("");
    setSuccess("");
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-4"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-4xl font-bold text-gray-900">
          Import Quiz Template
        </h1>
        <p className="text-gray-600 mt-2">
          Import quiz data from JSON files or paste JSON directly
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left side - Import */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Upload JSON File
            </h2>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <p className="text-sm text-gray-500 mt-2">
              Upload a JSON file with quiz data
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Or Paste JSON
              </h2>
              <button
                type="button"
                onClick={loadExample}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Load Example
              </button>
            </div>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="w-full h-96 px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm"
              placeholder="Paste your JSON data here..."
            />
            <button
              onClick={handleImport}
              disabled={loading || !jsonInput.trim()}
              className="w-full mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Importing..." : "Import Template"}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">{success}</p>
            </div>
          )}
        </div>

        {/* Right side - Documentation */}
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              JSON Format
            </h2>
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Template Fields:
                </h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>
                    <code className="bg-gray-200 px-1 rounded">title</code>{" "}
                    (required): Quiz title
                  </li>
                  <li>
                    <code className="bg-gray-200 px-1 rounded">
                      description
                    </code>{" "}
                    (optional): Quiz description
                  </li>
                  <li>
                    <code className="bg-gray-200 px-1 rounded">category</code>{" "}
                    (required): Category name
                  </li>
                  <li>
                    <code className="bg-gray-200 px-1 rounded">isPublic</code>{" "}
                    (optional): true/false, defaults to true
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Question Fields:
                </h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>
                    <code className="bg-gray-200 px-1 rounded">text</code>{" "}
                    (required): Question text
                  </li>
                  <li>
                    <code className="bg-gray-200 px-1 rounded">type</code>{" "}
                    (required): MULTIPLE_CHOICE, TRUE_FALSE, CHECKBOX,
                    TEXT_INPUT, IMAGE_CHOICE
                  </li>
                  <li>
                    <code className="bg-gray-200 px-1 rounded">options</code>{" "}
                    (required for choice types): Array of answer options
                  </li>
                  <li>
                    <code className="bg-gray-200 px-1 rounded">
                      correctAnswer
                    </code>{" "}
                    (required): The correct answer
                  </li>
                  <li>
                    <code className="bg-gray-200 px-1 rounded">points</code>{" "}
                    (optional): Points for question, defaults to 10
                  </li>
                  <li>
                    <code className="bg-gray-200 px-1 rounded">timeLimit</code>{" "}
                    (optional): Time limit in seconds
                  </li>
                  <li>
                    <code className="bg-gray-200 px-1 rounded">imageUrl</code>{" "}
                    (optional): URL to image
                  </li>
                </ul>
              </div>

              <div className="bg-white border border-gray-200 rounded p-3">
                <h3 className="font-semibold text-gray-900 mb-2">Example:</h3>
                <pre className="text-xs overflow-x-auto">
                  {JSON.stringify(exampleJson, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Tips:</h3>
            <ul className="list-disc list-inside text-blue-800 text-sm space-y-1">
              <li>
                Click &ldquo;Load Example&rdquo; to see a working template
              </li>
              <li>You can edit the JSON directly in the text area</li>
              <li>Make sure your JSON is valid before importing</li>
              <li>Questions will be created in the order they appear</li>
              <li>
                All questions must have at least 2 options for choice types
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
