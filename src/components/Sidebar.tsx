import { useEffect, useRef } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { book, chapterPath, chaptersByPart } from '@/lib/book';
import { useReadChapters } from '@/hooks/useProgress';
import { useTheme, THEME_LABEL } from '@/hooks/useTheme';
import { cx } from '@/lib/util';
import s from './Sidebar.module.css';

interface Props { open: boolean; onClose: () => void; onSearch: () => void; currentChapter?: number }

export function Sidebar({ open, onClose, onSearch, currentChapter }: Props) {
  const { read, isRead, pct, total } = useReadChapters();
  const { theme, cycle } = useTheme();
  const navRef = useRef<HTMLElement>(null);

  // Centra o capítulo actual na lista ao entrar num capítulo
  useEffect(() => {
    const nav = navRef.current;
    const el = nav?.querySelector<HTMLElement>(`[data-ch="${currentChapter}"]`);
    if (nav && el) nav.scrollTop = Math.max(0, el.offsetTop - nav.clientHeight / 2);
  }, [currentChapter]);

  return (
    <>
      {open && <div className={s.backdrop} onClick={onClose} aria-hidden="true" />}
      <aside className={cx(s.sidebar, open && s.open)} aria-label="Capítulos">
        <div className={s.head}>
          <Link to="/" className={s.title} onClick={onClose}>Mock Interview<br />Java Backend Sénior</Link>
          <div className={s.sub}>{book.chapters.length} capítulos, {book.totals.questions} perguntas de entrevista</div>
          <div className={s.progress} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Capítulos lidos">
            <div className="bar"><i style={{ width: `${pct}%` }} /></div>
            <div className={s.progressTxt}><span>{read.length} de {total} lidos</span><span>{pct}%</span></div>
          </div>
        </div>
        <button type="button" className={s.search} onClick={() => { onSearch(); onClose(); }}>
          <span>Pesquisar no livro…</span><kbd className="key">Ctrl K</kbd>
        </button>
        <nav className={s.nav} ref={navRef}>
          {chaptersByPart().map(({ part, chapters }) => (
            <div key={part.p}>
              <div className={s.part}><span>{part.n}</span><span>{part.t}</span></div>
              {chapters.map((c) => (
                <NavLink key={c.n} to={chapterPath(c.n)} data-ch={c.n} onClick={onClose}
                  className={({ isActive }) => cx(s.link, isActive && s.current)}
                  aria-current={currentChapter === c.n ? 'page' : undefined}>
                  <span className={s.num}>{c.n}</span>
                  <span>{c.title}</span>
                  {isRead(c.n) && <span className={s.done} aria-label="lido">✓</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className={s.foot}>
          <button type="button" className="btn" onClick={cycle} title="Alternar tema (tecla T)">Tema: {THEME_LABEL[theme]}</button>
          <Link to="/simulacao" className="btn" onClick={onClose}>Simulação</Link>
        </div>
      </aside>
    </>
  );
}
