/**
 * Realtime store backed by a PartyKit room (one room per session id).
 *
 * The server holds the canonical Session state; this module is a thin
 * client cache + dispatcher. State arrives via WebSocket messages and
 * is exposed to React via useSyncExternalStore.
 *
 * Public API:
 *   initSession(s)         - leader-only; seeds a brand-new room
 *   dispatch(id, action)   - fire-and-forget; server applies the reducer
 *   endSession(id)         - wipes server state and closes the socket
 *   useSession(id)         - { loading, session } reactive snapshot
 *   usePhaseTimeout(...)   - schedule callback at phaseEndsAt
 */
import { useEffect, useSyncExternalStore } from 'react';
import PartySocket from 'partysocket';
import type { Action } from './session';
import type { Session } from './types';

const HOST = import.meta.env.VITE_PARTYKIT_HOST || 'localhost:1999';

export type SessionSnapshot =
  | { loading: true; session: null }
  | { loading: false; session: Session | null };

type SocketEntry = {
  socket: PartySocket;
  snapshot: SessionSnapshot;
  listeners: Set<() => void>;
};

const entries = new Map<string, SocketEntry>();
const LOADING: SessionSnapshot = Object.freeze({ loading: true, session: null });
const ENDED: SessionSnapshot = Object.freeze({ loading: false, session: null });

function ensureEntry(id: string): SocketEntry {
  const existing = entries.get(id);
  if (existing) return existing;
  const socket = new PartySocket({ host: HOST, room: id });
  const entry: SocketEntry = { socket, snapshot: LOADING, listeners: new Set() };
  socket.addEventListener('message', (e) => {
    let msg: { type: string; session?: Session | null };
    try {
      msg = JSON.parse(e.data as string);
    } catch {
      return;
    }
    if (msg.type === 'state') {
      entry.snapshot = msg.session
        ? { loading: false, session: msg.session }
        : ENDED;
      notify(entry);
    } else if (msg.type === 'ended') {
      entry.snapshot = ENDED;
      notify(entry);
    }
  });
  entries.set(id, entry);
  return entry;
}

function notify(entry: SocketEntry) {
  for (const fn of entry.listeners) fn();
}

function send(entry: SocketEntry, msg: unknown) {
  // partysocket buffers messages sent before the connection opens.
  entry.socket.send(JSON.stringify(msg));
}

export function initSession(s: Session): void {
  const entry = ensureEntry(s.id);
  // Optimistic local snapshot so the leader doesn't see a "loading" flash.
  entry.snapshot = { loading: false, session: s };
  notify(entry);
  send(entry, { type: 'init', session: s });
}

export function dispatch(id: string, action: Action): void {
  send(ensureEntry(id), { type: 'dispatch', action });
}

export function endSession(id: string): void {
  const entry = entries.get(id);
  if (!entry) return;
  send(entry, { type: 'end' });
  setTimeout(() => {
    entry.socket.close();
    entries.delete(id);
  }, 200);
}

function subscribe(id: string, fn: () => void): () => void {
  const entry = ensureEntry(id);
  entry.listeners.add(fn);
  return () => {
    entry.listeners.delete(fn);
  };
}

export function useSession(id: string): SessionSnapshot {
  return useSyncExternalStore(
    (cb) => subscribe(id, cb),
    () => ensureEntry(id).snapshot,
    () => LOADING,
  );
}

/** Schedule a callback to fire when phaseEndsAt elapses. */
export function usePhaseTimeout(
  session: Session | null,
  onElapsed: () => void,
): void {
  useEffect(() => {
    if (!session?.phaseEndsAt) return;
    const remaining = session.phaseEndsAt - Date.now();
    if (remaining <= 0) {
      onElapsed();
      return;
    }
    const t = window.setTimeout(onElapsed, remaining);
    return () => window.clearTimeout(t);
  }, [session?.phaseEndsAt, session?.phase]);
}
