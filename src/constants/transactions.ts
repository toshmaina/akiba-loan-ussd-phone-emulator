import type { Strings, Transaction } from "../types/index.js";
import { MAX_ROW_CHARS } from "./index.js";

/** How many transactions fit on one statement page (the display cannot scroll). */
export const STATEMENT_PAGE_SIZE = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Account history a new session starts with, newest first. */
const SEED: ReadonlyArray<{ daysAgo: number; kind: Transaction["kind"]; amount: number }> = [
  { daysAgo: 1, kind: "withdrawal", amount: 500 },
  { daysAgo: 3, kind: "withdrawal", amount: 1000 },
  { daysAgo: 6, kind: "deposit", amount: 5000 },
  { daysAgo: 9, kind: "withdrawal", amount: 3000 },
  { daysAgo: 14, kind: "deposit", amount: 2500 },
  { daysAgo: 20, kind: "withdrawal", amount: 1500 },
  { daysAgo: 27, kind: "deposit", amount: 4000 },
];

/** Recent history for a fresh session, dated relative to now. */
export function seedTransactions(now: number = Date.now()): Transaction[] {
  return SEED.map((t) => ({ at: now - t.daysAgo * DAY_MS, kind: t.kind, amount: t.amount }));
}

export function pageCount(total: number): number {
  return Math.max(1, Math.ceil(total / STATEMENT_PAGE_SIZE));
}

const two = (n: number): string => String(n).padStart(2, "0");

/** "28/10 Withdraw        -500": date and type left, signed amount right. */
export function formatTransaction(s: Strings, t: Transaction): string {
  const d = new Date(t.at);
  const label = t.kind === "deposit" ? s.txDeposit : s.txWithdraw;
  const left = `${two(d.getDate())}/${two(d.getMonth() + 1)} ${label}`;
  const amount = `${t.kind === "deposit" ? "+" : "-"}${t.amount.toLocaleString("en-US")}`;
  const gap = Math.max(1, MAX_ROW_CHARS - left.length - amount.length);
  return left + " ".repeat(gap) + amount;
}

/** The four content lines for one statement page: a title, then up to three transactions. */
export function statementRows(s: Strings, transactions: Transaction[], page: number): string[] {
  const pages = pageCount(transactions.length);
  const rows = [s.statementTitle(page + 1, pages)];
  if (transactions.length === 0) rows.push(s.noTransactions);
  const start = page * STATEMENT_PAGE_SIZE;
  for (const t of transactions.slice(start, start + STATEMENT_PAGE_SIZE)) {
    rows.push(formatTransaction(s, t));
  }
  while (rows.length < 4) rows.push("");
  return rows;
}
