function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function actorLink(result, label = null) {
  const name =
    label ??
    result?.resolvedName ??
    result?.name ??
    "Créature inconnue";

  if (!result?.uuid) return `<strong>⚠ ${esc(name)}</strong>`;
  return `@UUID[${result.uuid}]{${esc(name)}}`;
}

function resultMap(results) {
  return new Map(results.map(result => [result.key, result]));
}

function sceneMap(scenes = []) {
  return new Map(scenes.map(result => [result.key, result]));
}

function sceneLink(result, label = null) {
  const name = label ?? result?.name ?? "Carte inconnue";
  if (!result?.uuid) return `<strong>⚠ ${esc(name)}</strong>`;
  return `@UUID[${result.uuid}]{${esc(name)}}`;
}

function renderCreature(creature, byKey) {
  const result = byKey.get(creature.actor);
  const count = creature.count === undefined ? "" : ` × ${esc(creature.count)}`;
  const note = creature.note ? ` — <em>${esc(creature.note)}</em>` : "";
  return `<li>${actorLink(result, creature.label)}${count}${note}</li>`;
}

function renderChoice(choice, byKey) {
  const options = (choice.options ?? [])
    .map(option => {
      const result = byKey.get(option.actor);
      return `<li>${actorLink(result, option.label)}</li>`;
    })
    .join("");

  return `
    <li>
      <strong>${esc(choice.label ?? "Choisir une option")}</strong>
      ${choice.note ? ` — <em>${esc(choice.note)}</em>` : ""}
      <ul>${options}</ul>
    </li>
  `;
}

function buildOverviewPage(data) {
  const scenarioFolder =
    `${data.scenario.id.replace(/^PFS-/, "")} - ${data.scenario.name}`;

  const journalHierarchy = [
    data.library?.root ?? "Campagnes",
    data.library?.category ?? "Divers",
    data.library?.collection ?? "Autres",
    scenarioFolder
  ].map(esc).join(" → ");

  const actorHierarchy = [
    data.actorLibrary?.root ?? "MJ",
    data.actorLibrary?.category ??
      data.library?.category ??
      "Divers",
    data.actorLibrary?.collection ??
      data.library?.collection ??
      "Autres",
    scenarioFolder
  ].map(esc).join(" → ");

  const sceneHierarchy = [
    data.sceneLibrary?.root ?? "MJ",
    data.sceneLibrary?.category ??
      data.library?.category ??
      "Divers",
    data.sceneLibrary?.collection ??
      data.library?.collection ??
      "Autres",
    scenarioFolder
  ].map(esc).join(" → ");

  return `
    <h1>${esc(data.scenario.id.replace(/^PFS-/, ""))} — ${esc(data.scenario.name)}</h1>
    ${data.scenario.summary ? `<p>${esc(data.scenario.summary)}</p>` : ""}
    <p><strong>Journal :</strong> ${journalHierarchy}</p>
    <p><strong>Actors MJ :</strong> ${actorHierarchy}</p>
    <p><strong>Scènes MJ :</strong> ${sceneHierarchy}</p>
    ${data.scenario.tier ? `<p><strong>Niveaux :</strong> ${esc(data.scenario.tier)}</p>` : ""}
    ${data.scenario.source ? `<p><strong>Source :</strong> ${esc(data.scenario.source)}</p>` : ""}
    <hr>
    <p>Les créatures et dangers résolus depuis les compendiums PF2e sont copiés dans les Actors du monde sous le dossier <strong>MJ</strong>. Les liens ci-dessous pointent vers ces copies locales, ce qui permet de supprimer facilement les Actors temporaires du scénario après la partie.</p>
  `;
}

function buildEncountersPage(data, importResult) {
  const byKey = resultMap(importResult.results);
  const byMap = sceneMap(importResult.scenes);

  return (data.encounters ?? []).map(encounter => {
    const groups = (encounter.groups ?? []).map(group => {
      const lines = [
        ...(group.creatures ?? []).map(creature => renderCreature(creature, byKey)),
        ...(group.choices ?? []).map(choice => renderChoice(choice, byKey))
      ].join("");

      return `
        <h4>${esc(group.tier ?? "Tous niveaux")}</h4>
        <ul>${lines || "<li>Aucune créature renseignée.</li>"}</ul>
      `;
    }).join("");

    return `
      <h2>${esc(encounter.id ?? "")}${encounter.id ? " — " : ""}${esc(encounter.name)}</h2>
      ${encounter.location ? `<p><strong>Lieu :</strong> ${esc(encounter.location)}</p>` : ""}
      ${encounter.map ? `<p><strong>Carte :</strong> ${sceneLink(byMap.get(encounter.map))}</p>` : ""}
      ${encounter.sourcePage ? `<p><strong>PDF :</strong> p. ${esc(encounter.sourcePage)}</p>` : ""}
      ${encounter.notes ? `<p><em>${esc(encounter.notes)}</em></p>` : ""}
      ${groups}
    `;
  }).join("<hr>");
}

function buildCreatureIndexPage(importResult) {
  const rows = importResult.results.map(result => `
    <tr>
      <td>${actorLink(result)}</td>
      <td>${esc(result.pack ?? "")}</td>
      <td>${esc(result.status)}</td>
    </tr>
  `).join("");

  return `
    <table>
      <thead><tr><th>Créature</th><th>Source</th><th>État</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function buildMapIndexPage(data, importResult) {
  if (!(data.maps ?? []).length) {
    return "<p>Aucune carte renseignée.</p>";
  }

  const byMap = sceneMap(importResult.scenes);

  const rows = (data.maps ?? []).map(map => {
    const result = byMap.get(map.key);

    return `
      <tr>
        <td>${sceneLink(result, map.name)}</td>
        <td>${map.encounters?.length ? esc(map.encounters.join(", ")) : ""}</td>
        <td>${map.sourcePage ? `p. ${esc(map.sourcePage)}` : ""}</td>
        <td>${esc(result?.status ?? "missing")}</td>
      </tr>
    `;
  }).join("");

  return `
    <table>
      <thead>
        <tr>
          <th>Carte / Scène</th>
          <th>Rencontres</th>
          <th>PDF</th>
          <th>État</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

async function replacePages(journal, pages) {
  const ids = journal.pages.map(page => page.id);
  if (ids.length) {
    await journal.deleteEmbeddedDocuments("JournalEntryPage", ids);
  }

  await journal.createEmbeddedDocuments(
    "JournalEntryPage",
    pages.map((page, index) => ({
      name: page.name,
      type: "text",
      sort: (index + 1) * 100000,
      text: {
        format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML,
        content: page.content
      }
    }))
  );
}

export async function createOrUpdateScenarioJournal(data, importResult, folder) {
  const name = data.journal?.title ??
    `${data.scenario.id.replace(/^PFS-/, "")} — ${data.scenario.name}`;

  let journal = game.journal.find(
    entry => entry.folder?.id === folder.id && entry.name === name
  );

  if (!journal) {
    journal = await JournalEntry.create({ name, folder: folder.id });
  }

  await replacePages(journal, [
    { name: "Vue d'ensemble", content: buildOverviewPage(data) },
    { name: "Rencontres & créatures", content: buildEncountersPage(data, importResult) },
    { name: "Cartes", content: buildMapIndexPage(data, importResult) },
    { name: "Index des créatures", content: buildCreatureIndexPage(importResult) }
  ]);

  return journal;
}
