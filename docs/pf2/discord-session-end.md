# Discord — /fin-seance : XP, pièces, butin et réputations

[← Index des outils](../../OUTILS.md) · [Wiki et Discord](../../pf2/outils/wiki-discord.md) · [Aide XP et trésors](wiki-session-xp-aid.md)

## Déroulement : une page privée avec champs indépendants

**Motif :** un formulaire natif Discord est limité à cinq composants. Le précédent formulaire avec deux blocs de texte « XP / Actions » et « Pièces / Objets » demandait d'éditer les étiquettes dans le texte. Pour offrir réellement **10 champs indépendants** et **les 36 réputations en cases numériques**, `/fin-seance` envoie maintenant au MJ un **lien éphémère privé** vers le formulaire web, au lieu d'ouvrir une modale Discord. C'est une **unique page** sans étapes intermédiaires.

La commande reste **réservée aux administrateurs Discord**, sans paramètres. Elle récupère la séance active associée au canal de `/debut-seance` et préremplit le numéro, sinon prend la dernière séance connue ; en canal exactement nommé `mj`, elle utilise la séance fictive 7.

**Champs de la page :**

- **Numéro de séance** (éditable), **nombre de jours écoulés** (0 = même jour).
- **XP total du groupe**, **XP par PJ** (deux valeurs indépendantes), et **Actions réalisées** (grand champ texte libre ; une ligne par action, sans écrire d'intitulé `Actions :`).
- **Or (po)**, **argent (pa)**, **cuivre (pc)** (trois champs numériques indépendants, par PJ) et **Objets obtenus** (grand champ texte libre ; une ligne par objet ; aucune création automatique dans Foundry).
- **Toutes les réputations**, triées par catégorie, avec **un champ numérique par faction**, initialisé à **0**. Un nom n'est plus éditable, ce qui évite d'altérer accidentellement l'intitulé. On peut saisir des deltas positifs et négatifs entre -50 et +50, dans la limite du score final autorisé. Le formulaire utilise `Pf2ReputationService.list(true)`, source de vérité SQLite du wiki, **sans filtrage ou pagination** : il inclut notamment le groupe **Abberton** (Cirque des Merveilles Vagabondes, Cirque de Lady Dusklight, Villageois d'Abberton, Ermitage de la Foudre Bénie). Il y avait **6 catégories et 36 factions** lors de la vérification du 4 novembre 2026.

**Validation en deux clics sur la même page :** bouton **Voir l'aperçu** → prévisualisation complète privée, puis **Confirmer et publier** ou **Modifier**. Le bouton Modifier restaure les champs déjà saisis sans remise à zéro. Aucun message Discord ni changement sur Foundry / SQLite n'est effectué avant la confirmation. En cas d'échec, un message indique de vérifier les données avant de retenter.

**Sécurité :** le lien ne peut être créé que depuis la commande admin de Discord et contient un token cryptographiquement aléatoire **de 256 bits**, valable **30 minutes**, supprimé après une confirmation réussie. Il n'est ni public ni réutilisable. Le backend envoie des en-têtes `no-store`, `no-referrer`, `X-Frame-Options: DENY` et une CSP avec nonce ; les textes provenant de la base sont affichés comme texte (pas en HTML). **Ne partage pas l'URL privée** ; la possession du lien donne accès à l'aperçu et à la confirmation pendant sa période de validité. Les vérifications de cohérence de séance et la protection contre les doubles récompenses restent effectuées côté serveur.

**URL de la page :** `https://l7r.fr/apil7r/pf2-mj/discord/fin-seance/<token>` (base configurable par `PF2_FIN_SEANCE_PUBLIC_URL`). L'état, l'aperçu et la confirmation transitent exclusivement par les routes internes `GET :token/state`, `POST :token/preview` et `POST :token/confirm` du même backend. Pas de création de compte supplémentaire ni de clé visible dans le JavaScript.

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

Si `/fin-seance` est lancé **dans un canal nommé exactement `mj`**, la commande démarre directement avec une **séance fictive n°7**, sans exiger `/debut-seance` ni chercher une séance réelle. La même page web avec tous les champs séparés et les mêmes réputations est utilisée. À la confirmation, le récapitulatif est **publié uniquement dans #mj**, avec une ligne finale explicite :

> 🧪 SIMULATION MJ — aucune modification des séances, des inventaires ou des réputations.

Ce mode **ne lance aucune écriture** dans SQLite, n'appelle pas Foundry et n'applique aucune réputation, même si les champs ressemblent à des récompenses réelles. Le canal doit toujours s'appeler `mj` à la confirmation.

## Fichiers et tests

- `apps/api-jdr/src/discord/SessionFinishFlow.ts` : validations, parsing, tri, rendu du récapitulatif et découpage pour Discord.
- `apps/api-jdr/src/discord/DiscordSessionFinishWeb.ts` : validation serveur de tous les champs, dont la liste exhaustive de réputations.
- `apps/api-jdr/src/discord/DiscordSessionFinishPage.ts` et `DiscordSessionFinishController.ts` : page privée et routes HTTP protégées par token temporaire.
- `apps/api-jdr/src/discord/DiscordCommandsService.ts` : émission du lien privé, token éphémère, aperçu et confirmation, détection de `#mj`, écritures après validation.
- `apps/api-jdr/src/foundry/FoundryRelayService.ts` : pièces PF2e/Foundry et prévention des doublons.
- `apps/api-jdr/src/pf2-reputation/Pf2ReputationService.ts` : deltas cumulés transactionnels et historisés.
- `apps/api-jdr/src/pf2-storage/Pf2PersistenceService.ts` : source de la séance active et récapitulatif durable.
- Tests Jest dédiés : `SessionFinishFlow.spec.ts`, `DiscordSessionFinish.spec.ts`, `Pf2ReputationService.spec.ts` et compléments des tests de Discord et Foundry.

L'ancien formulaire avec paramètres `xp`, `numero`, `fin`, `jours` n'est plus utilisé. Les commandes Discord enregistrées par l'application devront être synchronisées après le déploiement.
