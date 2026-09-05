export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__copy">© 2026 · Powered by <b>Xavier Francisco</b></div>
      <div className="footer__hint">
        <span><kbd className="key">←</kbd> <kbd className="key">→</kbd> capítulo</span>
        <span><kbd className="key">T</kbd> tema</span>
        <span><kbd className="key">/</kbd> pesquisa</span>
        <span><kbd className="key">G</kbd> glossário</span>
        <span><kbd className="key">P</kbd> playground</span>
        <span>Funciona offline; progresso guardado neste browser</span>
      </div>
    </footer>
  );
}
