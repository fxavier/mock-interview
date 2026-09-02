import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { book, chapterPath, loadBank } from '@/lib/book';
import { useShell } from '@/components/Shell';
import { KEYS, useStored } from '@/lib/storage';
import { downloadText } from '@/lib/download';
import { formatClock, inlineCode, shuffle, cx } from '@/lib/util';
import type { BankQuestion, Level, MockRun } from '@/lib/types';
import s from './SimulationPage.module.css';

type Phase = 'setup' | 'running' | 'result';
interface Session {
  qs: BankQuestion[]; i: number; perQ: number; left: number; started: number;
  notes: Record<string, string>; marks: Record<string, { answered: boolean; spent: number }>;
}
const EMPTY_HIST: MockRun[] = [];
const areaName = (k: string) => book.areas.find((a) => a.k === k)?.n ?? k;

export function SimulationPage() {
  const { setCrumb } = useShell();
  const [bank, setBank] = useState<BankQuestion[] | null>(null);
  const [level, setLevel] = useState<Level | 'all'>('senior');
  const [count, setCount] = useState(8);
  const [perQ, setPerQ] = useState(300);
  const [areas, setAreas] = useState<Set<string>>(() => new Set(book.areas.map((a) => a.k)));
  const [phase, setPhase] = useState<Phase>('setup');
  const [sess, setSess] = useState<Session | null>(null);
  const [hist, setHist] = useStored<MockRun[]>(KEYS.mock, EMPTY_HIST);
  const timer = useRef<number | null>(null);

  useEffect(() => { setCrumb('Simulação de entrevista'); document.title = 'Simulação — Mock Interview Java Sénior'; }, [setCrumb]);
  useEffect(() => { loadBank().then(setBank).catch(() => setBank([])); }, []);

  const pool = useMemo(() => (bank ?? []).filter((q) => areas.has(q.a) && (level === 'all' || q.l === level)), [bank, areas, level]);

  // relógio
  useEffect(() => {
    if (phase !== 'running') return;
    timer.current = window.setInterval(() => setSess((st) => (st ? { ...st, left: st.left - 1 } : st)), 1000);
    return () => { if (timer.current) window.clearInterval(timer.current); };
  }, [phase]);

  // aviso ao sair a meio
  useEffect(() => {
    if (phase !== 'running') return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [phase]);

  const start = () => {
    if (pool.length < 3) return;
    setSess({ qs: shuffle(pool).slice(0, Math.min(count, pool.length)), i: 0, perQ, left: perQ, started: Date.now(), notes: {}, marks: {} });
    setPhase('running');
  };
  const advance = (answered: boolean) => setSess((st) => {
    if (!st) return st;
    const q = st.qs[st.i];
    const marks = { ...st.marks, [q.id]: { answered, spent: st.perQ - st.left } };
    if (st.i === st.qs.length - 1) { finish({ ...st, marks }); return { ...st, marks }; }
    return { ...st, marks, i: st.i + 1, left: st.perQ };
  });
  const finish = (st: Session) => {
    const done = Object.values(st.marks).filter((m) => m.answered).length;
    const min = Math.max(1, Math.round((Date.now() - st.started) / 60000));
    setHist((h) => [...h, { d: new Date().toISOString().slice(0, 10), n: st.qs.length, ok: done, min }].slice(-40));
    setPhase('result');
  };
  const abort = () => { if (sess && confirm('Terminar a simulação e ver o resultado?')) finish(sess); };
  const exportMd = () => {
    if (!sess) return;
    let out = `# Simulação de entrevista — ${new Date().toLocaleString('pt-PT')}\n\n`;
    sess.qs.forEach((q, i) => {
      out += `## ${i + 1}. [${areaName(q.a)}] ${q.q}\n\n${sess.notes[q.id] || '_(sem notas)_'}\n\nResposta-modelo: capítulo ${q.c}, cartão ${q.id}\n\n`;
    });
    downloadText('simulacao-entrevista.md', out);
  };
  const toggleArea = (k: string) => setAreas((a) => { const n = new Set(a); if (n.has(k)) n.delete(k); else n.add(k); return n; });

  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <h1 className={s.title}>Simulação de entrevista</h1>
      <p className={s.intro}>Escolha as áreas, o nível e o tempo por pergunta. Responda em voz alta, como numa entrevista real, e escreva os pontos que referiu. No fim recebe a lista com a ligação para a resposta-modelo de cada pergunta.</p>

      {phase === 'setup' && (
        <>
          <section className="panel" aria-labelledby="setup-title">
            <h3 id="setup-title">Configurar sessão</h3>
            <div className={s.setup}>
              <div className={s.fld}><label htmlFor="lvl">Nível das perguntas</label>
                <select id="lvl" className="select" value={level} onChange={(e) => setLevel(e.target.value as Level | 'all')}>
                  <option value="all">Todos os níveis</option><option value="mid">Mid</option><option value="senior">Sénior</option><option value="staff">Staff</option>
                </select></div>
              <div className={s.fld}><label htmlFor="cnt">Número de perguntas</label>
                <select id="cnt" className="select" value={count} onChange={(e) => setCount(+e.target.value)}>
                  {[5, 8, 12, 20].map((n) => <option key={n} value={n}>{n}</option>)}
                </select></div>
              <div className={s.fld}><label htmlFor="tm">Tempo por pergunta</label>
                <select id="tm" className="select" value={perQ} onChange={(e) => setPerQ(+e.target.value)}>
                  <option value={180}>3 minutos</option><option value={300}>5 minutos</option><option value={600}>10 minutos</option><option value={1200}>20 minutos (system design)</option>
                </select></div>
            </div>
            <div className={s.areasHead}>
              <h3>Áreas</h3>
              <button type="button" className="btn btn--sm" onClick={() => setAreas(new Set(areas.size === book.areas.length ? [] : book.areas.map((a) => a.k)))}>
                {areas.size === book.areas.length ? 'Desmarcar todas' : 'Marcar todas'}
              </button>
            </div>
            <div className={s.areas}>
              {book.areas.map((a) => (
                <label key={a.k}><input type="checkbox" checked={areas.has(a.k)} onChange={() => toggleArea(a.k)} /> {a.n} <small>{a.count}</small></label>
              ))}
            </div>
            <div className={s.pool} aria-live="polite">
              {bank ? `${pool.length} perguntas disponíveis com estes filtros${pool.length < 3 ? ' — escolha mais áreas ou outro nível.' : '.'}` : 'A carregar o banco de perguntas…'}
            </div>
            <div style={{ marginTop: 16 }}>
              <button type="button" className="btn btn--primary btn--lg" onClick={start} disabled={pool.length < 3}>Começar simulação</button>
            </div>
          </section>
          {hist.length > 0 && (
            <section className="panel" style={{ marginTop: 20 }} aria-labelledby="hist-title">
              <h3 id="hist-title">Simulações anteriores</h3>
              <table className="data"><thead><tr><th>Data</th><th>Perguntas</th><th>Respondidas</th><th>Duração</th></tr></thead>
                <tbody>{hist.slice().reverse().slice(0, 12).map((h, i) => <tr key={i}><td>{h.d}</td><td>{h.n}</td><td>{h.ok}</td><td>{h.min} min</td></tr>)}</tbody></table>
            </section>
          )}
        </>
      )}

      {phase === 'running' && sess && (() => {
        const q = sess.qs[sess.i];
        const isLast = sess.i === sess.qs.length - 1;
        return (
          <section aria-live="polite">
            <div className={s.bar}>
              <div className={cx(s.clock, sess.left <= 30 && sess.left >= 0 && s.warn, sess.left < 0 && s.over)} role="timer" aria-label="Tempo restante">{formatClock(sess.left)}</div>
              <div className={s.pos}>Pergunta <b>{sess.i + 1}</b> de {sess.qs.length}</div>
              <div className={s.grow} />
              <button type="button" className="btn" onClick={() => advance(false)}>Saltar</button>
              <button type="button" className="btn btn--primary" onClick={() => advance(true)}>{isLast ? 'Terminar' : 'Seguinte →'}</button>
              <button type="button" className="btn btn--ghost btn--danger" onClick={abort}>Abortar</button>
            </div>
            <div className={s.q}>
              <div className={s.qtag}><b>{areaName(q.a)}</b><span>nível {book.levels[q.l]}</span><span>capítulo {q.c}</span></div>
              <div className={s.qtext}>{inlineCode(q.q)}</div>
              <textarea key={q.id} className="textarea" value={sess.notes[q.id] ?? ''} placeholder="Responda em voz alta e escreva aqui os pontos que referiu…" aria-label="Pontos referidos"
                onChange={(e) => setSess((st) => (st ? { ...st, notes: { ...st.notes, [q.id]: e.target.value } } : st))} />
              <div className={s.hint}>Fale em voz alta como numa entrevista real. No fim, compare com a resposta-modelo do capítulo.</div>
            </div>
          </section>
        );
      })()}

      {phase === 'result' && sess && (
        <section className="panel" aria-labelledby="res-title">
          <h3 id="res-title">Resultado da simulação</h3>
          <p>Respondeu a <b>{Object.values(sess.marks).filter((m) => m.answered).length}</b> de <b>{sess.qs.length}</b> perguntas em cerca de <b>{Math.max(1, Math.round((Date.now() - sess.started) / 60000))} min</b>. Reveja cada resposta-modelo e classifique-se no cartão de cada pergunta.</p>
          <table className={cx('data', s.result)}>
            <thead><tr><th>Área</th><th>Pergunta</th><th>Tempo</th><th>Estado</th><th>Capítulo</th></tr></thead>
            <tbody>
              {sess.qs.map((q) => {
                const m = sess.marks[q.id];
                return (
                  <tr key={q.id}><td>{areaName(q.a)}</td><td>{inlineCode(q.q)}</td><td>{m ? formatClock(m.spent) : '—'}</td>
                    <td>{m?.answered ? 'respondida' : 'saltada'}</td><td><Link to={chapterPath(q.c, q.id)}>ver resposta-modelo</Link></td></tr>
                );
              })}
            </tbody>
          </table>
          <div className={s.actions}>
            <button type="button" className="btn btn--primary" onClick={() => { setSess(null); setPhase('setup'); }}>Nova simulação</button>
            <button type="button" className="btn" onClick={exportMd}>Exportar respostas (.md)</button>
          </div>
        </section>
      )}
    </div>
  );
}
