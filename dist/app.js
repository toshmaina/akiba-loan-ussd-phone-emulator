import { DIAL_CODE, MAX_AMOUNT_DIGITS, MAX_FOOT_CHARS, MAX_PHONE_DIGITS, MAX_ROW_CHARS, MIN_AMOUNT, MY_NUMBER, START_BALANCE, STR, fmt } from "./constants/index";
class Emulator {
    constructor(lang) {
        this.balance = START_BALANCE;
        this.screen = "dial";
        this.buffer = DIAL_CODE; // the dial screen opens pre-filled, as in the kit
        this.stack = [];
        this.error = null;
        this.tx = { target: "self", phone: MY_NUMBER, amount: 0 };
        this.lang = lang;
    }
    /** Back to an idle handset. Balance is kept; use a new Emulator to reset it. */
    quit() {
        this.screen = "dial";
        this.buffer = DIAL_CODE;
        this.stack = [];
        this.error = null;
    }
    go(next) {
        this.stack.push(this.screen);
        this.screen = next;
        this.buffer = "";
    }
    back() {
        const prev = this.stack.pop();
        if (prev === undefined || prev === "dial") {
            this.quit();
            return;
        }
        this.screen = prev;
        this.buffer = "";
    }
    toMainMenu() {
        this.stack = ["dial"];
        this.screen = "main";
        this.buffer = "";
    }
    fail(e) {
        this.error = e;
        this.buffer = "";
    }
    press(p) {
        this.error = null;
        if (p.key === "end")
            return this.quit();
        switch (this.screen) {
            case "dial":
                return this.pressDial(p);
            case "main":
            case "withdraw":
                return this.pressMenu(p);
            case "phone":
            case "amount":
                return this.pressInput(p);
            case "confirm":
                return this.pressConfirm(p);
            case "balance":
                if (p.key === "0")
                    this.back();
                return;
            case "done":
            case "cancelled":
                if (p.key === "0")
                    this.toMainMenu();
                return;
        }
    }
    pressDial(p) {
        if (p.key === "call") {
            if (this.buffer === DIAL_CODE)
                this.toMainMenu();
            else
                this.fail("unknownCode");
            return;
        }
        if (p.key === "*" && this.buffer === DIAL_CODE) {
            this.buffer = "*";
            return;
        }
        if (p.key === "*" || p.key === "#" || /^[0-9]$/.test(p.key)) {
            if (this.buffer.length < 12)
                this.buffer += p.key;
        }
    }
    pressMenu(p) {
        if (p.key === "0")
            return this.back();
        if (p.key === "*") {
            this.buffer = "";
            return;
        }
        if (/^[1-9]$/.test(p.key)) {
            this.buffer = p.key;
            return;
        }
        if (p.key !== "#")
            return;
        const choice = this.buffer;
        if (this.screen === "main") {
            if (choice === "1")
                this.go("balance");
            else if (choice === "2")
                this.go("withdraw");
            else
                this.fail("badChoice");
        }
        else {
            if (choice === "1") {
                this.tx = { target: "self", phone: MY_NUMBER, amount: 0 };
                this.go("amount");
            }
            else if (choice === "2") {
                this.tx = { target: "other", phone: "", amount: 0 };
                this.go("phone");
            }
            else {
                this.fail("badChoice");
            }
        }
    }
    pressInput(p) {
        if (p.key === "0" && p.hold)
            return this.back();
        if (p.key === "*") {
            this.buffer = "";
            return;
        }
        if (/^[0-9]$/.test(p.key)) {
            const max = this.screen === "phone" ? MAX_PHONE_DIGITS : MAX_AMOUNT_DIGITS;
            if (this.buffer.length < max)
                this.buffer += p.key;
            return;
        }
        if (p.key !== "#")
            return;
        if (this.screen === "phone") {
            if (!/^(07|01)\d{8}$/.test(this.buffer))
                return this.fail("badNumber");
            this.tx.phone = this.buffer;
            this.go("amount");
            return;
        }
        const amount = parseInt(this.buffer, 10);
        if (!Number.isFinite(amount) || amount < MIN_AMOUNT)
            return this.fail("badAmount");
        if (amount > this.balance)
            return this.fail("noFunds");
        this.tx.amount = amount;
        this.go("confirm");
    }
    pressConfirm(p) {
        if (p.key === "0")
            return this.back();
        if (p.key === "1") {
            this.balance -= this.tx.amount;
            this.stack = ["dial", "main"];
            this.screen = "done";
            this.buffer = "";
        }
        else if (p.key === "2") {
            this.stack = ["dial", "main"];
            this.screen = "cancelled";
            this.buffer = "";
        }
    }
    render() {
        const s = STR[this.lang];
        const prompt = `> ${this.buffer}_`;
        let rows;
        let foot;
        switch (this.screen) {
            case "dial":
                rows = [s.dialPrompt, "", this.buffer || "_", ""];
                foot = s.foot.dial;
                break;
            case "main":
                rows = [s.mainTitle, s.mainOpt1, s.mainOpt2, prompt];
                foot = s.foot.menu;
                break;
            case "balance":
                rows = [s.balanceTitle, `KES ${fmt(this.balance)}`, "", MY_NUMBER];
                foot = s.foot.view;
                break;
            case "withdraw":
                rows = [s.withdrawTitle, s.withdrawOpt1, s.withdrawOpt2, prompt];
                foot = s.foot.menu;
                break;
            case "phone":
                rows = [s.otherNumber, s.enterPhone, "", prompt];
                foot = s.foot.input;
                break;
            case "amount":
                rows = [
                    this.tx.target === "self" ? s.myNumber : s.otherNumber,
                    this.tx.phone,
                    s.amountLabel,
                    prompt,
                ];
                foot = s.foot.input;
                break;
            case "confirm":
                rows = [
                    s.reviewTitle,
                    `KES ${fmt(this.tx.amount)}`,
                    `${s.to} ${this.tx.phone}`,
                    s.confirmChoice,
                ];
                foot = s.foot.view;
                break;
            case "done":
                rows = [
                    s.doneTitle,
                    s.withdrawn(fmt(this.tx.amount)),
                    `${s.to} ${this.tx.phone}`,
                    s.balanceLine(fmt(this.balance)),
                ];
                foot = s.foot.done;
                break;
            case "cancelled":
                rows = [s.cancelledTitle, s.cancelledBody, "", ""];
                foot = s.foot.done;
                break;
        }
        if (this.error)
            rows = [rows[0], rows[1], rows[2], `! ${s.err[this.error]}`];
        const names = {
            dial: DIAL_CODE,
            main: s.mainTitle,
            balance: s.balanceTitle,
            withdraw: s.withdrawTitle,
            phone: s.otherNumber,
            amount: s.amountLabel,
            confirm: s.reviewTitle,
            done: s.doneTitle,
            cancelled: s.cancelledTitle,
        };
        const trail = [...this.stack, this.screen].map((id) => names[id]);
        return { screen: this.screen, rows, foot: [...foot], trail };
    }
}
function longestLines(v) {
    return {
        row: Math.max(...v.rows.map((r) => r.length)),
        foot: Math.max(...v.foot.map((r) => r.length)),
    };
}
/* ------------------------------------------------------------------ */
/* 3. UI                                                               */
/* ------------------------------------------------------------------ */
const KEYPAD = [
    { key: "1", main: "1", sub: "∞", label: "1" },
    { key: "2", main: "2", sub: "abc", label: "2" },
    { key: "3", main: "3", sub: "def", label: "3" },
    { key: "4", main: "4", sub: "ghi", label: "4" },
    { key: "5", main: "5", sub: "jkl", label: "5" },
    { key: "6", main: "6", sub: "mno", label: "6" },
    { key: "7", main: "7", sub: "pqrs", label: "7" },
    { key: "8", main: "8", sub: "tuv", label: "8" },
    { key: "9", main: "9", sub: "wxyz", label: "9" },
    { key: "*", main: "*", sub: "+", label: "Star" },
    { key: "0", main: "0", sub: "␣", label: "0 (hold for Back)" },
    { key: "#", main: "#", sub: "↑↵", label: "Hash" },
];
const HOLD_MS = 600;
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
