const LEVELER_ID = "pf2e-leveler";
const SUPPORTED_VERSION = "3.7.9";

// Only a proficiency rank at the beginning of a prerequisite qualifies for
// this compatibility rewrite. Do not translate arbitrary text or bypass feats.
const FRENCH_PROFICIENCY_DANS = /^(\s*(?:qualifi(?:e|é)(?:e)?|expert(?:e)?|ma(?:i|î)tre|l(?:e|é)gendaire|inexp(?:e|é)riment(?:e|é)(?:e)?)\s+)dans(?=\s)/iu;

export function normalizeFrenchRankPrerequisite(value) {
  return typeof value === "string"
    ? value.replace(FRENCH_PROFICIENCY_DANS, "$1en")
    : value;
}

function rewriteEntries(entries) {
  if (!Array.isArray(entries)) return { entries, changed: false };
  let changed = false;
  const corrected = entries.map((entry) => {
    const before = entry?.value;
    const after = normalizeFrenchRankPrerequisite(before);
    if (before === after) return entry;
    changed = true;
    return { ...entry, value: after };
  });
  return { entries: corrected, changed };
}

/** Clone only the prerequisite arrays; never mutate Foundry documents/compendiums. */
export function normalizedLevelerFeat(feat) {
  const source = rewriteEntries(feat?._source?.system?.prerequisites?.value);
  const current = rewriteEntries(feat?.system?.prerequisites?.value);
  if (!source.changed && !current.changed) return null;
  const clone = { ...feat, slug: feat.slug, traits: feat.traits };
  if (feat.system) {
    clone.system = {
      ...feat.system,
      prerequisites: { ...feat.system.prerequisites, value: current.entries },
    };
  }
  if (feat._source) {
    clone._source = {
      ...feat._source,
      system: {
        ...feat._source.system,
        prerequisites: {
          ...feat._source.system?.prerequisites,
          value: source.entries,
        },
      },
    };
  }
  return clone;
}

// This guard mirrors the independent dedication restriction in Leveler 3.7.9.
// Passing a textual prerequisite must never clear a separate dedication lock.
function dedicationBlocked(picker, feat) {
  const traits = (feat.system?.traits?.value ?? []).map((trait) => String(trait).toLowerCase());
  const slug = feat.slug ?? null;
  const existing = picker.buildState?.archetypeDedications ?? new Set();
  return picker.category !== "custom"
    && !picker._ignoreDedicationLock
    && traits.includes("dedication")
    && picker.buildState?.canTakeNewArchetypeDedication === false
    && (!slug || !existing.has(slug));
}

export function patchLevelerFeatPicker(FeatPicker, checkPrerequisites) {
  const prototype = FeatPicker?.prototype;
  if (!prototype || typeof prototype._enrichWithPrerequisites !== "function"
    || typeof checkPrerequisites !== "function") return false;
  if (prototype._enrichWithPrerequisites.__pf2ValFrenchRankPatch) return true;

  const original = prototype._enrichWithPrerequisites;
  function patched(feats) {
    const result = original.call(this, feats);
    for (const feat of feats ?? []) {
      if (!feat.hasFailedPrerequisites || dedicationBlocked(this, feat)) continue;
      const normalized = normalizedLevelerFeat(feat);
      if (!normalized) continue;
      const verification = checkPrerequisites(normalized, this._getPrerequisiteBuildState(feat));
      // All the prerequisite clauses must pass. Unknown or other failed
      // conditions stay blocked, exactly as before.
      if (verification.met !== true) continue;

      const showPrereqs = game.settings.get(LEVELER_ID, "showPrerequisites");
      feat.prereqResults = showPrereqs ? verification.results : [];
      feat.prereqTree = showPrereqs ? verification.tree : null;
      feat.hasFailedPrerequisites = false;
      feat.hasUnknownPrerequisites = verification.results.some((entry) => entry.met == null);
      feat.prerequisitesFailed = false;
      feat.selectionBlocked = feat.guidanceSelectionBlocked === true;
    }
    return result;
  }
  patched.__pf2ValFrenchRankPatch = true;
  prototype._enrichWithPrerequisites = patched;
  return true;
}

async function installLevelerFrenchRankPatch() {
  const installed = game.modules.get(LEVELER_ID);
  if (!installed?.active) return { installed: false, reason: "inactive" };
  if (installed.version !== SUPPORTED_VERSION) {
    console.info(`PF2e Val Toolkit | PF2e Leveler version ${installed.version} : correctif français non appliqué (version non vérifiée).`);
    return { installed: false, reason: "unsupported-version" };
  }
  // Resolve relatively to the current toolkit module. This retains any
  // Foundry route prefix and uses Leveler's existing browser ES modules.
  const featPickerUrl = new URL("../../../pf2e-leveler/scripts/ui/feat-picker.js", import.meta.url);
  const checkerUrl = new URL("../../../pf2e-leveler/scripts/prerequisites/prerequisite-checker.js", import.meta.url);
  const [{ FeatPicker }, { checkPrerequisites }] = await Promise.all([
    import(featPickerUrl.href), import(checkerUrl.href),
  ]);
  if (!patchLevelerFeatPicker(FeatPicker, checkPrerequisites)) {
    throw new Error("Interface de PF2e Leveler incompatible avec le correctif");
  }
  return { installed: true };
}

export const levelerFrenchRanksPatch = {
  id: "leveler-french-rank-prerequisites",
  label: "PF2e Leveler 3.7.9 : prérequis « qualifié dans »",
  enabled: true,
  init() {
    const ready = installLevelerFrenchRankPatch()
      .then((result) => {
        if (result.installed) console.info("PF2e Val Toolkit | Prérequis français PF2e Leveler corrigés.");
        return result;
      })
      .catch((error) => {
        console.error("PF2e Val Toolkit | Correctif PF2e Leveler indisponible :", error);
        return { installed: false, reason: "error" };
      });
    return { ready };
  },
};
