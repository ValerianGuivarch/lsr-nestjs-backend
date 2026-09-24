function normalizeRoot(root) {
  return String(root ?? "").trim().replace(/\/+$/, "");
}

function isAbsoluteAssetPath(path) {
  const value = String(path ?? "").trim();

  return (
    !value ||
    /^(?:https?:|data:|blob:)/i.test(value) ||
    value.startsWith("/") ||
    value.startsWith("modules/") ||
    value.startsWith("systems/") ||
    value.startsWith("worlds/")
  );
}

export function resolveScenarioAssetPath(data, path) {
  const value = String(path ?? "").trim();
  if (!value || isAbsoluteAssetPath(value)) return value;

  const root = normalizeRoot(data?.assets?.root);
  if (!root) return value;

  return `${root}/${value.replace(/^\/+/, "")}`;
}

export function resolveScenarioAssets(data) {
  return {
    ...data,
    actors: (data.actors ?? []).map(actor => ({
      ...actor,
      image: actor.image
        ? resolveScenarioAssetPath(data, actor.image)
        : actor.image
    })),
    maps: (data.maps ?? []).map(map => ({
      ...map,
      image: map.image
        ? resolveScenarioAssetPath(data, map.image)
        : map.image
    }))
  };
}
