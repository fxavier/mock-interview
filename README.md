# Mock Interview: Java Backend Sénior — React app

Versão React do livro interactivo (43 capítulos, 488 perguntas de entrevista, 96 exercícios de código, 215 perguntas de quiz). Funciona offline, sem backend; todo o estado (progresso, auto-avaliações, notas, código dos exercícios, quizzes, simulações) fica no `localStorage`.

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
book-src/                  fonte de verdade do conteúdo (chapters.json, content/*.body.html, quiz/*.json, glossary.json)
scripts/build-content.mjs  gera src/generated/ (book.json, bank.json, search.json, labs.json, glossary.json, bodies/, quiz/)
src/
  lib/        book.ts (loaders lazy), storage.ts (store tipado sobre localStorage), search.ts, highlight.ts, calc.ts (fórmulas das ferramentas)
  hooks/      useTheme, useProgress (lidos + auto-avaliações), useScrollSpy, useHotkeys, useDebounced
  content/    ContentRenderer.tsx — HTML → React com substituição de .qa/.lab/figure.listing/a.anchor
  components/ Shell (layout + contexto), Sidebar, TopBar, Footer, SearchPalette, QuestionCard, CodeLab, CodeEditor, Listing, Quiz, Notes, ChapterNav, ReadingProgress
  pages/      HomePage, ChapterPage, SimulationPage, PlaygroundPage, ToolsPage, GlossaryPage, NotFound
  styles/     tokens, base, layout, prose
```

## Decisões

- **Conteúdo fora do bundle principal.** Cada capítulo é um chunk (`import.meta.glob` com `?raw`), ~30 KB gzip; o índice de pesquisa (1,3 MB / 440 KB gzip) só carrega ao abrir a pesquisa.
- **Chaves `mij.*` preservadas.** Quem já usava o livro HTML mantém progresso, notas e respostas.
- **Sem `innerHTML`.** Realce de sintaxe por tokens; `código` inline dos quizzes convertido em `<code>` por split, não por regex sobre HTML.
- **Âncoras de secção** (`#sec-N-K`) tratadas por componente para não destruir a rota do HashRouter; ligações directas `#/cap/3#q-3-2` abrem o cartão certo.
- **Filtro «Destacar»** é puro CSS (`data-filter` no contentor + `data-box` nos elementos): zero re-render do conteúdo.

## Páginas além dos capítulos

- **Simulação** (`#/simulacao`): sessão cronometrada com perguntas sorteadas do banco.
- **Playground** (`#/playground`): exercício do livro sorteado com relógio — o bloco `div.lab` é extraído do corpo do capítulo com `DOMParser` e renderizado pelo mesmo `ContentRenderer`, por isso o código escrito fica na mesma chave `mij.lab.<id>` que no capítulo. Separador «Rascunho livre» com vários rascunhos (`mij.pads`).
- **Ferramentas** (`#/ferramentas`): calculadoras das contas de entrevista (ondas num pool, sequencial vs paralelo, retries, cauda do fan-out, lei de Little, Big-O, memória). Fórmulas em `lib/calc.ts`, sem estado persistido.
- **Glossário** (`#/glossario`): termos de `book-src/glossary.json` (validados no build contra áreas e capítulos), filtráveis e ligados aos capítulos; também entram no índice de pesquisa (`k: "g"`).

## Actualizar conteúdo

Editar `book-src/` (ver `CONTRATO.md` do livro original) e correr `npm run content` ou `npm run build`. O script falha se um cartão tiver área/nível inválidos, um quiz não tiver 5 perguntas, ou um termo do glossário apontar para uma área ou capítulo inexistente.
# mock-interview
