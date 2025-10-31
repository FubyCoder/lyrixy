import type { Track } from "./extension.js";
import { parseSongLyrics } from "./sync.js";
import type { LyricsWithTimestamp } from "./utils.js";

export interface SongInfo {
    id: number;
    name: string;
    trackName: string;
    albumName: string;
    artistName: string;
    // in seconds
    duration: number;
    instrumental: boolean;
    plainLyrics: string;
    syncedLyrics: string | null;
}

/**
 * @param trackName name of the song
 * @param artistName name of the artist(s) of the song
 */
export async function searchSong(
    trackName: string,
    artistName: string,
    opts: { signal?: AbortSignal } = {},
): Promise<{ error: false; data: SongInfo[] } | { error: true; data: null; code: "ApiError" | "Abort" }> {
    const params = new URLSearchParams();
    params.set("track_name", trackName);
    params.set("artist_name", artistName);

    try {
        const result = await fetch("https://lrclib.net/api/search?" + params.toString(), {
            signal: opts.signal ?? null,
        });

        if (!result.ok) {
            return { error: true, data: null, code: "ApiError" };
        }

        const songs = await result.json();

        return { error: false, data: songs };
    } catch (err: any) {
        let code: "ApiError" | "Abort" = "ApiError";
        if (err?.name === "AbortError") {
            code = "Abort";
        }
        return { error: true, data: null, code: code };
    }
}

export function findBestLyrics(
    track: Track,
    songs: SongInfo[],
): { data: LyricsWithTimestamp[]; error: null } | { data: null; error: "Instrumental" | "NoLyrics" } {
    if (songs.length === 0) {
        return { error: "NoLyrics", data: null };
    }

    let isInstrumental = false;

    let bestCandidate: SongInfo | null = null;
    let bestScore: number = -Infinity;

    for (let song of songs) {
        if (song.instrumental) {
            isInstrumental = true;
        }

        if (!song.syncedLyrics) {
            continue;
        }

        const delta = Math.abs(song.duration * 1000 - track.duration);

        let score = -100 * delta;

        if (song.name === track.name) {
            score += 100;
        }

        if (song.artistName === track.artist) {
            score += 100;
        }

        if (song.name.includes(track.name)) {
            score = +50;
        }

        if (song.artistName.includes(track.artist)) {
            score += 50;
        }

        if (bestCandidate === null || score > bestScore) {
            bestScore = delta;
            bestCandidate = song;
        }
    }

    if (!bestCandidate && isInstrumental) {
        return { error: "Instrumental", data: null };
    }

    if (!bestCandidate) {
        return { error: "NoLyrics", data: null };
    }

    const lyrics = parseSongLyrics(bestCandidate.syncedLyrics!);

    return { data: lyrics, error: null };
}
