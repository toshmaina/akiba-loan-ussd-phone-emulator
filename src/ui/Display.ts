import type { View } from "../types/index.js";
import { STR } from "../constants/index.js";
import { el } from "./dom.js";

/**
 * The 160x128 screen. Output only: it renders a View and can report whether
 * any line overflows. It never receives input.
 */
export class Display {
  readonly root: HTMLElement;
  private rows: HTMLElement[] = [];
  private foot: HTMLElement[] = [];

  constructor() {
    const screen = el("div", "screen");
    screen.setAttribute("role", "status");
    screen.setAttribute("aria-live", "polite");
    screen.setAttribute("aria-atomic", "true");

    screen.appendChild(el("div", "line title", STR.en.appName));
    screen.appendChild(el("div", "rule"));

    for (let i = 0; i < 4; i++) {
      const row = el("div", `line row row-${i}`);
      this.rows.push(row);
      screen.appendChild(row);
    }
    for (let i = 0; i < 2; i++) {
      const line = el("div", `line foot foot-${i}`);
      this.foot.push(line);
      screen.appendChild(line);
    }
    this.root = screen;
  }

  render(view: View): void {
    view.rows.forEach((text, i) => (this.rows[i].textContent = text === "" ? "\u00a0" : text));
    view.foot.forEach((text, i) => (this.foot[i].textContent = text));
  }

  /** True when no line is wider than its box, measured in the browser. */
  fits(): boolean {
    const lines = this.root.querySelectorAll<HTMLElement>(".line");
    return Array.from(lines).every((n) => n.scrollWidth <= n.clientWidth);
  }
}
