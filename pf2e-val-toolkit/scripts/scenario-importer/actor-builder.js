function scenarioImageUpdate(definition = {}) {
  const image = String(definition.image ?? "").trim();
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

export async function createCustomNpc(definition, folder) {
  const existing = game.actors.find(
    actor => actor.folder?.id === folder.id && actor.name === definition.name
  );

  if (existing) {
    await applyScenarioImage(existing, definition);
    return { status: "existing", actor: existing };
  }

  const data = definition.data ?? {};
  const image = String(definition.image ?? "").trim();

  const actorData = {
    name: definition.name,
    type: "npc",
    folder: folder.id,
    system: {
      details: { level: { value: data.level ?? 0 } },
      attributes: {
        ac: { value: data.ac ?? 10 },
        hp: { value: data.hp ?? 1, max: data.hp ?? 1 }
      }
    }
  };

  if (image) {
    actorData.img = image;
    actorData.prototypeToken = {
      texture: { src: image }
    };
  }

  const actor = await Actor.create(actorData);

  return { status: "created", actor };
}

export async function linkNarrativeNpc(actor, npcId, definition = {}) {
  if (!npcId) throw new Error("npcId narratif manquant.");
  await actor.setFlag("pf2e-val-toolkit", "npcId", npcId);
  await actor.setFlag("pf2e-val-toolkit", "scenarioActorKey", definition.key ?? null);
  return actor;
}

export async function importCompendiumActor(sourceActor, folder, definition = {}) {
  const sourceUuid = sourceActor.uuid;

  const existing = game.actors.find(actor =>
    actor.folder?.id === folder.id &&
    actor.getFlag("pf2e-val-toolkit", "sourceUuid") === sourceUuid
  );

  if (existing) {
    // Re-importing a scenario now also refreshes an explicit scenario image.
    // This is intentional: the compendium remains the source of mechanics,
    // while the scenario JSON can provide the official adventure artwork.
    await applyScenarioImage(existing, definition);

    return {
      status: "existing",
      actor: existing
    };
  }

  const actorData = sourceActor.toObject();

  delete actorData._id;
  actorData.folder = folder.id;

  // The scenario file controls the world-facing display name. This lets us
  // resolve an English compendium entry while keeping the imported Actor and
  // all Journal links in French.
  if (definition.name) {
    actorData.name = definition.name;
  }

  // Optional official scenario art. We override only the portrait and
  // prototype-token texture; every mechanical field still comes from PF2e.
  const image = String(definition.image ?? "").trim();
  if (image) {
    // Scenario package art is the default from creation: portrait + token.
    actorData.img = image;
    actorData.prototypeToken ??= {};
    actorData.prototypeToken.texture ??= {};
    actorData.prototypeToken.texture.src = image;
  } else if (
    actorData.img &&
    !actorData.prototypeToken?.texture?.src
  ) {
    // JSON-only imports preserve PF2e art; use the portrait as token fallback
    // only when the source Actor has no prototype-token texture.
    actorData.prototypeToken ??= {};
    actorData.prototypeToken.texture ??= {};
    actorData.prototypeToken.texture.src = actorData.img;
  }

  actorData.flags ??= {};
  actorData.flags["pf2e-val-toolkit"] = {
    ...(actorData.flags["pf2e-val-toolkit"] ?? {}),
    sourceUuid,
    scenarioActorKey: definition.key ?? null,
    scenarioId: definition.scenarioId ?? null
  };

  // Preserve the compendium origin for traceability, but create a true world Actor.
  actorData._stats ??= {};
  actorData._stats.compendiumSource ??= sourceUuid;

  const actor = await Actor.create(actorData);

  return {
    status: "created",
    actor
  };
}
