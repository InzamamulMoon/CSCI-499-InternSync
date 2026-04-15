import { useCallback, useState } from "react";

function readItem<T>(
  key: string,
  initialValue: T,
  parse: (raw: unknown) => T,
): T {
  if (typeof window === "undefined") return initialValue;
  try {
    const item = window.localStorage.getItem(key);
    if (item == null) return initialValue;
    return parse(JSON.parse(item) as unknown);
  } catch {
    return initialValue;
  }
}

/**
 * React state backed by localStorage (JSON). Survives refresh; no server DB.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  parse: (raw: unknown) => T = (raw) => raw as T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() =>
    readItem(key, initialValue, parse),
  );

  const setStored = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved =
          typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch (e) {
          console.warn("useLocalStorage: could not write", key, e);
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, setStored];
}
