import { useEffect, useRef } from 'react';

/** Executa `fn` `ms` depois da última alteração de `value` (autosave). */
export function useDebouncedEffect<T>(value: T, fn: (v: T) => void, ms: number) {
  const first = useRef(true);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => fnRef.current(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
}
