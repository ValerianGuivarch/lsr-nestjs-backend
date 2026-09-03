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

    return {
      type,
      size,
      distance,
      units,
      shiftX: -boundsX,
      shiftY: -boundsY,
      mode: "measured",
      columns,
      rows,
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
      positiveNumber(map.width) ??
      1500,
    height:
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
        gridMode: grid.mode
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
    scene.folder?.id === folder.id &&
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

export async function createOrUpdateScenarioScenes(
  data,
  folder
) {
  const results = [];

  for (const map of data.maps ?? []) {
    try {
      if (!map?.key || !map?.image) {
        results.push({
          key: map?.key ?? "",
          name: sceneName(map),
          status: "invalid"
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

      let scene =
        existingScenarioScene(
          folder,
          data.scenario.id,
          map.key
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
        shiftY: resolvedGrid.shiftY
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
