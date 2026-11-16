# Projet Choix libre — refonte du parcours MJ et préparation permanente

[← Travaux ouverts](travaux-ouverts.md) · [Outils PF2](../../OUTILS.md) · [Campagnes](../../CAMPAGNES.md)

**État : projet ouvert, cadrage du 16 novembre 2026 — non implémenté.** Les choix exprimés par le MJ ci-dessous sont des besoins validés ; les détails de modèle et d'interface sont des propositions à arbitrer. Aucun changement runtime n'est réalisé par ce document.

## 1. Objectif

La table ouverte doit permettre aux joueurs de choisir leur objectif, y compris au début de la séance, sans devoir prévenir le MJ plusieurs jours avant. Chaque campagne commencée doit disposer en permanence d'au moins **un prochain module prêt à jouer** parmi ses suites accessibles ; idéalement, toutes les branches de quêtes réellement accessibles doivent être couvertes. Une quête n'est pas prête parce qu'un PDF existe, ni parce qu'elle est ouverte sur Discord.

Le MJ doit pouvoir, en quelques clics, savoir ce qui est jouable, ce qui manque, et importer les éléments préparés dans la séance du soir. Les secrets, impasses narratives et conditions de déblocage demeurent strictement MJ.

## 2. Organisation cible du contenu — proposition affinée le 16/11

**Principe : campagne = suite ordonnée de modules jouables, éventuellement structurée en groupes visuels.** Il n'est pas nécessaire de traverser campagne → tome → chapitre → scénario → module pour jouer.

### 2.1 Trois objets opérationnels

- **Campagne ou aventure autonome** : entrée principale unique de la bibliothèque jouable, avec type (campagne/indépendant), titre, contexte, progression et liste de modules. Une aventure autonome ne nécessite pas de campagne artificielle ; ses modules peuvent aussi être accessibles depuis une campagne PFS transverse sans duplication. La saison PFS est une métadonnée éditoriale ; respecter les dépendances, pas une barrière arbitraire par année.
- **Module jouable** : unité réutilisable (mission, enquête, niveau de donjon, ensemble de scènes ou objectif). ID stable, ordre, groupe facultatif, niveau, prérequis, synopsis, progression et état de préparation. Un module peut être dans une ou plusieurs suites narratives si nécessaire, avec ordre propre à chaque relation et état de progression partagé. Durée indicative, pas d'équivalence rigide avec une séance.
- **Séance** : événement planifié/joué, composé de modules importés et de blocs propres à la séance.

Un **groupe** (tome, chapitre, scénario PFS, arc local) est un repère éditorial/visuel facultatif avec un ID et une position permettant de conserver les associations de sources. Pas de sous-hiérarchie obligatoire : afficher les modules en liste, regroupables/repliables, avec recherche et filtre des prochains modules. Conserver les anciennes parties, numéros et intitulés comme métadonnées ; les guides/cartes/compilations ne sont jamais des groupes jouables. Pour un scénario PFS atomique le module peut porter directement son numéro et son titre, sans groupe intermédiaire. Plusieurs modules d'un même scénario PFS éventuel peuvent partager un groupe.

### 2.2 Les PDF sont des documents, jamais des unités de jeu

Dissocier le **contenu narratif** du **support documentaire**. Conserver un enregistrement par fichier physique unique (ID stable, chemin, langue, rôle, variante, complétude, existence sur disque). Utiliser une relation plusieurs-à-plusieurs entre document et cible (campagne/aventure, groupe ou module), avec référence de pages facultative, rôle et priorité. Un lien peut être hérité dans la vue d'un module depuis son groupe ou sa campagne, sans recopier des associations par module. La vue du module déduplique les documents par ID, montre le lien direct « Ouvrir le PDF » vers la référence de lecture privilégiée et permet d'afficher les autres versions et ressources utiles.

- Une compilation couvrant trois parties reste **un seul fichier** référencé par trois groupes, sans duplication physique ni fiche PDF supplémentaire par partie.
- Un tome séparé est lié à son groupe ; un livre unique couvrant toute la campagne est lié une seule fois à la campagne.
- Original EN, traduction FR complète ou partielle, traduction seule (original absent), édition FR officielle : variantes documentaires facultatives, reliées si la correspondance est attestée. Un module peut être préparé avec la traduction seule ; absence d'original ne crée pas un faux blocage. Ne pas confondre disponibilité documentaire avec readiness. Cartes, guides, bibles MJ et ressources externes : supports associés, pas des modules.
- Page de début/fin ou repère dans le PDF à saisir lorsque connu ; ne pas inventer. Le document principal peut être choisi explicitement par le MJ.

### 2.3 Exemples vérifiés dans SQLite

| Entrée | Affichage des modules | Documents |
| --- | --- | --- |
| L'Âge des Cendres | 33 modules existants, 6 groupes repliables (tomes). « Les Griffes de braise sous Altaérein » est un module du tome 1. | 6 PDF principaux distincts ; cartes et guide secondaires. |
| Agents d'Absalom | 33 modules existants, 6 groupes narratifs. Le module `palais-des-reves` correspond à L'hôtel des meurtres (tome narratif 1). | **Deux** PDF français de compilation : le premier est déjà lié aux parties 1, 2, 3 ; le second aux parties 4, 5, 6. Chaque fichier reste unique. |
| Les Sept Fléaux de Pointesable | 14 modules existants, groupes possibles « Ville », « Fosse » ; affiner la segmentation des niveaux si utile (ex. module actuel `crocs-sifflets-et-volpepite`, ne pas créer un doublon aveuglément). | Un PDF de campagne et guide secondaire ; aucun faux niveau « Livre de campagne ». |
| La Route ouverte | Liste des scénarios PFS comme modules (1-00, 1-08, 1-11…), éventuellement subdivisés. Ordre recommandé et prérequis. | PDF par scénario ; le 1-08 possède un original anglais et une traduction partielle FR. |
| Nuit au manoir de Blanchebois | Un scénario indépendant, un module. | Référence TRI-040 d'origine ; adaptation PF2 créée côté contenu jouable. |
| Cartel du Sel | Campagne maison ; module suivant à écrire. | Aucun PDF obligatoire. |

Les IDs et références historiques sont à préserver via une migration de correspondance des anciens couples scénario/composant → module stable. Une partie éditoriale peut correspondre à plusieurs modules ; un scénario autonome sans composants peut devenir un module unique, et les entrées sans objectif opérationnel (guides/compilations) ne sont pas promues. Éviter le re-traitement des PDF et le déplacement des fichiers. Tester d'abord les quatre modèles réels ci-dessus (tomes distincts, compilation partagée, livre unique, PFS variantes).

Le catalogue exhaustif, les PDF, les guides, cartes, traductions et inspirations ne constituent plus des niveaux de navigation principaux. Les Bounties/Primes sortent du parcours opérationnel et du catalogue courant visible par défaut (décision MJ : peu d'intérêt) ; conserver les données et documents en archive technique, sans suppression physique automatique.

## 3. Une interface de travail : Préparation de séance

Proposition de trois onglets sur l'écran existant :

1. **Choix libre** (vue d'entrée) : journal de quêtes Discord synchronisé ; titre, intérêt/réservation si utile, type MJ, campagne/scénario/module associé, disponibilité narrative, niveau, checklist de préparation et action principale. Filtrer « À préparer », « Jouable maintenant », « Sans module », « Bloqué ». Montrer d'emblée les prochaines missions pertinentes, pas les centaines d'entrées du catalogue.
2. **Modules jouables** : bibliothèque opérationnelle des modèles, avec accès direct par campagne/aventure et groupes visuels facultatifs, recherche et filtre sur les prochains modules à préparer. Accès direct à leurs sources, au conducteur modèle et aux références Foundry ; création d'un module libre ou depuis une source externe.
3. **Séance** : éditeur actuel de préparation, enrichi de « Importer un module ». Choisir un modèle, ajouter ses étapes/blocs au conducteur, les réordonner et compléter avec du RP, une introduction, une transition ou une rencontre propre à ce soir.

Exemple : je crée le conducteur, ajoute Corvan ou un PNJ d'ouverture, puis importe « Pointesable → Fosse → Niveau 1 ». Tous les blocs pertinents deviennent utilisables immédiatement sans ressaisie.

### Navigation principale — décision affinée le 16/11

| Entrée | Rôle |
| --- | --- |
| **Préparation de séance** (accueil MJ) | Choix libre, modèles de modules, conducteur, et accès à l'historique des séances. |
| **Campagnes et scénarios** | Remplace le Journal MJ actuel : uniquement les contenus explicitement intégrés à notre table. Vue d'avancement des campagnes et des modules, y compris ceux déjà joués. |
| **Catalogue** | Bibliothèque complète de contenu, y compris ce qui n'a pas été retenu, mis de côté, écarté, ou provient de ressources externes. Recherche, filtres de curation, intégration/retrait. |
| **Personnages joueurs** | Conserver l'écran existant (fiches, propriétaires, accès et liens). |
| **Histoire** | Conserver la visualisation actuelle des Markdown ; refonte éditoriale/ergonomique distincte, ultérieure. |
| **Monde** | Référentiels PNJ, factions, lieux, régions et événements. |
| **Administration** | Maintenance, inventaire PDF, chronologie technique, génération/déploiement, outils de migration. |

**Journaux d'Absalom : suppression de la fonctionnalité confirmée par le MJ.** Retirer l'entrée du menu, la vue dédiée `/pf2-mj/journaux`, son composant, styles, routage et documentation propre à cette génération de unes de gazette. Auditer les assets et dépendances exclusivement dédiés, les mettre en sauvegarde avant suppression ; préserver les données de jeu et les journaux/chroniques distincts, en particulier `pf2_journal` et `pf2_journal_revelation` qui ne sont pas identifiés comme appartenant à cette vue. Préserver les faits de lore d'Absalom et les publications historiques. Pas de nouvelle fonctionnalité de remplacement.

**Ressources** n'est plus une entrée principale ; le contenu Trilemma est accessible dans le Catalogue. La gestion des documents/inspirations est rattachée à la même bibliothèque.

**Campagnes et scénarios et Catalogue sont deux vues d'un même référentiel**, pas deux structures qui dupliquent les œuvres. Le catalogue est destiné à sélectionner ce qu'on souhaite intégrer ; la vue opérationnelle sert à jouer et à mesurer la progression.

## 4. Quêtes Discord : liaison et disponibilité narrative

Le fil Discord (ID stable) reste la source de vérité de la quête publique. Ni son titre ni son état public ne dévoilent le scénario réel, la classification, le statut MJ ou un spoiler. Synchroniser aussi les quêtes archivées sans verrouillage si elles demeurent ouvertes.

Proposer une relation MJ explicite entre quête et module(s), réutilisant les identifiants existants ; une quête peut couvrir plusieurs modules successifs ou alternatives, plusieurs quêtes peuvent pointer vers le même module. Afficher le prochain module disponible et les autres sur demande. Ne pas associer automatiquement sur une simple proximité de nom : suggérer, puis faire confirmer le lien. Une nouvelle quête sans association doit apparaître dans « À qualifier », avec actions « Associer un module existant », « Créer un module » ou « Classer autrement ».

Types MJ (choix proposé, modifiable) :

- **Mission jouable** : module identifié, disponible si les prérequis sont réunis.
- **Piste sans contenu** : vraie intention du groupe mais aucun module défini ; créer ou choisir le scénario, ou décider d'une improvisation préparée.
- **Piste narrative bloquée / longue** : vérité MJ connue, ne deviendra jouable qu'à un jalon d'une autre campagne ; documenter le déclencheur et une réponse crédible si les PJ insistent.
- **Quête personnelle de PJ** : objectif transverse (Yaz, Eos, Eryn si démarche personnelle, etc.) ; peut progresser par rencontres/indices greffés à des missions, ou pointer vers des modules dédiés. Pas de promesse d'une séance entière.
- **Sujet RP / curiosité** : aucune mission distincte actuellement ; conserver la piste et des notes de réponse éventuelles.

Une réservation 🔒 est distincte de la disponibilité technique/narrative et reste une contrainte de composition de groupe. Les autres joueurs ne doivent pas apprendre que Myojimo, la machine ou Corvan ne sont pas de vraies missions autonomes.

## 5. État d'un module : peu d'états, une checklist claire

Séparer trois axes indépendants, sans les transformer en cascade de statuts visibles :

- **Curation du catalogue** : intégré / non décidé / plus tard / écarté. Seul « intégré » alimente la vue Campagnes et scénarios ; les trois autres restent consultables dans Catalogue. Un bouton Intégrer/Reclasser modifie la sélection, pas l'historique. Les campagnes intégrées disposent d'un avancement à commencer / en cours / terminée, dérivé ou corrigé explicitement selon la progression des modules. Ne jamais interpréter une mise de côté comme un scénario joué.
- **Progression du module** : à jouer / entamé / terminé ; état factuel des salles, étapes et conséquences conservé.
- **Préparation** : calculée à partir de la checklist ci-dessous, indépendante de la progression et de l'existence d'un PDF.

Checklist proposée (chaque ligne : à faire / fait / non applicable ; justification pour non applicable) :

- [ ] Source identifiée, lue, objectifs et déroulé adaptés à la continuité.
- [ ] Conducteur modèle prêt (scènes, lore, décisions, issues, butin, références).
- [ ] PNJ, portraits, créatures, rencontres et objets nécessaires prêts/référencés.
- [ ] Foundry prêt : scènes/cartes, murs, éclairage, tokens/Actors, notes, objets et butin pertinents importés et vérifiés ; pas seulement « ZIP généré ».
- [ ] Contrôle final MJ : niveau/équilibrage, accès géographique, prérequis, conséquences, état réel du monde et contraintes de groupe revus.

Le statut visuel dérivé doit être simple : **Pas prêt** (au moins un manque), **Prêt** (tout est validé ou non applicable), **À actualiser** (suite à une séance/changement matériel significatif). Pas de faux vert pour une entrée partiellement préparée. Montrer l'avancement et la prochaine action plutôt que multiplier les labels (« retenu », « sélectionné », « en attente », etc.). Ne pas confondre « scénario disponible » et « module prêt à jouer ». Un module prêt mais inaccessible doit être signalé séparément. Une mission RP sans carte peut valider Foundry comme non nécessaire.

Après une séance, marquer les étapes réellement jouées, enregistrer les conséquences, puis préparer le prochain module accessible (ou réactualiser le module entamé). Maintenir un indicateur de couverture : nombre de quêtes réellement accessibles prêtes / nombre de quêtes accessibles nécessitant un module, et alerte pour une campagne active sans module suivant prêt. Les pistes sans contenu sont un travail à faire, les pistes intentionnellement bloquées ne sont pas de fausses urgences.

## 6. Modèles réutilisables et conducteur de séance

Réutiliser le schéma d'étapes et blocs de l'éditeur actuel (personnage, lore, rencontre, loot, texte, checklist, horaires indicatifs). La préparation propre au module est un **modèle persistant** : un même modèle peut servir à plusieurs séances. Les étapes spécifiques à l'événement restent dans la séance.

L'import crée une copie éditable des étapes/blocs avec nouveaux IDs et provenance (module, version, IDs d'origine). Conserver les références aux PNJ/Actors/Items/Scenes et portraits au lieu de dupliquer les entités référencées. Ne jamais écraser le conducteur courant, ni recopier une marque « jouée » provenant d'une autre séance. Pour un module entamé, proposer l'import des blocs restants sur la base de la progression, avec sélection manuelle et possibilité de réutiliser les références utiles. Une modification de la séance ne modifie pas automatiquement le modèle ; proposer un report explicite si le MJ souhaite capitaliser une amélioration. Les sessions historiques restent immuables quant à leur contenu passé.

Pour les donjons persistants (Fosse), maintenir le statut des salles, les créatures éliminées et les changements du monde indépendamment du modèle initial et des sessions. La prochaine séance peut donc viser une zone que les PJ choisissent sur place.

## 7. Ressources et improvisation

Les **53 ressources Trilemma** actuelles vivent dans le Catalogue sous un regroupement « Trilemma Adventures », présenté comme une collection au même niveau visuel qu'une campagne, mais sans progression narrative ni ordre de jeu obligatoire. Chaque aventure conserve son UUID d'origine, son titre/VO, résumé, tags, favori, PDF et liens ; le statut initial correspond à sa curation réelle. La collection ne devient pas une campagne à jouer intégralement. Les ressources d'origine différente pourront suivre la même règle.

Exemple de promotion : sélectionner TRI-040 — La Hantise de Hainsley Hall, cliquer « Intégrer », choisir « Scénario indépendant » ou « Ajouter à une campagne », nommer l'adaptation « Nuit au manoir de Blanchebois », définir son module et associer la quête Discord. Le PDF de TRI-040 reste la source, accessible depuis le module sans copie ni déplacement physique. L'entrée source peut rester trouvable dans Trilemma avec indication de son adaptation ; une aventure intégrée ne doit pas apparaître deux fois dans la vue opérationnelle. Conserver les anciens liens `pf2_resource_link` et fournir une correspondance des 53 UUID ; vérifier les adaptations déjà jouées, notamment TRI-007, avant de créer des modules.

Le contenu externe réellement retenu devient ainsi un scénario ou un module adapté comme les autres : **pas de second catalogue opérationnel concurrent**. À l'inverse, une carte, une illustration, une idée ou un scénario non retenu demeure une inspiration recherchable dans Catalogue. Un module peut être créé sans PDF, à partir d'une idée maison ; une piste RP peut être traitée sans imposer un module fictif. Prévoir une action « Créer un module maison rapide » depuis une quête ; celui-ci doit ensuite passer la même checklist (avec non-applicables).

Le Catalogue garde aussi les campagnes/scénarios non retenus et écartés. Filtres simples : Tout / Intégrés / Non décidés / Plus tard / Écartés, et type (campagne, aventure indépendante, collection d'inspirations). Les Bounties/Primes sont écartées par défaut, retrouvables via le filtre dédié, sans supprimer leurs PDF ni historiques. La vue opérationnelle Campagnes et scénarios ne liste que les intégrés, sans les dupliquer.

## 8. Cartographie initiale des quêtes ouvertes (constat et décisions MJ du 16/11)

Ce tableau est un cadrage initial du chantier, pas un registre runtime des votes ou de l'état des quêtes. Les liens effectifs et checklists seront maintenus dans SQLite. Les modules non confirmés ci-dessous sont des cibles à identifier ou créer ; ne pas les considérer comme déjà créés.

| Quête publique | Cible / nature MJ | État et travail restant |
| --- | --- | --- |
| Nuit au manoir de Blanchebois | Adaptation de **TRI-040 — La Hantise de Hainsley Hall** (The Haunting of Hainsley Hall, Trilemma, UUID 88e84168-4d85-41fa-975d-101fbab3004c) ; demande de Rinna à Brèchemont. Ce n'est pas Malevolence. | Ressource identifiée par sa concordance avec le défi d'une nuit au manoir ; confirmer le rattachement, adapter à PF2 et créer le modèle, préparer Foundry. |
| Pacte de la Route Ouverte | Campagne transverse `open-road` ; 1-00 joué le 12/11 ; prochaine mission 1-08 Révolution sur les rives, sous réserve des choix de continuité et des dépendances. | PDF EN et FR disponibles ; étudier, adapter l'impact politique, conducteur, personnages/rencontres et Foundry à préparer. |
| Explorer la Fosse | Les Sept Fléaux de Pointesable, niveau 1 et suites. | Le plus proche de prêt : grande base Foundry existante confirmée par le MJ ; vérifier salles persistantes, conséquences de l'évasion de Pépin/Neyla, petites corrections et conducteur flexible. Niveau 1 prévu pour PJ niv. 5, avertissement d'équilibrage sans supposer leur trajet. |
| Souterrain sous la citadelle des infernos | Âge des Cendres, suite d'Altaerein, Griffes Cendrées / Anneau d'Alséta. | Bonne base documentaire et ouverture jouée ; cartes/scènes et rencontres Foundry, conducteur de la suite à préparer. |
| Expédition vers les Terres détrempées | Piste d'Eryn, sans bloc jouable retenu. | Vide côté scénario lié ; souvenir d'un astrologue ou d'une personne perdue à retrouver, source à identifier ; *The Lost Legend* n'est pas validé comme ce scénario. Ne pas créer de faux lien. |
| L'hôtel des disparus | Agents d'Absalom, enquête/exploration de l'hôtel. | Scénario existant ; vérifier adaptation, liste de PNJ, conducteur et bloc Foundry de l'hôtel. Ancien déploiement de campagne ne prouve pas que cet hôtel est prêt. |
| Cartel du Sel | Campagne maison, suite de l'enquête Rue Rose dans les Flaques. | Idée générale et lore existants ; aucun module de suite défini. Écrire une mission concrète, puis préparer ses éléments. |
| Les Druides écoterroristes | Sentence d'Extinction, branche enquête sur l'ermitage et ses liens. | Beaucoup d'éléments disponibles ; séparer de la branche « aider le cirque » ; préparer suite de l'ermitage, fiche et Foundry. Distinguer les trois mouvances dans la vérité MJ. |
| Le Cirque des Merveilles | Sentence d'Extinction, branche soutien au cirque. | Une préparation d'Abberton existe et la séance du 3/11 a déjà été jouée ; identifier le prochain objectif distinct, préparer ce qui manque. Réservation de Nicolas au 16/11. |
| Veiller sur Pointesable | Les Sept Fléaux, toutes les intrigues locales hors de la Fosse. | Base importante mais objectifs à individualiser (enquêtes, PNJ, lieux) et à finaliser ; le rituel de Nualia peut être un module distinct relié. |
| Myojimo | Agents d'Absalom, fil futur. | Intentionnellement bloqué : aucun module autonome disponible aujourd'hui. Prévoir le déblocage narratif et une réponse crédible si les PJ enquêtent ; ne pas révéler l'impasse. |
| Disparition de la machine | Agents d'Absalom, indice transverse. | Piste à faire avancer avec la campagne, non résoluble comme quête autonome maintenant. Documenter le jalon de déblocage. |
| Rituel / héritage de Nualia | Les Sept Fléaux, rituel spécifique à Pointesable. | Source existante, conducteur, éventuelles scènes et éléments Foundry à préparer. |
| Le Roi Kobold | La Couronne du roi kobold ; modules existants, notamment « Les appels de Nid-du-Faucon ». | Vérifier cartes, choisir première mission, adapter niveau et entrée, préparer conducteur/Foundry. |
| Le mystérieux Corvan | Sujet RP / curiosité. | Pas de module jouable autonome ; notes RP et révélations au fil du jeu. |
| Les liens de sang | Quête personnelle de Yaz (Narek). | Progression transverse, notamment indices à Quantium le 12/11 ; préparer des jalons/indices ou modules dédiés au besoin, pas de scénario artificiel. |
| Archimage Geb, le nécromancien | Quête personnelle d'Eos. | Histoire personnelle, creator révélé à Quantium ; préparer les prochains jalons au besoin. Réservée par David au 16/11. |

## 9. Socle existant à réutiliser et points d'attention

Constats vérifiés sur le mini-PC le 16/11 :

- `pf2_catalogue_entity` porte entrées et arcs (ex. `open-road` sur plusieurs saisons). Le runtime V3 distingue Container, PlayableUnit, Component et CatalogueDocument. Les `playableComponents` existent, par exemple dix unités pour la Couronne du roi kobold ; couverture variable selon les campagnes. Ne pas reconstruire leurs identités sans nécessité.
- `pf2_scenario_dependency` permet déjà les dépendances requises/recommandées. `pf2_session_content` lie séance, scénario et composant ; étudier sa réutilisation pour le suivi des modules. Préserver les IDs/scénarios/composants, relations et liens historiques lors de la migration.
- `pf2_discord_quest` et `pf2_quest_ui` conservent le catalogue synchronisé ; `pf2_discord_quest_vote` les votes, `pf2_map_place_quest` les lieux. Il manque une liaison opérationnelle quête ↔ module et classification privée dans le modèle cible ; ne pas déduire cette liaison d'un lieu.
- `pf2_session_preparation` contient titre, campagne/scénario/séance, JSON étapes/blocs et révision optimiste. C'est le socle de l'éditeur modèle et du conducteur. Ajouter des modèles dédiés ou une distinction explicite modèle/instance, plutôt que dupliquer l'éditeur.
- `pf2_scenario_package` et `pf2_scenario_deployment` suivent import/déploiement sur Foundry ; ils ne suffisent pas à attester que le prochain module est prêt. L'état matériel doit pouvoir être validé par le MJ, en cohabitation avec la préparation manuelle de Foundry.
- `pf2_library_asset`, `pf2_resource`, `pf2_resource_file`, `pf2_resource_link` conservent sources et fichiers. Les ressources sont déjà rattachables à campagne, scénario ou composant. Une adaptation devient opérationnelle sans perdre ce lien.
- L'API de préparation manque actuellement d'authentification MJ centralisée (cf. guide). Les nouveaux types, prérequis, liens confidentiels, états et contenus MJ doivent rester techniquement protégés, et ne jamais être projetés dans les API/vues publiques ou messages Discord.

Références : [architecture](architecture.md), [données](donnees.md), [éditeur de séance](../../docs/pf2/session-preparations.md), [Discord](wiki-discord.md).

## 10. Ordre des travaux proposé

Sauvegarde initiale créée le 16/11 sur le mini-PC dans `/home/valou/services/backup-projet-choix-libre-20261116` : copie cohérente de `pf2.sqlite` (API SQLite backup, `quick_check=ok`), fichiers Markdown de travail, HEAD Git et diff local. Rafraîchir la sauvegarde de la base juste avant chaque migration réelle pour préserver les événements joués depuis. Les fichiers PDF n'ont pas besoin d'être recopiés tant qu'ils ne sont ni déplacés ni modifiés. Travailler sur une branche et une copie de la base, contrôler les mappings et les références, puis déployer et migrer après validation.

1. **Cadrage** — valider les termes, trois onglets, classification et checklist ; cartographier les 17 quêtes et les modules existants ; décider le sort du catalogue/ressources.
2. **Premier résultat utile** — onglet Choix libre en lecture du journal Discord, qualification et rattachements éditables côté MJ, affichage synthétique des manques. Aucun changement de lecture publique.
3. **Modèles et import** — réutiliser l'éditeur JSON ; lier module, modèle, version et session ; importer en plusieurs clics ; traiter les modules entamés et les références Foundry.
4. **Unifier la navigation et la curation** — Campagnes et scénarios (PFS inclus) = périmètre intégré ; Catalogue = référentiel complet incluant non décidés, plus tard, écartés, Trilemma et archives des Bounties. Migrer les statuts actuels : Sélectionné/En cours/Joué → intégré + progression conservée ; Retenu → non décidé sauf décision MJ contraire ; Plus tard/Écarté → conserver le motif. Vérifier les cas contradictoires et adaptations déjà jouées. Retirer la vue Journaux d'Absalom et ses dépendances dédiées après inventaire/sauvegarde. Conserver Personnages joueurs, Histoire et Monde. Faire migrer les données avec rapport et contrôles, sans destruction de contenu narratif ; permettre retour temporaire à l'ancienne vue.
5. **Préparation permanente** — compléter en priorité les prochains modules accessibles des campagnes actives (Fosse, Altaerein, hôtel/Agents, Route ouverte, Sentence d'Extinction, Pointesable), puis manoir et autres missions. Décider ou créer le contenu encore vide. Mettre à jour les checklists après chaque séance.

Critères de réussite : depuis une quête Discord réellement accessible, identifier en un écran le module et ce qui manque ; distinguer explicitement les pistes volontairement bloquées ; importer un modèle prêt dans une nouvelle séance sans préparation manuelle redondante ; préserver les anciennes séances, les références et les secrets ; ne plus dépendre d'un choix annoncé plusieurs jours avant. Les travaux ci-dessous sont autorisés et commencés.

## 11. Phase 1 — implémentation (16/11/2026)

Branche `feat/pf2-choix-libre`, worktree `/home/valou/services/lsr-choix-libre`. La production n'est pas migrée par cette étape.

- Migration additive `055-choice-libre` : associations privées par identifiant Discord, état et checklist par clé stable [scénario, composant], modèle JSON indépendant par module. Les historiques et PDF ne sont pas déplacés.
- Journal dans Préparation des séances : la synchro existante du bot (environ 5 minutes) reste la source de vérité ; toute nouvelle quête apparaît automatiquement à rattacher. Les réactions et l'annuaire des joueurs alimentent l'affichage optionnel. Une réaction appartient à un compte Discord, pas nécessairement à un PJ précis.
- Les quêtes bloquées et personnelles restent visibles. Les prochains modules sont choisis explicitement pour éviter une progression automatique erronée sur une campagne à embranchements.
- Modèles : copier une préparation enregistrée en modèle d'un module, puis importer ses étapes et blocs dans une séance (nouveaux identifiants, cases remises à zéro, source inchangée). Une préparation/import ne valide pas automatiquement Foundry.
- Trilemma : les 53 ressources gardent leurs UUID et fichiers ; elles sont proposées comme sources d'adaptation dans le sélecteur, regroupées par origine. Blanchebois pointe vers TRI-040. L'onglet Catalogue pointe vers les ressources et les éléments mis de côté.
- Renommage du Journal MJ en Campagnes et scénarios. Retrait de la navigation et redirection de l'ancienne page Journaux d'Absalom, distincte des journaux narratifs publiés par Discord.
- Protection : endpoint dédié refusant tout accès sans `PF2_CHOICE_MJ_KEY` configurée ; saisie de la clé MJ en session navigateur. Avant ouverture en production, configurer cette clé côté serveur et vérifier le périmètre d'accès de l'outil historique de séances, qui ne bénéficie pas encore de cette protection.

Essai sur copie réelle du 16/11 : intégrité SQLite OK, 17 quêtes ouvertes (launcher exclu), 41 réactions, 10 modules associés sans référence cassée, 461 modules proposés (y compris adaptations), 0 présumé prêt. Les autres quêtes restent classées selon le contexte et demandent un choix ou un contenu. La migration incrémentale applique une sauvegarde automatique avant modification de la base.

### Reste à faire

- Unifier physiquement le catalogue et les ressources, simplifier la curation et les statuts, conserver les historiques et les documents partagés ; les anciennes structures restent en place pendant la transition, sans perte de données.
- Intégrer les campagnes maison, créer leurs modules et traiter la source inconnue des terres détrempées.
- Relier l'avancement réel et les historiques aux modules sans inférer qu'un module entamé est entièrement joué. Définir éventuellement des suites ordonnées par arc et des prérequis.
- Compléter les checklists et préparer les vrais modèles/Foundry des missions ouvertes ; ce chantier est majoritairement du travail de MJ.
- Refactoriser la page Histoire séparément (hors de cette phase).
