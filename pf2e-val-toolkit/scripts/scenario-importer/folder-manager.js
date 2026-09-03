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
  const names = [
    library?.root ?? "Campagnes",
    library?.category ?? "Divers",
    library?.collection ?? "Autres",
    `${scenario.id.replace(/^PFS-/, "")} - ${scenario.name}`
  ];

  let parent = null;
  const folders = [];

  for (const name of names) {
    parent = await getOrCreateFolder(name, type, parent);
    folders.push(parent);
  }

  return {
    root: folders[0],
    category: folders[1],
    collection: folders[2],
    scenario: folders[3]
  };
}
