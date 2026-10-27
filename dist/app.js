import { MAX_FOOT_CHARS, MAX_ROW_CHARS, STR, HOLD_MS, KEYPAD } from "./constants/index.js";
import { Emulator } from "./emulator/index.js";
function longestLines(v) {
    return {
        row: Math.max(...v.rows.map((r) => r.length)),
        foot: Math.max(...v.foot.map((r) => r.length)),
    };
}
/* ------------------------------------------------------------------ */
/*  UI                                                               */
/* ------------------------------------------------------------------ */
function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className)
        node.className = className;
    if (text !== undefined)
        node.textContent = text;
    return node;
}
class Handset {
    constructor(lang, caption, send) {
        this.rows = [];
        this.foot = [];
        this.buttons = new Map();
        this.emu = new Emulator(lang);
        this.root = el("figure", "phone");
        if (caption)
            this.root.appendChild(el("figcaption", "phone-caption", caption));
        const box = el("div", "phone-box");
        const handset = el("div", "handset");
        handset.appendChild(el("div", "shell"));
        const body = el("div", "body");
        body.appendChild(el("div", "speaker"));
        body.appendChild(el("div", "brand", "AKIBA SACCO"));
        handset.appendChild(body);
        handset.appendChild(this.buildScreen());
        const ring = el("div", "nav-ring");
        ring.setAttribute("aria-hidden", "true");
        handset.appendChild(ring);
        for (const side of ["l", "r"]) {
            const d = el("div", `soft soft-${side}`);
            d.setAttribute("aria-hidden", "true");
            handset.appendChild(d);
        }
        handset.appendChild(this.buildHardKey("call", "Call", send));
        handset.appendChild(this.buildHardKey("end", "End", send));
        handset.appendChild(this.buildKeypad(send));
        box.appendChild(handset);
        this.root.appendChild(box);
        this.update();
    }
    buildScreen() {
        const screen = el("div", "screen");
        screen.setAttribute("role", "status");
        screen.setAttribute("aria-live", "polite");
        screen.setAttribute("aria-atomic", "true");
        const title = el("div", "line title", STR.en.appName);
        screen.appendChild(title);
        screen.appendChild(el("div", "rule"));
        for (let i = 0; i < 4; i++) {
            const r = el("div", `line row row-${i}`);
            this.rows.push(r);
            screen.appendChild(r);
        }
        for (let i = 0; i < 2; i++) {
            const f = el("div", `line foot foot-${i}`);
            this.foot.push(f);
            screen.appendChild(f);
        }
        this.screenEl = screen;
        return screen;
    }
    buildHardKey(key, label, send) {
        const b = el("button", `hard hard-${key}`);
        b.type = "button";
        b.setAttribute("aria-label", label);
        b.appendChild(el("span", "hard-icon"));
        b.appendChild(el("span", "hard-label", label));
        b.addEventListener("click", () => send({ key }));
        this.buttons.set(key, b);
        return b;
    }
    buildKeypad(send) {
        const pad = el("div", "keypad");
        for (const def of KEYPAD) {
            const b = el("button", `key key-${def.key === "*" ? "star" : def.key === "#" ? "hash" : def.key}`);
            b.type = "button";
            b.setAttribute("aria-label", def.label);
            b.appendChild(el("span", "key-main", def.main));
            b.appendChild(el("span", "key-sub", def.sub));
            this.buttons.set(def.key, b);
            if (def.key === "0") {
                this.bindZero(b, send);
            }
            else {
                b.addEventListener("click", () => send({ key: def.key }));
            }
            pad.appendChild(b);
        }
        return pad;
    }
    bindZero(b, send) {
        let timer;
        let held = false;
        const clear = () => {
            if (timer !== undefined)
                window.clearTimeout(timer);
            timer = undefined;
        };
        b.addEventListener("pointerdown", (e) => {
            if (e.button !== 0)
                return;
            held = false;
            clear();
            timer = window.setTimeout(() => {
                held = true;
                b.classList.add("is-hold");
                send({ key: "0", hold: true });
            }, HOLD_MS);
        });
        b.addEventListener("pointerup", () => {
            const wasPending = timer !== undefined;
            clear();
            b.classList.remove("is-hold");
            if (wasPending && !held)
                send({ key: "0" });
        });
        const cancel = () => {
            clear();
            b.classList.remove("is-hold");
        };
        b.addEventListener("pointerleave", cancel);
        b.addEventListener("pointercancel", cancel);
        b.addEventListener("contextmenu", (e) => e.preventDefault());
        b.addEventListener("click", (e) => {
            if (e.detail === 0)
                send({ key: "0" });
        });
    }
    flash(key) {
        const b = this.buttons.get(key);
        if (!b)
            return;
        b.classList.add("is-down");
        window.setTimeout(() => b.classList.remove("is-down"), 110);
    }
    update() {
        const v = this.emu.render();
        this.lastView = v;
        v.rows.forEach((text, i) => (this.rows[i].textContent = text === "" ? "\u00a0" : text));
        v.foot.forEach((text, i) => (this.foot[i].textContent = text));
        this.root.dataset.screen = v.screen;
    }
    get view() {
        return this.lastView;
    }
    fitsDisplay() {
        const lines = this.screenEl.querySelectorAll(".line");
        return Array.from(lines).every((n) => n.scrollWidth <= n.clientWidth);
    }
}
class App {
    constructor(stage, trailEl, fitEl) {
        this.stage = stage;
        this.trailEl = trailEl;
        this.fitEl = fitEl;
        this.handsets = [];
        this.mode = "en";
        this.scale = 1;
        this.scale = App.defaultScale();
        this.applyScale();
        this.rebuild();
        this.bindControls();
        this.bindKeyboard();
        window.addEventListener("resize", () => this.applyScale());
    }
    static defaultScale() {
        const h = window.innerHeight;
        const w = window.innerWidth;
        if (w < 480)
            return 1.5;
        if (h >= 980)
            return 2;
        if (h >= 720)
            return 1.5;
        return 1;
    }
    effectiveScale() {
        if (this.mode !== "both")
            return this.scale;
        const gap = 36;
        const room = this.stage.clientWidth;
        if (room <= 0)
            return this.scale;
        const fit = Math.floor(((room - gap) / 400) * 20) / 20;
        return Math.max(1, Math.min(this.scale, fit));
    }
    applyScale() {
        document.documentElement.style.setProperty("--scale", String(this.effectiveScale()));
        const input = document.querySelector(`input[name="scale"][value="${this.scale}"]`);
        if (input)
            input.checked = true;
    }
    rebuild() {
        this.stage.textContent = "";
        this.handsets = [];
        const send = (p) => this.dispatch(p);
        if (this.mode === "both") {
            this.handsets.push(new Handset("en", "English", send));
            this.handsets.push(new Handset("sw", "Kiswahili", send));
        }
        else {
            this.handsets.push(new Handset(this.mode, null, send));
        }
        this.handsets.forEach((h) => this.stage.appendChild(h.root));
        this.applyScale();
        this.refreshInspector();
    }
    dispatch(p) {
        for (const h of this.handsets) {
            h.emu.press(p);
            h.update();
        }
        this.refreshInspector();
    }
    refreshInspector() {
        const primary = this.handsets[0];
        this.trailEl.textContent = primary.view.trail.join("  ›  ");
        const fits = this.handsets.every((h) => h.fitsDisplay());
        const worst = this.handsets.reduce((acc, h) => {
            const l = longestLines(h.view);
            return { row: Math.max(acc.row, l.row), foot: Math.max(acc.foot, l.foot) };
        }, { row: 0, foot: 0 });
        this.fitEl.textContent =
            `${fits ? "Fits 160×128" : "Overflows 160×128"} · ` +
                `longest line ${worst.row}/${MAX_ROW_CHARS}, footer ${worst.foot}/${MAX_FOOT_CHARS}`;
        this.fitEl.dataset.ok = String(fits && worst.row <= MAX_ROW_CHARS && worst.foot <= MAX_FOOT_CHARS);
    }
    bindControls() {
        document.querySelectorAll('input[name="mode"]').forEach((i) => {
            i.addEventListener("change", () => {
                const next = i.value;
                if (next !== "both" && this.mode !== "both") {
                    this.mode = next;
                    this.handsets[0].emu.lang = next;
                    this.handsets[0].update();
                    this.refreshInspector();
                    return;
                }
                this.mode = next;
                this.rebuild();
            });
        });
        document.querySelectorAll('input[name="scale"]').forEach((i) => {
            i.addEventListener("change", () => {
                this.scale = parseFloat(i.value);
                this.applyScale();
            });
        });
        const reset = document.getElementById("reset");
        if (reset)
            reset.addEventListener("click", () => this.rebuild());
    }
    bindKeyboard() {
        window.addEventListener("keydown", (e) => {
            if (e.ctrlKey || e.metaKey || e.altKey || e.repeat)
                return;
            const target = e.target;
            let press = null;
            if (/^[0-9]$/.test(e.key))
                press = { key: e.key };
            else if (e.key === "*")
                press = { key: "*" };
            else if (e.key === "#")
                press = { key: "#" };
            else if (e.key === "Enter") {
                if (target instanceof HTMLButtonElement)
                    return;
                press = { key: "call" };
            }
            else if (e.key === "Escape")
                press = { key: "end" };
            else if (e.key === "Backspace")
                press = { key: "0", hold: true };
            if (!press)
                return;
            e.preventDefault();
            this.handsets.forEach((h) => h.flash(press.key === "0" && press.hold ? "0" : press.key));
            this.dispatch(press);
        });
    }
}
if (typeof document !== "undefined") {
    const boot = () => {
        const stage = document.getElementById("devices");
        const trail = document.getElementById("trail");
        const fit = document.getElementById("fit");
        if (stage && trail && fit)
            new App(stage, trail, fit);
    };
    if (document.readyState === "loading")
        document.addEventListener("DOMContentLoaded", boot);
    else
        boot();
}
