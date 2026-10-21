const PRIVATE_MODES = new Set(["blindroll", "gmroll", "selfroll"]);
const ROLL_NOTICE_FR = /^(.*?)\s+a effectué un jet de dés privé(?=\s|$|[.!?])/iu;
const ROLL_NOTICE_EN = /^(.*?)\s+made a private dice roll\b/iu;

export function isPrivateRoll(message) {
  if (!message || (!message.isRoll && !message.rolls?.length)) return false;
  const mode = message.rollMode ?? message.flags?.core?.rollMode;
  return message.blind === true
    || (Array.isArray(message.whisper) && message.whisper.length > 0)
    || PRIVATE_MODES.has(mode);
}

export function characterDisplayName(value) {
  const name = String(value ?? "").trim();
  // Local convention for player characters: "Pen-Pen (Arcady)".
  return name.replace(/\s+\([^)]+\)\s*$/u, "").trim();
}

export function privateRollCharacterName(message, actors, users) {
  if (!isPrivateRoll(message)) return null;
  const speaker = message.speaker ?? {};
  const actor = (speaker.actor && actors?.get?.(speaker.actor))
    || (speaker.token && actors?.tokens?.get?.(speaker.token));
  const authorId = message.author?.id ?? message.user?.id ?? message.author;
  const author = users?.get?.(authorId);
  const source = actor?.name || author?.character?.name || speaker.alias;
  return source ? characterDisplayName(source) : null;
}

export function privateRollPortraitSource(message, actors, scenes) {
  if (!isPrivateRoll(message)) return null;
  const speaker = message.speaker ?? {};
  if (!speaker.actor) return null;
  const token = scenes?.get?.(speaker.scene)?.tokens?.get?.(speaker.token);
  // Do not bypass the token-hidden setting or show secret token portraits.
  if (token?.hidden && !game.user?.isGM) return null;
  if (game.modules?.get?.("pf2e-dorako-ui")?.active
    && game.settings?.get?.("pf2e-dorako-ui", "avatar.hide-when-token-hidden")
    && message.getFlag?.("pf2e-dorako-ui", "wasTokenHidden")
    && !game.user?.isGM) return null;

  const actor = actors?.get?.(speaker.actor);
  // Only use an actual character portrait, never derive an image from the
  // hidden roll data, the action name, or a GM-only NPC.
  if (actor?.type !== "character") return null;
  const image = actor.img || actor.prototypeToken?.texture?.src;
  return typeof image === "string" && image.trim() ? image : null;
}

function ensurePrivateRollPortrait(root, message, name) {
  const source = privateRollPortraitSource(message, game.actors, game.scenes);
  if (!source) return;
  const header = root.querySelector?.(".message-header");
  if (!header) return;

  // Dorako UI normally supplies the portrait. If it is already present,
  // preserve it rather than adding a duplicate.
  const existing = header.querySelector(".portrait img, .message-avatar img, .pf2e-val-private-roll-portrait img");
  if (existing?.getAttribute("src")) {
    header.classList.remove("no-image");
    header.classList.add("with-image");
    return;
  }

  let container = header.querySelector(".portrait.dorako");
  if (!container) {
    container = document.createElement("div");
    container.className = "pf2e-val-private-roll-portrait";
    header.prepend(container);
  }
  container.classList.add("pf2e-val-private-roll-portrait");
  const image = document.createElement("img");
  image.src = source;
  image.alt = name;
  image.loading = "lazy";
  image.decoding = "async";
  container.append(image);
  header.classList.remove("no-image");
  header.classList.add("with-image");
}

export function privateRollActionLabel(message) {
  if (!isPrivateRoll(message) || typeof message.flavor !== "string") return null;
  // PF2e's roll flavor contains other information, including potentially
  // modifiers, target DCs and outcomes. Read ONLY the h4 action heading.
  const match = message.flavor.match(/<h4\b[^>]*class=["'][^"']*\baction\b[^"']*["'][^>]*>([\s\S]*?)<\/h4>/iu);
  if (!match) return null;
  const strong = match[1].match(/<strong\b[^>]*>([\s\S]*?)<\/strong>/iu);
  if (!strong) return null;
  const label = strong[1].replace(/<[^>]*>/gu, "").replace(/\s+/gu, " ").trim();
  if (!label || label.length > 110) return null;
  // Never synthesize a total/result from arbitrary text.
  return label;
}

export function replaceGenericPrivateRollNotice(text, characterName) {
  if (typeof text !== "string" || !characterName) return text;
  if (ROLL_NOTICE_FR.test(text)) return text.replace(ROLL_NOTICE_FR, `${characterName} a effectué un jet de dés privé`);
  if (ROLL_NOTICE_EN.test(text)) return text.replace(ROLL_NOTICE_EN, `${characterName} made a private dice roll`);
  return text;
}

function renderPrivateRollInfo(message, html) {
  const root = html instanceof HTMLElement ? html : html?.[0];
  if (!root) return;
  const name = privateRollCharacterName(message, game.actors, game.users);
  if (!name) return;

  const sender = root.querySelector?.(".message-sender");
  if (sender) {
    sender.textContent = name;
    sender.title = `Personnage : ${name}`;
  }

  ensurePrivateRollPortrait(root, message, name);

  const content = root.querySelector?.(".message-content");
  if (!content) return;

  // Foundry also embeds the player's name in the blind-roll placeholder.
  // Replace only that generic notice, never dice/result HTML.
  const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const original = node.nodeValue;
    const updated = replaceGenericPrivateRollNotice(original, name);
    if (updated !== original) node.nodeValue = updated;
    node = walker.nextNode();
  }

  const label = privateRollActionLabel(message);
  if (!label || content.querySelector(".pf2e-val-private-roll-purpose")) return;
  const line = document.createElement("p");
  line.className = "pf2e-val-private-roll-purpose";
  line.textContent = `Jet : ${label}`;
  line.style.margin = "0.35em 0";
  line.style.fontWeight = "600";
  const diceRoll = content.querySelector(".dice-roll");
  if (diceRoll) diceRoll.before(line);
  else content.append(line);
}

export function initPrivateRollCharacterNames() {
  Hooks.on("renderChatMessageHTML", renderPrivateRollInfo);
}
