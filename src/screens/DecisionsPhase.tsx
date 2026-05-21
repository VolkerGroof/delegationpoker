import { useState } from 'react';
import { Session, Participant } from '../lib/types';
import { dispatch, usePhaseTimeout } from '../lib/store';
import { Timer } from '../components/Timer';

type Props = {
  session: Session;
  me: Participant;
};

export function DecisionsPhase({ session, me }: Props) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const myDecisions = session.decisions.filter((d) => d.authorId === me.id);

  const advance = () => dispatch(session.id, { type: 'startVoting' });
  usePhaseTimeout(session, advance);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    dispatch(session.id, {
      type: 'addDecision',
      authorId: me.id,
      title: t,
      description: desc.trim(),
    });
    setTitle('');
    setDesc('');
  };

  return (
    <main className="screen">
      <header className="phase-header">
        <h1>Brainstorm decisions</h1>
        <Timer
          endsAt={session.phaseEndsAt}
          isLeader={me.isLeader}
          onSkip={advance}
          label="Time left"
        />
      </header>

      <p className="muted">
        Add decisions you'd like the team to discuss. Title is required, description is optional.
        Your decisions are <strong>private</strong> until everyone moves to voting.
      </p>

      <form className="add-decision" onSubmit={add}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Decision title"
          maxLength={120}
          autoFocus
        />
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Short description (optional)"
          rows={2}
          maxLength={400}
        />
        <button className="btn btn-primary" type="submit" disabled={!title.trim()}>
          Add decision
        </button>
      </form>

      <section className="my-decisions">
        <h2>Your decisions ({myDecisions.length})</h2>
        {myDecisions.length === 0 ? (
          <p className="muted">No decisions yet — add some above.</p>
        ) : (
          <ul>
            {myDecisions.map((d) => (
              <li key={d.id} className="my-decision">
                <strong>{d.title}</strong>
                {d.description && <p>{d.description}</p>}
                <button
                  className="btn btn-link btn-sm"
                  onClick={() => dispatch(session.id, { type: 'deleteDecision', decisionId: d.id })}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
