import { Fragment, type ReactNode } from 'react';

/** Converte `código` inline (formato dos quizzes e do banco) em <code>, sem HTML cru. */
export function inlineCode(s: string): ReactNode {
  return String(s).split(/(`[^`]+`)/).map((p, i) =>
    p.length > 1 && p.startsWith('`') && p.endsWith('`')
      ? <code key={i}>{p.slice(1, -1)}</code>
      : <Fragment key={i}>{p}</Fragment>,
  );
}
export function formatClock(seconds: number): string {
  const abs = Math.abs(seconds);
  const m = Math.floor(abs / 60), s = abs % 60;
  return `${seconds < 0 ? '-' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}
export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export const cx = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');
