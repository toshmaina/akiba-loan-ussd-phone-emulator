export type Lang = "en" | "sw";
import type { SCREENS } from "../constants/screens.js";

/** Derived from the keys of SCREENS: add a screen there and it exists here. */
export type ScreenId = keyof typeof SCREENS;
export type ErrKey = "unknownCode" | "badChoice" | "badNumber" | "badAmount" | "noFunds";
export type KeyName =
  | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
  | "*" | "#" | "call" | "end";

export interface Press {
  key: KeyName;
  /** Long-press. Only meaningful for "0", where it means Back on input screens. */
  hold?: boolean;
}

export interface View {
  screen: ScreenId;
  /** Four content lines under the title rule. */
  rows: string[];
  /** Two footer lines (soft-key hints). */
  foot: string[];
  /** Breadcrumb of screens visited in this session. */
  trail: string[];
}

export interface Strings {
  appName: string;
  dialPrompt: string;
  mainTitle: string;
  mainOpt1: string;
  mainOpt2: string;
  balanceTitle: string;
  withdrawTitle: string;
  withdrawOpt1: string;
  withdrawOpt2: string;
  myNumber: string;
  otherNumber: string;
  enterPhone: string;
  amountLabel: string;
  reviewTitle: string;
  to: string;
  confirmChoice: string;
  doneTitle: string;
  withdrawn: (amount: string) => string;
  balanceLine: (amount: string) => string;
  cancelledTitle: string;
  cancelledBody: string;
  expiredTitle: string;
  expiredBody: string;
  err: Record<ErrKey, string>;
  foot: {
    dial: [string, string];
    menu: [string, string];
    view: [string, string];
    input: [string, string];
    done: [string, string];
    expired: [string, string];
  };
}


export interface Withdrawal {
  target: "self" | "other";
  phone: string;
  amount: number;
}


/** Which footer pair (soft-key hints) a screen shows. */
export type FooterKey = keyof Strings["foot"];

/** Session data that screens read, and that effects and commits write. */
export interface Context {
  balance: number;
  tx: Withdrawal;
}

/** Everything a screen needs to produce its four content lines. */
export interface RenderArgs {
  s: Strings;
  ctx: Context;
  buffer: string;
}

/** A forward route: just a screen, or a screen plus a side effect on the way. */
export type Next<Id extends string> =
  | Id
  | { to: Id; effect?: (ctx: Context) => void };

/** The pre-filled code entry (Call submits). */
export interface DialInput<Id extends string> {
  kind: "dial";
  code: string;
  maxLength: number;
  next: Id;
}

/** A numbered menu: key a digit, # submits, 0 is Back. */
export interface MenuInput<Id extends string> {
  kind: "menu";
  /** Digit typed -> where it leads. */
  options: Record<string, Next<Id>>;
}

/** A free digit field: # submits, hold 0 is Back. */
export interface FieldInput<Id extends string> {
  kind: "field";
  maxLength: number;
  validate: (value: string, ctx: Context) => ErrKey | null;
  commit: (value: string, ctx: Context) => void;
  next: Id;
}

/** A read-only screen: 0 is Back. */
export interface ViewInput {
  kind: "view";
}

/** A notice that any key dismisses (goes Back). */
export interface AnyKeyInput {
  kind: "any";
}

export type ScreenInput<Id extends string> =
  | DialInput<Id>
  | MenuInput<Id>
  | FieldInput<Id>
  | ViewInput
  | AnyKeyInput;

/** Everything the emulator needs to know about one screen. */
export interface ScreenDef<Id extends string = string> {
  /** Label used in the breadcrumb trail. */
  name: (s: Strings) => string;
  /** Whether a USSD session is open while this screen is showing. */
  session: boolean;
  /** What the input buffer holds when the screen opens. */
  initialBuffer?: string;
  /** The four content lines under the title. */
  rows: (a: RenderArgs) => string[];
  footer: FooterKey;
  /** Where Back goes. null leaves the session. */
  prev: Id | ((ctx: Context) => Id) | null;
  /** How the screen takes input and where it leads next. */
  input: ScreenInput<Id>;
}

export interface KeyDef {
  key: KeyName;
  main: string;
  sub: string;
  label: string;
}


export type Mode = "en" | "sw" | "both";
