import { Handset } from "./Handset.js";
import { Controls } from "./Controls.js";
import { bindKeyboard } from "./keyboard.js";
import { defaultScale, effectiveScale } from "./scale.js";
import { SessionTimer } from "./SessionTimer.js";
import { DEFAULT_SESSION_TIMEOUT_S } from "../constants/index.js";
/** Owns the handsets and routes every key press to all of them. */
export class App {
    constructor(stage, inspector, logger) {
        this.stage = stage;
        this.inspector = inspector;
        this.logger = logger;
        this.handsets = [];
        this.mode = "en";
        this.scale = defaultScale();
        this.timeoutS = DEFAULT_SESSION_TIMEOUT_S;
        this.timer = new SessionTimer(this.timeoutS * 1000, (remaining) => this.showSession(remaining), () => this.expireSession());
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
        bindKeyboard((press) => this.dispatch(press), (key) => this.handsets.forEach((h) => h.flash(key)));
        window.addEventListener("resize", () => this.applyScale());
        this.rebuild();
    }
    setMode(next) {
        const singleToSingle = next !== "both" && this.mode !== "both";
        this.mode = next;
        if (singleToSingle) {
            // Swap language in place and keep the session.
            this.handsets[0].emu.lang = next;
            this.handsets[0].update();
            this.inspector.update(this.handsets);
        }
        else {
            this.rebuild();
        }
    }
    rebuild() {
        this.logger.closeActive("abandoned"); // Mark any open session as abandoned
        const send = (p) => this.dispatch(p);
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
    dispatch(press) {
        this.handsets.forEach((h, i) => {
            const event = h.emu.press(press);
            // Both handsets live the same journey; log it once, from the first.
            // h.emu.lang captures the language at the exact moment of the action.
            if (i === 0 && event)
                this.logger.record(event, h.emu.lang);
            h.update();
        });
        this.inspector.update(this.handsets);
        this.syncSession();
    }
    /** Any key press while a session is open restarts the inactivity countdown. */
    syncSession() {
        if (this.handsets[0].emu.sessionActive)
            this.timer.start();
        else
            this.timer.stop();
    }
    setTimeoutSeconds(seconds) {
        this.timeoutS = seconds;
        this.timer.setTimeoutMs(seconds * 1000);
        this.syncSession();
    }
    /** The network closes the session; the handsets show "Session expired". */
    expireSession() {
        this.handsets.forEach((h, i) => {
            const event = h.emu.expire();
            if (i === 0 && event)
                this.logger.record(event, h.emu.lang);
            h.update();
        });
        this.inspector.update(this.handsets);
        this.showSession(null);
    }
    showSession(remainingMs) {
        var _a;
        const emu = (_a = this.handsets[0]) === null || _a === void 0 ? void 0 : _a.emu;
        let text;
        if (!emu)
            text = "";
        else if (this.handsets[0].view.screen === "expired")
            text = "Session expired";
        else if (!emu.sessionActive)
            text = "No active session";
        else if (!this.timer.enabled)
            text = "Timeout is off";
        else
            text = `Expires in ${Math.ceil((remainingMs !== null && remainingMs !== void 0 ? remainingMs : this.timeoutS * 1000) / 1000)}s of inactivity`;
        this.inspector.setSession(text);
    }
    applyScale() {
        const value = effectiveScale(this.mode, this.scale, this.stage.clientWidth);
        document.documentElement.style.setProperty("--scale", String(value));
        this.controls.showScale(this.scale);
    }
}
