import { MAX_ROW_CHARS, MAX_FOOT_CHARS } from "../constants/index.js";
function longestLines(v) {
    return {
        row: Math.max(...v.rows.map((r) => r.length)),
        foot: Math.max(...v.foot.map((r) => r.length)),
    };
}
/** Side panel readouts: the path taken so far and whether text fits the display. */
export class Inspector {
    constructor(trailEl, fitEl, sessionEl) {
        this.trailEl = trailEl;
        this.fitEl = fitEl;
        this.sessionEl = sessionEl;
    }
    setSession(text) {
        this.sessionEl.textContent = text;
    }
    update(handsets) {
        this.trailEl.textContent = handsets[0].view.trail.join("  ›  ");
        const fits = handsets.every((h) => h.fitsDisplay());
        const worst = handsets.reduce((acc, h) => {
            const l = longestLines(h.view);
            return { row: Math.max(acc.row, l.row), foot: Math.max(acc.foot, l.foot) };
        }, { row: 0, foot: 0 });
        this.fitEl.textContent =
            `${fits ? "Fits 160×128" : "Overflows 160×128"} · ` +
                `longest line ${worst.row}/${MAX_ROW_CHARS}, footer ${worst.foot}/${MAX_FOOT_CHARS}`;
        this.fitEl.dataset.ok = String(fits && worst.row <= MAX_ROW_CHARS && worst.foot <= MAX_FOOT_CHARS);
    }
}
