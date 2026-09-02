import { useState } from 'react';
import { CodeBlock } from './CodeBlock';
import { copyText } from '@/lib/download';

interface Props { id?: string; num: string; caption: string; lang: string; code: string }

export function Listing({ id, num, caption, lang, code }: Props) {
  const [state, setState] = useState<'idle' | 'done' | 'fail'>('idle');
  const onCopy = async () => {
    setState((await copyText(code)) ? 'done' : 'fail');
    setTimeout(() => setState('idle'), 1500);
  };
  return (
    <figure className={`listing listing--${lang}`} id={id}>
      <div className="listing__head">
        <span className="listing__num">{num}</span>
        <span className="listing__cap">{caption}</span>
        <span className="listing__lang">{lang}</span>
        <button type="button" className="btn btn--sm btn--ghost" onClick={onCopy} aria-live="polite">
          {state === 'done' ? 'Copiado' : state === 'fail' ? 'Falhou' : 'Copiar'}
        </button>
      </div>
      <CodeBlock code={code} lang={lang} />
    </figure>
  );
}
