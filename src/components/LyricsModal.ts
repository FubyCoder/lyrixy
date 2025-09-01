import { spotifyMainSectionQuery } from "../config.js";
import type { LyricsWithTimestamp } from "../types/index.js";
import { getCurrentLyricRowIndex } from "../utils.js";
import { LyricRow } from "./LyricRow.js";

interface LyricsModalState {
    hidden: boolean;
    lyrics: LyricsWithTimestamp[];
    error: string | null;
    current_row: number;
    scroll_to_row: boolean;
}

export class LyricsModal {
    #modalNode: HTMLDivElement;
    #spotify_main: HTMLElement;
    #container: HTMLElement;

    #rowContainer: HTMLElement;
    #rows: LyricRow[] = [];

    #errorNode: HTMLElement;

    #state: LyricsModalState = {
        hidden: true,
        lyrics: [],
        error: null,
        current_row: 0,
        scroll_to_row: true,
    };

    constructor() {
        const modal = document.createElement("div");
        modal.classList.add("lyric-modal");
        this.#modalNode = modal;

        // TODO better null checks
        this.#spotify_main = document.querySelector<HTMLElement>(spotifyMainSectionQuery)!.parentNode! as HTMLElement;

        const container = this.#spotify_main.cloneNode() as HTMLElement;
        container.innerHTML = "";
        container.style.display = "none";
        container.style.overflow = "auto";
        this.#container = container;

        this.#rowContainer = document.createElement("div");
        this.#errorNode = document.createElement("p");
        this.#errorNode.style.display = "none";
        this.#errorNode.classList.add("lyrics-error");

        this.#modalNode.append(this.#errorNode);
        this.#modalNode.append(this.#rowContainer);
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

        if (this.#state.error) {
            if (this.#errorNode.innerText !== this.#state.error) {
                this.#errorNode.innerText = this.#state.error;
            }

            this.#rowContainer.style.display = "none";
            this.#errorNode.style.removeProperty("display");
        } else {
            this.#rowContainer.style.removeProperty("display");
            this.#errorNode.style.display = "none";
        }
    }

    #renderLyrics() {
        for (let i = 0; i < this.#state.lyrics.length; i++) {
            let lyricsRow = this.#state.lyrics[i]!;
            let row = this.#rows[i];

            if (!row) {
                row = new LyricRow();
                this.#rows.push(row);
                this.#rowContainer.append(row.getNode());
            }

            row.setText(lyricsRow.lyrics);

            if (i > this.#state.current_row) {
                row.setKind("next");
            } else if (i === this.#state.current_row) {
                row.setKind("current");

                if (this.#state.scroll_to_row) {
                    row.scrollIntoView();
                }
            } else {
                row.setKind("passed");
            }

            row.render();
        }

        if (this.#rows.length > this.#state.lyrics.length) {
            for (let i = this.#state.lyrics.length; i < this.#rows.length; i++) {
                let row = this.#rows[i]!;
                row.getNode().remove();
            }
            this.#rows.length = this.#state.lyrics.length;
        }
    }

    setCurrentRowFromTime(time: number) {
        let i = getCurrentLyricRowIndex(this.#state.lyrics, time);
        this.#state.current_row = i;
    }

    inject() {
        // TODO : better null checks
        const root = this.#spotify_main.parentNode!;
        this.#container.append(this.#modalNode);
        root.append(this.#container);
    }

    remove() {
        this.#state.hidden = true;
        this.render();
        this.#modalNode.remove();
        this.#container.remove();
    }

    updateState(updater: (state: LyricsModalState) => void) {
        updater(this.#state);
        this.render();
    }

    getNode() {
        return this.#modalNode;
    }
}
