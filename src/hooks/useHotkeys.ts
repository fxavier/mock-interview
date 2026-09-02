import { useEffect } from 'react';

const isTyping = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  const tag = el?.tagName?.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || !!el?.isContentEditable;
};

/**
 * Atalhos globais. `plain` só dispara fora de campos de texto e sem modificadores;
 * `mod` dispara com Ctrl/⌘ (ex.: Ctrl+K) mesmo dentro de campos.
 */
export function useHotkeys(map: { plain?: Record<string, () => void>; mod?: Record<string, () => void> }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && map.mod?.[e.key.toLowerCase()]) { e.preventDefault(); map.mod[e.key.toLowerCase()](); return; }
      if (mod || e.altKey || isTyping(e.target)) return;
      const fn = map.plain?.[e.key];
      if (fn) { e.preventDefault(); fn(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [map]);
}
