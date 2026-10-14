"use client";

import { useEffect, useRef } from "react";

/**
 * useIdleTimer
 * Calls onIdle after timeoutMs of user inactivity.
 * Resets on mouse movement, click, key press, touch, or scroll.
 */
export function useIdleTimer({
  timeoutMs = 120000, // 2 minutes default
  onIdle,
  enabled = true,
}: {
  timeoutMs?: number;
  onIdle: () => void;
  enabled?: boolean;
}) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onIdle();
      }, timeoutMs);
    };

    const events = ["mousedown", "mousemove", "keydown", "touchstart", "scroll"];
    events.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));

    // Initialize timer
    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [timeoutMs, onIdle, enabled]);
}
