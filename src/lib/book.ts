import raw from '@/generated/book.json';
import type { BankQuestion, Book, ChapterMeta, Part, Quiz, SearchEntry } from './types';

export const book = raw as unknown as Book;

export const pad = (n: number) => String(n).padStart(2, '0');
export const chapterPath = (n: number, hash?: string) => `/cap/${n}${hash ? `#${hash}` : ''}`;

export function chapter(n: number): ChapterMeta | undefined {
  return book.chapters.find((c) => c.n === n);
}
export function partOf(c: ChapterMeta): Part {
  return book.parts.find((p) => p.p === c.p) ?? { p: c.p, n: '', t: '' };
}
export function neighbours(n: number): { prev?: ChapterMeta; next?: ChapterMeta } {
  const i = book.chapters.findIndex((c) => c.n === n);
  return { prev: book.chapters[i - 1], next: book.chapters[i + 1] };
}
export function areaName(k: string): string {
  return book.areas.find((a) => a.k === k)?.n ?? k;
}
export const chaptersByPart = (): { part: Part; chapters: ChapterMeta[] }[] =>
  book.parts.map((part) => ({ part, chapters: book.chapters.filter((c) => c.p === part.p) }));

/** Corpos e quizzes carregados sob demanda — um chunk por capítulo. */
const bodies = import.meta.glob('@/generated/bodies/*.html', { query: '?raw', import: 'default' }) as Record<string, () => Promise<string>>;
const quizzes = import.meta.glob('@/generated/quiz/*.json', { import: 'default' }) as Record<string, () => Promise<unknown>>;

function pick<T>(map: Record<string, () => Promise<T>>, suffix: string, what: string): Promise<T> {
  const key = Object.keys(map).find((k) => k.endsWith(suffix));
  return key ? map[key]() : Promise.reject(new Error(`${what} não existe`));
}
export const loadBody = (n: number) => pick(bodies, `/${pad(n)}.html`, `Capítulo ${n}`);
export const loadQuiz = (n: number) => pick(quizzes, `/${pad(n)}.json`, `Quiz ${n}`) as Promise<Quiz>;
export const loadBank = () => import('@/generated/bank.json').then((m) => m.default as BankQuestion[]);
export const loadSearchIndex = () => import('@/generated/search.json').then((m) => m.default as SearchEntry[]);
