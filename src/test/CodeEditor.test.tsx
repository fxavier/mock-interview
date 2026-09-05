import { describe, expect, it } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CodeEditor } from '@/components/CodeEditor';

function Harness({ initial = '' }: { initial?: string }) {
  const [v, setV] = useState(initial);
  return <CodeEditor value={v} onChange={setV} lang="java" ariaLabel="editor" />;
}
// o editor repõe o cursor num requestAnimationFrame; esperar um frame entre teclas, como num browser real
const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
async function type(keys: string[]) { for (const k of keys) { await userEvent.keyboard(k); await frame(); } }

describe('CodeEditor', () => {
  it('Tab indenta quatro espaços e Enter mantém (e aprofunda) a indentação', async () => {
    render(<Harness />);
    const ta = screen.getByRole('textbox', { name: 'editor' }) as HTMLTextAreaElement;
    await userEvent.click(ta);
    await type(['{Tab}', 'x', '{Shift>}[BracketLeft]{/Shift}', '{Enter}', 'y']);
    expect(ta.value).toBe('    x[\n        y');
  });
  it('Shift+Tab desindenta a linha', async () => {
    render(<Harness initial="    a" />);
    const ta = screen.getByRole('textbox', { name: 'editor' }) as HTMLTextAreaElement;
    await userEvent.click(ta);
    ta.setSelectionRange(5, 5);
    await type(['{Shift>}{Tab}{/Shift}']);
    expect(ta.value).toBe('a');
  });
  it('realça o código no overlay sem innerHTML', () => {
    render(<Harness initial={'class A {}'} />);
    expect(document.querySelector('.ce__code .tok-kw')?.textContent).toBe('class');
    expect(document.querySelector('.ce__gutter')?.textContent).toBe('1');
  });
});
