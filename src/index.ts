import { LyricsModal } from "./components/LyricsModal.js";
import {
    artistNameQuery,
    getSongDurationElement,
    lyricsButtonQuery,
    playbackPositionQuery,
    playingWidgetQuery,
    progressBarQuery,
    spotifyMainSectionQuery,
    trackNameQuery,
} from "./config.js";
import { SongCache } from "./SongCache.js";
import type { LyricsWithTimestamp, SongInfo } from "./types/index.js";
import { parseSongLyrics, subscribeMutation, waitForElement } from "./utils.js";

const API_BASE_URL = "https://lrclib.net";

// Bottom middle section

const SONG_CACHE_CAPACITY = 50;
const songCache = new SongCache(SONG_CACHE_CAPACITY);

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
    const trackNameRootItem = document.querySelector<HTMLElement>(trackNameQuery)!;
    const trackName = trackNameRootItem.innerText;

    const isAd = trackNameRootItem.querySelector('[data-testid="ad-link"]') !== null;

    const artistName = document
        .querySelector<HTMLElement>(artistNameQuery)!
        .innerText!.split("\n")
        .map((item) => item.trim())
        .join("");

    const playbackDurationField = getSongDurationElement()!;

    const durationInMs = playbackDurationField.getAttribute("max");
    const duration = durationInMs === null ? null : +durationInMs / 1000;

    return { trackName, artistName, duration, isAd };
}

function getPlaybackTimeInSeconds(field: HTMLElement) {
    const time = field?.innerText ?? "";
    const [m, s] = time.split(":").map(Number);
    return (m ?? 0) * 60 + (s ?? 0);
}

function onLyricRowClick(inputElement: HTMLInputElement, timeInSeconds: number) {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
    setter.call(inputElement, (timeInSeconds * 1000).toString());

    inputElement.dispatchEvent(new Event("input", { bubbles: true }));
    inputElement.dispatchEvent(new Event("change", { bubbles: true }));
}

async function init() {
    await waitForElement(() => {
        return document.querySelector(spotifyMainSectionQuery) !== null;
    });

    await waitForElement(() => {
        return document.querySelector(trackNameQuery) !== null && document.querySelector(artistNameQuery) !== null;
    });

    await waitForElement(() => {
        return (
            document.querySelector(playingWidgetQuery) !== null &&
            document.querySelector(progressBarQuery) !== null &&
            document.querySelector(playbackPositionQuery) !== null &&
            getSongDurationElement() !== null
        );
    });

    const widget = document.querySelector<HTMLElement>(playingWidgetQuery)!;
    const playbackTimeTrigger = document.querySelector<HTMLElement>(progressBarQuery)!;
    const playbackTimeField = document.querySelector<HTMLElement>(playbackPositionQuery)!;

    const hiddenInput = document
        .querySelector('[data-testid="playback-progressbar"]')!
        .querySelector<HTMLInputElement>("input")!;

    let abortController: AbortController | null = null;

    const lyricsModal = new LyricsModal();

    lyricsModal.updateState((state) => {
        state.onLyricRowClick = (timestamp: number) => {
            onLyricRowClick(hiddenInput, timestamp);
        };
    });

    async function handleTrackName() {
        const { trackName, artistName, duration, isAd } = getTrackInfo();

        let lyrics: LyricsWithTimestamp[] = [];

        if (isAd) {
            lyricsModal.updateState((old) => {
                old.error = "Spotify Ad break...";
                old.lyrics = [];
                old.currentRow = 0;
            });
            return;
        }

        lyricsModal.updateState((old) => {
            old.error = "Loading lyrics...";
            old.lyrics = [];
            old.currentRow = 0;
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
                    old.currentRow = 0;
                });

                return;
            }

            if (result.data.length === 0) {
                lyricsModal.updateState((old) => {
                    old.error = "This song doesn't have any lyrics";
                    old.lyrics = [];
                    old.currentRow = 0;
                });
                return;
            }

            const songs = result.data;

            let bestCandidate: SongInfo | null = null;
            let bestDelta: number = Infinity;

            for (const song of songs) {
                if (!song.syncedLyrics) {
                    continue;
                }

                if (duration !== null) {
                    const delta = Math.abs(duration - song.duration);
                    if (bestCandidate === null || delta < bestDelta) {
                        bestDelta = delta;
                        bestCandidate = song;
                    }
                } else {
                    bestCandidate = song;
                    break;
                }
            }

            if (bestCandidate?.syncedLyrics) {
                const timedLyrics = parseSongLyrics(bestCandidate.syncedLyrics);
                songCache.set(trackName, artistName, timedLyrics);
                lyrics = timedLyrics;
            }

            if (!lyrics || lyrics.length === 0) {
                const song = songs[0];
                if (song?.instrumental) {
                    lyricsModal.updateState((old) => {
                        old.error = "This song doesn't have any lyrics";
                        old.lyrics = [];
                        old.currentRow = 0;
                    });
                }
            }
        }

        if (lyrics && lyrics.length > 0) {
            lyricsModal.updateState((old) => {
                old.error = null;
                old.lyrics = lyrics;
                old.currentRow = 0;
            });
        }
    }

    function handleTime() {
        const time = getPlaybackTimeInSeconds(playbackTimeField);

        lyricsModal.setCurrentRowFromTime(time);
        lyricsModal.render();
    }

    const mainSection = document.querySelector<HTMLDivElement>(spotifyMainSectionQuery)!;

    let unsubscribeTrackName: null | (() => void) = null;
    let unsubscribeTrackTime: null | (() => void) = null;

    function cleanup() {
        if (unsubscribeTrackName) {
            unsubscribeTrackName();
        }
        if (unsubscribeTrackTime) {
            unsubscribeTrackTime();
        }
    }

    const mainContainer = document.querySelector(".main-view-container__scroll-node-child")!;
    const spotifyLyricsSection = mainContainer.querySelector("main")!;

    const customLyricsSection = document.createElement("div");
    customLyricsSection.style.minHeight = "100%";
    customLyricsSection.style.display = "flex";
    customLyricsSection.append(lyricsModal.getNode());

    const lyricButton = document.querySelector<HTMLButtonElement>(lyricsButtonQuery)!;

    function onSpotifyPageChange(pathname: string) {
        if (pathname !== "/lyrics") {
            cleanup();
            customLyricsSection.remove();
            spotifyLyricsSection.style.removeProperty("display");
            return;
        }

        spotifyLyricsSection.style.display = "none";

        customLyricsSection.style.minHeight = "100%";
        customLyricsSection.style.display = "flex";
        mainContainer.append(customLyricsSection);

        const elements = document.querySelectorAll("[data-testid='fullscreen-lyric']");
        let shouldUpdateData = elements.length <= 0;

        function onWidgetChange() {
            if (lyricButton.disabled) {
                lyricButton.disabled = false;
                lyricButton.style.cursor = "pointer";
                lyricButton.addEventListener(
                    "click",
                    () => {
                        history.pushState({}, "", "/lyrics");
                    },
                    { once: true },
                );
            }

            if (window.location.pathname === "/lyrics") {
                // Why this ? Spotify Lyrics button is disabled in songs without lyrics this re-enables them and press the button for us if available allowing us to use the original lyrics from spotify when they exists
                lyricButton.disabled = false;
                lyricButton.style.removeProperty("cursor");
                const isActive = lyricButton.getAttribute("data-active") === "true";
                if (!isActive && lyricButton.disabled === undefined) {
                    lyricButton.click();
                }
            }

            const elements = document.querySelectorAll("[data-testid='fullscreen-lyric']");
            // Spotify has official lyrics
            if (elements.length > 0) {
                shouldUpdateData = false;
                spotifyLyricsSection.style.removeProperty("display");
                customLyricsSection.style.display = "none";

                mainContainer.scrollIntoView({ behavior: "instant", block: "start" });
                return;
            } else {
                shouldUpdateData = true;
                spotifyLyricsSection.style.display = "none";
                customLyricsSection.style.display = "flex";
            }
            handleTrackName();
        }

        function onTimeChange() {
            if (!shouldUpdateData) {
                return;
            }

            handleTime();
        }

        unsubscribeTrackName = subscribeMutation(widget, () => {
            onWidgetChange();
        });

        unsubscribeTrackTime = subscribeMutation(playbackTimeTrigger, () => {
            onTimeChange();
        });

        onWidgetChange();
        onTimeChange();
    }

    let lastPage = window.location.pathname;

    onSpotifyPageChange(lastPage);
    subscribeMutation(mainSection, () => {
        if (lastPage !== window.location.pathname) {
            lastPage = window.location.pathname;
            onSpotifyPageChange(lastPage);
        }
    });
}

init().catch((err) => console.error(err));
