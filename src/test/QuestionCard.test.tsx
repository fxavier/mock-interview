import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionCard } from '@/components/QuestionCard';
import { getItem } from '@/lib/storage';

const card = (open = false) => (
  <QuestionCard id="q-3-1" area="java" areaLabel="Java e a linguagem" level="senior" freq="alta"
    prompt="Qual é o contrato entre equals e hashCode?" body={<p>Resposta secreta</p>} initialOpen={open} />
);

describe('QuestionCard', () => {
  it('só mostra a resposta depois de revelar', async () => {
    render(card());
    expect(screen.queryByText('Resposta secreta')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Ver resposta-modelo' }));
    expect(screen.getByText('Resposta secreta')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Ocultar resposta' })).toHaveAttribute('aria-expanded', 'true');
  });
  it('abre automaticamente quando é o alvo da ligação', () => {
    render(card(true));
    expect(screen.getByText('Resposta secreta')).toBeVisible();
  });
  it('guarda e alterna a auto-avaliação', async () => {
    render(card());
    const solid = screen.getByRole('button', { name: 'Sólido' });
    await userEvent.click(solid);
    expect(solid).toHaveAttribute('aria-pressed', 'true');
    expect(getItem<Record<string, number>>('mij.rate', {})['q-3-1']).toBe(3);
    await userEvent.click(solid);
    expect(getItem<Record<string, number>>('mij.rate', {})['q-3-1']).toBeUndefined();
  });
});
