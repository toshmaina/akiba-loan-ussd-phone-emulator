import {Lang,Strings,KeyDef} from "../types/index"


/* ------------------------------------------------------------------ */
/* 1. Constants and copy                                               */
/* ------------------------------------------------------------------ */

const DIAL_CODE = "*144#";
const MY_NUMBER = "0712345678";
const START_BALANCE = 12500;
const MIN_AMOUNT = 10;

const MAX_ROW_CHARS = 22;
const MAX_FOOT_CHARS = 24;

const MAX_PHONE_DIGITS = 10;
const MAX_AMOUNT_DIGITS = 6;

const STR: Record<Lang, Strings> = {
  en: {
    appName: "Akiba SACCO",
    dialPrompt: "Dial service code",
    mainTitle: "Main Menu",
    mainOpt1: "1 Balance Enquiry",
    mainOpt2: "2 Withdraw Money",
    balanceTitle: "Account balance",
    withdrawTitle: "Withdraw Money",
    withdrawOpt1: "1 My Number",
    withdrawOpt2: "2 Other Number",
    myNumber: "My Number",
    otherNumber: "Other Number",
    enterPhone: "Enter phone number",
    amountLabel: "Amount (KES)",
    reviewTitle: "REVIEW WITHDRAWAL",
    to: "To:",
    confirmChoice: "1 Confirm  2 Cancel",
    doneTitle: "DEMO: COMPLETED",
    withdrawn: (a) => `KES ${a} withdrawn`,
    balanceLine: (a) => `Balance KES ${a}`,
    cancelledTitle: "Cancelled",
    cancelledBody: "Withdrawal not made",
    err: {
      unknownCode: "Unknown code",
      badChoice: "Invalid choice",
      badNumber: "Invalid number",
      badAmount: "Invalid amount",
      noFunds: "Insufficient funds",
    },
    foot: {
      dial: ["Call: Start", "*: Clear  End: Quit"],
      menu: ["#: Submit  0: Back", "*: Clear  End: Quit"],
      view: ["0: Back", "End: Quit"],
      input: ["#: Submit  *: Clear", "Hold 0: Back  End: Quit"],
      done: ["0: Main Menu", "End: Quit"],
    },
  },
  sw: {
    appName: "Akiba SACCO",
    dialPrompt: "Weka msimbo wa huduma",
    mainTitle: "Menyu Kuu",
    mainOpt1: "1 Angalia Salio",
    mainOpt2: "2 Toa Pesa",
    balanceTitle: "Salio la akaunti",
    withdrawTitle: "Toa Pesa",
    withdrawOpt1: "1 Namba Yangu",
    withdrawOpt2: "2 Namba Nyingine",
    myNumber: "Namba Yangu",
    otherNumber: "Namba Nyingine",
    enterPhone: "Weka namba ya simu",
    amountLabel: "Kiasi (KES)",
    reviewTitle: "HAKIKI UTOAJI",
    to: "Kwa:",
    confirmChoice: "1 Thibitisha 2 Ghairi",
    doneTitle: "DEMO: IMEKAMILIKA",
    withdrawn: (a) => `KES ${a} imetolewa`,
    balanceLine: (a) => `Salio KES ${a}`,
    cancelledTitle: "Imeghairiwa",
    cancelledBody: "Utoaji haujafanyika",
    err: {
      unknownCode: "Msimbo haujulikani",
      badChoice: "Chaguo si sahihi",
      badNumber: "Namba si sahihi",
      badAmount: "Kiasi si sahihi",
      noFunds: "Salio halitoshi",
    },
    foot: {
      dial: ["Call: Anza", "*: Futa  End: Toka"],
      menu: ["#: Tuma  0: Rudi", "*: Futa  End: Toka"],
      view: ["0: Rudi", "End: Toka"],
      input: ["#: Tuma  *: Futa", "Shika 0: Rudi End: Toka"],
      done: ["0: Menyu Kuu", "End: Toka"],
    },
  },
};

const fmt = (n: number): string => n.toLocaleString("en-US");

const KEYPAD: KeyDef[] = [
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

export {
  DIAL_CODE,
  Lang,
  MAX_AMOUNT_DIGITS,
  MAX_FOOT_CHARS,
  MAX_PHONE_DIGITS,
  MAX_ROW_CHARS,
  MIN_AMOUNT,
  MY_NUMBER,
  START_BALANCE,
  STR,
  fmt,
  HOLD_MS,
  KEYPAD
}
