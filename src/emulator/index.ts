import type { Lang, ScreenId, ErrKey, Press, View, Withdrawal } from "../types/index.js";
import {
  DIAL_CODE, MY_NUMBER, START_BALANCE, MIN_AMOUNT,
  MAX_PHONE_DIGITS, MAX_AMOUNT_DIGITS, STR, fmt,
} from "../constants/index.js";

export class Emulator {
  lang: Lang;
  balance = START_BALANCE;
  private screen: ScreenId = "dial";
  private buffer = DIAL_CODE; // the dial screen opens pre-filled, as in the kit
  private stack: ScreenId[] = [];
  private error: ErrKey | null = null;
  private tx: Withdrawal = { target: "self", phone: MY_NUMBER, amount: 0 };

  constructor(lang: Lang) {
    this.lang = lang;
  }

  /** Back to an idle handset. Balance is kept; use a new Emulator to reset it. */
  private quit(): void {
    this.screen = "dial";
    this.buffer = DIAL_CODE;
    this.stack = [];
    this.error = null;
  }

  /** True while a USSD session is open (anything past the dial screen). */
  get sessionActive(): boolean {
    return this.screen !== "dial" && this.screen !== "expired";
  }

  /**
   * The network ends the session after inactivity. The screen the user was on
   * stays in the trail; the next key press returns the handset to idle.
   */
  expire(): void {
    if (!this.sessionActive) return;
    this.stack.push(this.screen);
    this.screen = "expired";
    this.buffer = "";
    this.error = null;
  }

  private go(next: ScreenId): void {
    this.stack.push(this.screen);
    this.screen = next;
    this.buffer = "";
  }

  private back(): void {
    const prev = this.stack.pop();
    if (prev === undefined || prev === "dial") {
      this.quit();
      return;
    }
    this.screen = prev;
    this.buffer = "";
  }

  private toMainMenu(): void {
    this.stack = ["dial"];
    this.screen = "main";
    this.buffer = "";
  }

  private fail(e: ErrKey): void {
    this.error = e;
    this.buffer = "";
  }

  press(p: Press): void {
    this.error = null;

    if (p.key === "end") return this.quit();

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
        if (p.key === "0") this.back();
        return;
      case "done":
      case "cancelled":
        if (p.key === "0") this.toMainMenu();
        return;
      case "expired":
        this.quit(); // any key closes the timed-out session
        return;
    }
  }

  private pressDial(p: Press): void {
    if (p.key === "call") {
      if (this.buffer === DIAL_CODE) this.toMainMenu();
      else this.fail("unknownCode");
      return;
    }
    if (p.key === "*" && this.buffer === DIAL_CODE) {
      // First "*" on the pre-filled code clears it and starts a new entry.
      this.buffer = "*";
      return;
    }
    if (p.key === "*" || p.key === "#" || /^[0-9]$/.test(p.key)) {
      if (this.buffer.length < 12) this.buffer += p.key;
    }
  }

  private pressMenu(p: Press): void {
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

    const choice = this.buffer;
    if (this.screen === "main") {
      if (choice === "1") this.go("balance");
      else if (choice === "2") this.go("withdraw");
      else this.fail("badChoice");
    } else {
      if (choice === "1") {
        this.tx = { target: "self", phone: MY_NUMBER, amount: 0 };
        this.go("amount");
      } else if (choice === "2") {
        this.tx = { target: "other", phone: "", amount: 0 };
        this.go("phone");
      } else {
        this.fail("badChoice");
      }
    }
  }

  private pressInput(p: Press): void {
    if (p.key === "0" && p.hold) return this.back();
    if (p.key === "*") {
      this.buffer = "";
      return;
    }
    if (/^[0-9]$/.test(p.key)) {
      const max = this.screen === "phone" ? MAX_PHONE_DIGITS : MAX_AMOUNT_DIGITS;
      if (this.buffer.length < max) this.buffer += p.key;
      return;
    }
    if (p.key !== "#") return;

    if (this.screen === "phone") {
      if (!/^(07|01)\d{8}$/.test(this.buffer)) return this.fail("badNumber");
      this.tx.phone = this.buffer;
      this.go("amount");
      return;
    }

    const amount = parseInt(this.buffer, 10);
    if (!Number.isFinite(amount) || amount < MIN_AMOUNT) return this.fail("badAmount");
    if (amount > this.balance) return this.fail("noFunds");
    this.tx.amount = amount;
    this.go("confirm");
  }

  private pressConfirm(p: Press): void {
    // Same input model as the menus: key 1 or 2, then # to submit (per the design).
    if (p.key === "0") return this.back();
    if (p.key === "*") {
      this.buffer = "";
      return;
    }
    if (/^[1-9]$/.test(p.key)) {
      this.buffer = p.key;
      return;
    }
    if (p.key !== "#") return;

    if (this.buffer === "1") {
      this.balance -= this.tx.amount;
      this.stack = ["dial", "main"];
      this.screen = "done";
      this.buffer = "";
    } else if (this.buffer === "2") {
      this.stack = ["dial", "main"];
      this.screen = "cancelled";
      this.buffer = "";
    } else {
      this.fail("badChoice");
    }
  }

  /** Text for the current screen in the current language. */
  render(): View {
    const s = STR[this.lang];
    const prompt = `> ${this.buffer}_`;
    let rows: string[];
    let foot: string[];

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
          this.buffer ? `${s.confirmChoice} ${this.buffer}` : s.confirmChoice,
        ];
        foot = s.foot.menu;
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
      case "expired":
        rows = [s.expiredTitle, s.expiredBody, "", ""];
        foot = s.foot.expired;
        break;
    }

    if (this.error) rows = [rows[0], rows[1], rows[2], `! ${s.err[this.error]}`];

    const names: Record<ScreenId, string> = {
      dial: DIAL_CODE,
      main: s.mainTitle,
      balance: s.balanceTitle,
      withdraw: s.withdrawTitle,
      phone: s.otherNumber,
      amount: s.amountLabel,
      confirm: s.reviewTitle,
      done: s.doneTitle,
      cancelled: s.cancelledTitle,
      expired: s.expiredTitle,
    };
    const trail = [...this.stack, this.screen].map((id) => names[id]);

    return { screen: this.screen, rows, foot: [...foot], trail };
  }
}

/** Longest content row and footer line in a view, in characters. */
