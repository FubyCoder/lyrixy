import { LyricButton } from "./components/LyricButton.js";
import { LyricsModal } from "./components/LyricsModal.js";
import {
    artistNameQuery,
    iconBarQuery,
    playbackPositionQuery,
    playingWidgetQuery,
    progressBarQuery,
    spotifyMainSectionQuery,
    trackNameQuery,
} from "./config.js";
import { SongCache } from "./SongCache.js";
import type { LyricsWithTimestamp, SongInfo } from "./types/index.js";
import { parseSongLyrics, subscribeMutation, waitForElement } from "./utils.js";

console.log("LyriXy starting...");

const API_BASE_URL = "https://lrclib.net";

// Bottom middle section

const SONG_CACHE_CAPACITY = 50;
const songCache = new SongCache(SONG_CACHE_CAPACITY);

function injectLyricsButton(button: LyricButton) {
    // TODO better null checks
    const og_btn = document.querySelector(iconBarQuery);
    og_btn!.parentNode!.insertBefore(button.getNode(), og_btn);
}

/**
 * @param trackName name of the song
 * @param artistName name of the artist(s) of the song
 */
async function searchSong(
    trackName: string,
    artistName: string,
    opts: { signal?: AbortSignal } = {},
): Promise<{ error: false; data: SongInfo[] } | { error: true; data: null; code: "ApiError" | "Abort" }> {
    const params = new URLSearchParams();
    params.set("track_name", trackName);
    params.set("artist_name", artistName);

    try {
        const result = await fetch(API_BASE_URL + "/api/search?" + params.toString(), { signal: opts.signal ?? null });

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

function getTrackInfo() {
    // TODO better null checks here
    const trackName = document.querySelector<HTMLElement>(trackNameQuery)!.innerText!;
    const artistName = document
        .querySelector<HTMLElement>(artistNameQuery)!
        .innerText!.split("\n")
        .map((item) => item.trim())
        .join("");
    return { trackName, artistName };
}

function getPlaybackTimeInSeconds(field: HTMLElement) {
    const time = field?.innerText ?? "";
    const [m, s] = time.split(":").map(Number);
    return (m ?? 0) * 60 + (s ?? 0);
}

async function init() {
    await waitForElement(() => {
        return document.querySelector(spotifyMainSectionQuery) !== null;
    });

    const lyricsModal = new LyricsModal();
    lyricsModal.inject();

    await waitForElement(() => {
        return document.querySelector(iconBarQuery) !== null;
    });

    const lyricsButton = new LyricButton(lyricsModal);
    injectLyricsButton(lyricsButton);

    await waitForElement(() => {
        return document.querySelector(trackNameQuery) !== null && document.querySelector(artistNameQuery) !== null;
    });

    await waitForElement(() => {
        return (
            document.querySelector(playingWidgetQuery) !== null &&
            document.querySelector(progressBarQuery) !== null &&
            document.querySelector(playbackPositionQuery) !== null
        );
    });

    const widget = document.querySelector<HTMLElement>(playingWidgetQuery)!;
    const playback_time_trigger = document.querySelector<HTMLElement>(progressBarQuery)!;
    const playback_time_field = document.querySelector<HTMLElement>(playbackPositionQuery)!;

    let abortController: AbortController | null = null;

    async function handleTrackName() {
        const { trackName, artistName } = getTrackInfo();

        let lyrics: LyricsWithTimestamp[] = [];
        lyricsModal.updateState((old) => {
            old.error = "Loading lyrics...";
            old.lyrics = [];
            old.current_row = 0;
        });

        if (songCache.has(trackName, artistName)) {
            lyrics = songCache.get(trackName, artistName)!;
        } else {
            if (abortController) {
                abortController.abort();
                abortController = null;
            }

            abortController = new AbortController();
            const result = await searchSong(trackName, artistName, { signal: abortController.signal });
            abortController = null;

            if (result.error) {
                lyricsModal.updateState((old) => {
                    if (result.code !== "Abort") {
                        old.error = "Failed to load song lyrics";
                    }
                    old.lyrics = [];
                    old.current_row = 0;
                });

                return;
            }

            if (result.data.length === 0) {
                lyricsModal.updateState((old) => {
                    old.error = "This song doesn't have any lyrics";
                    old.lyrics = [];
                    old.current_row = 0;
                });
                return;
            }

            const songs = result.data;
            for (const song of songs) {
                if (song.syncedLyrics) {
                    const timed_lyrics = parseSongLyrics(song.syncedLyrics);
                    songCache.set(trackName, artistName, timed_lyrics);
                    lyrics = timed_lyrics;
                    break;
                }
            }

            if (!lyrics || lyrics.length === 0) {
                const song = songs[0];
                if (song?.instrumental) {
                    lyricsModal.updateState((old) => {
                        old.error = "This song doesn't have any lyrics";
                        old.lyrics = [];
                        old.current_row = 0;
                    });
                }
            }
        }

        if (lyrics && lyrics.length > 0) {
            lyricsModal.updateState((old) => {
                old.error = null;
                old.lyrics = lyrics;
                old.current_row = 0;
            });
        }
    }

    function handleTime() {
        const time = getPlaybackTimeInSeconds(playback_time_field);

        lyricsModal.setCurrentRowFromTime(time);
        lyricsModal.render();
    }

    handleTrackName();
    subscribeMutation(widget, () => handleTrackName());

    handleTime();
    subscribeMutation(playback_time_trigger, () => handleTime());
}

init().catch((err) => console.error(err));
