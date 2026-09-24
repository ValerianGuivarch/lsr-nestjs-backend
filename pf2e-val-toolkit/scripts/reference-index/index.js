function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function makeUuid(pack, entry) {
  return `Compendium.${pack.collection}.${entry._id}`;
}

async function collect(documentName) {
  const records = [];

  for (const pack of game.packs.filter(pack => pack.documentName === documentName)) {
    const index = await pack.getIndex({
      fields: ["name", "type", "system.slug", "system.details.level.value", "system.level.value"]
    });

    for (const entry of index) {
      records.push({
        name: entry.name,
        normalizedName: normalize(entry.name),
        slug: entry.system?.slug ?? null,
        uuid: makeUuid(pack, entry),
        documentType: documentName,
        type: entry.type ?? null,
        level: entry.system?.details?.level?.value ?? entry.system?.level?.value ?? null,
        pack: pack.collection,
        packLabel: pack.metadata?.label ?? pack.title ?? pack.collection,
        package: pack.metadata?.packageName ?? null
      });
    }
  }

  return records;
}

async function exportReferenceIndex() {
  ui.notifications.info("PF2e Val Toolkit : génération de l'index…");

  const actors = await collect("Actor");
  const items = await collect("Item");

  const data = {
    formatVersion: 2,
    metadata: {
      exportedAt: new Date().toISOString(),
      foundryVersion: game.version ?? null,
      systemVersion: game.system?.version ?? null,
      language: game.i18n?.lang ?? null
    },
    actors,
    items
  };

  const filename = `pf2e-reference-index-${new Date().toISOString().slice(0, 10)}.json`;

  foundry.utils.saveDataToFile(
    JSON.stringify(data, null, 2),
    "application/json",
    filename
  );

  ui.notifications.info(`Index exporté : ${actors.length} Actors, ${items.length} Items.`);
  return data;
}


async function collectWithSources(documentName) {
  const indexRecords = [];
  const sourceRecords = [];
  const packs = game.packs.filter(pack => pack.documentName === documentName);

  for (const [packIndex, pack] of packs.entries()) {
    console.log(`[PF2e Val Toolkit] Reference Library ${documentName}: ${packIndex + 1}/${packs.length} ${pack.collection}`);
    const index = await pack.getIndex({ fields: ["name", "type", "system.slug", "system.details.level.value", "system.level.value", "system.traits.value"] });
    const documents = await pack.getDocuments();
    const sourceById = new Map(documents.map(document => [document.id, document.toObject()]));
    for (const entry of index) {
      const uuid = makeUuid(pack, entry);
      indexRecords.push({
        name: entry.name,
        normalizedName: normalize(entry.name),
        slug: entry.system?.slug ?? null,
        uuid,
        documentType: documentName,
        type: entry.type ?? null,
        level: entry.system?.details?.level?.value ?? entry.system?.level?.value ?? null,
        traits: Array.isArray(entry.system?.traits?.value) ? entry.system.traits.value : [],
        pack: pack.collection,
        packLabel: pack.metadata?.label ?? pack.title ?? pack.collection,
        package: pack.metadata?.packageName ?? null
      });
      const source = sourceById.get(entry._id);
      if (source) sourceRecords.push({ uuid, source });
    }
  }
  return { index: indexRecords, sources: sourceRecords };
}

async function exportReferenceLibrary() {
  ui.notifications.info("PF2e Val Toolkit : export complet des références (cela peut prendre un moment)…");
  const actors = await collectWithSources("Actor");
  const items = await collectWithSources("Item");
  const data = {
    formatVersion: 3,
    metadata: {
      exportedAt: new Date().toISOString(),
      foundryVersion: game.version ?? null,
      systemId: game.system?.id ?? null,
      systemVersion: game.system?.version ?? null,
      language: game.i18n?.lang ?? null,
      worldId: game.world?.id ?? null
    },
    index: { actors: actors.index, items: items.index },
    sources: { actors: actors.sources, items: items.sources }
  };
  const filename = `pf2e-reference-library-${new Date().toISOString().slice(0, 10)}.json`;
  foundry.utils.saveDataToFile(JSON.stringify(data), "application/json", filename);
  ui.notifications.info(`Bibliothèque exportée : ${actors.index.length} Actors, ${items.index.length} Items.`);
  return data;
}

export function initReferenceIndexExporter() {
  game.pf2eValToolkit = game.pf2eValToolkit ?? {};
  game.pf2eValToolkit.exportReferenceIndex = exportReferenceIndex;
  game.pf2eValToolkit.exportReferenceLibrary = exportReferenceLibrary;
}
