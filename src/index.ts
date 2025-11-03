import { createExtension, type Track } from "./extension.js";
import { findBestLyrics, searchSong } from "./lrclib.js";
import { LyricsCache } from "./lyrics-cache.js";
import {
    getSpotifyPlayback,
    getSpotifyTrackInfo,
    spotifyArtistNameQuery,
    spotifyLyricRowQuery,
    spotifyLyricsButtonQuery,
    spotifyMainContainerQuery,
    spotifyPlaybackWidgetQuery,
    spotifyProgressInputQuery,
    spotifyTrackNameQuery,
    updateSongPlaybackTime,
} from "./spotify.js";
import { getLyricsRowIndexFromTimestamp } from "./sync.js";
import { subscribeMutation, waitForElement } from "./utils.js";
import { LyricsView } from "./view.js";

const $ = document.querySelector.bind(document);

const lyricsCache = new LyricsCache(50);

async function init() {
    await waitForElement(() => {
        return (
            $(spotifyMainContainerQuery) !== null &&
            $(spotifyPlaybackWidgetQuery) !== null &&
            $(spotifyProgressInputQuery) !== null &&
            $(spotifyLyricsButtonQuery) !== null
        );
    });

    const playbackWidget = $<HTMLElement>(spotifyPlaybackWidgetQuery)!;
    const progressInputElement = $<HTMLInputElement>(spotifyProgressInputQuery)!;
    const lyricButton = $<HTMLInputElement>(spotifyLyricsButtonQuery)!;
    const mainSection = $<HTMLInputElement>(spotifyMainContainerQuery)!;

    const state = createExtension();

    function onRowClick(timestamp: number) {
        updateSongPlaybackTime(progressInputElement, timestamp);
    }

    const lyricsView = new LyricsView(onRowClick);

    async function onTrackChange(track: Track) {
        state.track = track;
        state.lyrics = [];
        state.message = "";
        state.currentLyricRow = 0;
        state.playback = 0;
        // On song change if we are in the /lyrics page we should check if the song has official lyrics

        if (window.location.pathname !== "/lyrics") {
            return;
        }

        (mainSection.parentNode as HTMLElement).scrollIntoView({ behavior: "instant", block: "start" });

        const lyricButton = $<HTMLInputElement>(spotifyLyricsButtonQuery)!;
        const isActive = lyricButton.getAttribute("data-active") == "true";

        // Why this ? We inject a custom screen in the main spotify container at the moment, i want to use the spotify lyrics when possible so this .click() enables that
        if (lyricButton.disabled === undefined && !isActive) {
            lyricButton.click();
        }

        if (state.isOfficialLyricPage) {
            // Check if the page has lyrics
            const lyricsRows = document.querySelectorAll(spotifyLyricRowQuery);
            state.hasOfficialLyrics = lyricsRows.length > 0;

            mainSection.style.removeProperty("display");
            lyricsView.destroy();
        }

        if (state.track.isAd) {
            state.lyrics = [];
            state.message = "Spotify Ad break...";
            lyricsView.setLyrics(state.lyrics);
            lyricsView.setMessage(state.message);
            lyricsView.setCurrentRow(0);
            return;
        }

        if (!state.hasOfficialLyrics) {
            mainSection.style.display = "none";
            mainSection.parentElement?.appendChild(lyricsView.getNode());
            lyricsView.setCurrentRow(0);

            const cacheResult = lyricsCache.get(track.name, track.artist);
            if (cacheResult) {
                state.lyrics = cacheResult;
                state.message = "";
            } else {
                state.lyrics = [];
                state.message = "Fetching lyrics...";
                lyricsView.setLyrics(state.lyrics);
                lyricsView.setMessage(state.message);
                lyricsView.setCurrentRow(0);

                const result = await searchSong(track.name, track.artist);

                if (!result.data) {
                    state.lyrics = [];
                    state.message = "An error occurred while fetching the lyrics :(";
                } else {
                    const res2 = findBestLyrics(track, result.data);

                    if (res2.error === "Instrumental") {
                        state.lyrics = [];
                        state.message = "This is an instrumental song enjoy!";
                    } else if (res2.error === "NoLyrics") {
                        state.lyrics = [];
                        state.message = "No lyrics found for this song :(";
                    }

                    if (res2.data) {
                        state.lyrics = res2.data;
                        state.message = "";
                        lyricsCache.set(track.name, track.artist, state.lyrics);
                    }
                }
            }

            lyricsView.setLyrics(state.lyrics);
            lyricsView.setMessage(state.message);
            lyricsView.setCurrentRow(0);
        }
    }

    function onPlaybackChange(time: number) {
        state.playback = time;
        state.currentLyricRow = 0;

        const index = getLyricsRowIndexFromTimestamp(state.lyrics, time);
        state.currentLyricRow = index;

        if (state.lyrics.length > 0) {
            lyricsView.setCurrentRow(index);
        }
    }

    function onWidgetChange() {
        const trackNameElement = $<HTMLElement>(spotifyTrackNameQuery)!;
        const artistNameElement = $<HTMLElement>(spotifyArtistNameQuery)!;

        const track = getSpotifyTrackInfo(trackNameElement, artistNameElement, progressInputElement);

        if (
            state.track != null &&
            state.track.artist === track.artist &&
            state.track.name === track.name &&
            state.track.duration === track.duration &&
            state.track.isAd === track.isAd
        ) {
            // Its the same thing bruh
            return;
        }

        onTrackChange(track);
    }

    function onProgressChange() {
        const pb = getSpotifyPlayback(progressInputElement);
        onPlaybackChange(pb);
    }

    function onLyricsButtonChange() {
        const lyricButton = $<HTMLInputElement>(spotifyLyricsButtonQuery)!;

        // If is active the page is handled by spotify
        const isActive = lyricButton.getAttribute("data-active") == "true";
        if (lyricButton.disabled) {
            lyricButton.disabled = false;
            lyricButton.style.cursor = "pointer!important";

            lyricButton.addEventListener("click", () => history.pushState({}, "", "/lyrics"), {
                once: true,
                passive: true,
            });
        }

        state.isOfficialLyricPage = isActive;
    }

    function onPageChange(pathname: string) {
        if (pathname !== "/lyrics") {
            // TODO: Usubscribe from things such as the official lyrics tracker
            mainSection.style.removeProperty("display");
            lyricsView.destroy();
            return;
        }

        onWidgetChange();
        onProgressChange();
        onLyricsButtonChange();

        mainSection.style.display = "none";
        mainSection.parentElement?.append(lyricsView.getNode());
    }

    let lastPathname = window.location.pathname;
    onWidgetChange();
    onProgressChange();
    onLyricsButtonChange();
    onPageChange(lastPathname);

    subscribeMutation(playbackWidget, onWidgetChange);
    subscribeMutation(progressInputElement, onProgressChange);
    subscribeMutation(lyricButton.parentNode! as HTMLElement, onLyricsButtonChange);
    subscribeMutation(mainSection, () => {
        if (lastPathname !== window.location.pathname) {
            lastPathname = window.location.pathname;
            onPageChange(window.location.pathname);
        }
    });
}

init();
