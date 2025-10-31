# Lyrixy

A simple fifefox extension to display spotify lyrics

## Why ?
Some existing extension have some issues in the rendering process (especially on windows) or they have a bad (in my opinion) frontend

## How to build
Linux / MacOs
```sh
pnpm build
```

Windows (use WSL)
```sh
pnpm build
```

Or without WSL:
 - Run `pnpm build`
 - Create dirs `./dist/v3` `./dist/v2`
 - Copy content of `./build` in both `./dist/v3` `./dist/v2`
 - (For Manifest V2 browsers) Copy `./src/manifest.v2.json` to `./dist/v2` as `manifest.json`
 - (For Manifest v3 browsers like Chrome/Chromium) Copy `./src/manifest.v3.json` to `./dist/v3` as `manifest.json`


## How to install
In Firefox: Open the about:debugging page, click the This Firefox option, click the Load Temporary Add-on button, then select any file in your extension's directory.

The extension now installs, and remains installed until you restart Firefox.

## How does it work ?
If the user is in the /lyrics page of spotify and the song doesn't have official lyrics, this extension injects a new view with lyrics provided by [LRCLIB](https://lrclib.net)

## Contribution
This is mainly a personal project so I will not merge PRs or edit much of this, unless is something i personally need
