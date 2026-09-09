import { describe, expect, it } from 'vitest';
import { tokenize } from '@/lib/highlight';

describe('tokenize', () => {
  it('reconstrói o texto original sem perdas (java)', () => {
    const src = 'public record Ponto(int x, int y) { /* c */ String s = "a\\"b"; }';
    expect(tokenize(src, 'java').map((t) => t.v).join('')).toBe(src);
  });
  it('classifica palavras-chave, tipos e anotações em Java', () => {
    const toks = tokenize('@Override public String name;', 'java');
    expect(toks.find((t) => t.v === '@Override')?.t).toBe('ann');
    expect(toks.find((t) => t.v === 'public')?.t).toBe('kw');
    expect(toks.find((t) => t.v === 'String')?.t).toBe('typ');
  });
  it('trata SQL sem distinguir maiúsculas e strings com aspas duplicadas', () => {
    const toks = tokenize("select 'it''s' FROM t -- c", 'sql');
    expect(toks.filter((t) => t.t === 'kw').map((t) => t.v)).toEqual(['select', 'FROM']);
    expect(toks.find((t) => t.t === 'str')?.v).toBe("'it''s'");
    expect(toks.find((t) => t.t === 'com')?.v).toBe('-- c');
  });
  it('preserva quebras de linha em yaml e shell', () => {
    for (const lang of ['yaml', 'shell']) {
      const src = 'a: 1 # x\n# só comentário\nb: "y"';
      expect(tokenize(src, lang).map((t) => t.v).join('')).toBe(src);
    }
  });
});

describe('tokenize ts/html', () => {
  it('reconhece keywords de TypeScript e template literals', async () => {
    const { tokenize } = await import('@/lib/highlight');
    const t = tokenize('const x: string = `a${b}`; // c', 'ts');
    expect(t.find((k) => k.v === 'const')?.t).toBe('kw');
    expect(t.find((k) => k.v === 'string')?.t).toBe('kw');
    expect(t.find((k) => k.v.startsWith('`'))?.t).toBe('str');
    expect(t.find((k) => k.v.startsWith('//'))?.t).toBe('com');
  });
  it('reconhece etiquetas, atributos e interpolações em templates Angular', async () => {
    const { tokenize } = await import('@/lib/highlight');
    const t = tokenize('<app-x [itens]="xs" (click)="go()">{{ n }}</app-x> @if (a) {', 'html');
    expect(t.find((k) => k.v === '<app-x')?.t).toBe('kw');
    expect(t.find((k) => k.v.trim() === '[itens]')?.t).toBe('typ');
    expect(t.find((k) => k.v === '{{ n }}')?.t).toBe('ann');
    expect(t.find((k) => k.v === '@if')?.t).toBe('ann');
  });
});
