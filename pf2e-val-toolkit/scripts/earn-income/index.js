const FLAG = "earnIncomeCredited";
const CURRENCIES = {pp:["pp","ppt","platine","platinum"],gp:["gp","po","or","gold"],sp:["sp","pa","argent","silver"],cp:["cp","pc","cuivre","copper"]};

export function parseEarnIncomeCoins(text) {
  const total = {};
  const source = String(text || "").trim().toLowerCase().replace(/\u00a0/g, " ");
  const pattern = /(\d+(?:[.,]\d+)?)\s*(pp|ppt|gp|po|sp|pa|cp|pc|platine|platinum|gold|silver|copper|or|argent|cuivre)\b/gu;
  for (const match of source.matchAll(pattern)) {
    const key = Object.keys(CURRENCIES).find(k => CURRENCIES[k].includes(match[2]));
    const quantity = Number(match[1].replace(",", "."));
    if (!key || !Number.isSafeInteger(quantity) || quantity < 0) return null;
    total[key] = (total[key] || 0) + quantity;
  }
  return Object.keys(total).length ? total : null;
}

function locateIncome(message, html) {
  const root = html instanceof HTMLElement ? html : html?.[0];
  const card = root?.querySelector?.(".pf2e.chat-card.earn-income");
  if (!card) return null;
  const paragraphs = [...card.querySelectorAll(".card-content p")];
  const label = game.i18n.localize("PF2E.Actions.EarnIncome.Result.IncomeEarned").replace(/\s*:\s*$/, "").trim();
  const paragraph = paragraphs.find(p => p.querySelector("strong")?.textContent?.includes(label));
  if (!paragraph) return null;
  const full = paragraph.textContent || "";
  const afterLabel = full.slice(full.indexOf(paragraph.querySelector("strong").textContent) + paragraph.querySelector("strong").textContent.length);
  const perDayIndex = afterLabel.indexOf("(");
  return {card, coins: parseEarnIncomeCoins(perDayIndex < 0 ? afterLabel : afterLabel.slice(0,perDayIndex))};
}

export function initEarnIncomeCoins() {
  Hooks.on("renderChatMessageHTML", (message, html) => {
    const income = locateIncome(message, html);
    if (!income || income.card.querySelector(".pf2e-val-earn-add")) return;
    const actor = game.actors.get(message.speaker?.actor);
    if (!actor || (!game.user.isGM && !actor.isOwner)) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "pf2e-val-earn-add";
    const applied = !!message.getFlag("pf2e-val-toolkit", FLAG);
    button.textContent = applied ? "✓ Argent ajouté" : "Ajouter l'argent";
    button.disabled = applied || !income.coins || !Object.values(income.coins).some(n => n > 0);
    if (!income.coins) button.title = "Montant non reconnu : aucune pièce ajoutée";
    button.addEventListener("click", async () => {
      if (button.disabled) return;
      button.disabled = true;
      try {
        const current = game.messages.get(message.id);
        if (current?.getFlag("pf2e-val-toolkit", FLAG)) return;
        const names = {pp:"pp",gp:"po",sp:"pa",cp:"pc"};
        const display = Object.entries(income.coins).map(([k,v])=> v + " " + names[k]).join(", ");
        if (!await Dialog.confirm({title:"Gagner de l'argent",content:`<p>Ajouter <strong>${display}</strong> à l'inventaire de <strong>${foundry.utils.escapeHTML(actor.name)}</strong> ?</p>`})) return;
        if (game.messages.get(message.id)?.getFlag("pf2e-val-toolkit", FLAG)) return;
        // Record the operation on the authoritative chat message before applying currency,
        // so future clicks cannot credit the same roll a second time.
        await current.setFlag("pf2e-val-toolkit", FLAG, {actorId:actor.id,amount:income.coins,at:new Date().toISOString()});
        try { await actor.inventory.addCoins(income.coins); }
        catch (error) { await current.unsetFlag("pf2e-val-toolkit", FLAG); throw error; }
        button.textContent = "✓ Argent ajouté";
        ui.notifications.info(`${display} ajoutés à ${actor.name}.`);
      } catch(error) {
        ui.notifications.error("Impossible d'ajouter l'argent : "+error.message);
      } finally { button.disabled = !!game.messages.get(message.id)?.getFlag("pf2e-val-toolkit", FLAG); }
    });
    income.card.append(button);
  });
}
