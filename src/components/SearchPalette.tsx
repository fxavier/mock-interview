import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { chapterPath, loadSearchIndex } from '@/lib/book';
import { prepare, search, snippet, terms, type IndexedEntry } from '@/lib/search';
import { cx } from '@/lib/util';
import s from './SearchPalette.module.css';

const KIND: Record<IndexedEntry['k'], string> = { q: 'pergunta', a: 'resposta-modelo', t: 'texto', code: 'código', g: 'glossário' };
const hrefOf = (e: IndexedEntry) => (e.k === 'g' ? `/glossario#${e.i}` : chapterPath(e.c, e.i));
let cachedIndex: IndexedEntry[] | null = null;

interface Props { open: boolean; onClose: () => void }

export function SearchPalette({ open, onClose }: Props) {
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [index, setIndex] = useState<IndexedEntry[] | null>(cachedIndex);
  const [error, setError] = useState(false);
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus(); inputRef.current?.select();
    if (!index) loadSearchIndex().then((e) => { cachedIndex = prepare(e); setIndex(cachedIndex); }).catch(() => setError(true));
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open, index]);

  useEffect(() => { const t = setTimeout(() => setDebounced(q), 120); return () => clearTimeout(t); }, [q]);
  const hits = useMemo(() => (index && debounced.trim().length >= 2 ? search(index, debounced) : []), [index, debounced]);
  const ts = useMemo(() => terms(debounced), [debounced]);
  useEffect(() => setSel(0), [hits]);

  if (!open) return null;

  const go = (i: number) => {
    const h = hits[i];
    if (!h) return;
    navigate(hrefOf(h.e));
    onClose();
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const n = e.key === 'ArrowDown' ? Math.min(sel + 1, hits.length - 1) : Math.max(sel - 1, 0);
      setSel(n);
      listRef.current?.children[n]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') { e.preventDefault(); go(sel); }
    else if (e.key === 'Escape') onClose();
  };

  return (
    <div className={s.overlay} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={s.box} role="dialog" aria-modal="true" aria-label="Pesquisar no livro">
        <input ref={inputRef} className={s.input} type="search" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
          placeholder="Pesquisar: N+1, virtual threads, saga, índice composto, CAP…" autoComplete="off" spellCheck={false}
          aria-controls="search-results" aria-activedescendant={hits[sel] ? `sr-${sel}` : undefined} />
        <div className={s.results} id="search-results" role="listbox" ref={listRef}>
          {error && <div className={s.empty}>Não foi possível carregar o índice de pesquisa.</div>}
          {!error && !index && <div className={s.empty}>A carregar o índice…</div>}
          {index && debounced.trim().length < 2 && <div className={s.empty}>Escreva pelo menos 2 caracteres. Procura em perguntas, respostas, texto, código e glossário.</div>}
          {index && debounced.trim().length >= 2 && !hits.length && <div className={s.empty}>Sem resultados para «{debounced}».</div>}
          {hits.map((h, i) => (
            <a key={`${h.e.i}-${h.e.k}-${i}`} id={`sr-${i}`} role="option" aria-selected={i === sel}
              href={`#${hrefOf(h.e)}`} className={cx(s.item, i === sel && s.sel)}
              onMouseEnter={() => setSel(i)} onClick={(e) => { e.preventDefault(); go(i); }}>
              <div className={s.top}><b>{h.e.k === 'g' ? 'Glossário' : `Cap. ${h.e.c}`}</b><span>{KIND[h.e.k]}</span></div>
              <div className={s.title}>{h.e.t}</div>
              <div className={s.snip}>{snippet(h.e.x, h.pos, ts).map(([t, hl], j) => (hl ? <mark key={j}>{t}</mark> : t))}</div>
            </a>
          ))}
        </div>
        <div className={s.foot}><span>↑↓ navegar</span><span>↵ abrir</span><span>Esc fechar</span><span>{hits.length ? `${hits.length} resultados` : ''}</span></div>
      </div>
    </div>
  );
}
