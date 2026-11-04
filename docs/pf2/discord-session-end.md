# Discord — /fin-seance : XP, pièces, butin et réputations

[← Index des outils](../../OUTILS.md) · [Wiki et Discord](../../pf2/outils/wiki-discord.md) · [Aide XP et trésors](wiki-session-xp-aid.md)

## Déroulement : UN SEUL formulaire, puis l'aperçu

`/fin-seance` est une commande **réservée à l'administration Discord**, sans paramètres slash. Elle ouvre immédiatement **une seule fenêtre**, avec toutes les valeurs préremplies (séance active dans le salon, ou dernière séance connue ; dans `mj`, séance fictive n°7).

Discord impose au maximum **cinq composants par formulaire**, donc les montants numériques sont regroupés dans des zones de texte multiligne. **Il n'y a plus trois étapes.** Les cinq champs de l'unique formulaire sont :

1. **Numéro de séance**, modifiable.
2. **Nombre de jours écoulés** depuis le début en jeu (0 = même jour).
3. **XP et actions**, champ multiligne prérempli par :
   ```text
   Total XP: 0
   XP par PJ: 0

   Actions:
   ```
   Le MJ remplace les deux zéros par les montants décidés **indépendamment**, puis colle ses actions/XP sur les lignes après `Actions:`. Aucun total n'est recalculé ou déduit de la description.
4. **Pièces et objets**, champ multiligne prérempli par :
   ```text
   Or (po): 0
   Argent (pa): 0
   Cuivre (pc): 0

   Objets:
   ```
   Les trois nombres sont les pièces **par PJ**. Le texte après `Objets:` n'est utilisé que pour le récapitulatif, sans création d'objets dans Foundry.
5. **Toutes les réputations**, une seule grande zone préremplie avec **toutes les catégories** (titres `# Absalom`, `# Pointesable`…) et toutes les lignes `Nom de faction: 0`. Modifier les seules valeurs utiles en `+3`, `-2`, etc. Les scores sont des **variations** sur la valeur existante, et les autres restent inchangés. Les noms de catégories restent affichés pour éviter les ambiguïtés entre factions homonymes.

**Après validation de cette unique fenêtre :** un **aperçu privé complet**, puis **Terminer la séance / Modifier le formulaire / Annuler**. Aucun changement ni message public avant confirmation. Le bouton **Modifier le formulaire** ouvre à nouveau **la même fenêtre** en conservant toutes les saisies, y compris après une erreur de validation. Si la publication dépasse 2 000 caractères, elle est répartie sur plusieurs messages sans perte de lignes.

**Important :** les étiquettes `Total XP:`, `XP par PJ:`, `Actions:`, `Or (po):`, `Argent (pa):`, `Cuivre (pc):`, `Objets:` et les titres de catégories `# ...` doivent rester : elles permettent de distinguer les nombres des notes libres. Les valeurs après les deux-points sont modifiables. La limite technique d'un champ multiligne est **4 000 caractères** ; si la liste des réputations dépasse cette capacité, la commande le signale plutôt que de supprimer des données en silence.

## Texte publié

Le message de fin est envoyé dans **le canal de la séance** :

```text
🏁 Fin de séance n°7
Durée en jeu : 2 jours écoulés

Expérience
• Gnome libéré : 30XP
• Chef vaincu : 1200 XP
Total : 1240 XP, soit 310 XP par PJ.

Gain de points et butin
• 7 pièces d’or, 3 pièces d’argent, 2 pièces de cuivre (par PJ)
• Potion de soins
• Anneau magique

Réputation
• Garde de la ville : +3
• Habitants d’Absalom : +1
• Citadins : -2
```

Les pièces ayant une valeur zéro sont omises de la ligne de butin, et la ligne est absente si les trois valeurs sont nulles. La liste d'actions et la liste d'objets sont des textes libres transformés en puces ; aucun parsing des objets, aucun ajout automatique de loot dans les inventaires.

## Séance réelle : écritures

La commande valide que le **canal Discord** est bien lié à une séance encore active via `pf2_session_discord_context`, que le numéro modifiable correspond bien à cette séance, que ses PJ sont présents et qu'elle possède une date de début. **Si aucune séance active n'est liée au canal, elle refuse d'appliquer les gains**, même si le numéro saisi existe ailleurs. Cela évite de créditer la mauvaise équipe.

Lors de la confirmation :

- **XP :** `pf2_session.session_xp` reçoit **l'XP par PJ** ; le **total saisi manuellement** et le texte complet sont conservés séparément dans `pf2_session_finish_report` (migration SQLite `053-discord-session-finish-report`). Le résumé Discord standard réutilise le total enregistré, et ne le recalcule plus nécessairement comme `sessionXp × participants`.
- **Temps :** `in_game_end_date = in_game_start_date + nombre_de_jours_écoulés`. Plus de date libre à interpréter.
- **Pièces :** le backend interroge le relais Foundry REST via **`POST /execute-js`** (opération autorisée seulement si `allowExecuteJs` et la permission `execute-js` sont activées côté Foundry/REST). Il vérifie d'abord chaque Actor de monde de type `character`, puis appelle l'API PF2e **`actor.inventory.addCoins({gp,sp,cp})`** pour chaque PJ de la séance. Le champ `system.currency` est calculé par PF2e : il ne faut pas l'écrire directement. L'Actor conserve un **flag `pf2e-val-toolkit.sessionCoinAwards[sessionId]`** pour empêcher un double versement en cas de nouvelle tentative. Si Foundry est déconnecté, l'opération est arrêtée *avant* de modifier les XP et réputations.
- **Réputation :** les scores globaux `pf2_reputation.score` sont incrémentés par delta en transaction SQLite, avec entrée dans `pf2_reputation_history`. Le motif `fin-seance:<uuid>` empêche l'application répétée du même delta. Les valeurs sont bornées à `[-50,50]` après application, comme dans le wiki.
- **Clôture :** la séance active liée à ce canal est fermée et son état Foundry « séance active » est actualisé, puis le texte est publié dans le canal d'origine.

L'ordre des mises à jour Foundry / SQLite / Discord ne constitue **pas une transaction distribuée**. En cas d'échec partiel, la réponse privée affiche l'erreur et propose de réessayer ; le flag Foundry et l'historique de réputation limitent le risque de créditer deux fois. Avant un nouvel essai après un échec de publication, le MJ doit vérifier les messages du fil. Si l'accès `execute-js` n'est pas activé, les versements automatiques ne fonctionnent pas : l'outil **n'affirme pas avoir crédité** les personnages.

## Simulation sans séance : canal #mj

Si `/fin-seance` est lancé **dans un canal nommé exactement `mj`**, la commande démarre directement avec une **séance fictive n°7**, sans exiger `/debut-seance` ni chercher une séance réelle. Le même formulaire unique et les mêmes champs de réputation sont utilisés. À la confirmation, le récapitulatif est **publié uniquement dans #mj**, avec une ligne finale explicite :

> 🧪 SIMULATION MJ — aucune modification des séances, des inventaires ou des réputations.

Ce mode **ne lance aucune écriture** dans SQLite, n'appelle pas Foundry et n'applique aucune réputation, même si les champs ressemblent à des récompenses réelles. Le canal doit toujours s'appeler `mj` à la confirmation.

## Fichiers et tests

- `apps/api-jdr/src/discord/SessionFinishFlow.ts` : validations, parsing, tri, rendu du récapitulatif et découpage pour Discord.
- `apps/api-jdr/src/discord/DiscordCommandsService.ts` : formulaire unique/aperçu/admin/détection de #mj/application.
- `apps/api-jdr/src/foundry/FoundryRelayService.ts` : pièces PF2e/Foundry et prévention des doublons.
- `apps/api-jdr/src/pf2-reputation/Pf2ReputationService.ts` : deltas cumulés transactionnels et historisés.
- `apps/api-jdr/src/pf2-storage/Pf2PersistenceService.ts` : source de la séance active et récapitulatif durable.
- Tests Jest dédiés : `SessionFinishFlow.spec.ts`, `DiscordSessionFinish.spec.ts`, `Pf2ReputationService.spec.ts` et compléments des tests de Discord et Foundry.

L'ancien formulaire avec paramètres `xp`, `numero`, `fin`, `jours` n'est plus utilisé. Les commandes Discord enregistrées par l'application devront être synchronisées après le déploiement.
