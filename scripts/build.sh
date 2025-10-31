rm -rf ./build || echo ""
rm -rf ./dist || echo ""
# Root build
pnpm vite build

mkdir ./dist
mkdir ./dist/v2
mkdir ./dist/v3

# Manifest V2 build
cp -r ./build/* ./dist/v2
cp ./src/manifest.v2.json ./dist/v2/manifest.json

# Manifest V3 build
cp -r ./build/* ./dist/v3
cp ./src/manifest.v3.json ./dist/v3/manifest.json

rm -rf ./build || echo ""
