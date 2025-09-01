# LyricXy

A simple fifefox extension to display spotify lyrics

## Why ?
Some existing extension have some issues in the rendering process (especially on windows) or they have a bad (in my opinion) frontend

## How to build
Linux / MacOs
```sh
pnpm build
```

Windows
```sh
pnpm vite build
copy ".\src\manifest.json" ".\dist\manifest.json"
```

## How to install
In Firefox: Open the about:debugging page, click the This Firefox option, click the Load Temporary Add-on button, then select any file in your extension's directory.

The extension now installs, and remains installed until you restart Firefox.

## How does it work ?
This project injects a new button in the spotify bottom-right section that allows us to display a new modal in full screen (similar to spotify native lyrics page).

Then we the currently playing song using the generous [LRCLIB](https://lrclib.net) and we sync the lyrics with the current song timestamp

## Contribution
This is mainly a personal project so I will not merge PRs or edit much of this, unless is something i personally need
