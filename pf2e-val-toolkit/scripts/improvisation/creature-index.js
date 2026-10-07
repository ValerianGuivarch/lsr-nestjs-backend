const CORE_COLLECTIONS = new Set([
  "pf2e.pathfinder-monster-core",
  "pf2e.pathfinder-monster-core-2",
  "pf2e.pathfinder-npc-core",
  "pf2e.pathfinder-bestiary",
  "pf2e.pathfinder-bestiary-2",
  "pf2e.pathfinder-bestiary-3",
  "pf2e.npc-gallery"
]);

const INDEX_FIELDS = [
  "type",
  "system.details.level.value",
  "system.details.publicNotes",
  "system.traits.value",
  "system.traits.rarity",
  "system.traits.size.value"
];

let cachePromise = null;

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase();
}

function sourceGroup(collection) {
  if (CORE_COLLECTIONS.has(collection)) return "core";
  return collection?.startsWith("pf2e.") ? "adventures" : "modules";
}

function buildSearchText(entry) {
  return normalize([
    entry.name,
    entry.sourceLabel,
    entry.collection,
    entry.publicNotes,
    ...(entry.traits ?? [])
  ].join(" "));
}

function fromIndexEntry(pack, raw) {
  const collection = pack.collection;
  const level = Number(raw.system?.details?.level?.value);
  if (raw.type !== "npc" || !Number.isFinite(level)) return null;

  const traits = [...new Set(raw.system?.traits?.value ?? [])].sort();
  const result = {
    key: `${collection}.${raw._id}`,
    id: raw._id,
    uuid: `Compendium.${collection}.Actor.${raw._id}`,
    name: raw.name,
    img: raw.img ?? "icons/svg/mystery-man.svg",
    type: "npc",
    level,
    rarity: raw.system?.traits?.rarity ?? "common",
    size: raw.system?.traits?.size?.value ?? null,
    traits,
    sourceKind: "compendium",
    sourceGroup: sourceGroup(collection),
    collection,
    sourceLabel: pack.metadata?.label ?? pack.title ?? collection,
    publicNotes: raw.system?.details?.publicNotes ?? ""
  };
  result.searchText = buildSearchText(result);
  return result;
}

function fromWorldActor(actor) {
  const level = Number(actor.system?.details?.level?.value);
  if (actor.type !== "npc" || !Number.isFinite(level)) return null;

  const traits = [...new Set(actor.system?.traits?.value ?? [])].sort();
  const result = {
    key: `world.${actor.id}`,
    id: actor.id,
    uuid: actor.uuid,
    name: actor.name,
    img: actor.img ?? "icons/svg/mystery-man.svg",
    type: "npc",
    level,
    rarity: actor.system?.traits?.rarity ?? "common",
    size: actor.system?.traits?.size?.value ?? null,
    traits,
    sourceKind: "world",
    sourceGroup: "world",
    collection: null,
    sourceLabel: "Monde",
    publicNotes: actor.system?.details?.publicNotes ?? ""
  };
  result.searchText = buildSearchText(result);
  return result;
}

async function buildIndex() {
  const rows = [];

  for (const pack of game.packs?.values?.() ?? []) {
    if (pack.documentName !== "Actor") continue;

    try {
      const index = await pack.getIndex({ fields: INDEX_FIELDS });
      for (const raw of index) {
        const entry = fromIndexEntry(pack, raw);
        if (entry) rows.push(entry);
      }
    } catch (error) {
      console.warn(`PF2e Val Toolkit | Impossible d'indexer ${pack.collection}`, error);
    }
  }

  for (const actor of game.actors?.contents ?? []) {
    const entry = fromWorldActor(actor);
    if (entry) rows.push(entry);
  }

  rows.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, "fr"));
  return rows;
}

async function getIndex({ refresh = false } = {}) {
  if (refresh || !cachePromise) cachePromise = buildIndex();
  return cachePromise;
}

function scopeMatch(entry, scope) {
  if (scope === "core") return entry.sourceGroup === "core";
  if (scope === "compendiums") return entry.sourceKind === "compendium";
  if (scope === "world") return entry.sourceKind === "world";
  return true;
}

async function searchCreatures({
  minLevel = -1,
  maxLevel = 25,
  traits = [],
  query = "",
  scope = "core",
  rarities = [],
  collections = []
} = {}) {
  const normalizedQuery = normalize(query);
  const requiredTraits = new Set((traits ?? []).filter(Boolean));
  const allowedRarities = new Set((rarities ?? []).filter(Boolean));
  const allowedCollections = new Set((collections ?? []).filter(Boolean));

  return (await getIndex()).filter((entry) => {
    if (!scopeMatch(entry, scope)) return false;
    if (allowedCollections.size && !allowedCollections.has(entry.collection)) return false;
    if (entry.level < minLevel || entry.level > maxLevel) return false;
    if (requiredTraits.size && ![...requiredTraits].every((trait) => entry.traits.includes(trait))) return false;
    if (allowedRarities.size && !allowedRarities.has(entry.rarity)) return false;
    if (normalizedQuery && !entry.searchText.includes(normalizedQuery)) return false;
    return true;
  });
}

async function traitOptions({ scope = "core" } = {}) {
  const counts = new Map();
  for (const entry of await getIndex()) {
    if (!scopeMatch(entry, scope)) continue;
    for (const trait of entry.traits) counts.set(trait, (counts.get(trait) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, "fr"));
}

async function resolveCreature(entry) {
  if (!entry) return null;
  if (entry.sourceKind === "world") return game.actors.get(entry.id) ?? null;
  const pack = game.packs.get(entry.collection);
  return pack ? pack.getDocument(entry.id) : null;
}

function clearCreatureIndex() {
  cachePromise = null;
}

function registerInvalidationHooks() {
  for (const hook of ["createActor", "updateActor", "deleteActor"]) {
    Hooks.on(hook, () => clearCreatureIndex());
  }
  Hooks.on("updateCompendium", () => clearCreatureIndex());
}

export function initCreatureIndex() {
  registerInvalidationHooks();

  game.pf2eValToolkit ??= {};
  game.pf2eValToolkit.creatureIndex = {
    getIndex,
    search: searchCreatures,
    traitOptions,
    resolve: resolveCreature,
    clear: clearCreatureIndex
  };
}
