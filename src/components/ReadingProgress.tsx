import { useEffect, useState } from 'react';

/** Barra fina de progresso de leitura no topo e botão «voltar ao topo» quando se desce muito. */
export function ReadingProgress() {
  const [pct, setPct] = useState(0);
  const [far, setFar] = useState(false);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setPct(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
      setFar(window.scrollY > 900);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return (
    <>
      <div className="readbar" aria-hidden="true"><i style={{ width: `${pct}%` }} /></div>
      <button type="button" className="totop" hidden={!far} onClick={() => window.scrollTo({ top: 0 })} aria-label="Voltar ao topo">↑</button>
    </>
  );
}
