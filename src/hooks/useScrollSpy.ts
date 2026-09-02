import { useEffect, useState } from 'react';

/** Devolve o id do cabeçalho actualmente visível (o último acima da linha de leitura). */
export function useScrollSpy(ids: string[], offset = 110): string | null {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    if (!ids.length) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY + offset;
      let cur: string | null = null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= y) cur = id;
      }
      setActive(cur);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => { window.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [ids, offset]);
  return active;
}
