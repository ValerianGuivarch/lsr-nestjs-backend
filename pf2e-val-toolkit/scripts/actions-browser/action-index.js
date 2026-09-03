import {
  BASIC_ACTION_SLUGS,
  GENERAL_ACTION_SLUG_SET,
  getCatalogueKind,
  getSkillGroupsForSlug
} from "./action-catalogue.js";

const PACK_ID = "pf2e.actionspf2e";

let cachedIndex = null;

function actionCost(entry) {
  const type = foundry.utils.getProperty(entry, "system.actionType.value");
  const actions = foundry.utils.getProperty(entry, "system.actions.value");

  if (type === "reaction") return "R";
  if (type === "free") return "F";
  if (type === "action") return actions ? String(actions) : "A";
  return "";
}

function sourceSlug(entry) {
  return (
    foundry.utils.getProperty(entry, "system.slug") ??
    entry.slug ??
    null
  );
}

function parseTranslatedName(name, originalName = null) {
  const full = String(name ?? "Action").trim();
  const original = String(originalName ?? "").trim();

  if (original && full.endsWith(`(${original})`)) {
    return {
      frenchName: full.slice(0, -(original.length + 2)).trim(),
      englishName: original
    };
  }

  const match = full.match(/^(.*?)\s+\(([^()]+)\)$/);
  if (match) {
    return {
      frenchName: match[1].trim(),
      englishName: original || match[2].trim()
    };
  }

  return {
    frenchName: full,
    englishName: original || ""
  };
}

function makeEntry(entry) {
  const id = entry._id ?? entry.id;
  const slug = sourceSlug(entry);
  const kind = getCatalogueKind(slug);

  if (!id || !slug || !kind) return null;

  const originalName =
    foundry.utils.getProperty(entry, "flags.babele.originalName") ??
    null;

  const names = parseTranslatedName(entry.name, originalName);

  return {
    id,
    uuid: `Compendium.${PACK_ID}.Item.${id}`,
    name: entry.name ?? "Action",
    frenchName: names.frenchName,
    englishName: names.englishName,
    img: entry.img ?? "icons/svg/d20-grey.svg",
    slug,
    kind,
    groups: kind === "skill" ? getSkillGroupsForSlug(slug) : ["Actions de base"],
    actionCost: actionCost(entry)
  };
}

function sortEntries(entries) {
  const basicOrder = new Map(
    BASIC_ACTION_SLUGS.map((slug, index) => [slug, index])
  );

  return entries.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "basic" ? -1 : 1;

    if (a.kind === "basic") {
      return (
        (basicOrder.get(a.slug) ?? 999) -
        (basicOrder.get(b.slug) ?? 999)
      );
    }

    return a.frenchName.localeCompare(b.frenchName, game.i18n.lang);
  });
}

export function getActionPack() {
  return game.packs.get(PACK_ID) ?? null;
}

export async function getGeneralActionIndex({ refresh = false } = {}) {
  if (cachedIndex && !refresh) return cachedIndex;

  const pack = getActionPack();
  if (!pack) {
    throw new Error(`Compendium introuvable : ${PACK_ID}`);
  }

  let index = await pack.getIndex({
    fields: [
      "name",
      "img",
      "type",
      "system.slug",
      "system.actionType.value",
      "system.actions.value",
      "flags.babele.originalName"
    ]
  });

  let entries = Array.from(index)
    .filter(entry => entry.type === "action")
    .filter(entry => GENERAL_ACTION_SLUG_SET.has(sourceSlug(entry)))
    .map(makeEntry)
    .filter(Boolean);

  // Some compendium-index implementations omit system.slug or nested flags.
  // Loading the 84 relevant documents once is a safe fallback.
  if (entries.length < GENERAL_ACTION_SLUG_SET.size) {
    const documents = await pack.getDocuments();

    entries = documents
      .filter(document =>
        document.type === "action" &&
        GENERAL_ACTION_SLUG_SET.has(document.slug ?? document.system?.slug)
      )
      .map(document =>
        makeEntry({
          _id: document.id,
          name: document.name,
          img: document.img,
          type: document.type,
          slug: document.slug,
          system: document.system,
          flags: document.flags
        })
      )
      .filter(Boolean);
  }

  // One entry per system slug. Skill actions can later appear in several
  // skill sections without duplicating the underlying action.
  const unique = new Map();
  for (const entry of entries) unique.set(entry.slug, entry);

  cachedIndex = sortEntries(Array.from(unique.values()));

  console.log(
    `PF2e Val Toolkit | Actions guidées : ${cachedIndex.length} actions générales chargées`
  );

  return cachedIndex;
}

export async function getActionDocument(id) {
  const pack = getActionPack();
  return pack?.getDocument(id) ?? null;
}

export function clearGeneralActionIndexCache() {
  cachedIndex = null;
}
