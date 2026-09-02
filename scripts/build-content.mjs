#!/usr/bin/env node
/**
 * Converte as fontes do livro (book-src/) nos artefactos consumidos pela app:
 *   src/generated/book.json      — estrutura (partes, áreas, capítulos, secções, contagens)
 *   src/generated/bank.json      — banco de perguntas para a simulação
 *   src/generated/search.json    — índice de pesquisa (carregado sob demanda)
 *   src/generated/bodies/NN.html — corpo de cada capítulo (importado lazy via ?raw)
 *   src/generated/quiz/NN.json   — quizzes
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SRC = join(ROOT, 'book-src');
const OUT = join(ROOT, 'src', 'generated');

const LEVELS = { mid: 'Mid', senior: 'Sénior', staff: 'Staff' };
const FREQ = { alta: 'Muito frequente', media: 'Frequente', baixa: 'Ocasional' };

const pad = (n) => String(n).padStart(2, '0');
const strip = (html) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const unescape = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

function attrs(tag) {
  const out = {};
  for (const m of tag.matchAll(/([\w-]+)="([^"]*)"/g)) out[m[1]] = m[2];
  return out;
}

/** Extrai blocos <div class="qa" ...> ... </div> com contagem de profundidade. */
function extractBlocks(html, openRe) {
  const blocks = [];
  let m;
  while ((m = openRe.exec(html)) !== null) {
    let depth = 0, i = m.index;
    const tagRe = /<\/?div\b[^>]*>/g;
    tagRe.lastIndex = i;
    let t, end = -1;
    while ((t = tagRe.exec(html)) !== null) {
      depth += t[0].startsWith('</') ? -1 : 1;
      if (depth === 0) { end = tagRe.lastIndex; break; }
    }
    if (end < 0) throw new Error('bloco por fechar em ' + m[0].slice(0, 60));
    blocks.push({ attrs: attrs(m[0]), html: html.slice(i, end) });
    openRe.lastIndex = end;
  }
  return blocks;
}

if (existsSync(OUT)) rmSync(OUT, { recursive: true });
mkdirSync(join(OUT, 'bodies'), { recursive: true });
mkdirSync(join(OUT, 'quiz'), { recursive: true });

const book = JSON.parse(readFileSync(join(SRC, 'chapters.json'), 'utf8'));
const areaName = Object.fromEntries(book.areas.map((a) => [a.k, a.n]));

const chapters = [];
const bank = [];
const search = [];
const areaCount = Object.fromEntries(book.areas.map((a) => [a.k, 0]));
let totals = { questions: 0, labs: 0, listings: 0, quiz: 0, sections: 0 };

for (const c of book.chapters) {
  const nn = pad(c.n);
  const body = readFileSync(join(SRC, 'content', `cap-${nn}.body.html`), 'utf8');
  const quiz = JSON.parse(readFileSync(join(SRC, 'quiz', `${nn}.json`), 'utf8'));

  const qas = extractBlocks(body, /<div class="qa"[^>]*>/g);
  const labs = extractBlocks(body, /<div class="lab"[^>]*>/g);
  const listings = body.match(/<figure class="listing/g)?.length ?? 0;
  const sections = [...body.matchAll(/<h2 id="(sec-\d+-\d+)"[^>]*>(.*?)<\/h2>/gs)].map((m) => ({
    id: m[1],
    title: strip(m[2].replace(/<a class="anchor".*?<\/a>/s, '').replace(/<span class="secnum">.*?<\/span>/s, '')),
  }));

  for (const q of qas) {
    const id = q.attrs.id;
    const prompt = strip(q.html.match(/<div class="qprompt">(.*?)<\/div>/s)?.[1] ?? '');
    const area = q.attrs['data-area'];
    const level = q.attrs['data-level'];
    if (!LEVELS[level]) throw new Error(`nível inválido em ${id}`);
    if (!areaName[area]) throw new Error(`área inválida em ${id}`);
    areaCount[area]++;
    bank.push({ id, c: c.n, a: area, l: level, q: unescape(prompt) });
    const short = unescape(prompt).length > 96 ? unescape(prompt).slice(0, 93).trimEnd() + '…' : unescape(prompt);
    search.push({ c: c.n, i: id, k: 'q', t: short, x: unescape(prompt) });
    const ans = strip(q.html.match(/<div class="qsec ans">(.*?)<div class="qsec rubric">/s)?.[1] ?? '');
    if (ans) search.push({ c: c.n, i: id, k: 'a', t: `Resposta: ${short}`, x: unescape(ans).replace(/^Resposta-modelo\s*/, '').slice(0, 1200) });
  }

  // texto das secções (parágrafos fora dos cartões) para o índice
  const stripped = body
    .replace(/<div class="qa"[\s\S]*?<div class="qbody" hidden>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g, '')
    .replace(/<pre[\s\S]*?<\/pre>/g, '');
  const secParts = stripped.split(/(?=<h2 id="sec-)/);
  for (const part of secParts) {
    const idm = part.match(/<h2 id="(sec-\d+-\d+)"/);
    if (!idm) continue;
    const sec = sections.find((s) => s.id === idm[1]);
    const text = unescape(strip(part.replace(/<h2[\s\S]*?<\/h2>/, '')));
    if (text.length > 40) search.push({ c: c.n, i: idm[1], k: 't', t: sec?.title ?? 'Secção', x: text.slice(0, 1500) });
  }
  for (const m of body.matchAll(/<figure class="listing[^"]*" id="([^"]+)">[\s\S]*?<span class="lcap">(.*?)<\/span>[\s\S]*?<code>([\s\S]*?)<\/code>/g)) {
    search.push({ c: c.n, i: m[1], k: 'code', t: unescape(strip(m[2])), x: unescape(strip(m[3])).slice(0, 800) });
  }

  if (quiz.questions.length !== 5) throw new Error(`quiz ${nn} não tem 5 perguntas`);
  totals.questions += qas.length; totals.labs += labs.length; totals.listings += listings;
  totals.quiz += quiz.questions.length; totals.sections += sections.length;

  chapters.push({ n: c.n, p: c.p, area: c.area, title: c.t, sections, counts: { questions: qas.length, labs: labs.length, listings, sections: sections.length } });
  writeFileSync(join(OUT, 'bodies', `${nn}.html`), body);
  writeFileSync(join(OUT, 'quiz', `${nn}.json`), JSON.stringify(quiz));
}

writeFileSync(join(OUT, 'book.json'), JSON.stringify({
  title: book.title, subtitle: book.subtitle, parts: book.parts,
  areas: book.areas.map((a) => ({ ...a, count: areaCount[a.k] })),
  levels: LEVELS, freq: FREQ, chapters, totals,
}, null, 0));
writeFileSync(join(OUT, 'bank.json'), JSON.stringify(bank));
writeFileSync(join(OUT, 'search.json'), JSON.stringify(search));
console.log(`OK: ${chapters.length} capítulos, ${totals.questions} perguntas, ${totals.labs} exercícios, ${search.length} entradas de pesquisa`);
