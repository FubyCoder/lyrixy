import { class_list_toggle } from "../utils.js";

interface LyricRowState {
    kind: "next" | "current" | "passed";
    text: string;
}

export class LyricRow {
    #state: LyricRowState = {
        kind: "next",
        text: "",
    };

    #node: HTMLDivElement;

    constructor() {
        this.#node = document.createElement("div");
        this.#node.classList.add("lyric-row");
    }

    updateKind(kind: "next" | "current" | "passed") {
        this.#state.kind = kind;
    }

    /** @param {string} text */
    updateText(text: string) {
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

    getNode(): HTMLDivElement {
        return this.#node;
    }
}
