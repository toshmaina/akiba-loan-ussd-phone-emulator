import type { SessionStore } from "./store.js";
import { MemoryStore } from "./store.js";
import { IndexedDbStore } from "./indexedDBStore.js";

/** IndexedDB when the browser has it, otherwise memory. */
export function createStore(): SessionStore {
  return typeof indexedDB !== "undefined" ? new IndexedDbStore() : new MemoryStore();
}
