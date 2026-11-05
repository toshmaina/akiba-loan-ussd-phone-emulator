import type { ScreenId } from "../types/index.js";
import type { SessionEvent } from "../types/session.js";
import { STR } from "../constants/index.js";
import { SCREENS } from "../constants/screens.js";

/** A screen's human name, in English (the log is for staff, not the handset). */
export function screenLabel(id: ScreenId | null): string {
  return id === null ? "" : SCREENS[id].name(STR.en);
}

/** One line describing a step of the journey. */
export function describeEvent(e: SessionEvent): string {
  const from = screenLabel(e.screenId);
  const to = screenLabel(e.toScreenId);
  const value = e.value === "" ? "nothing" : `“${e.value}”`;

  switch (e.kind) {
    case "dial":
      return `Dialled ${e.value} → ${to}`;
    case "select":
      return `Chose ${value} on ${from} → ${to}`;
    case "input":
      return `Entered ${value} on ${from} → ${to}`;
    case "error":
      return `Rejected ${value} on ${from}: ${e.error ? STR.en.err[e.error] : "invalid"}`;
    case "page":
      return `Turned to the ${e.value === "prev" ? "previous" : "next"} page of ${from}`;
    case "back":
      return `Went back from ${from} to ${to}`;
    case "end":
      return `Pressed End on ${from}`;
    case "expire":
      return `Session timed out on ${from}`;
  }
}
