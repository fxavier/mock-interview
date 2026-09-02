import { memo, useMemo } from 'react';
import { tokenize } from '@/lib/highlight';

interface Props { code: string; lang?: string }

/** Bloco de código com realce por tokens — sem innerHTML. */
export const CodeBlock = memo(function CodeBlock({ code, lang = 'java' }: Props) {
  const tokens = useMemo(() => tokenize(code, lang), [code, lang]);
  return (
    <pre className="code" data-lang={lang}>
      <code>
        {tokens.map((t, i) => (t.t === 'txt' ? t.v : <span key={i} className={`tok-${t.t}`}>{t.v}</span>))}
      </code>
    </pre>
  );
});
