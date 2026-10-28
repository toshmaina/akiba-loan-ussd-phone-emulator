import type { KeyName, Press } from "../types/index.js";

/** Translate a physical key event into a phone key press, or null if unmapped. */
export function keyEventToPress(e: KeyboardEvent): Press | null {
  if (/^[0-9]$/.test(e.key)) return { key: e.key as KeyName };
  switch (e.key) {
    case "*": return { key: "*" };
    case "#": return { key: "#" };
    case "Enter": return { key: "call" };
    case "Escape": return { key: "end" };
    case "Backspace": return { key: "0", hold: true }; // Back, like holding 0
    default: return null;
  }
}

/** Route physical keyboard input to the phone. */
export function bindKeyboard(
  onPress: (p: Press) => void,
  onFlash: (key: KeyName) => void
): void {
  window.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    // A focused on-screen key already reacts to Enter through its own click.
    if (e.key === "Enter" && e.target instanceof HTMLButtonElement) return;

    const press = keyEventToPress(e);
    if (!press) return;

    e.preventDefault();
    onFlash(press.key);
    onPress(press);
  });
}
