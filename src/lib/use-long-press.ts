import { useRef } from "react";

const LONG_PRESS_MS = 600;

/**
 * The target of the long press is decided at press-time rather than at
 * hook-call-time. Returns a `bind(arg)` function that produces pointer
 * handlers for one instance among many (e.g. one long-press zone per item
 * in a list) sharing a single timer.
 */
export const useLongPressFor = <T,>(onLongPress: (arg: T) => void) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);

  const clear = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const bind = (arg: T) => ({
    onPointerDown: () => {
      firedRef.current = false;
      clear();
      timerRef.current = setTimeout(() => {
        firedRef.current = true;
        onLongPress(arg);
      }, LONG_PRESS_MS);
    },
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
    onContextMenu: (e: React.SyntheticEvent) => {
      if (firedRef.current) e.preventDefault();
    },
  });

  return bind;
};

/**
 * Returns pointer handlers that trigger `onLongPress` after the pointer is
 * held down for `LONG_PRESS_MS` without a move/release cancelling it.
 * Works for both mouse and touch via React's pointer events. A thin wrapper
 * around `useLongPressFor` — a single fixed-callback instance of the same
 * mechanism — so the timing/cancel logic only lives in one place.
 */
export const useLongPress = (onLongPress: () => void) => {
  const bind = useLongPressFor<undefined>(onLongPress);
  return bind(undefined);
};
