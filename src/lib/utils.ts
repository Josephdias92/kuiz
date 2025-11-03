import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a unique 6-digit code for quiz sessions
 */
export function generateSessionCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Validate session code format
 */
export function isValidSessionCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

/**
 * Calculate quiz statistics
 */
export function calculateStats(
  responses: Array<{ isCorrect: boolean; points: number }>
) {
  const total = responses.length;
  const correct = responses.filter((r) => r.isCorrect).length;
  const totalPoints = responses.reduce(
    (sum, r) => sum + (r.isCorrect ? r.points : 0),
    0
  );
  const accuracy = total > 0 ? (correct / total) * 100 : 0;

  return {
    total,
    correct,
    wrong: total - correct,
    totalPoints,
    accuracy: Math.round(accuracy * 10) / 10,
  };
}
