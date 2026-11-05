import { MY_NUMBER, START_BALANCE, STR } from "../constants/index.js";
import { EXPIRED_SCREEN, SCREENS, START_SCREEN } from "../constants/screens.js";
import { seedTransactions } from "../constants/transactions.js";
const BACK = { kind: "back", value: "0" };
/**
 * Generic USSD engine. It knows nothing about individual screens: what each
 * screen shows, where it leads and how it validates input all come from SCREENS.
 *
 * press() and expire() return a JourneyEvent describing what happened, so a
 * logger can record the journey. The engine itself stores and times nothing.
 */
export class Emulator {
    constructor(lang) {
        var _a;
        this.screen = START_SCREEN;
        this.buffer = (_a = SCREENS[START_SCREEN].initialBuffer) !== null && _a !== void 0 ? _a : "";
        this.error = null;
        this.page = 0;
        /** Set while the session-expired notice is showing: where the user was. */
        this.expiredFrom = null;
        this.ctx = {
            balance: START_BALANCE,
            tx: { target: "self", phone: MY_NUMBER, amount: 0 },
            transactions: seedTransactions(),
        };
        this.lang = lang;
    }
    get balance() {
        return this.ctx.balance;
    }
    /** True while a USSD session is open on the current screen. */
    get sessionActive() {
        return SCREENS[this.screen].session;
    }
    /**
     * The network ends the session after inactivity. The screen the user was on
     * stays in the trail; the next key press dismisses the notice.
     */
    expire() {
        var _a;
        if (!this.sessionActive)
            return null;
        const from = this.screen;
        this.expiredFrom = from;
        this.screen = EXPIRED_SCREEN;
        this.buffer = (_a = SCREENS[EXPIRED_SCREEN].initialBuffer) !== null && _a !== void 0 ? _a : "";
        this.error = null;
        return {
            kind: "expire",
            screenId: from,
            toScreenId: EXPIRED_SCREEN,
            value: "",
            error: null,
            endsSession: true,
        };
    }
    /* ---------------- navigation ---------------- */
    goTo(id) {
        var _a;
        this.screen = id;
        this.buffer = (_a = SCREENS[id].initialBuffer) !== null && _a !== void 0 ? _a : "";
        this.page = 0;
        this.expiredFrom = null;
    }
    resolvePrev(id) {
        const prev = SCREENS[id].prev;
        return typeof prev === "function" ? prev(this.ctx) : prev;
    }
    back() {
        const target = this.resolvePrev(this.screen);
        if (target === null)
            this.quit();
        else
            this.goTo(target);
        return BACK;
    }
    /** Back to an idle handset. Balance is kept; use a new Emulator to reset it. */
    quit() {
        this.goTo(START_SCREEN);
        this.error = null;
    }
    fail(error, value) {
        this.error = error;
        this.buffer = "";
        return { kind: "error", value, error };
    }
    /* ---------------- input ---------------- */
    /** Handle a key press. Returns what happened, or null if nothing loggable did. */
    press(p) {
        var _a;
        this.error = null;
        const from = this.screen;
        const wasActive = this.sessionActive;
        const outcome = this.handle(p, wasActive);
        if (!outcome)
            return null;
        return {
            kind: outcome.kind,
            screenId: from,
            toScreenId: outcome.kind === "error" ? null : this.screen,
            value: outcome.value,
            error: (_a = outcome.error) !== null && _a !== void 0 ? _a : null,
            endsSession: wasActive && !this.sessionActive && outcome.kind !== "error",
        };
    }
    handle(p, wasActive) {
        if (p.key === "end") {
            this.quit();
            return wasActive ? { kind: "end", value: "" } : null;
        }
        const input = SCREENS[this.screen].input;
        switch (input.kind) {
            case "dial":
                return this.pressDial(p, input);
            case "menu":
                return this.pressMenu(p, input);
            case "field":
                return this.pressField(p, input);
            case "view":
                return p.key === "0" ? this.back() : null;
            case "any":
                return this.back();
            case "pager":
                return this.pressPager(p, input);
        }
    }
    pressPager(p, input) {
        if (p.key === "0")
            return this.back();
        const pages = input.pages(this.ctx);
        if (p.key === "#" && this.page < pages - 1) {
            this.page++;
            return { kind: "page", value: "next" };
        }
        if (p.key === "*" && this.page > 0) {
            this.page--;
            return { kind: "page", value: "prev" };
        }
        return null;
    }
    pressDial(p, input) {
        if (p.key === "call") {
            const dialled = this.buffer;
            if (dialled !== input.code)
                return this.fail("unknownCode", dialled);
            this.goTo(input.next);
            return { kind: "dial", value: dialled };
        }
        if (p.key === "*" && this.buffer === input.code) {
            // First "*" on the pre-filled code clears it and starts a new entry.
            this.buffer = "*";
            return null;
        }
        if (p.key === "*" || p.key === "#" || /^[0-9]$/.test(p.key)) {
            if (this.buffer.length < input.maxLength)
                this.buffer += p.key;
        }
        return null;
    }
    pressMenu(p, input) {
        var _a;
        if (p.key === "0")
            return this.back();
        if (p.key === "*") {
            this.buffer = "";
            return null;
        }
        if (/^[1-9]$/.test(p.key)) {
            this.buffer = p.key; // menus take a single digit
            return null;
        }
        if (p.key !== "#")
            return null;
        const choice = this.buffer;
        const option = input.options[choice];
        if (option === undefined)
            return this.fail("badChoice", choice);
        if (typeof option === "string") {
            this.goTo(option);
        }
        else {
            (_a = option.effect) === null || _a === void 0 ? void 0 : _a.call(option, this.ctx);
            this.goTo(option.to);
        }
        return { kind: "select", value: choice };
    }
    pressField(p, input) {
        if (p.key === "0" && p.hold)
            return this.back();
        if (p.key === "*") {
            this.buffer = "";
            return null;
        }
        if (/^[0-9]$/.test(p.key)) {
            if (this.buffer.length < input.maxLength)
                this.buffer += p.key;
            return null;
        }
        if (p.key !== "#")
            return null;
        const value = this.buffer;
        const error = input.validate(value, this.ctx);
        if (error)
            return this.fail(error, value);
        input.commit(value, this.ctx);
        this.goTo(input.next);
        return { kind: "input", value };
    }
    /* ---------------- output ---------------- */
    /** Screens from the idle screen to here, found by following each screen's Back route. */
    trailIds() {
        var _a;
        const chain = [];
        let cur = (_a = this.expiredFrom) !== null && _a !== void 0 ? _a : this.screen;
        for (let guard = 0; cur !== null && guard < 20; guard++) {
            chain.unshift(cur);
            cur = this.resolvePrev(cur);
        }
        if (this.expiredFrom !== null)
            chain.push(this.screen);
        return chain;
    }
    /** Text for the current screen in the current language. */
    render() {
        var _a;
        const s = STR[this.lang];
        const def = SCREENS[this.screen];
        let rows = def.rows({ s, ctx: this.ctx, buffer: this.buffer, page: this.page });
        if (this.error) {
            rows = [...rows];
            rows[(_a = def.errorRow) !== null && _a !== void 0 ? _a : 3] = `! ${s.err[this.error]}`;
        }
        return {
            screen: this.screen,
            rows,
            foot: [...s.foot[def.footer]],
            trail: this.trailIds().map((id) => SCREENS[id].name(s)),
        };
    }
}
