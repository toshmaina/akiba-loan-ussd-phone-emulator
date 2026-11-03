import type { SessionEvent, UssdSession } from "../types/session.js";
import type { SessionLogger } from "../session/sessionLogger.js";
import { describeEvent, screenLabel } from "../session/describe.js";
import { createElement } from "./dom.js";

const time = (ms: number): string =>
  new Date(ms).toLocaleTimeString([], { hour12: false });

const dateTime = (ms: number): string =>
  new Date(ms).toLocaleString([], { hour12: false });

function duration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

/**
 * The USSD log viewer: a drawer with the list of sessions and, for the one
 * selected, its journey step by step. It stays live while the phone is used.
 */
export class LogDrawer {
  private listEl = createElement("ul", "log-sessions");
  private detailEl = createElement("div", "log-detail");
  private noteEl = createElement("p", "log-note");
  private selected: string | null = null;
  private pinned = false; // true once the user picked a session themselves
  private open = false;
  private token = 0;
  private previousFocus: HTMLElement | null = null;
  private closeBtn!: HTMLButtonElement;

  constructor(
    private root: HTMLElement,
    private toggle: HTMLButtonElement,
    private countEl: HTMLElement,
    private logger: SessionLogger
  ) {
    this.build();
    this.toggle.addEventListener("click", () => this.setOpen(!this.open));
    this.logger.onChange(() => void this.refresh());

    // Global keydown for Escape and Focus Trap
    document.addEventListener("keydown", (e) => this.handleKeyDown(e));

    void this.refresh();
  }

  private build(): void {
    const head = createElement("div", "log-head");
    head.appendChild(createElement("h2", "log-title", "USSD session log"));

    const clear = createElement("button", "log-btn", "Clear log");
    clear.type = "button";
    clear.addEventListener("click", () => {
      if (window.confirm("Delete all logged sessions?")) {
        this.pinned = false;
        this.selected = null;
        void this.logger.clear();
      }
    });

    this.closeBtn = createElement("button", "log-btn", "Close");
    this.closeBtn.type = "button";
    this.closeBtn.addEventListener("click", () => this.setOpen(false));

    head.append(clear, this.closeBtn);

    this.root.append(head, this.noteEl, this.listEl, this.detailEl);
  }

  private setOpen(open: boolean): void {
    this.open = open;
    this.root.hidden = !open;
    this.toggle.setAttribute("aria-expanded", String(open));

    if (open) {
      this.previousFocus = document.activeElement as HTMLElement;
      this.closeBtn.focus();
      void this.refresh();
    } else {
      this.previousFocus?.focus();
      this.previousFocus = null;
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.open) return;

    if (e.key === "Escape") {
      e.preventDefault();
      this.setOpen(false);
      return;
    }

    if (e.key === "Tab") {
      const focusable = this.root.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  private async refresh(): Promise<void> {
    const token = ++this.token;
    const sessions = await this.logger.listSessions();
    if (token !== this.token) return; // a newer refresh is already running

    this.countEl.textContent = sessions.length ? `(${sessions.length})` : "";
    if (!this.open) return;

    if (!sessions.some((s) => s.id === this.selected)) {
      this.selected = null;
      this.pinned = false;
    }
    if (!this.pinned) this.selected = sessions[0]?.id ?? null;

    const events = this.selected ? await this.logger.listEvents(this.selected) : [];
    if (token !== this.token) return;

    this.noteEl.textContent = this.logger.persistent
      ? "Saved in this browser (IndexedDB)."
      : "Not saved: IndexedDB is unavailable, so this log is lost on reload.";
    this.renderList(sessions);
    this.renderDetail(sessions.find((s) => s.id === this.selected) ?? null, events);
  }

  private renderList(sessions: UssdSession[]): void {
    this.listEl.textContent = "";
    if (sessions.length === 0) {
      this.listEl.appendChild(
        createElement("li", "log-empty", "No sessions yet. Dial *144# on the handset to start one.")
      );
      return;
    }
    for (const s of sessions) {
      const li = createElement("li");
      const btn = createElement("button", "log-session");
      btn.type = "button";
      if (s.id === this.selected) btn.setAttribute("aria-current", "true");
      btn.append(
        createElement("span", `log-pill log-${s.status}`, s.status),
        createElement("span", "log-session-time", dateTime(s.startedAt)),
        createElement("span", "log-session-meta", `${s.phone} · ${s.eventCount} step${s.eventCount === 1 ? "" : "s"}`)
      );
      btn.addEventListener("click", () => {
        this.selected = s.id;
        this.pinned = true;
        void this.refresh();
      });
      li.appendChild(btn);
      this.listEl.appendChild(li);
    }
  }

  private renderDetail(session: UssdSession | null, events: SessionEvent[]): void {
    this.detailEl.textContent = "";
    if (!session) return;

    const facts: Array<[string, string]> = [
      ["Session", session.id],
      ["Phone", session.phone],
      ["Language", session.lang === "en" ? "English" : "Kiswahili"],
      ["Started", dateTime(session.startedAt)],
      [
        "Status",
        session.endedAt
          ? `${session.status} after ${duration(session.endedAt - session.startedAt)}`
          : "active",
      ],
      ["Now on", screenLabel(session.lastScreenId)],
    ];
    const dl = createElement("dl", "log-facts");
    for (const [k, v] of facts) dl.append(createElement("dt", undefined, k), createElement("dd", undefined, v));
    this.detailEl.appendChild(dl);

    this.detailEl.appendChild(createElement("h3", "log-sub", "Journey"));
    const ol = createElement("ol", "log-journey");
    let prev = session.startedAt;
    for (const e of events) {
      const li = createElement("li", `log-step log-step-${e.kind}`);
      li.append(
        createElement("span", "log-step-time", time(e.at)),
        createElement("span", "log-step-delta", e.seq === 1 ? "start" : `+${duration(e.at - prev)}`),
        createElement("span", "log-step-text", describeEvent(e))
      );
      ol.appendChild(li);
      prev = e.at;
    }
    this.detailEl.appendChild(ol);
  }
}
