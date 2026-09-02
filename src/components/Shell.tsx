import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Outlet, useLocation, useParams } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Footer } from './Footer';
import { SearchPalette } from './SearchPalette';
import { useHotkeys } from '@/hooks/useHotkeys';
import { useTheme } from '@/hooks/useTheme';

interface ShellCtx { setCrumb: (c: ReactNode) => void; openSearch: () => void }
const Ctx = createContext<ShellCtx | null>(null);
export function useShell(): ShellCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useShell fora do Shell');
  return c;
}

export function Shell() {
  const [crumb, setCrumb] = useState<ReactNode>('Mock Interview: Java Backend Sénior');
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const { cycle } = useTheme();
  const location = useLocation();
  const params = useParams();
  const currentChapter = params.n ? Number(params.n) : undefined;

  useEffect(() => { setMenu(false); }, [location.pathname]);

  const openSearch = useCallback(() => setSearch(true), []);
  const closeSearch = useCallback(() => setSearch(false), []);
  const ctx = useMemo<ShellCtx>(() => ({ setCrumb, openSearch }), [openSearch]);

  const hotkeys = useMemo(() => ({
    mod: { k: openSearch },
    plain: { '/': openSearch, t: cycle, Escape: () => { setSearch(false); setMenu(false); } },
  }), [openSearch, cycle]);
  useHotkeys(hotkeys);

  return (
    <Ctx.Provider value={ctx}>
      <a href="#main" className="skip-link">Saltar para o conteúdo</a>
      <div className="app">
        <div className="app__body">
          <Sidebar open={menu} onClose={() => setMenu(false)} onSearch={openSearch} currentChapter={currentChapter} />
          <div className="app__main">
            <TopBar crumb={crumb} onMenu={() => setMenu((m) => !m)} onSearch={openSearch} />
            <main id="main" className="app__content"><Outlet /></main>
            <Footer />
          </div>
        </div>
      </div>
      <SearchPalette open={search} onClose={closeSearch} />
    </Ctx.Provider>
  );
}
