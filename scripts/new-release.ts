import fs from "fs";
import path from "path";

const __dirname = import.meta.dirname;

interface State {
    update: "patch" | "minor" | "major";
}

function parseArguments(args: string[]): { data: State; error: false } | { data: null; error: true } {
    let update: State["update"];

    if (args.includes("--patch")) {
        update = "patch";
    } else if (args.includes("--minor")) {
        update = "minor";
    } else if (args.includes("--major")) {
        update = "major";
    } else {
        console.error(
            "Please specify the kind of release that you want to produce, use --patch --minor or --major in the arguments list",
        );

        return { data: null, error: true };
    }

    return { data: { update }, error: false };
}

function fileExists(path: string) {
    return fs.existsSync(path);
}

function readJsonFile(path: string) {
    return JSON.parse(fs.readFileSync(path).toString());
}

function writeJsonFile(path: string, object: object) {
    return fs.writeFileSync(path, JSON.stringify(object, null, 4));
}

function start(args: string[]) {
    const state = parseArguments(args);

    if (state.error) {
        process.exit(1);
    }

    const context = state.data;
    const projectPackageJsonPath = path.join(__dirname, "..", "./package.json");
    const manifestV2Path = path.join(__dirname, "..", "./src/manifest.v2.json");
    const manifestV3Path = path.join(__dirname, "..", "./src/manifest.v3.json");

    if (!fileExists(projectPackageJsonPath)) {
        console.error("File package.json is missing");
        process.exit(1);
    }

    if (!fileExists(manifestV2Path)) {
        console.error("File ./src/manifest.v2.json is missing");
        process.exit(1);
    }

    if (!fileExists(manifestV3Path)) {
        console.error("File ./src/manifest.v3.json is missing");
        process.exit(1);
    }

    const packageJsonObject = readJsonFile(projectPackageJsonPath);

    const currentVersion: string | undefined = packageJsonObject.version;

    if (typeof currentVersion !== "string") {
        console.error("Field 'version' is missing in root package.json, please add a 'version' with a semver version");
        process.exit(1);
    }

    const isSemver = currentVersion.match(/^\d+\.\d+\.\d+$/) !== null;

    if (!isSemver) {
        console.error(
            "The field 'version' is package.json does not represent a semver string use this format :`d.d.d`",
        );
        process.exit(1);
    }

    let [major, minor, patch] = currentVersion.split(".").map(Number) as [number, number, number];

    if (context.update === "major") {
        major++;
        minor = 0;
        patch = 0;
    } else if (context.update === "minor") {
        minor++;
        patch = 0;
    } else if (context.update === "patch") {
        patch++;
    }

    const newVersionString = `${major}.${minor}.${patch}`;
    packageJsonObject.version = newVersionString;

    const manifestV2Object = readJsonFile(manifestV2Path);
    manifestV2Object.version = newVersionString;
    writeJsonFile(manifestV2Path, manifestV2Object);

    const manifestV3Object = readJsonFile(manifestV2Path);
    manifestV3Object.version = newVersionString;
    writeJsonFile(manifestV3Path, manifestV3Object);

    writeJsonFile(projectPackageJsonPath, packageJsonObject);
}

start(process.argv);
