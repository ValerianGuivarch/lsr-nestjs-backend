const PRIVATE_MODES = new Set(["blindroll", "gmroll", "selfroll"]);

export function privateRollCharacterName(message, actors, users) {
  if (!message?.isRoll) return null;
  const mode = message.rollMode ?? message.flags?.core?.rollMode;
  if (!PRIVATE_MODES.has(mode)) return null;
  const speaker = message.speaker ?? {};
  const actor = (speaker.actor && actors?.get?.(speaker.actor))
    || (speaker.token && actors?.tokens?.get?.(speaker.token));
  if (actor?.name) return actor.name;
  const author = users?.get?.(message.author?.id ?? message.user?.id);
  return author?.character?.name || null;
}

export function initPrivateRollCharacterNames() {
  Hooks.on("renderChatMessageHTML", (message, html) => {
    const name = privateRollCharacterName(message, game.actors, game.users);
    if (!name) return;
    const root = html instanceof HTMLElement ? html : html?.[0];
    const sender = root?.querySelector?.(".message-sender");
    if (!sender) return;
    sender.textContent = name;
    sender.title = `Personnage : ${name}`;
  });
}
