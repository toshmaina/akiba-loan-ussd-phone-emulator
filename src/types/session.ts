import type { ErrKey, Lang, ScreenId } from "./index.js";

/** What the user did. */
export type EventKind =
  | "dial"    // dialled the service code: starts the session
  | "select"  // chose a menu option
  | "input"   // submitted a value (phone number, amount)
  | "error"   // submitted something that was rejected
  | "back"    // went back a screen
  | "end"     // pressed End
  | "expire"; // the network timed the session out

/** Reported by the Emulator for a key press that did something worth logging. */
export interface JourneyEvent {
  kind: EventKind;
  /** The screen the value was entered on. */
  screenId: ScreenId;
  /** The screen it led to; null when the user stayed put (errors). */
  toScreenId: ScreenId | null;
  /** The digit chosen or the value submitted. Empty for back, end and expire. */
  value: string;
  /** Why the value was rejected, for kind "error". */
  error: ErrKey | null;
  /** True when this event closes the USSD session. */
  endsSession: boolean;
}

/**
 * How a session finished.
 */
export type SessionStatus = "active" | "ended" | "expired" | "abandoned";

/** One row per USSD session. */
export interface UssdSession {
  /** Unique: `<phone>-<start time, base 36>-<random>`. */
  id: string;
  /** The subscriber's number (the handset's MSISDN). */
  phone: string;
  /** Language the session started in. */
  lang: Lang;
  /** The code that was dialled. */
  dialCode: string;
  /** Epoch ms. */
  startedAt: number;
  /** Epoch ms; null while active. */
  endedAt: number | null;
  status: SessionStatus;
  /** Number of events logged so far. */
  eventCount: number;
  /** Where the journey currently is, or finished. */
  lastScreenId: ScreenId;
}

/** One row per logged action: the unit of the USSD journey. */
export interface SessionEvent {
  /** Unique: `<sessionId>#<seq, 4 digits>`. Sorts in journey order within a session. */
  id: string;
  sessionId: string;
  /** 1-based position in the journey. */
  seq: number;
  phone: string;
  kind: EventKind;
  /** The screen the value was entered on. */
  screenId: ScreenId;
  toScreenId: ScreenId | null;
  /** The value selected or entered. */
  value: string;
  error: ErrKey | null;
  /** Epoch ms when the value was inserted. */
  at: number;
}
