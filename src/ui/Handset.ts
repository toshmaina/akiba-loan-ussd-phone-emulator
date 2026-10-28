import type { Lang, KeyName, Press, View } from "../types/index.js";
import { Emulator } from "../emulator/index.js";
import { el } from "./dom.js";
import { Display } from "./Display.js";
import { Keypad } from "./Keypad.js";
import { HardKeys } from "./HardKeys.js";

/**
 * One complete phone: casing, display, keys, and its own Emulator.
 * It wires the pieces together; the pieces know nothing about each other.
 */
export class Handset {
  readonly root: HTMLElement;
  readonly emu: Emulator;
  private display = new Display();
  private keypad: Keypad;
  private hardKeys: HardKeys;
  private lastView!: View;

  constructor(lang: Lang, caption: string | null, send: (p: Press) => void) {
    this.emu = new Emulator(lang);
    this.keypad = new Keypad(send);
    this.hardKeys = new HardKeys(send);

    this.root = el("figure", "phone");
    if (caption) this.root.appendChild(el("figcaption", "phone-caption", caption));

    const box = el("div", "phone-box");
    box.appendChild(this.buildHandset());
    this.root.appendChild(box);

    this.update();
  }

  private buildHandset(): HTMLElement {
    const handset = el("div", "handset");
    handset.appendChild(el("div", "shell"));

    const body = el("div", "body");
    body.appendChild(el("div", "speaker"));
    body.appendChild(el("div", "brand", "AKIBA SACCO"));
    handset.appendChild(body);

    handset.appendChild(this.display.root);

    // Decorative navigation ring and soft-key dashes. Not interactive.
    for (const cls of ["nav-ring", "soft soft-l", "soft soft-r"]) {
      const part = el("div", cls);
      part.setAttribute("aria-hidden", "true");
      handset.appendChild(part);
    }

    handset.appendChild(this.hardKeys.call);
    handset.appendChild(this.hardKeys.end);
    handset.appendChild(this.keypad.root);
    return handset;
  }

  /** Re-render the display from the emulator's current state. */
  update(): void {
    this.lastView = this.emu.render();
    this.display.render(this.lastView);
    this.root.dataset.screen = this.lastView.screen;
  }

  /** Flash the matching on-screen key. */
  flash(key: KeyName): void {
    this.keypad.flash(key);
    this.hardKeys.flash(key);
  }

  get view(): View {
    return this.lastView;
  }

  fitsDisplay(): boolean {
    return this.display.fits();
  }
}
