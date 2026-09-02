import type { SearchEntry } from './types';

export const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export interface IndexedEntry extends SearchEntry { n: string }
export interface Hit { e: IndexedEntry; score: number; pos: number }

export function prepare(entries: SearchEntry[]): IndexedEntry[] {
  return entries.map((e) => ({ ...e, n: normalize(`${e.t} ${e.x}`) }));
}
export function terms(q: string): string[] {
  return normalize(q).split(/\s+/).filter((t) => t.length > 1);
}
export function search(index: IndexedEntry[], q: string, limit = 40): Hit[] {
  const ts = terms(q);
  if (!ts.length) return [];
  const hits: Hit[] = [];
  for (const e of index) {
    let score = 0, pos = -1;
    for (const t of ts) {
      const p = e.n.indexOf(t);
      if (p < 0) { score = 0; break; }
      const occ = e.n.split(t).length - 1;
      score += 10 + Math.min(occ, 6);
      if (normalize(e.t).includes(t)) score += 25;
      if (e.k === 'q') score += 8;
      if (e.k === 'code') score += 3;
      if (pos < 0) pos = p;
    }
    if (score) hits.push({ e, score, pos });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}
/** Segmentos [texto, realçado] à volta da primeira ocorrência. */
export function snippet(text: string, pos: number, ts: string[], width = 200): [string, boolean][] {
  const start = Math.max(0, pos - 60);
  let frag = text.slice(start, start + width);
  if (start > 0) frag = '…' + frag;
  if (start + width < text.length) frag += '…';
  const re = new RegExp(`(${ts.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const out: [string, boolean][] = [];
  const nf = normalize(frag);
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(nf)) !== null) {
    if (m.index > last) out.push([frag.slice(last, m.index), false]);
    out.push([frag.slice(m.index, m.index + m[0].length), true]);
    last = m.index + m[0].length;
  }
  if (last < frag.length) out.push([frag.slice(last), false]);
  return out;
}
