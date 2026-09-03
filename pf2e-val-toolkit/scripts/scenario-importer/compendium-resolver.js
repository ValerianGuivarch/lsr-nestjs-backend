function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function englishAlias(name) {
  const matches = [...String(name ?? "").matchAll(/\(([^()]*)\)/g)];
  return matches.map(match => match[1]).filter(Boolean);
}

async function resolveUuid(uuid) {
  if (!uuid) return null;
  const document = await fromUuid(uuid);
  if (!document) return null;
  return {
    status: "resolved",
    uuid,
    document,
    name: document.name,
    pack: document.pack ?? null
  };
}

function typeMatches(entry, definition) {
  const wanted = definition.actorType ?? definition.documentSubtype ?? null;
  if (!wanted) return ["npc", "hazard"].includes(entry.type);
  return entry.type === wanted;
}

export async function findActorInCompendiums(definition) {
  if (definition.uuid) {
    const direct = await resolveUuid(definition.uuid);
    if (direct) return [direct];
  }

  const lookup = definition.lookup ?? definition.name;
  const target = normalize(lookup);

  const actorPacks = game.packs
    .filter(pack => pack.documentName === "Actor")
    .sort((a, b) => {
      const aPreferred = a.collection === definition.preferredPack ? 0 : 1;
      const bPreferred = b.collection === definition.preferredPack ? 0 : 1;
      if (aPreferred !== bPreferred) return aPreferred - bPreferred;

      const aPf2e = a.metadata?.packageName === "pf2e" ? 0 : 1;
      const bPf2e = b.metadata?.packageName === "pf2e" ? 0 : 1;
      return aPf2e - bPf2e;
    });

  const exact = [];
  const aliases = [];
  const contains = [];

  for (const pack of actorPacks) {
    const index = await pack.getIndex({
      fields: ["name", "type", "system.details.level.value"]
    });

    for (const entry of index) {
      if (!typeMatches(entry, definition)) continue;

      const uuid = `Compendium.${pack.collection}.${entry._id}`;
      const result = { pack, entry, uuid };
      const normalizedEntry = normalize(entry.name);

      if (normalizedEntry === target) {
        exact.push(result);
        continue;
      }

      if (englishAlias(entry.name).some(alias => normalize(alias) === target)) {
        aliases.push(result);
        continue;
      }

      if (normalizedEntry.includes(target)) contains.push(result);
    }
  }

  if (exact.length) return exact;
  if (aliases.length) return aliases;
  return contains;
}
