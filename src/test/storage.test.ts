import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { clearPrefix, getItem, setItem, useStored } from '@/lib/storage';

describe('storage', () => {
  it('persiste e lê JSON com fallback', () => {
    expect(getItem('mij.x', 'def')).toBe('def');
    setItem('mij.x', { a: 1 });
    expect(getItem('mij.x', null)).toEqual({ a: 1 });
    expect(localStorage.getItem('mij.x')).toBe('{"a":1}');
  });
  it('partilha o valor entre hooks e aceita updater', () => {
    const a = renderHook(() => useStored<number[]>('mij.read', []));
    const b = renderHook(() => useStored<number[]>('mij.read', []));
    act(() => a.result.current[1]((r) => [...r, 3]));
    expect(b.result.current[0]).toEqual([3]);
  });
  it('limpa apenas o prefixo do livro', () => {
    setItem('mij.a', 1); setItem('outro', 2);
    clearPrefix('mij.');
    expect(getItem('mij.a', null)).toBeNull();
    expect(getItem('outro', null)).toBe(2);
  });
});
