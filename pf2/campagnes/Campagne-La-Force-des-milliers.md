# La Force des milliers

[← Index des campagnes](Campagnes.md) · [Labyrinthe de Narven](../univers/Labyrinthe-et-portails.md) · [La Route ouverte](Campagne-Route-Ouverte.md) · [Yaz Lorok](../pj/PJ-Yaz-Lorok.md)

> **Statut runtime vérifié le 19 novembre 2026 : campagne intégrée et sélectionnée « à jouer », aucune séance de La Force des milliers attestée comme jouée.**
>
> La campagne publiée est fortement adaptée : les PJ de la table ne deviennent pas une promotion d'élèves de la Magaambya. Le premier module est préparé, mais reste **narrativement bloqué tant qu'un passage du Labyrinthe de Narven vers Nantambu n'a pas été ouvert en jeu**.

## Décisions validées

- Les PJ ne sont **pas des élèves de la Magaambya**. Les introductions, jalons scolaires et plusieurs motivations de quêtes doivent être adaptés.
- Leur point d'entrée est leur relation avec la **Société des Éclaireurs** : ils interviennent comme alliés extérieurs venant aider la Magaambya et ses communautés.
- La continuité académique est portée par des étudiants, enseignants et responsables récurrents. Les équipes de PJ peuvent varier entre les missions de terrain.
- Les examens et promotions de l'AP ne sont pas imposés aux PJ. Les rites intéressants peuvent être conservés sous forme d'invitations, de partenariats, de protections ou de témoignages.
- L'ouverture de cette campagne passe par le **Labyrinthe de Narven / futur Labyrinthe de la Route ouverte**. La préparation de La Force des milliers ne doit pas court-circuiter la progression de la campagne transverse : tant que la route vers Nantambu n'existe pas dans le jeu, l'accès reste un prérequis non satisfait.
- Pour **Yaz Lorok**, sa première année à la Magaambya avec **Narek Lorok** fait déjà partie de son histoire validée. Le retour à Nantambu peut donc servir de piste personnelle, mais la campagne doit rester jouable sans Yaz et ne doit jamais révéler hors jeu les découvertes d'Uxir ou le secret de Narek.

## Progression réelle

Au 19 novembre 2026 :

- `pf2_session_content` ne contient aucune séance rattachée à un scénario `strength-of-thousands-*` ;
- aucune quête Discord / Choix libre n'est encore rattachée à cette campagne ;
- la curation SQLite indique `excluded: false`, `preparationStatus: selected` et `playStatus: to_play` ;
- l'ancienne formulation « campagne prévue plus tard » est donc obsolète comme état runtime, même si le **pré-requis narratif du passage vers Nantambu** reste non joué.

Ne pas transformer l'état « à jouer » en événement de fiction : il signifie que la campagne est retenue dans le Journal MJ, pas que les PJ ont déjà atteint Nantambu.

## Prochains modules jouables — Kindled Magic

Le volume 1 est désormais découpé en cinq périodes jouables persistantes dans le catalogue et dans **Choix libre**.

| Ordre | Clé de composant | Module | Continuité | État de préparation |
| --- | --- | --- | --- | --- |
| 1 | `allies-a-nantambu` | **Alliés à Nantambu** | libre, groupe variable, retour au hub possible | **Prêt techniquement** ; Foundry `N/A` car module RP sans carte tactique obligatoire ; bloqué narrativement jusqu'à l'ouverture réelle du passage |
| 2 | `services-de-la-magaambya` | **Services de la Magaambya** | libre, groupe variable | modèle créé, **partiel** : détails mécaniques du PDF complet et Foundry manquants |
| 3 | `masques-et-incidents` | **Masques et incidents** | verrou souple, même groupe recommandé | modèle créé, **partiel** : cérémonie et matrice d'indices préparées, détails source/Foundry à compléter |
| 4 | `stone-ghost` | **Le Fantôme de pierre** | verrou dur pendant la confrontation | modèle créé, **partiel** : convergence et conséquences préparées ; rencontre exacte non inventée |
| 5 | `anadi-et-griffons` | **Les anadi et les griffons** | verrou souple, même groupe recommandé | modèle créé, **partiel** : raccord canonique confirmé par le tome 2 ; détails mécaniques du tome 1 manquants |

### 1 — Alliés à Nantambu

Une fois la route vers Nantambu réellement ouverte, les Éclaireurs arrivent comme **partenaires extérieurs**. Le module sert à fixer le point de débouché effectivement établi par la Route ouverte, présenter la philosophie de service de la Magaambya, installer quelques visages récurrents et conclure l'accord de coopération.

Le modèle Choix libre contient notamment :

- une garde explicite empêchant ce module d'ouvrir lui-même le portail ;
- l'adaptation de Yaz s'il est présent, sans révéler l'enquête d'Uxir si elle n'a pas encore été jouée ;
- **Esi Djana** comme relais récurrent de l'éthique de service ;
- **Xhokan**, gestionnaire kobold des fournitures, comme contact institutionnel secondaire ;
- le cadre de table ouverte : les résidents portent la mémoire, les PJ variables prennent les missions de terrain ;
- la transition vers un premier service non létal impliquant des gremlins.

Aucune carte tactique ni Actor de combat n'est requis pour ce module : le critère Foundry est donc légitimement `N/A`, pas artificiellement contourné.

### 2 — Services de la Magaambya

Le principe confirmé par la bible MJ est conservé : **Esi demande notamment d'évacuer des gremlins d'un local sans les tuer**. C'est le premier test concret de la manière de travailler des alliés.

Le conducteur prévoit plusieurs familles de solutions non létales et le suivi des conséquences communautaires, mais **ne fixe volontairement aucun DD ni statblock** : ces informations ne figurent pas dans la source locale disponible. Les premiers indices de coordination entre incidents sont préparés sans révéler prématurément Stone Ghost.

### 3 — Masques et incidents

La **Masking Ceremony** est conservée comme rite auquel les Éclaireurs sont invités, et non comme promotion scolaire des PJ. Elle sert de jalon relationnel avant une phase d'enquête légère.

La matrice d'indices préparée suit la bible MJ :

1. comprendre que les incidents sont coordonnés ;
2. comprendre que l'organisateur connaît le campus ;
3. n'identifier Stone Ghost que lorsque témoignages, comportements des gremlins ou confrontation le justifient.

Les preuves réellement obtenues doivent être transmises entre équipes ; les secrets MJ ne le sont pas.

### 4 — Le Fantôme de pierre

Cette escalade majeure est préparée autour de **Stone Ghost**, ancien élève expulsé supposé mort et coordinateur des gremlins. Une fois la confrontation tactique engagée, la même équipe est recommandée jusqu'à la résolution. Le tome 2 complet confirme toutefois que Stone Ghost n'est pas le dernier événement de *Kindled Magic* : l'arrivée d'anadi puis une attaque de griffons suivent encore.

Le modèle interdit explicitement de créer une fausse fiche de Stone Ghost, de faux DD ou un faux coffre sous étiquette Paizo. Il prévoit le suivi durable : Stone Ghost mort/capturé/en fuite, gremlins, dégâts du campus, confiance de la Magaambya, contacts récurrents et informations transmises au module suivant.

### 5 — Les anadi et les griffons

Le tome 2 complet établit sans ambiguïté qu'à la fin de *Kindled Magic*, de **nouveaux étudiants anadi arrivent à la Magaambya** et qu'une **paire de griffons les attaque**. Deux semaines plus tard, Janatimo revient et demande aux héros d'enquêter précisément sur ces deux mystères : ce qui a attiré les anadi à l'école et pourquoi les griffons les ont pris pour cibles.

Ce cinquième module est donc désormais enregistré dans Choix libre. Son conducteur est prêt sur le plan narratif et sert de raccord propre vers *Spoken on the Song Wind*. En revanche, le PDF complet du tome 1 restant absent, le lieu exact, les DD, les statblocks, tactiques, trésors et éventuels PNJ anadi nommés ne sont pas inventés.

## Sources réellement disponibles

État vérifié dans `pf2-data` le 19 novembre 2026 :

- **Tome 1 — Kindled Magic** : seulement une bible MJ de 4 pages dans `pf2-data`. Une tentative de copie du PDF anglais est présente à la racine de `/home/valou/services`, mais le fichier est **vide (0 octet)** et n'a donc pas été intégré ;
- **Tome 2 — Spoken on the Song Wind** : **PDF anglais complet de 100 pages** désormais rangé dans `Documents/` et associé directement à `strength-of-thousands-volume-2` dans la bibliothèque ;
- **Tome 3 — Hurricane's Howl** : **PDF anglais complet de 100 pages** désormais rangé dans `Documents/`, associé directement à `strength-of-thousands-volume-3`, avec les cartes déjà présentes ;
- **Tome 4 — Secrets of the Temple-City** : PDF anglais complet + traduction partielle + cartes ;
- **Tome 5 — Doorway to the Red Star** : PDF anglais complet + traduction partielle + cartes ;
- **Tome 6 — Shadows of the Ancients** : PDF anglais complet + traduction partielle + cartes ;
- dossier `Foundry/` de la campagne présent mais **vide** ; aucun ZIP/FVTT de La Force des milliers n'a été trouvé dans la bibliothèque actuelle.

La bible MJ du tome 1 reste insuffisante pour les cartes détaillées, DD, statblocks, dangers, trésors et textes de scène de *Kindled Magic*. En revanche, les tomes 2 et 3 peuvent désormais être préparés directement depuis leurs volumes complets.

## Éléments des volumes suivants à conserver

La campagne garde son arc général, adapté à des alliés extérieurs :

- *Spoken on the Song Wind* est maintenant vérifié depuis le PDF complet : **chapitre 1 — The Learned One Returns**, puis **chapitre 2 — Service to the City**, structurés en bac à sable de missions choisies librement, puis **chapitre 3 — The Flooded Mansion**. Niveaux publiés : départ 4, passages 5 puis 6, niveau 7 avant le manoir, fin au niveau 8. Notre adaptation conserve ce bac à sable mais remplace la promotion académique par des mandats confiés aux alliés de la Société ;
- *Hurricane's Howl* est maintenant vérifié depuis le PDF complet : **The Missing Student**, **Vanished Villagers**, **Prison of the Vacant Eye**, puis **Jula's Plight**. Niveaux publiés : départ 8, puis 9/10/11 et fin au niveau 12. L'ancien rôle de professeurs devient une **mission d'accompagnement / partenariat** vers Bloodsalt, Kiutu, la prison cyclopéenne et Jula ;
- *Secrets of the Temple-City* conserve la délégation diplomatique à **Mzali**, le Sanctuaire de l'Éclipse et la piste d'Osibu ;
- *Doorway to the Red Star* conserve la préparation de l'expédition, les Iobane, le passage vers **Akiton**, l'aide aux Contemplatifs et la poursuite du Roi des Fourmis Mordantes ;
- *Shadows of the Ancients* conserve la crise du Vesicant Egg et la défense finale de la Magaambya.

Ces volumes ne sont pas encore les modules immédiatement accessibles : ils seront découpés en périodes jouables lorsque la progression de *Kindled Magic* les rendra prochains, afin de ne pas préparer comme « choix libre » des étapes narrativement verrouillées.

## Foundry — état vérifié

Le 19 novembre 2026, le client GM du monde `test-pf2` / « Les Eclaireurs » est **reconnecté** (Foundry 14.365, PF2e 8.4.1).

### Scènes existantes réutilisées

Le dossier de scènes `La Force des milliers / 01 — La magie éveillée` existait déjà avec **11 scènes**, toutes sans token ni note lors de l'audit mais avec leurs cartes, murs et, selon les scènes, éclairages/tuiles/dessins :

- `Scene.O3rc0xM6kglcA6n5` — Cérémonie d'accueil ;
- `Scene.dCGvdhVGUOj9Z0nz` — Promenade de bienvenue ;
- `Scene.CFCcMr0O2BO13B2k` — Dortoir de la flèche ;
- `Scene.a2D4BvW6F1QD9cb7` — Cuisine ;
- `Scene.Z7dymsaAAGYFvucZ` — Grange de stockage ;
- `Scene.yQ3o4nVBmkAD4egh` — Bibliothèque de la souche ;
- `Scene.vbivc7jTUKcsTMO3` — Caverne infestée ;
- `Scene.79VDNx8gLXJ0sFyy` — Chapeaux écarlates ;
- `Scene.WxZJDR1HDOTVfvCh` — Auditorium ;
- `Scene.BemrdX45skua7AoA` — Auditorium — Détruit ;
- `Scene.vCSwFmHLvMrfwpYW` — Tournoi du jour des étoiles.

Ces scènes sont **réutilisées telles quelles**. Aucun doublon n'a été créé.

### Actors préparés

Un dossier d'Actors `La Force des milliers / 01 — La magie éveillée` a été créé, puis six fiches sûres ont été clonées depuis les compendiums officiels avec leur mécanique intacte :

- `Actor.mwJFTAfXrdtE8B7e` — Fantôme de pierre (Stone Ghost), niveau 5, 40 PV ;
- `Actor.dhyMLjySKHXF4rt7` — Pugwampi (FdM), niveau 0 ;
- `Actor.8P2dxDd4QWxGDb8F` — Takulu Ot, niveau 4 ;
- `Actor.t20usW8bSwcnIJ6b` — Chercheur anadi, niveau 1 ;
- `Actor.C2tRvfAUs8OeTUFC` — Tisseur de destin anadi, niveau 5 ;
- `Actor.d52rV544urzo3xYH` — Griffon, niveau 4.

Chaque Actor conserve son `sourceUuid` de compendium dans `flags.l7r`. Les gremlins nommés supplémentaires visibles dans le bestiaire n'ont pas été clonés tant que le PDF 1 complet n'est pas disponible, afin d'éviter des Actors inutiles ou mal affectés.

### Journal MJ

Le dossier `MJ / Campagnes officielles / La Force des milliers / 01 — La magie éveillée` a été créé avec le journal :

- `JournalEntry.Vh5Nd67dce6U9ilc` — **La Force des milliers — 01 — La magie éveillée — Préparation MJ**.

Il contient huit pages : vue d'ensemble, les cinq modules, inventaire Foundry, blocages/reprise. Les pages utilisent des liens UUID directs vers les scènes et Actors existants.

### Limite actuelle

Foundry est donc **partiellement préparé** pour les quatre modules tactiques : scènes, Actors sûrs et Journal MJ sont en place. Les checklists Choix libre ont été mises à jour de `foundry: todo` vers `foundry: partial`.

Aucun token, nombre de créatures, DD, coffre, trésor, déclencheur ou tactique n'a été inventé. Le fichier `Kindled Magic` présent à la racine de `/home/valou/services` reste à **0 octet** ; il faut une copie PDF valide avant de finaliser les rencontres et de passer Foundry à `done`.

Aucun accès direct au stockage Foundry/LevelDB n'a été utilisé : toutes les écritures sont passées par le Relay.

## Point technique identifié et corrigé

L'import des composants de campagne stocke les modules dans les `parts` du catalogue. L'endpoint de synthèse `campaigns/:id/playable-components` ne lisait auparavant que d'anciens sous-scénarios stockés comme entrées séparées.

Le correctif a été fusionné et déployé le 19 novembre 2026 (commit `4ca087d`). L'endpoint relit désormais correctement les six volumes et les composants de `Kindled Magic` sans dupliquer les données.

## Règle de continuité

Cette fiche capitalise les **décisions de préparation** et les dépendances durables. Les états de checklist, modèles de séance, séances jouées et ressources runtime restent dans SQLite/Choix libre ; les scènes et mécaniques vivent dans Foundry ; les détails de source restent dans les PDF.

À chaque reprise :

1. vérifier si le passage du Labyrinthe vers Nantambu a réellement été ouvert ;
2. vérifier le dernier module effectivement joué ;
3. importer le modèle Choix libre correspondant dans une séance seulement lorsque les joueurs l'ont choisi ;
4. ne passer un module à `ready` que lorsque ses cinq critères sont `done` ou `N/A`.
