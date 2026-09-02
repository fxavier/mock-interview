import { useEffect, useState } from 'react';
import { KEYS, useStored } from '@/lib/storage';
import { useDebouncedEffect } from '@/hooks/useDebounced';
import { exportAllNotes } from '@/lib/notes';

export function Notes({ chapter }: { chapter: number }) {
  const [stored, setStored] = useStored<string>(KEYS.notes(chapter), '');
  const [draft, setDraft] = useState(stored);
  const [saved, setSaved] = useState(true);
  useEffect(() => { setDraft(stored); setSaved(true); }, [chapter]); // eslint-disable-line react-hooks/exhaustive-deps
  useDebouncedEffect(draft, (v) => { setStored(v); setSaved(true); }, 500);

  return (
    <section className="panel" aria-labelledby="notes-title">
      <h3 id="notes-title">As minhas notas <span style={{ fontWeight: 400, fontSize: 12, color: saved ? 'var(--ok)' : 'var(--text-faint)', marginLeft: 8 }} aria-live="polite">{draft ? (saved ? 'guardado' : 'a guardar…') : ''}</span></h3>
      <div className="hint">Notas pessoais deste capítulo, guardadas apenas neste browser.</div>
      <textarea className="textarea" value={draft} placeholder="Escreva aqui…" aria-label="Notas do capítulo"
        onChange={(e) => { setDraft(e.target.value); setSaved(false); }} />
      <div style={{ marginTop: 10 }}>
        <button type="button" className="btn btn--sm" onClick={() => exportAllNotes()}>Exportar todas as notas (.md)</button>
      </div>
    </section>
  );
}
