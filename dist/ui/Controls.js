/** Binds the side-panel radios and Reset button to callbacks. */
export class Controls {
    constructor(handlers) {
        var _a;
        document.querySelectorAll('input[name="mode"]').forEach((input) => {
            input.addEventListener("change", () => handlers.onMode(input.value));
        });
        document.querySelectorAll('input[name="scale"]').forEach((input) => {
            input.addEventListener("change", () => handlers.onScale(parseFloat(input.value)));
        });
        document.querySelectorAll('input[name="timeout"]').forEach((input) => {
            input.addEventListener("change", () => handlers.onTimeout(parseInt(input.value, 10)));
        });
        (_a = document.getElementById("reset")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", () => handlers.onReset());
    }
    showTimeout(seconds) {
        const input = document.querySelector(`input[name="timeout"][value="${seconds}"]`);
        if (input)
            input.checked = true;
    }
    /** Reflect the chosen scale in the radio group. */
    showScale(scale) {
        const input = document.querySelector(`input[name="scale"][value="${scale}"]`);
        if (input)
            input.checked = true;
    }
}
