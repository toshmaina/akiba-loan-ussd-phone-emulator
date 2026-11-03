/** Fallback for browsers where IndexedDB is unavailable. */
export class MemoryStore {
    constructor() {
        this.persistent = false;
        this.sessions = new Map();
        this.events = [];
    }
    async save(session, event) {
        this.sessions.set(session.id, { ...session });
        if (event)
            this.events.push({ ...event });
    }
    async listSessions() {
        return [...this.sessions.values()]
            .map((s) => ({ ...s }))
            .sort((a, b) => b.startedAt - a.startedAt);
    }
    async listEvents(sessionId) {
        return this.events
            .filter((e) => e.sessionId === sessionId)
            .sort((a, b) => a.seq - b.seq)
            .map((e) => ({ ...e }));
    }
    async clear() {
        this.sessions.clear();
        this.events = [];
    }
}
