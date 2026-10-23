# Akiba SACCO · Feature Phone Web Emulator

Zero runtime dependencies. Open `index.html` in a browser (no server needed).

- `index.html`, `styles.css` — structure and layout. Display is a fixed 160×128 px box.
- `src/app.ts` — all application logic (state machine, EN/SW copy, input handling).
- `dist/app.js` — compiled output, already built and committed.

Rebuild after editing TypeScript: `npm install && npm run build` (TypeScript is a dev-only tool).

## Behaviour
- Dial line opens pre-filled with `*144#`. Call starts the session. `*` on the pre-filled code starts a fresh entry.
- Menus: key a digit, `#` to submit, `0` for Back, `*` to clear, End to quit.
- Amount / phone screens: `0` is a digit; hold `0` (600 ms) for Back. Keyboard Backspace does the same.
- Confirm screen: `1` confirms and `2` cancels immediately (the kit screen has no room for an input line).
- Validation: phone must be 10 digits starting 07 or 01; amount KES 10 up to the balance (starts at 12,500).
- The display ignores pointer events; only keypad buttons (and the physical keyboard) drive it.
- Language: English, Kiswahili, or both handsets side by side (all keys go to both).
