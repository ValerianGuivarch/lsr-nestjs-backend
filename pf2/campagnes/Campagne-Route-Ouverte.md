# Campagne transverse — La Route ouverte (PFS)
 
[← Index des campagnes](../../CAMPAGNES.md) · [Scénario d'ouverture 1-00](Scenario-Origines-Route-Ouverte.md) · [Labyrinthe de Narven](../univers/Labyrinthe-et-portails.md) · [Yaz Lorok](../pj/PJ-Yaz-Lorok.md)

> **Statut au 12 novembre 2026 : campagne transverse présente dans SQLite, préparation de l'ouverture en cours, aucune partie de `1-00` attestée comme jouée.** Le contenu ci-dessous est une continuité MJ : ne pas confondre préparation, canon PFS et événement vécu par les joueurs.

## Concept et périmètre

**Identifiant du catalogue : `open-road` ; nom runtime : « La Route ouverte ».** Le regroupement rassemble **13 scénarios**, répartis entre les saisons PFS 1, 2, 3 et 5. Ce n'est **pas** un arc unique publié par Paizo : c'est un regroupement **éditorial de table ouverte** de deux fils narratifs reliés :

1. **Le Pacte de la Route ouverte** : une expédition oubliée de Durvin Gest, Selmius Foster, Gregaro Voth et Kerinha Napsunar et la promesse de ne pas s'entre-tuer pour un trésor du Mwangi.
2. **Le Labyrinthe de Narven**, futur Labyrinthe de la Route ouverte : ancien réseau de passages et de portails magiques, progressivement reconnu puis restauré. Les étapes d'exploration et de réouverture ne sont pas la même aventure que la découverte initiale du Pacte.

La **saison 1** est intitulée « Année de la Route ouverte » ; elle demeure un **conteneur de saison**, pas un substitut à cette campagne transverse. Les scénarios indépendants des saisons PFS conservent leur propre continuité.

### Liste de rattachement — données métier à vérifier dans SQLite

| Saison | Références actuellement regroupées |
| --- | --- |
| 1 | `1-00` *Origin of the Open Road* ; `1-08` *Revolution on the Riverside* ; `1-11` *Flames of Rebellion* ; `1-16` et `1-17` *The Perennial Crown* ; `1-20` *The Lost Legend* ; `1-21` *Mistress of the Maze* |
| 2 | `2-00` *The King in Thorns* |
| 3 | `3-99` *Fate in the Future* |
| 5 | `5-01` *Intro: Year of Unfettered Exploration* ; `5-06` *Ukuja, the First Wall* ; `5-12` *Mischief in the Maze* ; `5-13` *Thick as Thieves* |

La table `pf2_catalogue_entity` reste la source des rattachements et de la curation ; **ne pas maintenir une seconde liste d'états de scénario dans ce fichier**.

## Ordre narratif et distinctions utiles

- **`1-00` — *Origin of the Open Road*** : à **Quantium**, capitale du Nex. La mission officielle vise à reconstituer quatre archives des débuts de la Société à la **Maison du Nexus**. Le Pacte émerge d'une référence croisée puis d'un folio volé : **les PJ ne connaissent pas le Pacte au départ**.
- **`1-20` — *The Lost Legend*** : piste ultérieure vers le lieu du Pacte dans l'Étendue du Mwangi, à distinguer du réseau de portails.
- **`1-21` — *Mistress of the Maze*** : mission liée à l'état du Labyrinthe. **Adaptation MJ déjà retenue :** placer cette exploration très tôt dans notre chronologie et, à terme, privilégier une première liaison **Absalom ↔ Magnimar / Manoir Heidmarch** plutôt que la destination originale **Lisière / Woodsedge (Galt)**. Ce n'est ni Quantium ni une conséquence immédiate de `1-00`.
- **`2-00` — *The King in Thorns*** : suite structurante à la fois pour l'intrigue du Pacte et le rôle futur du réseau et de la Loge de la Route ouverte.
- **Saisons suivantes** : montée en puissance de l'exploitation du réseau, sans supposer que chaque trajet soit instantané ni que chaque portail soit sûr.

**Point de continuité non tranché :** le catalogue classe `1-00` en premier, tandis que la fiche d'univers proposait `1-21` comme première aventure du Labyrinthe. Ce sont deux ordres de jeu possibles ; ne pas transformer l'une des préparations en fait joué. Voir [la fiche du Labyrinthe](../univers/Labyrinthe-et-portails.md) pour les choix de terminologie, les risques, Rindle, Nevashi et les conséquences sur Pointesable et l'Anneau d'Alséta.

## Ouverture préparée — `1-00` et Yaz à Quantium

**Préparation enregistrée dans le Journal MJ le 12 novembre 2026 :** `fa2d18bd-32b1-48cf-904e-9873691a55eb`, liée à la campagne `open-road` et au scénario `pfs-season-1-1-00`. **Non jouée.** Plage habituelle 19 h–23 h.

1. **19 h–19 h 30 — Grande Loge d'Absalom** : première rencontre avec **Ambrus Valsin** (PNJ métier `npc_ambrus_valsin`). Il donne **directement à l'oral** les quatre objectifs documentaires et remet le saphir codé destiné à Sebnet ; **aucune seconde lettre de briefing n'est nécessaire**. Le voyage vers Quantium suit en ellipse.
2. **19 h 30–20 h 30 — Ancienne académie de Yaz** : enquête personnelle prioritaire de **Yaz Lorok** auprès de **maître Uxir** (`npc_maitre_uxir`). Les circonstances du rituel et du frère disparu restent ouvertes aux décisions de jeu ; la vérité MJ sur le demi-plan de Larantis demeure secrète. [Fiche de Yaz](../pj/PJ-Yaz-Lorok.md).
3. **20 h 30–21 h 15 — Maison du Nexus** : rencontre de **Sebnet Sanserkoht** (`npc_sebnet_sanserkoht`), diplomatie, archives et apparition de la référence au Pacte ; l'orrerie est traitée narrativement pour l'instant.
4. **21 h 15–21 h 45 — Enquête dans Quantium** : indices liés au vol des ouvrages, ancien archiviste **Igrigi Lokar**, piste des alchimistes et de **Wishful Cures**.
5. **21 h 45–23 h — Égouts** : exploration B1–B5, affrontement et récupération éventuelle du folio. Le final peut basculer sur la séance suivante sans forcer le rythme.

**Fourchette des quatre archives explicitement demandées :** récits de Durvin Gest au Mwangi ; manifeste d'épices de Selmius Foster ; permis d'Adolphus sur la fondation de la Maison du Nexus ; récits de Kerinha Napsunar. **Le Pacte n'est pas un cinquième objectif connu au briefing.** Le **briefing oral d'Ambrus** est l'adaptation MJ ; la lettre de Kreighton Shaine dans le PDF reste une aide de jeu originale distincte, non indispensable à notre préparation. La description et les courts textes de lecture des quatre documents sont dans [la fiche du scénario](Scenario-Origines-Route-Ouverte.md).

### Continuité des trois académies — choix de campagne

Trois pôles majeurs de formation magique **dans notre lore**, sans prétendre à une hiérarchie académique canonique :
- **Arcanamirium, Absalom** : enseignement formel, théorie arcane, réseaux cosmopolites, discipline et débouchés institutionnels.
- **Magaambya, Nantambu (Mwangi)** : magie tournée vers le monde vivant, responsabilité communautaire, transmission et équilibre, notamment dans *La Force des milliers*.
- **Académie de Quantium, Nex** : nom de travail pour **l'établissement particulier fréquenté par Yaz et son frère parmi les nombreux établissements de Quantium** ; recherche expérimentale, alchimie, magie appliquée et pratiques novatrices (formation de magus). Sa dénomination propre exacte reste à fixer plutôt que d'inventer un titre officiel.

**Maître Uxir**, homme-lézard et ancien professeur de magus, a déjà une fiche PNJ métier et un portrait privé. **Décision MJ du 12 novembre : Yaz et Narek Lorok ont étudié une première année à la Magaambya de Nantambu (Mwangi), puis une deuxième année à Quantium.** Yaz n'a pas réussi à devenir magus. Uxir a secrètement enquêté au Mwangi après le drame ; il révélera à Yaz l'extrême maîtrise et l'assiduité de Narek à la Magaambya, opposées à ses résultats inégaux à Quantium. La provenance de son pouvoir demeure mystérieuse. Ce récit et le témoignage sur les six mois de sommeil restent un cadre **non encore joué** ; ne pas dévoiler le projet secret de patron ou le demi-plan de Larantis.

## Préparation Foundry ciblée

Le monde est `test-pf2`. Scènes préparées le 11 novembre : archives `Scene.eYxhjbWrCqWtLtO7` et égouts `Scene.Dtg1CvduJ1cIxccD`. **Priorité donnée aux égouts ; ne pas étendre la carte de l'orrerie maintenant.**

Le 12 novembre, le relais REST était joignable mais **son client Foundry du monde `test-pf2` apparaissait hors ligne** : aucun Actor, coffre, mur ni token n'a pu être ajouté ni vérifié en direct. Il faudra reprendre **uniquement par le relais ou l'interface Foundry reconnectée**, jamais par écriture directe LevelDB ni hook temporaire.

Voir la [fiche du scénario 1-00](Scenario-Origines-Route-Ouverte.md) pour les salles, menaces, butins et placements prévus. Pour les conventions transverses (journal de salle, coffres invisibles MJ, noms de tokens non-spoilants), voir [Foundry](../outils/foundry.md) et le [guide de préparation de séance](../../docs/pf2/session-preparations.md).

## Sources et niveaux de certitude

- **Faits publiés** : PDFs français de travail et original anglais de *PFS 1-00*, bibliothèque privée `pf2-data` (pas sur GitHub) ; `PFS 1-21` pour le Labyrinthe.
- **Décisions MJ documentées** : nom initial Labyrinthe de Narven, remplacement Lisière par Magnimar, liens avec Pointesable, trois écoles comme pôles majeurs, ordre prévu de la quête de Yaz avant le scénario.
- **Données actuelles** : SQLite (`open-road`, séances, PNJ et préparations), Foundry pour les scènes/Actors.
- **Non établi comme joué** : les scènes décrites ici, le déroulement réel de l'enquête, les choix de Yaz, la résolution du Pacte et du final des égouts.
