import { classlistToggle } from "../utils.js";

interface LyricRowState {
    kind: "next" | "current" | "passed";
    text: string;
    timestamp: number;
    onClick?: ((timestamp: number) => void) | undefined;
}

export class LyricRow {
    #state: LyricRowState = {
        kind: "next",
        text: "",
        timestamp: 0,
        onClick: undefined,
    };

    #node: HTMLDivElement;

    constructor() {
        this.#node = document.createElement("div");
        this.#node.classList.add("lyric-row");

        this.#node.addEventListener("click", this.#onClick.bind(this));
    }

    setKind(kind: "next" | "current" | "passed") {
        this.#state.kind = kind;
    }

    setText(text: string) {
        if (text.trim() === "") {
            this.#state.text = "♪";
        } else {
            this.#state.text = text;
        }
    }

    setTimetamp(timpestamp: number) {
        this.#state.timestamp = timpestamp;
    }

    #onClick() {
        if (this.#state.onClick) {
            this.#state.onClick(this.#state.timestamp);
        }
    }

    setOnClick(onClick: NonNullable<LyricRowState["onClick"]>) {
        this.#state.onClick = onClick;
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
