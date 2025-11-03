import type { LyricsWithTimestamp } from "./sync.js";

export interface Track {
    artist: string;
    name: string;
    duration: number;
    isAd: boolean;
}

export interface ExtensionState {
    // This indicates if the original application has lyrics (ex Spotify has official lyrics sometimes so we don't need to fetch from external providers)
    hasOfficialLyrics: boolean;
    // Index of the current lyric row
    currentLyricRow: number;
    // Lyrics from external providers
    lyrics: LyricsWithTimestamp[];
    // error/message to disply in /lyrics page when handled by the extension this can be an error message or an info message (like 'no lyrics for this song found')
    message: string;
    // Current Track playing in the music player
    track: Track | null;
    // Current track playback time
    playback: number;
    // This determines if the lyrics page has been opened by pressing the spotify lyric button
    isOfficialLyricPage: boolean;
}

export function createExtension(): ExtensionState {
    return {
        lyrics: [],
        hasOfficialLyrics: false,
        isOfficialLyricPage: false,
        currentLyricRow: 0,
        track: null,
        playback: 0,
        message: "",
    };
}
