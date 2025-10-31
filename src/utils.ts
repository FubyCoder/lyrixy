export function classlistToggle(classList: DOMTokenList, className: string, state: boolean) {
    const has = classList.contains(className);

    if (state && !has) {
        classList.add(className);
    }

    if (!state && has) {
        classList.remove(className);
    }
}

export function subscribeMutation(element: HTMLElement, onChange: () => void) {
    const observer = new MutationObserver(onChange);
    const config = { attributes: true, childList: true, subtree: true };

    observer.observe(element, config);

    return () => {
        observer.disconnect();
    };
}

export async function waitForElement(check: () => boolean) {
    return new Promise<void>((res) => {
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

export interface LyricsWithTimestamp {
    timestamp: number;
    lyrics: string;
}

export function getCurrentLyricRowIndex(lyricsWithTimestamp: LyricsWithTimestamp[], timestamp: number) {
    for (let i = 0; i < lyricsWithTimestamp.length; i++) {
        let row = lyricsWithTimestamp[i]!;

        if (row.timestamp > timestamp) {
            if (i === 0) {
                return 0;
            }

            return i - 1;
        }
    }

    return lyricsWithTimestamp.length - 1;
}
