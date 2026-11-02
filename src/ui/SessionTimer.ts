const TICK_MS = 250;

/**
 * Inactivity countdown for a USSD session.
 * start() (re)starts the full countdown, so calling it on every key press
 * gives "expires after N seconds without activity". A timeout of 0 disables it.
 */
export class SessionTimer {
  private timeoutMs: number;
  private deadline = 0;
  private handle: number | undefined;

  constructor(
    timeoutMs: number,
    /** Called every tick with the time left, and with null when stopped. */
    private onTick: (remainingMs: number | null) => void,
    private onExpire: () => void
  ) {
    this.timeoutMs = timeoutMs;
  }

  get enabled(): boolean {
    return this.timeoutMs > 0;
  }

  setTimeoutMs(ms: number): void {
    this.timeoutMs = ms;
  }

  start(): void {
    this.stop();
    if (!this.enabled) return;
    this.deadline = Date.now() + this.timeoutMs;
    this.handle = window.setInterval(() => this.check(), TICK_MS);
    this.onTick(this.timeoutMs);
  }

  stop(): void {
    if (this.handle !== undefined) window.clearInterval(this.handle);
    this.handle = undefined;
    this.onTick(null);
  }

  private check(): void {
    const left = this.deadline - Date.now();
    if (left <= 0) {
      this.stop();
      this.onExpire();
      return;
    }
    this.onTick(left);
  }
}
