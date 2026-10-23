type Lang = "en" | "sw";
type ScreenId =
  | "dial"
  | "main"
  | "balance"
  | "withdraw"
  | "phone"
  | "amount"
  | "confirm"
  | "done"
  | "cancelled";
type ErrKey = "unknownCode" | "badChoice" | "badNumber" | "badAmount" | "noFunds";
type KeyName =
  | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
  | "*" | "#" | "call" | "end";

interface Press {
  key: KeyName;
  hold?: boolean;
}

interface View {
  screen: ScreenId;
  rows: string[];
  foot: string[];
  trail: string[];
}

interface Strings {
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
  err: Record<ErrKey, string>;
  foot: {
    dial: [string, string];
    menu: [string, string];
    view: [string, string];
    input: [string, string];
    done: [string, string];
  };
}
interface Withdrawal {
  target: "self" | "other";
  phone: string;
  amount: number;
}

interface KeyDef {
  key: KeyName;
  main: string;
  sub: string;
  label: string;
}

type Mode = "en" | "sw" | "both";

export {
  ScreenId,
  Lang,
  Press,
  ErrKey,
  KeyName,
  View,
  Strings,
  Withdrawal,
  KeyDef,
  Mode
}
