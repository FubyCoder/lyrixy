import type { LyricsWithTimestamp, SongInfo } from "./types/index.js";

export function classlistToggle(classList: DOMTokenList, className: string, state: boolean) {
    const has = classList.contains(className);

    if (state && !has) {
        classList.add(className);
    }

    if (!state && has) {
        classList.remove(className);
    }
}

export function subscribeMutation(element: HTMLElement, onChange: () => void) {
    const observer = new MutationObserver(onChange);
    const config = { attributes: true, childList: true, subtree: true };

    observer.observe(element, config);

    return () => {
        observer.disconnect();
    };
}

export async function waitForElement(check: () => boolean) {
    return new Promise<void>((res) => {
        function onChange() {
            if (check()) {
                observer.disconnect();
                return res();
            }
        }

        const observer = new MutationObserver(onChange);
        const config = { attributes: true, childList: true, subtree: true };

        observer.observe(document.body, config);
        onChange();
    });
}

export function getCurrentLyricRowIndex(lyricsWithTimestamp: LyricsWithTimestamp[], timestamp: number) {
    for (let i = 0; i < lyricsWithTimestamp.length; i++) {
        let row = lyricsWithTimestamp[i]!;

        if (row.timestamp > timestamp) {
            if (i === 0) {
                return 0;
            }

            return i - 1;
        }
    }

    return lyricsWithTimestamp.length - 1;
}

/**
 * An helper function that parses the lyrics and divides them in an array of object that returns the second of the track and the lyrics
 */
export function parseSongLyrics(syncedLyrics: NonNullable<SongInfo["syncedLyrics"]>): LyricsWithTimestamp[] {
    const lines = syncedLyrics.split("\n");
    // The result array has this object ({timestamp : number , lyrics : string})
    const results = new Array(lines.length);

    // NOTE the timestamp in the lyrics is in the following format [MM:ss.mm] where M = minutes , s = Seconds, m = milliseconds
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;

        const time = parseInt(line.slice(1, 3), 10) * 60 + parseInt(line.slice(4, 6), 10);
        const lyricsLine = line.slice(11);

        results[i] = { timestamp: time, lyrics: lyricsLine };
    }

    return results;
}
