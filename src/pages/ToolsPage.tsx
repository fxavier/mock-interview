import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useShell } from '@/components/Shell';
import { chapterPath } from '@/lib/book';
import { COMPLEXITIES, fmt, humanBytes, humanTime, little, objectMemory, poolTime, retryWorstCase, seqVsPar, tailProbability } from '@/lib/calc';
import s from './ToolsPage.module.css';

const TOOLS = [
  { id: 'pool', t: 'Ondas num pool', d: 'N tarefas de duração d em P threads.' },
  { id: 'seqpar', t: 'Sequencial vs paralelo', d: 'Soma contra caminho crítico.' },
  { id: 'retry', t: 'Pior caso com retries', d: 'Timeout × tentativas + backoff.' },
  { id: 'tail', t: 'Cauda do fan-out', d: 'Probabilidade de apanhar o p99.' },
  { id: 'little', t: 'Lei de Little', d: 'Dimensionar pools de threads e ligações.' },
  { id: 'bigo', t: 'Big-O para o seu n', d: 'Operações e tempo por classe.' },
  { id: 'mem', t: 'Memória de objectos', d: 'N objectos no heap, alinhados.' },
];

function Num({ id, label, value, onChange, min = 0, step = 1, unit }: { id: string; label: string; value: number; onChange: (v: number) => void; min?: number; step?: number; unit?: string }) {
  return (
    <label className={s.fld} htmlFor={id}>
      <span>{label}{unit && <small> ({unit})</small>}</span>
      <input id={id} className="input" type="number" inputMode="decimal" min={min} step={step} value={Number.isFinite(value) ? value : ''} onChange={(e) => onChange(e.target.valueAsNumber)} />
    </label>
  );
}
function Tool({ id, title, intro, children, out, cap }: { id: string; title: string; intro: string; children: ReactNode; out: ReactNode; cap: number }) {
  return (
    <section className={s.tool} id={id} aria-labelledby={`${id}-t`}>
      <div className={s.toolHead}><h3 id={`${id}-t`}>{title}</h3><Link to={chapterPath(cap)} className={s.cap}>cap. {cap}</Link></div>
      <p className={s.toolIntro}>{intro}</p>
      <div className={s.form}>{children}</div>
      <div className={s.out} aria-live="polite">{out}</div>
    </section>
  );
}
const n = (v: number, d = 0) => Number.isFinite(v) ? v : d;

export function ToolsPage() {
  const { setCrumb } = useShell();
  useEffect(() => { setCrumb('Ferramentas'); document.title = 'Ferramentas — Mock Interview Java Sénior'; }, [setCrumb]);

  const [pool, setPool] = useState({ n: 5, p: 2, d: 200 });
  const [durs, setDurs] = useState('100, 200, 300');
  const [retry, setRetry] = useState({ timeout: 2000, attempts: 3, backoff: 100 });
  const [tail, setTail] = useState({ n: 10, p: 1 });
  const [lit, setLit] = useState({ rps: 200, lat: 50, util: 70 });
  const [bigo, setBigo] = useState({ n: 1000, ops: 1e9 });
  const [mem, setMem] = useState({ count: 1_000_000, fields: 20, heap: 512 });

  const pt = poolTime(n(pool.n), n(pool.p), n(pool.d));
  const sp = seqVsPar(durs.split(/[,\s;]+/).map(Number));
  const rw = retryWorstCase(n(retry.timeout), n(retry.attempts), n(retry.backoff));
  const tp = tailProbability(n(tail.n), n(tail.p) / 100);
  const li = little(n(lit.rps), n(lit.lat), n(lit.util) / 100);
  const om = objectMemory(n(mem.count), n(mem.fields));

  return (
    <div className="page" style={{ maxWidth: 980 }}>
      <h1 className={s.title}>Ferramentas</h1>
      <p className={s.intro}>As contas que se fazem de cabeça na entrevista, com a fórmula à vista para as poder verbalizar. Nada é guardado; são calculadoras de bolso para treinar ordens de grandeza.</p>
      <nav className={s.toc} aria-label="Ferramentas">
        {TOOLS.map((t) => <a key={t.id} href={`#${t.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(t.id)?.scrollIntoView({ block: 'start' }); }}><b>{t.t}</b><span>{t.d}</span></a>)}
      </nav>

      <Tool id="pool" title="Ondas num pool" cap={13} intro="N tarefas de duração igual num pool de P threads demoram ⌈N/P⌉ × d. É a conta que explica 350 ms onde a intuição diz 300."
        out={<><b>{fmt(pt.waves)} onda{pt.waves === 1 ? '' : 's'}</b> → total ≈ <b>{fmt(pt.total)} ms</b> <span className={s.formula}>⌈{n(pool.n)}/{n(pool.p)}⌉ × {n(pool.d)}</span>{n(pool.n) > n(pool.p) && <div className={s.note}>Com {n(pool.n)} threads (ou threads virtuais) seriam {fmt(n(pool.d))} ms — o máximo em vez das ondas.</div>}</>}>
        <Num id="pool-n" label="Tarefas (N)" value={pool.n} onChange={(v) => setPool({ ...pool, n: v })} />
        <Num id="pool-p" label="Threads (P)" value={pool.p} onChange={(v) => setPool({ ...pool, p: v })} min={1} />
        <Num id="pool-d" label="Duração de cada" unit="ms" value={pool.d} onChange={(v) => setPool({ ...pool, d: v })} />
      </Tool>

      <Tool id="seqpar" title="Sequencial vs paralelo" cap={13} intro="Chamadas independentes em sequência somam; em paralelo, o tempo é o da mais lenta (o caminho crítico). O ganho não é «n vezes mais rápido» — é a diferença entre a soma e o máximo."
        out={<>Sequencial <b>{fmt(sp.seq)} ms</b> · paralelo <b>{fmt(sp.par)} ms</b> · ganho <b>{fmt(sp.gain)} ms</b> ({sp.seq ? Math.round((sp.gain / sp.seq) * 100) : 0}%)<div className={s.note}>Em paralelo, o pedido sofre a cauda de cada chamada — veja «Cauda do fan-out».</div></>}>
        <label className={s.fld} htmlFor="durs" style={{ gridColumn: '1 / -1' }}><span>Durações das chamadas <small>(ms, separadas por vírgula)</small></span>
          <input id="durs" className="input" value={durs} onChange={(e) => setDurs(e.target.value)} /></label>
      </Tool>

      <Tool id="retry" title="Pior caso com retries" cap={16} intro="Um timeout de 2 s com três tentativas não é um pior caso de 2 s — é 6 s mais o backoff. Só se repete o que é idempotente, e o orçamento do chamador tem de cobrir a soma."
        out={<>Pior caso <b>{fmt(rw.total)} ms</b> ({(rw.total / 1000).toFixed(1)} s) <span className={s.formula}>{rw.steps.map((x) => fmt(x)).join(' + ')}</span></>}>
        <Num id="rt-t" label="Timeout por tentativa" unit="ms" value={retry.timeout} onChange={(v) => setRetry({ ...retry, timeout: v })} />
        <Num id="rt-a" label="Tentativas" value={retry.attempts} onChange={(v) => setRetry({ ...retry, attempts: v })} min={1} />
        <Num id="rt-b" label="Backoff inicial (×2 por tentativa)" unit="ms" value={retry.backoff} onChange={(v) => setRetry({ ...retry, backoff: v })} />
      </Tool>

      <Tool id="tail" title="Cauda do fan-out" cap={34} intro="Se cada chamada tem p% de cair na cauda, um pedido que espera por n chamadas em paralelo apanha a cauda com probabilidade 1 − (1 − p)ⁿ. Dez chamadas com p99 já dão quase 10% dos pedidos lentos."
        out={<>Probabilidade de pelo menos uma lenta: <b>{(tp * 100).toFixed(1)}%</b> <span className={s.formula}>1 − (1 − {n(tail.p)}%)^{n(tail.n)}</span><div className={s.note}>O p{100 - n(tail.p)} de cada dependência passa a ser aproximadamente o p{Math.round((1 - tp) * 100)} do pedido.</div></>}>
        <Num id="tl-n" label="Chamadas em paralelo (n)" value={tail.n} onChange={(v) => setTail({ ...tail, n: v })} min={1} />
        <Num id="tl-p" label="Probabilidade de cauda por chamada" unit="%" value={tail.p} onChange={(v) => setTail({ ...tail, p: v })} step={0.1} />
      </Tool>

      <Tool id="little" title="Lei de Little: dimensionar um pool" cap={34} intro="L = λ × W: pedidos em curso = taxa × tempo de serviço. O pool de threads (ou de ligações) tem de cobrir os pedidos em curso com folga; acima de ~70% de utilização, a fila cresce depressa."
        out={<>Em curso em média: <b>{fmt(li.inFlight, 1)}</b> <span className={s.formula}>{n(lit.rps)} × {n(lit.lat)} ms</span> → pool de <b>{fmt(li.threads)}</b> a {n(lit.util)}% de utilização<div className={s.note}>Para I/O-bound com threads de plataforma, é este o número; com threads virtuais deixa de haver pool para dimensionar e o limite passa a ser a dependência.</div></>}>
        <Num id="li-r" label="Pedidos por segundo (λ)" value={lit.rps} onChange={(v) => setLit({ ...lit, rps: v })} />
        <Num id="li-l" label="Latência média (W)" unit="ms" value={lit.lat} onChange={(v) => setLit({ ...lit, lat: v })} />
        <Num id="li-u" label="Utilização alvo" unit="%" value={lit.util} onChange={(v) => setLit({ ...lit, util: v })} min={1} />
      </Tool>

      <Tool id="bigo" title="Big-O para o seu n" cap={26} intro="A notação esconde constantes; esta tabela mostra o que cada classe custa para o n concreto e quanto tempo isso é a um ritmo dado. Serve para responder «para o n que temos, vale a pena mudar?»."
        out={
          <table className="data">
            <thead><tr><th>Classe</th><th>Operações</th><th>Tempo a {fmt(n(bigo.ops))} ops/s</th></tr></thead>
            <tbody>{COMPLEXITIES.map((c) => { const ops = c.f(n(bigo.n)); return <tr key={c.k}><td><code>{c.label}</code></td><td>{Number.isFinite(ops) ? fmt(Math.round(ops)) : '∞'}</td><td>{humanTime(ops, n(bigo.ops, 1e9))}</td></tr>; })}</tbody>
          </table>}>
        <Num id="bo-n" label="n" value={bigo.n} onChange={(v) => setBigo({ ...bigo, n: v })} />
        <Num id="bo-o" label="Operações por segundo" value={bigo.ops} onChange={(v) => setBigo({ ...bigo, ops: v })} step={1e8} />
      </Tool>

      <Tool id="mem" title="Memória de objectos no heap" cap={10} intro="Cada objecto paga um cabeçalho (12 bytes com compressed oops) e é alinhado a 8 bytes. Um milhão de objectos pequenos raramente é o que se pensa — e uma cache «de 100 MB» costuma ser o dobro."
        out={<>Cada objecto ≈ <b>{om.each} B</b> · total ≈ <b>{humanBytes(om.total)}</b> {n(mem.heap) > 0 && <span className={s.note} style={{ display: 'inline' }}>= {((om.total / (n(mem.heap) * 1024 * 1024)) * 100).toFixed(1)}% de um heap de {n(mem.heap)} MB</span>}<div className={s.note}>Não inclui o que os campos referenciam: uma <code>String</code> de 20 caracteres são mais ~64 B (objecto + array de bytes).</div></>}>
        <Num id="mm-c" label="Número de objectos" value={mem.count} onChange={(v) => setMem({ ...mem, count: v })} />
        <Num id="mm-f" label="Bytes de campos por objecto" unit="ex.: int + long + ref = 4+8+4" value={mem.fields} onChange={(v) => setMem({ ...mem, fields: v })} />
        <Num id="mm-h" label="Heap" unit="MB" value={mem.heap} onChange={(v) => setMem({ ...mem, heap: v })} />
      </Tool>
    </div>
  );
}
