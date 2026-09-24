import { huntPreyPatch } from "./hunt-prey.js";
import { merchantTokenPatch } from "./merchant-token.js";
import { nativeMerchantPatch } from "./native-merchant.js";

/**
 * Central patch registry.
 *
 * Add future PF2e house-rule patches here. Individual patches remain isolated
 * and can be disabled without touching the rest of the toolkit.
 */
export const PATCH_REGISTRY = [
  huntPreyPatch,
  merchantTokenPatch,
  nativeMerchantPatch
];

export function initPatches() {
  game.pf2eValToolkit ??= {};

  const runtime = new Map();

  for (const patch of PATCH_REGISTRY) {
    if (!patch.enabled) {
      console.log(`PF2e Val Toolkit | Patch désactivé : ${patch.id}`);
      continue;
    }

    try {
      const api = patch.init?.() ?? {};
      runtime.set(patch.id, {
        ...patch,
        api
      });

      console.log(`PF2e Val Toolkit | Patch activé : ${patch.id}`);
    } catch (error) {
      console.error(
        `PF2e Val Toolkit | Impossible d'activer le patch ${patch.id}`,
        error
      );
    }
  }

  game.pf2eValToolkit.patches = {
    registry: PATCH_REGISTRY,
    runtime,

    isEnabled(id) {
      return runtime.has(id);
    },

    get(id) {
      return runtime.get(id) ?? null;
    },

    list() {
      return PATCH_REGISTRY.map(patch => ({
        id: patch.id,
        label: patch.label,
        enabled: runtime.has(patch.id)
      }));
    }
  };
}
