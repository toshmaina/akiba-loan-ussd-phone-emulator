export type Lang = "en" | "sw";
export type ScreenId =
  | "dial"
  | "main"
  | "balance"
  | "withdraw"
  | "phone"
  | "amount"
  | "confirm"
  | "done"
  | "cancelled"
  | "expired";
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


export interface KeyDef {
  key: KeyName;
  main: string;
  sub: string;
  label: string;
}


export type Mode = "en" | "sw" | "both";
