export const spotifyPlaybackWidgetQuery = "[data-testid='now-playing-widget']";
export const spotifyTrackNameQuery = "[data-testid='context-item-info-title']";
export const spotifyArtistNameQuery = "[data-testid='context-item-info-subtitles']";

export const spotifyLyricsButtonQuery = "[data-testid='lyrics-button']";
export const spotifyProgressInputQuery = "[data-testid='playback-progressbar'] input";
export const spotifyMainContainerQuery = ".main-view-container__scroll-node-child main";
export const spotifyLyricRowQuery = "[data-testid='fullscreen-lyric']";
const spotifyAdQuery = '[data-testid="ad-link"]';

export function getSpotifyTrackInfo(
    trackElement: HTMLElement,
    artistNameElement: HTMLElement,
    progressInputElement: HTMLInputElement,
) {
    const name = trackElement.innerText.trim();

    const artist = artistNameElement.innerText
        .split("\n")
        .map((item) => item.trim())
        .join("");

    // In ms
    const duration = +(progressInputElement.getAttribute("max") ?? "0");

    const isAd = trackElement.querySelector(spotifyAdQuery) !== null;

    return { name, artist, isAd, duration };
}

export function getSpotifyPlayback(progressInputElement: HTMLInputElement) {
    return +(progressInputElement.getAttribute("value") ?? "0");
}

export function updateSongPlaybackTime(inputElement: HTMLInputElement, timestamp: number) {
    // We need this abomination to update spotify's react
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
    setter.call(inputElement, timestamp.toString());

    inputElement.dispatchEvent(new Event("input", { bubbles: true }));
    inputElement.dispatchEvent(new Event("change", { bubbles: true }));
}
