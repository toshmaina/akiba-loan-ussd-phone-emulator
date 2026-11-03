import { screenLabel } from "../session/describe.js";
export class DataTableUI {
    constructor(rootEl, toggleBtn, closeBtn, logger) {
        this.rootEl = rootEl;
        this.toggleBtn = toggleBtn;
        this.closeBtn = closeBtn;
        this.logger = logger;
        this.isOpen = false;
        this.build();
    }
    build() {
        this.toggleBtn.addEventListener("click", () => this.setOpen(true));
        this.closeBtn.addEventListener("click", () => this.setOpen(false));
        this.logger.onChange(() => {
            if (this.isOpen && this.table) {
                this.table.ajax.reload(null, false);
            }
        });
    }
    setOpen(open) {
        this.rootEl.hidden = !open;
        this.isOpen = open;
        if (open) {
            if (!this.table) {
                this.initTable();
                this.bindFilters();
            }
            else {
                this.table.ajax.reload(null, false);
            }
        }
    }
    bindFilters() {
        const statusSelect = document.getElementById("filter-status");
        const langSelect = document.getElementById("filter-lang");
        statusSelect.addEventListener("change", () => {
            this.table.column(5).search(statusSelect.value).draw();
        });
        langSelect.addEventListener("change", () => {
            this.table.column(2).search(langSelect.value).draw();
        });
    }
    /**
     * Reads the current data and dynamically builds the filter options.
     * Preserves the user's active filter if the option still exists.
     */
    populateFilters(sessions) {
        const statusSelect = document.getElementById("filter-status");
        const langSelect = document.getElementById("filter-lang");
        if (!statusSelect || !langSelect)
            return;
        const currentStatus = statusSelect.value;
        const currentLang = langSelect.value;
        // Extract unique values and sort them
        const statuses = Array.from(new Set(sessions.map((s) => s.status))).sort();
        const langs = Array.from(new Set(sessions.map((s) => s.lang))).sort();
        const rebuild = (select, values, currentValue, columnIndex, labelFn) => {
            select.innerHTML = '<option value="">All</option>';
            values.forEach((val) => {
                const opt = document.createElement("option");
                opt.value = val;
                opt.textContent = labelFn ? labelFn(val) : val.charAt(0).toUpperCase() + val.slice(1);
                select.appendChild(opt);
            });
            if (values.includes(currentValue)) {
                select.value = currentValue; // Restore previous selection
            }
            else {
                select.value = ""; // Fallback to "All"
                // If the previously selected filter is gone (e.g., all active sessions ended),
                // clear the table's search for that column.
                if (currentValue !== "" && this.table) {
                    this.table.column(columnIndex).search("").draw();
                }
            }
        };
        rebuild(statusSelect, statuses, currentStatus, 5);
        rebuild(langSelect, langs, currentLang, 2, (v) => v === "en" ? "English" : v === "sw" ? "Kiswahili" : v);
    }
    initTable() {
        this.table = new DataTable("#sessions-table", {
            ajax: (data, callback, settings) => {
                this.logger.listSessions().then((sessions) => {
                    // Populate the dropdowns with the latest data before rendering
                    this.populateFilters(sessions);
                    callback({ data: sessions });
                }).catch((err) => {
                    console.error("Failed to load sessions", err);
                    callback({ data: [] });
                });
            },
            columns: [
                { data: "id" },
                { data: "phone" },
                {
                    data: "lang",
                    render: (data) => data === "en" ? "English" : "Kiswahili"
                },
                { data: "dialCode" },
                {
                    data: "startedAt",
                    render: (data) => new Date(data).toLocaleString([], { hour12: false })
                },
                {
                    data: "status",
                    render: (data) => `<span class="status-pill status-${data}">${data}</span>`
                },
                { data: "eventCount" },
                {
                    data: "lastScreenId",
                    render: (data) => screenLabel(data)
                }
            ],
            order: [[4, "desc"]],
            pageLength: 10,
            responsive: true,
            searching: true,
        });
    }
}
