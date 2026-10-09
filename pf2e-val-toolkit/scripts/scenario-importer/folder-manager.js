function sameParent(folder, parent) {
  const actualParent = folder.folder?.id ?? folder.folder ?? null;
  const expectedParent = parent?.id ?? null;
  return actualParent === expectedParent;
}

async function getOrCreateFolder(name, type, parent = null) {
  const existing = game.folders.find(
    folder =>
      folder.type === type &&
      folder.name === name &&
      sameParent(folder, parent)
  );

  if (existing) return existing;

  return Folder.create({
    name,
    type,
    folder: parent?.id ?? null
  });
}

export async function ensureScenarioFolderTree(type, library, scenario) {
  const customPath = Array.isArray(library?.path)
    ? library.path.map(name => String(name ?? "").trim()).filter(Boolean)
    : null;

  const names = customPath?.length
    ? [...customPath]
    : [
        library?.root ?? "MJ",
        library?.category ?? "Scénarios individuels",
        library?.collection ?? "Autres"
      ];

  if (library?.includeScenario !== false) {
    names.push(`${scenario.id.replace(/^PFS-/, "")} - ${scenario.name}`);
  }

  let parent = null;
  const folders = [];

  for (const name of names) {
    parent = await getOrCreateFolder(name, type, parent);
    folders.push(parent);
  }

  return {
    root: folders[0] ?? null,
    category: folders[1] ?? null,
    collection: folders[2] ?? null,
    scenario: folders.at(-1) ?? null
  };
}

export function normalizeFolderPath(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map(name => String(name ?? "").trim())
    .filter(Boolean);
}

export async function ensureFolderPath(type, parent, path) {
  let current = parent;
  for (const name of normalizeFolderPath(path)) {
    current = await getOrCreateFolder(name, type, current);
  }
  return current;
}
