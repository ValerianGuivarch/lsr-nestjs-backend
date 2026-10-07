const XP_BY_DELTA = new Map([
  [-4, 10],
  [-3, 15],
  [-2, 20],
  [-1, 30],
  [0, 40],
  [1, 60],
  [2, 80],
  [3, 120],
  [4, 160]
]);

const THREATS = Object.freeze({
  trivial: { label: "Triviale", budget: 40, adjustment: 10 },
  low: { label: "Faible", budget: 60, adjustment: 20 },
  moderate: { label: "Modérée", budget: 80, adjustment: 20 },
  severe: { label: "Sévère", budget: 120, adjustment: 30 },
  extreme: { label: "Extrême", budget: 160, adjustment: 40 }
});

const COMPOSITIONS = Object.freeze({
  auto: "Automatique",
  boss: "Boss + renforts",
  balanced: "Groupe équilibré",
  horde: "Horde de faibles",
  custom: "Composition personnalisée"
});

const SCOPE_LABELS = Object.freeze({
  core: "Bestiaires principaux + NPC Core",
  compendiums: "Tous les compendiums",
  all: "Compendiums + PNJ du monde"
});

function escapeHtml(value) {
  return foundry.utils.escapeHTML(String(value ?? ""));
}

function intValue(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function partyDefaults() {
  const actors = game.pf2eValToolkit?.activeParty?.getActors?.() ?? [];
  const levels = actors
    .map((actor) => Number(actor.system?.details?.level?.value))
    .filter(Number.isFinite);

  const fallbackSelected = (canvas.tokens?.controlled ?? [])
    .map((token) => token.actor)
    .filter((actor) => actor?.type === "character");

  const size = actors.length || fallbackSelected.length || 4;
  const fallbackLevels = fallbackSelected
    .map((actor) => Number(actor.system?.details?.level?.value))
    .filter(Number.isFinite);
  const usedLevels = levels.length ? levels : fallbackLevels;
  const level = usedLevels.length
    ? Math.round(usedLevels.reduce((sum, value) => sum + value, 0) / usedLevels.length)
    : 1;

  return { actors, levels: usedLevels, size, level };
}

function selectedNpcTokens() {
  return (canvas.tokens?.controlled ?? [])
    .map((token) => token.document)
    .filter((token) => token?.actor?.type === "npc");
}

function encounterBudget(threat, partySize) {
  const config = THREATS[threat] ?? THREATS.moderate;
  return Math.max(0, config.budget + (partySize - 4) * config.adjustment);
}

function xpForLevel(level, partyLevel) {
  return XP_BY_DELTA.get(Number(level) - Number(partyLevel)) ?? null;
}

function traitLabel(trait) {
  const config = CONFIG.PF2E?.creatureTraits?.[trait];
  const label = typeof config === "string" ? config : config?.label;
  return label ? game.i18n.localize(label) : trait;
}

function randomItem(items) {
  return items.length ? items[Math.floor(Math.random() * items.length)] : null;
}

function rarityFilter(mode) {
  if (mode === "common") return ["common"];
  if (mode === "standard") return ["common", "uncommon"];
  return [];
}

function preferredDeltas(composition, threat) {
  if (composition === "boss") return [2, 1, 3, 0, -1, -2, -3, -4];
  if (composition === "horde") return [-4, -3, -2, -1, 0];
  if (composition === "balanced") return [0, -1, -2, 1, -3, -4, 2];

  if (threat === "trivial") return [-3, -4, -2, -1];
  if (threat === "low") return [-2, -3, -4, -1, 0];
  if (threat === "severe") return [2, 0, -2, 1, -1, -4, -3];
  if (threat === "extreme") return [3, 1, 0, 2, -1, -2, -3, -4, 4];
  return [0, -2, -1, -3, 1, -4];
}

function chooseCandidate(candidates, partyLevel, deltas, remainingXp = Infinity, excludeKey = null) {
  for (const delta of deltas) {
    const xp = XP_BY_DELTA.get(delta);
    if (xp == null || xp > remainingXp) continue;

    const matching = candidates.filter((entry) =>
      entry.level - partyLevel === delta && entry.key !== excludeKey
    );
    if (matching.length) return randomItem(matching);
  }
  return null;
}

function customCategoryDeltas(category) {
  if (category === "strong") return [2, 1];
  if (category === "medium") return [0, -1];
  return [-2, -3, -4];
}

async function candidatePool(options) {
  const index = game.pf2eValToolkit?.creatureIndex;
  if (!index) throw new Error("Index des créatures indisponible.");

  return index.search({
    minLevel: options.partyLevel - 4,
    maxLevel: options.partyLevel + 4,
    traits: options.trait ? [options.trait] : [],
    query: options.query,
    scope: options.scope,
    rarities: rarityFilter(options.rarity)
  });
}

function fixedEntries(tokens, partyLevel) {
  return tokens.map((token) => {
    const level = Number(token.actor?.system?.details?.level?.value);
    const xp = xpForLevel(level, partyLevel);
    if (xp == null) {
      throw new Error(
        `${token.name} est niveau ${level}, hors de la plage niveau du groupe ±4.`
      );
    }
    return {
      fixed: true,
      tokenId: token.id,
      name: token.name,
      level,
      xp,
      entry: null
    };
  });
}

function addGenerated(result, entry, partyLevel) {
  const xp = xpForLevel(entry.level, partyLevel);
  if (xp == null) return false;
  result.push({
    fixed: false,
    tokenId: null,
    name: entry.name,
    level: entry.level,
    xp,
    entry
  });
  return true;
}

function buildCustom(pool, options, result) {
  for (const [category, count] of [
    ["strong", options.strong],
    ["medium", options.medium],
    ["weak", options.weak]
  ]) {
    const deltas = customCategoryDeltas(category);
    for (let index = 0; index < count; index += 1) {
      const entry = chooseCandidate(pool, options.partyLevel, deltas);
      if (!entry) continue;
      addGenerated(result, entry, options.partyLevel);
    }
  }
}

function fillToBudget(pool, options, result, targetBudget) {
  let total = result.reduce((sum, item) => sum + item.xp, 0);
  const maxCreatures = 16;
  let guard = 0;

  if (options.composition === "boss" && total < targetBudget && result.filter((x) => !x.fixed).length === 0) {
    const reserveForReinforcements = targetBudget >= 60 ? 20 : 0;
    const boss = chooseCandidate(
      pool,
      options.partyLevel,
      [3, 2, 1, 0, -1, -2],
      Math.max(0, targetBudget - total - reserveForReinforcements)
    );
    if (boss) {
      addGenerated(result, boss, options.partyLevel);
      total += xpForLevel(boss.level, options.partyLevel);
    }
  }

  while (total < targetBudget && result.length < maxCreatures && guard < 50) {
    guard += 1;
    const remaining = targetBudget - total;
    const priorities = preferredDeltas(options.composition, options.threat)
      .filter((delta) => (XP_BY_DELTA.get(delta) ?? Infinity) <= remaining);

    if (!priorities.length) break;

    const entry = chooseCandidate(pool, options.partyLevel, priorities, remaining);
    if (!entry) break;

    addGenerated(result, entry, options.partyLevel);
    total += xpForLevel(entry.level, options.partyLevel);
  }
}

async function generateEncounter(options, selectedTokens) {
  const targetBudget = encounterBudget(options.threat, options.partySize);
  if (targetBudget <= 0) throw new Error("Le budget de rencontre calculé est nul.");

  const pool = await candidatePool(options);
  if (!pool.length) {
    throw new Error("Aucune créature ne correspond aux filtres choisis.");
  }

  const fixed = options.includeSelected ? fixedEntries(selectedTokens, options.partyLevel) : [];
  const result = [...fixed];
  const fixedXp = fixed.reduce((sum, item) => sum + item.xp, 0);

  if (fixedXp > targetBudget) {
    throw new Error(
      `Les PNJ sélectionnés valent déjà ${fixedXp} XP pour un budget de ${targetBudget} XP.`
    );
  }

  if (options.composition === "custom") {
    buildCustom(pool, options, result);
  } else {
    fillToBudget(pool, options, result, targetBudget);
  }

  return {
    options,
    targetBudget,
    pool,
    entries: result,
    totalXp: result.reduce((sum, item) => sum + item.xp, 0)
  };
}

function partySummary(defaults) {
  if (!defaults.actors.length) {
    return "Aucun groupe actif : paramètres manuels préremplis.";
  }
  return defaults.actors
    .map((actor) => `${escapeHtml(actor.name)} (niv. ${Number(actor.system?.details?.level?.value ?? 0)})`)
    .join(", ");
}

async function askEncounterOptions() {
  const index = game.pf2eValToolkit?.creatureIndex;
  if (!index) {
    ui.notifications.error("L'index des créatures n'est pas disponible.");
    return null;
  }

  const defaults = partyDefaults();
  const selectedNpcs = selectedNpcTokens();
  const traits = await index.traitOptions({ scope: "compendiums" });
  const traitOptions = [
    '<option value="">— aucun trait imposé —</option>',
    ...traits.map(({ value, count }) =>
      `<option value="${escapeHtml(value)}">${escapeHtml(traitLabel(value))} (${count})</option>`
    )
  ].join("");

  const DialogV2 = foundry.applications?.api?.DialogV2;
  if (!DialogV2?.wait) return null;

  return DialogV2.wait({
    window: { title: "Improviser une rencontre" },
    classes: ["pf2e-val-improv-dialog"],
    content: `
      <form class="pf2e-val-improv-form">
        <fieldset>
          <legend>Groupe</legend>
          <p class="hint">${partySummary(defaults)}</p>
          <div class="pf2e-val-improv-grid two">
            <label>Nombre de PJ
              <input type="number" name="partySize" min="1" max="12" value="${defaults.size}">
            </label>
            <label>Niveau du groupe
              <input type="number" name="partyLevel" min="1" max="20" value="${defaults.level}">
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend>Rencontre</legend>
          <div class="pf2e-val-improv-grid two">
            <label>Difficulté
              <select name="threat">
                ${Object.entries(THREATS).map(([value, item]) =>
                  `<option value="${value}" ${value === "moderate" ? "selected" : ""}>${item.label}</option>`
                ).join("")}
              </select>
            </label>
            <label>Composition
              <select name="composition">
                ${Object.entries(COMPOSITIONS).map(([value, label]) =>
                  `<option value="${value}">${label}</option>`
                ).join("")}
              </select>
            </label>
          </div>
          <div class="pf2e-val-improv-grid three">
            <label>Fortes
              <input type="number" name="strong" min="0" max="8" value="1">
            </label>
            <label>Moyennes
              <input type="number" name="medium" min="0" max="12" value="1">
            </label>
            <label>Faibles
              <input type="number" name="weak" min="0" max="16" value="2">
            </label>
          </div>
          <p class="hint">Les nombres Fortes/Moyennes/Faibles ne sont utilisés qu'avec « Composition personnalisée ».</p>
        </fieldset>

        <fieldset>
          <legend>Filtrer le bestiaire</legend>
          <label>Thème / recherche
            <input type="text" name="query" placeholder="bandit, zombie, garde, dragon…">
          </label>
          <div class="pf2e-val-improv-grid two">
            <label>Trait
              <select name="trait">${traitOptions}</select>
            </label>
            <label>Sources
              <select name="scope">
                ${Object.entries(SCOPE_LABELS).map(([value, label]) =>
                  `<option value="${value}">${label}</option>`
                ).join("")}
              </select>
            </label>
          </div>
          <label>Rareté
            <select name="rarity">
              <option value="standard" selected>Commune + peu commune</option>
              <option value="common">Commune uniquement</option>
              <option value="all">Toutes</option>
            </select>
          </label>
        </fieldset>

        ${selectedNpcs.length ? `
          <label class="pf2e-val-improv-selected">
            <input type="checkbox" name="includeSelected" checked>
            Inclure ${selectedNpcs.length} PNJ sélectionné(s) dans le budget :
            ${selectedNpcs.map((token) => escapeHtml(token.name)).join(", ")}
          </label>
        ` : ""}
      </form>
    `,
    buttons: [
      {
        action: "generate",
        label: "Générer",
        icon: "fa-solid fa-dice",
        default: true,
        callback: (_event, button) => {
          const data = Object.fromEntries(new FormData(button.form).entries());
          return {
            partySize: intValue(data.partySize, defaults.size, 1, 12),
            partyLevel: intValue(data.partyLevel, defaults.level, 1, 20),
            threat: THREATS[data.threat] ? data.threat : "moderate",
            composition: COMPOSITIONS[data.composition] ? data.composition : "auto",
            strong: intValue(data.strong, 1, 0, 8),
            medium: intValue(data.medium, 1, 0, 12),
            weak: intValue(data.weak, 2, 0, 16),
            query: String(data.query ?? "").trim(),
            trait: String(data.trait ?? ""),
            scope: SCOPE_LABELS[data.scope] ? data.scope : "core",
            rarity: ["common", "standard", "all"].includes(data.rarity) ? data.rarity : "standard",
            includeSelected: data.includeSelected === "on"
          };
        }
      },
      {
        action: "cancel",
        label: "Annuler",
        icon: "fa-solid fa-xmark",
        callback: () => null
      }
    ],
    close: () => null
  });
}

function resultRows(encounter) {
  return encounter.entries.map((item, index) => `
    <div class="pf2e-val-improv-result-row ${item.fixed ? "fixed" : ""}">
      <div class="pf2e-val-improv-result-main">
        <strong>${escapeHtml(item.name)}</strong>
        <span>Niv. ${item.level} · ${item.xp} XP${item.fixed ? " · déjà sur la scène" : ""}</span>
      </div>
      ${item.fixed ? "" : `
        <label>Remplacer
          <input type="radio" name="replaceIndex" value="${index}">
        </label>
      `}
    </div>
  `).join("");
}

async function askPreview(encounter) {
  const DialogV2 = foundry.applications?.api?.DialogV2;
  if (!DialogV2?.wait) return null;

  const difference = encounter.targetBudget - encounter.totalXp;
  const status = difference === 0
    ? "Budget exact"
    : difference > 0
      ? `${difference} XP sous le budget`
      : `${Math.abs(difference)} XP au-dessus du budget`;

  return DialogV2.wait({
    window: { title: "Rencontre improvisée" },
    classes: ["pf2e-val-improv-preview"],
    content: `
      <form class="pf2e-val-improv-results">
        <header>
          <div>
            <strong>${THREATS[encounter.options.threat]?.label ?? encounter.options.threat}</strong>
            <span>${COMPOSITIONS[encounter.options.composition] ?? encounter.options.composition}</span>
          </div>
          <div class="pf2e-val-improv-budget">
            <strong>${encounter.totalXp} / ${encounter.targetBudget} XP</strong>
            <span>${status}</span>
          </div>
        </header>
        <div class="pf2e-val-improv-result-list">${resultRows(encounter)}</div>
        <p class="hint">
          Les PNJ déjà sélectionnés restent sur la scène. Seules les créatures générées seront ajoutées.
          Cochez une ligne avant « Remplacer » pour ne changer que cette créature.
        </p>
      </form>
    `,
    buttons: [
      {
        action: "place",
        label: "Ajouter à la scène",
        icon: "fa-solid fa-location-dot",
        default: true,
        callback: () => ({ action: "place" })
      },
      {
        action: "replace",
        label: "Remplacer",
        icon: "fa-solid fa-rotate",
        callback: (_event, button) => {
          const selected = button.form?.querySelector?.('input[name="replaceIndex"]:checked');
          return { action: "replace", index: selected ? Number(selected.value) : null };
        }
      },
      {
        action: "reroll",
        label: "Tout relancer",
        icon: "fa-solid fa-dice",
        callback: () => ({ action: "reroll" })
      },
      {
        action: "close",
        label: "Fermer",
        icon: "fa-solid fa-xmark",
        callback: () => null
      }
    ],
    close: () => null
  });
}

function existingImportedActor(entry) {
  if (!entry?.uuid) return null;
  return game.actors.find((actor) => actor._stats?.compendiumSource === entry.uuid) ?? null;
}

async function improvisationFolder() {
  const existing = game.folders?.contents?.find(
    (folder) => folder.type === "Actor" && folder.name === "Improvisation"
  );
  if (existing) return existing;

  const mj = game.folders?.contents?.find(
    (folder) => folder.type === "Actor" && folder.name === "MJ" && !folder.folder
  );

  return Folder.create({
    name: "Improvisation",
    type: "Actor",
    folder: mj?.id ?? null,
    sorting: "a"
  });
}

async function materializeActor(entry) {
  if (!entry) return null;
  if (entry.sourceKind === "world") return game.actors.get(entry.id) ?? null;

  const reused = existingImportedActor(entry);
  if (reused) return reused;

  const source = await game.pf2eValToolkit.creatureIndex.resolve(entry);
  if (!source) return null;

  const folder = await improvisationFolder();
  const data = game.actors.fromCompendium(source);
  data.folder = folder?.id ?? null;

  return Actor.implementation.create(data, { fromCompendium: true });
}

function centerPositions(count) {
  const grid = canvas.scene?.grid?.size ?? 100;
  const center = canvas.dimensions?.sceneRect?.center ?? {
    x: (canvas.scene?.width ?? grid * 10) / 2,
    y: (canvas.scene?.height ?? grid * 10) / 2
  };
  const columns = Math.max(1, Math.ceil(Math.sqrt(count)));
  const rows = Math.max(1, Math.ceil(count / columns));
  const spacing = grid * 1.5;
  const startX = center.x - ((columns - 1) * spacing) / 2;
  const startY = center.y - ((rows - 1) * spacing) / 2;

  return Array.from({ length: count }, (_unused, index) => ({
    x: Math.round(startX + (index % columns) * spacing),
    y: Math.round(startY + Math.floor(index / columns) * spacing)
  }));
}

async function addEncounterToScene(encounter) {
  if (!game.user?.isGM || !canvas.scene) {
    ui.notifications.warn("Une scène active et les droits MJ sont nécessaires.");
    return [];
  }

  const generated = encounter.entries.filter((item) => !item.fixed && item.entry);
  if (!generated.length) {
    ui.notifications.info("Aucune nouvelle créature à ajouter.");
    return [];
  }

  const positions = centerPositions(generated.length);
  const tokenSources = [];

  for (let index = 0; index < generated.length; index += 1) {
    const actor = await materializeActor(generated[index].entry);
    if (!actor) continue;

    const token = await actor.getTokenDocument({
      hidden: false,
      x: positions[index].x,
      y: positions[index].y
    }, { parent: canvas.scene });

    tokenSources.push(token.toObject());
  }

  const created = tokenSources.length
    ? await canvas.scene.createEmbeddedDocuments("Token", tokenSources)
    : [];

  ui.notifications.info(`${created.length} créature(s) ajoutée(s) à la scène.`);
  return created;
}

async function replaceEntry(encounter, index) {
  if (!Number.isInteger(index) || index < 0 || index >= encounter.entries.length) {
    ui.notifications.warn("Choisissez d'abord une créature générée à remplacer.");
    return encounter;
  }

  const current = encounter.entries[index];
  if (current.fixed) {
    ui.notifications.warn("Un PNJ déjà présent sur la scène ne peut pas être remplacé ici.");
    return encounter;
  }

  const withoutCurrent = encounter.entries.reduce(
    (sum, item, itemIndex) => sum + (itemIndex === index ? 0 : item.xp),
    0
  );
  const remaining = Math.max(10, encounter.targetBudget - withoutCurrent);
  const deltas = preferredDeltas(encounter.options.composition, encounter.options.threat);
  const replacement = chooseCandidate(
    encounter.pool,
    encounter.options.partyLevel,
    deltas,
    remaining,
    current.entry?.key
  );

  if (!replacement) {
    ui.notifications.warn("Aucune autre créature compatible n'a été trouvée.");
    return encounter;
  }

  const copy = [...encounter.entries];
  copy[index] = {
    fixed: false,
    tokenId: null,
    name: replacement.name,
    level: replacement.level,
    xp: xpForLevel(replacement.level, encounter.options.partyLevel),
    entry: replacement
  };

  return {
    ...encounter,
    entries: copy,
    totalXp: copy.reduce((sum, item) => sum + item.xp, 0)
  };
}

async function openEncounter() {
  if (!game.user?.isGM) {
    ui.notifications.warn("Seul le MJ peut improviser une rencontre.");
    return null;
  }

  const options = await askEncounterOptions();
  if (!options) return null;

  const selected = options.includeSelected ? selectedNpcTokens() : [];

  let encounter;
  try {
    encounter = await generateEncounter(options, selected);
  } catch (error) {
    console.error("PF2e Val Toolkit | Encounter generation failed", error);
    ui.notifications.error(error?.message ?? "Impossible de générer la rencontre.");
    return null;
  }

  while (encounter) {
    const action = await askPreview(encounter);
    if (!action) return encounter;

    if (action.action === "place") {
      await addEncounterToScene(encounter);
      return encounter;
    }

    if (action.action === "replace") {
      encounter = await replaceEntry(encounter, action.index);
      continue;
    }

    if (action.action === "reroll") {
      try {
        encounter = await generateEncounter(options, selected);
      } catch (error) {
        ui.notifications.error(error?.message ?? "Impossible de relancer la rencontre.");
        return null;
      }
    }
  }

  return null;
}

function registerSceneControl() {
  Hooks.on("getSceneControlButtons", (controls) => {
    if (!game.user?.isGM || !controls.tokens?.tools) return;

    controls.tokens.tools.pf2eValImprovise = {
      name: "pf2eValImprovise",
      title: "Improviser une rencontre",
      icon: "fa-solid fa-dice-d20",
      order: Object.keys(controls.tokens.tools).length,
      button: true,
      visible: true,
      onChange: () => void openEncounter()
    };
  });
}

export function initEncounterBuilder() {
  registerSceneControl();

  game.pf2eValToolkit ??= {};
  game.pf2eValToolkit.improvisation = {
    openEncounter,
    generateEncounter,
    encounterBudget,
    xpForLevel,
    addEncounterToScene
  };
}
