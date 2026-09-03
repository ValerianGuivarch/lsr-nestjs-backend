import { validateScenarioData } from "./parser.js";
import { findActorInCompendiums } from "./compendium-resolver.js";
import { createCustomNpc, importCompendiumActor, linkNarrativeNpc } from "./actor-builder.js";
import { ensureScenarioFolderTree } from "./folder-manager.js";
import { createOrUpdateScenarioJournal } from "./journal-builder.js";
import { createOrUpdateScenarioScenes } from "./scene-builder.js";
import { resolveScenarioAssets } from "./asset-resolver.js";
import { loadScenarioPackage } from "./package-importer.js";
import { pf2MjApiUrl } from "../career-xp/index.js";

async function selectScenarioFile() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept =
    ".json,.zip,application/json,application/zip,application/x-zip-compressed";

  return new Promise(resolve => {
    input.addEventListener(
      "change",
      () => resolve(input.files?.[0] ?? null),
      { once: true }
    );
    input.click();
  });
}

async function loadScenarioInput(file) {
  const name = String(file?.name ?? "").toLowerCase();

  if (name.endsWith(".zip")) {
    const result = await loadScenarioPackage(file);

    if (result.assetCount) {
      ui.notifications.info(
        `${result.assetCount} asset(s) de scénario importé(s).`
      );
    }

    return result.data;
  }

  if (
    name.endsWith(".json") ||
    file?.type === "application/json"
  ) {
    return JSON.parse(await file.text());
  }

  throw new Error(
    "Format non reconnu. Sélectionne un fichier .json ou .zip."
  );
}

async function processReference(definition, folder, scenarioId) {
  const matches = await findActorInCompendiums(definition);

  if (!matches.length) {
    return {
      key: definition.key,
      name: definition.name,
      type: "reference",
      status: "missing"
    };
  }

  const match = matches[0];
  const sourceActor = await fromUuid(match.uuid);

  if (!sourceActor || sourceActor.documentName !== "Actor") {
    return {
      key: definition.key,
      name: definition.name,
      type: "reference",
      status: "error",
      sourceUuid: match.uuid
    };
  }

  const imported = await importCompendiumActor(
    sourceActor,
    folder,
    {
      ...definition,
      scenarioId
    }
  );

  return {
    key: definition.key,
    name: definition.name,
    type: "reference",
    status:
      matches.length > 1
        ? `ambiguous-${imported.status}`
        : imported.status,
    uuid: imported.actor.uuid,
    actor: imported.actor,
    sourceUuid: match.uuid,
    pack: match.pack?.collection ?? match.pack ?? definition.preferredPack ?? "",
    resolvedName: imported.actor.name
  };
}

async function processCustom(definition, folder) {
  const result = await createCustomNpc(definition, folder);

  return {
    key: definition.key,
    name: definition.name,
    type: "custom",
    status: result.status,
    uuid: result.actor.uuid,
    actor: result.actor,
    pack: "Monde"
  };
}

async function processNarrative(definition, folder, scenarioId) {
  const existing = game.actors.find(actor => actor.getFlag("pf2e-val-toolkit", "npcId") === definition.npcId);
  if (existing) {
    await linkNarrativeNpc(existing, definition.npcId, definition);
    return { key: definition.key, name: definition.name, type: "narrative", status: "existing", uuid: existing.uuid, actor: existing, npcId: definition.npcId };
  }
  const actorDefinition = { ...definition.actor, key: definition.key, name: definition.name, image: definition.image };
  const result = actorDefinition.type === "reference"
    ? await processReference(actorDefinition, folder, scenarioId)
    : await processCustom(actorDefinition, folder);
  if (result.actor) await linkNarrativeNpc(result.actor, definition.npcId, definition);
  return { ...result, type: "narrative", npcId: definition.npcId };
}

function actorLibraryFor(data) {
  return {
    root: data.actorLibrary?.root ?? "MJ",
    category:
      data.actorLibrary?.category ??
      data.library?.category ??
      "Divers",
    collection:
      data.actorLibrary?.collection ??
      data.library?.collection ??
      "Autres"
  };
}

function sceneLibraryFor(data) {
  return {
    root: data.sceneLibrary?.root ?? "MJ",
    category:
      data.sceneLibrary?.category ??
      data.library?.category ??
      "Divers",
    collection:
      data.sceneLibrary?.collection ??
      data.library?.collection ??
      "Autres"
  };
}

async function runScenarioImport(rawData) {
  const data = resolveScenarioAssets(rawData);

  const actorFolders = await ensureScenarioFolderTree(
    "Actor",
    actorLibraryFor(data),
    data.scenario
  );

  const sceneFolders = await ensureScenarioFolderTree(
    "Scene",
    sceneLibraryFor(data),
    data.scenario
  );

  const journalFolders = await ensureScenarioFolderTree(
    "JournalEntry",
    data.library,
    data.scenario
  );

  const results = [];

  for (const definition of data.actors) {
    try {
      if (definition.type === "reference") {
        results.push(
          await processReference(
            definition,
            actorFolders.scenario,
            data.scenario.id
          )
        );
      } else if (definition.type === "custom") {
        results.push(await processCustom(definition, actorFolders.scenario));
      } else if (definition.type === "narrative") {
        results.push(await processNarrative(definition, actorFolders.scenario, data.scenario.id));
      } else {
        results.push({
          key: definition.key,
          name: definition.name,
          type: definition.type,
          status: "unknown-type"
        });
      }
    } catch (error) {
      console.error(`PF2e Val Toolkit | Erreur sur ${definition.name}`, error);
      results.push({
        key: definition.key,
        name: definition.name,
        type: definition.type,
        status: "error"
      });
    }
  }

  const scenes = await createOrUpdateScenarioScenes(
    data,
    sceneFolders.scenario
  );

  const importResult = {
    data,
    actorFolders,
    sceneFolders,
    journalFolders,
    results,
    scenes
  };

  importResult.journal = await createOrUpdateScenarioJournal(
    data,
    importResult,
    journalFolders.scenario
  );

  return importResult;
}

function showSummary(data, result) {
  console.table(result.results.map(item => ({
    name: item.name,
    resolvedName: item.resolvedName ?? "",
    status: item.status,
    uuid: item.uuid ?? "",
    sourceUuid: item.sourceUuid ?? ""
  })));

  const missing = result.results.filter(item =>
    ["missing", "error"].includes(item.status)
  );
  const badMaps = (result.scenes ?? []).filter(item =>
    ["invalid", "error"].includes(item.status)
  );

  if (result.scenes?.length) {
    console.table(result.scenes.map(item => ({
      map: item.name,
      status: item.status,
      uuid: item.uuid ?? "",
      levelUuid: item.levelUuid ?? "",
      image: item.image ?? ""
    })));
  }

  if (missing.length || badMaps.length) {
    ui.notifications.warn(
      `${data.scenario.id} importé avec ${missing.length} référence(s) non résolue(s) et ${badMaps.length} carte(s) en erreur.`
    );
  } else {
    ui.notifications.info(
      `${data.scenario.id} : Actors, cartes et journal importés.`
    );
  }

  result.journal?.sheet?.render(true);
}

async function notifyApplicationDeployment(data, result) {
  const failedActors = result.results.filter(item => ["missing", "error"].includes(item.status));
  const failedScenes = (result.scenes ?? []).filter(item => ["invalid", "error"].includes(item.status));
  if (failedActors.length || failedScenes.length) {
    console.warn("PF2e Val Toolkit | Déploiement non signalé : import partiel.");
    return;
  }
  try {
    const response = await fetch(`${pf2MjApiUrl()}/scenario-packages/${encodeURIComponent(data.scenario.id)}/deployed`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ packageVersion: data.packageVersion ?? 1, worldId: game.world.id, actorUuids: result.results.map(item => item.uuid).filter(Boolean), sceneUuids: (result.scenes ?? []).map(item => item.uuid).filter(Boolean) }),
      signal: AbortSignal.timeout(10_000)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    console.info(`PF2e Val Toolkit | Déploiement signalé : ${data.scenario.id}.`);
  } catch (error) {
    console.warn("PF2e Val Toolkit | API indisponible : import Foundry conservé.", error);
  }
}

async function importScenario() {
  const file = await selectScenarioFile();
  if (!file) return;

  try {
    const data = await loadScenarioInput(file);
    const errors = validateScenarioData(data);

    if (errors.length) {
      ui.notifications.error(`Scénario invalide : ${errors.join(" | ")}`);
      return;
    }

    const result = await runScenarioImport(data);
    showSummary(data, result);
    await notifyApplicationDeployment(data, result);
  } catch (error) {
    console.error("PF2e Val Toolkit | Erreur d'import", error);
    ui.notifications.error("Impossible d'importer le scénario.");
  }
}

export function initScenarioImporter() {
  game.pf2eValToolkit = game.pf2eValToolkit ?? {};
  game.pf2eValToolkit.importScenario = importScenario;
}
