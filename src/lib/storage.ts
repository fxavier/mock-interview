/**
 * Armazenamento local tipado com subscrição: vários componentes partilham o
 * mesmo valor (progresso, auto-avaliações) via useSyncExternalStore.
 * As chaves mantêm o prefixo `mij.` do livro original para preservar dados existentes.
 */
import { useCallback, useSyncExternalStore } from 'react';

export const KEYS = {
  read: 'mij.read',
  theme: 'mij.theme',
  last: 'mij.last',
  rate: 'mij.rate',
  mock: 'mij.mock',
  notes: (n: number) => `mij.notes.${n}`,
  quiz: (n: number) => `mij.quiz.${n}`,
  lab: (id: string) => `mij.lab.${id}`,
  pads: 'mij.pads',
} as const;
export const PREFIX = 'mij.';

type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();
const cache = new Map<string, string | null>();

function readRaw(key: string): string | null {
  if (cache.has(key)) return cache.get(key)!;
  let v: string | null = null;
  try { v = localStorage.getItem(key); } catch { /* storage indisponível */ }
  cache.set(key, v);
  return v;
}
function emit(key: string) { listeners.get(key)?.forEach((l) => l()); }
function safeParse<T>(raw: string, fallback: T): T {
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

export function getItem<T>(key: string, fallback: T): T {
  const raw = readRaw(key);
  return raw === null ? fallback : safeParse(raw, fallback);
}
export function setItem<T>(key: string, value: T): void {
  const raw = JSON.stringify(value);
  cache.set(key, raw);
  try { localStorage.setItem(key, raw); } catch { /* quota / modo privado */ }
  emit(key);
}
export function removeItem(key: string): void {
  cache.set(key, null);
  try { localStorage.removeItem(key); } catch { /* ignorar */ }
  emit(key);
}
export function clearPrefix(prefix = PREFIX): void {
  let keys: string[] = [];
  try { keys = Object.keys(localStorage).filter((k) => k.startsWith(prefix)); } catch { /* ignorar */ }
  keys.forEach(removeItem);
  [...cache.keys()].filter((k) => k.startsWith(prefix)).forEach((k) => { cache.set(k, null); emit(k); });
}
export function subscribe(key: string, l: Listener): () => void {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(l);
  return () => { listeners.get(key)?.delete(l); };
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => { if (e.key) { cache.delete(e.key); emit(e.key); } });
}

/** Hook: valor persistido e partilhado entre componentes. */
export function useStored<T>(key: string, fallback: T): [T, (v: T | ((prev: T) => T)) => void] {
  const get = useCallback(() => readRaw(key), [key]);
  const sub = useCallback((l: Listener) => subscribe(key, l), [key]);
  const raw = useSyncExternalStore(sub, get, get);
  const value = raw === null ? fallback : safeParse(raw, fallback);
  const set = useCallback((v: T | ((prev: T) => T)) => {
    const next = typeof v === 'function' ? (v as (p: T) => T)(getItem(key, fallback)) : v;
    setItem(key, next);
  }, [key, fallback]);
  return [value, set];
}
