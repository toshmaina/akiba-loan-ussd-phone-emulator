/* ------------------------------------------------------------------ */
/* 1. Constants and copy                                               */
/* ------------------------------------------------------------------ */
const DIAL_CODE = "*144#";
const MY_NUMBER = "0712345678";
const START_BALANCE = 12500;
const MIN_AMOUNT = 10;
/** Monospace columns that fit the 148px text area (11px body, 10px footer). */
const MAX_ROW_CHARS = 22;
const MAX_FOOT_CHARS = 24;
const MAX_PHONE_DIGITS = 10;
const MAX_AMOUNT_DIGITS = 6;
const STR = {
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
const fmt = (n) => n.toLocaleString("en-US");
export { DIAL_CODE, MAX_AMOUNT_DIGITS, MAX_FOOT_CHARS, MAX_PHONE_DIGITS, MAX_ROW_CHARS, MIN_AMOUNT, MY_NUMBER, START_BALANCE, STR, fmt, };
