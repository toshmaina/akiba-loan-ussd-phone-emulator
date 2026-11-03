import { MY_NUMBER } from "../constants/index.js";
import { MemoryStore } from "./store.js";
const pad4 = (n) => String(n).padStart(4, "0");
function randomSuffix() {
    const bytes = new Uint8Array(3);
    if (typeof crypto !== "undefined" && crypto.getRandomValues)
        crypto.getRandomValues(bytes);
    else
        bytes.forEach((_, i) => (bytes[i] = Math.floor(Math.random() * 256)));
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
/**
 * Turns the emulator's JourneyEvents into stored sessions and events.
 *
 * It owns what the emulator should not: unique ids, the phone number, the
 * clock and persistence. Writes are queued, so they always land in order.
 */
export class SessionLogger {
    constructor(store, clock = Date.now, phone = MY_NUMBER) {
        this.store = store;
        this.clock = clock;
        this.phone = phone;
        this.active = null;
        this.listeners = new Set();
        this.queue = Promise.resolve();
        // Runs before any write, because writes are queued behind it.
        this.enqueue(() => this.closeStaleSessions());
    }
    get persistent() {
        return this.store.persistent;
    }
    /** Subscribe to changes (a write finished). Returns an unsubscribe function. */
    onChange(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    /** Record what the user did. Events outside a session are ignored. */
    record(event, lang) {
        var _a;
        const at = this.clock();
        if (event.kind === "dial") {
            this.closeActive("abandoned");
            this.active = this.startSession(event, lang, at);
        }
        const session = this.active;
        if (!session)
            return; // e.g. a mistyped code before any session exists
        const seq = session.eventCount + 1;
        const row = {
            id: `${session.id}#${pad4(seq)}`,
            sessionId: session.id,
            seq,
            phone: session.phone,
            kind: event.kind,
            screenId: event.screenId,
            toScreenId: event.toScreenId,
            value: event.value,
            error: event.error,
            at,
        };
        session.eventCount = seq;
        session.lastScreenId = (_a = event.toScreenId) !== null && _a !== void 0 ? _a : event.screenId;
        if (event.endsSession) {
            session.endedAt = at;
            session.status = event.kind === "expire" ? "expired" : "ended";
            this.active = null;
        }
        this.persist({ ...session }, row);
    }
    /** End the open session without a user action (reset, mode switch). */
    closeActive(status) {
        const session = this.active;
        if (!session)
            return;
        session.status = status;
        session.endedAt = this.clock();
        this.active = null;
        this.persist({ ...session });
    }
    async listSessions() {
        await this.queue;
        return this.store.listSessions();
    }
    async listEvents(sessionId) {
        await this.queue;
        return this.store.listEvents(sessionId);
    }
    async clear() {
        this.active = null;
        await this.enqueue(() => this.store.clear());
        this.emit();
    }
    /* ---------------- internals ---------------- */
    startSession(event, lang, at) {
        return {
            id: `${this.phone}-${at.toString(36)}-${randomSuffix()}`,
            phone: this.phone,
            lang,
            dialCode: event.value,
            startedAt: at,
            endedAt: null,
            status: "active",
            eventCount: 0,
            lastScreenId: event.screenId,
        };
    }
    /** A session still "active" in storage belongs to a page that has gone. */
    async closeStaleSessions() {
        var _a;
        try {
            const sessions = await this.store.listSessions();
            for (const s of sessions) {
                if (s.status === "active") {
                    await this.store.save({ ...s, status: "abandoned", endedAt: (_a = s.endedAt) !== null && _a !== void 0 ? _a : this.clock() });
                }
            }
        }
        catch {
            // Storage is unusable (blocked, private mode): keep working in memory.
            this.store = new MemoryStore();
        }
        this.emit();
    }
    persist(session, event) {
        this.enqueue(async () => {
            await this.store.save(session, event);
            this.emit();
        });
    }
    enqueue(work) {
        const next = this.queue.then(work).catch((err) => {
            console.error("Session log write failed", err);
            return undefined;
        });
        this.queue = next;
        return next;
    }
    emit() {
        this.listeners.forEach((fn) => fn());
    }
}
