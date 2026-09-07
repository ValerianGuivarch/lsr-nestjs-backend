const MODULE_ID = "pf2e-val-toolkit";

function safeSegment(value) {
  return String(value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "scenario";
}
function scenarioFolderNamePrefix(scenarioId) { return `${String(scenarioId).replace(/^PFS-/, "")} - `; }
function scenarioFolders(type, scenarioId) { const prefix = scenarioFolderNamePrefix(scenarioId); return game.folders.filter(folder => folder.type === type && folder.name.startsWith(prefix)); }

async function deleteAssetsBestEffort(scenarioId) {
  const root = `worlds/${game.world.id}/pf2e-val-toolkit/scenarios/${safeSegment(scenarioId)}`;
  const picker = foundry.applications.apps.FilePicker.implementation;
  if (typeof picker?.delete !== "function") return { root, deleted: false, reason: "FilePicker.delete indisponible" };
  const remove = async path => {
    let content;
    try { content = await picker.browse("data", path); } catch { return; }
    for (const directory of content.dirs ?? []) await remove(directory);
    for (const file of content.files ?? []) { try { await picker.delete("data", file, { notify: false }); } catch { } }
    try { await picker.delete("data", path, { notify: false }); } catch { }
  };
  try { await remove(root); return { root, deleted: true }; }
  catch (error) { return { root, deleted: false, reason: error instanceof Error ? error.message : String(error) }; }
}

export async function resetScenarioFromFoundry(deployment) {
  const scenarioId = deployment.scenarioId;
  const payload = deployment.payload ?? {};
  const preserveNpcIds = new Set(Array.isArray(payload.preserveNpcIds) ? payload.preserveNpcIds.map(String) : []);
  const actorFolders = scenarioFolders("Actor", scenarioId);
  const sceneFolders = scenarioFolders("Scene", scenarioId);
  const journalFolders = scenarioFolders("JournalEntry", scenarioId);
  const actorFolderIds = new Set(actorFolders.map(folder => folder.id));
  const sceneFolderIds = new Set(sceneFolders.map(folder => folder.id));
  const journalFolderIds = new Set(journalFolders.map(folder => folder.id));
  const scenes = game.scenes.filter(scene => scene.getFlag(MODULE_ID, "scenarioId") === scenarioId || sceneFolderIds.has(scene.folder?.id));
  const actors = game.actors.filter(actor => {
    const npcId = actor.getFlag(MODULE_ID, "npcId");
    if (npcId && preserveNpcIds.has(String(npcId))) return false;
    return actor.getFlag(MODULE_ID, "scenarioId") === scenarioId || actorFolderIds.has(actor.folder?.id);
  });
  const journals = game.journal.filter(entry => journalFolderIds.has(entry.folder?.id));
  if (scenes.length) await Scene.deleteDocuments(scenes.map(scene => scene.id));
  if (journals.length) await JournalEntry.deleteDocuments(journals.map(entry => entry.id));
  if (actors.length) await Actor.deleteDocuments(actors.map(actor => actor.id));
  const folders = [...actorFolders, ...sceneFolders, ...journalFolders];
  if (folders.length) { try { await Folder.deleteDocuments(folders.map(folder => folder.id)); } catch (error) { console.warn("PF2e Val Toolkit | Dossiers scénario non supprimés", error); } }
  const assets = await deleteAssetsBestEffort(scenarioId);
  return { actorsDeleted: actors.length, scenesDeleted: scenes.length, journalsDeleted: journals.length, foldersDeleted: folders.length, preservedNarrativeActors: game.actors.filter(actor => { const npcId = actor.getFlag(MODULE_ID, "npcId"); return npcId && preserveNpcIds.has(String(npcId)); }).length, assets };
}
