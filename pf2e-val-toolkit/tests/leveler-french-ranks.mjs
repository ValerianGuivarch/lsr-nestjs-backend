import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import {
  normalizeFrenchRankPrerequisite,
  normalizedLevelerFeat,
  patchLevelerFeatPicker,
} from "../scripts/patches/leveler-french-ranks.js";

assert.equal(normalizeFrenchRankPrerequisite("Qualifié dans au moins une compétence"), "Qualifié en au moins une compétence");
assert.equal(normalizeFrenchRankPrerequisite("Expert dans Médecine"), "Expert en Médecine");
assert.equal(normalizeFrenchRankPrerequisite("Maître dans Diplomatie"), "Maître en Diplomatie");
assert.equal(normalizeFrenchRankPrerequisite("Qualifié en Diplomatie"), "Qualifié en Diplomatie");
assert.equal(normalizeFrenchRankPrerequisite("Aptitude spéciale dans une compétence"), "Aptitude spéciale dans une compétence");
assert.equal(normalizeFrenchRankPrerequisite("Trained in Stealth"), "Trained in Stealth");

const feat = {
  name: "Assurance",
  slug: "assurance",
  system: {
    prerequisites: { value: [{ value: "Qualifié dans au moins une compétence" }] },
    traits: { value: ["skill"] },
  },
  _source: {
    system: {
      prerequisites: { value: [{ value: "Qualifié dans au moins une compétence" }] },
    },
  },
};
const clone = normalizedLevelerFeat(feat);
assert.equal(clone._source.system.prerequisites.value[0].value, "Qualifié en au moins une compétence");
assert.equal(clone.system.prerequisites.value[0].value, "Qualifié en au moins une compétence");
assert.equal(feat._source.system.prerequisites.value[0].value, "Qualifié dans au moins une compétence");
assert.equal(feat.system.prerequisites.value[0].value, "Qualifié dans au moins une compétence");

globalThis.game = {
  system: { id: "pf2e" },
  i18n: { has: () => false },
  modules: { get: () => null },
  settings: { get: () => true },
};

let actualChecker;
const levelerPath = "/home/valou/services/foundry/data/Data/modules/pf2e-leveler/scripts/prerequisites/prerequisite-checker.js";
if (existsSync(levelerPath)) {
  ({ checkPrerequisites: actualChecker } = await import("file://" + levelerPath));
} else {
  actualChecker = (candidate, buildState) => {
    const prerequisites = candidate._source?.system?.prerequisites?.value ?? candidate.system.prerequisites.value;
    const results = prerequisites.map((item) => ({
      text: item.value,
      met: item.value === "Qualifié en au moins une compétence"
        ? Object.values(buildState.skills ?? {}).some((rank) => rank >= 1)
        : false,
    }));
    return { met: results.every((r) => r.met), results, tree: {} };
  };
}

class MockPicker {
  constructor(buildState) {
    this.buildState = buildState;
    this.enforcePrerequisites = true;
    this.category = "skill";
  }
  _getPrerequisiteBuildState() { return this.buildState; }
  _enrichWithPrerequisites(feats) {
    for (const item of feats) {
      const check = actualChecker(item, this.buildState);
      item.prereqResults = check.results;
      item.prereqTree = check.tree;
      item.hasFailedPrerequisites = check.met === false;
      item.prerequisitesFailed = item.hasFailedPrerequisites;
      item.selectionBlocked = this.enforcePrerequisites && item.hasFailedPrerequisites;
    }
  }
}

assert.equal(patchLevelerFeatPicker(MockPicker, actualChecker), true);
assert.equal(patchLevelerFeatPicker(MockPicker, actualChecker), true); // idempotent
const successFeat = structuredClone(feat);
new MockPicker({level:2,skills:{diplomacy:1},feats:new Set()})._enrichWithPrerequisites([successFeat]);
assert.equal(successFeat.hasFailedPrerequisites, false);
assert.equal(successFeat.selectionBlocked, false);
assert.equal(successFeat.prereqResults[0].met, true);
assert.equal(successFeat._source.system.prerequisites.value[0].value, "Qualifié dans au moins une compétence");

const missingSkill = structuredClone(feat);
new MockPicker({level:2,skills:{diplomacy:0},feats:new Set()})._enrichWithPrerequisites([missingSkill]);
assert.equal(missingSkill.selectionBlocked, true);

const otherRestriction = structuredClone(feat);
otherRestriction.system.prerequisites.value.push({value:"Expert en Médecine"});
otherRestriction._source.system.prerequisites.value.push({value:"Expert en Médecine"});
new MockPicker({level:2,skills:{diplomacy:1,medicine:1},feats:new Set()})._enrichWithPrerequisites([otherRestriction]);
assert.equal(otherRestriction.selectionBlocked, true);

const dedication = structuredClone(feat);
dedication.system.traits.value.push("dedication");
new MockPicker({level:2,skills:{diplomacy:1},feats:new Set(),canTakeNewArchetypeDedication:false,archetypeDedications:new Set()})
  ._enrichWithPrerequisites([dedication]);
assert.equal(dedication.selectionBlocked, true);

const policyBlocked = structuredClone(feat);
policyBlocked.guidanceSelectionBlocked = true;
new MockPicker({level:2,skills:{diplomacy:1},feats:new Set()})._enrichWithPrerequisites([policyBlocked]);
assert.equal(policyBlocked.selectionBlocked, true);

console.log("PF2e Leveler French prerequisite compatibility tests passed");
