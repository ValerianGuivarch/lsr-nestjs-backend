# Wiki et Discord PF2 — intégrations

[← Outils](../../OUTILS.md) · [Archive intégrale](archive/RECAP-2026-09-27.md)

> Contenu repris de l'audit du 27 septembre 2026 : **historique à confronter au code et à l'état de production** avant de considérer une observation ou une anomalie comme actuelle.

## 11. Discord

Le module Discord appartient à `api-jdr`.

Il est optionnel : si les variables Discord sont absentes ou si Discord est indisponible, l’API continue de fonctionner.

### 11.1 Résumés courts — publication explicite (code vérifié le 18 octobre 2026)

L'enregistrement d'une séance dans SQLite **ne publie pas** automatiquement sur Discord. La publication/remise en brouillon est contrôlée par `DiscordService.setResumePublication(id, published)`.

- **Brouillon :** aucun envoi Discord ; la séance est conservée dans SQLite.
- **Publication :** l'API synchronise le résumé court, crée ou actualise le message, puis conserve l'ID Discord.
- **Échec Discord lorsqu'un résumé court doit être publié :** la publication est annulée et la valeur antérieure de `published` est rétablie.

Distinguer les séances enregistrées des séances publiées lors de toute analyse de la progression.

### 11.2 Récapitulatifs et séances

Le code courant n'utilise plus l'ancien `/recap` pair-à-pair.

Commandes principales :

```text
/recap-pjs
/recap-seance
/debut-seance
/fin-seance
```

`/recap-pjs` construit un récapitulatif à partir des séances publiées :

- les joueurs n'ayant joué aucune séance sont exclus ;
- pour chaque joueur, le bot affiche le nombre total de séances jouées ;
- seuls ses personnages ayant effectivement joué sont listés ;
- chaque personnage affiche son niveau Foundry et son nombre de séances ;
- lorsque le niveau théorique dérivé de la progression est supérieur au niveau réellement appliqué dans Foundry, le décalage est signalé sous la forme « niveau à faire ».

`/recap-seance` est une commande d'administration : elle sélectionne une séance existante et reconstruit l'annonce prévue avec les participants, la date de début de mission et le nombre de lancers de progression qui étaient dus avant cette séance.

`/debut-seance` utilise le même calcul de lancers de progression dans l'annonce finale. Le code courant affiche bien la liste des personnages et les lancers, mais **n'affiche pas encore leur niveau dans cette annonce** ; c'est le reliquat connu de la demande initiale.

Quand Foundry est indisponible, le bot peut se replier sur le cache des noms d'Actors pour certaines opérations. Les comparaisons de niveau nécessitent toutefois les données de progression Foundry disponibles via le Relay.

### 11.3 Journal de quêtes Discord ↔ carte de Golarion

Le forum Discord `journal-de-quetes` est **source de vérité pour les fils, titres et statuts de quêtes**, tandis que `pf2.sqlite` conserve leur catalogue synchronisé et les associations cartographiques par **ID de fil**. `DiscordService` récupère les fils actifs et archivés au démarrage, puis toutes les **cinq minutes**. Le tag « Terminée » est déterminant ; un archivage seul ne signifie pas qu'une quête est finie. Les commandes `/terminer-quete` et `/relancer-quete` continuent de modifier Discord, sans créer une source concurrente.

Un renommage de fil ne casse pas son association à un lieu : il se reflète après la prochaine synchronisation réussie et le rechargement de la carte. La création d'une quête reste la **création libre d'une discussion dans le forum** ; aucune commande `/créer quête` n'est souhaitée. La carte gère les lieux, non le cycle de vie des quêtes.

Pour les tables SQLite, la migration des anciens points, les lieux partagés PJ/MJ, les favoris et la visibilité conditionnelle des quêtes terminées, voir le [document technique dédié](../../docs/pf2/discord-quest-map-sync.md). Les données métier réelles restent dans SQLite, et non dans ce fichier.


---

---

## 15. Wiki joueur / MediaWiki

Le wiki joueur participe désormais au flux PF2 actif via `MediaWikiClientService`. Le backend utilise l’Action API pour publier ou référencer des contenus narratifs destinés aux joueurs ; ces textes restent dans le wiki et ne sont pas dupliqués comme source narrative dans SQLite.

Commandes documentées :

```text
npm run wiki
npm run wiki:up
npm run wiki:down
npm run wiki:logs
```

Port local documenté :

```text
4205
```

URL publique documentée :

```text
https://wiki.l7r.fr
```

### Répertoire des personnages joueurs dans l'application MJ

La section **Personnages joueurs** (`/pf2-mj/players`) regroupe les fiches PJ associées à des Actors Foundry. La fiche individuelle `/pf2-mj/players/:npcId` affiche le joueur, son compte Wiki, les identifiants Discord et Foundry, la fiche Wiki et le salon Discord privé associé, avec un lien d'ouverture soumis aux permissions Discord.

La source métier reste SQLite : `pf2_player_identity`, `pf2_wiki_account_link`, `pf2_player_character_owner`, `pf2_player_character_profile`, `pf2_foundry_wiki_pj_link` et `pf2_player_discord_channel`. Chaque PJ peut aussi référencer une discussion ChatGPT via `pf2_player_chatgpt_link` (URL facultative, aucune conversation récupérée automatiquement). L'association d'un salon concerne un **PJ**, pas une personne : un joueur peut posséder plusieurs PJ et donc plusieurs salons.

Les salons ont été retrouvés via l'API Discord du bot dans la catégorie « PJs ». **Le bot ne dispose actuellement pas des droits de lecture des messages de ces salons (HTTP 403)** ; la page fournit des raccourcis, pas une consultation ni une analyse de leur historique. Côté Foundry, l'UUID de l'Actor est conservé comme référence fiable ; aucun lien navigateur direct vers un Actor n'est garanti par le système actuel.

### 15.1 Journaux non révélés

Le comportement attendu et implémenté est volontairement asymétrique :

- un joueur normal peut voir qu'un journal existe, mais ne reçoit pas le texte tant qu'il n'est pas révélé ;
- un administrateur ouvrant directement un journal non révélé voit l'avertissement **« Journal non révélé »** puis le texte complet ;
- MediaWiki transmet pour cet accès une clé interne au backend ; cette clé reste une configuration serveur et ne doit jamais être exposée au navigateur ou documentée en clair.

Les anciennes documentations décrivant le wiki comme hors flux sont obsolètes. Discord diffuse les résumés courts et constitue **la source de vérité des quêtes de son forum** ; il ne remplace pas SQLite pour les autres données métier PF2. `pf2_media` n’est pas la source canonique des portraits PNJ.

---

---

## 16. Anciennes dettes et anomalies — historique, à revalider

> **Attention :** cette section provient du récapitulatif historique et comporte des points depuis modifiés. Utiliser [Travaux ouverts](travaux-ouverts.md) pour le suivi actif ; ne pas traiter les listes ci-dessous comme des tickets confirmés.

### Priorité haute

#### A. PDF multi-cibles

Un fichier de compilation doit pouvoir satisfaire plusieurs unités jouables.

Le modèle historique ne le représentait pas correctement partout. Une projection existe désormais dans le code ; voir [l'architecture](architecture.md#65-pdf-de-compilation-et-plusieurs-unités-jouables--état-à-tester) et tester le cas réel avant de rouvrir cette dette.

Cas témoin : Agents d’Absalom.

#### B. Arcs narratifs PFS transverses

Le catalogue sait déjà représenter des `arcIds` traversant plusieurs saisons (`blackwood`, `clockwork-mystery`, etc.). Le Journal et le Catalogue les présentent désormais comme des campagnes transverses. La saison PFS reste un conteneur éditorial et ne devient pas une campagne de jeu.

La campagne transverse éditoriale `open-road` / « La Route ouverte » est désormais modélisée après vérification des sources Paizo : elle relie le métaplot du Pacte de la Route ouverte à la remise en service puis aux perturbations du Labyrinthe de la Route ouverte. Ce regroupement est propre à la table ouverte et n’est pas présenté comme un arc Paizo unique.

Dans le Catalogue, un scénario Pathfinder Society appartenant à une campagne transverse n’est plus répété sous sa saison : il reste dans sa saison au niveau des données, mais l’affichage canonique passe par la campagne transverse. Les actions `Retenir`, `Ajouter au Journal`, `Plus tard` et `Écarter` se propagent à ses membres ; sélectionner directement un scénario membre propage également la sélection aux autres scénarios encore non commencés de l’arc.

#### C. Provenance Foundry

L’application détecte les dossiers de scènes préexistants hors Toolkit et les affiche séparément du package géré. La détection prouve une présence dans le monde mais pas à elle seule une provenance « officielle Paizo » ; cette provenance devra être ajoutée uniquement lorsqu’elle est vérifiable.

### Priorité moyenne

#### D. Deux représentations des scénarios

L’audit contient :

```text
pf2_record kind=scenario : 250
pf2_catalogue_entity entry : 250
```

Les 250 IDs correspondent, mais seuls 114 payloads sont identiques ; 136 divergent.

Le runtime catalogue principal utilise `pf2_catalogue_entity`, mais certaines routes conservent `pf2_record scenario` comme fallback.

Ce doublon doit être supprimé ou rendu explicitement legacy quand les dépendances auront été vérifiées.

#### E. XPC dans le wrapper Relay

Le wrapper Nest peut encore reconstruire une XPC absente depuis niveau/XP PF2e.

Le Toolkit ne le fait pas.

La règle cible est : l’XPC provient du recalcul depuis les séances et utilise la courbe historique.

### Non bloquant actuellement

#### F. Packages

Le pipeline de packages est maintenant utilisé en production. La dette restante porte surtout sur l’automatisation de la génération et sur la réduction des allers-retours manuels, pas sur l’existence du pipeline.

---
