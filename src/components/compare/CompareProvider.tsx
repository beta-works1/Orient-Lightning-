"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const COMPARE_MAX = 4;
const STORAGE_KEY = "orient-compare";

export type CompareItem = {
  handle: string;
  title: string;
  image: string | null;
};

type CompareContextValue = {
  items: CompareItem[];
  handles: string[];
  ready: boolean;
  message: string | null;
  add: (item: CompareItem) => boolean;
  remove: (handle: string) => void;
  toggle: (item: CompareItem) => void;
  clear: () => void;
  isSelected: (handle: string) => boolean;
  setFromHandles: (items: CompareItem[]) => void;
};

const CompareContext = createContext<CompareContextValue | null>(null);

function readStorage(): CompareItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CompareItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((i) => i && typeof i.handle === "string" && i.handle.length > 0)
      .slice(0, COMPARE_MAX)
      .map((i) => ({
        handle: i.handle,
        title: typeof i.title === "string" ? i.title : i.handle,
        image: typeof i.image === "string" ? i.image : null,
      }));
  } catch {
    return [];
  }
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>([]);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setItems(readStorage());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(() => setMessage(null), 2500);
    return () => window.clearTimeout(t);
  }, [message]);

  const add = useCallback((item: CompareItem) => {
    let accepted = true;
    setItems((prev) => {
      if (prev.some((p) => p.handle === item.handle)) return prev;
      if (prev.length >= COMPARE_MAX) {
        accepted = false;
        setMessage(`You can compare up to ${COMPARE_MAX} products`);
        return prev;
      }
      return [...prev, item];
    });
    return accepted;
  }, []);

  const remove = useCallback((handle: string) => {
    setItems((prev) => prev.filter((p) => p.handle !== handle));
  }, []);

  const toggle = useCallback(
    (item: CompareItem) => {
      setItems((prev) => {
        if (prev.some((p) => p.handle === item.handle)) {
          return prev.filter((p) => p.handle !== item.handle);
        }
        if (prev.length >= COMPARE_MAX) {
          setMessage(`You can compare up to ${COMPARE_MAX} products`);
          return prev;
        }
        return [...prev, item];
      });
    },
    [],
  );

  const clear = useCallback(() => setItems([]), []);

  const isSelected = useCallback(
    (handle: string) => items.some((p) => p.handle === handle),
    [items],
  );

  const setFromHandles = useCallback((next: CompareItem[]) => {
    setItems(next.slice(0, COMPARE_MAX));
  }, []);

  const value = useMemo<CompareContextValue>(
    () => ({
      items,
      handles: items.map((i) => i.handle),
      ready,
      message,
      add,
      remove,
      toggle,
      clear,
      isSelected,
      setFromHandles,
    }),
    [items, ready, message, add, remove, toggle, clear, isSelected, setFromHandles],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
