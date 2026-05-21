import { useEffect, useSyncExternalStore } from 'react';
import { Action, reduce } from './session';
import { Session } from './types';

const KEY = (id: string) => `session:${id}`;
const CHANNEL = (id: string) => `session:${id}`;

const channels = new Map<string, BroadcastChannel>();
const listeners = new Map<string, Set<() => void>>();
// Stable snapshot cache for useSyncExternalStore: same raw string → same object
// reference so React doesn't see "changed" data on every render.
const snapshotCache = new Map<string, { raw: string | null; parsed: Session | null }>();

function getChannel(id: string): BroadcastChannel {
  let ch = channels.get(id);
  if (!ch) {
    ch = new BroadcastChannel(CHANNEL(id));
    ch.addEventListener('message', () => notify(id));
    channels.set(id, ch);
  }
  return ch;
}

function notify(id: string) {
  const set = listeners.get(id);
  if (!set) return;
  for (const fn of set) fn();
}

export function loadSession(id: string): Session | null {
  const raw = localStorage.getItem(KEY(id));
  const cached = snapshotCache.get(id);
  if (cached && cached.raw === raw) return cached.parsed;
  let parsed: Session | null = null;
  if (raw) {
    try {
      parsed = JSON.parse(raw) as Session;
    } catch {
      parsed = null;
    }
  }
  snapshotCache.set(id, { raw, parsed });
  return parsed;
}

export function saveSession(s: Session) {
  localStorage.setItem(KEY(s.id), JSON.stringify(s));
  getChannel(s.id).postMessage('update');
  notify(s.id);
}

export function deleteSession(id: string) {
  localStorage.removeItem(KEY(id));
  getChannel(id).postMessage('update');
  notify(id);
}

export function dispatch(id: string, action: Action): Session | null {
  const current = loadSession(id);
  if (!current) return null;
  const next = reduce(current, action);
  if (next === current) return current;
  saveSession(next);
  return next;
}

export function subscribe(id: string, fn: () => void): () => void {
  let set = listeners.get(id);
  if (!set) {
    set = new Set();
    listeners.set(id, set);
  }
  set.add(fn);
  // Also listen to storage events for cross-tab sync (BroadcastChannel covers
  // most cases but storage events catch tabs that opened before our channel).
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY(id)) fn();
  };
  window.addEventListener('storage', onStorage);
  // Make sure the channel is alive
  getChannel(id);
  return () => {
    set!.delete(fn);
    window.removeEventListener('storage', onStorage);
  };
}

export function useSession(id: string): Session | null {
  const session = useSyncExternalStore(
    (cb) => subscribe(id, cb),
    () => loadSession(id),
    () => null,
  );
  return session;
}

/** Hook: schedule a callback to fire when phaseEndsAt elapses, in every tab. */
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
