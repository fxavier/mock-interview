import { useMemo, useRef, type KeyboardEvent } from 'react';
import { tokenize } from '@/lib/highlight';
import { cx } from '@/lib/util';

interface Props {
  value: string;
  onChange: (v: string) => void;
  lang?: string;
  placeholder?: string;
  ariaLabel: string;
  minHeight?: number;
  className?: string;
}

/**
 * Editor de código sem dependências: textarea transparente sobre um <pre> com realce por tokens.
 * Os dois partilham fonte, padding e line-height; o scroll é sincronizado.
 * Tab indenta; Enter mantém a indentação da linha anterior.
 */
export function CodeEditor({ value, onChange, lang = 'java', placeholder, ariaLabel, minHeight = 200, className }: Props) {
  const preRef = useRef<HTMLPreElement>(null);
  const tokens = useMemo(() => tokenize(value, lang), [value, lang]);
  const lines = useMemo(() => value.split('\n').length, [value]);

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;
    const s = ta.selectionStart, end = ta.selectionEnd;
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        const ls = ta.value.lastIndexOf('\n', s - 1) + 1;
        const removed = ta.value.slice(ls).match(/^ {1,4}/)?.[0].length ?? 0;
        if (!removed) return;
        onChange(ta.value.slice(0, ls) + ta.value.slice(ls + removed));
        requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = Math.max(ls, s - removed); });
        return;
      }
      onChange(`${ta.value.slice(0, s)}    ${ta.value.slice(end)}`);
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = s + 4; });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const ls = ta.value.lastIndexOf('\n', s - 1) + 1;
      const indent = ta.value.slice(ls, s).match(/^\s*/)?.[0] ?? '';
      const extra = /[{(\[]\s*$/.test(ta.value.slice(ls, s)) ? '    ' : '';
      const ins = `\n${indent}${extra}`;
      onChange(`${ta.value.slice(0, s)}${ins}${ta.value.slice(end)}`);
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = s + ins.length; });
    }
  };
  const onScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const pre = preRef.current;
    if (pre) { pre.scrollTop = e.currentTarget.scrollTop; pre.scrollLeft = e.currentTarget.scrollLeft; }
  };

  return (
    <div className={cx('ce', className)} style={{ minHeight }} data-lang={lang}>
      <pre ref={preRef} className="ce__pre" aria-hidden="true">
        <span className="ce__gutter">{Array.from({ length: lines }, (_, i) => <span key={i}>{i + 1}</span>)}</span>
        <code className="ce__code">
          {tokens.map((t, i) => (t.t === 'txt' ? t.v : <span key={i} className={`tok-${t.t}`}>{t.v}</span>))}
          {'\n'}
        </code>
      </pre>
      <textarea className="ce__ta" value={value} spellCheck={false} wrap="off" autoCapitalize="off" autoCorrect="off"
        aria-label={ariaLabel} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} onKeyDown={onKey} onScroll={onScroll} />
    </div>
  );
}
