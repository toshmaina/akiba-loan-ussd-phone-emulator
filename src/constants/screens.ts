/**
 * Every screen of the USSD app, in one place.
 *
 * To add a screen: add an entry below (and any new copy to STR in index.ts).
 * Its id, routing and rendering take effect everywhere; nothing else in the
 * emulator needs to change. Routes are type-checked: `next` and `prev` must
 * name screens that exist in this object.
 *
 *   input.kind   behaviour
 *   ----------   ---------------------------------------------------------
 *   dial         pre-filled code entry; Call submits
 *   menu         key a digit, # submits, 0 is Back
 *   field        free digits up to maxLength, # submits, hold 0 is Back
 *   view         read-only, 0 is Back
 *   any          a notice that any key dismisses
 */
import type { Context, ScreenDef } from "../types/index.js";
import {
  DIAL_CODE,
  MY_NUMBER,
  MIN_AMOUNT,
  MAX_PHONE_DIGITS,
  MAX_AMOUNT_DIGITS,
  fmt,
} from "./index.js";

/**
 * Infers the screen ids from the keys of the object and checks that every
 * `next` / `prev` route names one of them.
 */
function defineScreens<const T extends Record<string, ScreenDef>>(
  screens: T & Record<keyof T, ScreenDef<Extract<keyof T, string>>>
): T {
  return screens;
}

const prompt = (buffer: string): string => `> ${buffer}_`;

const startWithdrawal =
  (target: "self" | "other") =>
  (ctx: Context): void => {
    ctx.tx = { target, phone: target === "self" ? MY_NUMBER : "", amount: 0 };
  };

const DEFINITIONS = defineScreens({
  dial: {
    name: () => DIAL_CODE,
    session: false,
    initialBuffer: DIAL_CODE, // opens pre-filled, as in the design
    rows: ({ s, buffer }) => [s.dialPrompt, "", buffer || "_", ""],
    footer: "dial",
    prev: null,
    input: { kind: "dial", code: DIAL_CODE, maxLength: 12, next: "main" },
  },

  main: {
    name: (s) => s.mainTitle,
    session: true,
    rows: ({ s, buffer }) => [s.mainTitle, s.mainOpt1, s.mainOpt2, prompt(buffer)],
    footer: "menu",
    prev: "dial",
    input: { kind: "menu", options: { "1": "balance", "2": "withdraw" } },
  },

  balance: {
    name: (s) => s.balanceTitle,
    session: true,
    rows: ({ s, ctx }) => [s.balanceTitle, `KES ${fmt(ctx.balance)}`, "", MY_NUMBER],
    footer: "view",
    prev: "main",
    input: { kind: "view" },
  },

  withdraw: {
    name: (s) => s.withdrawTitle,
    session: true,
    rows: ({ s, buffer }) => [s.withdrawTitle, s.withdrawOpt1, s.withdrawOpt2, prompt(buffer)],
    footer: "menu",
    prev: "main",
    input: {
      kind: "menu",
      options: {
        "1": { to: "amount", effect: startWithdrawal("self") },
        "2": { to: "phone", effect: startWithdrawal("other") },
      },
    },
  },

  phone: {
    name: (s) => s.otherNumber,
    session: true,
    rows: ({ s, buffer }) => [s.otherNumber, s.enterPhone, "", prompt(buffer)],
    footer: "input",
    prev: "withdraw",
    input: {
      kind: "field",
      maxLength: MAX_PHONE_DIGITS,
      validate: (v) => (/^(07|01)\d{8}$/.test(v) ? null : "badNumber"),
      commit: (v, ctx) => {
        ctx.tx.phone = v;
      },
      next: "amount",
    },
  },

  amount: {
    name: (s) => s.amountLabel,
    session: true,
    rows: ({ s, ctx, buffer }) => [
      ctx.tx.target === "self" ? s.myNumber : s.otherNumber,
      ctx.tx.phone,
      s.amountLabel,
      prompt(buffer),
    ],
    footer: "input",
    // Back returns to wherever this withdrawal started.
    prev: (ctx) => (ctx.tx.target === "self" ? "withdraw" : "phone"),
    input: {
      kind: "field",
      maxLength: MAX_AMOUNT_DIGITS,
      validate: (v, ctx) => {
        const amount = parseInt(v, 10);
        if (!Number.isFinite(amount) || amount < MIN_AMOUNT) return "badAmount";
        return amount > ctx.balance ? "noFunds" : null;
      },
      commit: (v, ctx) => {
        ctx.tx.amount = parseInt(v, 10);
      },
      next: "confirm",
    },
  },

  confirm: {
    name: (s) => s.reviewTitle,
    session: true,
    rows: ({ s, ctx, buffer }) => [
      s.reviewTitle,
      `KES ${fmt(ctx.tx.amount)}`,
      `${s.to} ${ctx.tx.phone}`,
      buffer ? `${s.confirmChoice} ${buffer}` : s.confirmChoice,
    ],
    footer: "menu",
    prev: "amount",
    input: {
      kind: "menu",
      options: {
        "1": {
          to: "done",
          effect: (ctx) => {
            ctx.balance -= ctx.tx.amount;
          },
        },
        "2": "cancelled",
      },
    },
  },

  done: {
    name: (s) => s.doneTitle,
    session: true,
    rows: ({ s, ctx }) => [
      s.doneTitle,
      s.withdrawn(fmt(ctx.tx.amount)),
      `${s.to} ${ctx.tx.phone}`,
      s.balanceLine(fmt(ctx.balance)),
    ],
    footer: "done",
    prev: "main",
    input: { kind: "view" },
  },

  cancelled: {
    name: (s) => s.cancelledTitle,
    session: true,
    rows: ({ s }) => [s.cancelledTitle, s.cancelledBody, "", ""],
    footer: "done",
    prev: "main",
    input: { kind: "view" },
  },

  expired: {
    name: (s) => s.expiredTitle,
    session: false,
    rows: ({ s }) => [s.expiredTitle, s.expiredBody, "", ""],
    footer: "expired",
    prev: "dial",
    input: { kind: "any" },
  },
});

type Id = keyof typeof DEFINITIONS;

/** All screens, keyed by id. */
export const SCREENS: Record<Id, ScreenDef<Id>> = DEFINITIONS;

/** The idle screen the handset starts on and returns to when a session ends. */
export const START_SCREEN: Id = "dial";

/** Shown when the network ends a session after inactivity. */
export const EXPIRED_SCREEN: Id = "expired";
