import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { book, chapter, chapterPath, loadGlossary } from '@/lib/book';
import { useShell } from '@/components/Shell';
import { normalize } from '@/lib/search';
import { inlineCode, cx } from '@/lib/util';
import type { GlossaryTerm } from '@/lib/types';
import s from './GlossaryPage.module.css';

export function GlossaryPage() {
  const { setCrumb } = useShell();
  const location = useLocation();
  const [terms, setTerms] = useState<GlossaryTerm[] | null>(null);
  const [q, setQ] = useState('');
  const [area, setArea] = useState('');
  const target = location.hash.slice(1);

  useEffect(() => { setCrumb('Glossário'); document.title = 'Glossário — Mock Interview Java Sénior'; }, [setCrumb]);
  useEffect(() => { loadGlossary().then(setTerms).catch(() => setTerms([])); }, []);
  useEffect(() => {
    if (!terms || !target) return;
    const t = setTimeout(() => document.getElementById(target)?.scrollIntoView({ block: 'start' }), 30);
    return () => clearTimeout(t);
  }, [terms, target]);

  const shown = useMemo(() => {
    if (!terms) return [];
    const nq = normalize(q.trim());
    return terms.filter((t) => (!area || t.a === area) && (!nq || normalize(`${t.t} ${t.d}`).includes(nq)));
  }, [terms, q, area]);
  const letters = useMemo(() => {
    const set = new Set(shown.map((t) => normalize(t.t)[0]?.toUpperCase() ?? '#'));
    return [...set].sort();
  }, [shown]);
  const areaLabel = (k: string) => book.areas.find((a) => a.k === k)?.n ?? k;

  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <h1 className={s.title}>Glossário</h1>
      <p className={s.intro}>Os termos que aparecem nas entrevistas, com a definição curta que se diz em voz alta e a ligação para o capítulo que os aprofunda. Também estão na pesquisa (<kbd className="key">Ctrl K</kbd>).</p>

      <div className={s.tools}>
        <input className="input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrar termos…" aria-label="Filtrar termos" />
        <select className="select" value={area} onChange={(e) => setArea(e.target.value)} aria-label="Filtrar por área">
          <option value="">Todas as áreas</option>
          {book.areas.map((a) => <option key={a.k} value={a.k}>{a.n}</option>)}
        </select>
      </div>
      {terms && (
        <div className={s.letters} aria-label="Índice alfabético">
          {letters.map((l) => <a key={l} href={`#${l}`} onClick={(e) => { e.preventDefault(); document.getElementById(`letra-${l}`)?.scrollIntoView({ block: 'start' }); }}>{l}</a>)}
          <span className={s.count}>{shown.length} de {terms.length} termos</span>
        </div>
      )}

      {!terms && <div className="skeleton" style={{ height: 300 }} aria-busy="true" />}
      {terms && !shown.length && <div className="panel"><div className="hint" style={{ margin: 0 }}>Sem termos para «{q}».</div></div>}

      <dl className={s.list}>
        {shown.map((t, i) => {
          const letter = normalize(t.t)[0]?.toUpperCase() ?? '#';
          const first = i === 0 || normalize(shown[i - 1].t)[0]?.toUpperCase() !== letter;
          return (
            <div key={t.s} id={t.s} className={cx(s.term, target === t.s && s.hit)}>
              {first && <div id={`letra-${letter}`} className={s.letter}>{letter}</div>}
              <dt>
                <span>{t.t}</span>
                <span className={s.area}>{areaLabel(t.a)}</span>
              </dt>
              <dd>
                <p>{inlineCode(t.d)}</p>
                <div className={s.links}>
                  {t.c.map((n) => {
                    const c = chapter(n);
                    return c ? <Link key={n} to={chapterPath(n)} className="pill">Cap. {n} · {c.title}</Link> : null;
                  })}
                </div>
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
