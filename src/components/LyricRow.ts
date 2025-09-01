import { classlistToggle } from "../utils.js";

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

    setKind(kind: "next" | "current" | "passed") {
        this.#state.kind = kind;
    }

    setText(text: string) {
        this.#state.text = text;
    }

    render() {
        if (this.#node.innerText !== this.#state.text) {
            this.#node.innerText = this.#state.text;
        }

        classlistToggle(this.#node.classList, "lyric-row-current", this.#state.kind === "current");
        classlistToggle(this.#node.classList, "lyric-row-passed", this.#state.kind === "passed");
    }

    scrollIntoView() {
        return this.#node.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    getNode(): HTMLDivElement {
        return this.#node;
    }
}
