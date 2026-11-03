import { KEYPAD } from "../constants/index.js";
import { createElement } from "./dom.js";
import { bindHoldKey } from "./holdKey.js";
const FLASH_MS = 110;
/** Briefly show a key as pressed (used for physical-keyboard input). */
export function flashButton(button) {
    button.classList.add("is-down");
    window.setTimeout(() => button.classList.remove("is-down"), FLASH_MS);
}
/** The 12-key keypad: 0-9, * and #. */
export class Keypad {
    constructor(send) {
        this.buttons = new Map();
        this.root = createElement("div", "keypad");
        for (const def of KEYPAD) {
            const suffix = def.key === "*" ? "star" : def.key === "#" ? "hash" : def.key;
            const button = createElement("button", `key key-${suffix}`);
            button.type = "button";
            button.setAttribute("aria-label", def.label);
            button.appendChild(createElement("span", "key-main", def.main));
            button.appendChild(createElement("span", "key-sub", def.sub));
            if (def.key === "0")
                bindHoldKey(button, send);
            else
                button.addEventListener("click", () => send({ key: def.key }));
            this.buttons.set(def.key, button);
            this.root.appendChild(button);
        }
    }
    flash(key) {
        const button = this.buttons.get(key);
        if (button)
            flashButton(button);
    }
}
