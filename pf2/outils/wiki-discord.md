# Wiki et Discord PF2 — intégrations

[← Outils](../../OUTILS.md)

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

Les salons de PJ sont enregistrés dans SQLite. Un lecteur local, limité aux salons autorisés, permet désormais de consulter leurs messages via le bot déjà configuré. Le wiki fournit toujours les liens vers les salons. Côté Foundry, l'UUID de l'Actor est conservé comme référence fiable ; aucun lien navigateur direct vers un Actor n'est garanti par le système actuel.

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

## Background et Notes des personnages joueurs (octobre 2026)

La source éditable est désormais **SQLite** : `pf2_player_character_background` et `pf2_player_character_notes`, toutes deux indexées par `npc_id`. Les douze récits initiaux ont été importés dans la première table ; les notes commencent vides. Les fiches `pf2/pj/PJ-*.md` conservent la continuité MJ et un lien vers `Special:MesPersonnages/npc_pj_...`, sans recopier le récit visible.

L'onglet **Background** et le nouvel onglet **Notes**, situé avant Contacts, sont éditables par le propriétaire connecté. Les comptes wiki ayant le droit administrateur MediaWiki `delete` accèdent à la liste complète des PJ dans Mes personnages et peuvent éditer les deux champs. Le serveur Wiki transmet cette habilitation via son API interne authentifiée ; un joueur non administrateur ne peut accéder qu'aux personnages qui lui sont associés.

Les données restent stockées en base, et les fiches Markdown ne sont plus une source de synchronisation des Backgrounds. En cas de mise à jour de background, modifier la fiche Wiki, pas les Markdown. Une sauvegarde SQLite a été réalisée avant import.


## Lecture locale en lecture seule des salons Discord PJ (octobre 2026)

Le mini-PC dispose du script versionné `scripts/pf2-discord-pj-read.py` ; utilisation depuis la racine du dépôt :

```bash
python3 scripts/pf2-discord-pj-read.py Eryn --limit 100
```

Il résout le **salon autorisé** du PJ via `pf2_player_discord_channel` et `pf2_player_character_profile`, puis lit les messages par l'API Discord, dans le conteneur `lsr-app-api-jdr-1` et avec son token de bot existant. SQLite est ouvert en lecture seule, aucun token n'est enregistré dans le script, aucun nouveau port n'est exposé et aucune écriture Discord n'est exécutée.

L'option `--limit` accepte 1 à 500 messages (100 par défaut). Le JSON inclut les identifiants des messages, leurs auteurs, leurs dates, leur contenu et l'éventuel identifiant du message parent. La lecture dépend des droits effectifs du bot et ne garantit pas que tout l'historique du salon a été récupéré.

**Sécurité :** exécuter uniquement sur un mini-PC autorisé, avec accès aux volumes SQLite et au conteneur Docker. Aucune authentification locale supplémentaire n'a été ajoutée ; les droits Docker dépassent ceux du script. Sur le mini-PC, conserver/restaurer le mode de fichier `700` si nécessaire (Git ne conserve que le bit exécutable).

**Pour les fiches PJ :** consulter les discussions afin d'identifier contacts, proches et informations nouvelles, puis les recouper avec les Backgrounds et Notes éditables du wiki/SQLite et les fiches de continuité MJ `pf2/pj/`. Un message Discord n'établit pas à lui seul un fait canonique. Aucun contenu privé n'est commité ; toute modification durable exige l'accord préalable du MJ selon `PF2_WORKSPACE.md`.

## Fiche PJ éditable du wiki (octobre 2026)

L'onglet **Fiche** de `Spécial:MesPersonnages/npc_pj_...` présente désormais des champs courts et indépendants : **Nom**, **Ascendance**, **Classe**, **Objectif**. Chaque valeur, y compris initialement vide, est modifiable au moyen de l'icône crayon. Ces champs sont persistés dans `pf2_player_character_profile` (`display_name`, `ancestry`, `character_class`, `objective`) via l'API privée du wiki ; le propriétaire du PJ ou un administrateur wiki peut les mettre à jour. La description courte reste au-dessus des onglets, et Background, Notes et Contacts ne changent pas.

Les contacts sont des fiches métier MJ dans SQLite : identifier d'abord un PNJ existant, sinon présenter au MJ une proposition de création. Après accord explicite, créer/compléter la fiche PNJ MJ, puis associer le contact au PJ avec la relation `pf2_player_character_contact` et vérifier sa visibilité sur le wiki. Le lecteur Discord `scripts/pf2-discord-pj-read.py` sert à préparer ces propositions et non à créer automatiquement des contacts. Les secrets MJ restent hors des champs publics.

## Onglet MJ confidentiel et accès MJ aux contacts

Dans **Mes personnages**, le wiki affiche un cinquième onglet **MJ** sur la fiche d'un PJ, **uniquement** aux comptes MediaWiki possédant le droit administratif `delete`. L'onglet charge à la demande la fiche de continuité MJ `pf2/pj/PJ-*.md` via `pf2playercodexmj` et une route backend **interne** protégée par la clé Wiki. La liste des personnages ordinaire (`pf2playercodexme`) ne contient **jamais** le Markdown privé. L'autorisation est vérifiée côté PHP avant l'appel interne, et le frontend masque l'onglet pour les autres comptes. Le contenu est inséré en texte brut, sans interprétation HTML.

Dans les **Contacts**, un second lien **MJ** apparaît à côté d'**Ouvrir** pour ces mêmes administrateurs et ouvre directement `https://l7r.fr/pf2-mj/npcs/{npcId}`, la fiche métier du PNJ dans l'interface MJ. Ce bouton ne doit jamais être présent pour un utilisateur non administrateur.

**Sécurité :** ne jamais ajouter le Markdown MJ aux objets `myCharacters` ni aux requêtes API publiques ; ne pas se fier au masquage JavaScript seul. Vérifier à chaque mise à jour que `action=pf2playercodexmj` renvoie un refus à un utilisateur non administrateur et que les données MJ ne figurent pas dans `action=pf2playercodexme`.

## Requêtes Discord et Kanban Wiki (implémentation en branche, octobre 2026)

Le salon Discord **bot-et-app** (`1554492543654436875`, serveur `1531345672639610920`) accueille les nouvelles demandes. Les anciens messages ne sont pas importés.

- `/requete` ouvre un formulaire sujet/description, avec image facultative en option de commande, puis une prévisualisation privée Publier/Annuler.
- `/requete-pour demandeur:@membre` est réservé aux membres dotés de ManageGuild, pour créer au nom d'un autre demandeur ; l'identité du saisissant et celle du demandeur sont distinctes en SQLite.
- Dans le fil d'une requête, les commandes administrateur `/requete-demande`, `/requete-encours` et `/requete-termine` peuvent faire toutes les transitions, y compris la réouverture.
- Chaque demande publiée reçoit un message Discord, un fil et une épingle. Les transitions éditent le message, ajoutent une notification dans le fil et épinglent/désépinglent selon l'état.
- La table SQLite `pf2_request` conserve sujet, description, auteur, saisissant, état, IDs Discord et dates.
- Le wiki expose la page standard Requêtes ainsi que `Special:RequetesPF2`. Le tableau Kanban utilise les modules `pf2requests` et `pf2requestsupdate` ; lecture publique, changement des statuts pour les comptes Wiki connectés avec jeton CSRF, puis API backend interne protégée par `PF2_WIKI_LOGIN_INTERNAL_KEY`.
- Les changements de statut depuis le wiki passent par le bot afin de modifier Discord.
- Si Discord est indisponible, le changement renvoie une erreur au lieu de simuler une réussite.

Cette première implémentation exige encore une validation de bout en bout après déploiement (droits d'épinglage du bot, enregistrement des commandes et appels MediaWiki). La compilation TypeScript a été vérifiée ; l'analyse syntaxique PHP doit être exécutée dans un environnement doté de PHP.

La page MediaWiki standard Requêtes embarque le Kanban avec un conteneur HTML identifié pf2-requests-board et charge le module depuis BeforePageDisplay. Consultation publique, changement des statuts possible par tout compte Wiki connecté (jeton CSRF) ; le backend interne reste protégé par clé serveur. La page spéciale Spécial:RequetesPF2 reste disponible comme accès direct.

## Portrait connu d'un contact (octobre 2026)

La relation `pf2_player_character_contact` possède le champ `portrait_known` (booléen SQLite 0/1). La migration `043-contact-portrait-known` initialise **toutes les associations existantes et futures à 1** : portrait connu. Pour un contact non publié, un passage explicite à 0 masque le portrait dans l'onglet Contacts du PJ, même lorsqu'un portrait MJ existe ; un personnage publié garde toujours son portrait public visible. Cette préférence est **spécifique au couple PJ/contact**, et ne modifie pas le portrait de la fiche MJ ni la publication. Le système renvoie `portraitKnown` et ne fournit plus d'URL de portrait au client lorsque la visibilité est interdite par ce champ. Le changement du flag doit rester une opération validée par le MJ ; la case **Portrait visible** est éditable dans la fiche du PNJ de l’application MJ, à côté du PJ associé. Voir [Visibilité des personnages](personnages-visibilite.md).
