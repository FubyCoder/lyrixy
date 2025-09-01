import { LyricButton } from "./components/LyricButton.js";
import { LyricsModal } from "./components/LyricsModal.js";
import { SongCache } from "./SongCache.js";
import type { LyricsWithTimestamp, SongInfo } from "./types/index.js";
import { parse_song_lyrics, subscribe_mutation, waitForElement } from "./utils.js";

console.log("LyriXy starting...");

const API_BASE_URL = "https://lrclib.net";

const track_name_query = "[data-testid='context-item-info-title']";
const artist_name_query = "[data-testid='context-item-info-subtitles']";

const SONG_CACHE_CAPACITY = 50;
const songCache = new SongCache(SONG_CACHE_CAPACITY);

function inject_lyrics_button(button: LyricButton) {
    // TODO better null checks
    const og_btn = document.querySelector("[data-testid='control-button-npv']");
    og_btn!.parentNode!.insertBefore(button.getNode(), og_btn);
}

/**
 * @param track_name name of the song
 * @param artist_name name of the artist(s) of the song
 */
async function search_songs(track_name: string, artist_name: string): Promise<SongInfo[]> {
    const params = new URLSearchParams();
    params.set("track_name", track_name);
    params.set("artist_name", artist_name);

    // TODO add abort controller

    return await fetch(API_BASE_URL + "/api/search?" + params.toString()).then((res) => {
        if (!res.ok) {
            throw new Error("failed_to_fetch_song_info");
        }
        return res.json();
    });
}

function get_track_info() {
    // TODO better null checks here
    const track_name = document.querySelector<HTMLElement>(track_name_query)!.innerText!;
    const artist_name = document
        .querySelector<HTMLElement>(artist_name_query)!
        .innerText!.split("\n")
        .map((item) => item.trim())
        .join("");
    return { track_name, artist_name };
}

function get_playback_time_in_seconds(field: HTMLElement) {
    // TODO improve this function to extract values
    const time = field?.innerText ?? "";

    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    // 5 => 2 for minutes, 1 x ':' and 2 x seconds
    if (time.length <= 5) {
        const [m, s] = time.split(":").map(Number);
        minutes = m!;
        seconds = s!;
    } else {
        // Should never happen with songs but i don't trust artists
        const [h, m, s] = time.split(":").map(Number);
        hours = h!;
        minutes = m!;
        seconds = s!;
    }

    return hours * 60 * 60 + minutes * 60 + seconds;
}

async function init() {
    await waitForElement(() => {
        return document.querySelector(".main-view-container__scroll-node-child") !== null;
    });

    const lyricsModal = new LyricsModal();
    lyricsModal.inject();

    await waitForElement(() => {
        return document.querySelector("[data-testid='control-button-npv']") !== null;
    });

    const lyricsButton = new LyricButton(lyricsModal);
    inject_lyrics_button(lyricsButton);

    await waitForElement(() => {
        return document.querySelector(track_name_query) !== null && document.querySelector(artist_name_query) !== null;
    });

    await waitForElement(() => {
        return (
            document.querySelector("[data-testid='now-playing-widget']") !== null &&
            document.querySelector("[data-testid='progress-bar']") !== null &&
            document.querySelector("[data-testid='playback-position']") !== null
        );
    });

    const widget = document.querySelector<HTMLElement>("[data-testid='now-playing-widget']")!;
    const playback_time_trigger = document.querySelector<HTMLElement>("[data-testid='progress-bar']")!;
    const playback_time_field = document.querySelector<HTMLElement>("[data-testid='playback-position']")!;

    async function handleTrackName() {
        const { track_name, artist_name } = get_track_info();

        let lyrics: LyricsWithTimestamp[];

        if (songCache.has(track_name, artist_name)) {
            lyrics = songCache.get(track_name, artist_name)!;
        } else {
            const songs = await search_songs(track_name, artist_name);

            for (const song of songs) {
                if (song.syncedLyrics) {
                    const timed_lyrics = parse_song_lyrics(song.syncedLyrics);
                    songCache.set(track_name, artist_name, timed_lyrics);
                    lyrics = timed_lyrics;
                    break;
                }
            }
        }

        lyricsModal.updateState((old) => {
            old.lyrics = lyrics;
            old.current_row = 0;
        });
    }

    function handleTime() {
        const time = get_playback_time_in_seconds(playback_time_field);

        lyricsModal.updateCurrentRow(time);
        lyricsModal.render();
    }

    handleTrackName();
    subscribe_mutation(widget, () => handleTrackName());

    handleTime();
    subscribe_mutation(playback_time_trigger, () => handleTime());
}

init().catch((err) => console.error(err));
