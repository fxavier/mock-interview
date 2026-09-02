export type Level = 'mid' | 'senior' | 'staff';
export type Freq = 'alta' | 'media' | 'baixa';
export type Rating = 1 | 2 | 3; // Falhei | Parcial | Sólido

export interface Part { p: number; n: string; t: string }
export interface Area { k: string; n: string; count: number }
export interface Section { id: string; title: string }
export interface ChapterMeta {
  n: number;
  p: number;
  area: string;
  title: string;
  sections: Section[];
  counts: { questions: number; labs: number; listings: number; sections: number };
}
export interface Book {
  title: string;
  subtitle: string;
  parts: Part[];
  areas: Area[];
  levels: Record<Level, string>;
  freq: Record<Freq, string>;
  chapters: ChapterMeta[];
  totals: { questions: number; labs: number; listings: number; quiz: number; sections: number };
}
export interface BankQuestion { id: string; c: number; a: string; l: Level; q: string }
export interface SearchEntry { c: number; i: string; k: 'q' | 'a' | 't' | 'code'; t: string; x: string }
export interface QuizQuestion { q: string; options: string[]; answer: number; explain: string }
export interface Quiz { chapter: number; questions: QuizQuestion[] }
export interface MockRun { d: string; n: number; ok: number; min: number }
