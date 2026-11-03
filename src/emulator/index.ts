import type {
  Context,
  DialInput,
  ErrKey,
  FieldInput,
  Lang,
  MenuInput,
  Press,
  ScreenId,
  View,
} from "../types/index.js";
import type { EventKind, JourneyEvent } from "../types/session.js";
import { MY_NUMBER, START_BALANCE, STR } from "../constants/index.js";
import { EXPIRED_SCREEN, SCREENS, START_SCREEN } from "../constants/screens.js";

/** What a key press did, before the engine adds where it happened. */
interface Outcome {
  kind: EventKind;
  value: string;
  error?: ErrKey;
}

const BACK: Outcome = { kind: "back", value: "0" };

/**
 * Generic USSD engine. It knows nothing about individual screens: what each
 * screen shows, where it leads and how it validates input all come from SCREENS.
 *
 * press() and expire() return a JourneyEvent describing what happened, so a
 * logger can record the journey. The engine itself stores and times nothing.
 */
export class Emulator {
  lang: Lang;
  private screen: ScreenId = START_SCREEN;
  private buffer = SCREENS[START_SCREEN].initialBuffer ?? "";
  private error: ErrKey | null = null;
  /** Set while the session-expired notice is showing: where the user was. */
  private expiredFrom: ScreenId | null = null;
  private ctx: Context = {
    balance: START_BALANCE,
    tx: { target: "self", phone: MY_NUMBER, amount: 0 },
  };

  constructor(lang: Lang) {
    this.lang = lang;
  }

  get balance(): number {
    return this.ctx.balance;
  }

  /** True while a USSD session is open on the current screen. */
  get sessionActive(): boolean {
    return SCREENS[this.screen].session;
  }

  /**
   * The network ends the session after inactivity. The screen the user was on
   * stays in the trail; the next key press dismisses the notice.
   */
  expire(): JourneyEvent | null {
    if (!this.sessionActive) return null;
    const from = this.screen;
    this.expiredFrom = from;
    this.screen = EXPIRED_SCREEN;
    this.buffer = SCREENS[EXPIRED_SCREEN].initialBuffer ?? "";
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

  private goTo(id: ScreenId): void {
    this.screen = id;
    this.buffer = SCREENS[id].initialBuffer ?? "";
    this.expiredFrom = null;
  }

  private resolvePrev(id: ScreenId): ScreenId | null {
    const prev = SCREENS[id].prev;
    return typeof prev === "function" ? prev(this.ctx) : prev;
  }

  private back(): Outcome {
    const target = this.resolvePrev(this.screen);
    if (target === null) this.quit();
    else this.goTo(target);
    return BACK;
  }

  /** Back to an idle handset. Balance is kept; use a new Emulator to reset it. */
  private quit(): void {
    this.goTo(START_SCREEN);
    this.error = null;
  }

  private fail(error: ErrKey, value: string): Outcome {
    this.error = error;
    this.buffer = "";
    return { kind: "error", value, error };
  }

  /* ---------------- input ---------------- */

  /** Handle a key press. Returns what happened, or null if nothing loggable did. */
  press(p: Press): JourneyEvent | null {
    this.error = null;
    const from = this.screen;
    const wasActive = this.sessionActive;

    const outcome = this.handle(p, wasActive);
    if (!outcome) return null;

    return {
      kind: outcome.kind,
      screenId: from,
      toScreenId: outcome.kind === "error" ? null : this.screen,
      value: outcome.value,
      error: outcome.error ?? null,
      endsSession: wasActive && !this.sessionActive && outcome.kind !== "error",
    };
  }

  private handle(p: Press, wasActive: boolean): Outcome | null {
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
    }
  }

  private pressDial(p: Press, input: DialInput<ScreenId>): Outcome | null {
    if (p.key === "call") {
      const dialled = this.buffer;
      if (dialled !== input.code) return this.fail("unknownCode", dialled);
      this.goTo(input.next);
      return { kind: "dial", value: dialled };
    }
    if (p.key === "*" && this.buffer === input.code) {
      // First "*" on the pre-filled code clears it and starts a new entry.
      this.buffer = "*";
      return null;
    }
    if (p.key === "*" || p.key === "#" || /^[0-9]$/.test(p.key)) {
      if (this.buffer.length < input.maxLength) this.buffer += p.key;
    }
    return null;
  }

  private pressMenu(p: Press, input: MenuInput<ScreenId>): Outcome | null {
    if (p.key === "0") return this.back();
    if (p.key === "*") {
      this.buffer = "";
      return null;
    }
    if (/^[1-9]$/.test(p.key)) {
      this.buffer = p.key; // menus take a single digit
      return null;
    }
    if (p.key !== "#") return null;

    const choice = this.buffer;
    const option = input.options[choice];
    if (option === undefined) return this.fail("badChoice", choice);
    if (typeof option === "string") {
      this.goTo(option);
    } else {
      option.effect?.(this.ctx);
      this.goTo(option.to);
    }
    return { kind: "select", value: choice };
  }

  private pressField(p: Press, input: FieldInput<ScreenId>): Outcome | null {
    if (p.key === "0" && p.hold) return this.back();
    if (p.key === "*") {
      this.buffer = "";
      return null;
    }
    if (/^[0-9]$/.test(p.key)) {
      if (this.buffer.length < input.maxLength) this.buffer += p.key;
      return null;
    }
    if (p.key !== "#") return null;

    const value = this.buffer;
    const error = input.validate(value, this.ctx);
    if (error) return this.fail(error, value);
    input.commit(value, this.ctx);
    this.goTo(input.next);
    return { kind: "input", value };
  }

  /* ---------------- output ---------------- */

  /** Screens from the idle screen to here, found by following each screen's Back route. */
  private trailIds(): ScreenId[] {
    const chain: ScreenId[] = [];
    let cur: ScreenId | null = this.expiredFrom ?? this.screen;
    for (let guard = 0; cur !== null && guard < 20; guard++) {
      chain.unshift(cur);
      cur = this.resolvePrev(cur);
    }
    if (this.expiredFrom !== null) chain.push(this.screen);
    return chain;
  }

  /** Text for the current screen in the current language. */
  render(): View {
    const s = STR[this.lang];
    const def = SCREENS[this.screen];

    let rows = def.rows({ s, ctx: this.ctx, buffer: this.buffer });
    if (this.error) rows = [rows[0], rows[1], rows[2], `! ${s.err[this.error]}`];

    return {
      screen: this.screen,
      rows,
      foot: [...s.foot[def.footer]],
      trail: this.trailIds().map((id) => SCREENS[id].name(s)),
    };
  }
}
