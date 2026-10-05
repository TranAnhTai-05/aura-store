import { useCallback, useRef, useState } from 'react';

/**
 * Tracks whether a request is under way, for disabling the button that started it.
 * A second call while the first is still running is ignored, so a double click
 * cannot place an order twice.
 */
export function usePending() {
  const [pending, setPending] = useState(false);
  const running = useRef(false);

  const run = useCallback(async <T,>(work: () => Promise<T>): Promise<T | undefined> => {
    if (running.current) return undefined;
    running.current = true;
    setPending(true);
    try {
      return await work();
    } finally {
      running.current = false;
      setPending(false);
    }
  }, []);

  return [pending, run] as const;
}
