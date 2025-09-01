import type { LyricsWithTimestamp } from "./types/index.js";

export class SongCache {
    // Using a array should be faster if we cache the index in the map for faster lookups
    #cache = new Map();
    #cache_last_usage = new Map();
    #capacity;

    constructor(capacity: number = 50) {
        this.#capacity = capacity;
    }

    #create_key(track_name: string, artist_name: string) {
        return track_name + "||" + artist_name;
    }

    get(track_name: string, artist_name: string): LyricsWithTimestamp[] | null {
        const key = this.#create_key(track_name, artist_name);
        this.#cache_last_usage.set(key, Date.now);
        return this.#cache.get(key);
    }

    set(track_name: string, artist_name: string, lyrics: LyricsWithTimestamp[]) {
        const key = this.#create_key(track_name, artist_name);
        this.#cache_last_usage.set(key, Date.now);
        return this.#cache.set(key, lyrics);
    }

    has(track_name: string, artist_name: string) {
        const key = this.#create_key(track_name, artist_name);
        return this.#cache.has(key);
    }

    cleaup() {
        if (this.#cache_last_usage.size < this.#capacity) {
            return;
        }

        let lastItem = null;
        let lastItemTimestamp = Infinity;

        for (const [key, entry] of this.#cache_last_usage.entries()) {
            if (lastItemTimestamp > entry) {
                lastItemTimestamp = entry;
                lastItem = key;
            }
        }

        // Shouldnt happen but better be sure
        if (lastItem !== null) {
            this.#cache.delete(lastItem);
            this.#cache_last_usage.delete(lastItem);
        }
    }
}
