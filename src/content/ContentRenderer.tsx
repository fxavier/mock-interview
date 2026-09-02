import { memo, useMemo } from 'react';
import parse, { domToReact, Element, Text, type DOMNode, type HTMLReactParserOptions } from 'html-react-parser';
import { QuestionCard } from '@/components/QuestionCard';
import { CodeLab } from '@/components/CodeLab';
import { Listing } from '@/components/Listing';
import { areaName } from '@/lib/book';
import type { Freq, Level } from '@/lib/types';

/* ---------- utilitários sobre a árvore DOM do parser ---------- */
const isEl = (n: DOMNode | undefined, tag?: string): n is Element => n instanceof Element && (!tag || n.name === tag);
const hasClass = (n: Element, c: string) => (n.attribs.class ?? '').split(/\s+/).includes(c);
const findEl = (n: Element, pred: (e: Element) => boolean): Element | undefined => {
  for (const ch of n.children as DOMNode[]) {
    if (isEl(ch)) { if (pred(ch)) return ch; const d = findEl(ch, pred); if (d) return d; }
  }
  return undefined;
};
const textOf = (n: DOMNode | undefined): string => {
  if (!n) return '';
  if (n instanceof Text) return n.data;
  if (n instanceof Element) return (n.children as DOMNode[]).map(textOf).join('');
  return '';
};
const kids = (n: Element | undefined) => (n?.children ?? []) as DOMNode[];

/** Trata âncoras de secção (#sec-N-K) sem destruir a rota do HashRouter. */
function onAnchor(e: React.MouseEvent<HTMLAnchorElement>) {
  e.preventDefault();
  const id = e.currentTarget.getAttribute('href')?.slice(1);
  if (!id) return;
  document.getElementById(id)?.scrollIntoView({ block: 'start' });
  const base = window.location.hash.split('#').slice(0, 2).join('#'); // "#/cap/3"
  history.replaceState(null, '', `${base}#${id}`);
}

function buildOptions(target: string | null): HTMLReactParserOptions {
  const opts: HTMLReactParserOptions = {
    replace(node) {
      if (!isEl(node)) return undefined;
      const inner = (n: Element | undefined) => domToReact(kids(n), opts);

      if (node.name === 'a' && hasClass(node, 'anchor')) {
        return <a className="anchor" href={node.attribs.href} aria-label="ligação para a secção" onClick={onAnchor}>#</a>;
      }

      if (node.name === 'figure' && hasClass(node, 'listing')) {
        const code = findEl(node, (e) => e.name === 'code');
        const pre = findEl(node, (e) => e.name === 'pre');
        return (
          <Listing id={node.attribs.id}
            num={textOf(findEl(node, (e) => hasClass(e, 'lnum')))}
            caption={textOf(findEl(node, (e) => hasClass(e, 'lcap')))}
            lang={pre?.attribs['data-lang'] ?? 'java'}
            code={textOf(code)} />
        );
      }

      if (node.name === 'div' && hasClass(node, 'qa')) {
        const id = node.attribs.id;
        const area = node.attribs['data-area'];
        return (
          <QuestionCard id={id} area={area} areaLabel={areaName(area)}
            level={(node.attribs['data-level'] as Level) ?? 'senior'}
            freq={(node.attribs['data-freq'] as Freq) ?? 'media'}
            prompt={inner(findEl(node, (e) => hasClass(e, 'qprompt')))}
            body={inner(findEl(node, (e) => hasClass(e, 'qbody')))}
            initialOpen={target === id} />
        );
      }

      if (node.name === 'div' && hasClass(node, 'lab')) {
        const body = findEl(node, (e) => hasClass(e, 'labbody'));
        const bodyKids = kids(body);
        const cut = bodyKids.findIndex((k) => isEl(k, 'h4') && textOf(k).trim() === 'A sua solução');
        const statement = domToReact(cut >= 0 ? bodyKids.slice(0, cut) : bodyKids, opts);
        return (
          <CodeLab id={node.attribs.id} lang={node.attribs['data-lang'] ?? 'java'}
            title={textOf(findEl(node, (e) => hasClass(e, 'labttl')))}
            pills={kids(findEl(node, (e) => hasClass(e, 'labpills'))).filter((k) => isEl(k)).map(textOf)}
            statement={statement}
            solution={inner(findEl(node, (e) => hasClass(e, 'labsol')))} />
        );
      }

      // atributos booleanos «hidden» remanescentes não devem chegar ao React
      if (node.attribs.hidden !== undefined) { delete node.attribs.hidden; }
      return undefined;
    },
  };
  return opts;
}

interface Props { html: string; target: string | null; filter: string | null }

/** Converte o corpo HTML do capítulo em árvore React, substituindo os componentes interactivos. */
export const ContentRenderer = memo(function ContentRenderer({ html, target, filter }: Props) {
  const tree = useMemo(() => parse(html, buildOptions(target)), [html, target]);
  return <div className="prose" data-filter={filter ?? undefined}>{tree}</div>;
});
