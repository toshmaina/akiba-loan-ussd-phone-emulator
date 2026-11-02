import type { Mode } from "../types/index.js";

export interface ControlHandlers {
  onMode(mode: Mode): void;
  onScale(scale: number): void;
  onTimeout(seconds: number): void;
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
    document.querySelectorAll<HTMLInputElement>('input[name="timeout"]').forEach((input) => {
      input.addEventListener("change", () => handlers.onTimeout(parseInt(input.value, 10)));
    });
    document.getElementById("reset")?.addEventListener("click", () => handlers.onReset());
  }

  showTimeout(seconds: number): void {
    const input = document.querySelector<HTMLInputElement>(
      `input[name="timeout"][value="${seconds}"]`
    );
    if (input) input.checked = true;
  }

  /** Reflect the chosen scale in the radio group. */
  showScale(scale: number): void {
    const input = document.querySelector<HTMLInputElement>(
      `input[name="scale"][value="${scale}"]`
    );
    if (input) input.checked = true;
  }
}
