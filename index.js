console.log("LyriXy starting...");

const API_BASE_URL = "https://lrclib.net";

let widget = document.querySelector("[data-testid='now-playing-widget']");

const track_name_query = "[data-testid='context-item-info-title']";
const artist_name_query = "[data-testid='context-item-info-subtitles']";
let playback_time_trigger = document.querySelector("[data-testid='progress-bar']");
let playback_time_field = document.querySelector("[data-testid='playback-position']");

let last_track_name = null;
let last_artist_name = null;

let current_lyrics = null;

let display_lyrics = false;
let lyrics_modal = null;

/**
 *
 * @param {LyricsModal} lyricsModal
 */
function inject_lyrics_button(lyricsModal) {
    const og_btn = document.querySelector("[data-testid='control-button-npv']");

    const lyrics_btn = document.createElement("button");
    lyrics_btn.style.background = "transparent";
    lyrics_btn.style.border = "none";
    lyrics_btn.style.padding = "8px";
    lyrics_btn.style.display = "flex";
    lyrics_btn.style.alignContent = "center";

    // Lucide Icon License MIT & ISC : https://lucide.dev/license
    lyrics_btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mic-vocal-icon lucide-mic-vocal"><path d="m11 7.601-5.994 8.19a1 1 0 0 0 .1 1.298l.817.818a1 1 0 0 0 1.314.087L15.09 12"/><path d="M16.5 21.174C15.5 20.5 14.372 20 13 20c-2.058 0-3.928 2.356-6 2-2.072-.356-2.775-3.369-1.5-4.5"/><circle cx="16" cy="7" r="5"/></svg>`;

    lyrics_btn.addEventListener("click", () => {
        display_lyrics = !display_lyrics;
        if (display_lyrics) {
            lyricsModal.updateState((state) => {
                state.hidden = false;
            });
            lyrics_btn.style.color = "#1db954";
        } else {
            lyrics_btn.style.color = "#FFF";
            lyricsModal.updateState((state) => {
                state.hidden = true;
            });
        }
    });

    og_btn.parentNode.insertBefore(lyrics_btn, og_btn);
}

class LyricRow {
    /** @type { {kind : "next" | "current" | "passed", text : string } } */
    #state = {
        kind: "next",
        text: "",
    };

    /** @type {HTMLDivElement} */
    #node;

    constructor() {
        this.#node = document.createElement("div");
        this.#node.classList.add("lyric-row");
    }

    /** @param { "next" | "current" | "passed" } kind */
    updateKind(kind) {
        this.#state.kind = kind;
    }

    /** @param {string} text */
    updateText(text) {
        this.#state.text = text;
    }

    update() {
        if (this.#node.innerText !== this.#state.text) {
            this.#node.innerText = this.#state.text;
        }

        class_list_toggle(this.#node.classList, "lyric-row-current", this.#state.kind === "current");
        class_list_toggle(this.#node.classList, "lyric-row-passed", this.#state.kind === "passed");
    }

    scrollIntoView() {
        return this.#node.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    /**
     *
     * @returns {HTMLDivElement}
     */
    getNode() {
        return this.#node;
    }
}

class LyricsModal {
    /** @type {HTMLDivElement} */
    #modalNode;

    /** @type {HTMLElement} */
    #spotify_main;

    /** @type {HTMLElement} */
    #container;

    /** @type {LyricRow[]} */
    #rows = [];

    /** @type { { hidden : boolean, lyrics : {timestamp : number, lyrics : string}[], current_row : number , scroll_to_row : boolean} } */
    #state = {
        hidden: true,
        lyrics: [],
        current_row: 0,
        scroll_to_row: true,
    };

    constructor() {
        const modal = document.createElement("div");
        modal.classList.add("lyric-modal");
        this.#modalNode = modal;

        this.#spotify_main = document.querySelector(".main-view-container__scroll-node-child").parentNode;
        const container = this.#spotify_main.cloneNode();
        container.innerHTML = "";
        container.style.display = "none";
        container.style.overflow = "auto";
        this.#container = container;

        // const spotify_main = spotify_root.querySelector("main");
        // this.#spotify_main = spotify_main;
    }

    render() {
        if (this.#state.hidden) {
            this.#container.style.display = "none";
            this.#spotify_main.style.removeProperty("display");
        } else {
            this.#renderLyrics();
            this.#container.style.removeProperty("display");
            this.#spotify_main.style.display = "none";
        }
    }

    #renderLyrics() {
        for (let i = 0; i < this.#state.lyrics.length; i++) {
            let lyricsRow = this.#state.lyrics[i];
            let row = this.#rows[i];

            if (!row) {
                row = new LyricRow();
                this.#rows.push(row);
                this.#modalNode.append(row.getNode());
            }

            row.updateText(lyricsRow.lyrics);

            if (i > this.#state.current_row) {
                row.updateKind("next");
            } else if (i === this.#state.current_row) {
                row.updateKind("current");

                if (this.#state.scroll_to_row) {
                    row.scrollIntoView();
                }
            } else {
                row.updateKind("passed");
            }

            row.update();
        }

        if (this.#rows.length > this.#state.lyrics.length) {
            for (let i = this.#state.lyrics.length; i < this.#rows.length; i++) {
                let row = this.#rows[i];
                row.getNode().remove();
            }
            this.#rows.length = this.#state.lyrics.length;
        }
    }

    updateCurrentRow(time) {
        let i = get_current_lyric_row_index(this.#state.lyrics, time);
        this.#state.current_row = i;
    }

    inject() {
        const root = this.#spotify_main.parentNode;
        this.#container.append(this.#modalNode);
        root.append(this.#container);
    }

    remove() {
        this.#state.hidden = true;
        this.render();
        this.#modalNode.remove();
        this.#container.remove();
    }

    /** @param {(old : any) => void } updater  */
    updateState(updater) {
        updater(this.#state);
        this.render();
    }

    getNode() {
        return this.#modalNode;
    }
}

/**
 * An helper function that parses the lyrics and divides them in an object that returns the second of the track
 *
 * @param {string} lyrics
 * @returns {{timestamp : number , lyrics : string}[]}
 */
function parse_song_lyrics(lyrics) {
    const lines = lyrics.split("\n");
    // The result array has this object ({timestamp : number , lyrics : string})
    const results = new Array(lines.length);

    // NOTE the timestamp in the lyrics is in the following format [MM:ss.mm] where M = minutes , s = Seconds, m = milliseconds
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        const time = parseInt(line.slice(1, 3), 10) * 60 + parseInt(line.slice(4, 6), 10);
        const lyrics_line = line.slice(11);

        results[i] = { timestamp: time, lyrics: lyrics_line };
    }

    return results;
}

function get_current_lyric_row_index(lyrics_with_timestamp, timestamp) {
    for (let i = 0; i < lyrics_with_timestamp.length; i++) {
        let row = lyrics_with_timestamp[i];

        if (row.timestamp > timestamp) {
            if (i === 0) {
                return 0;
            }

            return i - 1;
        }
    }

    return lyrics_with_timestamp.length - 1;
}

/**
 * @param {string} track_name name of the song
 * @param {string} artist_name name of the artist(s) of the song
 * @returns {Promise<{id : number, name : string , trackName : string , albumName : string , duration : number , instrumental : boolean,  plainLyrics : string, syncedLyrics : string | null}[]>}
 */
async function search_songs(track_name, artist_name) {
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
    const track_name = document.querySelector(track_name_query).innerText;
    const artist_name = document
        .querySelector(artist_name_query)
        .innerText.split("\n")
        .map((item) => item.trim())
        .join("");
    return { track_name, artist_name };
}

function get_playback_time_in_seconds() {
    const time = playback_time_field?.innerText ?? "";

    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    // 5 => 2 for minutes, 1 x ':' and 2 x seconds
    if (time.length <= 5) {
        const [m, s] = time.split(":").map(Number);
        minutes = m;
        seconds = s;
    } else {
        // Should never happen with songs but i don't trust artists
        const [h, m, s] = time.split(":").map(Number);
        hours = h;
        minutes = m;
        seconds = s;
    }

    return hours * 60 * 60 + minutes * 60 + seconds;
}

/**
 * This function allows us to subscribe to the player song names from the spotify player,
 * this allows us to fetch the lyrics based on the artist name and the track_name
 *
 * @param {() => void} onChange - A callback used called on track_name change
 */
function subscribe_to_track_changes(onChange) {
    const observer = new MutationObserver(onChange);
    const config = { attributes: true, childList: true, subtree: true };

    observer.observe(widget, config);

    return () => {
        observer.disconnect();
    };
}

/**
 * This function allows us to subscribe to the playback time of the spotify player,
 * this allows us to perform some actions based on the playtime of the song, such as
 * lyrics sync
 *
 * @param {() => void} onChange - A callback used to trigger lyrics sync
 */
function subscribe_to_playback_time_change(onChange) {
    const observer = new MutationObserver(onChange);
    const config = { attributes: true, childList: true, subtree: true };

    observer.observe(playback_time_trigger, config);

    return () => {
        observer.disconnect();
    };
}

/**
 *
 * @param {DOMTokenList} classList
 * @param {string} className
 * @param {boolean} state
 */
function class_list_toggle(classList, className, state) {
    const has = classList.contains(className);

    if (state && !has) {
        classList.add(className);
    }

    if (!state && has) {
        classList.remove(className);
    }
}

/**
 *
 * @param {() => boolean} check
 * @returns
 */
async function waitForElement(check) {
    return new Promise((res) => {
        function onChange() {
            if (check()) {
                observer.disconnect();
                return res();
            }
        }

        const observer = new MutationObserver(onChange);
        const config = { attributes: true, childList: true, subtree: true };

        observer.observe(document.body, config);
        onChange();
    });
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

    inject_lyrics_button(lyricsModal);

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

    widget = document.querySelector("[data-testid='now-playing-widget']");
    playback_time_trigger = document.querySelector("[data-testid='progress-bar']");
    playback_time_field = document.querySelector("[data-testid='playback-position']");

    async function handleTrackName() {
        const { track_name, artist_name } = get_track_info();

        if (last_track_name === track_name && last_artist_name === artist_name) {
            return;
        }

        last_track_name = track_name;
        last_artist_name = artist_name;

        const songs = await search_songs(track_name, artist_name);
        const timed_lyrics = parse_song_lyrics(songs[0].syncedLyrics);

        lyricsModal.updateState((old) => {
            old.lyrics = timed_lyrics;
            old.current_row = 0;
        });
    }

    handleTrackName();
    subscribe_to_track_changes(() => handleTrackName());

    subscribe_to_playback_time_change(() => {
        const time = get_playback_time_in_seconds();

        lyricsModal.updateCurrentRow(time);
        lyricsModal.render();
    });
}

init().catch((err) => console.error(err));
