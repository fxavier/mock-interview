import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContentRenderer } from '@/content/ContentRenderer';

const html = `
<p>Intro <code>x</code></p>
<h2 id="sec-3-1" class="h2"><span class="secnum">3.1</span> Título<a class="anchor" href="#sec-3-1" aria-label="ligação">#</a></h2>
<div class="qa" id="q-3-1" data-box="qa" data-area="java" data-level="staff" data-freq="baixa">
  <div class="qhead"><span class="qtag">Java</span><div class="qmeta"><span class="qpill">Staff</span></div></div>
  <div class="qprompt">Pergunta <code>P</code>?</div>
  <div class="qact"><button class="btn" type="button" data-reveal>Ver</button><div class="selfrate"></div></div>
  <div class="qbody" hidden><div class="qsec ans"><h4>Resposta-modelo</h4><p>Corpo</p></div></div>
</div>
<figure class="listing sql" id="lst-3-1"><div class="lhead"><span class="lnum">Listagem 3.1</span><span class="lcap">Legenda</span><button class="copy" type="button" data-copy>Copiar</button></div>
<pre class="code" data-lang="sql"><code>SELECT 1 &lt; 2;</code></pre></figure>
<div class="lab" id="lab-3-1" data-box="lab" data-lang="java">
  <div class="labhead"><span class="labttl">Exercício 3.1 — T</span><div class="labpills"><span class="qpill">10 min</span></div></div>
  <div class="labbody"><p>Enunciado</p><h4>A sua solução</h4><textarea class="labcode"></textarea>
  <div class="labact"><button class="btn" type="button" data-solve>Ver</button></div>
  <div class="labsol" hidden><h4>Solução</h4><p>Sol</p></div></div>
</div>`;

describe('ContentRenderer', () => {
  it('substitui os componentes e mantém a prosa', () => {
    render(<ContentRenderer html={html} target={null} filter={null} />);
    expect(screen.getByText('Título')).toBeInTheDocument();
    expect(screen.getByText('Pergunta', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Staff')).toBeInTheDocument();
    expect(screen.getByText('Ocasional')).toBeInTheDocument();
    expect(screen.queryByText('Corpo')).not.toBeInTheDocument();
    expect(screen.getByText('Listagem 3.1')).toBeInTheDocument();
    expect(document.querySelector('pre.code')?.textContent).toBe('SELECT 1 < 2;');
    expect(screen.getByText('Exercício 3.1 — T')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('');
    expect(screen.queryByText('Sol')).not.toBeInTheDocument();
    expect(document.querySelectorAll('[hidden]')).toHaveLength(0);
  });
  it('abre o cartão alvo e aplica o filtro', () => {
    const { container } = render(<ContentRenderer html={html} target="q-3-1" filter="lab" />);
    expect(screen.getByText('Corpo')).toBeInTheDocument();
    expect(container.querySelector('.prose')).toHaveAttribute('data-filter', 'lab');
  });
});
