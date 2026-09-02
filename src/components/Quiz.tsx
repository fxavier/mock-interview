import { useEffect, useState } from 'react';
import { loadQuiz } from '@/lib/book';
import { KEYS, useStored } from '@/lib/storage';
import { inlineCode, cx } from '@/lib/util';
import type { Quiz as QuizData } from '@/lib/types';
import s from './Quiz.module.css';

const EMPTY: Record<number, number> = {};

export function Quiz({ chapter }: { chapter: number }) {
  const [data, setData] = useState<QuizData | null>(null);
  const [failed, setFailed] = useState(false);
  const [answers, setAnswers] = useStored<Record<number, number>>(KEYS.quiz(chapter), EMPTY);

  useEffect(() => {
    let alive = true;
    setData(null); setFailed(false);
    loadQuiz(chapter).then((q) => alive && setData(q)).catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, [chapter]);

  if (failed) return <section className="panel"><h3>Auto-avaliação</h3><div className="hint">Não foi possível carregar o quiz deste capítulo.</div></section>;
  if (!data) return <section className="panel"><h3>Auto-avaliação</h3><div className="hint">A carregar…</div></section>;

  const total = data.questions.length;
  const answered = Object.keys(answers).length;
  const correct = data.questions.filter((q, i) => answers[i] === q.answer).length;

  return (
    <section className="panel" id="quiz" aria-labelledby="quiz-title">
      <h3 id="quiz-title">Auto-avaliação <span className={s.count}>{total} perguntas</span></h3>
      <div className="hint">Escolha uma opção para ver a resposta e a explicação. As respostas ficam guardadas neste browser.</div>
      {data.questions.map((q, i) => {
        const chosen = answers[i];
        const done = chosen !== undefined;
        return (
          <fieldset key={i} className={s.q} disabled={done}>
            <legend className={s.qtext}><span className={s.qi}>{i + 1}.</span>{inlineCode(q.q)}</legend>
            {q.options.map((o, j) => {
              const state = done ? (j === q.answer ? 'right' : j === chosen ? 'wrong' : 'dim') : 'idle';
              return (
                <label key={j} className={cx(s.opt, s[state])}>
                  <input type="radio" name={`q${chapter}-${i}`} value={j} checked={chosen === j}
                    onChange={() => setAnswers((a) => ({ ...a, [i]: j }))} />
                  <span>{inlineCode(o)}</span>
                </label>
              );
            })}
            {done && (
              <div className={cx(s.explain, chosen === q.answer ? s.explainOk : s.explainBad)}>
                <b>{chosen === q.answer ? 'Correcto.' : 'Errado.'}</b> {inlineCode(q.explain)}
              </div>
            )}
          </fieldset>
        );
      })}
      <div className={s.foot}>
        <div className={s.score} aria-live="polite">
          {answered ? <>Resultado: <b className={correct === total ? s.perfect : ''}>{correct}/{total}</b>{answered < total && <span> ({total - answered} por responder)</span>}</> : 'Ainda sem respostas.'}
        </div>
        <button type="button" className="btn btn--sm" disabled={!answered} onClick={() => setAnswers({})}>Recomeçar quiz</button>
      </div>
    </section>
  );
}
