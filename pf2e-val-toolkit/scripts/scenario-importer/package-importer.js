import { readZipFile } from "./zip-reader.js";

const PACKAGE_ASSETS_PREFIX = "assets/";

function cleanEntry(path) {
  return String(path ?? "")
    .replace(/\\/g, "/")
    .replace(/^\.\/+/, "");
}

function isIgnored(path) {
  const value = cleanEntry(path);

  return (
    value.startsWith("__MACOSX/") ||
    value.split("/").some(part => part.startsWith("."))
  );
}

function findScenarioJson(files) {
  const candidates = [...files.keys()]
    .filter(path =>
      !isIgnored(path) &&
      path.toLowerCase().endsWith(".json")
    );

  const preferred = candidates.find(path =>
    path.split("/").pop().toLowerCase() === "scenario.json"
  );

  if (preferred) return preferred;
  if (candidates.length === 1) return candidates[0];

  if (!candidates.length) {
    throw new Error("Le ZIP ne contient aucun JSON de scénario.");
  }

  throw new Error(
    "Le ZIP contient plusieurs JSON. Le fichier principal doit s'appeler scenario.json."
  );
}

function safeSegment(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "scenario";
}

function extension(path) {
  return /\.([^.\/]+)$/.exec(path)?.[1]?.toLowerCase() ?? "";
}

function mimeFor(path) {
  return CONST.UPLOADABLE_FILE_EXTENSIONS?.[extension(path)] ?? null;
}

function picker() {
  return foundry.applications.apps.FilePicker.implementation;
}

async function directoryExists(path) {
  try {
    await picker().browse("data", path);
    return true;
  } catch {
    return false;
  }
}

async function ensureDirectory(path) {
  const parts = String(path).split("/").filter(Boolean);
  let current = "";

  for (const part of parts) {
    current = current ? `${current}/${part}` : part;

    if (await directoryExists(current)) continue;

    await picker().createDirectory("data", current);
  }
}

function dirname(path) {
  const index = path.lastIndexOf("/");
  return index >= 0 ? path.slice(0, index) : "";
}

function basename(path) {
  return path.split("/").pop();
}

async function uploadAsset(root, relativePath, bytes) {
  const normalized = cleanEntry(relativePath);

  if (
    !normalized ||
    normalized.startsWith("/") ||
    normalized.split("/").includes("..")
  ) {
    throw new Error(`Chemin d'asset non sûr : ${relativePath}`);
  }

  const mime = mimeFor(normalized);

  if (!mime) {
    console.warn(
      `PF2e Val Toolkit | Asset ignoré (extension non importable) : ${normalized}`
    );
    return false;
  }

  const relativeDirectory = dirname(normalized);
  const destination = relativeDirectory
    ? `${root}/${relativeDirectory}`
    : root;

  await ensureDirectory(destination);

  const file = new File(
    [bytes],
    basename(normalized),
    { type: mime }
  );

  await picker().upload(
    "data",
    destination,
    file,
    { overwrite: true },
    { notify: false }
  );

  return true;
}

export async function loadScenarioPackage(file) {
  const files = await readZipFile(file);
  const jsonPath = findScenarioJson(files);
  const jsonBytes = files.get(jsonPath);

  let data;

  try {
    data = JSON.parse(
      new TextDecoder("utf-8").decode(jsonBytes)
    );
  } catch (error) {
    throw new Error(
      `Le JSON ${jsonPath} est invalide.`,
      { cause: error }
    );
  }

  if (!data?.scenario?.id) {
    throw new Error("Le JSON du ZIP ne contient pas scenario.id.");
  }

  const assets = [...files.entries()]
    .filter(([path]) =>
      !isIgnored(path) &&
      path.startsWith(PACKAGE_ASSETS_PREFIX) &&
      !path.endsWith("/")
    )
    .map(([path, bytes]) => ({
      path: path.slice(PACKAGE_ASSETS_PREFIX.length),
      bytes
    }))
    .filter(asset => asset.path);

  if (!assets.length) {
    return {
      data,
      assetCount: 0,
      assetRoot: null
    };
  }

  const root =
    `worlds/${game.world.id}/pf2e-val-toolkit/scenarios/` +
    safeSegment(data.scenario.id);

  await ensureDirectory(root);

  let uploaded = 0;

  for (const asset of assets) {
    if (await uploadAsset(root, asset.path, asset.bytes)) {
      uploaded += 1;
    }
  }

  // ZIP packages are self-contained: all relative images now point to the
  // extracted asset directory in this Foundry world.
  data.assets = {
    ...(data.assets ?? {}),
    root
  };

  return {
    data,
    assetCount: uploaded,
    assetRoot: root
  };
}
