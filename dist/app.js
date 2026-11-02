import { App } from "./ui/App.js";
import { Inspector } from "./ui/Inspector.js";
function boot() {
    const stage = document.getElementById("devices");
    const trail = document.getElementById("trail");
    const fit = document.getElementById("fit");
    const session = document.getElementById("session");
    if (stage && trail && fit && session)
        new App(stage, new Inspector(trail, fit, session));
}
if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot);
else
    boot();
