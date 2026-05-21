import { Session, Participant, decisionScore } from '../lib/types';
import { dispatch } from '../lib/store';
import { DecisionCard } from '../components/DecisionCard';

type Props = {
  session: Session;
  me: Participant;
};

export function DiscussionList({ session, me }: Props) {
  const sorted = [...session.decisions].sort((a, b) => decisionScore(b) - decisionScore(a));
  const pokeredCount = sorted.filter((d) => d.pokered).length;

  const handleDone = () => {
    if (pokeredCount === 0) {
      const ok = confirm(
        'No decisions have been pokered yet. End the session anyway? The results table will be empty.',
      );
      if (!ok) return;
    }
    dispatch(session.id, { type: 'finish' });
  };

  return (
    <main className="screen">
      <header className="phase-header">
        <h1>Discussion</h1>
        {me.isLeader && (
          <button className="btn btn-primary" onClick={handleDone}>
            Done →
          </button>
        )}
      </header>

      <p className="muted">
        Decisions sorted by votes.{' '}
        {me.isLeader
          ? 'Click "Poker this →" on a decision to run a poker round on it. When you\'re done, click "Done →".'
          : 'The leader will pick decisions to poker on.'}
      </p>

      {sorted.length === 0 ? (
        <p className="muted">No decisions to discuss.</p>
      ) : (
        <div className="decisions-grid">
          {sorted.map((d) => (
            <DecisionCard
              key={d.id}
              decision={d}
              participants={session.participants}
              me={me}
              mode="discussion"
              isLeader={me.isLeader}
              onEdit={(title, description) =>
                dispatch(session.id, { type: 'editDecision', decisionId: d.id, title, description })
              }
              onDelete={() =>
                dispatch(session.id, { type: 'deleteDecision', decisionId: d.id })
              }
              onPoker={() => dispatch(session.id, { type: 'beginPoker', decisionId: d.id })}
            />
          ))}
        </div>
      )}
    </main>
  );
}
