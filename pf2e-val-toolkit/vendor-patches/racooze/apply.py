#!/usr/bin/env python3
"""Hotfix Racooze Map Library 1.2.22; original backed up and SHA-256 pinned."""
from pathlib import Path
import hashlib
root=Path('/home/valou/services/foundry')
backup=root/'patches/racooze/main.js.v1.2.22.original'
target=root/'data/Data/modules/racooze-map-library/scripts/main.js'
assert hashlib.sha256(backup.read_bytes()).hexdigest() == 'eef5e260f1cf74defef47e7fe9e842aa28111923389854ac393358d409f8369b'
s=backup.read_text()
def replace(a,b):
 global s
 assert s.count(a)==1, (s.count(a),a[:80])
 s=s.replace(a,b)

replace('const MODULE_ID = "racooze-map-library";', 'import { installRacoozeRepair } from "./repair.js";\nconst MODULE_ID = "racooze-map-library";')
replace('''    await foundry.applications.apps.FilePicker.upload("data", directory, file, {}, { notify: false });
  }
}''','''    const uploaded = await foundry.applications.apps.FilePicker.upload("data", directory, file, {}, { notify: false });
    // Foundry 14 returns false rather than throwing when /upload is rejected.
    // Never mark such a file installed.
    if (!uploaded || typeof uploaded.path !== "string" || !uploaded.path) {
      throw new Error("[Racooze hotfix] Upload refusé : " + fullPath +
        ". Le serveur Foundry refuse l'écriture (session HTTP ou permissions). " +
        "Déconnecte-toi du monde, reconnecte-toi en MJ, puis réessaie.");
    }
    return uploaded.path;
  }
}''')
replace('''          await this.uploadBlob(localPath, blob);
          if (localStatus === "missing") stats.assetsNew++;''','''          await this.uploadBlob(localPath, blob);
          if (await this.localFileStatus(localPath, entry.sha256) !== "same") {
            throw new Error("[Racooze hotfix] Image non vérifiable après upload : " + localPath);
          }
          if (localStatus === "missing") stats.assetsNew++;''')
replace('''    await scene.update({ thumb: path });
    return true;''','''    if (!upload || typeof (upload.path || upload.url || upload.data?.path) !== "string") {
      throw new Error("[Racooze hotfix] Téléversement vignette refusé : " + scene.name);
    }
    await scene.update({ thumb: path });
    return true;''')
s += """
// LSR local hotfix: assets-only repair, without duplicating Scenes.
installRacoozeRepair({
  MODULE_ID, ASSET_ROOT, RacoozeUserAccess, RacoozeInstallationState,
  RacoozeDownloader, RacoozeApi, RacoozeDownloadQueue,
  openLibrary: openOrRefreshLibraryWindow
});
"""
target.write_text(s)
print('Patched main.js, bytes',len(s))

[executed on device: minipc (0f1786de-8721-4294-b517-165961157741)]