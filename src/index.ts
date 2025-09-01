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
async function searchSong(trackName: string, artistName: string): Promise<SongInfo[]> {
    const params = new URLSearchParams();
    params.set("track_name", trackName);
    params.set("artist_name", artistName);

    // TODO add abort controller

    return await fetch(API_BASE_URL + "/api/search?" + params.toString()).then((res) => {
        if (!res.ok) {
            throw new Error("failed_to_fetch_song_info");
        }
        return res.json();
    });
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

    async function handleTrackName() {
        const { trackName, artistName } = getTrackInfo();

        let lyrics: LyricsWithTimestamp[];

        if (songCache.has(trackName, artistName)) {
            lyrics = songCache.get(trackName, artistName)!;
        } else {
            const songs = await searchSong(trackName, artistName);

            for (const song of songs) {
                if (song.syncedLyrics) {
                    const timed_lyrics = parseSongLyrics(song.syncedLyrics);
                    songCache.set(trackName, artistName, timed_lyrics);
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
