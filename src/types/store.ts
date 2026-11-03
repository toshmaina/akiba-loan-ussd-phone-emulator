import type { SessionEvent, UssdSession } from "../types/session.js";

/** Where sessions and their events are kept. Swappable: IndexedDB now, a server later. */
export interface SessionStore {
  /** False when data is lost on reload (the in-memory fallback). */
  readonly persistent: boolean;
  /** Write a session, and optionally one new event, together. */
  save(session: UssdSession, event?: SessionEvent): Promise<void>;
  /** All sessions, newest first. */
  listSessions(): Promise<UssdSession[]>;
  /** A session's events in journey order. */
  listEvents(sessionId: string): Promise<SessionEvent[]>;
  clear(): Promise<void>;
}

/** Fallback for browsers where IndexedDB is unavailable. */
export class MemoryStore implements SessionStore {
  readonly persistent = false;
  private sessions = new Map<string, UssdSession>();
  private events: SessionEvent[] = [];

  async save(session: UssdSession, event?: SessionEvent): Promise<void> {
    this.sessions.set(session.id, { ...session });
    if (event) this.events.push({ ...event });
  }

  async listSessions(): Promise<UssdSession[]> {
    return [...this.sessions.values()]
      .map((s) => ({ ...s }))
      .sort((a, b) => b.startedAt - a.startedAt);
  }

  async listEvents(sessionId: string): Promise<SessionEvent[]> {
    return this.events
      .filter((e) => e.sessionId === sessionId)
      .sort((a, b) => a.seq - b.seq)
      .map((e) => ({ ...e }));
  }

  async clear(): Promise<void> {
    this.sessions.clear();
    this.events = [];
  }
}
