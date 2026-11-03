/**
 * LSR local repair for Racooze Map Library 1.2.22.
 * Repairs only missing/corrupt assets of the 67 Strength of Thousands scenes.
 * Uses the existing client-side Racooze download key. Does not reimport Scenes.
 */
export function installRacoozeRepair(deps) {
  const {MODULE_ID, ASSET_ROOT, RacoozeUserAccess, RacoozeInstallationState,
    RacoozeDownloader, RacoozeApi, RacoozeDownloadQueue, openLibrary} = deps;
  const allowed = slug => (slug.startsWith("sot-") || slug.startsWith("sotap-")) &&
    /^[a-z0-9][a-z0-9-]*$/.test(slug);

  function findMaps() {
    return RacoozeInstallationState.entries()
      .filter(({slug,variant}) => allowed(slug) && variant === "classic")
      .sort((a,b) => a.slug === "sot-reths-shack" ? -1 :
        b.slug === "sot-reths-shack" ? 1 : a.slug.localeCompare(b.slug));
  }
  function safeName(filename) {
    return typeof filename === "string" && filename.length > 0 &&
      !filename.startsWith("/") && !filename.includes("\\") &&
      filename.split("/").every(p => p && p !== "." && p !== "..");
  }
  async function repair(maps, controller) {
    let completed=0, fetched=0, unchanged=0, bytes=0, thumbnails=0;
    const thumbnailFailures=[];
    const slugs=new Set(maps.map(x=>x.slug));
    for(const {slug,variant,value} of maps) {
      await controller.waitIfPaused?.();
      if(controller.isCancelRequested()) break;
      const base=ASSET_ROOT+"/"+slug+"/"+variant;
      const assets=Object.entries(value?.assets||{});
      controller.update({
        status:"running",heading:"Vérification de "+slug,
        label:assets.length+" image(s) à contrôler",
        stats:completed+"/"+maps.length+" cartes | "+fetched+" images réparées",
        progress:Math.floor(completed/maps.length*90)
      });
      for(const [filename,metadata] of assets) {
        if(!safeName(filename)||!/^[0-9a-f]{64}$/i.test(String(metadata?.sha256||""))) {
          throw Error("[Racooze hotfix] Chemin ou empreinte invalide : "+slug+"/"+filename);
        }
        const destination=base+"/"+filename;
        const hash=metadata.sha256;
        if(await RacoozeDownloader.localFileStatus(destination,hash)==="same") {
          unchanged++;
          continue;
        }
        // Downloads use the browser's authorized Patreon key; no secrets stored
        // server-side by this repair and no new Scene document is created.
        const blob=await RacoozeApi.asset(slug,variant,filename);
        await RacoozeDownloader.ensureDirectory(
          destination.split("/").slice(0,-1).join("/")
        );
        await RacoozeDownloader.uploadBlob(destination,blob);
        // A successful-looking HTTP response is NOT proof of a saved image.
        if(await RacoozeDownloader.localFileStatus(destination,hash)!=="same") {
          throw Error("[Racooze hotfix] Image absente ou hash incorrect après upload : "+destination);
        }
        fetched++;
        bytes+=blob.size||0;
      }
      completed++;
    }

    // After assets are verified, try repairing the missing scene thumbnails.
    // Thumbnail failure does not undo correctly downloaded image assets.
    if(!controller.isCancelRequested()) {
      const scenes=game.scenes.filter(scene => slugs.has(scene.getFlag(MODULE_ID,"mapSlug")));
      for(let i=0;i<scenes.length;i++) {
        await controller.waitIfPaused?.();
        if(controller.isCancelRequested()) break;
        const scene=scenes[i];
        controller.update({
          status:"running",heading:"Reconstruction des vignettes",
          label:(i+1)+"/"+scenes.length+" — "+scene.name,
          stats:fetched+" images restaurées | "+thumbnails+" vignettes",
          progress:90+Math.floor(i/scenes.length*10)
        });
        try {
          const thumb=String(scene.thumb||"");
          let existing=false;
          if(thumb.startsWith(ASSET_ROOT+"/")) {
            const check=await fetch(foundry.utils.getRoute(thumb),{
              method:"HEAD",cache:"no-store"
            });
            existing=check.ok;
          }
          if(existing) continue;
          const slug=scene.getFlag(MODULE_ID,"mapSlug");
          if(await RacoozeDownloader.generateSceneThumbnail(scene,ASSET_ROOT+"/"+slug+"/classic")) {
            thumbnails++;
          } else {
            thumbnailFailures.push({title:scene.name,error:"No generated thumbnail"});
          }
        } catch(error) {
          thumbnailFailures.push({title:scene.name,error:String(error?.message||error)});
          console.warn("[Racooze hotfix] Thumbnail failure",scene.name,error);
        }
      }
    }
    const cancelled=controller.isCancelRequested();
    const status=cancelled?"cancelled":
      thumbnailFailures.length?"completed_with_errors":"completed";
    return {
      queueStatus:status,
      heading:cancelled?"Réparation interrompue":
        thumbnailFailures.length?"Images réparées, vignettes incomplètes":"Images réparées",
      label:completed+"/"+maps.length+" cartes vérifiées | "+fetched+" fichiers restaurés",
      stats:unchanged+" images déjà bonnes | "+(bytes/1048576).toFixed(1)+
        " MiB reçus | "+thumbnails+" vignettes ("+thumbnailFailures.length+" erreurs)",
      completed, failed:thumbnailFailures.length,
      cancelled:cancelled?maps.length-completed:0,
      changed:fetched, thumbnails, thumbnailErrors:thumbnailFailures.length,
      failures:thumbnailFailures
    };
  }

  async function start() {
    if(!RacoozeUserAccess.isFullGameMaster()) {
      RacoozeUserAccess.notify("error","La réparation nécessite un compte MJ.");
      return;
    }
    const maps=findMaps();
    if(!maps.length) {
      RacoozeUserAccess.notify("warn","Aucune carte Force des Mille enregistrée.");
      return;
    }
    const okay=await foundry.applications.api.DialogV2.confirm({
      window:{title:"Réparer les images — Force des Mille"},
      content:"<p>Contrôler les fichiers des <strong>"+maps.length+
        " cartes</strong>, retélécharger seulement les images manquantes ou "+
        "corrompues, puis refaire les vignettes absentes.</p>"+
        "<p>Les scènes, murs, éclairages et dossiers existants ne seront "+
        "<strong>ni supprimés ni dupliqués</strong>.</p>"+
        "<p>Le premier fichier testé est Reth's Shack. Si Foundry refuse encore "+
        "l'upload, l'opération s'arrête immédiatement avec un message d'erreur.</p>",
      yes:{label:"Réparer les images uniquement",icon:"fa-solid fa-image"},
      no:{label:"Annuler",icon:"fa-solid fa-xmark"}
    });
    if(!okay)return;
    try { await openLibrary(); }
    catch(error) { console.warn("[Racooze hotfix] Library window unavailable",error); }
    const queued=RacoozeDownloadQueue.enqueue({
      title:"Réparation images — Force des Mille",
      mapCount:maps.length,variant:"classic",
      run:controller=>repair(maps,controller)
    });
    const result=await queued.completion;
    if(result?.queueStatus==="completed") {
      RacoozeUserAccess.notify("info","Force des Mille : "+maps.length+
        " scènes contrôlées, "+result.changed+" images restaurées.");
    } else if(result?.queueStatus==="completed_with_errors") {
      RacoozeUserAccess.notify("warn","Images restaurées, mais "+
        result.thumbnailErrors+" vignettes restent à corriger.");
    }
  }

  // Insert next to the native Racooze button; no separate module UI or
  // browser-console command is required.
  Hooks.on("renderSceneDirectory",(_app,html)=>{
    if(!RacoozeUserAccess.isFullGameMaster())return;
    const root=html instanceof HTMLElement?html:html?.[0];
    const row=root?.querySelector("[data-racooze-map-library-row]");
    if(!row || row.querySelector("[data-racooze-fdm-repair]"))return;
    const button=document.createElement("button");
    button.type="button";
    button.dataset.racoozeFdmRepair="";
    button.className="racooze-directory-button";
    button.innerHTML='<i class="fa-solid fa-screwdriver-wrench"></i> Réparer images FdM';
    button.addEventListener("click",event=>{
      event.preventDefault();event.stopPropagation();
      return start().catch(error=>{
        console.error("[Racooze hotfix] Repair failed",error);
        RacoozeUserAccess.notify("error","Réparation : "+String(error?.message||error));
      });
    });
    row.append(button);
  });
}

[executed on device: minipc (0f1786de-8721-4294-b517-165961157741)]