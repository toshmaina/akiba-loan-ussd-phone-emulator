export const DIAL_CODE = "*144#";
export const MY_NUMBER = "0712345678";
export const START_BALANCE = 12500;
export const MIN_AMOUNT = 10;
/** Monospace columns that fit the 148px text area (10px body, 9px footer, ~0.6em per glyph). */
export const MAX_ROW_CHARS = 24;
export const MAX_FOOT_CHARS = 27;
/** Idle time before the network ends a USSD session. 0 disables the timeout. */
export const SESSION_TIMEOUT_OPTIONS_S = [0, 15, 30, 60];
export const DEFAULT_SESSION_TIMEOUT_S = 30;
export const MAX_PHONE_DIGITS = 10;
export const MAX_AMOUNT_DIGITS = 6;
export const STR = {
    en: {
        appName: "Akiba SACCO",
        dialPrompt: "Dial service code",
        mainTitle: "Main Menu",
        mainOpt1: "1 Balance Enquiry",
        mainOpt2: "2 Withdraw Money",
        mainOpt3: "3 Mini Statement",
        statementName: "Mini Statement",
        statementTitle: (p, n) => `Mini Statement ${p}/${n}`,
        txDeposit: "Deposit",
        txWithdraw: "Withdraw",
        noTransactions: "No transactions",
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
        expiredTitle: "Session expired",
        expiredBody: "Please dial *144# again",
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
            pager: ["#: Next  *: Prev", "0: Back  End: Quit"],
            expired: ["Press any key", ""],
        },
    },
    sw: {
        appName: "Akiba SACCO",
        dialPrompt: "Weka msimbo wa huduma",
        mainTitle: "Menyu Kuu",
        mainOpt1: "1 Angalia Salio",
        mainOpt2: "2 Toa Pesa",
        mainOpt3: "3 Taarifa Fupi",
        statementName: "Taarifa Fupi",
        statementTitle: (p, n) => `Taarifa Fupi ${p}/${n}`,
        txDeposit: "Amana",
        txWithdraw: "Toa",
        noTransactions: "Hakuna miamala",
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
        expiredTitle: "Kipindi kimeisha",
        expiredBody: "Piga *144# tena",
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
            expired: ["Bonyeza kitufe chochote", ""],
            pager: ["#: Mbele  *: Nyuma", "0: Rudi  End: Toka"],
        },
    },
};
export const fmt = (n) => n.toLocaleString("en-US");
export const KEYPAD = [
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
export const HOLD_MS = 600;
