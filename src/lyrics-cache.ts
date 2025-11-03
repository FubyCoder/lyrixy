import type { LyricsWithTimestamp } from "./sync.js";

export class LyricsCache {
    #capacity: number;
    #map = new Map<string, { data: LyricsWithTimestamp[]; lastAccess: Date }>();

    constructor(capacity: number) {
        this.#capacity = capacity;
    }

    #createKey(title: string, author: string) {
        return title + "||" + author;
    }

    get(title: string, author: string): LyricsWithTimestamp[] | undefined {
        const key = this.#createKey(title, author);
        const result = this.#map.get(key);

        if (result) {
            result.lastAccess = new Date();
            return result.data;
        }

        return undefined;
    }

    has(title: string, author: string): boolean {
        return this.#map.has(this.#createKey(title, author));
    }

    set(title: string, author: string, data: LyricsWithTimestamp[]) {
        this.#map.set(this.#createKey(title, author), { data: data, lastAccess: new Date() });
        this.#cleanup();
    }

    #cleanup() {
        if (this.#capacity >= this.#map.size) {
            return;
        }

        let worstKey: string | null = null;
        let worstAccess: Date | null = null;

        for (const [key, data] of this.#map.entries()) {
            if (worstAccess === null || data.lastAccess.getTime() < worstAccess.getTime()) {
                worstAccess = data.lastAccess;
                worstKey = key;
            }
        }

        if (worstKey) {
            this.#map.delete(worstKey);
        }
    }
}
