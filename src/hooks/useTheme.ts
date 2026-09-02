import { useCallback, useEffect } from 'react';
import { KEYS, useStored } from '@/lib/storage';

export type Theme = 'auto' | 'light' | 'dark';
const ORDER: Theme[] = ['auto', 'light', 'dark'];
export const THEME_LABEL: Record<Theme, string> = { auto: 'Sistema', light: 'Claro', dark: 'Escuro' };

function resolve(theme: Theme): 'light' | 'dark' {
  if (theme !== 'auto') return theme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setTheme] = useStored<Theme>(KEYS.theme, 'auto');
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => root.setAttribute('data-resolved', resolve(theme));
    apply();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);
  const cycle = useCallback(() => setTheme((t) => ORDER[(ORDER.indexOf(t) + 1) % ORDER.length]), [setTheme]);
  return { theme, setTheme, cycle, resolved: typeof window === 'undefined' ? 'light' : resolve(theme) };
}
