function finiteNumber(value) {
  return Number.isFinite(Number(value));
}

function positiveNumber(value) {
  return finiteNumber(value) && Number(value) > 0;
}

function positiveInteger(value) {
  return Number.isInteger(Number(value)) && Number(value) > 0;
}

function object(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function packageFormatVersion(data) {
  const value = Number(data?.packageFormatVersion ?? 1);
  return Number.isInteger(value) && value > 0 ? value : 1;
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

function validateMeasuredGrid(grid, prefix, errors, strict = false) {
  if (!positiveInteger(grid?.columns)) {
    errors.push(`${prefix}.columns doit être un entier positif.`);
  }

  if (!positiveInteger(grid?.rows)) {
    errors.push(`${prefix}.rows doit être un entier positif.`);
  }

  if (!grid?.bounds || typeof grid.bounds !== "object") {
    errors.push(`${prefix}.bounds est manquant.`);
    return;
  }

  if (!finiteNumber(grid.bounds.x)) errors.push(`${prefix}.bounds.x doit être numérique.`);
  if (!finiteNumber(grid.bounds.y)) errors.push(`${prefix}.bounds.y doit être numérique.`);
  if (!positiveNumber(grid.bounds.width)) errors.push(`${prefix}.bounds.width doit être un nombre positif.`);
  if (!positiveNumber(grid.bounds.height)) errors.push(`${prefix}.bounds.height doit être un nombre positif.`);

  if (
    strict &&
    positiveInteger(grid.columns) &&
    positiveInteger(grid.rows) &&
    positiveNumber(grid.bounds.width) &&
    positiveNumber(grid.bounds.height)
  ) {
    const cellWidth = Number(grid.bounds.width) / Number(grid.columns);
    const cellHeight = Number(grid.bounds.height) / Number(grid.rows);
    const average = (cellWidth + cellHeight) / 2;
    const relativeDifference = average > 0 ? Math.abs(cellWidth - cellHeight) / average : 0;
    if (relativeDifference > 0.02) {
      errors.push(`${prefix} décrit des cases non carrées (${cellWidth.toFixed(2)} × ${cellHeight.toFixed(2)} px). Corrige les bounds ou l'image avant import.`);
    }
  }
}

function validateReference(definition, prefix, errors) {
  if (!definition?.uuid && !definition?.lookup) {
    errors.push(`${prefix} doit avoir uuid ou lookup.`);
  }
}

function validateCustom(definition, prefix, errors, strict) {
  const data = object(definition?.data);
  if (!strict) return;

  if (!data.mode || !["statblock", "narrative"].includes(data.mode)) {
    errors.push(`${prefix}.data.mode doit valoir statblock ou narrative.`);
    return;
  }

  if (data.mode === "narrative") return;

  if (!finiteNumber(data.level)) errors.push(`${prefix}.data.level est obligatoire pour un statblock.`);
  if (!positiveNumber(data.ac)) errors.push(`${prefix}.data.ac est obligatoire et doit être positif.`);
  if (!positiveNumber(data.hp)) errors.push(`${prefix}.data.hp est obligatoire et doit être positif.`);
  if (!finiteNumber(data.perception)) errors.push(`${prefix}.data.perception est obligatoire.`);
  const speed = typeof data.speed === "object" ? data.speed?.land : data.speed;
  if (!finiteNumber(speed) || Number(speed) < 0) {
    errors.push(`${prefix}.data.speed (ou speed.land) est obligatoire et doit être >= 0.`);
  }

  const saves = object(data.saves);
  for (const save of ["fortitude", "reflex", "will"]) {
    if (!finiteNumber(saves[save])) errors.push(`${prefix}.data.saves.${save} est obligatoire.`);
  }

  if (!data.skills || typeof data.skills !== "object" || Array.isArray(data.skills)) {
    errors.push(`${prefix}.data.skills doit être un objet, même vide si le bloc ne donne aucune compétence.`);
  }

  for (const [index, attack] of (Array.isArray(data.attacks) ? data.attacks : []).entries()) {
    const attackPrefix = `${prefix}.data.attacks[${index}]`;
    if (!attack?.name) errors.push(`${attackPrefix}.name est manquant.`);
    if (!finiteNumber(attack?.bonus)) errors.push(`${attackPrefix}.bonus est manquant.`);
    if (!Array.isArray(attack?.damage) || !attack.damage.length) {
      errors.push(`${attackPrefix}.damage doit contenir au moins une ligne de dégâts.`);
    } else {
      for (const [damageIndex, damage] of attack.damage.entries()) {
        if (typeof damage?.formula !== "string" || !damage.formula.trim()) errors.push(`${attackPrefix}.damage[${damageIndex}].formula est manquant.`);
        if (typeof (damage?.type ?? damage?.damageType) !== "string" || !(damage?.type ?? damage?.damageType).trim()) errors.push(`${attackPrefix}.damage[${damageIndex}].type est manquant.`);
      }
    }
  }

  for (const [index, ability] of (Array.isArray(data.abilities) ? data.abilities : []).entries()) {
    const abilityPrefix = `${prefix}.data.abilities[${index}]`;
    if (!ability?.name) errors.push(`${abilityPrefix}.name est manquant.`);
    if (typeof ability?.description !== "string" || !ability.description.trim()) errors.push(`${abilityPrefix}.description est manquant.`);
  }

  const hasMechanicalItems =
    (Array.isArray(data.attacks) && data.attacks.length > 0) ||
    (Array.isArray(data.abilities) && data.abilities.length > 0) ||
    (Array.isArray(data.items) && data.items.length > 0);
  if (!hasMechanicalItems) {
    errors.push(`${prefix} est un statblock mais ne contient ni attaque, ni capacité, ni item PF2. Un simple niveau/CA/PV n'est pas accepté.`);
  }
}

function validateActorDefinition(definition, prefix, errors, strict, inherited = {}) {
  const type = definition?.type;
  if (!inherited.key && !definition?.key) errors.push(`${prefix}.key est manquant.`);
  if (!inherited.name && !definition?.name) errors.push(`${prefix}.name est manquant.`);
  if (!type) {
    errors.push(`${prefix}.type est manquant.`);
    return;
  }

  if (type === "reference") validateReference(definition, prefix, errors);
  else if (type === "custom") validateCustom(definition, prefix, errors, strict);
  else if (type === "narrative") {
    if (!definition.npcId) errors.push(`${prefix}.npcId est manquant.`);
    if (!definition.actor || !["reference", "custom"].includes(definition.actor.type)) {
      errors.push(`${prefix}.actor doit être une définition reference ou custom.`);
    } else {
      validateActorDefinition(definition.actor, `${prefix}.actor`, errors, strict, {
        key: definition.key,
        name: definition.name
      });
    }
  } else {
    errors.push(`${prefix}.type inconnu : ${type}.`);
  }

  if (definition?.image != null && typeof definition.image !== "string") {
    errors.push(`${prefix}.image doit être une chaîne.`);
  }
}

export function validateScenarioData(data) {
  const errors = [];

  if (!data || typeof data !== "object") {
    errors.push("Le fichier ne contient pas un objet JSON valide.");
    return errors;
  }

  const formatVersion = packageFormatVersion(data);
  const strict = formatVersion >= 4;

  if (data.packageFormatVersion != null && (!Number.isInteger(data.packageFormatVersion) || data.packageFormatVersion < 1)) {
    errors.push("packageFormatVersion doit être un entier positif.");
  }
  if (!data.scenario?.id) errors.push("Champ manquant : scenario.id");
  if (!data.scenario?.name) errors.push("Champ manquant : scenario.name");
  if (data.packageVersion != null && (!Number.isInteger(data.packageVersion) || data.packageVersion < 1)) {
    errors.push("packageVersion doit être un entier positif.");
  }
  if (data.npcs != null && !Array.isArray(data.npcs)) errors.push("Le champ npcs doit être un tableau.");
  for (const [index, npc] of (data.npcs ?? []).entries()) {
    if (!npc?.key) errors.push(`npcs[${index}].key est manquant.`);
    if (!npc?.npcId && !npc?.name) errors.push(`npcs[${index}] doit contenir npcId ou name.`);
  }

  if (!Array.isArray(data.actors)) errors.push("Le champ actors doit être un tableau.");
  for (const [index, actor] of (data.actors ?? []).entries()) {
    validateActorDefinition(actor, `actors[${index}]`, errors, strict);
  }

  if (data.assets?.root != null && typeof data.assets.root !== "string") {
    errors.push("assets.root doit être une chaîne.");
  }

  if (data.maps != null && !Array.isArray(data.maps)) errors.push("Le champ maps doit être un tableau.");

  const mapKeys = new Set();
  for (const [index, map] of (data.maps ?? []).entries()) {
    const prefix = `maps[${index}]`;
    if (!map?.key) errors.push(`${prefix}.key est manquant.`);
    else if (mapKeys.has(map.key)) errors.push(`${prefix}.key est dupliqué : ${map.key}.`);
    else mapKeys.add(map.key);

    if (!map?.name && !map?.title) errors.push(`${prefix}.name est manquant.`);
    if (!map?.image || typeof map.image !== "string") errors.push(`${prefix}.image doit être une chaîne non vide.`);
    if (map?.width != null && !positiveNumber(map.width)) errors.push(`${prefix}.width doit être un nombre positif.`);
    if (map?.height != null && !positiveNumber(map.height)) errors.push(`${prefix}.height doit être un nombre positif.`);

    const grid = map?.grid ?? {};
    const gridType = String(grid.type ?? "square").toLowerCase();
    if (grid.size != null && !positiveNumber(grid.size)) errors.push(`${prefix}.grid.size doit être un nombre positif.`);
    if (grid.distance != null && !positiveNumber(grid.distance)) errors.push(`${prefix}.grid.distance doit être un nombre positif.`);

    if (gridType === "gridless") continue;

    if (strict) {
      if (!hasAnyMeasuredGridField(grid)) {
        errors.push(`${prefix} utilise une grille carrée mais ne fournit pas grid.columns/rows/bounds. Le format v4 exige une grille mesurée.`);
      }
      if (grid.paddingCells !== 1) {
        errors.push(`${prefix}.grid.paddingCells doit valoir 1 : une case de marge de chaque côté.`);
      }
    }

    if (hasAnyMeasuredGridField(grid)) validateMeasuredGrid(grid, `${prefix}.grid`, errors, strict);
  }

  for (const [index, encounter] of (data.encounters ?? []).entries()) {
    if (encounter?.map && !mapKeys.has(encounter.map)) {
      errors.push(`encounters[${index}].map référence une carte inconnue : ${encounter.map}.`);
    }
  }

  return errors;
}
