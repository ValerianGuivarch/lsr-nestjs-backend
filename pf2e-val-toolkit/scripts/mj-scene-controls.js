/** Dedicated MJ toolbar for the four existing PF2e Val Toolkit scene tools.
 * Runs after their individual getSceneControlButtons callbacks, so actions
 * remain owned by the original modules and are never duplicated in Tokens.
 */
export const MJ_TOOLS = [
  'pf2eValAV',
  'pf2eValActiveParty',
  'pf2eValQuickNpc',
  'pf2eValImprovise'
];

export function moveToolsToMJ(controls) {
  if (!game.user?.isGM) return;
  const tokenTools = controls.tokens?.tools;
  if (!tokenTools) return;
  const tools = {};
  for (const name of MJ_TOOLS) {
    const tool = tokenTools[name];
    if (!tool) continue;
    // The button retains its original callback, icon and visibility rules.
    tools[name] = {...tool, order: Object.keys(tools).length};
    delete tokenTools[name];
  }
  if (!Object.keys(tools).length) return;
  controls.pf2eValMJ = {
    name: 'pf2eValMJ',
    title: 'Outils MJ — PF2e Val Toolkit',
    icon: 'fa-solid fa-hat-wizard',
    order: Math.max(0, ...Object.values(controls).map(control => Number(control.order) || 0)) + 1,
    visible: true,
    tools
  };
}

export function initMJSceneControls() {
  Hooks.on('getSceneControlButtons', moveToolsToMJ);
}
