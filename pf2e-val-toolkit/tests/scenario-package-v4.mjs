import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function moduleFrom(relativePath) {
  const url = new URL(relativePath, import.meta.url);
  const source = await readFile(url, "utf8");
  return import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
}

const { validateScenarioData } = await moduleFrom("../scripts/scenario-importer/parser.js");

const completeActor = {
  key: "boss",
  name: "Boss",
  type: "custom",
  data: {
    mode: "statblock",
    level: 5,
    ac: 22,
    hp: 70,
    perception: 12,
    saves: { fortitude: 13, reflex: 10, will: 11 },
    speed: 25,
    skills: {},
    attacks: [{ name: "Strike", bonus: 14, damage: [{ formula: "1d8+6", type: "slashing" }] }]
  }
};

assert.deepEqual(validateScenarioData({
  packageFormatVersion: 4,
  packageVersion: 1,
  scenario: { id: "good", name: "Good" },
  npcs: [],
  actors: [completeActor],
  maps: []
}), []);

const badActorErrors = validateScenarioData({
  packageFormatVersion: 4,
  packageVersion: 1,
  scenario: { id: "bad", name: "Bad" },
  npcs: [],
  actors: [{ key: "boss", name: "Boss", type: "custom", data: { mode: "statblock", level: 5 } }],
  maps: []
});
assert.ok(badActorErrors.some(error => error.includes("data.ac")));
assert.ok(badActorErrors.some(error => error.includes("simple niveau/CA/PV")));

const badMapErrors = validateScenarioData({
  packageFormatVersion: 4,
  packageVersion: 1,
  scenario: { id: "map", name: "Map" },
  npcs: [],
  actors: [],
  maps: [{ key: "map", name: "Map", image: "assets/maps/map.webp", grid: { type: "square", size: 100, distance: 5 } }]
});
assert.ok(badMapErrors.some(error => error.includes("grid.columns/rows/bounds")));
assert.ok(badMapErrors.some(error => error.includes("paddingCells")));

const legacyErrors = validateScenarioData({
  packageVersion: 2,
  scenario: { id: "legacy", name: "Legacy" },
  npcs: [],
  actors: [{ key: "boss", name: "Boss", type: "custom", data: { level: 5 } }],
  maps: []
});
assert.deepEqual(legacyErrors, []);

globalThis.CONST = { GRID_TYPES: { GRIDLESS: 0, SQUARE: 1 } };
const { resolveScenarioGrid } = await moduleFrom("../scripts/scenario-importer/scene-builder.js");
const measured = resolveScenarioGrid({
  name: "Measured",
  grid: {
    type: "square",
    columns: 10,
    rows: 15,
    bounds: { x: 23, y: 31, width: 1000, height: 1500 },
    paddingCells: 1,
    distance: 5
  }
});
assert.equal(measured.size, 100);
assert.equal(measured.sceneWidth, 1200);
assert.equal(measured.sceneHeight, 1700);
assert.equal(measured.shiftX, 77);
assert.equal(measured.shiftY, 69);

globalThis.foundry = { utils: { deepClone: value => structuredClone(value) } };
const { customNpcSource } = await moduleFrom("../scripts/scenario-importer/actor-builder.js");
const built = customNpcSource(completeActor, { scenarioId: "good", packageVersion: 2, folderId: "folder" });
assert.equal(built.actorData.system.attributes.ac.value, 22);
assert.equal(built.actorData.system.attributes.hp.max, 70);
assert.equal(built.actorData.system.perception.mod, 12);
assert.equal(built.actorData.system.saves.fortitude.value, 13);
assert.equal(built.items[0].type, "melee");
assert.equal(built.items[0].system.bonus.value, 14);
assert.equal(built.actorData.flags["pf2e-val-toolkit"].packageVersion, 2);

console.log("scenario-package-v4: OK");
