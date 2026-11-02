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
import { MY_NUMBER, START_BALANCE, STR } from "../constants/index.js";
import { EXPIRED_SCREEN, SCREENS, START_SCREEN } from "../constants/screens.js";

/**
 * Generic USSD engine. It knows nothing about individual screens: what each
 * screen shows, where it leads and how it validates input all come from SCREENS.
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
  expire(): void {
    if (!this.sessionActive) return;
    this.expiredFrom = this.screen;
    this.screen = EXPIRED_SCREEN;
    this.buffer = SCREENS[EXPIRED_SCREEN].initialBuffer ?? "";
    this.error = null;
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

  private back(): void {
    const target = this.resolvePrev(this.screen);
    if (target === null) this.quit();
    else this.goTo(target);
  }

  /** Back to an idle handset. Balance is kept; use a new Emulator to reset it. */
  private quit(): void {
    this.goTo(START_SCREEN);
    this.error = null;
  }

  private fail(e: ErrKey): void {
    this.error = e;
    this.buffer = "";
  }

  /* ---------------- input ---------------- */

  press(p: Press): void {
    this.error = null;
    if (p.key === "end") return this.quit();

    const input = SCREENS[this.screen].input;
    switch (input.kind) {
      case "dial":
        return this.pressDial(p, input);
      case "menu":
        return this.pressMenu(p, input);
      case "field":
        return this.pressField(p, input);
      case "view":
        if (p.key === "0") this.back();
        return;
      case "any":
        this.back();
        return;
    }
  }

  private pressDial(p: Press, input: DialInput<ScreenId>): void {
    if (p.key === "call") {
      if (this.buffer === input.code) this.goTo(input.next);
      else this.fail("unknownCode");
      return;
    }
    if (p.key === "*" && this.buffer === input.code) {
      // First "*" on the pre-filled code clears it and starts a new entry.
      this.buffer = "*";
      return;
    }
    if (p.key === "*" || p.key === "#" || /^[0-9]$/.test(p.key)) {
      if (this.buffer.length < input.maxLength) this.buffer += p.key;
    }
  }

  private pressMenu(p: Press, input: MenuInput<ScreenId>): void {
    if (p.key === "0") return this.back();
    if (p.key === "*") {
      this.buffer = "";
      return;
    }
    if (/^[1-9]$/.test(p.key)) {
      this.buffer = p.key; // menus take a single digit
      return;
    }
    if (p.key !== "#") return;

    const option = input.options[this.buffer];
    if (option === undefined) return this.fail("badChoice");
    if (typeof option === "string") return this.goTo(option);
    option.effect?.(this.ctx);
    this.goTo(option.to);
  }

  private pressField(p: Press, input: FieldInput<ScreenId>): void {
    if (p.key === "0" && p.hold) return this.back();
    if (p.key === "*") {
      this.buffer = "";
      return;
    }
    if (/^[0-9]$/.test(p.key)) {
      if (this.buffer.length < input.maxLength) this.buffer += p.key;
      return;
    }
    if (p.key !== "#") return;

    const error = input.validate(this.buffer, this.ctx);
    if (error) return this.fail(error);
    input.commit(this.buffer, this.ctx);
    this.goTo(input.next);
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
