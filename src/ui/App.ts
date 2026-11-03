import type { Press, Mode } from "../types/index.js";
import { Handset } from "./Handset.js";
import { Inspector } from "./Inspector.js";
import { Controls } from "./Controls.js";
import { bindKeyboard } from "./keyboard.js";
import { defaultScale, effectiveScale } from "./scale.js";
import { SessionTimer } from "./SessionTimer.js";
import { DEFAULT_SESSION_TIMEOUT_S } from "../constants/index.js";

/** Owns the handsets and routes every key press to all of them. */
export class App {
  private handsets: Handset[] = [];
  private mode: Mode = "en";
  private scale = defaultScale();
  private controls: Controls;
  private timeoutS = DEFAULT_SESSION_TIMEOUT_S;
  private timer = new SessionTimer(
    this.timeoutS * 1000,
    (remaining) => this.showSession(remaining),
    () => this.expireSession()
  );

  constructor(private stage: HTMLElement, private inspector: Inspector) {
    this.controls = new Controls({
      onMode: (mode) => this.setMode(mode),
      onScale: (scale) => {
        this.scale = scale;
        this.applyScale();
      },
      onTimeout: (seconds) => this.setTimeoutSeconds(seconds),
      onReset: () => this.rebuild(),
    });
    this.controls.showTimeout(this.timeoutS);

    bindKeyboard(
      (press) => this.dispatch(press),
      (key) => this.handsets.forEach((h) => h.flash(key))
    );
    window.addEventListener("resize", () => this.applyScale());

    this.rebuild();
  }

  private setMode(next: Mode): void {
    const singleToSingle = next !== "both" && this.mode !== "both";
    this.mode = next;
    if (singleToSingle) {
      // Swap language in place and keep the session.
      this.handsets[0].emu.lang = next as "en" | "sw";
      this.handsets[0].update();
      this.inspector.update(this.handsets);
    } else {
      this.rebuild();
    }
  }

  private rebuild(): void {
    const send = (p: Press): void => this.dispatch(p);
    this.handsets =
      this.mode === "both"
        ? [new Handset("en", "English", send), new Handset("sw", "Kiswahili", send)]
        : [new Handset(this.mode, null, send)];

    this.timer.stop();
    this.stage.textContent = "";
    this.handsets.forEach((h) => this.stage.appendChild(h.root));
    this.applyScale();
    this.inspector.update(this.handsets);
  }

  /** Every handset on screen receives every key, so EN and SW stay in step. */
  private dispatch(press: Press): void {
    for (const h of this.handsets) {
      h.emu.press(press);
      h.update();
    }
    this.inspector.update(this.handsets);
    this.syncSession();
  }

  /** Any key press while a session is open restarts the inactivity countdown. */
  private syncSession(): void {
    if (this.handsets[0].emu.sessionActive) this.timer.start();
    else this.timer.stop();
  }

  private setTimeoutSeconds(seconds: number): void {
    this.timeoutS = seconds;
    this.timer.setTimeoutMs(seconds * 1000);
    this.syncSession();
  }

  /** The network closes the session; the handsets show "Session expired". */
  private expireSession(): void {
    for (const h of this.handsets) {
      h.emu.expire();
      h.update();
    }
    this.inspector.update(this.handsets);
    this.showSession(null);
  }

  private showSession(remainingMs: number | null): void {
    const emu = this.handsets[0]?.emu;
    let text: string;
    if (!emu) text = "";
    else if (this.handsets[0].view.screen === "expired") text = "Session expired";
    else if (!emu.sessionActive) text = "No active session";
    else if (!this.timer.enabled) text = "Timeout is off";
    else text = `Expires in ${Math.ceil((remainingMs ?? this.timeoutS * 1000) / 1000)}s of inactivity`;
    this.inspector.setSession(text);
  }

  private applyScale(): void {
    const value = effectiveScale(this.mode, this.scale, this.stage.clientWidth);
    document.documentElement.style.setProperty("--scale", String(value));
    this.controls.showScale(this.scale);
  }
}
