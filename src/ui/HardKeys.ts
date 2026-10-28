import type { KeyName, Press } from "../types/index.js";
import { el } from "./dom.js";
import { flashButton } from "./Keypad.js";

type HardKeyName = "call" | "end";

/** The Call and End keys beside the navigation ring. */
export class HardKeys {
  readonly call: HTMLButtonElement;
  readonly end: HTMLButtonElement;

  constructor(send: (p: Press) => void) {
    this.call = this.build("call", "Call", send);
    this.end = this.build("end", "End", send);
  }

  private build(key: HardKeyName, label: string, send: (p: Press) => void): HTMLButtonElement {
    const button = el("button", `hard hard-${key}`);
    button.type = "button";
    button.setAttribute("aria-label", label);
    button.appendChild(el("span", "hard-icon"));
    button.appendChild(el("span", "hard-label", label));
    button.addEventListener("click", () => send({ key }));
    return button;
  }

  flash(key: KeyName): void {
    if (key === "call") flashButton(this.call);
    else if (key === "end") flashButton(this.end);
  }
}
