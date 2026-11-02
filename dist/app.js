import { App } from "./ui/App.js";
import { Inspector } from "./ui/Inspector.js";
function boot() {
    const stage = document.getElementById("devices");
    const trail = document.getElementById("trail");
    const fit = document.getElementById("fit");
    if (stage && trail && fit)
        new App(stage, new Inspector(trail, fit));
}
if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot);
else
    boot();
