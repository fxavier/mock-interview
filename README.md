# Mock Interview: Java Backend Sénior — React app

Versão React do livro interactivo (37 capítulos, 436 perguntas de entrevista, 77 exercícios de código, 185 perguntas de quiz). Funciona offline, sem backend; todo o estado (progresso, auto-avaliações, notas, código dos exercícios, quizzes, simulações) fica no `localStorage`.

## Stack

- React 18 + TypeScript (strict) + Vite 6
- `react-router-dom` v6 em **HashRouter** — abre a partir de `file://` e de qualquer hosting estático sem regras de rewrite
- `html-react-parser` para transformar o corpo HTML de cada capítulo em componentes React (cartões de pergunta, laboratórios de código, listagens) sem `dangerouslySetInnerHTML`
- CSS: tokens globais (`src/styles/tokens.css`) + CSS Modules por componente + `prose.css` para as classes fixas do conteúdo
- Vitest + Testing Library

## Comandos

```bash
npm install
npm run dev        # desenvolvimento (correr `npm run content` uma vez antes)
npm run build      # content + typecheck + build de produção em dist/
npm run preview    # serve dist/
npm test           # testes unitários e de componentes
```

## Estrutura

```
book-src/                  fonte de verdade do conteúdo (chapters.json, content/*.body.html, quiz/*.json)
scripts/build-content.mjs  gera src/generated/ (book.json, bank.json, search.json, bodies/, quiz/)
src/
  lib/        book.ts (loaders lazy), storage.ts (store tipado sobre localStorage), search.ts, highlight.ts
  hooks/      useTheme, useProgress (lidos + auto-avaliações), useScrollSpy, useHotkeys, useDebounced
  content/    ContentRenderer.tsx — HTML → React com substituição de .qa/.lab/figure.listing/a.anchor
  components/ Shell (layout + contexto), Sidebar, TopBar, Footer, SearchPalette, QuestionCard, CodeLab, Listing, Quiz, Notes, ChapterNav
  pages/      HomePage, ChapterPage, SimulationPage, NotFound
  styles/     tokens, base, layout, prose
```

## Decisões

- **Conteúdo fora do bundle principal.** Cada capítulo é um chunk (`import.meta.glob` com `?raw`), ~30 KB gzip; o índice de pesquisa (1,3 MB / 440 KB gzip) só carrega ao abrir a pesquisa.
- **Chaves `mij.*` preservadas.** Quem já usava o livro HTML mantém progresso, notas e respostas.
- **Sem `innerHTML`.** Realce de sintaxe por tokens; `código` inline dos quizzes convertido em `<code>` por split, não por regex sobre HTML.
- **Âncoras de secção** (`#sec-N-K`) tratadas por componente para não destruir a rota do HashRouter; ligações directas `#/cap/3#q-3-2` abrem o cartão certo.
- **Filtro «Destacar»** é puro CSS (`data-filter` no contentor + `data-box` nos elementos): zero re-render do conteúdo.

## Actualizar conteúdo

Editar `book-src/` (ver `CONTRATO.md` do livro original) e correr `npm run content` ou `npm run build`. O script falha se um cartão tiver área/nível inválidos ou um quiz não tiver 5 perguntas.
# mock-interview
