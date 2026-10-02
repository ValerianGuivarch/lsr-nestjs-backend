const MODULE_ID = "pf2e-val-automations";
const AUTOMATIONS_ID = "pf2e-automations";

const RULES_SETTING = "rulesV3";
const RULE_VERSION_SETTING = "ruleVersion3";

const SPRAY_OF_STARS_SOURCE =
  "Compendium.pf2e.spells-srd.Item.mlNYROcFrUF8nFgk";
const SPRAY_OF_STARS_SLUG = "spray-of-stars";
const SPRAY_OF_STARS_RULE_ID = "val-spray-of-stars";
const SPRAY_OF_STARS_EFFECT_SLUG = "val-spray-of-stars-dazzled";

function sprayValue(value, unit) {
  return {
    name: "Aspersion d'étoiles",
    slug: SPRAY_OF_STARS_EFFECT_SLUG,
    immunities: [],
    conditions: ["dazzled"],
    effects: [],
    duration: {
      expiry: "turn-start",
      sustained: false,
      unit,
      value
    }
  };
}

const SPRAY_OF_STARS_RULE = {
  uuid: SPRAY_OF_STARS_RULE_ID,
  group: "spell",
  name: "Spray of Stars — Val",
  labels: [
    "concentrate",
    "fire",
    "focus",
    "light",
    "manipulate",
    "oracle"
  ],
  source: [SPRAY_OF_STARS_SOURCE],
  isActive: true,
  baseRules: [],
  complexRules: [
    {
      type: "complex",
      triggerType: "saving-throw",
      range: null,
      extend: null,
      predicate: [
        "origin:item:spray-of-stars",
        "outcome:success"
      ],
      target: "SelfEffect",
      value: "",
      values: [sprayValue(1, "rounds")]
    },
    {
      type: "complex",
      triggerType: "saving-throw",
      range: null,
      extend: null,
      predicate: [
        "origin:item:spray-of-stars",
        "outcome:failure"
      ],
      target: "SelfEffect",
      value: "",
      values: [sprayValue(3, "rounds")]
    },
    {
      type: "complex",
      triggerType: "saving-throw",
      range: null,
      extend: null,
      predicate: [
        "origin:item:spray-of-stars",
        "outcome:criticalFailure"
      ],
      target: "SelfEffect",
      value: "",
      values: [sprayValue(1, "minutes")]
    }
  ],
  handlerRules: []
};

function isActiveGM() {
  if (!game.user?.isGM) return false;

  const activeGM = game.users?.activeGM;
  return !activeGM || activeGM.id === game.user.id;
}

function predicatesContain(value, expected) {
  if (value === expected) return true;

  if (Array.isArray(value)) {
    return value.some((entry) =>
      predicatesContain(entry, expected)
    );
  }

  if (value && typeof value === "object") {
    return Object.values(value).some((entry) =>
      predicatesContain(entry, expected)
    );
  }

  return false;
}

function groupCoversSprayOfStars(group) {
  if (!group || typeof group !== "object") return false;

  if (
    Array.isArray(group.source) &&
    group.source.includes(SPRAY_OF_STARS_SOURCE)
  ) {
    return true;
  }

  const allRules = [
    ...(group.baseRules ?? []),
    ...(group.complexRules ?? []),
    ...(group.handlerRules ?? [])
  ];

  return allRules.some((rule) =>
    predicatesContain(
      rule?.predicate,
      `origin:item:${SPRAY_OF_STARS_SLUG}`
    ) ||
    predicatesContain(
      rule?.predicate,
      `item:slug:${SPRAY_OF_STARS_SLUG}`
    ) ||
    predicatesContain(
      rule?.predicate,
      `item:${SPRAY_OF_STARS_SLUG}`
    )
  );
}

/**
 * PF2e Automations 1.4.8 sait générer une condition avec durée,
 * mais pour cette branche il utilise comme origin l'acteur qui fait
 * la sauvegarde.
 *
 * L'UUID du sort d'origine reste cependant présent dans
 * system.context.origin.item. On s'en sert donc pour retrouver
 * SYNCHRONEMENT le véritable lanceur.
 *
 * Ce hook ne décide d'aucune mécanique :
 * - le degré de réussite reste géré par PF2e Automations ;
 * - la condition reste gérée par PF2e ;
 * - la durée reste définie par rulesV3.
 *
 * Il corrige uniquement les métadonnées que rulesV3 ne permet pas
 * d'exprimer dans le générateur conditions+duration.
 */
Hooks.on("preCreateItem", (item) => {
  if (item?.type !== "effect") return;
  if (item?.slug !== SPRAY_OF_STARS_EFFECT_SLUG) return;

  const originItemUuid = item.system?.context?.origin?.item;
  if (!originItemUuid) return;

  let sourceItem = null;

  try {
    if (typeof fromUuidSync === "function") {
      sourceItem = fromUuidSync(originItemUuid);
    }
  } catch (error) {
    console.warn(
      `${MODULE_ID} | Impossible de résoudre l'origine de Spray of Stars.`,
      error
    );
  }

  if (!sourceItem) {
    const match =
      /^Actor\.([^.]+)\.Item\.([^.]+)$/.exec(originItemUuid);

    if (match) {
      sourceItem =
        game.actors.get(match[1])?.items.get(match[2]) ?? null;
    }
  }

  if (sourceItem?.slug !== SPRAY_OF_STARS_SLUG) return;

  const caster = sourceItem.actor;
  if (!caster) return;

  const combatant = game.combat?.combatants.find(
    (entry) => entry.actor?.uuid === caster.uuid
  );

  const activeToken =
    caster.getActiveTokens?.()[0]?.document ?? null;

  const changes = {
    "system.tokenIcon.show": false,
    "system.context.origin.actor": caster.uuid,
    "system.context.origin.item": sourceItem.uuid,
    "system.context.origin.token": activeToken?.uuid ?? null
  };

  if (Number.isFinite(combatant?.initiative)) {
    changes["system.start.initiative"] =
      combatant.initiative;
  }

  item.updateSource(changes);
});

async function waitForPf2eAutomationsSync() {
  try {
    const response = await fetch(
      `/modules/${AUTOMATIONS_ID}/rules/version.json`,
      { cache: "no-store" }
    );

    if (!response.ok) return;

    const data = await response.json();
    const expectedVersion = Number(data?.version ?? 0);

    if (!expectedVersion) return;

    const deadline = Date.now() + 8000;

    while (Date.now() < deadline) {
      const currentVersion = Number(
        game.settings.get(
          AUTOMATIONS_ID,
          RULE_VERSION_SETTING
        ) ?? 0
      );

      if (currentVersion >= expectedVersion) return;

      await new Promise((resolve) =>
        setTimeout(resolve, 200)
      );
    }

    console.warn(
      `${MODULE_ID} | Timeout en attendant la synchronisation de PF2e Automations.`
    );
  } catch (error) {
    console.warn(
      `${MODULE_ID} | Impossible de vérifier la version des règles PF2e Automations.`,
      error
    );
  }
}

async function syncCustomRules() {
  if (!isActiveGM()) return;

  const automations = game.modules.get(AUTOMATIONS_ID);

  if (!automations?.active) {
    ui.notifications.error(
      "PF2e Val Automations nécessite PF2e Automations actif."
    );
    return;
  }

  await waitForPf2eAutomationsSync();

  const rules = foundry.utils.deepClone(
    game.settings.get(
      AUTOMATIONS_ID,
      RULES_SETTING
    ) ?? {}
  );

  const officialSprayRule =
    Object.entries(rules).find(
      ([id, group]) =>
        id !== SPRAY_OF_STARS_RULE_ID &&
        groupCoversSprayOfStars(group)
    );

  let changed = false;

  if (officialSprayRule) {
    if (rules[SPRAY_OF_STARS_RULE_ID]) {
      delete rules[SPRAY_OF_STARS_RULE_ID];
      changed = true;

      console.info(
        `${MODULE_ID} | Règle custom Spray of Stars retirée : ` +
        `PF2e Automations couvre maintenant ce sort ` +
        `(${officialSprayRule[0]}).`
      );
    }
  } else {
    const current =
      rules[SPRAY_OF_STARS_RULE_ID];

    if (
      JSON.stringify(current) !==
      JSON.stringify(SPRAY_OF_STARS_RULE)
    ) {
      rules[SPRAY_OF_STARS_RULE_ID] =
        foundry.utils.deepClone(
          SPRAY_OF_STARS_RULE
        );

      changed = true;

      console.info(
        `${MODULE_ID} | Règle custom Spray of Stars installée/mise à jour.`
      );
    }
  }

  if (!changed) {
    console.info(
      `${MODULE_ID} | Règles custom déjà à jour.`
    );
    return;
  }

  await game.settings.set(
    AUTOMATIONS_ID,
    RULES_SETTING,
    rules
  );

  ui.notifications.info(
    "PF2e Val Automations a mis à jour les règles. Un rechargement est nécessaire."
  );

  foundry.applications.settings.SettingsConfig.reloadConfirm({
    world: true
  });
}

Hooks.once("ready", () => {
  void syncCustomRules();
});
