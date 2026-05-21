import { nanoid } from 'nanoid';

const KEY = (sessionId: string) => `identity:${sessionId}`;

export type Identity = { participantId: string; name: string };

export function loadIdentity(sessionId: string): Identity | null {
  try {
    const raw = sessionStorage.getItem(KEY(sessionId));
    if (!raw) return null;
    return JSON.parse(raw) as Identity;
  } catch {
    return null;
  }
}

export function saveIdentity(sessionId: string, id: Identity) {
  sessionStorage.setItem(KEY(sessionId), JSON.stringify(id));
}

export function clearIdentity(sessionId: string) {
  sessionStorage.removeItem(KEY(sessionId));
}

export function freshParticipantId(): string {
  return nanoid(10);
}
