/** Fórmulas das «Ferramentas»: puras, sem React, testáveis. */

/** N tarefas de duração d num pool de P threads: ondas × d. */
export function poolTime(n: number, p: number, d: number): { waves: number; total: number } {
  if (n <= 0 || p <= 0) return { waves: 0, total: 0 };
  const waves = Math.ceil(n / p);
  return { waves, total: waves * d };
}
/** Sequencial soma; paralelo é o máximo. */
export function seqVsPar(durations: number[]): { seq: number; par: number; gain: number } {
  const ds = durations.filter((x) => Number.isFinite(x) && x >= 0);
  const seq = ds.reduce((a, b) => a + b, 0);
  const par = ds.length ? Math.max(...ds) : 0;
  return { seq, par, gain: seq - par };
}
/** Pior caso com retries e backoff exponencial: cada tentativa expira e espera antes da seguinte. */
export function retryWorstCase(timeout: number, attempts: number, backoff: number, factor = 2): { total: number; steps: number[] } {
  const steps: number[] = [];
  let total = 0;
  for (let i = 0; i < attempts; i++) {
    const wait = i < attempts - 1 ? backoff * factor ** i : 0;
    steps.push(timeout + wait);
    total += timeout + wait;
  }
  return { total, steps };
}
/** Probabilidade de pelo menos uma de n chamadas paralelas cair na cauda (p por chamada). */
export function tailProbability(n: number, p: number): number {
  if (n <= 0) return 0;
  return 1 - (1 - p) ** n;
}
/** Lei de Little: concorrência = taxa × tempo de serviço. Threads necessárias para uma utilização alvo. */
export function little(rps: number, latencyMs: number, utilization = 0.7): { inFlight: number; threads: number } {
  const inFlight = (rps * latencyMs) / 1000;
  return { inFlight, threads: utilization > 0 ? Math.ceil(inFlight / utilization) : Infinity };
}
export const COMPLEXITIES: { k: string; label: string; f: (n: number) => number }[] = [
  { k: '1', label: 'O(1)', f: () => 1 },
  { k: 'logn', label: 'O(log n)', f: (n) => Math.log2(Math.max(n, 1)) },
  { k: 'n', label: 'O(n)', f: (n) => n },
  { k: 'nlogn', label: 'O(n log n)', f: (n) => n * Math.log2(Math.max(n, 1)) },
  { k: 'n2', label: 'O(n²)', f: (n) => n * n },
  { k: 'n3', label: 'O(n³)', f: (n) => n ** 3 },
  { k: '2n', label: 'O(2ⁿ)', f: (n) => 2 ** n },
  { k: 'nfact', label: 'O(n!)', f: (n) => { let r = 1; for (let i = 2; i <= n; i++) { r *= i; if (!Number.isFinite(r)) break; } return r; } },
];
/** Tempo humano a partir de operações e ritmo (ops/s). */
export function humanTime(ops: number, opsPerSec = 1e9): string {
  if (!Number.isFinite(ops)) return 'além da idade do universo';
  const s = ops / opsPerSec;
  if (s < 1e-6) return `${(s * 1e9).toPrecision(3)} ns`;
  if (s < 1e-3) return `${(s * 1e6).toPrecision(3)} µs`;
  if (s < 1) return `${(s * 1e3).toPrecision(3)} ms`;
  if (s < 60) return `${s.toPrecision(3)} s`;
  if (s < 3600) return `${(s / 60).toPrecision(3)} min`;
  if (s < 86400) return `${(s / 3600).toPrecision(3)} h`;
  if (s < 86400 * 365) return `${(s / 86400).toPrecision(3)} dias`;
  const years = s / (86400 * 365);
  return years > 1.4e10 ? 'além da idade do universo' : `${years.toPrecision(3)} anos`;
}
export function humanBytes(b: number): string {
  if (!Number.isFinite(b) || b < 0) return '—';
  const u = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let i = 0;
  while (b >= 1024 && i < u.length - 1) { b /= 1024; i++; }
  return `${b < 10 ? b.toFixed(2) : b < 100 ? b.toFixed(1) : Math.round(b)} ${u[i]}`;
}
/** Memória aproximada de N objectos no heap: cabeçalho (12 B com compressed oops) + campos, alinhado a 8. */
export function objectMemory(count: number, fieldBytes: number, header = 12): { each: number; total: number } {
  const each = Math.ceil((header + fieldBytes) / 8) * 8;
  return { each, total: each * count };
}
export const fmt = (n: number, digits = 0) => Number.isFinite(n) ? n.toLocaleString('pt-PT', { maximumFractionDigits: digits }) : '∞';
