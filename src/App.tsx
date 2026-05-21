import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { Landing } from './screens/Landing';
import { Lobby } from './screens/Lobby';
import { DecisionsPhase } from './screens/DecisionsPhase';
import { VotingPhase } from './screens/VotingPhase';
import { DiscussionList } from './screens/DiscussionList';
import { PokerRound } from './screens/PokerRound';
import { Results } from './screens/Results';
import { useSession } from './lib/store';
import { Identity, freshParticipantId, loadIdentity, saveIdentity } from './lib/identity';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/s/:id" element={<SessionRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function SessionRoute() {
  const { id } = useParams<{ id: string }>();
  const snapshot = useSession(id ?? '');
  const [identity, setIdentity] = useState<Identity | null>(null);

  useEffect(() => {
    if (!id) return;
    let stored = loadIdentity(id);
    if (!stored) {
      stored = { participantId: freshParticipantId(), name: '' };
      saveIdentity(id, stored);
    }
    setIdentity(stored);
  }, [id]);

  if (!id || !identity) return <main className="screen"><p>Loading…</p></main>;

  if (snapshot.loading) {
    return (
      <main className="screen">
        <p className="muted">Connecting to session…</p>
      </main>
    );
  }

  const session = snapshot.session;
  if (!session) {
    return (
      <main className="screen">
        <h1>Session not found</h1>
        <p className="muted">
          This session has ended or never existed. Sessions are erased as soon as the leader
          clicks End, and after 24 hours of inactivity.
        </p>
        <a href="/" className="btn btn-primary">Back to start</a>
      </main>
    );
  }

  const me = session.participants.find((p) => p.id === identity.participantId);
  const needsLobby =
    !me ||
    !identity.name ||
    me.name === 'Leader' ||
    session.phase === 'lobby';

  if (needsLobby) {
    return <Lobby session={session} identity={identity} onIdentitySaved={setIdentity} />;
  }

  switch (session.phase) {
    case 'decisions':
      return <DecisionsPhase session={session} me={me!} />;
    case 'voting':
      return <VotingPhase session={session} me={me!} />;
    case 'discussion':
      return <DiscussionList session={session} me={me!} />;
    case 'poker':
      return <PokerRound session={session} me={me!} />;
    case 'results':
      return <Results session={session} me={me!} />;
    default:
      return <Lobby session={session} identity={identity} onIdentitySaved={setIdentity} />;
  }
}
