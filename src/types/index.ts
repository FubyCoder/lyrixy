export interface LyricsWithTimestamp {
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
