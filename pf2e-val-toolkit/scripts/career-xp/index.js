const MODULE_ID = "pf2e-val-toolkit";

export const XPC_FLAG_SCOPE = MODULE_ID;
export const XPC_FLAG_KEY = "xpc";
const XPC_SYNC_OPTION = "pf2eValToolkitXpcSync";
const RESUMES_API_SETTING = "careerXp.resumesApiBaseUrl";
const DEFAULT_RESUMES_API_BASE_URL = "https://l7r.fr/apil7r/pf2-mj";

const MIN_LEVEL = 1;
const MAX_LEVEL = 20;
const PF2_XP_PER_LEVEL = 1000;

const syncingActorIds = new Set();

export const CAREER_XP_THRESHOLDS = Object.freeze({
  1: 0,
  2: 300,
  3: 900,
  4: 2700,
  5: 6500,
  6: 14000,
  7: 23000,
  8: 34000,
  9: 48000,
  10: 65000,
  11: 84000,
  12: 105000,
  13: 127000,
  14: 151000,
  15: 177000,
  16: 205000,
  17: 236000,
  18: 271000,
  19: 311000,
  20: 356000
});

function escape(value) {
  return foundry.utils.escapeHTML(String(value ?? ""));
}

function isCharacter(actor) {
  return actor?.type === "character";
}

function normalizeExistingXpc(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return null;
  }

  return Math.trunc(number);
}

export function thresholdForLevel(level) {
  const current = Math.clamp(
    Math.trunc(Number(level) || MIN_LEVEL),
    MIN_LEVEL,
    MAX_LEVEL
  );
  return CAREER_XP_THRESHOLDS[current];
}

export function nextThresholdForLevel(level) {
  const current = Math.clamp(
    Math.trunc(Number(level) || MIN_LEVEL),
    MIN_LEVEL,
    MAX_LEVEL
  );

  return current >= MAX_LEVEL
    ? null
    : CAREER_XP_THRESHOLDS[current + 1];
}

export function levelForCareerXp(total) {
  const xpc = normalizeExistingXpc(total);
  if (xpc === null) return null;

  for (
    let level = MAX_LEVEL;
    level >= MIN_LEVEL;
    level -= 1
  ) {
    if (xpc >= CAREER_XP_THRESHOLDS[level]) {
      return level;
    }
  }

  return MIN_LEVEL;
}

/**
 * XPC is the master progression value.
 *
 * PF2e uses a 0-999 style XP bar for each level, while the historical XPC
 * curve has variable spans. The current progress between two historical
 * thresholds is therefore projected proportionally onto the PF2e XP bar.
 *
 * At level 20 there is no following historical threshold; preserve the
 * established Toolkit behavior and keep the native PF2e bar complete (1000).
 */
export function derivePf2ProgressionFromXpc(total) {
  const xpc = normalizeExistingXpc(total);
  if (xpc === null) return null;

  const level = levelForCareerXp(xpc);
  const floor = thresholdForLevel(level);
  const next = nextThresholdForLevel(level);

  if (next === null) {
    return {
      xpc,
      level,
      xpPF2: PF2_XP_PER_LEVEL,
      floor,
      next,
      progress: Math.max(0, xpc - floor),
      span: null
    };
  }

  const span = Math.max(1, next - floor);
  const progress = Math.max(0, xpc - floor);

  return {
    xpc,
    level,
    xpPF2: Math.min(
      PF2_XP_PER_LEVEL - 1,
      Math.floor(
        (progress / span) * PF2_XP_PER_LEVEL
      )
    ),
    floor,
    next,
    progress,
    span
  };
}

export function getXpc(actor) {
  if (!isCharacter(actor)) return null;

  return normalizeExistingXpc(
    actor?.getFlag?.(
      XPC_FLAG_SCOPE,
      XPC_FLAG_KEY
    )
  );
}

export function getCareerXpState(actor) {
  if (!isCharacter(actor)) {
    return {
      status: "unsupported",
      actor,
      xpc: null
    };
  }

  const raw = actor?.getFlag?.(
    XPC_FLAG_SCOPE,
    XPC_FLAG_KEY
  );

  if (
    raw === undefined ||
    raw === null ||
    raw === ""
  ) {
    return {
      status: "missing",
      actor,
      xpc: null
    };
  }

  const progression =
    derivePf2ProgressionFromXpc(raw);

  if (!progression) {
    return {
      status: "invalid",
      actor,
      raw,
      xpc: null
    };
  }

  const pct =
    progression.next === null
      ? 100
      : Math.clamp(
          (
            progression.progress /
            progression.span
          ) * 100,
          0,
          100
        );

  return {
    status: "ok",
    actor,
    ...progression,
    pct
  };
}

function currentPf2Progression(actor) {
  return {
    level: Number(
      actor.system?.details?.level?.value
    ),
    xpPF2: Number(
      actor.system?.details?.xp?.value
    )
  };
}

function canCurrentUserUpdate(actor) {
  try {
    return actor.canUserModify(
      game.user,
      "update"
    );
  } catch {
    return Boolean(actor.isOwner);
  }
}

/**
 * updateActor fires on all connected clients.
 * Pick one active user with update permission for the derived write.
 */
function responsibleActiveUser(actor) {
  return (game.users?.contents ?? [])
    .filter(user => {
      if (!user.active) return false;

      try {
        return actor.canUserModify(
          user,
          "update"
        );
      } catch {
        return Boolean(user.isGM);
      }
    })
    .sort((a, b) =>
      String(a.id).localeCompare(String(b.id))
    )[0] ?? null;
}

function isResponsibleClient(actor) {
  return responsibleActiveUser(actor)?.id ===
    game.user?.id;
}

export async function syncActorFromXpc(
  actor,
  {
    notify = false,
    requireResponsibleClient = false
  } = {}
) {
  if (!isCharacter(actor)) {
    return {
      status: "unsupported",
      actor
    };
  }

  if (
    requireResponsibleClient &&
    !isResponsibleClient(actor)
  ) {
    return {
      status: "not-responsible",
      actor
    };
  }

  if (!canCurrentUserUpdate(actor)) {
    return {
      status: "permission",
      actor
    };
  }

  const state = getCareerXpState(actor);

  // Missing/invalid XPC is never reconstructed from PF2e level/XP.
  if (state.status !== "ok") {
    if (notify) {
      ui.notifications.warn(
        state.status === "missing"
          ? `${actor.name} : aucune XPC définie.`
          : `${actor.name} : XPC invalide.`
      );
    }

    return state;
  }

  const current =
    currentPf2Progression(actor);

  const update = {};

  if (current.level !== state.level) {
    update["system.details.level.value"] =
      state.level;
  }

  if (current.xpPF2 !== state.xpPF2) {
    update["system.details.xp.value"] =
      state.xpPF2;
  }

  if (!Object.keys(update).length) {
    if (notify) {
      ui.notifications.info(
        `${actor.name} est déjà synchronisé avec XPC.`
      );
    }

    return {
      ...state,
      status: "noop"
    };
  }

  if (syncingActorIds.has(actor.id)) {
    return {
      ...state,
      status: "busy"
    };
  }

  syncingActorIds.add(actor.id);

  try {
    await actor.update(
      update,
      {
        [XPC_SYNC_OPTION]: true
      }
    );

    if (notify) {
      ui.notifications.info(
        `${actor.name} synchronisé : niveau ${state.level}, ${state.xpPF2} XP PF2.`
      );
    }

    return {
      ...state,
      status: "updated",
      update
    };
  } finally {
    syncingActorIds.delete(actor.id);
  }
}

function uniqueCharacters(actors) {
  return [
    ...new Map(
      (actors ?? [])
        .filter(isCharacter)
        .map(actor => [actor.id, actor])
    ).values()
  ];
}

function allCharacters() {
  return uniqueCharacters(
    game.actors?.contents ?? []
  ).sort((a, b) =>
    a.name.localeCompare(
      b.name,
      game.i18n.lang,
      { sensitivity: "base" }
    )
  );
}

export async function syncActorsFromXpc(
  actors,
  { notify = false } = {}
) {
  const candidates =
    uniqueCharacters(actors);

  const results = [];

  for (const actor of candidates) {
    results.push(
      await syncActorFromXpc(actor)
    );
  }

  if (notify) {
    const count = status =>
      results.filter(
        result => result.status === status
      ).length;

    ui.notifications.info(
      `Synchro XPC : ${count("updated")} mis à jour, ` +
      `${count("noop")} déjà cohérent(s), ` +
      `${count("missing")} sans XPC.`
    );
  }

  return results;
}

export async function syncSelectedFromXpc() {
  const selected = uniqueCharacters(
    (canvas?.tokens?.controlled ?? [])
      .map(token => token.actor)
  );

  const candidates = selected.length
    ? selected
    : allCharacters().filter(
        canCurrentUserUpdate
      );

  if (!candidates.length) {
    ui.notifications.warn(
      "Aucun PJ sélectionné ou accessible."
    );
    return [];
  }

  return syncActorsFromXpc(
    candidates,
    { notify: true }
  );
}

export async function syncAllFromXpc() {
  return syncActorsFromXpc(
    allCharacters().filter(
      canCurrentUserUpdate
    ),
    { notify: true }
  );
}

function changeTouchesXpc(changes) {
  if (!changes) return false;

  const direct =
    `flags.${XPC_FLAG_SCOPE}.${XPC_FLAG_KEY}`;

  if (
    Object.prototype.hasOwnProperty.call(
      changes,
      direct
    )
  ) {
    return true;
  }

  const scoped =
    changes.flags?.[XPC_FLAG_SCOPE];

  if (!scoped) return false;

  return (
    Object.prototype.hasOwnProperty.call(
      scoped,
      XPC_FLAG_KEY
    ) ||
    Object.prototype.hasOwnProperty.call(
      scoped,
      `-=${XPC_FLAG_KEY}`
    )
  );
}

function getRoot(html) {
  if (html instanceof HTMLElement) return html;
  if (html?.[0] instanceof HTMLElement) return html[0];
  return null;
}

function getActor(app) {
  return app?.actor ??
    app?.object ??
    app?.document ??
    null;
}

function findXpHost(root) {
  return (
    root.querySelector(
      ".char-level .exp-data"
    ) ??
    root
      .querySelector(
        '[name="system.details.xp.value"]'
      )
      ?.closest(".exp-data") ??
    null
  );
}

function formatXp(value) {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function compactMarkup(actor) {
  const state = getCareerXpState(actor);

  if (state.status !== "ok") {
    return `
      <div
        class="pf2e-val-career-xp-compact"
        title="XPC maître · flags.${XPC_FLAG_SCOPE}.${XPC_FLAG_KEY}"
      >
        <div class="pf2e-val-career-xp-compact-line">
          <span class="pf2e-val-career-xp-compact-value">
            —
          </span>
        </div>
      </div>
    `;
  }

  const target =
    state.next === null
      ? `${formatXp(state.xpc)}`
      : `${formatXp(state.xpc)} / ${formatXp(state.next)}`;

  return `
    <div
      class="pf2e-val-career-xp-compact"
      title="${escape(
        `XPC maître · flags.${XPC_FLAG_SCOPE}.${XPC_FLAG_KEY}`
      )}"
    >
      <div class="pf2e-val-career-xp-compact-line">
        <span class="pf2e-val-career-xp-compact-value">
          ${escape(target)}
        </span>
      </div>

    </div>
  `;
}

function injectCareerXp(app, html) {
  const actor = getActor(app);
  if (!isCharacter(actor)) return;

  const root = getRoot(html);
  if (!root) return;

  root
    .querySelectorAll(
      ".pf2e-val-career-xp-compact"
    )
    .forEach(element => element.remove());

  const host = findXpHost(root);
  if (!host) return;

  const wrapper =
    document.createElement("div");
  wrapper.innerHTML =
    compactMarkup(actor);

  const block =
    wrapper.firstElementChild;

  if (!block) return;

  // The native PF2e XP is derived from XPC. Replace its visual host so the
  // sheet presents one source of information instead of two conflicting bars.
  host.replaceChildren(block);

}

function rerenderCharacterSheet(actor) {
  if (
    isCharacter(actor) &&
    actor.sheet?.rendered
  ) {
    actor.sheet.render(false);
  }
}

async function initialReconciliation() {
  for (const actor of allCharacters()) {
    if (!isResponsibleClient(actor)) {
      continue;
    }

    await syncActorFromXpc(
      actor,
      {
        requireResponsibleClient: true
      }
    );
  }
}

export function pf2MjApiUrl() {
  return String(
    game.settings.get(MODULE_ID, RESUMES_API_SETTING) ||
    DEFAULT_RESUMES_API_BASE_URL
  ).replace(/\/$/, "");
}

function actorResumeId(actor) {
  return actor?.uuid || `Actor.${actor?.id}`;
}

export function experienceFromResumes(actor, resumes) {
  const actorId = actorResumeId(actor);

  return resumes.reduce((total, resume) => {
    const participants = Array.isArray(resume?.participants)
      ? resume.participants
      : [];
    let earned = participants.includes(actorId)
      ? Number(resume?.sessionXp) || 0
      : 0;

    if (resume?.shortSummaryAuthor === actorId) {
      earned += Number(resume?.shortSummaryXp) || 0;
    }

    if (resume?.longSummaryAuthor === actorId) {
      earned += Number(resume?.longSummaryXp) || 0;
    }

    return total + earned;
  }, 0);
}

async function fetchResumes() {
  const response = await fetch(`${pf2MjApiUrl()}/sessions`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15_000)
  });

  if (!response.ok) {
    throw new Error(`API Résumés indisponible (HTTP ${response.status}).`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload)) {
    throw new Error("La réponse de l'API Résumés est invalide.");
  }

  return payload;
}

export async function syncCareerXpFromResumes({ notify = false } = {}) {
  if (!game.user?.isGM) {
    return { status: "not-gm", updated: 0 };
  }

  const resumes = await fetchResumes();
  let updated = 0;

  for (const actor of allCharacters()) {
    if (!canCurrentUserUpdate(actor)) continue;

    const xpc = experienceFromResumes(actor, resumes);
    if (getXpc(actor) !== xpc) {
      await actor.setFlag(XPC_FLAG_SCOPE, XPC_FLAG_KEY, xpc);
      updated += 1;
    }

    await syncActorFromXpc(actor);
  }

  if (notify) {
    ui.notifications.info(
      `XPC depuis les résumés : ${updated} PJ mis à jour.`
    );
  }

  return { status: "ok", updated, resumes: resumes.length };
}

function exposeApi() {
  game.pf2eValToolkit ??= {};

  const api = {
    flagScope: XPC_FLAG_SCOPE,
    flagKey: XPC_FLAG_KEY,
    thresholds: CAREER_XP_THRESHOLDS,
    thresholdForLevel,
    nextThresholdForLevel,
    levelForXp: levelForCareerXp,
    derive: derivePf2ProgressionFromXpc,
    get: getCareerXpState,
    getTotal: getXpc,
    sync: syncActorFromXpc,
    syncActors: syncActorsFromXpc,
    syncSelected: syncSelectedFromXpc,
    syncAll: syncAllFromXpc,
    syncFromResumes: syncCareerXpFromResumes
  };

  // Compatibility with existing macros/code.
  game.pf2eValToolkit.careerXp = api;
  game.pf2eValToolkit.xpc = api;
}

export function registerCareerXpSettings() {
  game.settings.register(MODULE_ID, RESUMES_API_SETTING, {
    name: "URL API des résumés",
    hint: "Base de l'API utilisée par le MJ pour recalculer l'XPC des PJ.",
    scope: "world",
    config: true,
    type: String,
    default: DEFAULT_RESUMES_API_BASE_URL
  });
}

export function initCareerXp() {
  Hooks.on(
    "renderCharacterSheetPF2e",
    injectCareerXp
  );

  Hooks.on(
    "renderActorSheet",
    injectCareerXp
  );

  Hooks.on(
    "updateActor",
    (
      actor,
      changes,
      options
    ) => {
      if (!isCharacter(actor)) return;

      if (options?.[XPC_SYNC_OPTION]) {
        rerenderCharacterSheet(actor);
        return;
      }

      if (!changeTouchesXpc(changes)) {
        return;
      }

      if (isResponsibleClient(actor)) {
        void syncActorFromXpc(
          actor,
          {
            requireResponsibleClient: true
          }
        ).catch(error => {
          console.error(
            `${MODULE_ID} | Échec synchro XPC pour ${actor.name}`,
            error
          );
        });
      }

      rerenderCharacterSheet(actor);
    }
  );

  exposeApi();

  void syncCareerXpFromResumes().catch(
    error => {
      console.error(
        `${MODULE_ID} | Échec synchro XPC depuis les résumés`,
        error
      );
    }
  );
}
