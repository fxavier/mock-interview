import { describe, expect, it } from 'vitest';
import { normalize, prepare, search, snippet, terms } from '@/lib/search';

const idx = prepare([
  { c: 8, i: 'q-8-1', k: 'q', t: 'Threads virtuais', x: 'Migrámos para virtual threads em Java 21.' },
  { c: 12, i: 'sec-12-2', k: 't', t: 'N+1', x: 'O problema N+1 aparece com lazy loading.' },
  { c: 8, i: 'lst-8-1', k: 'code', t: 'Config', x: 'spring.threads.virtual.enabled=true' },
]);

describe('search', () => {
  it('ignora acentos e maiúsculas', () => {
    expect(normalize('Sénior Índice')).toBe('senior indice');
    expect(search(idx, 'VIRTUAIS')[0].e.i).toBe('q-8-1');
  });
  it('exige todos os termos', () => {
    expect(search(idx, 'virtual lazy')).toHaveLength(0);
    expect(search(idx, 'virtual threads').map((h) => h.e.i)).toEqual(['q-8-1', 'lst-8-1']);
  });
  it('dá prioridade a ocorrências no título', () => {
    expect(search(idx, 'n+1')[0].e.i).toBe('sec-12-2');
  });
  it('produz snippet com realce nos termos', () => {
    const segs = snippet('O problema N+1 aparece com lazy loading.', 11, terms('lazy'));
    expect(segs.some(([t, hl]) => hl && t === 'lazy')).toBe(true);
    expect(segs.map(([t]) => t).join('')).toBe('O problema N+1 aparece com lazy loading.');
  });
});
