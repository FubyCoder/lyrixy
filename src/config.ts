// Bottom left section
export const trackNameQuery = "[data-testid='context-item-info-title']";
export const artistNameQuery = "[data-testid='context-item-info-subtitles']";

// Bottom right section
export const iconBarQuery = "[data-testid='control-button-npv']";

// Bottom middle section
export const playingWidgetQuery = "[data-testid='now-playing-widget']";
export const progressBarQuery = "[data-testid='progress-bar']";
export const playbackPositionQuery = "[data-testid='playback-position']";

export const getSongDurationElement = () => {
    const p1 = document.querySelector("[data-testid='playback-progressbar']");
    if (!p1) {
        return null;
    }
    const input = p1.querySelector<HTMLInputElement>("input");

    return input;
};

export const spotifyMainSectionQuery = ".main-view-container__scroll-node-child";
