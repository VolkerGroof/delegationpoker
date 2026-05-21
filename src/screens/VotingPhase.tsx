import { Session, Participant, decisionScore } from '../lib/types';
import { dispatch, usePhaseTimeout } from '../lib/store';
import { Timer } from '../components/Timer';
import { DecisionCard } from '../components/DecisionCard';

type Props = {
  session: Session;
  me: Participant;
};

export function VotingPhase({ session, me }: Props) {
  const advance = () => dispatch(session.id, { type: 'startDiscussion' });
  usePhaseTimeout(session, advance);

  const sorted = [...session.decisions].sort((a, b) => decisionScore(b) - decisionScore(a));

  return (
    <main className="screen">
      <header className="phase-header">
        <h1>Read, comment, vote</h1>
        <Timer
          endsAt={session.phaseEndsAt}
          isLeader={me.isLeader}
          onSkip={advance}
          label="Time left"
        />
      </header>

      <p className="muted">
        Read everyone's decisions. Add comments and up- or down-vote each card.
      </p>

      {sorted.length === 0 ? (
        <p className="muted">No decisions were submitted.</p>
      ) : (
        <div className="decisions-grid">
          {sorted.map((d) => (
            <DecisionCard
              key={d.id}
              decision={d}
              participants={session.participants}
              me={me}
              mode="voting"
              isLeader={me.isLeader}
              onVote={(value) =>
                dispatch(session.id, {
                  type: 'voteDecision',
                  decisionId: d.id,
                  participantId: me.id,
                  value,
                })
              }
              onComment={(text) =>
                dispatch(session.id, {
                  type: 'addComment',
                  decisionId: d.id,
                  authorId: me.id,
                  text,
                })
              }
            />
          ))}
        </div>
      )}
    </main>
  );
}
