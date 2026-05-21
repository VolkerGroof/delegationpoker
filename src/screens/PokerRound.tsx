import { useState } from 'react';
import { DELEGATION_LEVELS, DelegationLevel, Session, Participant } from '../lib/types';
import { dispatch } from '../lib/store';
import { DelegationCard } from '../components/DelegationCard';
import { ParticipantBadge } from '../components/ParticipantBadge';

type Props = {
  session: Session;
  me: Participant;
};

export function PokerRound({ session, me }: Props) {
  const decision = session.decisions.find((d) => d.id === session.currentPokerId);
  const [teamPick, setTeamPick] = useState<DelegationLevel | null>(null);

  if (!decision) {
    return (
      <main className="screen">
        <p>No active poker round.</p>
      </main>
    );
  }

  const myPick = decision.pokerVotes[me.id];
  const allPicked = session.participants.every((p) => decision.pokerVotes[p.id]);
  const unveiled = decision.unveiled;

  const pick = (level: DelegationLevel) => {
    if (unveiled) return;
    dispatch(session.id, { type: 'pickCard', participantId: me.id, level });
  };

  const reveal = () => dispatch(session.id, { type: 'unveilCards' });
  const rePoker = () => dispatch(session.id, { type: 'rePoker' });
  const recordTeam = () => {
    if (!teamPick) return;
    dispatch(session.id, { type: 'recordTeamDecision', level: teamPick });
  };

  return (
    <main className="screen poker">
      <header className="phase-header">
        <div>
          <div className="muted small">Poker round</div>
          <h1>{decision.title}</h1>
          {decision.description && <p className="decision-desc">{decision.description}</p>}
        </div>
      </header>

      {!unveiled && (
        <>
          <h2>{myPick ? 'Your card is locked in' : 'Pick a card'}</h2>
          <div className="hand">
            {DELEGATION_LEVELS.map(({ level }) => (
              <DelegationCard
                key={level}
                level={level}
                size="md"
                showLabel
                selected={myPick === level}
                onClick={() => pick(level)}
              />
            ))}
          </div>

          <section className="picked-status">
            <h3>Status</h3>
            <ul>
              {session.participants.map((p) => {
                const has = !!decision.pokerVotes[p.id];
                return (
                  <li key={p.id} className={has ? 'picked' : ''}>
                    <ParticipantBadge p={p} />
                    <span>{has ? '✓ chosen' : '… choosing'}</span>
                  </li>
                );
              })}
            </ul>
          </section>

          {me.isLeader && (
            <div className="row gap-md">
              <button
                className="btn btn-primary btn-lg"
                onClick={reveal}
                disabled={Object.keys(decision.pokerVotes).length === 0}
                title={!allPicked ? 'Some have not picked yet — you can still reveal.' : ''}
              >
                {allPicked ? 'Reveal cards' : 'Reveal anyway'}
              </button>
            </div>
          )}
        </>
      )}

      {unveiled && (
        <>
          <h2>Cards revealed</h2>
          <div className="reveal-grid">
            {session.participants.map((p) => {
              const lvl = decision.pokerVotes[p.id];
              return (
                <div key={p.id} className="reveal-cell">
                  <DelegationCard level={lvl} faceDown={!lvl} size="md" showLabel />
                  <div className="reveal-name">
                    <ParticipantBadge p={p} />
                    {!lvl && <span className="muted small"> — no pick</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {me.isLeader ? (
            <section className="team-decision">
              <h3>Record the team decision</h3>
              <p className="muted">After discussion, pick the agreed delegation level.</p>
              <div className="hand">
                {DELEGATION_LEVELS.map(({ level }) => (
                  <DelegationCard
                    key={level}
                    level={level}
                    size="sm"
                    showLabel
                    selected={teamPick === level}
                    onClick={() => setTeamPick(level)}
                  />
                ))}
              </div>
              <div className="row gap-md">
                <button
                  className="btn btn-primary btn-lg"
                  onClick={recordTeam}
                  disabled={!teamPick}
                >
                  Confirm & back to list
                </button>
                <button className="btn btn-ghost" onClick={rePoker}>
                  Re-poker this card
                </button>
              </div>
            </section>
          ) : (
            <p className="muted">Waiting for the leader to record the team decision…</p>
          )}
        </>
      )}
    </main>
  );
}
