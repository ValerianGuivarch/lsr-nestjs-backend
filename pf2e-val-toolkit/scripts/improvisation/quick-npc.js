const NPC_CORE = "pf2e.pathfinder-npc-core";

const ROLE_KEYWORDS = Object.freeze({
  any: [],
  martial: ["soldier", "guard", "warrior", "fighter", "mercenary", "knight", "archer", "bodyguard", "infantry", "cavalry", "battle", "soldat", "garde", "guerrier", "combattant", "mercenaire", "chevalier"],
  caster: ["spell", "spellcaster", "magic", "mage", "wizard", "witch", "sorcerer", "occult", "arcane", "divine", "primal", "druid", "sort", "magie", "magicien", "sorcier", "arcanique", "divin", "druide"],
  healer: ["healer", "healing", "priest", "cleric", "medic", "herbalist", "doctor", "hospital", "soigneur", "soins", "pretre", "clerc", "medecin", "herboriste"],
  rogue: ["assassin", "thief", "spy", "scout", "bandit", "criminal", "rogue", "smuggler", "gang", "voleur", "espion", "eclaireur", "criminel", "contrebandier"],
  social: ["noble", "diplomat", "envoy", "politician", "merchant", "leader", "mayor", "minister", "court", "diplomate", "emissaire", "politicien", "marchand", "maire", "ministre"]
});

const ROLE_LABELS = Object.freeze({
  any: "Tous les profils",
  martial: "Combattant",
  caster: "Lanceur de sorts",
  healer: "Soutien / soins",
  rogue: "Discret / criminel",
  social: "Autorité / social"
});

function escapeHtml(value) {
  return foundry.utils.escapeHTML(String(value ?? ""));
}

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase();
}

function partyLevel() {
  const levels = game.pf2eValToolkit?.activeParty?.getLevels?.() ?? [];
  const usable = levels.map(Number).filter(Number.isFinite);
  if (usable.length) {
    return Math.round(usable.reduce((sum, level) => sum + level, 0) / usable.length);
  }
  return 1;
}

function traitLabel(trait) {
  const config = CONFIG.PF2E?.creatureTraits?.[trait];
  const label = typeof config === "string" ? config : config?.label;
  return label ? game.i18n.localize(label) : trait;
}

function rarityFilter(mode) {
  if (mode === "common") return ["common"];
  if (mode === "standard") return ["common", "uncommon"];
  return [];
}

const QUERY_SYNONYMS = Object.freeze({
  necromancien: ["necromancer", "necromancy", "undead", "occult"],
  necromancienne: ["necromancer", "necromancy", "undead", "occult"],
  magicien: ["mage", "wizard", "magic", "spell", "arcane"],
  magicienne: ["mage", "wizard", "magic", "spell", "arcane"],
  sorcier: ["witch", "sorcerer", "magic", "spell"],
  sorciere: ["witch", "sorcerer", "magic", "spell"],
  pretre: ["priest", "cleric", "divine"],
  druide: ["druid", "primal"],
  garde: ["guard", "watch", "sentry"],
  soldat: ["soldier", "infantry", "military", "mercenary"],
  bandit: ["bandit", "criminal", "gang", "thief"],
  espion: ["spy", "agent", "infiltrator"],
  soigneur: ["healer", "healing", "medic"],
  pirate: ["pirate", "raider", "smuggler"]
});

function queryTerms(query) {
  const base = normalize(query)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
  return [...new Set(base.flatMap((token) => [token, ...(QUERY_SYNONYMS[token] ?? [])]))];
}

function scoreEntry(entry, criteria) {
  const text = entry.searchText ?? normalize([entry.name, entry.publicNotes, ...(entry.traits ?? [])].join(" "));
  let score = 0;

  const queryTokens = queryTerms(criteria.query);

  for (const token of queryTokens) {
    if (normalize(entry.name).includes(token)) score += 8;
    if (text.includes(token)) score += 3;
  }

  for (const keyword of ROLE_KEYWORDS[criteria.role] ?? []) {
    if (normalize(entry.name).includes(keyword)) score += 5;
    else if (text.includes(keyword)) score += 2;
  }

  if (entry.traits.includes("troop")) score -= 8;
  if (entry.level === criteria.level) score += 4;
  if (entry.rarity === "common") score += 1;
  return score;
}

async function candidateEntries(criteria, excludedKeys = new Set()) {
  const index = game.pf2eValToolkit?.creatureIndex;
  if (!index) throw new Error("Index des créatures indisponible.");

  const search = async (distance) => index.search({
    minLevel: Math.max(-1, criteria.level - distance),
    maxLevel: criteria.level + distance,
    traits: criteria.trait ? [criteria.trait] : [],
    scope: "core",
    rarities: rarityFilter(criteria.rarity),
    collections: [NPC_CORE]
  });

  let pool = await search(0);
  if (!pool.length) pool = await search(1);
  if (!pool.length) pool = await search(2);

  return pool
    .filter((entry) => !entry.traits.includes("troop") && !excludedKeys.has(entry.key))
    .map((entry) => ({ entry, score: scoreEntry(entry, criteria) }))
    .sort((a, b) =>
      b.score - a.score ||
      Math.abs(a.entry.level - criteria.level) - Math.abs(b.entry.level - criteria.level) ||
      a.entry.name.localeCompare(b.entry.name, "fr")
    )
    .slice(0, 12);
}

async function npcCoreTraits() {
  const index = game.pf2eValToolkit?.creatureIndex;
  const rows = await index?.getIndex?.() ?? [];
  const counts = new Map();

  for (const entry of rows) {
    if (entry.collection !== NPC_CORE) continue;
    for (const trait of entry.traits ?? []) {
      if (trait === "troop") continue;
      counts.set(trait, (counts.get(trait) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, "fr"));
}

async function askCriteria(initial = null) {
  const DialogV2 = foundry.applications?.api?.DialogV2;
  if (!DialogV2?.wait) return null;
  const values = {
    level: initial?.level ?? partyLevel(),
    role: initial?.role ?? "any",
    query: initial?.query ?? "",
    trait: initial?.trait ?? "",
    rarity: initial?.rarity ?? "standard"
  };

  const traits = await npcCoreTraits();
  const traitOptions = [
    `<option value="" ${values.trait ? "" : "selected"}>— aucun trait imposé —</option>`,
    ...traits.map(({ value, count }) =>
      `<option value="${escapeHtml(value)}" ${values.trait === value ? "selected" : ""}>${escapeHtml(traitLabel(value))} (${count})</option>`
    )
  ].join("");

  return DialogV2.wait({
    window: { title: "Créer un PNJ rapide" },
    classes: ["pf2e-val-quick-npc-dialog"],
    content: `
      <form class="pf2e-val-quick-npc-form">
        <div class="pf2e-val-improv-grid two">
          <label>Niveau
            <input type="number" name="level" min="0" max="20" value="${values.level}">
          </label>
          <label>Profil
            <select name="role">
              ${Object.entries(ROLE_LABELS).map(([value, label]) =>
                `<option value="${value}" ${values.role === value ? "selected" : ""}>${label}</option>`
              ).join("")}
            </select>
          </label>
        </div>
        <label>Concept / recherche
          <input type="text" name="query" value="${escapeHtml(values.query)}" placeholder="nécromancien, garde, pirate, espion…">
        </label>
        <div class="pf2e-val-improv-grid two">
          <label>Trait
            <select name="trait">${traitOptions}</select>
          </label>
          <label>Rareté
            <select name="rarity">
              <option value="standard" ${values.rarity === "standard" ? "selected" : ""}>Commune + peu commune</option>
              <option value="common" ${values.rarity === "common" ? "selected" : ""}>Commune uniquement</option>
              <option value="all" ${values.rarity === "all" ? "selected" : ""}>Toutes</option>
            </select>
          </label>
        </div>
        <p class="hint">
          Le toolkit cherche un statblock NPC Core déjà complet au niveau demandé.
          Ses attaques, actions et éventuels sorts sont conservés tels quels.
        </p>
      </form>
    `,
    buttons: [
      {
        action: "search",
        label: "Chercher",
        icon: "fa-solid fa-magnifying-glass",
        default: true,
        callback: (_event, button) => {
          const data = Object.fromEntries(new FormData(button.form).entries());
          const parsedLevel = Number.parseInt(data.level, 10);
          return {
            level: Number.isFinite(parsedLevel) ? Math.max(0, Math.min(20, parsedLevel)) : partyLevel(),
            role: ROLE_LABELS[data.role] ? data.role : "any",
            query: String(data.query ?? "").trim(),
            trait: String(data.trait ?? ""),
            rarity: ["common", "standard", "all"].includes(data.rarity) ? data.rarity : "standard"
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

function candidateRows(candidates) {
  return candidates.map(({ entry, score }, index) => `
    <div class="pf2e-val-quick-npc-candidate-row">
      <label class="pf2e-val-quick-npc-candidate">
        <input type="radio" name="candidate" value="${index}" ${index === 0 ? "checked" : ""}>
        <img src="${escapeHtml(entry.img)}" alt="" width="24" height="24" style="width:24px!important;height:24px!important;min-width:24px!important;max-width:24px!important;min-height:24px!important;max-height:24px!important;object-fit:cover!important">
        <span>
          <strong>${escapeHtml(entry.name)}</strong>
          <small>Niv. ${entry.level} · ${entry.traits.slice(0, 4).map(traitLabel).join(", ")}${score ? ` · pertinence ${score}` : ""}</small>
        </span>
      </label>
      <a class="content-link pf2e-val-quick-npc-open" data-link data-uuid="${escapeHtml(entry.uuid)}" title="Ouvrir la fiche du compendium">
        <i class="fa-solid fa-book-open"></i>
      </a>
    </div>
  `).join("");
}

async function askCandidate(criteria, candidates, customName = "") {
  const DialogV2 = foundry.applications?.api?.DialogV2;
  if (!DialogV2?.wait) return null;

  return DialogV2.wait({
    window: { title: "Choisir le statblock du PNJ" },
    classes: ["pf2e-val-quick-npc-results-dialog"],
    content: `
      <form class="pf2e-val-quick-npc-results">
        <p class="hint">
          ${candidates.length} meilleur(s) résultat(s) NPC Core pour niveau ${criteria.level}
          ${criteria.query ? `· « ${escapeHtml(criteria.query)} »` : ""}.
        </p>
        <div class="pf2e-val-quick-npc-list">${candidateRows(candidates)}</div>
        <label>Nom du PNJ
          <input type="text" name="customName" value="${escapeHtml(customName)}" placeholder="Laisser vide pour garder le nom du statblock">
        </label>
      </form>
    `,
    buttons: [
      {
        action: "place",
        label: "Créer et placer",
        icon: "fa-solid fa-user-plus",
        default: true,
        callback: (_event, button) => {
          const data = Object.fromEntries(new FormData(button.form).entries());
          return {
            action: "place",
            index: Number.parseInt(data.candidate, 10),
            name: String(data.customName ?? "").trim()
          };
        }
      },
      {
        action: "create",
        label: "Créer seulement",
        icon: "fa-solid fa-user",
        callback: (_event, button) => {
          const data = Object.fromEntries(new FormData(button.form).entries());
          return {
            action: "create",
            index: Number.parseInt(data.candidate, 10),
            name: String(data.customName ?? "").trim()
          };
        }
      },
      {
        action: "reroll",
        label: "Autres résultats",
        icon: "fa-solid fa-dice",
        callback: (_event, button) => ({
          action: "reroll",
          name: String(new FormData(button.form).get("customName") ?? "").trim()
        })
      },
      {
        action: "back",
        label: "Retour aux critères",
        icon: "fa-solid fa-arrow-left",
        callback: (_event, button) => ({
          action: "back",
          name: String(new FormData(button.form).get("customName") ?? "").trim()
        })
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

async function createNpc(entry, customName = "") {
  const source = await game.pf2eValToolkit.creatureIndex.resolve(entry);
  if (!source) throw new Error("Le statblock choisi n'est plus disponible.");

  const data = game.actors.fromCompendium(source);
  const folder = await improvisationFolder();
  data.folder = folder?.id ?? null;

  if (customName) {
    data.name = customName;
    data.prototypeToken ??= {};
    data.prototypeToken.name = customName;
  }

  return Actor.implementation.create(data, { fromCompendium: true });
}

async function placeActor(actor) {
  if (!canvas.scene) {
    ui.notifications.warn("Aucune scène active : le PNJ a été créé sans token.");
    return null;
  }

  const grid = canvas.scene.grid?.size ?? 100;
  const center = canvas.dimensions?.sceneRect?.center ?? {
    x: (canvas.scene.width ?? grid * 10) / 2,
    y: (canvas.scene.height ?? grid * 10) / 2
  };

  const token = await actor.getTokenDocument({
    hidden: false,
    x: Math.round(center.x),
    y: Math.round(center.y)
  }, { parent: canvas.scene });

  const created = await token.constructor.create(token, { parent: canvas.scene });
  created?.object?.control?.({ releaseOthers: false });
  return created;
}

async function openQuickNpc() {
  if (!game.user?.isGM) {
    ui.notifications.warn("Seul le MJ peut créer un PNJ rapide.");
    return null;
  }

  let criteria = await askCriteria();
  if (!criteria) return null;

  let excludedKeys = new Set();
  let customName = "";

  while (true) {
    let candidates;
    try {
      candidates = await candidateEntries(criteria, excludedKeys);
      if (!candidates.length && excludedKeys.size) {
        excludedKeys = new Set();
        candidates = await candidateEntries(criteria, excludedKeys);
      }
    } catch (error) {
      console.error("PF2e Val Toolkit | Quick NPC search failed", error);
      ui.notifications.error(error?.message ?? "Impossible de chercher un PNJ.");
      return null;
    }

    if (!candidates.length) {
      ui.notifications.warn("Aucun statblock NPC Core ne correspond à ces critères.");
      const revised = await askCriteria(criteria);
      if (!revised) return null;
      criteria = revised;
      excludedKeys = new Set();
      continue;
    }

    const choice = await askCandidate(criteria, candidates, customName);
    if (!choice) return null;
    customName = choice.name ?? customName;

    if (choice.action === "back") {
      const revised = await askCriteria(criteria);
      if (!revised) return null;
      criteria = revised;
      excludedKeys = new Set();
      continue;
    }

    if (choice.action === "reroll") {
      for (const candidate of candidates) excludedKeys.add(candidate.entry.key);
      continue;
    }

    const selected = candidates[choice.index]?.entry;
    if (!selected) {
      ui.notifications.warn("Choisissez un statblock.");
      continue;
    }

    try {
      const actor = await createNpc(selected, choice.name);
      if (choice.action === "place") await placeActor(actor);
      else actor.sheet?.render?.({ force: true });
      ui.notifications.info(`${actor.name} créé à partir de ${selected.name}.`);
      return actor;
    } catch (error) {
      console.error("PF2e Val Toolkit | Quick NPC creation failed", error);
      ui.notifications.error(error?.message ?? "Impossible de créer le PNJ.");
      return null;
    }
  }
}

function registerSceneControl() {
  Hooks.on("getSceneControlButtons", (controls) => {
    if (!game.user?.isGM || !controls.tokens?.tools) return;

    controls.tokens.tools.pf2eValQuickNpc = {
      name: "pf2eValQuickNpc",
      title: "Créer un PNJ rapide",
      icon: "fa-solid fa-user-plus",
      order: Object.keys(controls.tokens.tools).length,
      button: true,
      visible: true,
      onChange: () => void openQuickNpc()
    };
  });
}

export function initQuickNpc() {
  registerSceneControl();

  game.pf2eValToolkit ??= {};
  game.pf2eValToolkit.improvisation ??= {};
  Object.assign(game.pf2eValToolkit.improvisation, {
    openQuickNpc,
    findNpcCandidates: candidateEntries,
    createNpc
  });
}
