import type { LyricsWithTimestamp } from "../types/index.js";
import { getCurrentLyricRowIndex } from "../utils.js";
import { LyricRow } from "./LyricRow.js";

interface LyricsModalState {
    hidden: boolean;
    lyrics: LyricsWithTimestamp[];
    error: string | null;
    currentRow: number;
    scrollToRow: boolean;

    onLyricRowClick: (timestamp: number) => void;
}

export class LyricsModal {
    #modalNode: HTMLDivElement;

    #rowContainer: HTMLElement;
    #rows: LyricRow[] = [];

    #credits: HTMLElement;

    #errorNode: HTMLElement;

    #state: LyricsModalState = {
        hidden: true,
        lyrics: [],
        error: null,
        currentRow: 0,
        scrollToRow: true,

        onLyricRowClick: () => {},
    };

    constructor() {
        const modal = document.createElement("div");
        modal.classList.add("lyric-modal");
        this.#modalNode = modal;

        this.#rowContainer = document.createElement("div");
        this.#rowContainer.classList.add("lyrics-container");
        this.#errorNode = document.createElement("p");
        this.#errorNode.style.display = "none";
        this.#errorNode.classList.add("lyrics-error");

        this.#credits = document.createElement("p");
        this.#credits.classList.add("lyrics-credits");
        this.#credits.innerHTML =
            "Lyrics provided by <a href='https://github.com/tranxuanthang/lrclib'>LRCLIB project</a> and Lyrixy extension";

        this.#modalNode.append(this.#errorNode);
        this.#modalNode.append(this.#rowContainer);
        this.#modalNode.append(this.#credits);
    }

    render() {
        this.#renderLyrics();

        if (this.#state.error) {
            if (this.#errorNode.innerText !== this.#state.error) {
                this.#errorNode.innerText = this.#state.error;
            }

            this.#errorNode.style.removeProperty("display");
            this.#credits.style.display = "none";
        } else {
            this.#rowContainer.style.removeProperty("display");
            this.#credits.style.removeProperty("display");
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
            row.setTimetamp(lyricsRow.timestamp);
            row.setOnClick(this.#state.onLyricRowClick);

            if (i > this.#state.currentRow) {
                row.setKind("next");
            } else if (i === this.#state.currentRow) {
                row.setKind("current");

                if (this.#state.scrollToRow) {
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
        this.#state.currentRow = i;
    }

    remove() {
        this.#state.hidden = true;
        this.render();
        this.#modalNode.remove();
    }

    updateState(updater: (state: LyricsModalState) => void) {
        updater(this.#state);

        for (const row of this.#rows) {
            row.setOnClick(this.#state.onLyricRowClick);
        }

        this.render();
    }

    getNode() {
        return this.#modalNode;
    }
}
