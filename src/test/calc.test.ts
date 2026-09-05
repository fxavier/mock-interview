import { describe, expect, it } from 'vitest';
import { humanTime, little, objectMemory, poolTime, retryWorstCase, seqVsPar, tailProbability } from '@/lib/calc';

describe('calc', () => {
  it('ondas num pool: ⌈N/P⌉ × d', () => {
    expect(poolTime(5, 2, 200)).toEqual({ waves: 3, total: 600 });
    expect(poolTime(3, 3, 300).total).toBe(300);
    expect(poolTime(0, 2, 100).total).toBe(0);
  });
  it('sequencial soma, paralelo é o máximo', () => {
    expect(seqVsPar([100, 200, 300])).toEqual({ seq: 600, par: 300, gain: 300 });
  });
  it('pior caso com retries multiplica o timeout e soma o backoff', () => {
    const r = retryWorstCase(2000, 3, 100);
    expect(r.steps).toEqual([2100, 2200, 2000]);
    expect(r.total).toBe(6300);
  });
  it('cauda do fan-out: 1 − (1 − p)ⁿ', () => {
    expect(tailProbability(10, 0.01)).toBeCloseTo(0.0956, 3);
    expect(tailProbability(1, 0.01)).toBeCloseTo(0.01);
  });
  it('lei de Little', () => {
    expect(little(200, 50, 1).inFlight).toBe(10);
    expect(little(200, 50, 0.7).threads).toBe(15);
  });
  it('memória alinhada a 8 bytes', () => {
    expect(objectMemory(1, 4).each).toBe(16);
    expect(objectMemory(1_000_000, 20).total).toBe(32_000_000);
  });
  it('tempo humano', () => {
    expect(humanTime(1e9)).toBe('1.00 s');
    expect(humanTime(Infinity)).toBe('além da idade do universo');
  });
});
