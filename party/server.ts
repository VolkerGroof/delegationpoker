/**
 * PartyKit room server for one delegation-poker session.
 *
 * Each "room" is one session id (path segment). PartyKit creates one
 * Durable-Object-backed instance per room on Cloudflare's edge. State is
 * kept in instance memory + persisted to `room.storage` so a brief
 * hibernation doesn't lose data; `end` wipes both, matching the
 * "data destroyed after the session" requirement.
 *
 * Wire protocol:
 *   client → server:
 *     { type: 'init',     session: Session }   // creator's first message
 *     { type: 'dispatch', action:  Action  }   // every state mutation
 *     { type: 'end' }                          // leader ends session
 *   server → client:
 *     { type: 'state',    session: Session | null }
 *     { type: 'ended' }
 */
import type * as Party from 'partykit/server';
import { reduce, type Action } from '../src/lib/session';
import type { Session } from '../src/lib/types';

type ClientMessage =
  | { type: 'init'; session: Session }
  | { type: 'dispatch'; action: Action }
  | { type: 'end' };

type ServerMessage =
  | { type: 'state'; session: Session | null }
  | { type: 'ended' };

const STORAGE_KEY = 'session';
// Auto-evict storage after this many ms of inactivity. Pure safety net —
// the leader's "End session" call is the primary cleanup path.
const TTL_MS = 24 * 60 * 60 * 1000;

export default class SessionServer implements Party.Server {
  session: Session | null = null;
  lastTouched = Date.now();

  constructor(readonly room: Party.Room) {}

  async onStart() {
    const stored = await this.room.storage.get<Session>(STORAGE_KEY);
    const touchedAt = (await this.room.storage.get<number>('touchedAt')) ?? 0;
    if (stored && Date.now() - touchedAt < TTL_MS) {
      this.session = stored;
      this.lastTouched = touchedAt;
    } else if (stored) {
      // expired
      await this.room.storage.deleteAll();
    }
  }

  onConnect(conn: Party.Connection) {
    this.sendTo(conn, { type: 'state', session: this.session });
  }

  async onMessage(rawMsg: string, sender: Party.Connection) {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(rawMsg) as ClientMessage;
    } catch {
      return;
    }

    switch (msg.type) {
      case 'init': {
        // First-writer wins. Subsequent inits are ignored so a refreshing
        // tab doesn't clobber a session that's already running.
        if (!this.session) {
          this.session = msg.session;
          await this.persist();
        }
        this.broadcastState();
        return;
      }
      case 'dispatch': {
        if (!this.session) return;
        const next = reduce(this.session, msg.action);
        if (next === this.session) return;
        this.session = next;
        await this.persist();
        this.broadcastState();
        return;
      }
      case 'end': {
        this.session = null;
        await this.room.storage.deleteAll();
        this.broadcast({ type: 'ended' });
        return;
      }
    }
  }

  private async persist() {
    if (!this.session) return;
    this.lastTouched = Date.now();
    await this.room.storage.put(STORAGE_KEY, this.session);
    await this.room.storage.put('touchedAt', this.lastTouched);
  }

  private broadcastState() {
    this.broadcast({ type: 'state', session: this.session });
  }

  private broadcast(msg: ServerMessage) {
    this.room.broadcast(JSON.stringify(msg));
  }

  private sendTo(conn: Party.Connection, msg: ServerMessage) {
    conn.send(JSON.stringify(msg));
  }
}

SessionServer satisfies Party.Worker;
