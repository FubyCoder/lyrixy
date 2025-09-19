rm -rf ./build || echo ""
rm -rf ./dist || echo ""
# Root build
pnpm vite build

mkdir ./dist
mkdir ./dist/chrome
mkdir ./dist/firefox

# Manifest V3 build
cp -r ./build/* ./dist/chrome
cp ./src/manifest.chrome.json ./dist/chrome/manifest.json

# Manifest V2 build
cp -r ./build/* ./dist/firefox
cp ./src/manifest.firefox.json ./dist/firefox/manifest.json

rm -rf ./build || echo ""
