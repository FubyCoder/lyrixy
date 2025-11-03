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
