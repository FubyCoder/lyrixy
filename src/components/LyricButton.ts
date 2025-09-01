import { classlistToggle } from "../utils.js";
import { LyricsModal } from "./LyricsModal.js";

export class LyricButton {
    #modal: LyricsModal;

    #node: HTMLButtonElement;

    #state = {
        active: false,
    };

    constructor(lyricModal: LyricsModal) {
        this.#modal = lyricModal;

        this.#node = document.createElement("button");
        this.#node.classList.add("lyrics-button");
        this.render();

        this.#node.addEventListener("click", () => {
            this.#state.active = !this.#state.active;

            this.#modal.updateState((old) => {
                old.hidden = !this.#state.active;
            });

            this.render();
        });
    }

    render() {
        this.#node.style.background = "transparent";
        this.#node.style.border = "none";
        this.#node.style.padding = "8px";
        this.#node.style.display = "flex";
        this.#node.style.alignContent = "center";
        this.#node.title = "Lyrics";

        // Lucide Icon License MIT & ISC : https://lucide.dev/license
        this.#node.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m11 7.601-5.994 8.19a1 1 0 0 0 .1 1.298l.817.818a1 1 0 0 0 1.314.087L15.09 12"/><path d="M16.5 21.174C15.5 20.5 14.372 20 13 20c-2.058 0-3.928 2.356-6 2s-2.775-3.369-1.5-4.5"/><circle cx="16" cy="7" r="5"/></svg>`;
        classlistToggle(this.#node.classList, "lyrics-button-active", this.#state.active);
    }

    getNode() {
        return this.#node;
    }
}
