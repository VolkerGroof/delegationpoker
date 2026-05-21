import { Participant } from '../lib/types';

export function ParticipantBadge({ p }: { p: Participant; showName?: boolean; size?: 'sm' | 'md' }) {
  return <span className="pbadge-name">{p.name}</span>;
}
