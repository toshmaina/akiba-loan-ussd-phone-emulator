import type { Mode } from "../types/index.js";

export interface ControlHandlers {
  onMode(mode: Mode): void;
  onScale(scale: number): void;
  onReset(): void;
}

/** Binds the side-panel radios and Reset button to callbacks. */
export class Controls {
  constructor(handlers: ControlHandlers) {
    document.querySelectorAll<HTMLInputElement>('input[name="mode"]').forEach((input) => {
      input.addEventListener("change", () => handlers.onMode(input.value as Mode));
    });
    document.querySelectorAll<HTMLInputElement>('input[name="scale"]').forEach((input) => {
      input.addEventListener("change", () => handlers.onScale(parseFloat(input.value)));
    });
    document.getElementById("reset")?.addEventListener("click", () => handlers.onReset());
  }

  /** Reflect the chosen scale in the radio group. */
  showScale(scale: number): void {
    const input = document.querySelector<HTMLInputElement>(
      `input[name="scale"][value="${scale}"]`
    );
    if (input) input.checked = true;
  }
}
