export type Phase =
  | 'lobby'
  | 'decisions'
  | 'voting'
  | 'discussion'
  | 'poker'
  | 'results';

export type DelegationLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const DELEGATION_LEVELS: Array<{
  level: DelegationLevel;
  name: string;
  tagline: string;
  image: string;
}> = [
  { level: 1, name: 'Tell', tagline: 'I will tell them', image: '/cards/1-tell.png' },
  { level: 2, name: 'Sell', tagline: 'I will try and sell it to them', image: '/cards/2-sell.png' },
  { level: 3, name: 'Consult', tagline: 'I will consult and then decide', image: '/cards/3-consult.png' },
  { level: 4, name: 'Agree', tagline: 'We will agree together', image: '/cards/4-agree.png' },
  { level: 5, name: 'Advise', tagline: 'I will advise but they decide', image: '/cards/5-advise.png' },
  { level: 6, name: 'Inquire', tagline: 'I will inquire after they decide', image: '/cards/6-inquire.png' },
  { level: 7, name: 'Delegate', tagline: 'I will fully delegate', image: '/cards/7-delegate.png' },
];

export type Participant = {
  id: string;
  name: string;
  isLeader: boolean;
};

export type Comment = {
  id: string;
  authorId: string;
  text: string;
  createdAt: number;
};

export type Decision = {
  id: string;
  authorId: string;
  title: string;
  description: string;
  votes: Record<string, 1 | -1>;
  comments: Comment[];
  pokered: boolean;
  pokerVotes: Record<string, DelegationLevel>;
  unveiled: boolean;
  teamDecision: DelegationLevel | null;
};

export type Session = {
  id: string;
  phase: Phase;
  phaseEndsAt: number | null;
  participants: Participant[];
  decisions: Decision[];
  currentPokerId: string | null;
  createdAt: number;
};

export const PHASE_DURATION_MS = 3 * 60 * 1000;

export function decisionScore(d: Decision): number {
  let score = 0;
  for (const v of Object.values(d.votes)) score += v;
  return score;
}
