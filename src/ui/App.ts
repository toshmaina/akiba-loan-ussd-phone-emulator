import type { Press, Mode } from "../types/index.js";
import { Handset } from "./Handset.js";
import { Inspector } from "./Inspector.js";
import { Controls } from "./Controls.js";
import { bindKeyboard } from "./keyboard.js";
import { defaultScale, effectiveScale } from "./scale.js";

/** Owns the handsets and routes every key press to all of them. */
export class App {
  private handsets: Handset[] = [];
  private mode: Mode = "en";
  private scale = defaultScale();
  private controls: Controls;

  constructor(private stage: HTMLElement, private inspector: Inspector) {
    this.controls = new Controls({
      onMode: (mode) => this.setMode(mode),
      onScale: (scale) => {
        this.scale = scale;
        this.applyScale();
      },
      onReset: () => this.rebuild(),
    });

    bindKeyboard(
      (press) => this.dispatch(press),
      (key) => this.handsets.forEach((h) => h.flash(key))
    );
    window.addEventListener("resize", () => this.applyScale());

    this.rebuild();
  }

  private setMode(next: Mode): void {
    const singleToSingle = next !== "both" && this.mode !== "both";
    this.mode = next;
    if (singleToSingle) {
      // Swap language in place and keep the session.
      this.handsets[0].emu.lang = next as "en" | "sw";
      this.handsets[0].update();
      this.inspector.update(this.handsets);
    } else {
      this.rebuild();
    }
  }

  private rebuild(): void {
    const send = (p: Press): void => this.dispatch(p);
    this.handsets =
      this.mode === "both"
        ? [new Handset("en", "English", send), new Handset("sw", "Kiswahili", send)]
        : [new Handset(this.mode, null, send)];

    this.stage.textContent = "";
    this.handsets.forEach((h) => this.stage.appendChild(h.root));
    this.applyScale();
    this.inspector.update(this.handsets);
  }

  /** Every handset on screen receives every key, so EN and SW stay in step. */
  private dispatch(press: Press): void {
    for (const h of this.handsets) {
      h.emu.press(press);
      h.update();
    }
    this.inspector.update(this.handsets);
  }

  private applyScale(): void {
    const value = effectiveScale(this.mode, this.scale, this.stage.clientWidth);
    document.documentElement.style.setProperty("--scale", String(value));
    this.controls.showScale(this.scale);
  }
}
