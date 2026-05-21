import { useState } from 'react';
import { Session } from '../lib/types';
import { dispatch } from '../lib/store';
import { Identity, saveIdentity } from '../lib/identity';
import { CopyLink } from '../components/CopyLink';
import { ParticipantBadge } from '../components/ParticipantBadge';

type Props = {
  session: Session;
  identity: Identity;
  onIdentitySaved: (id: Identity) => void;
};

export function Lobby({ session, identity, onIdentitySaved }: Props) {
  const me = session.participants.find((p) => p.id === identity.participantId);
  const isLeader = !!me?.isLeader;
  const initialName = identity.name || (me && me.name !== 'Leader' ? me.name : '');
  const [name, setName] = useState(initialName);
  const url = window.location.href;

  const join = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (me) {
      // Update name
      dispatch(session.id, { type: 'updateName', participantId: me.id, name: trimmed });
    } else {
      dispatch(session.id, {
        type: 'join',
        participant: { id: identity.participantId, name: trimmed, isLeader: false },
      });
    }
    const next: Identity = { participantId: identity.participantId, name: trimmed };
    saveIdentity(session.id, next);
    onIdentitySaved(next);
  };

  // Need a name first (or, leader still on placeholder name)
  const needsName = !me || !identity.name || me.name === 'Leader';

  if (needsName) {
    return (
      <main className="screen lobby">
        <img className="logo" src="/Logo.png" alt="Groof Delegation Poker" />
        <h1>{isLeader || !me ? 'Welcome' : 'Join the session'}</h1>
        <p className="muted">Enter your name to {me ? 'continue' : 'join'}.</p>
        <form className="name-form" onSubmit={join}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            autoFocus
            maxLength={40}
          />
          <button className="btn btn-primary" type="submit" disabled={!name.trim()}>
            {me ? 'Save' : 'Join'}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="screen lobby">
      <img className="logo" src="/Logo.png" alt="Groof Delegation Poker" />
      <h1>Lobby</h1>
      <p className="muted">Share this link with your team. The session ID is <code>{session.id}</code>.</p>

      <CopyLink url={url} />

      <section className="participants">
        <h2>Participants ({session.participants.length})</h2>
        <ul>
          {session.participants.map((p) => (
            <li key={p.id}>
              <ParticipantBadge p={p} />
              {p.id === me!.id && <span className="muted"> (you)</span>}
            </li>
          ))}
        </ul>
      </section>

      <div className="lobby-actions">
        {isLeader ? (
          <button
            className="btn btn-primary btn-lg"
            disabled={session.participants.length < 1}
            onClick={() => dispatch(session.id, { type: 'startDecisions' })}
          >
            Start session →
          </button>
        ) : (
          <p className="muted">Waiting for the leader to start…</p>
        )}
      </div>
    </main>
  );
}
