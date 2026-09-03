/**
 * Target helpers shared by toolkit patches.
 */

export function getUserTargets(userId = game.user?.id) {
  const user = game.users?.get(userId) ?? game.user;
  return Array.from(user?.targets ?? []);
}

export function getSingleUserTarget(userId = game.user?.id) {
  const targets = getUserTargets(userId);
  return targets.length === 1 ? targets[0] : null;
}

export function getTargetName(token) {
  return (
    token?.name ??
    token?.document?.name ??
    token?.actor?.name ??
    "Cible"
  );
}

export function getTargetUuid(token) {
  return token?.document?.uuid ?? token?.uuid ?? null;
}
