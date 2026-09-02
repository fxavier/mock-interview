import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="page">
      <div className="panel" style={{ maxWidth: 520 }}>
        <h3>Página não encontrada</h3>
        <div className="hint">O capítulo ou endereço não existe neste livro.</div>
        <Link to="/" className="btn btn--primary">Voltar ao índice</Link>
      </div>
    </div>
  );
}
