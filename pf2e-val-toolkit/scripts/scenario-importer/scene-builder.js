const MODULE_ID = "pf2e-val-toolkit";

function gridType(value) {
  return String(
    value ?? "square"
  ).toLowerCase() === "gridless"
    ? CONST.GRID_TYPES.GRIDLESS
    : CONST.GRID_TYPES.SQUARE;
}

function sceneName(map) {
  return map.title ??
    map.name ??
    map.key ??
    "Carte";
}

function positiveNumber(value) {
  const number = Number(value);

  return (
    Number.isFinite(number) &&
    number > 0
  )
    ? number
    : null;
}

function finiteNumber(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function hasMeasuredGrid(grid) {
  return Boolean(
    positiveNumber(grid?.columns) &&
    positiveNumber(grid?.rows) &&
    positiveNumber(
      grid?.bounds?.width
    ) &&
    positiveNumber(
      grid?.bounds?.height
    )
  );
}

function stableGridSize(value) {
  return Math.round(value * 1000) / 1000;
}

export function resolveScenarioGrid(map) {
  const grid = map?.grid ?? {};
  const type = gridType(grid.type);
  const distance =
    positiveNumber(grid.distance) ?? 5;
  const units =
    String(grid.units ?? "ft");

  if (
    type === CONST.GRID_TYPES.GRIDLESS
  ) {
    return {
      type,
      size:
        positiveNumber(grid.size) ?? 50,
      distance,
      units,
      shiftX: 0,
      shiftY: 0,
      mode: "gridless"
    };
  }

  if (hasMeasuredGrid(grid)) {
    const columns =
      positiveNumber(grid.columns);
    const rows =
      positiveNumber(grid.rows);

    const boundsWidth =
      positiveNumber(
        grid.bounds.width
      );
    const boundsHeight =
      positiveNumber(
        grid.bounds.height
      );

    const boundsX =
      finiteNumber(grid.bounds.x) ?? 0;
    const boundsY =
      finiteNumber(grid.bounds.y) ?? 0;

    const cellWidth =
      boundsWidth / columns;
    const cellHeight =
      boundsHeight / rows;

    const size = stableGridSize(
      (cellWidth + cellHeight) / 2
    );

    const relativeDifference =
      size > 0
        ? Math.abs(
            cellWidth - cellHeight
          ) / size
        : 0;

    if (relativeDifference > 0.02) {
      console.warn(
        "PF2e Val Toolkit | Grille imprimée non parfaitement carrée",
        {
          map: sceneName(map),
          cellWidth,
          cellHeight,
          gridSizeUsed: size
        }
      );
    }

    const paddingCells = Math.max(0, Math.trunc(Number(grid.paddingCells ?? 0)));

    return {
      type,
      size,
      distance,
      units,
      // In measured mode, the first complete printed-grid intersection is
      // intentionally placed after the requested outer margin. With v4 tasks
      // paddingCells=1, giving one staging/cropped cell on every side.
      shiftX: paddingCells * size - boundsX,
      shiftY: paddingCells * size - boundsY,
      mode: "measured",
      columns,
      rows,
      paddingCells,
      sceneWidth: stableGridSize((columns + 2 * paddingCells) * size),
      sceneHeight: stableGridSize((rows + 2 * paddingCells) * size),
      cellWidth,
      cellHeight,
      bounds: {
        x: boundsX,
        y: boundsY,
        width: boundsWidth,
        height: boundsHeight
      }
    };
  }

  return {
    type,
    size:
      positiveNumber(grid.size) ?? 50,
    distance,
    units,
    shiftX: 0,
    shiftY: 0,
    mode: "legacy"
  };
}

function sceneData(
  map,
  folder,
  scenarioId
) {
  const grid =
    resolveScenarioGrid(map);

  return {
    name: sceneName(map),
    folder: folder.id,
    width:
      positiveNumber(grid.sceneWidth) ??
      positiveNumber(map.width) ??
      1500,
    height:
      positiveNumber(grid.sceneHeight) ??
      positiveNumber(map.height) ??
      1000,
    padding: Number(map.padding ?? 0),
    backgroundColor:
      map.backgroundColor ?? "#202020",

    // V14: these offset the background image.
    shiftX: grid.shiftX,
    shiftY: grid.shiftY,

    // Full visibility / table-mat mode.
    tokenVision: false,
    fog: {
      mode:
        CONST.FOG_EXPLORATION_MODES
          .DISABLED
    },
    environment: {
      darknessLevel: 0,
      darknessLevelLock: true,
      globalLight: {
        enabled: 0,
        bright: false
      }
    },

    playlist: null,
    playlistSound: null,
    weather: "",

    grid: {
      type: grid.type,
      size: grid.size,
      distance: grid.distance,
      units: grid.units
    },

    flags: {
      [MODULE_ID]: {
        scenarioId,
        scenarioMapKey: map.key,
        gridMode: grid.mode,
        gridColumns: grid.columns ?? null,
        gridRows: grid.rows ?? null,
        paddingCells: grid.paddingCells ?? 0
      }
    }
  };
}

function existingScenarioScene(
  folder,
  scenarioId,
  mapKey
) {
  return game.scenes.find(scene =>
    scene.getFlag(
      MODULE_ID,
      "scenarioId"
    ) === scenarioId &&
    scene.getFlag(
      MODULE_ID,
      "scenarioMapKey"
    ) === mapKey
  );
}

/**
 * Foundry V14 stores Scene background media on its Level.
 */
async function ensureBackgroundLevel(
  scene,
  map
) {
  const image =
    String(map.image ?? "").trim();

  if (!image) return null;

  let level =
    scene.firstLevel ?? null;

  if (!level) {
    const created =
      await scene.createEmbeddedDocuments(
        "Level",
        [{
          name: sceneName(map),
          background: {
            src: image
          }
        }]
      );

    level =
      created?.[0] ?? null;

    if (
      level &&
      !scene.initialLevel
    ) {
      await scene.update({
        initialLevel: level.id
      });
    }
  } else {
    await level.update({
      name: sceneName(map),
      "background.src": image
    });
  }

  return level;
}

async function createOrUpdateFromSourceScene(
  map,
  folder,
  scenarioId,
  existing
) {
  const sourceUuid = String(map.sourceSceneUuid ?? "").trim();
  const source = await fromUuid(sourceUuid);

  if (!source || source.documentName !== "Scene") {
    throw new Error(`Scène source introuvable : ${sourceUuid}`);
  }

  const gridSize =
    positiveNumber(map?.grid?.size) ??
    positiveNumber(source.grid?.size) ??
    50;

  const toolkitFlags = {
    scenarioId,
    scenarioMapKey: map.key,
    packageVersion: map.packageVersion ?? null,
    gridMode: "source-scene",
    sourceSceneUuid: source.uuid,
    sourceGridSize: positiveNumber(source.grid?.size),
    gridSize
  };

  if (existing) {
    await existing.update({
      name: sceneName(map),
      folder: folder.id,
      grid: {
        ...source.grid?.toObject?.(),
        ...(source.grid ?? {}),
        size: gridSize,
        distance: positiveNumber(map?.grid?.distance) ?? source.grid?.distance ?? 5,
        units: String(map?.grid?.units ?? source.grid?.units ?? "ft")
      },
      flags: {
        ...(existing.flags ?? {}),
        [MODULE_ID]: toolkitFlags
      }
    });

    return existing;
  }

  const sceneData = source.toObject();
  delete sceneData._id;
  delete sceneData.thumb;
  sceneData.name = sceneName(map);
  sceneData.folder = folder.id;
  sceneData.active = false;
  sceneData.navigation = false;
  sceneData.grid = {
    ...(sceneData.grid ?? {}),
    size: gridSize,
    distance: positiveNumber(map?.grid?.distance) ?? sceneData.grid?.distance ?? 5,
    units: String(map?.grid?.units ?? sceneData.grid?.units ?? "ft")
  };
  sceneData.flags = {
    ...(sceneData.flags ?? {}),
    [MODULE_ID]: toolkitFlags
  };

  const sourceGridSize = positiveNumber(source.grid?.size) ?? gridSize;
  const visualScale = sourceGridSize / gridSize;
  if (visualScale !== 1) {
    for (const light of sceneData.lights ?? []) {
      if (light?.config) {
        if (Number.isFinite(Number(light.config.bright))) light.config.bright = Number(light.config.bright) * visualScale;
        if (Number.isFinite(Number(light.config.dim))) light.config.dim = Number(light.config.dim) * visualScale;
      }
    }
  }

  return Scene.create(sceneData);
}

export async function createOrUpdateScenarioScenes(
  data,
  folder
) {
  const results = [];

  for (const map of data.maps ?? []) {
    try {
      const sourceSceneUuid = String(map?.sourceSceneUuid ?? "").trim();

      if (!map?.key || (!map?.image && !sourceSceneUuid)) {
        results.push({
          key: map?.key ?? "",
          name: sceneName(map),
          status: "invalid"
        });
        continue;
      }

      let scene =
        existingScenarioScene(
          folder,
          data.scenario.id,
          map.key
        );

      if (sourceSceneUuid) {
        const status = scene ? "updated" : "created";
        scene = await createOrUpdateFromSourceScene(
          map,
          folder,
          data.scenario.id,
          scene
        );
        const level = scene.firstLevel ?? scene.levels?.contents?.[0] ?? null;
        results.push({
          key: map.key,
          name: scene.name,
          status,
          uuid: scene.uuid,
          scene,
          levelUuid: level?.uuid ?? null,
          image: level?.background?.src ?? null,
          gridMode: "source-scene",
          gridSize: scene.grid?.size ?? map.grid?.size ?? null,
          shiftX: scene.shiftX ?? 0,
          shiftY: scene.shiftY ?? 0,
          columns: null,
          rows: null,
          paddingCells: null,
          sceneWidth: scene.width,
          sceneHeight: scene.height
        });
        continue;
      }

      const resolvedGrid =
        resolveScenarioGrid(map);

      const update = sceneData(
        map,
        folder,
        data.scenario.id
      );

      let status;

      if (scene) {
        await scene.update(update);
        status = "updated";
      } else {
        scene =
          await Scene.create(update);
        status = "created";
      }

      const level =
        await ensureBackgroundLevel(
          scene,
          map
        );

      if (!level?.background?.src) {
        throw new Error(
          `Le fond V14 n'a pas pu être enregistré pour ${scene.name}.`
        );
      }

      results.push({
        key: map.key,
        name: scene.name,
        status,
        uuid: scene.uuid,
        scene,
        levelUuid: level.uuid,
        image: level.background.src,
        gridMode: resolvedGrid.mode,
        gridSize: resolvedGrid.size,
        shiftX: resolvedGrid.shiftX,
        shiftY: resolvedGrid.shiftY,
        columns: resolvedGrid.columns ?? null,
        rows: resolvedGrid.rows ?? null,
        paddingCells: resolvedGrid.paddingCells ?? 0,
        sceneWidth: scene.width,
        sceneHeight: scene.height
      });
    } catch (error) {
      console.error(
        `PF2e Val Toolkit | Erreur carte ${map?.name ?? map?.key}`,
        error
      );

      results.push({
        key: map?.key ?? "",
        name: sceneName(map),
        status: "error"
      });
    }
  }

  return results;
}
