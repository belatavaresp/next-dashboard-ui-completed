"use client";

import { useCallback, useEffect, useState } from "react";

export type Feedback = { type: "success" | "error"; message: string } | null;

/**
 * Feedback for admin actions. Success messages expire, so a stale "saved" never
 * sits on screen next to later edits; errors stay until the next attempt.
 */
export function useFeedback(successTimeout = 4000) {
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    if (feedback?.type !== "success") return;
    const timer = setTimeout(() => setFeedback(null), successTimeout);
    return () => clearTimeout(timer);
  }, [feedback, successTimeout]);

  const showSuccess = useCallback(
    (message: string) => setFeedback({ type: "success", message }),
    []
  );
  const showError = useCallback(
    (message: string) => setFeedback({ type: "error", message }),
    []
  );
  const clearFeedback = useCallback(() => setFeedback(null), []);

  return { feedback, showSuccess, showError, clearFeedback };
}

export function FeedbackMessage({
  feedback,
  className = "",
}: {
  feedback: Feedback;
  className?: string;
}) {
  if (!feedback) return null;

  const isSuccess = feedback.type === "success";

  return (
    <p
      // Announced to screen readers, since the change is otherwise only visual.
      role="status"
      aria-live="polite"
      className={`rounded-md px-3 py-2 text-sm ${
        isSuccess
          ? "bg-green-50 text-green-800 border border-green-200"
          : "bg-red-50 text-red-700 border border-red-200"
      } ${className}`}
    >
      {isSuccess ? "\u2713 " : ""}
      {feedback.message}
    </p>
  );
}
