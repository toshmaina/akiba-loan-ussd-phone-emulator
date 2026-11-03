const TICK_MS = 250;
/**
 * Inactivity countdown for a USSD session.
 * start() (re)starts the full countdown, so calling it on every key press
 * gives "expires after N seconds without activity". A timeout of 0 disables it.
 */
export class SessionTimer {
    constructor(timeoutMs, 
    /** Called every tick with the time left, and with null when stopped. */
    onTick, onExpire) {
        this.onTick = onTick;
        this.onExpire = onExpire;
        this.deadline = 0;
        this.timeoutMs = timeoutMs;
    }
    get enabled() {
        return this.timeoutMs > 0;
    }
    setTimeoutMs(ms) {
        this.timeoutMs = ms;
    }
    start() {
        this.stop();
        if (!this.enabled)
            return;
        this.deadline = Date.now() + this.timeoutMs;
        this.handle = window.setInterval(() => this.check(), TICK_MS);
        this.onTick(this.timeoutMs);
    }
    stop() {
        if (this.handle !== undefined)
            window.clearInterval(this.handle);
        this.handle = undefined;
        this.onTick(null);
    }
    check() {
        const left = this.deadline - Date.now();
        if (left <= 0) {
            this.stop();
            this.onExpire();
            return;
        }
        this.onTick(left);
    }
}
