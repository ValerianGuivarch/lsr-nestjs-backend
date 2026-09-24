const MODULE_ID = "pf2e-val-toolkit";

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function number(value, fallback = null) {
  const result = Number(value);
  return Number.isFinite(result) ? result : fallback;
}

function strings(value) {
  return Array.isArray(value)
    ? value.filter(item => typeof item === "string" && item.trim()).map(item => item.trim())
    : [];
}

function object(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function iwrImmunities(value) {
  return Array.isArray(value)
    ? value.map(item => {
        if (typeof item === "string") return { type: item, exceptions: [] };
        const source = object(item);
        return {
          type: text(source.type),
          exceptions: strings(source.exceptions)
        };
      }).filter(item => item.type)
    : [];
}

function iwrNumeric(value) {
  return Array.isArray(value)
    ? value.map(item => {
        const source = object(item);
        const amount = number(source.value);
        if (!text(source.type) || amount == null || amount <= 0) return null;
        return {
          type: text(source.type),
          value: amount,
          exceptions: strings(source.exceptions),
          ...(Array.isArray(source.doubleVs) ? { doubleVs: strings(source.doubleVs) } : {})
        };
      }).filter(Boolean)
    : [];
}

function speedSource(value) {
  if (Number.isFinite(Number(value))) {
    return {
      value: Number(value),
      otherSpeeds: [],
      details: ""
    };
  }

  const speed = object(value);
  const land = number(speed.land, 25);
  const otherSpeeds = ["burrow", "climb", "fly", "swim"]
    .map(type => {
      const amount = number(speed[type]);
      return amount != null && amount > 0 ? { type, value: amount } : null;
    })
    .filter(Boolean);

  return {
    value: land,
    otherSpeeds,
    details: text(speed.details)
  };
}

// PF2_SKILL_LABEL_FIX_V1
function skillLabel(slug, raw = {}) {
  const explicit = text(object(raw).label);
  if (explicit) return explicit;

  const configured = globalThis.CONFIG?.PF2E?.skills?.[slug]?.label;
  if (typeof configured === "string" && configured.trim()) {
    const localized = globalThis.game?.i18n?.localize?.(configured);
    if (typeof localized === "string" && localized.trim()) return localized.trim();
    return configured.trim();
  }

  return String(slug)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

function skillsSource(value) {
  const source = object(value);
  return Object.fromEntries(
    Object.entries(source)
      .map(([slug, raw]) => {
        if (Number.isFinite(Number(raw))) {
          return [slug, {
            base: Number(raw),
            label: skillLabel(slug),
            note: "",
            special: []
          }];
        }
        const skill = object(raw);
        const base = number(skill.base ?? skill.modifier ?? skill.value);
        if (base == null) return null;
        return [slug, {
          base,
          label: skillLabel(slug, skill),
          note: text(skill.note),
          special: Array.isArray(skill.special)
            ? skill.special.map(entry => {
                const item = object(entry);
                const specialBase = number(item.base);
                return text(item.label) && specialBase != null
                  ? { label: text(item.label), base: specialBase }
                  : null;
              }).filter(Boolean)
            : []
        }];
      })
      .filter(Boolean)
  );
}

function abilitiesSource(value) {
  const source = object(value);
  const result = {};
  for (const ability of ["str", "dex", "con", "int", "wis", "cha"]) {
    const modifier = number(source[ability]);
    if (modifier != null) result[ability] = { mod: modifier };
  }
  return result;
}

function attackItem(attack, index) {
  const source = object(attack);
  const name = text(source.name) || `Attaque ${index + 1}`;
  const bonus = number(source.bonus, 0);
  const damage = Array.isArray(source.damage) ? source.damage : [];
  const damageRolls = {};
  damage.forEach((entry, damageIndex) => {
    const item = object(entry);
    const formula = text(item.formula);
    const type = text(item.type ?? item.damageType);
    if (!formula || !type) return;
    damageRolls[`damage-${damageIndex + 1}`] = {
      damage: formula,
      damageType: type
    };
  });

  return {
    name,
    type: "melee",
    img: text(source.image) || "systems/pf2e/icons/default-icons/melee.svg",
    flags: {
      [MODULE_ID]: {
        scenarioManagedItem: true,
        scenarioManagedKind: "attack"
      }
    },
    system: {
      attack: { value: "" },
      attackEffects: { value: strings(source.effects) },
      bonus: { value: bonus },
      damageRolls,
      description: { value: text(source.description) },
      range: number(source.range) != null ? { increment: Number(source.range) } : null,
      rules: [],
      slug: null,
      traits: { value: strings(source.traits) }
    }
  };
}

function actionItem(ability, index) {
  const source = object(ability);
  const actionType = ["action", "reaction", "free", "passive"].includes(source.actionType)
    ? source.actionType
    : "passive";
  const actionCount = actionType === "action" ? Math.max(1, Math.min(3, Math.trunc(number(source.actions, 1)))) : null;
  const category = ["offensive", "defensive", "interaction"].includes(source.category)
    ? source.category
    : "interaction";
  const frequency = object(source.frequency);
  const frequencyMax = number(frequency.max);

  return {
    name: text(source.name) || `Capacité ${index + 1}`,
    type: "action",
    img: text(source.image) || (
      actionType === "reaction"
        ? "systems/pf2e/icons/actions/Reaction.webp"
        : actionType === "free"
          ? "systems/pf2e/icons/actions/FreeAction.webp"
          : actionType === "action"
            ? "systems/pf2e/icons/actions/OneAction.webp"
            : "systems/pf2e/icons/actions/Passive.webp"
    ),
    flags: {
      [MODULE_ID]: {
        scenarioManagedItem: true,
        scenarioManagedKind: "ability"
      }
    },
    system: {
      actionType: { value: actionType },
      actions: { value: actionCount },
      category,
      description: { value: text(source.description) },
      ...(frequencyMax != null && frequencyMax > 0
        ? { frequency: { max: frequencyMax, value: frequencyMax, per: text(frequency.per) || "day" } }
        : {}),
      rules: Array.isArray(source.rules) ? source.rules : [],
      slug: null,
      traits: { value: strings(source.traits), rarity: text(source.rarity) || "common" }
    }
  };
}

function rawItem(item) {
  const source = foundry.utils.deepClone(object(item));
  delete source._id;
  source.flags ??= {};
  source.flags[MODULE_ID] = {
    ...(source.flags[MODULE_ID] ?? {}),
    scenarioManagedItem: true,
    scenarioManagedKind: "raw"
  };
  return source;
}

export function customNpcSource(definition = {}, metadata = {}) {
  const data = object(definition.data);
  const mode = text(data.mode) || "legacy";
  const image = text(definition.image);
  const level = number(data.level, 0);
  const ac = number(data.ac, 10);
  const hp = number(data.hp, 1);
  const perception = number(data.perception, 0);
  const saves = object(data.saves);

  const system = {
    details: {
      level: { value: level },
      alliance: text(data.alliance) || "opposition"
    },
    attributes: {
      ac: { value: ac, details: text(data.acDetails) },
      hp: { value: hp, max: hp, details: text(data.hpDetails) }
    }
  };

  if (mode === "statblock") {
    system.perception = {
      mod: perception,
      details: text(data.perceptionDetails),
      senses: Array.isArray(data.senses) ? data.senses : [],
      vision: data.vision !== false
    };
    system.saves = {
      fortitude: { value: number(saves.fortitude, 0), saveDetail: "" },
      reflex: { value: number(saves.reflex, 0), saveDetail: "" },
      will: { value: number(saves.will, 0), saveDetail: "" }
    };
    system.skills = skillsSource(data.skills);
    system.attributes.speed = speedSource(data.speed);
    system.attributes.immunities = iwrImmunities(data.immunities);
    system.attributes.weaknesses = iwrNumeric(data.weaknesses);
    system.attributes.resistances = iwrNumeric(data.resistances);
    system.attributes.allSaves = { value: text(data.allSaves) };

    const traits = strings(data.traits);
    system.traits = {
      value: traits,
      rarity: text(data.rarity) || "common",
      size: { value: text(data.size) || "med" }
    };
    const abilities = abilitiesSource(data.abilityModifiers);
    if (Object.keys(abilities).length) system.abilities = abilities;
  }

  const flags = {
    [MODULE_ID]: {
      managedByScenarioImporter: true,
      scenarioActorKey: definition.key ?? null,
      scenarioId: metadata.scenarioId ?? null,
      packageVersion: metadata.packageVersion ?? null,
      actorMode: mode
    }
  };

  const actorData = {
    name: definition.name,
    type: "npc",
    folder: metadata.folderId ?? null,
    system,
    flags
  };

  if (image) {
    actorData.img = image;
    actorData.prototypeToken = { texture: { src: image } };
  }

  const items = [
    ...(Array.isArray(data.attacks) ? data.attacks.map(attackItem) : []),
    ...(Array.isArray(data.abilities) ? data.abilities.map(actionItem) : []),
    ...(Array.isArray(data.items) ? data.items.map(rawItem) : [])
  ];

  return { actorData, items, mode };
}

function scenarioImageUpdate(definition = {}) {
  const image = text(definition.image);
  if (!image) return null;

  return {
    img: image,
    "prototypeToken.texture.src": image
  };
}

async function applyScenarioImage(actor, definition = {}) {
  const update = scenarioImageUpdate(definition);
  if (!update) return false;

  const currentPortrait = actor.img ?? "";
  const currentToken = actor.prototypeToken?.texture?.src ?? "";

  if (
    currentPortrait === update.img &&
    currentToken === update["prototypeToken.texture.src"]
  ) {
    return false;
  }

  await actor.update(update);
  return true;
}

function managedVersion(actor) {
  return number(actor.getFlag(MODULE_ID, "packageVersion"), 0) ?? 0;
}

function mechanicallySparse(actor) {
  const hp = number(actor.system?.attributes?.hp?.max, 0) ?? 0;
  const ac = number(actor.system?.attributes?.ac?.value, 0) ?? 0;
  const skillCount = Object.keys(actor._source?.system?.skills ?? {}).length;
  const itemCount = actor.items?.filter(item => ["melee", "action", "spell", "spellcastingEntry"].includes(item.type)).length ?? 0;
  return hp <= 1 || ac <= 10 || (skillCount === 0 && itemCount === 0);
}

function canRefreshManagedActor(actor, definition, metadata = {}) {
  if (!actor) return false;
  const incomingVersion = number(metadata.packageVersion, 0) ?? 0;
  if (actor.getFlag(MODULE_ID, "managedByScenarioImporter")) {
    return incomingVersion > managedVersion(actor);
  }

  // Compatibility with v1-v3 imports: only take over an obviously sparse
  // Actor that sits in the target scenario folder. A manually completed Actor
  // is left untouched.
  return Boolean(
    metadata.folderId &&
    actor.folder?.id === metadata.folderId &&
    mechanicallySparse(actor) &&
    (
      actor.getFlag(MODULE_ID, "scenarioActorKey") === definition.key ||
      actor.name === definition.name
    )
  );
}

async function replaceManagedItems(actor, items) {
  const managed = actor.items?.filter(item => item.getFlag(MODULE_ID, "scenarioManagedItem")) ?? [];
  if (managed.length) {
    await actor.deleteEmbeddedDocuments("Item", managed.map(item => item.id));
  }
  if (items.length) {
    await actor.createEmbeddedDocuments("Item", items);
  }
}

async function refreshCustomActor(actor, definition, metadata) {
  const built = customNpcSource(definition, {
    ...metadata,
    folderId: actor.folder?.id ?? metadata.folderId
  });
  const update = {
    name: definition.name,
    system: built.actorData.system,
    flags: {
      [MODULE_ID]: built.actorData.flags[MODULE_ID]
    },
    ...(built.actorData.img ? { img: built.actorData.img } : {}),
    ...(built.actorData.prototypeToken ? { prototypeToken: built.actorData.prototypeToken } : {})
  };
  await actor.update(update);
  await replaceManagedItems(actor, built.items);
  return built;
}

export async function createCustomNpc(definition, folder, metadata = {}) {
  const actorKey = definition.key ?? null;
  const existing = game.actors.find(actor =>
    (
      actor.getFlag(MODULE_ID, "scenarioId") === metadata.scenarioId &&
      actor.getFlag(MODULE_ID, "scenarioActorKey") === actorKey
    ) || (
      actor.folder?.id === folder.id &&
      actor.name === definition.name
    )
  );

  const fullMetadata = {
    ...metadata,
    folderId: folder.id
  };

  if (existing) {
    if (canRefreshManagedActor(existing, definition, fullMetadata)) {
      await refreshCustomActor(existing, definition, fullMetadata);
      return { status: "updated", actor: existing };
    }
    await applyScenarioImage(existing, definition);
    return { status: "existing", actor: existing };
  }

  const built = customNpcSource(definition, fullMetadata);
  const actor = await Actor.create(built.actorData);
  if (built.items.length) await actor.createEmbeddedDocuments("Item", built.items);

  return { status: "created", actor };
}

export async function refreshNarrativeActor(actor, definition, folder, metadata = {}) {
  const actorDefinition = {
    ...definition.actor,
    key: definition.key,
    name: definition.name,
    image: definition.image
  };
  if (actorDefinition.type !== "custom") {
    await applyScenarioImage(actor, definition);
    return { status: "existing", actor };
  }

  const fullMetadata = { ...metadata, folderId: folder.id };
  if (!canRefreshManagedActor(actor, actorDefinition, fullMetadata)) {
    await applyScenarioImage(actor, definition);
    return { status: "existing", actor };
  }

  await refreshCustomActor(actor, actorDefinition, fullMetadata);
  return { status: "updated", actor };
}

export async function linkNarrativeNpc(actor, npcId, definition = {}) {
  if (!npcId) throw new Error("npcId narratif manquant.");
  await actor.setFlag(MODULE_ID, "npcId", npcId);
  await actor.setFlag(MODULE_ID, "scenarioActorKey", definition.key ?? null);
  return actor;
}

export async function importCompendiumActor(sourceActor, folder, definition = {}) {
  const sourceUuid = sourceActor.uuid;

  const existing = game.actors.find(actor =>
    actor.folder?.id === folder.id &&
    actor.getFlag(MODULE_ID, "sourceUuid") === sourceUuid
  );

  if (existing) {
    await applyScenarioImage(existing, definition);
    return { status: "existing", actor: existing };
  }

  const actorData = sourceActor.toObject();

  delete actorData._id;
  actorData.folder = folder.id;

  if (definition.name) actorData.name = definition.name;

  const image = text(definition.image);
  if (image) {
    actorData.img = image;
    actorData.prototypeToken ??= {};
    actorData.prototypeToken.texture ??= {};
    actorData.prototypeToken.texture.src = image;
  } else if (actorData.img && !actorData.prototypeToken?.texture?.src) {
    actorData.prototypeToken ??= {};
    actorData.prototypeToken.texture ??= {};
    actorData.prototypeToken.texture.src = actorData.img;
  }

  actorData.flags ??= {};
  actorData.flags[MODULE_ID] = {
    ...(actorData.flags[MODULE_ID] ?? {}),
    sourceUuid,
    managedByScenarioImporter: true,
    scenarioActorKey: definition.key ?? null,
    scenarioId: definition.scenarioId ?? null,
    packageVersion: definition.packageVersion ?? null,
    actorMode: "reference"
  };

  actorData._stats ??= {};
  actorData._stats.compendiumSource ??= sourceUuid;

  const actor = await Actor.create(actorData);

  return { status: "created", actor };
}
