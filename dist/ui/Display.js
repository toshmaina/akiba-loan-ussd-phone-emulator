import { STR } from "../constants/index.js";
import { createElement } from "./dom.js";
/**
 * The 160x128 screen. Output only: it renders a View and can report whether
 * any line overflows. It never receives input.
 */
export class Display {
    constructor() {
        this.rows = [];
        this.foot = [];
        const screen = createElement("div", "screen");
        screen.setAttribute("role", "status");
        screen.setAttribute("aria-live", "polite");
        screen.setAttribute("aria-atomic", "true");
        screen.appendChild(createElement("div", "line title", STR.en.appName));
        screen.appendChild(createElement("div", "rule"));
        for (let i = 0; i < 4; i++) {
            const row = createElement("div", `line row row-${i}`);
            this.rows.push(row);
            screen.appendChild(row);
        }
        for (let i = 0; i < 2; i++) {
            const line = createElement("div", `line foot foot-${i}`);
            this.foot.push(line);
            screen.appendChild(line);
        }
        this.root = screen;
    }
    render(view) {
        view.rows.forEach((text, i) => (this.rows[i].textContent = text === "" ? "\u00a0" : text));
        view.foot.forEach((text, i) => (this.foot[i].textContent = text));
    }
    /** True when no line is wider than its box, measured in the browser. */
    fits() {
        const lines = this.root.querySelectorAll(".line");
        return Array.from(lines).every((n) => n.scrollWidth <= n.clientWidth);
    }
}
