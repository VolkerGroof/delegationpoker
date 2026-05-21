import { useNavigate } from 'react-router-dom';
import { createSession } from '../lib/session';
import { freshParticipantId, saveIdentity } from '../lib/identity';
import { saveSession } from '../lib/store';

export function Landing() {
  const nav = useNavigate();

  const startSession = () => {
    const participantId = freshParticipantId();
    const session = createSession({ id: participantId, name: 'Leader', isLeader: true });
    saveSession(session);
    saveIdentity(session.id, { participantId, name: '' });
    nav(`/s/${session.id}`);
  };

  return (
    <main className="landing">
      <img className="logo logo-lg" src="/Logo.png" alt="Groof Delegation Poker" />
      <p className="tagline">
        Discuss and decide about <strong>deciding</strong>.<br />
        Run a Delegation Poker session with your team in 15 minutes.
      </p>
      <button className="btn btn-primary btn-xl" onClick={startSession}>
        Start session
      </button>
      <footer className="landing-footer">
        Cards based on the Delegation Poker game by Management 3.0.
      </footer>
    </main>
  );
}
