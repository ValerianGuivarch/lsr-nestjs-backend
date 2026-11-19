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

Le volume 1 est désormais découpé en quatre périodes jouables persistantes dans le catalogue et dans **Choix libre**.

| Ordre | Clé de composant | Module | Continuité | État de préparation |
| --- | --- | --- | --- | --- |
| 1 | `allies-a-nantambu` | **Alliés à Nantambu** | libre, groupe variable, retour au hub possible | **Prêt techniquement** ; Foundry `N/A` car module RP sans carte tactique obligatoire ; bloqué narrativement jusqu'à l'ouverture réelle du passage |
| 2 | `services-de-la-magaambya` | **Services de la Magaambya** | libre, groupe variable | modèle créé, **partiel** : détails mécaniques du PDF complet et Foundry manquants |
| 3 | `masques-et-incidents` | **Masques et incidents** | verrou souple, même groupe recommandé | modèle créé, **partiel** : cérémonie et matrice d'indices préparées, détails source/Foundry à compléter |
| 4 | `stone-ghost` | **Le Fantôme de pierre** | verrou dur pendant le final | modèle créé, **partiel** : convergence et conséquences préparées ; rencontre exacte non inventée |

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

Le final est préparé comme résolution de l'arc initial : les incidents convergent vers **Stone Ghost**, coordinateur des gremlins. Une fois le final tactique engagé, la même équipe est recommandée jusqu'à la résolution.

Le modèle interdit explicitement de créer une fausse fiche de Stone Ghost, de faux DD ou un faux coffre sous étiquette Paizo. Il prévoit le suivi durable : Stone Ghost mort/capturé/en fuite, gremlins, dégâts du campus, confiance de la Magaambya, contacts récurrents et informations transmises.

## Sources réellement disponibles

État vérifié dans `pf2-data` le 19 novembre 2026 :

- **Tome 1 — Kindled Magic** : seulement une bible MJ de 4 pages ; pas de PDF d'aventure complet ;
- **Tome 2 — Spoken on the Song Wind** : seulement une bible MJ de 4 pages ; pas de PDF d'aventure complet ;
- **Tome 3 — Hurricane's Howl** : bible MJ de 4 pages + cartes ; pas de PDF d'aventure complet ;
- **Tome 4 — Secrets of the Temple-City** : PDF anglais complet + traduction partielle + cartes ;
- **Tome 5 — Doorway to the Red Star** : PDF anglais complet + traduction partielle + cartes ;
- **Tome 6 — Shadows of the Ancients** : PDF anglais complet + traduction partielle + cartes ;
- dossier `Foundry/` de la campagne présent mais **vide** ; aucun ZIP/FVTT de La Force des milliers n'a été trouvé dans la bibliothèque actuelle.

Les bibles MJ des tomes 1–3 indiquent elles-mêmes qu'il faut revenir au volume Paizo pour les cartes détaillées, DD, statblocks, dangers, trésors et textes de scène. Ces éléments ne doivent pas être inventés puis présentés comme canoniques.

## Éléments des volumes suivants à conserver

La campagne garde son arc général, adapté à des alliés extérieurs :

- *Spoken on the Song Wind* élargit les services à **Nantambu**, avec alchimiste vengeur, infiltrateurs et l'artefact mystérieux associé aux rassemblements d'arthropodes ;
- *Hurricane's Howl* transforme l'ancien rôle de professeurs en **mission d'accompagnement / partenariat** vers les Terres détrempées, Kiutu et les communautés menacées ;
- *Secrets of the Temple-City* conserve la délégation diplomatique à **Mzali**, le Sanctuaire de l'Éclipse et la piste d'Osibu ;
- *Doorway to the Red Star* conserve la préparation de l'expédition, les Iobane, le passage vers **Akiton**, l'aide aux Contemplatifs et la poursuite du Roi des Fourmis Mordantes ;
- *Shadows of the Ancients* conserve la crise du Vesicant Egg et la défense finale de la Magaambya.

Ces volumes ne sont pas encore les modules immédiatement accessibles : ils seront découpés en périodes jouables lorsque la progression de *Kindled Magic* les rendra prochains, afin de ne pas préparer comme « choix libre » des étapes narrativement verrouillées.

## Foundry — état vérifié

Le 19 novembre 2026, le Relay répond et connaît le monde `test-pf2` / « Les Eclaireurs » (Foundry 14.365, PF2e 8.4.1), mais le client GM apparaît **hors ligne**.

Conséquences :

- aucune écriture de scène, JournalEntry, Actor, token, rencontre, coffre ou objet n'a été faite pour cette campagne lors de cette passe ;
- aucun contournement par LevelDB, script injecté ou accès direct au stockage Foundry n'a été utilisé ;
- dès que le client GM est reconnecté, reprendre par les routes `foundry/gm/*`, relire chaque document après écriture et n'actualiser `foundry: done` qu'après vérification visuelle/mécanique ;
- le module **Alliés à Nantambu** n'a pas besoin de Foundry pour être jouable ; les trois modules suivants en auront besoin dès qu'ils comporteront leur matériel tactique exact.

## Point technique identifié

L'import des composants de campagne stocke correctement les modules dans les `parts` du catalogue, ce que Choix libre lit déjà. L'endpoint de synthèse `campaigns/:id/playable-components` ne lisait jusque-là que d'anciens sous-scénarios stockés comme entrées séparées et renvoyait donc `0 scénario / 0 module`.

Un correctif avec test de non-régression est préparé sur la branche de travail de cette passe afin que les deux représentations soient reconnues sans dupliquer les données.

## Règle de continuité

Cette fiche capitalise les **décisions de préparation** et les dépendances durables. Les états de checklist, modèles de séance, séances jouées et ressources runtime restent dans SQLite/Choix libre ; les scènes et mécaniques vivent dans Foundry ; les détails de source restent dans les PDF.

À chaque reprise :

1. vérifier si le passage du Labyrinthe vers Nantambu a réellement été ouvert ;
2. vérifier le dernier module effectivement joué ;
3. importer le modèle Choix libre correspondant dans une séance seulement lorsque les joueurs l'ont choisi ;
4. ne passer un module à `ready` que lorsque ses cinq critères sont `done` ou `N/A`.
