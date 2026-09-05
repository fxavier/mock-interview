import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { book, chapter, chapterPath, loadBody, loadLabs } from '@/lib/book';
import { useShell } from '@/components/Shell';
import { ContentRenderer } from '@/content/ContentRenderer';
import { CodeEditor } from '@/components/CodeEditor';
import { KEYS, useStored } from '@/lib/storage';
import { copyText, downloadText } from '@/lib/download';
import { formatClock, cx } from '@/lib/util';
import type { LabMeta, Pad } from '@/lib/types';
import s from './PlaygroundPage.module.css';

const LANGS = ['java', 'sql', 'shell', 'yaml', 'json', 'hcl', 'text'];
const EXT: Record<string, string> = { java: 'java', sql: 'sql', shell: 'sh', yaml: 'yaml', json: 'json', hcl: 'tf', text: 'txt' };
const EMPTY_PADS: Pad[] = [];
const newPad = (lang = 'java'): Pad => ({ id: `p${Date.now().toString(36)}`, name: 'Rascunho', lang, code: '' });
const minutesOf = (lab: LabMeta) => Number(lab.pills.map((p) => p.match(/^(\d+)\s*min/)?.[1]).find(Boolean) ?? 20);

/** Extrai o bloco de um exercício do corpo do capítulo, no browser, sem regex sobre HTML. */
function extractLab(body: string, id: string): string | null {
  const doc = new DOMParser().parseFromString(body, 'text/html');
  return doc.getElementById(id)?.outerHTML ?? null;
}

export function PlaygroundPage() {
  const { setCrumb } = useShell();
  const location = useLocation();
  const navigate = useNavigate();
  const target = location.hash.slice(1);
  const [tab, setTab] = useState<'lab' | 'pad'>(target === 'rascunho' ? 'pad' : 'lab');

  useEffect(() => { setCrumb('Playground'); document.title = 'Playground — Mock Interview Java Sénior'; }, [setCrumb]);

  return (
    <div className="page" style={{ maxWidth: 980 }}>
      <h1 className={s.title}>Playground</h1>
      <p className={s.intro}>Treino de live coding sem sair do livro: sorteie um exercício, ponha o relógio a contar e escreva antes de ver a solução — o código fica guardado e aparece também no capítulo. Ou use o rascunho livre para pensar em código durante uma resposta.</p>
      <div className={s.tabs} role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'lab'} className={cx('btn', tab === 'lab' && 'btn--on')} onClick={() => { setTab('lab'); navigate('/playground', { replace: true }); }}>Exercício cronometrado</button>
        <button type="button" role="tab" aria-selected={tab === 'pad'} className={cx('btn', tab === 'pad' && 'btn--on')} onClick={() => { setTab('pad'); navigate('/playground#rascunho', { replace: true }); }}>Rascunho livre</button>
      </div>
      {tab === 'lab' ? <LabMode target={target && target !== 'rascunho' ? target : null} /> : <PadMode />}
    </div>
  );
}

/* ---------------- Exercício cronometrado ---------------- */
function LabMode({ target }: { target: string | null }) {
  const navigate = useNavigate();
  const [labs, setLabs] = useState<LabMeta[] | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lab = useMemo(() => labs?.find((l) => l.id === target) ?? null, [labs, target]);

  useEffect(() => { loadLabs().then(setLabs).catch(() => setLabs([])); }, []);
  useEffect(() => {
    setHtml(null); setError(null);
    if (!lab) return;
    let alive = true;
    loadBody(lab.c).then((b) => {
      if (!alive) return;
      const frag = extractLab(b, lab.id);
      if (frag) setHtml(frag); else setError('Exercício não encontrado no capítulo.');
    }).catch((e: Error) => alive && setError(e.message));
    return () => { alive = false; };
  }, [lab]);

  const pick = (id: string) => navigate(id ? `/playground#${id}` : '/playground');
  const random = () => {
    if (!labs?.length) return;
    const others = labs.filter((l) => l.id !== target);
    pick(others[Math.floor(Math.random() * others.length)].id);
  };
  const byChapter = useMemo(() => {
    const m = new Map<number, LabMeta[]>();
    for (const l of labs ?? []) m.set(l.c, [...(m.get(l.c) ?? []), l]);
    return [...m.entries()];
  }, [labs]);

  return (
    <>
      <section className="panel">
        <div className={s.pickRow}>
          <label className={s.fld} htmlFor="lab-sel"><span>Exercício</span>
            <select id="lab-sel" className="select" value={target ?? ''} onChange={(e) => pick(e.target.value)} disabled={!labs}>
              <option value="">{labs ? `Escolher entre ${labs.length} exercícios…` : 'A carregar…'}</option>
              {byChapter.map(([c, ls]) => (
                <optgroup key={c} label={`${c}. ${chapter(c)?.title ?? ''}`}>
                  {ls.map((l) => <option key={l.id} value={l.id}>{l.t}</option>)}
                </optgroup>
              ))}
            </select></label>
          <button type="button" className="btn btn--primary" onClick={random} disabled={!labs?.length}>Sortear</button>
        </div>
        {lab && <Timer key={lab.id} minutes={minutesOf(lab)} />}
      </section>

      {!lab && labs && (
        <div className={s.empty}>
          <p>Sem exercício escolhido. Sorteie um, ou escolha pelo capítulo. Os {labs.length} exercícios do livro incluem implementação, refactor, modelação e «prever a saída».</p>
          <div className={s.kinds}>
            {[...new Set(labs.flatMap((l) => l.pills.filter((p) => !/min$/.test(p))))].map((k) => {
              const ls = labs.filter((l) => l.pills.includes(k));
              return <button key={k} type="button" className="pill" onClick={() => pick(ls[Math.floor(Math.random() * ls.length)].id)}>{k} <small>{ls.length}</small></button>;
            })}
          </div>
        </div>
      )}
      {error && <div className="panel" role="alert" style={{ marginTop: 16 }}><div className="hint" style={{ margin: 0 }}>{error}</div></div>}
      {lab && !html && !error && <div className="skeleton" style={{ height: 300, marginTop: 16 }} aria-busy="true" />}
      {lab && html && (
        <div className={s.labWrap}>
          <div className={s.labFrom}>Do capítulo <Link to={chapterPath(lab.c, lab.id)}>{lab.c}. {chapter(lab.c)?.title}</Link> — o que escrever aqui fica guardado no mesmo exercício do capítulo.</div>
          <ContentRenderer html={html} target={null} filter={null} />
        </div>
      )}
    </>
  );
}

function Timer({ minutes }: { minutes: number }) {
  const [total, setTotal] = useState(minutes * 60);
  const [left, setLeft] = useState(minutes * 60);
  const [running, setRunning] = useState(false);
  const ref = useRef<number | null>(null);
  useEffect(() => {
    if (!running) return;
    ref.current = window.setInterval(() => setLeft((l) => l - 1), 1000);
    return () => { if (ref.current) window.clearInterval(ref.current); };
  }, [running]);
  useEffect(() => { if (left === 0 && running && 'vibrate' in navigator) navigator.vibrate?.(200); }, [left, running]);
  const reset = useCallback((m: number) => { setRunning(false); setTotal(m * 60); setLeft(m * 60); }, []);
  const pct = Math.max(0, Math.min(100, ((total - left) / total) * 100));

  return (
    <div className={s.timer}>
      <div className={cx(s.clock, left <= 60 && left > 0 && s.warn, left <= 0 && s.over)} role="timer" aria-live="off">{formatClock(left)}</div>
      <div className={s.timerBar}><i style={{ width: `${pct}%` }} /></div>
      <div className={s.timerAct}>
        <button type="button" className={cx('btn', running ? '' : 'btn--primary')} onClick={() => setRunning((r) => !r)}>{running ? 'Pausar' : left === total ? 'Começar' : 'Continuar'}</button>
        <select className="select" value={total / 60} onChange={(e) => reset(+e.target.value)} aria-label="Duração" style={{ width: 'auto' }}>
          {[5, 10, 15, 20, 25, 30, 45].map((m) => <option key={m} value={m}>{m} min</option>)}
        </select>
        <button type="button" className="btn btn--ghost" onClick={() => reset(total / 60)}>Repor</button>
        <span className={s.timerHint}>{left < 0 ? 'Tempo excedido — em entrevista, resuma o que falta e como acabaria.' : running ? 'Fale em voz alta enquanto escreve.' : `Sugerido pelo exercício: ${minutes} min.`}</span>
      </div>
    </div>
  );
}

/* ---------------- Rascunho livre ---------------- */
function PadMode() {
  const [pads, setPads] = useStored<Pad[]>(KEYS.pads, EMPTY_PADS);
  const list = pads.length ? pads : [newPad()];
  const [cur, setCur] = useState(list[0].id);
  const pad = list.find((p) => p.id === cur) ?? list[0];
  const [copied, setCopied] = useState(false);

  const update = (patch: Partial<Pad>) => setPads((ps) => {
    const base = ps.length ? ps : list;
    return base.map((p) => (p.id === pad.id ? { ...p, ...patch } : p));
  });
  const add = () => { const p = newPad(pad.lang); setPads((ps) => [...(ps.length ? ps : list), p]); setCur(p.id); };
  const remove = () => {
    if (pad.code && !confirm('Apagar este rascunho?')) return;
    setPads((ps) => { const next = (ps.length ? ps : list).filter((p) => p.id !== pad.id); setCur(next[0]?.id ?? ''); return next; });
  };
  const copy = async () => { setCopied(await copyText(pad.code)); setTimeout(() => setCopied(false), 1500); };

  return (
    <section className={s.pad}>
      <div className={s.padBar}>
        <div className={s.padTabs} role="tablist" aria-label="Rascunhos">
          {list.map((p) => (
            <button key={p.id} type="button" role="tab" aria-selected={p.id === pad.id} className={cx(s.padTab, p.id === pad.id && s.padTabOn)} onClick={() => setCur(p.id)}>
              {p.name}<small>.{EXT[p.lang] ?? p.lang}</small>
            </button>
          ))}
          <button type="button" className="btn btn--sm btn--ghost" onClick={add} title="Novo rascunho">+ Novo</button>
        </div>
        <div className={s.padTools}>
          <input className="input" value={pad.name} onChange={(e) => update({ name: e.target.value })} aria-label="Nome do rascunho" style={{ width: 160 }} />
          <select className="select" value={pad.lang} onChange={(e) => update({ lang: e.target.value })} aria-label="Linguagem" style={{ width: 'auto' }}>
            {LANGS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <button type="button" className="btn btn--sm" onClick={copy} disabled={!pad.code}>{copied ? 'Copiado' : 'Copiar'}</button>
          <button type="button" className="btn btn--sm" onClick={() => downloadText(`${pad.name || 'rascunho'}.${EXT[pad.lang] ?? 'txt'}`, pad.code, 'text/plain;charset=utf-8')} disabled={!pad.code}>Descarregar</button>
          <button type="button" className="btn btn--sm btn--ghost btn--danger" onClick={remove} disabled={list.length === 1 && !pad.code}>Apagar</button>
        </div>
      </div>
      <CodeEditor value={pad.code} onChange={(code) => update({ code })} lang={pad.lang} minHeight={420} ariaLabel={`Rascunho ${pad.name}`}
        placeholder={`// ${book.title}\n// Rascunho livre: Tab indenta, Shift+Tab desindenta, Enter mantém a indentação.\n// Fica guardado neste browser.`} />
      <div className={s.padHint}>{pad.code.split('\n').length} linhas · {pad.code.length} caracteres · guardado automaticamente</div>
    </section>
  );
}
