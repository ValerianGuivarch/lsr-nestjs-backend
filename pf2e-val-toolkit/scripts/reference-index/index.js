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

export function initReferenceIndexExporter() {
  game.pf2eValToolkit = game.pf2eValToolkit ?? {};
  game.pf2eValToolkit.exportReferenceIndex = exportReferenceIndex;
}
