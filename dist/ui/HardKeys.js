import { createElement } from "./dom.js";
import { flashButton } from "./Keypad.js";
/** The Call and End keys beside the navigation ring. */
export class HardKeys {
    constructor(send) {
        this.call = this.build("call", "Call", send);
        this.end = this.build("end", "End", send);
    }
    build(key, label, send) {
        const button = createElement("button", `hard hard-${key}`);
        button.type = "button";
        button.setAttribute("aria-label", label);
        button.appendChild(createElement("span", "hard-icon"));
        button.appendChild(createElement("span", "hard-label", label));
        button.addEventListener("click", () => send({ key }));
        return button;
    }
    flash(key) {
        if (key === "call")
            flashButton(this.call);
        else if (key === "end")
            flashButton(this.end);
    }
}
