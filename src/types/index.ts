export interface LyricsWithTimestamp {
    // Timestamp in seconds
    timestamp: number;
    lyrics: string;
}

export interface SongInfo {
    id: number;
    name: string;
    trackName: string;
    albumName: string;
    duration: number;
    instrumental: boolean;
    plainLyrics: string;
    syncedLyrics: string | null;
}
