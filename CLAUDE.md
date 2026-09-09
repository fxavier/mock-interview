# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O que é

Livro interactivo de preparação para entrevistas de Java backend sénior. Conteúdo em **português (pt-PT)**, registo denso e técnico — qualquer texto novo deve seguir o mesmo tom dos capítulos existentes. Aplicação estática, sem backend: todo o estado do utilizador vive no `localStorage`.

Todos os comandos correm a partir de `app/`. **O repositório git é `app/`**, não a raiz `mock-interview/` — a raiz está dentro do repositório da home do utilizador (`/Users/xavier`), por isso qualquer `git status`/`git add` corrido fora de `app/` apanha a home inteira. `src/generated/` e `dist/` estão no `.gitignore` de `app/`.

```bash
npm install
npm run content     # regenera src/generated/ a partir de book-src/ (rápido; valida o conteúdo)
npm run dev         # content + vite dev server
npm run build       # content + tsc -b + vite build
npm test            # vitest run (7 ficheiros, jsdom)
npm run typecheck   # tsc -b
npx vitest run src/test/storage.test.ts        # um ficheiro
npx vitest run -t "nome do teste"              # um teste
```

Depois de mexer em `book-src/`, `npm run content` é a verificação mais rápida — falha com erro explícito em conteúdo inválido.

## Arquitectura

O ponto central é que **o conteúdo não é código**: `book-src/` é a fonte de verdade e `src/generated/` é artefacto de build (apagado e reescrito a cada `npm run content`). Nunca editar `src/generated/`.

```
book-src/chapters.json          estrutura: partes, áreas, capítulos (n, p, area, t, secs, brief)
book-src/content/cap-NN.body.html   corpo de cada capítulo (fragmento HTML, sem <html>)
book-src/quiz/NN.json           quiz do capítulo — exactamente 5 perguntas
book-src/glossary.json          termos {t, a (área), c [capítulos], d}; slug e ordem gerados no build
        ↓ scripts/build-content.mjs (parsing por regex sobre o HTML)
src/generated/book.json         estrutura + contagens + índice de secções
src/generated/bank.json         banco de perguntas para a simulação cronometrada
src/generated/search.json       índice de pesquisa (~1,3 MB, chunk próprio, lazy)
src/generated/bodies/NN.html    corpo, importado lazy com import.meta.glob(?raw)
src/generated/quiz/NN.json
src/generated/labs.json         índice dos exercícios {id, c, t, lang, pills} — usado pelo Playground
src/generated/glossary.json     glossário ordenado com slug; também entra em search.json com k:"g"
```

`scripts/build-content.mjs` valida e **falha o build** se: `data-level` não for `mid|senior|staff`, `data-area` não existir em `chapters.json`, um quiz não tiver exactamente 5 perguntas, ou um bloco `div` ficar por fechar. Também é ele que conta perguntas/labs/listagens por capítulo — as contagens no README derivam da linha final que o script imprime.

`src/content/ContentRenderer.tsx` transforma o HTML do capítulo em árvore React com `html-react-parser` (nunca `dangerouslySetInnerHTML`), substituindo por componentes os nós que reconhece pelas classes: `div.qa` → `QuestionCard`, `div.lab` → `CodeLab`, `figure.listing` → `Listing`, `a.anchor` → âncora que faz scroll sem destruir a rota do HashRouter. **As classes do HTML são a API** entre conteúdo e componentes; mudar uma classe em `book-src/` parte o renderer em silêncio (o nó passa a HTML inerte).

Páginas fora dos capítulos: `SimulationPage` (banco de perguntas), `PlaygroundPage` (extrai um `div.lab` do corpo do capítulo com `DOMParser` e renderiza-o com o mesmo `ContentRenderer`, por isso partilha a chave `mij.lab.<id>` com o capítulo; rascunhos livres em `mij.pads`), `ToolsPage` (calculadoras; fórmulas puras em `src/lib/calc.ts`, testadas em `calc.test.ts`) e `GlossaryPage`. `CodeEditor` é o editor usado nos labs e no playground: textarea transparente sobre um `<pre>` com tokens de `highlight.ts` — os dois têm de partilhar fonte, padding e line-height (ver `.ce*` em `base.css`).

`src/lib/storage.ts` é um store tipado sobre `localStorage` com `useSyncExternalStore`. As chaves mantêm o prefixo `mij.*` do livro HTML original para preservar dados de utilizadores antigos — não renomear.

Router em **HashRouter** (`base: './'` no Vite) para funcionar a partir de `file://` e de qualquer hosting estático. Daí o tratamento manual das âncoras `#sec-N-K`: uma rota é `#/cap/3#q-3-2`.

## Contrato do HTML de conteúdo

Estas convenções não estão documentadas em lado nenhum além do próprio conteúdo; copiar de um capítulo existente é a forma mais segura de acertar.

- Secção: `<h2 id="sec-N-K" class="h2"><span class="secnum">N.K</span> Título<a class="anchor" href="#sec-N-K" aria-label="ligação">#</a></h2>`
- Cartão: `<div class="qa" id="q-N-K" data-box="qa" data-area="…" data-level="…" data-freq="alta|media|baixa">` com `.qhead`/`.qtag`/`.qmeta`, `.qprompt`, `.qact` e `.qbody` (com atributo `hidden`) contendo, por esta ordem, `.qsec.ans` → `.qsec.rubric` (tabela de 4 linhas: Insuficiente/Mid/Sénior/Staff) → `.qsec.fu` → `.qsec.rf`.
- Exercício: `<div class="lab" id="lab-N-K" data-box="lab" data-lang="java">` com `.labhead`/`.labttl`/`.labpills`, `.labbody`, um `<h4>A sua solução</h4>`, `textarea.labcode`, `.labact` e `.labsol` (com `hidden`). O renderer corta o enunciado **nos filhos de `.labbody` anteriores ao `h4` «A sua solução»** — a string tem de bater certo, e listagens podem ir dentro do enunciado.
- Listagem: `<figure class="listing java" id="lst-N-K">` com `.lnum` («Listagem N.K»), `.lcap` e `<pre class="code" data-lang="…">`. Linguagens realçadas: `java`, `ts`/`tsx`/`js`/`jsx`, `html` (templates Angular), `sql`, `shell`, `yaml`/`yml`/`json`/`hcl`, `text` (sem realce).
- Tabela: `.tablewrap` > `.tcap` (com `.tnum` «Tabela N.K») + `.tscroll` > `table`.
- Avisos: `<aside class="box warn|note|num|trade" data-box="…">` com `.btitle`.
- Dentro de `<pre>`/`<code>`, escapar `<`, `>` e `&` (`&lt;`, `&gt;`, `&amp;`) — genéricos Java aparecem constantemente.
- `data-box` é o que faz funcionar o filtro «Destacar», que é puro CSS.

## Numeração de capítulos

Os números de capítulo estão embutidos em todo o lado: nome do ficheiro (`cap-NN.body.html`, `NN.json`), `"chapter": N` no quiz, e nos ids e legendas dentro do corpo (`sec-N-K`, `q-N-K`, `lab-N-K`, `lst-N-K`, `class="secnum">N.K`, `Listagem N.K`, `Tabela N.K`, `Exercício N.K`, e referências em prosa a «secção N.K»).

Inserir um capítulo no meio implica renumerar tudo isso nos capítulos seguintes. Fazê-lo por **substituição de texto**, ficheiro a ficheiro, usando apenas o número antigo do próprio ficheiro (nunca reserializar os JSON — perde-se a formatação compacta original), e renomear os ficheiros por ordem descendente. Verificar no fim que nenhum ficheiro contém ids ou legendas com número diferente do seu, e actualizar a contagem no `app/README.md`. Atenção: a Parte X (capítulos 40–43) tem referências cruzadas em prosa a outros capítulos («capítulo 40», «Exercício 43.2») que a substituição por número próprio não apanha — procurar com `grep -oE "cap[íi]tulo [0-9]+|Exercício [0-9]+\."` antes de renumerar. Nota: renumerar desalinha o progresso já guardado no `localStorage` dos utilizadores — vale a pena mencioná-lo.
