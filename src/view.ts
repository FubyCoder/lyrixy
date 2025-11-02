import type { LyricsWithTimestamp } from "./utils.js";

interface LyricsViewState {
    currentRow: number;
    lyrics: LyricsWithTimestamp[];
    message: string;

    onRowClick: (timestamp: number) => void;
}

interface LyricsRowState {
    type: "current" | "passed" | "next";
    text: string;
    timestamp: number;

    onClick: (timestamp: number) => void;
}

export class LyricsRow {
    #textElement = document.createElement("p");

    #state: LyricsRowState;
    #hasChanged: boolean = false;

    #unsubscribeClick: (() => void) | null = null;

    constructor(state: LyricsRowState) {
        this.#state = state;
        this.init();
    }

    init() {
        this.#textElement.classList.add("lyrixy-text");
        this.#textElement.setAttribute("data-type", this.#state.type);
        this.#textElement.innerText = this.#state.text;

        const onClick = () => this.#state.onClick(this.#state.timestamp);
        this.#textElement.addEventListener("click", onClick);

        this.#unsubscribeClick = () => {
            this.#textElement.removeEventListener("click", onClick);
        };
    }

    setText(text: string) {
        if (this.#state.text !== text) {
            this.#state.text = text;
            this.#hasChanged = true;
        }
    }

    setType(type: LyricsRowState["type"]) {
        if (this.#state.type !== type) {
            this.#state.type = type;
            this.#hasChanged = true;
        }
    }

    setTimestamp(timestamp: number) {
        if (this.#state.timestamp !== timestamp) {
            this.#state.timestamp = timestamp;
            this.#hasChanged = true;
        }
    }

    scrollInto() {
        this.#textElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    getNode() {
        return this.#textElement;
    }

    destroy() {
        if (this.#unsubscribeClick !== null) {
            this.#unsubscribeClick();
        }
        this.#textElement.remove();
    }

    update() {
        if (!this.#hasChanged) {
            return;
        }

        this.#textElement.setAttribute("data-type", this.#state.type);
        this.#textElement.innerText = this.#state.text;
        this.#hasChanged = false;
    }
}

export class LyricsView {
    #container: HTMLDivElement = document.createElement("div");
    #rowContainer: HTMLDivElement = document.createElement("div");
    #messageElement: HTMLParagraphElement = document.createElement("p");
    #creditsElement: HTMLParagraphElement = document.createElement("p");

    #rows: LyricsRow[] = [];

    #state: LyricsViewState = {
        currentRow: 0,
        lyrics: [],
        message: "",
        onRowClick: () => {},
    };

    constructor(onRowClick: (timestamp: number) => void) {
        this.init();
        this.#state.onRowClick = onRowClick;
    }

    init() {
        this.#container.classList.add("lyrixy-container");
        this.#rowContainer.classList.add("lyrixy-rows");
        this.#messageElement.classList.add("lyrixy-message");
        this.#container.append(this.#messageElement);
        this.#container.append(this.#rowContainer);
        this.#rowContainer.append(this.#messageElement);

        this.#creditsElement.classList.add("lyrixy-credits");
        this.#creditsElement.innerHTML =
            "Lyrics provided by <a href='https://github.com/tranxuanthang/lrclib'>LRCLIB project</a> and Lyrixy extension";
    }

    setCurrentRow(row: number) {
        if (this.#state.currentRow === row) {
            return;
        }

        this.#state.currentRow = row;

        this.udpdateLyricsRows();

        const currentRow = this.#rows[row];

        if (currentRow) {
            currentRow.scrollInto();
        }

        this.update();
    }

    setLyrics(lyrics: LyricsWithTimestamp[]) {
        if (this.#state.lyrics === lyrics) {
            return;
        }

        this.#state.lyrics = lyrics;

        this.udpdateLyricsRows();
        this.update();
    }

    setMessage(message: string) {
        if (this.#state.message === message) {
            return;
        }

        this.#state.message = message;
        this.update();
    }

    destroy() {
        this.#container.remove();
    }

    getNode() {
        return this.#container;
    }

    private udpdateLyricsRows() {
        this.#creditsElement.remove();

        for (let i = 0; i < this.#state.lyrics.length; i++) {
            const lyrics = this.#state.lyrics[i]!;
            let row = this.#rows[i];

            const rowType = i === this.#state.currentRow ? "current" : i < this.#state.currentRow ? "passed" : "next";

            if (row === undefined) {
                row = new LyricsRow({
                    text: lyrics.lyrics,
                    type: rowType,
                    timestamp: lyrics.timestamp,
                    onClick: this.#state.onRowClick.bind(this),
                });
                this.#rows.push(row);
                this.#rowContainer.appendChild(row.getNode());
            } else {
                row.setText(lyrics.lyrics);
                row.setType(rowType);
                row.setTimestamp(lyrics.timestamp);
            }
        }

        if (this.#rows.length > this.#state.lyrics.length) {
            for (let i = this.#state.lyrics.length; i < this.#rows.length; i++) {
                const row = this.#rows[i]!;
                row?.destroy();
            }

            this.#rows.length = this.#state.lyrics.length;
        }

        this.#rowContainer.append(this.#creditsElement);
    }

    update() {
        if (this.#state.message !== "") {
            this.#rowContainer.classList.add("hide-lyrics");
            this.#messageElement.style.removeProperty("display");
            this.#messageElement.innerText = this.#state.message;
            return;
        }

        this.#rowContainer.classList.remove("hide-lyrics");
        this.#messageElement.style.display = "none";
        for (const row of this.#rows) {
            row.update();
        }
    }
}
