import { get_current_lyric_row_index } from "../utils.js";
import { LyricRow } from "./LyricRow.js";

interface LyricsModalState {
    hidden: boolean;
    lyrics: { timestamp: number; lyrics: string }[];
    current_row: number;
    scroll_to_row: boolean;
}

export class LyricsModal {
    #modalNode: HTMLDivElement;
    #spotify_main: HTMLElement;
    #container: HTMLElement;

    #rows: LyricRow[] = [];

    #state: LyricsModalState = {
        hidden: true,
        lyrics: [],
        current_row: 0,
        scroll_to_row: true,
    };

    constructor() {
        const modal = document.createElement("div");
        modal.classList.add("lyric-modal");
        this.#modalNode = modal;

        // TODO better null checks
        this.#spotify_main = document.querySelector<HTMLElement>(".main-view-container__scroll-node-child")!
            .parentNode! as HTMLElement;

        const container = this.#spotify_main.cloneNode() as HTMLElement;
        container.innerHTML = "";
        container.style.display = "none";
        container.style.overflow = "auto";
        this.#container = container;
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
            let lyricsRow = this.#state.lyrics[i]!;
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
                let row = this.#rows[i]!;
                row.getNode().remove();
            }
            this.#rows.length = this.#state.lyrics.length;
        }
    }

    updateCurrentRow(time: number) {
        let i = get_current_lyric_row_index(this.#state.lyrics, time);
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

    /** @param {(old : any) => void } updater  */
    updateState(updater: (state: LyricsModalState) => void) {
        updater(this.#state);
        this.render();
    }

    getNode() {
        return this.#modalNode;
    }
}
