import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { book, chapter, chapterPath, loadBody, neighbours, partOf } from '@/lib/book';
import { ReadingProgress } from '@/components/ReadingProgress';
import { ContentRenderer } from '@/content/ContentRenderer';
import { Quiz } from '@/components/Quiz';
import { Notes } from '@/components/Notes';
import { ChapterNav } from '@/components/ChapterNav';
import { useReadChapters, useRatings, useLastPosition } from '@/hooks/useProgress';
import { useScrollSpy } from '@/hooks/useScrollSpy';
import { useHotkeys } from '@/hooks/useHotkeys';
import { useShell } from '@/components/Shell';
import { cx } from '@/lib/util';
import { NotFound } from './NotFound';

const FILTERS: { k: string; label: string }[] = [
  { k: 'qa', label: 'Perguntas' }, { k: 'lab', label: 'Código' }, { k: 'trade', label: 'Trade-offs' },
  { k: 'warn', label: 'Armadilhas' }, { k: 'num', label: 'Números' }, { k: 'note', label: 'Notas' },
];

export function ChapterPage() {
  const n = Number(useParams().n);
  const meta = chapter(n);
  if (!meta || !Number.isInteger(n)) return <NotFound />;
  return <Chapter key={n} n={n} />;
}

function Chapter({ n }: { n: number }) {
  const meta = chapter(n)!;
  const part = partOf(meta);
  const { prev, next } = neighbours(n);
  const navigate = useNavigate();
  const location = useLocation();
  const { setCrumb } = useShell();
  const { isRead, toggle } = useReadChapters();
  const { byChapter } = useRatings();
  const [, setLast] = useLastPosition();
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const target = location.hash ? location.hash.slice(1) : null;

  useEffect(() => {
    setCrumb(<><span>{part.n}, {part.t}</span> <span aria-hidden="true">›</span> <b>Capítulo {n}</b></>);
    document.title = `${n}. ${meta.title} — Mock Interview Java Sénior`;
    setLast({ ch: n, y: 0 });
  }, [n, meta.title, part.n, part.t, setCrumb, setLast]);

  useEffect(() => {
    let alive = true;
    loadBody(n).then((b) => alive && setHtml(b)).catch((e: Error) => alive && setError(e.message));
    return () => { alive = false; };
  }, [n]);

  // Ligações directas (#q-3-2, #sec-3-1, #lab-3-1): rolar depois de renderizar
  useEffect(() => {
    if (!html) return;
    if (!target) { window.scrollTo({ top: 0 }); return; }
    const t = setTimeout(() => document.getElementById(target)?.scrollIntoView({ block: 'start' }), 30);
    return () => clearTimeout(t);
  }, [html, target]);

  const sectionIds = useMemo(() => meta.sections.map((s) => s.id), [meta]);
  const active = useScrollSpy(sectionIds);

  const hotkeys = useMemo(() => ({
    plain: {
      ArrowLeft: () => { if (prev) navigate(chapterPath(prev.n)); },
      ArrowRight: () => { if (next) navigate(chapterPath(next.n)); },
    },
  }), [prev, next, navigate]);
  useHotkeys(hotkeys);

  const toggleFilter = (k: string) => {
    const nextF = filter === k ? null : k;
    setFilter(nextF);
    if (nextF) requestAnimationFrame(() => document.querySelector(`[data-box="${nextF}"]`)?.scrollIntoView({ block: 'center' }));
  };

  const read = isRead(n);
  const progress = byChapter.get(n) ?? { rated: 0, solid: 0 };
  const pills = [
    `Capítulo ${n} de ${book.chapters.length}`,
    `${meta.counts.questions} perguntas`,
    meta.counts.labs ? `${meta.counts.labs} exercício${meta.counts.labs > 1 ? 's' : ''} de código` : null,
    `${meta.counts.sections} secções`,
  ].filter(Boolean) as string[];

  return (
    <div className="page page--reading">
      <ReadingProgress />
      <article>
        <header className="chhead">
          <div className="chhead__part">{part.n} — {part.t}</div>
          <h1 className="chhead__title">{meta.title}</h1>
          <div className="chhead__meta">{pills.map((p) => <span key={p} className="pill">{p}</span>)}</div>
          <div className="chhead__tools">
            <button type="button" className={cx('btn', read && 'btn--primary')} aria-pressed={read} onClick={() => toggle(n)}>
              {read ? '✓ Capítulo lido' : 'Marcar como lido'}
            </button>
            {meta.counts.questions > 0 && (
              <span className="chhead__rated" title="Perguntas com auto-avaliação">
                <span className="bar bar--ok"><i style={{ width: `${Math.round((progress.solid / meta.counts.questions) * 100)}%` }} /></span>
                {progress.rated}/{meta.counts.questions} avaliadas, {progress.solid} sólidas
              </span>
            )}
          </div>
          <div className="chhead__filters" role="group" aria-label="Destacar no capítulo">
            <span>Destacar:</span>
            {FILTERS.map((f) => (
              <button key={f.k} type="button" className={cx('btn btn--sm', filter === f.k && 'btn--on')} aria-pressed={filter === f.k} onClick={() => toggleFilter(f.k)}>{f.label}</button>
            ))}
          </div>
        </header>

        {error && <div className="panel" role="alert"><h3>Não foi possível carregar o capítulo</h3><div className="hint">{error}</div><Link to="/" className="btn">Voltar ao índice</Link></div>}
        {!html && !error && <div className="skeleton" aria-busy="true" aria-label="A carregar capítulo" />}
        {html && (
          <details className="toc-mobile">
            <summary>Neste capítulo ({meta.sections.length} secções)</summary>
            <ol>{meta.sections.map((s, i) => <li key={s.id}><a href={`#${chapterPath(n, s.id)}`} onClick={(e) => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ block: 'start' }); }}>{n}.{i + 1} {s.title}</a></li>)}</ol>
          </details>
        )}
        {html && <ContentRenderer html={html} target={target} filter={filter} />}

        {html && (
          <div className="chapter__after">
            <Quiz chapter={n} />
            <Notes chapter={n} />
            <ChapterNav n={n} />
          </div>
        )}
      </article>

      <aside className="rail" aria-label="Secções deste capítulo">
        <p className="rail__title">Neste capítulo</p>
        <ul className="rail__list">
          {meta.sections.map((s, i) => (
            <li key={s.id}>
              <a href={`#${chapterPath(n, s.id)}`} className={cx(active === s.id && 'is-active')}
                onClick={(e) => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ block: 'start' }); }}>
                {n}.{i + 1} {s.title}
              </a>
            </li>
          ))}
          <li><a href="#quiz" onClick={(e) => { e.preventDefault(); document.getElementById('quiz')?.scrollIntoView({ block: 'start' }); }}>Auto-avaliação</a></li>
        </ul>
        <div className="rail__tools">
          <span className="rail__label">Atalhos</span>
          <span className="rail__hint"><kbd className="key">←</kbd> <kbd className="key">→</kbd> mudar de capítulo</span>
          <span className="rail__hint"><kbd className="key">T</kbd> tema, <kbd className="key">/</kbd> pesquisa</span>
          <span className="rail__label">Treinar</span>
          <Link to={`/playground${meta.counts.labs ? `#lab-${n}-1` : ''}`} className="btn btn--sm">Playground{meta.counts.labs ? ` · exercício ${n}.1` : ''}</Link>
          <Link to="/glossario" className="btn btn--sm">Glossário</Link>
        </div>
      </aside>
    </div>
  );
}
