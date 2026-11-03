import { App } from "./ui/App.js";
import { Inspector } from "./ui/Inspector.js";
import { LogDrawer } from "./ui/LogDrawer.js";
import { DataTableUI } from "./ui/DataTable.js";
import { SessionLogger } from "./session/sessionLogger.js";
import { createStore } from "./session/createStore.js";
function boot() {
    const stage = document.getElementById("devices");
    const trail = document.getElementById("trail");
    const fit = document.getElementById("fit");
    const session = document.getElementById("session");
    const drawer = document.getElementById("log-drawer");
    const toggle = document.getElementById("log-toggle");
    const count = document.getElementById("log-count");
    // Data Table elements
    const tableView = document.getElementById("data-table-view");
    const tableToggle = document.getElementById("data-table-toggle");
    const tableClose = document.getElementById("close-table");
    if (!(stage && trail && fit && session && drawer && toggle && count && tableView && tableToggle && tableClose))
        return;
    const logger = new SessionLogger(createStore());
    // Initialize UI components
    new LogDrawer(drawer, toggle, count, logger);
    new DataTableUI(tableView, tableToggle, tableClose, logger);
    // Initialize the main app
    new App(stage, new Inspector(trail, fit, session), logger);
}
if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot);
else
    boot();
