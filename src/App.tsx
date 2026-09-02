import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Shell } from '@/components/Shell';
import { HomePage } from '@/pages/HomePage';
import { ChapterPage } from '@/pages/ChapterPage';
import { SimulationPage } from '@/pages/SimulationPage';
import { NotFound } from '@/pages/NotFound';

/**
 * HashRouter: a app é um livro offline que tem de abrir a partir de file://
 * e de qualquer hosting estático sem regras de rewrite. Trade-off aceite: URLs com #.
 */
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<HomePage />} />
          <Route path="cap/:n" element={<ChapterPage />} />
          <Route path="simulacao" element={<SimulationPage />} />
          <Route path="index.html" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
