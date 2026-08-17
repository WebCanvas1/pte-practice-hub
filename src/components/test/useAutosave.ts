/**
 * Autosave engine for the test runner.
 *
 * Saves after typing stops, on navigation, on an interval, and before
 * submission. When the network drops, the newest payload per question is kept
 * in a short-lived in-memory queue and flushed as soon as connectivity returns.
 * Durable drafts are always stored by the server in D1.
 */
import * as React from "react";

import type { AnswerData } from "@/config/test-runner";
import { saveAnswerApi } from "@/lib/tests-api";

export type SaveState = "idle" | "saving" | "saved" | "queued" | "error";

export interface PendingSave {
  attemptQuestionId: string;
  text: string;
  data: AnswerData;
  timeSpentSeconds: number;
  currentQuestion: number;
}

const DEBOUNCE_MS = 1200;
const INTERVAL_MS = 20000;

export function useAutosave(attemptId: string, enabled: boolean) {
  const [state, setState] = React.useState<SaveState>("idle");
  const [lastSavedAt, setLastSavedAt] = React.useState<string | null>(null);
  const [online, setOnline] = React.useState(true);
  const queue = React.useRef(new Map<string, PendingSave>());
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    setOnline(navigator.onLine);
    const goOnline = () => setOnline(true);
    const goOffline = () => {
      setOnline(false);
      setState("queued");
    };
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const flush = React.useCallback(async () => {
    if (!enabled || queue.current.size === 0) return;
    if (!navigator.onLine) {
      setState("queued");
      return;
    }
    const pending = [...queue.current.values()];
    queue.current.clear();
    setState("saving");
    try {
      for (const item of pending) {
        const result = await saveAnswerApi({ attemptId, ...item });
        setLastSavedAt(result.savedAt);
      }
      setState("saved");
    } catch {
      // Keep the newest payload per question so nothing is lost.
      for (const item of pending) {
        if (!queue.current.has(item.attemptQuestionId))
          queue.current.set(item.attemptQuestionId, item);
      }
      setState(navigator.onLine ? "error" : "queued");
    }
  }, [attemptId, enabled]);

  /** Schedule a debounced save (typing) or force an immediate one. */
  const save = React.useCallback(
    (payload: PendingSave, immediate = false) => {
      queue.current.set(payload.attemptQuestionId, payload);
      if (timer.current) clearTimeout(timer.current);
      if (immediate) {
        void flush();
        return;
      }
      setState("saving");
      timer.current = setTimeout(() => void flush(), DEBOUNCE_MS);
    },
    [flush],
  );

  // Periodic save plus retry of anything queued while offline.
  React.useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => void flush(), INTERVAL_MS);
    return () => clearInterval(id);
  }, [enabled, flush]);

  React.useEffect(() => {
    if (online) void flush();
  }, [online, flush]);

  return { state, lastSavedAt, online, save, flush, pending: queue.current.size };
}
