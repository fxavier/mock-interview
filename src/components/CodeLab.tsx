import { useId, useState, type ReactNode, type KeyboardEvent } from 'react';
import { KEYS, useStored } from '@/lib/storage';
import { useDebouncedEffect } from '@/hooks/useDebounced';
import { cx } from '@/lib/util';

export interface CodeLabProps {
  id: string;
  lang: string;
  title: string;
  pills: string[];
  statement: ReactNode;
  solution: ReactNode;
}

export function CodeLab({ id, lang, title, pills, statement, solution }: CodeLabProps) {
  const [stored, setStored] = useStored<string>(KEYS.lab(id), '');
  const [draft, setDraft] = useState(stored);
  const [saved, setSaved] = useState(true);
  const [showSol, setShowSol] = useState(false);
  const solId = useId();
  useDebouncedEffect(draft, (v) => { setStored(v); setSaved(true); }, 500);

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const ta = e.currentTarget;
    const s = ta.selectionStart, end = ta.selectionEnd;
    const next = `${ta.value.slice(0, s)}    ${ta.value.slice(end)}`;
    setDraft(next); setSaved(false);
    requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = s + 4; });
  };
  const clear = () => {
    if (!draft || confirm('Apagar o código escrito neste exercício?')) { setDraft(''); setStored(''); setSaved(true); }
  };

  return (
    <section className="lab" id={id} data-box="lab" data-lang={lang}>
      <div className="lab__head">
        <span className="lab__title">{title}</span>
        <div className="lab__pills">{pills.map((p) => <span key={p} className="pill">{p}</span>)}</div>
      </div>
      <div className="lab__body">
        {statement}
        <h4>A sua solução</h4>
        <div className="lab__editor">
          <textarea className="textarea" value={draft} spellCheck={false} aria-label={`Solução para ${title}`}
            placeholder="Escreva aqui antes de ver a solução…"
            onChange={(e) => { setDraft(e.target.value); setSaved(false); }} onKeyDown={onKey} />
          <span className="lab__status">{draft ? (saved ? 'Guardado' : 'A guardar…') : `${lang} · Tab indenta`}</span>
        </div>
        <div className="lab__act">
          <button type="button" className={cx('btn', showSol && 'btn--on')} aria-expanded={showSol} aria-controls={solId} onClick={() => setShowSol((s) => !s)}>
            {showSol ? 'Ocultar solução' : 'Ver solução de referência'}
          </button>
          <button type="button" className="btn btn--ghost btn--danger" onClick={clear} disabled={!draft}>Limpar</button>
        </div>
        {showSol && <div className="lab__sol" id={solId}>{solution}</div>}
      </div>
    </section>
  );
}
