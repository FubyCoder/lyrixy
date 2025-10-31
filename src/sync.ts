import type { SongInfo } from "./lrclib.js";
import type { LyricsWithTimestamp } from "./utils.js";

export function getLyricsRowIndexFromTimestamp(lyrics: LyricsWithTimestamp[], timestamp: number) {
    if (lyrics.length === 0) {
        return 0;
    }

    const first = lyrics[0]!;
    if (timestamp <= first.timestamp) {
        return 0;
    }

    for (let i = 1; i < lyrics.length; i++) {
        if (lyrics[i]!.timestamp > timestamp) {
            return i - 1;
        }
    }

    return lyrics.length - 1;
}

/**
 * An helper function that parses the lyrics and divides them in an array of object that returns the ms of the track and the lyrics
 */
export function parseSongLyrics(syncedLyrics: NonNullable<SongInfo["syncedLyrics"]>): LyricsWithTimestamp[] {
    const lines = syncedLyrics.split("\n");
    // The result array has this object ({timestamp : number , lyrics : string})
    const results = new Array(lines.length);

    // NOTE the timestamp in the lyrics is in the following format [MM:ss.mm] where M = minutes , s = Seconds, m = milliseconds
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;

        const time =
            (parseInt(line.slice(1, 3), 10) * 60 + parseInt(line.slice(4, 6), 10)) * 1000 + parseInt(line.slice(7, 9));
        const lyricsLine = line.slice(11);

        results[i] = { timestamp: time, lyrics: lyricsLine };
    }

    return results;
}
