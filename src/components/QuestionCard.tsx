import { useEffect, useId, useState, type ReactNode } from 'react';
import { book } from '@/lib/book';
import { useRatings } from '@/hooks/useProgress';
import type { Freq, Level, Rating } from '@/lib/types';
import { cx } from '@/lib/util';

export interface QuestionCardProps {
  id: string;
  area: string;
  areaLabel: string;
  level: Level;
  freq: Freq;
  prompt: ReactNode;
  body: ReactNode;
  /** Abre automaticamente (ex.: chegada por ligação directa #q-3-2). */
  initialOpen?: boolean;
}

const RATINGS: { v: Rating; label: string }[] = [
  { v: 1, label: 'Falhei' }, { v: 2, label: 'Parcial' }, { v: 3, label: 'Sólido' },
];

export function QuestionCard({ id, area, areaLabel, level, freq, prompt, body, initialOpen = false }: QuestionCardProps) {
  const [open, setOpen] = useState(initialOpen);
  useEffect(() => { if (initialOpen) setOpen(true); }, [initialOpen]);
  const { rates, rate } = useRatings();
  const current = rates[id];
  const bodyId = useId();

  return (
    <article className={cx('qa', open && 'is-open')} id={id} data-box="qa" data-area={area} data-level={level}>
      <div className="qa__head">
        <span className="qa__area">{areaLabel}</span>
        <div className="qa__meta">
          <span className="pill qa__lvl">{book.levels[level]}</span>
          <span className="pill">{book.freq[freq]}</span>
        </div>
      </div>
      <div className="qa__prompt">{prompt}</div>
      <div className="qa__act">
        <button type="button" className={cx('btn', open && 'btn--on')} aria-expanded={open} aria-controls={bodyId} onClick={() => setOpen((o) => !o)}>
          {open ? 'Ocultar resposta' : 'Ver resposta-modelo'}
        </button>
        <div className="qa__rate" role="group" aria-label="Auto-avaliação">
          <span>Como correu?</span>
          {RATINGS.map((r) => (
            <button key={r.v} type="button" data-v={r.v} aria-pressed={current === r.v}
              className={cx('btn', current === r.v && 'is-on')}
              onClick={() => rate(id, current === r.v ? null : r.v)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>
      {open && <div className="qa__body" id={bodyId}>{body}</div>}
    </article>
  );
}
