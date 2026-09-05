import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { book, chapter, chapterPath, chaptersByPart, loadBank } from '@/lib/book';
import { useLastPosition, useRatings, useReadChapters } from '@/hooks/useProgress';
import { useShell } from '@/components/Shell';
import { clearPrefix } from '@/lib/storage';
import { exportAllNotes } from '@/lib/notes';
import { cx } from '@/lib/util';
import type { BankQuestion } from '@/lib/types';
import s from './HomePage.module.css';

export function HomePage() {
  const { setCrumb, openSearch } = useShell();
  const { read, isRead } = useReadChapters();
  const { rates, byChapter } = useRatings();
  const [last] = useLastPosition();
  const [bank, setBank] = useState<BankQuestion[] | null>(null);

  useEffect(() => { setCrumb('Índice'); document.title = 'Mock Interview: Java Backend Sénior'; }, [setCrumb]);
  useEffect(() => { loadBank().then(setBank).catch(() => setBank([])); }, []);

  const mastery = useMemo(() => {
    if (!bank) return [];
    const byArea = new Map<string, { t: number; s: number; seen: number }>();
    for (const q of bank) {
      const a = byArea.get(q.a) ?? { t: 0, s: 0, seen: 0 };
      a.t++;
      const v = rates[q.id];
      if (v) a.seen++;
      if (v === 3) a.s++;
      byArea.set(q.a, a);
    }
    return book.areas.map((ar) => ({ ...ar, ...(byArea.get(ar.k) ?? { t: 0, s: 0, seen: 0 }) }))
      .map((x) => ({ ...x, pct: x.t ? Math.round((x.s / x.t) * 100) : 0 }))
      .sort((a, b) => a.pct - b.pct || b.t - a.t);
  }, [bank, rates]);

  const ratedTotal = Object.keys(rates).length;
  const lastCh = last?.ch ? chapter(last.ch) : undefined;

  const reset = () => {
    if (confirm('Apagar progresso, notas, quizzes e respostas guardadas neste browser?')) clearPrefix();
  };

  return (
    <div className="page page--wide">
      <section className={s.hero}>
        <div>
          <h1 className={s.title}>Mock Interview<small>Java Backend Sénior</small></h1>
          <p className={s.tag}>{book.subtitle}</p>
          <div className={s.cta}>
            <Link to={chapterPath(lastCh?.n ?? 1)} className="btn btn--primary btn--lg">
              {lastCh ? `Continuar: ${lastCh.n}. ${lastCh.title}` : 'Começar pelo capítulo 1'}
            </Link>
            <Link to="/simulacao" className="btn btn--lg">Simulação cronometrada</Link>
            <Link to="/playground" className="btn btn--lg">Playground</Link>
            <button type="button" className="btn btn--lg" onClick={openSearch}>Pesquisar</button>
          </div>
        </div>
        <div className={s.stats} aria-label="Conteúdo do livro">
          <div className={s.stat}><b>{book.chapters.length}</b><span>capítulos</span></div>
          <div className={s.stat}><b>{book.totals.questions}</b><span>perguntas de entrevista</span></div>
          <div className={s.stat}><b>{book.totals.labs}</b><span>exercícios de código</span></div>
          <div className={s.stat}><b>{book.totals.listings}</b><span>listagens</span></div>
          <div className={s.stat}><b>{book.totals.quiz}</b><span>perguntas de quiz</span></div>
          <div className={s.stat}><b>{book.totals.sections}</b><span>secções</span></div>
        </div>
      </section>

      <div className={s.grid}>
        <section className={cx('panel', s.mastery)} aria-labelledby="mastery-title">
          <h3 id="mastery-title">Onde está mais fraco</h3>
          <div className="hint">
            {ratedTotal
              ? `Calculado a partir das ${ratedTotal} auto-avaliações que fez nos cartões (Falhei / Parcial / Sólido). Estude primeiro as áreas com a barra mais curta.`
              : 'Ainda não avaliou nenhuma pergunta. Abra um cartão, responda em voz alta e classifique-se; esta tabela ordena as áreas pela mais fraca.'}
          </div>
          {bank && (
            <table className="data">
              <thead><tr><th>Área</th><th>Perguntas</th><th>Trabalhadas</th><th>Sólidas</th><th>Domínio</th></tr></thead>
              <tbody>
                {mastery.map((m) => (
                  <tr key={m.k}><td>{m.n}</td><td>{m.t}</td><td>{m.seen}</td><td>{m.s}</td>
                    <td><div className={cx('bar', m.pct >= 70 && 'bar--ok')} title={`${m.pct}%`}><i style={{ width: `${m.pct}%` }} /></div></td></tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        <section className="panel" aria-labelledby="progress-title">
          <h3 id="progress-title">Progresso</h3>
          <div className="hint">{read.length} de {book.chapters.length} capítulos marcados como lidos; {ratedTotal} de {book.totals.questions} perguntas avaliadas.</div>
          <table className="data">
            <tbody>
              <tr><td>Capítulos lidos</td><td><div className="bar"><i style={{ width: `${Math.round((read.length / book.chapters.length) * 100)}%` }} /></div></td></tr>
              <tr><td>Perguntas avaliadas</td><td><div className="bar"><i style={{ width: `${Math.round((ratedTotal / book.totals.questions) * 100)}%` }} /></div></td></tr>
            </tbody>
          </table>
          <div className={s.danger}>
            <button type="button" className="btn btn--sm" onClick={() => exportAllNotes()}>Exportar notas (.md)</button>
            <button type="button" className="btn btn--sm btn--danger" onClick={reset}>Limpar progresso</button>
          </div>
        </section>
      </div>

      <div className={s.parts}>
        {chaptersByPart().map(({ part, chapters }) => (
          <section key={part.p} className={s.part} aria-labelledby={`part-${part.p}`}>
            <div className={s.partHead}>
              <div className={s.partNum}>{part.n}</div>
              <h2 id={`part-${part.p}`} className={s.partTitle}>{part.t}</h2>
            </div>
            <div className={s.cards}>
              {chapters.map((c) => {
                const p = byChapter.get(c.n) ?? { rated: 0, solid: 0 };
                const done = isRead(c.n);
                return (
                  <Link key={c.n} to={chapterPath(c.n)} className={cx(s.card, done && s.done)}>
                    <div className={s.cnum}><span>Capítulo {c.n}</span>{done && <span className={s.ok}>✓ lido</span>}</div>
                    <div className={s.ctitle}>{c.title}</div>
                    <div className={s.cmeta}>
                      <span>{c.counts.questions} perguntas</span>
                      {c.counts.labs > 0 && <span>{c.counts.labs} exerc.</span>}
                      <span className="bar bar--ok" title={`${p.solid} sólidas de ${c.counts.questions}`}><i style={{ width: `${c.counts.questions ? Math.round((p.solid / c.counts.questions) * 100) : 0}%` }} /></span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <section className={cx('panel', s.howto)} aria-labelledby="howto-title">
        <h3 id="howto-title">Como usar este livro</h3>
        <ul>
          <li><b>Cartões de pergunta</b>: leia a pergunta, responda em voz alta e só depois abra a resposta-modelo. Classifique-se (Falhei / Parcial / Sólido); a tabela «Onde está mais fraco» ordena as áreas.</li>
          <li><b>Rubrica</b>: cada resposta traz o que distingue um mid de um sénior e de um staff, os follow-ups prováveis e as red flags.</li>
          <li><b>Exercícios de código</b>: escreva a solução na caixa (fica guardada no browser) antes de abrir a solução de referência.</li>
          <li><b>Simulação</b>: <Link to="/simulacao">sessão cronometrada</Link> com perguntas sorteadas por área e nível, exportável para Markdown.</li>
          <li><b>Playground</b>: <Link to="/playground">exercício sorteado com relógio</Link> e um rascunho de código livre, com realce de sintaxe.</li>
          <li><b>Ferramentas</b>: <Link to="/ferramentas">calculadoras</Link> para as contas de entrevista — ondas num pool, retries, cauda do fan-out, lei de Little, Big-O, memória.</li>
          <li><b>Glossário</b>: <Link to="/glossario">os termos que aparecem nas entrevistas</Link>, com a definição curta e a ligação ao capítulo.</li>
          <li><b>Pesquisa</b>: <kbd className="key">Ctrl</kbd>+<kbd className="key">K</kbd> ou <kbd className="key">/</kbd> procura em perguntas, respostas, texto e código.</li>
          <li><b>Teclado</b>: <kbd className="key">←</kbd> <kbd className="key">→</kbd> mudam de capítulo; <kbd className="key">T</kbd> alterna o tema.</li>
          <li>Funciona sem ligação à Internet. Progresso, notas e respostas ficam apenas neste browser.</li>
        </ul>
      </section>
    </div>
  );
}
