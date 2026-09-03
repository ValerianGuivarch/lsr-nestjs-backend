function finiteNumber(value) {
  return Number.isFinite(Number(value));
}

function positiveNumber(value) {
  return (
    finiteNumber(value) &&
    Number(value) > 0
  );
}

function hasAnyMeasuredGridField(grid) {
  return Boolean(
    grid?.columns != null ||
    grid?.rows != null ||
    grid?.bounds?.x != null ||
    grid?.bounds?.y != null ||
    grid?.bounds?.width != null ||
    grid?.bounds?.height != null
  );
}

function validateMeasuredGrid(
  grid,
  prefix,
  errors
) {
  if (!positiveNumber(grid?.columns)) {
    errors.push(
      `${prefix}.columns doit être un nombre positif.`
    );
  }

  if (!positiveNumber(grid?.rows)) {
    errors.push(
      `${prefix}.rows doit être un nombre positif.`
    );
  }

  if (
    !grid?.bounds ||
    typeof grid.bounds !== "object"
  ) {
    errors.push(
      `${prefix}.bounds est manquant.`
    );
    return;
  }

  if (!finiteNumber(grid.bounds.x)) {
    errors.push(
      `${prefix}.bounds.x doit être numérique.`
    );
  }

  if (!finiteNumber(grid.bounds.y)) {
    errors.push(
      `${prefix}.bounds.y doit être numérique.`
    );
  }

  if (
    !positiveNumber(
      grid.bounds.width
    )
  ) {
    errors.push(
      `${prefix}.bounds.width doit être un nombre positif.`
    );
  }

  if (
    !positiveNumber(
      grid.bounds.height
    )
  ) {
    errors.push(
      `${prefix}.bounds.height doit être un nombre positif.`
    );
  }
}

export function validateScenarioData(data) {
  const errors = [];

  if (!data || typeof data !== "object") {
    errors.push(
      "Le fichier ne contient pas un objet JSON valide."
    );
    return errors;
  }

  if (!data.scenario?.id) {
    errors.push(
      "Champ manquant : scenario.id"
    );
  }

  if (!data.scenario?.name) {
    errors.push(
      "Champ manquant : scenario.name"
    );
  }

  if (data.packageVersion != null && (!Number.isInteger(data.packageVersion) || data.packageVersion < 1)) {
    errors.push("packageVersion doit être un entier positif.");
  }
  if (data.npcs != null && !Array.isArray(data.npcs)) {
    errors.push("Le champ npcs doit être un tableau.");
  }
  for (const [index, npc] of (data.npcs ?? []).entries()) {
    if (!npc?.key) errors.push(`npcs[${index}].key est manquant.`);
    if (!npc?.npcId && !npc?.name) errors.push(`npcs[${index}] doit contenir npcId ou name.`);
  }

  if (!Array.isArray(data.actors)) {
    errors.push(
      "Le champ actors doit être un tableau."
    );
  }

  for (
    const [index, actor]
    of (data.actors ?? []).entries()
  ) {
    if (!actor?.key) {
      errors.push(
        `actors[${index}].key est manquant.`
      );
    }

    if (!actor?.name) {
      errors.push(
        `actors[${index}].name est manquant.`
      );
    }

    if (!actor?.type) {
      errors.push(
        `actors[${index}].type est manquant.`
      );
    }

    if (
      actor?.type === "reference" &&
      !actor.uuid &&
      !actor.lookup
    ) {
      errors.push(
        `actors[${index}] doit avoir uuid ou lookup.`
      );
    }

    if (actor?.type === "narrative") {
      if (!actor.npcId) errors.push(`actors[${index}].npcId est manquant.`);
      if (!actor.actor || !["reference", "custom"].includes(actor.actor.type)) {
        errors.push(`actors[${index}].actor doit être une définition reference ou custom.`);
      }
    }

    if (
      actor?.image != null &&
      typeof actor.image !== "string"
    ) {
      errors.push(
        `actors[${index}].image doit être une chaîne.`
      );
    }
  }

  if (
    data.assets?.root != null &&
    typeof data.assets.root !== "string"
  ) {
    errors.push(
      "assets.root doit être une chaîne."
    );
  }

  if (
    data.maps != null &&
    !Array.isArray(data.maps)
  ) {
    errors.push(
      "Le champ maps doit être un tableau."
    );
  }

  const mapKeys = new Set();

  for (
    const [index, map]
    of (data.maps ?? []).entries()
  ) {
    const prefix = `maps[${index}]`;

    if (!map?.key) {
      errors.push(
        `${prefix}.key est manquant.`
      );
    } else if (mapKeys.has(map.key)) {
      errors.push(
        `${prefix}.key est dupliqué : ${map.key}.`
      );
    } else {
      mapKeys.add(map.key);
    }

    if (!map?.name && !map?.title) {
      errors.push(
        `${prefix}.name est manquant.`
      );
    }

    if (
      !map?.image ||
      typeof map.image !== "string"
    ) {
      errors.push(
        `${prefix}.image doit être une chaîne non vide.`
      );
    }

    if (
      map?.width != null &&
      !positiveNumber(map.width)
    ) {
      errors.push(
        `${prefix}.width doit être un nombre positif.`
      );
    }

    if (
      map?.height != null &&
      !positiveNumber(map.height)
    ) {
      errors.push(
        `${prefix}.height doit être un nombre positif.`
      );
    }

    const grid = map?.grid ?? {};

    if (
      grid.size != null &&
      !positiveNumber(grid.size)
    ) {
      errors.push(
        `${prefix}.grid.size doit être un nombre positif.`
      );
    }

    if (
      grid.distance != null &&
      !positiveNumber(
        grid.distance
      )
    ) {
      errors.push(
        `${prefix}.grid.distance doit être un nombre positif.`
      );
    }

    if (hasAnyMeasuredGridField(grid)) {
      validateMeasuredGrid(
        grid,
        `${prefix}.grid`,
        errors
      );
    }
  }

  for (
    const [index, encounter]
    of (data.encounters ?? []).entries()
  ) {
    if (
      encounter?.map &&
      !mapKeys.has(encounter.map)
    ) {
      errors.push(
        `encounters[${index}].map référence une carte inconnue : ${encounter.map}.`
      );
    }
  }

  return errors;
}
