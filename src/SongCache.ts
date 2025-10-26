import type { LyricsWithTimestamp } from "./types/index.js";

export class SongCache {
    // Using a array should be faster if we cache the index in the map for faster lookups
    #cache = new Map();
    #cacheUsage = new Map();
    #capacity;

    constructor(capacity: number = 50) {
        this.#capacity = capacity;
    }

    #createKey(trackName: string, artistName: string) {
        return trackName + "||" + artistName;
    }

    get(trackName: string, artistName: string): LyricsWithTimestamp[] | null {
        const key = this.#createKey(trackName, artistName);
        this.#cacheUsage.set(key, Date.now);
        return this.#cache.get(key);
    }

    set(trackName: string, artistName: string, lyrics: LyricsWithTimestamp[]) {
        const key = this.#createKey(trackName, artistName);
        this.#cacheUsage.set(key, Date.now);
        this.#cache.set(key, lyrics);

        this.cleanup();
    }

    has(trackName: string, artistName: string) {
        const key = this.#createKey(trackName, artistName);
        return this.#cache.has(key);
    }

    cleanup() {
        if (this.#cacheUsage.size < this.#capacity) {
            return;
        }

        let lastItem = null;
        let lastItemTimestamp = Infinity;

        for (const [key, entry] of this.#cacheUsage.entries()) {
            if (lastItemTimestamp > entry) {
                lastItemTimestamp = entry;
                lastItem = key;
            }
        }

        // Shouldnt happen but better be sure
        if (lastItem !== null) {
            this.#cache.delete(lastItem);
            this.#cacheUsage.delete(lastItem);
        }
    }
}
