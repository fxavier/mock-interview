import { useCallback, useMemo } from 'react';
import { KEYS, useStored } from '@/lib/storage';
import { book } from '@/lib/book';
import type { Rating } from '@/lib/types';

const EMPTY_READ: number[] = [];
const EMPTY_RATES: Record<string, Rating> = {};

export function useReadChapters() {
  const [read, setRead] = useStored<number[]>(KEYS.read, EMPTY_READ);
  const isRead = useCallback((n: number) => read.includes(n), [read]);
  const toggle = useCallback((n: number) => setRead((r) => (r.includes(n) ? r.filter((x) => x !== n) : [...r, n])), [setRead]);
  const pct = Math.round((read.length / book.chapters.length) * 100);
  return { read, isRead, toggle, pct, total: book.chapters.length };
}

export function useRatings() {
  const [rates, setRates] = useStored<Record<string, Rating>>(KEYS.rate, EMPTY_RATES);
  const rate = useCallback((id: string, v: Rating | null) => setRates((r) => {
    const next = { ...r };
    if (v === null) delete next[id]; else next[id] = v;
    return next;
  }), [setRates]);
  /** Perguntas avaliadas por capítulo (id no formato q-N-K). */
  const byChapter = useMemo(() => {
    const m = new Map<number, { rated: number; solid: number }>();
    for (const [id, v] of Object.entries(rates)) {
      const n = Number(id.split('-')[1]);
      const cur = m.get(n) ?? { rated: 0, solid: 0 };
      cur.rated++; if (v === 3) cur.solid++;
      m.set(n, cur);
    }
    return m;
  }, [rates]);
  return { rates, rate, byChapter };
}

export interface LastPosition { ch: number; y: number }
export function useLastPosition() {
  return useStored<LastPosition | null>(KEYS.last, null);
}
