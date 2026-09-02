import { Link } from 'react-router-dom';
import { chapterPath, neighbours } from '@/lib/book';
import s from './ChapterNav.module.css';

export function ChapterNav({ n }: { n: number }) {
  const { prev, next } = neighbours(n);
  return (
    <nav className={s.nav} aria-label="Capítulo anterior e seguinte">
      {prev ? (
        <Link to={chapterPath(prev.n)} className={s.prev}><span className={s.dir}>← Anterior</span><span className={s.name}>{prev.n}. {prev.title}</span></Link>
      ) : <span />}
      {next ? (
        <Link to={chapterPath(next.n)} className={s.next}><span className={s.dir}>Seguinte →</span><span className={s.name}>{next.n}. {next.title}</span></Link>
      ) : <Link to="/" className={s.next}><span className={s.dir}>Fim do livro</span><span className={s.name}>Voltar ao índice</span></Link>}
    </nav>
  );
}
