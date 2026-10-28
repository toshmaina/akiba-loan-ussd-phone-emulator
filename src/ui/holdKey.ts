import type { Press } from "../types/index.js";
import { HOLD_MS } from "../constants/index.js";

/**
 * Make a button report a normal press on a tap and a `hold` press when it is
 * kept down for HOLD_MS. Used for the 0 key, which is a digit on input
 * screens and Back when held.
 */
export function bindHoldKey(
  button: HTMLButtonElement,
  send: (p: Press) => void
): void {
  let timer: number | undefined;
  let held = false;

  const clear = (): void => {
    if (timer !== undefined) window.clearTimeout(timer);
    timer = undefined;
  };
  const cancel = (): void => {
    clear();
    button.classList.remove("is-hold");
  };

  button.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    held = false;
    clear();
    timer = window.setTimeout(() => {
      held = true;
      button.classList.add("is-hold");
      send({ key: "0", hold: true });
    }, HOLD_MS);
  });

  button.addEventListener("pointerup", () => {
    const wasPending = timer !== undefined;
    cancel();
    if (wasPending && !held) send({ key: "0" });
  });

  button.addEventListener("pointerleave", cancel);
  button.addEventListener("pointercancel", cancel);
  button.addEventListener("contextmenu", (e) => e.preventDefault());

  // Keyboard activation (Enter/Space on a focused key) arrives as click with detail 0.
  button.addEventListener("click", (e) => {
    if (e.detail === 0) send({ key: "0" });
  });
}
