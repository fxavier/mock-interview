import type { ReactNode } from 'react';

interface Props { crumb: ReactNode; onMenu: () => void; onSearch: () => void; actions?: ReactNode }

export function TopBar({ crumb, onMenu, onSearch, actions }: Props) {
  return (
    <header className="topbar">
      <button type="button" className="btn btn--ghost topbar__burger" onClick={onMenu} aria-label="Abrir menu de capítulos">☰</button>
      <div className="topbar__crumb">{crumb}</div>
      <div className="topbar__spacer" />
      {actions}
      <button type="button" className="btn btn--ghost" onClick={onSearch}>Pesquisar <kbd className="key">Ctrl K</kbd></button>
    </header>
  );
}
