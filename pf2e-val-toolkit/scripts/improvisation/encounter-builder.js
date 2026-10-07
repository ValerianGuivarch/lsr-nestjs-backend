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

const COMPOSITION_PRESETS = Object.freeze({
  auto: {
    trivial: [
      { strong: 0, medium: 1, weak: 1 },
      { strong: 0, medium: 0, weak: 3 }
    ],
    low: [
      { strong: 0, medium: 1, weak: 2 },
      { strong: 0, medium: 0, weak: 4 }
    ],
    moderate: [
      { strong: 0, medium: 1, weak: 2 },
      { strong: 0, medium: 2, weak: 1 },
      { strong: 1, medium: 0, weak: 2 }
    ],
    severe: [
      { strong: 0, medium: 2, weak: 2 },
      { strong: 1, medium: 1, weak: 2 },
      { strong: 1, medium: 0, weak: 3 }
    ],
    extreme: [
      { strong: 1, medium: 1, weak: 2 },
      { strong: 1, medium: 2, weak: 1 },
      { strong: 0, medium: 4, weak: 0 }
    ]
  },
  boss: {
    trivial: { strong: 0, medium: 1, weak: 1 },
    low: { strong: 0, medium: 1, weak: 2 },
    moderate: { strong: 1, medium: 0, weak: 2 },
    severe: { strong: 1, medium: 0, weak: 2 },
    extreme: { strong: 1, medium: 1, weak: 2 }
  },
  balanced: {
    trivial: { strong: 0, medium: 1, weak: 1 },
    low: { strong: 0, medium: 1, weak: 2 },
    moderate: { strong: 0, medium: 1, weak: 2 },
    severe: { strong: 0, medium: 2, weak: 2 },
    extreme: { strong: 1, medium: 1, weak: 2 }
  },
  horde: {
    trivial: { strong: 0, medium: 0, weak: 3 },
    low: { strong: 0, medium: 0, weak: 4 },
    moderate: { strong: 0, medium: 0, weak: 4 },
    severe: { strong: 0, medium: 0, weak: 6 },
    extreme: { strong: 0, medium: 0, weak: 8 }
  }
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

function bestTheoreticalXp(counts, targetBudget) {
  let totals = new Set([0]);
  for (const [category, count] of Object.entries(counts)) {
    const xpOptions = customCategoryDeltas(category).map((delta) => XP_BY_DELTA.get(delta));
    for (let index = 0; index < count; index += 1) {
      const next = new Set();
      for (const total of totals) {
        for (const xp of xpOptions) {
          if (xp != null && total + xp <= targetBudget) next.add(total + xp);
        }
      }
      totals = next;
      if (!totals.size) return null;
    }
  }
  return totals.size ? Math.max(...totals) : 0;
}

function fitPresetToParty(base, composition, threat, partySize) {
  const targetBudget = encounterBudget(threat, partySize);
  const baseCount = base.strong + base.medium + base.weak;
  const strongMax = Math.min(4, base.strong + 2);
  const mediumMax = Math.min(10, base.medium + 4);
  const weakMax = Math.min(16, base.weak + 8);
  let best = null;

  for (let strong = 0; strong <= strongMax; strong += 1) {
    for (let medium = 0; medium <= mediumMax; medium += 1) {
      for (let weak = 0; weak <= weakMax; weak += 1) {
        const totalCount = strong + medium + weak;
        if (!totalCount) continue;
        if (composition === "horde" && (strong || medium)) continue;
        if (composition === "boss") {
          if (strong + medium < 1) continue;
          const minReinforcements = targetBudget >= 50 ? 2 : 1;
          if (weak < minReinforcements) continue;
        }

        const counts = { strong, medium, weak };
        const achieved = bestTheoreticalXp(counts, targetBudget);
        if (achieved == null) continue;

        const candidate = {
          counts,
          shortfall: targetBudget - achieved,
          distance:
            Math.abs(strong - base.strong) * 5 +
            Math.abs(medium - base.medium) * 3 +
            Math.abs(weak - base.weak),
          countDistance: Math.abs(totalCount - baseCount)
        };

        if (!best ||
          candidate.shortfall < best.shortfall ||
          (candidate.shortfall === best.shortfall && candidate.distance < best.distance) ||
          (candidate.shortfall === best.shortfall && candidate.distance === best.distance && candidate.countDistance < best.countDistance)) {
          best = candidate;
        }
      }
    }
  }

  return best?.counts ?? { ...base };
}

function compositionPreset(composition, threat, partySize = 4) {
  if (composition === "custom") return null;
  const byThreat = COMPOSITION_PRESETS[composition] ?? COMPOSITION_PRESETS.auto;
  const configured = byThreat[threat] ?? byThreat.moderate;
  const base = Array.isArray(configured) ? randomItem(configured) : configured;
  if (!base) return { strong: 0, medium: 1, weak: 2 };
  return fitPresetToParty(base, composition, threat, partySize);
}

function normalizedCounts(options) {
  const fallback = compositionPreset(options.composition, options.threat, options.partySize) ?? { strong: 1, medium: 1, weak: 2 };
  return {
    strong: intValue(options.strong, fallback.strong, 0, 8),
    medium: intValue(options.medium, fallback.medium, 0, 12),
    weak: intValue(options.weak, fallback.weak, 0, 16)
  };
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

function buildCountComposition(pool, options, result, targetBudget) {
  const counts = normalizedCounts(options);
  const slots = [];
  for (const category of ["strong", "medium", "weak"]) {
    for (let index = 0; index < counts[category]; index += 1) slots.push(category);
  }

  const fixedXp = result.reduce((sum, item) => sum + item.xp, 0);
  const availableBudget = Math.max(0, targetBudget - fixedXp);
  const availableDeltas = new Map();

  for (const category of ["strong", "medium", "weak"]) {
    const deltas = customCategoryDeltas(category).filter((delta) =>
      pool.some((entry) => entry.level - options.partyLevel === delta)
    );
    availableDeltas.set(category, deltas);
  }

  let states = [{ xp: 0, selected: 0, plan: [] }];
  for (const category of slots) {
    const next = new Map();
    for (const state of states) {
      const skipped = { ...state, plan: [...state.plan, null] };
      next.set(`${skipped.selected}:${skipped.xp}`, skipped);

      for (const delta of availableDeltas.get(category) ?? []) {
        const xp = XP_BY_DELTA.get(delta);
        if (xp == null || state.xp + xp > availableBudget) continue;
        const candidate = {
          xp: state.xp + xp,
          selected: state.selected + 1,
          plan: [...state.plan, { category, delta }]
        };
        next.set(`${candidate.selected}:${candidate.xp}`, candidate);
      }
    }
    states = [...next.values()];
  }

  states.sort((a, b) => b.selected - a.selected || b.xp - a.xp);
  const best = states[0] ?? { plan: [] };

  for (const choice of best.plan) {
    if (!choice) continue;
    const entry = chooseCandidate(pool, options.partyLevel, [choice.delta]);
    if (entry) addGenerated(result, entry, options.partyLevel);
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

  buildCountComposition(pool, options, result, targetBudget);

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
  const initialPreset = compositionPreset("auto", "moderate", defaults.size);

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
              <input type="number" name="strong" min="0" max="8" value="${initialPreset.strong}">
            </label>
            <label>Moyennes
              <input type="number" name="medium" min="0" max="12" value="${initialPreset.medium}">
            </label>
            <label>Faibles
              <input type="number" name="weak" min="0" max="16" value="${initialPreset.weak}">
            </label>
          </div>
          <p class="hint">
            Les profils remplissent automatiquement Fortes/Moyennes/Faibles selon la difficulté.
            Ces valeurs restent modifiables avant génération ; le budget de difficulté reste la limite finale.
          </p>
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
    render: (_event, dialog) => {
      const form = dialog.element?.querySelector?.(".pf2e-val-improv-form");
      if (!form) return;
      const composition = form.elements.namedItem("composition");
      const threat = form.elements.namedItem("threat");
      const partySize = form.elements.namedItem("partySize");
      const strong = form.elements.namedItem("strong");
      const medium = form.elements.namedItem("medium");
      const weak = form.elements.namedItem("weak");

      const applyPreset = () => {
        if (composition?.value === "custom") return;
        const preset = compositionPreset(
          composition?.value,
          threat?.value,
          intValue(partySize?.value, defaults.size, 1, 12)
        );
        if (!preset) return;
        if (strong) strong.value = String(preset.strong);
        if (medium) medium.value = String(preset.medium);
        if (weak) weak.value = String(preset.weak);
      };

      composition?.addEventListener?.("change", applyPreset);
      threat?.addEventListener?.("change", applyPreset);
      partySize?.addEventListener?.("change", applyPreset);
    },
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
    compositionPreset,
    xpForLevel,
    addEncounterToScene
  };
}
