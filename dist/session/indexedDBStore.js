const DB_NAME = "akiba-ussd-log";
const DB_VERSION = 1;
const SESSIONS = "sessions";
const EVENTS = "events";
const request = (r) => new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
});
const finished = (t) => new Promise((resolve, reject) => {
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
});
/**
 * Browser IndexedDB storage.
 *
 *   sessions  keyPath id        indexes: startedAt, phone, status
 *   events    keyPath id        indexes: sessionId, at, phone, screenId
 */
export class IndexedDbStore {
    constructor() {
        this.persistent = true;
        this.opening = null;
    }
    db() {
        if (!this.opening) {
            this.opening = new Promise((resolve, reject) => {
                const open = indexedDB.open(DB_NAME, DB_VERSION);
                open.onupgradeneeded = () => {
                    const db = open.result;
                    if (!db.objectStoreNames.contains(SESSIONS)) {
                        const s = db.createObjectStore(SESSIONS, { keyPath: "id" });
                        s.createIndex("startedAt", "startedAt");
                        s.createIndex("phone", "phone");
                        s.createIndex("status", "status");
                    }
                    if (!db.objectStoreNames.contains(EVENTS)) {
                        const e = db.createObjectStore(EVENTS, { keyPath: "id" });
                        e.createIndex("sessionId", "sessionId");
                        e.createIndex("at", "at");
                        e.createIndex("phone", "phone");
                        e.createIndex("screenId", "screenId");
                    }
                };
                open.onsuccess = () => resolve(open.result);
                open.onerror = () => reject(open.error);
                open.onblocked = () => reject(new Error("IndexedDB open was blocked"));
            });
        }
        return this.opening;
    }
    async save(session, event) {
        const db = await this.db();
        const t = db.transaction([SESSIONS, EVENTS], "readwrite");
        t.objectStore(SESSIONS).put(session);
        if (event)
            t.objectStore(EVENTS).add(event);
        await finished(t); // session and event commit together or not at all
    }
    async listSessions() {
        const db = await this.db();
        const all = await request(db.transaction(SESSIONS).objectStore(SESSIONS).index("startedAt").getAll());
        return all.reverse(); // index is ascending; the UI wants newest first
    }
    async listEvents(sessionId) {
        const db = await this.db();
        const range = IDBKeyRange.bound(`${sessionId}#`, `${sessionId}#\uffff`);
        return request(db.transaction(EVENTS).objectStore(EVENTS).getAll(range));
    }
    async clear() {
        const db = await this.db();
        const t = db.transaction([SESSIONS, EVENTS], "readwrite");
        t.objectStore(SESSIONS).clear();
        t.objectStore(EVENTS).clear();
        await finished(t);
    }
}
