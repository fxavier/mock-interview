import { book } from './book';
import { KEYS, getItem } from './storage';
import { downloadText } from './download';

/** Exporta as notas de todos os capítulos em Markdown. Devolve false se não houver notas. */
export function exportAllNotes(): boolean {
  let out = `# Notas — ${book.title}\n\n`;
  let any = false;
  for (const c of book.chapters) {
    const n = getItem<string>(KEYS.notes(c.n), '').trim();
    if (n) { any = true; out += `## ${c.n}. ${c.title}\n\n${n}\n\n`; }
  }
  if (!any) { alert('Ainda não há notas guardadas.'); return false; }
  downloadText('notas-mock-interview-java.md', out);
  return true;
}
