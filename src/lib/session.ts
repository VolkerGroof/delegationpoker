import { nanoid } from 'nanoid';
import {
  DelegationLevel,
  Decision,
  Phase,
  PHASE_DURATION_MS,
  Participant,
  Session,
} from './types';

export type Action =
  | { type: 'join'; participant: Participant }
  | { type: 'updateName'; participantId: string; name: string }
  | { type: 'startDecisions' }
  | { type: 'startVoting' }
  | { type: 'startDiscussion' }
  | { type: 'addDecision'; authorId: string; title: string; description: string }
  | { type: 'editDecision'; decisionId: string; title: string; description: string }
  | { type: 'deleteDecision'; decisionId: string }
  | { type: 'voteDecision'; decisionId: string; participantId: string; value: 1 | -1 }
  | { type: 'addComment'; decisionId: string; authorId: string; text: string }
  | { type: 'beginPoker'; decisionId: string }
  | { type: 'pickCard'; participantId: string; level: DelegationLevel }
  | { type: 'unveilCards' }
  | { type: 'recordTeamDecision'; level: DelegationLevel }
  | { type: 'rePoker' }
  | { type: 'finish' };

export function createSession(leader: Participant): Session {
  return {
    id: nanoid(8),
    phase: 'lobby',
    phaseEndsAt: null,
    participants: [leader],
    decisions: [],
    currentPokerId: null,
    createdAt: Date.now(),
  };
}

function setPhase(s: Session, phase: Phase, withTimer: boolean): Session {
  return {
    ...s,
    phase,
    phaseEndsAt: withTimer ? Date.now() + PHASE_DURATION_MS : null,
  };
}

function mapDecision(s: Session, id: string, fn: (d: Decision) => Decision): Session {
  return { ...s, decisions: s.decisions.map((d) => (d.id === id ? fn(d) : d)) };
}

export function reduce(s: Session, a: Action): Session {
  switch (a.type) {
    case 'join': {
      if (s.participants.some((p) => p.id === a.participant.id)) return s;
      return { ...s, participants: [...s.participants, a.participant] };
    }
    case 'updateName': {
      return {
        ...s,
        participants: s.participants.map((p) =>
          p.id === a.participantId ? { ...p, name: a.name } : p,
        ),
      };
    }
    case 'startDecisions': {
      if (s.phase !== 'lobby') return s;
      return setPhase(s, 'decisions', true);
    }
    case 'startVoting': {
      if (s.phase !== 'decisions') return s;
      return setPhase(s, 'voting', true);
    }
    case 'startDiscussion': {
      if (s.phase !== 'voting') return s;
      return setPhase(s, 'discussion', false);
    }
    case 'addDecision': {
      const d: Decision = {
        id: nanoid(10),
        authorId: a.authorId,
        title: a.title,
        description: a.description,
        votes: {},
        comments: [],
        pokered: false,
        pokerVotes: {},
        unveiled: false,
        teamDecision: null,
      };
      return { ...s, decisions: [...s.decisions, d] };
    }
    case 'editDecision': {
      return mapDecision(s, a.decisionId, (d) => ({ ...d, title: a.title, description: a.description }));
    }
    case 'deleteDecision': {
      return { ...s, decisions: s.decisions.filter((d) => d.id !== a.decisionId) };
    }
    case 'voteDecision': {
      return mapDecision(s, a.decisionId, (d) => {
        const next = { ...d.votes };
        if (next[a.participantId] === a.value) delete next[a.participantId];
        else next[a.participantId] = a.value;
        return { ...d, votes: next };
      });
    }
    case 'addComment': {
      return mapDecision(s, a.decisionId, (d) => ({
        ...d,
        comments: [
          ...d.comments,
          { id: nanoid(8), authorId: a.authorId, text: a.text, createdAt: Date.now() },
        ],
      }));
    }
    case 'beginPoker': {
      const target = s.decisions.find((d) => d.id === a.decisionId);
      if (!target) return s;
      // Reset poker state on this card so re-poker is clean
      const cleared = s.decisions.map((d) =>
        d.id === a.decisionId
          ? { ...d, pokerVotes: {}, unveiled: false, pokered: false, teamDecision: null }
          : d,
      );
      return { ...s, decisions: cleared, phase: 'poker', currentPokerId: a.decisionId };
    }
    case 'pickCard': {
      if (!s.currentPokerId) return s;
      return mapDecision(s, s.currentPokerId, (d) => {
        if (d.unveiled) return d;
        return { ...d, pokerVotes: { ...d.pokerVotes, [a.participantId]: a.level } };
      });
    }
    case 'unveilCards': {
      if (!s.currentPokerId) return s;
      return mapDecision(s, s.currentPokerId, (d) => ({ ...d, unveiled: true }));
    }
    case 'recordTeamDecision': {
      if (!s.currentPokerId) return s;
      const updated = mapDecision(s, s.currentPokerId, (d) => ({
        ...d,
        teamDecision: a.level,
        pokered: true,
      }));
      return { ...updated, phase: 'discussion', currentPokerId: null };
    }
    case 'rePoker': {
      if (!s.currentPokerId) return s;
      return mapDecision(s, s.currentPokerId, (d) => ({
        ...d,
        pokerVotes: {},
        unveiled: false,
        teamDecision: null,
        pokered: false,
      }));
    }
    case 'finish': {
      return { ...s, phase: 'results', currentPokerId: null, phaseEndsAt: null };
    }
    default:
      return s;
  }
}
