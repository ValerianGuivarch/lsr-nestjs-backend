import {
  CONDITION_CATEGORIES,
  FALLBACK_CONDITION_CATEGORY,
  conditionCategoryFor
} from "./condition-catalogue.js";

const TAB_ID = "pf2e-val-conditions";
const PANEL_CLASS = "pf2e-val-conditions";
const NAV_CLASS = "pf2e-val-conditions-nav";
const CONDITION_PACK = "pf2e.conditionitems";

let conditionCataloguePromise = null;

function getRoot(html) {
  if (html instanceof HTMLElement) return html;
  if (html?.[0] instanceof HTMLElement) return html[0];
  return null;
}

function getActor(app) {
  return app?.actor ?? app?.object ?? app?.document ?? null;
}

function isCharacterSheet(app) {
  return getActor(app)?.type === "character";
}

function findPrimaryNavigation(root) {
  const candidates = Array.from(
    root.querySelectorAll("nav, .sheet-navigation, .sheet-tabs, .tabs")
  );

  return candidates.find(element => {
    const hasActions = element.querySelector('[data-tab="actions"]');
    const hasInventory = element.querySelector('[data-tab="inventory"]');
    return hasActions && hasInventory;
  }) ?? null;
}

function findNativeActionsTab(root) {
  const candidates = Array.from(
    root.querySelectorAll('.tab[data-tab="actions"], [data-tab="actions"].tab')
  );

  return candidates.find(element => {
    return element.parentElement?.querySelector('[data-tab="inventory"]');
  }) ?? candidates[0] ?? null;
}

function createNavigationButton(navigation) {
  const source =
    navigation.querySelector('[data-tab="actions"]') ??
    navigation.querySelector("[data-tab]");

  let button;

  if (source) {
    button = source.cloneNode(false);
    button.removeAttribute("data-action");
    button.removeAttribute("data-tooltip");
    button.removeAttribute("aria-label");
  } else {
    button = document.createElement("a");
  }

  button.classList.remove("active");
  button.classList.add(NAV_CLASS);
  button.dataset.tab = TAB_ID;
  button.title = "États & conditions";
  button.setAttribute("aria-label", "États & conditions");
  button.innerHTML = '<i class="fa-solid fa-person-circle-exclamation"></i>';

  return button;
}

function createPanel() {
  const panel = document.createElement("section");
  panel.classList.add("tab", PANEL_CLASS);
  panel.dataset.tab = TAB_ID;

  panel.innerHTML = `
    <div class="pf2e-val-conditions-browser">
      <header class="pf2e-val-conditions-header">
        <div>
          <h2>États & conditions</h2>
          <p>Référence rapide des états PF2e. Clique sur une ligne pour afficher sa règle complète.</p>
        </div>
        <div class="pf2e-val-conditions-count"></div>
      </header>

      <div class="pf2e-val-conditions-active">
        <span class="pf2e-val-conditions-active-label">
          <i class="fa-solid fa-heart-pulse"></i>
          Sur le personnage
        </span>
        <div class="pf2e-val-conditions-active-list">
          <span class="pf2e-val-conditions-none">Aucun état actif</span>
        </div>
      </div>

      <div class="pf2e-val-conditions-toolbar">
        <label class="pf2e-val-conditions-search">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input
            type="search"
            placeholder="Rechercher un état…"
            autocomplete="off"
          >
        </label>

        <span class="pf2e-val-conditions-collapse-controls">
          <button type="button" title="Tout déplier" data-expand-all>
            <i class="fa-solid fa-angles-down"></i>
          </button>
          <button type="button" title="Tout replier" data-collapse-all>
            <i class="fa-solid fa-angles-up"></i>
          </button>
        </span>
      </div>

      <div class="pf2e-val-conditions-legend">
        <span><i class="fa-solid fa-circle-dot"></i> actif sur le personnage</span>
        <span><i class="fa-solid fa-book-open"></i> ouvrir la fiche PF2e</span>
      </div>

      <div class="pf2e-val-conditions-content">
        <div class="pf2e-val-conditions-empty">
          <i class="fa-solid fa-spinner fa-spin"></i>
          Chargement des états PF2e…
        </div>
      </div>
    </div>
  `;

  return panel;
}

function setConditionsTabActive(app, root, active) {
  const navigation = findPrimaryNavigation(root);
  const panel = root.querySelector(`.${PANEL_CLASS}`);
  const nav = root.querySelector(`.${NAV_CLASS}`);

  app._pf2eValConditionsActive = active;

  if (!navigation || !panel || !nav) return;

  if (active) {
    for (const item of navigation.querySelectorAll("[data-tab]")) {
      item.classList.toggle("active", item === nav);
    }

    const parent = panel.parentElement;

    if (parent) {
      for (const tab of parent.querySelectorAll(":scope > .tab")) {
        const isThis = tab === panel;
        tab.classList.toggle("active", isThis);

        // Explicitly hide the other custom tab too: both tabs coexist outside
        // Foundry's native tab controller.
        if (tab.classList.contains("pf2e-val-guided-actions")) {
          tab.hidden = !isThis;
        }
      }
    }

    panel.hidden = false;
  } else {
    panel.classList.remove("active");
    panel.hidden = true;
    nav.classList.remove("active");
  }
}

function conditionSlug(item) {
  return item?.slug ?? item?.system?.slug ?? "";
}

function stripHTML(value) {
  const element = document.createElement("div");
  element.innerHTML = String(value ?? "");
  return (element.textContent ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function summaryFrom(item) {
  const plain = stripHTML(item?.system?.description?.value ?? "");

  if (!plain) return "Aucune description disponible.";

  const limit = 170;

  return plain.length <= limit
    ? plain
    : `${plain.slice(0, limit).trimEnd()}…`;
}

async function loadConditionCatalogue() {
  if (conditionCataloguePromise) return conditionCataloguePromise;

  conditionCataloguePromise = (async () => {
    const pack = game.packs.get(CONDITION_PACK);

    if (!pack) {
      throw new Error(
        `Compendium ${CONDITION_PACK} introuvable.`
      );
    }

    // There are only a few dozen conditions. Loading the documents rather
    // than maintaining copied descriptions guarantees that names, rules,
    // links and French translations stay those of the installed PF2e system.
    const docs = await pack.getDocuments();

    return docs
      .filter(item => item?.type === "condition")
      .map(item => ({
        item,
        slug: conditionSlug(item),
        name: item.name,
        img: item.img,
        summary: summaryFrom(item)
      }))
      .filter(entry => entry.slug)
      .sort((a, b) =>
        a.name.localeCompare(
          b.name,
          game.i18n.lang,
          { sensitivity: "base" }
        )
      );
  })();

  return conditionCataloguePromise;
}

function activeConditions(actor) {
  const active = actor?.conditions?.active;

  return Array.isArray(active)
    ? active
    : Array.from(active ?? []);
}

function activeInfo(actor, slug) {
  const matches =
    actor?.conditions?.bySlug?.(slug, { active: true }) ??
    activeConditions(actor).filter(condition =>
      conditionSlug(condition) === slug
    );

  if (!matches.length) {
    return {
      active: false,
      value: null,
      count: 0
    };
  }

  const numericValues = matches
    .map(condition => Number(
      condition?.system?.value?.value
    ))
    .filter(Number.isFinite);

  return {
    active: true,
    value: numericValues.length
      ? Math.max(...numericValues)
      : null,
    count: matches.length
  };
}

function activeLabel(info) {
  if (!info.active) return "";

  if (Number.isFinite(info.value)) {
    return `Actif ${info.value}`;
  }

  if (info.count > 1) {
    return `Actif ×${info.count}`;
  }

  return "Actif";
}

async function enrichDescription(item) {
  const source = item?.system?.description?.value ?? "";

  if (!source) {
    return "<p>Aucune description disponible.</p>";
  }

  return TextEditor.enrichHTML(source, {
    async: true,
    relativeTo: item,
    secrets: false
  });
}

function createConditionTile(actor, entry) {
  const info = activeInfo(actor, entry.slug);
  const tile = document.createElement("article");

  tile.className = "pf2e-val-condition-tile";
  tile.dataset.slug = entry.slug;
  tile.dataset.search = [
    entry.name,
    entry.slug,
    entry.summary,
    conditionCategoryFor(entry.slug).label
  ]
    .join(" ")
    .toLocaleLowerCase(game.i18n.lang);

  if (info.active) {
    tile.classList.add("is-active-condition");
  }

  tile.innerHTML = `
    <button
      type="button"
      class="pf2e-val-condition-main"
      aria-expanded="false"
      title="${foundry.utils.escapeHTML(entry.summary)}"
    >
      <img
        src="${foundry.utils.escapeHTML(entry.img ?? "")}"
        alt=""
        loading="lazy"
      >

      <span class="pf2e-val-condition-name">
        ${foundry.utils.escapeHTML(entry.name)}
      </span>

      ${
        info.active
          ? `<span class="pf2e-val-condition-active-badge">${foundry.utils.escapeHTML(activeLabel(info))}</span>`
          : '<span class="pf2e-val-condition-active-spacer"></span>'
      }

      <i class="fa-solid fa-chevron-down pf2e-val-condition-chevron"></i>
    </button>

    <button
      type="button"
      class="pf2e-val-condition-open"
      title="Ouvrir la fiche PF2e de ${foundry.utils.escapeHTML(entry.name)}"
      aria-label="Ouvrir la fiche PF2e de ${foundry.utils.escapeHTML(entry.name)}"
    >
      <i class="fa-solid fa-book-open"></i>
    </button>

    <div class="pf2e-val-condition-description" hidden>
      <div class="pf2e-val-condition-description-content">
        <i class="fa-solid fa-spinner fa-spin"></i>
        Chargement…
      </div>
    </div>
  `;

  const main = tile.querySelector(".pf2e-val-condition-main");
  const description = tile.querySelector(
    ".pf2e-val-condition-description"
  );
  const content = tile.querySelector(
    ".pf2e-val-condition-description-content"
  );

  main?.addEventListener("click", async event => {
    event.preventDefault();

    const opening = description.hidden;
    description.hidden = !opening;
    main.setAttribute(
      "aria-expanded",
      opening ? "true" : "false"
    );
    tile.classList.toggle("is-expanded", opening);

    if (
      opening &&
      content &&
      content.dataset.loaded !== "true"
    ) {
      try {
        content.innerHTML = await enrichDescription(entry.item);
        content.dataset.loaded = "true";
      } catch (error) {
        console.error(
          "PF2e Val Toolkit | Description d'état",
          error
        );
        content.innerHTML =
          "<p>Impossible de charger la description.</p>";
      }
    }
  });

  tile
    .querySelector(".pf2e-val-condition-open")
    ?.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      entry.item.sheet?.render(true);
    });

  return tile;
}

function createSection(actor, category, entries, { open = false } = {}) {
  if (!entries.length) return null;

  const section = document.createElement("details");
  section.className = "pf2e-val-condition-section";
  section.dataset.section = category.id;
  section.open = open;

  const title = document.createElement("summary");
  title.className = "pf2e-val-condition-section-title";
  title.innerHTML = `
    <i class="${category.icon}"></i>
    <span class="pf2e-val-condition-section-label">
      ${foundry.utils.escapeHTML(category.label)}
    </span>
    <span class="pf2e-val-condition-section-count">
      ${entries.length}
    </span>
  `;

  const grid = document.createElement("div");
  grid.className = "pf2e-val-condition-grid";

  for (const entry of entries) {
    grid.append(createConditionTile(actor, entry));
  }

  section.append(title, grid);
  return section;
}

function renderActiveSummary(actor, panel) {
  const list = panel.querySelector(
    ".pf2e-val-conditions-active-list"
  );

  if (!list) return;

  const active = activeConditions(actor)
    .filter(condition => condition?.active !== false);

  if (!active.length) {
    list.innerHTML =
      '<span class="pf2e-val-conditions-none">Aucun état actif</span>';
    return;
  }

  const seen = new Set();
  const chips = [];

  for (const condition of active) {
    const slug = conditionSlug(condition);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);

    const info = activeInfo(actor, slug);
    const label = Number.isFinite(info.value)
      ? `${condition.name} ${info.value}`
      : condition.name;

    chips.push(`
      <button
        type="button"
        class="pf2e-val-condition-chip"
        data-active-condition="${foundry.utils.escapeHTML(slug)}"
        title="Afficher ${foundry.utils.escapeHTML(condition.name)}"
      >
        <span>${foundry.utils.escapeHTML(label)}</span>
      </button>
    `);
  }

  list.innerHTML = chips.join("");

  for (const chip of list.querySelectorAll(
    "[data-active-condition]"
  )) {
    chip.addEventListener("click", event => {
      event.preventDefault();

      const slug = chip.dataset.activeCondition;
      const tile = panel.querySelector(
        `.pf2e-val-condition-tile[data-slug="${CSS.escape(slug)}"]`
      );

      if (!tile) return;

      const section = tile.closest(
        ".pf2e-val-condition-section"
      );

      if (section) section.open = true;

      tile.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

      tile.classList.add("pf2e-val-condition-flash");
      setTimeout(
        () => tile.classList.remove("pf2e-val-condition-flash"),
        900
      );
    });
  }
}

function renderSearch(panel) {
  const query =
    panel
      .querySelector(".pf2e-val-conditions-search input")
      ?.value
      ?.trim()
      ?.toLocaleLowerCase(game.i18n.lang) ?? "";

  let visible = 0;

  for (const section of panel.querySelectorAll(
    ".pf2e-val-condition-section"
  )) {
    let sectionVisible = 0;

    for (const tile of section.querySelectorAll(
      ".pf2e-val-condition-tile"
    )) {
      const show =
        !query ||
        tile.dataset.search.includes(query);

      tile.hidden = !show;

      if (show) {
        visible += 1;
        sectionVisible += 1;
      }
    }

    section.hidden = sectionVisible === 0;

    if (query && sectionVisible > 0) {
      if (section.dataset.preSearchOpen === undefined) {
        section.dataset.preSearchOpen =
          section.open ? "true" : "false";
      }

      section.open = true;
    } else if (
      !query &&
      section.dataset.preSearchOpen !== undefined
    ) {
      section.open =
        section.dataset.preSearchOpen === "true";
      delete section.dataset.preSearchOpen;
    }
  }

  const count = panel.querySelector(
    ".pf2e-val-conditions-count"
  );

  if (count) {
    count.textContent = `${visible} états`;
  }
}

async function populatePanel(app, panel) {
  const actor = getActor(app);
  const content = panel.querySelector(
    ".pf2e-val-conditions-content"
  );

  try {
    const entries = await loadConditionCatalogue();
    const byCategory = new Map(
      [
        ...CONDITION_CATEGORIES,
        FALLBACK_CONDITION_CATEGORY
      ].map(category => [category.id, []])
    );

    for (const entry of entries) {
      const category = conditionCategoryFor(entry.slug);
      byCategory.get(category.id)?.push(entry);
    }

    const fragment = document.createDocumentFragment();

    for (const category of [
      ...CONDITION_CATEGORIES,
      FALLBACK_CONDITION_CATEGORY
    ]) {
      const categoryEntries =
        byCategory.get(category.id) ?? [];

      const section = createSection(
        actor,
        category,
        categoryEntries,
        {
          // "Position & entraves" is the most immediately useful PF2e
          // reference in combat; the rest start compact.
          open: category.id === "position"
        }
      );

      if (section) fragment.append(section);
    }

    if (!fragment.childNodes.length) {
      content.innerHTML =
        '<div class="pf2e-val-conditions-empty">Aucun état PF2e trouvé.</div>';
      return;
    }

    content.replaceChildren(fragment);
    renderActiveSummary(actor, panel);
    renderSearch(panel);
  } catch (error) {
    console.error(
      "PF2e Val Toolkit | Conditions browser",
      error
    );

    content.innerHTML =
      '<div class="pf2e-val-conditions-empty">Impossible de charger les états PF2e.</div>';
  }
}

async function injectConditionsTab(app, html) {
  if (!isCharacterSheet(app)) return;

  const root = getRoot(html);
  if (!root) return;

  const navigation = findPrimaryNavigation(root);
  const actionsTab = findNativeActionsTab(root);

  if (!navigation || !actionsTab?.parentElement) return;

  root.querySelector(`.${NAV_CLASS}`)?.remove();
  root.querySelector(`.${PANEL_CLASS}`)?.remove();

  const navButton = createNavigationButton(navigation);
  navigation.append(navButton);

  const panel = createPanel();
  actionsTab.parentElement.append(panel);

  navButton.addEventListener("click", event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    setConditionsTabActive(app, root, true);
  });

  for (const other of navigation.querySelectorAll(
    `[data-tab]:not([data-tab="${TAB_ID}"])`
  )) {
    other.addEventListener("click", () => {
      setConditionsTabActive(app, root, false);
    });
  }

  panel
    .querySelector(".pf2e-val-conditions-search input")
    ?.addEventListener(
      "input",
      () => renderSearch(panel)
    );

  panel
    .querySelector("[data-expand-all]")
    ?.addEventListener("click", event => {
      event.preventDefault();

      for (const section of panel.querySelectorAll(
        ".pf2e-val-condition-section:not([hidden])"
      )) {
        section.open = true;
      }
    });

  panel
    .querySelector("[data-collapse-all]")
    ?.addEventListener("click", event => {
      event.preventDefault();

      for (const section of panel.querySelectorAll(
        ".pf2e-val-condition-section:not([hidden])"
      )) {
        section.open = false;
      }
    });

  if (app._pf2eValConditionsActive) {
    setConditionsTabActive(app, root, true);
  } else {
    panel.hidden = true;
  }

  await populatePanel(app, panel);
}

export function initConditionsBrowser() {
  Hooks.on(
    "renderCharacterSheetPF2e",
    injectConditionsTab
  );
  Hooks.on(
    "renderActorSheet",
    injectConditionsTab
  );

  game.pf2eValToolkit ??= {};
  game.pf2eValToolkit.conditionsBrowser = {
    refresh: () => {
      conditionCataloguePromise = null;

      for (const actor of game.actors.filter(
        actor => actor.type === "character"
      )) {
        if (actor.sheet?.rendered) {
          actor.sheet.render(false);
        }
      }
    }
  };
}
