import type { KeyName, Press } from "../types/index.js";
import { KEYPAD } from "../constants/index.js";
import { el } from "./dom.js";
import { bindHoldKey } from "./holdKey.js";

const FLASH_MS = 110;

/** Briefly show a key as pressed (used for physical-keyboard input). */
export function flashButton(button: HTMLButtonElement): void {
  button.classList.add("is-down");
  window.setTimeout(() => button.classList.remove("is-down"), FLASH_MS);
}

/** The 12-key keypad: 0-9, * and #. */
export class Keypad {
  readonly root: HTMLElement;
  private buttons = new Map<KeyName, HTMLButtonElement>();

  constructor(send: (p: Press) => void) {
    this.root = el("div", "keypad");

    for (const def of KEYPAD) {
      const suffix = def.key === "*" ? "star" : def.key === "#" ? "hash" : def.key;
      const button = el("button", `key key-${suffix}`);
      button.type = "button";
      button.setAttribute("aria-label", def.label);
      button.appendChild(el("span", "key-main", def.main));
      button.appendChild(el("span", "key-sub", def.sub));

      if (def.key === "0") bindHoldKey(button, send);
      else button.addEventListener("click", () => send({ key: def.key }));

      this.buttons.set(def.key, button);
      this.root.appendChild(button);
    }
  }

  flash(key: KeyName): void {
    const button = this.buttons.get(key);
    if (button) flashButton(button);
  }
}
