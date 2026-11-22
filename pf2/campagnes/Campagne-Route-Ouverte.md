# Campagne transverse — La Route ouverte (PFS)
 
[← Index des campagnes](../../CAMPAGNES.md) · [Scénario d'ouverture 1-00](Scenario-Origines-Route-Ouverte.md) · [Labyrinthe de Narven](../univers/Labyrinthe-et-portails.md) · [Yaz Lorok](../pj/PJ-Yaz-Lorok.md)

> **Statut au 21 novembre 2026 : `1-00` et `1-21` joués (ce dernier sous forme allégée), six futurs modules préparés dans SQLite et leurs scènes tactiques dans Foundry (audit du 22 novembre).** Le contenu ci-dessous est une continuité MJ : ne pas confondre préparation, canon PFS et événement vécu par les joueurs.

## Concept et périmètre

**Identifiant du catalogue : `open-road` ; nom runtime : « La Route ouverte ».** Le regroupement principal rassemble **8 scénarios** des saisons PFS 1 et 2. Ce n'est **pas** un arc unique publié par Paizo : c'est un regroupement **éditorial de table ouverte** de deux fils narratifs reliés :

1. **Le Pacte de la Route ouverte** : une expédition oubliée de Durvin Gest, Selmius Foster, Gregaro Voth et Kerinha Napsunar et la promesse de ne pas s'entre-tuer pour un trésor du Mwangi.
2. **Le Labyrinthe de Narven**, futur Labyrinthe de la Route ouverte : ancien réseau de passages et de portails magiques, progressivement reconnu puis restauré. Les étapes d'exploration et de réouverture ne sont pas la même aventure que la découverte initiale du Pacte.

La **saison 1** est intitulée « Année de la Route ouverte » ; elle demeure un **conteneur de saison**, pas un substitut à cette campagne transverse. Les scénarios indépendants des saisons PFS conservent leur propre continuité.

### Ordre de campagne retenu le 21 novembre 2026

| Ordre | Scénario | Situation |
| --- | --- | --- |
| 1 | `1-00` Origines de la Route ouverte | Joué |
| 2 | `1-21` Mistress of the Maze | Joué, forme allégée |
| 3 | `1-08` Révolution sur les rives | À jouer |
| 4 | `1-11` Flammes de la rébellion | À jouer |
| 5 | `1-16` Couronne pérenne I — L'Opale de Bhopan | À jouer |
| 6 | `1-17` Couronne pérenne II — Le Monarque épineux | À jouer |
| 7 | `1-20` La Légende perdue | À jouer |
| 8 | `2-00` Le Roi épineux | Conclusion |

Les scénarios `3-99` Fate in the Future, `5-01` Intro: Year of Unfettered Exploration, `5-06` Ukuja, the First Wall, `5-12` Mischief in the Maze et `5-13` Thick as Thieves sont des **pistes facultatives post-campagne**. Ils restent dans le catalogue et ne sont pas des étapes obligatoires. En particulier, 5-12 peut relancer le Labyrinthe si cela sert la continuité, sans relativiser l'aboutissement de 2-00.

La table `pf2_catalogue_entity` reste la source des rattachements et de la curation ; **ne pas maintenir une seconde liste d'états de scénario dans ce fichier**.

## Ordre narratif et distinctions utiles

- **`1-00` — *Origin of the Open Road*** : à **Quantium**, capitale du Nex. La mission officielle vise à reconstituer quatre archives des débuts de la Société à la **Maison du Nexus**. Le Pacte émerge d'une référence croisée puis d'un folio volé : **les PJ ne connaissent pas le Pacte au départ**.
- **`1-20` — *The Lost Legend*** : piste ultérieure vers le lieu du Pacte dans l'Étendue du Mwangi, à distinguer du réseau de portails.
- **`1-21` — *Mistress of the Maze*** : mission liée à l'état du Labyrinthe. **Adaptation MJ réalisée :** exploration placée en deuxième, liaison actuellement accessible **Absalom ↔ Pointesable** plutôt que la destination originale **Lisière / Woodsedge (Galt)**. Magnimar reste une piste ultérieure. Ce n'est ni Quantium ni une conséquence immédiate de `1-00`.
- **`2-00` — *The King in Thorns*** : suite structurante à la fois pour l'intrigue du Pacte et le rôle futur du réseau et de la Loge de la Route ouverte.
- **Saisons suivantes** : montée en puissance de l'exploitation du réseau, sans supposer que chaque trajet soit instantané ni que chaque portail soit sûr.

**Continuité tranchée par le MJ :** `1-00` puis `1-21` ont été joués. La première liaison actuellement accessible est Pointesable ; les autres connexions ne sont pas automatiquement ouvertes. La prochaine quête est `1-08`. Le final `2-00` relie la nouvelle loge au Labyrinthe ; dans notre lore, le demi-plan apporte l'énergie stabilisatrice. La suite doit rester progressive. Voir [la fiche du Labyrinthe](../univers/Labyrinthe-et-portails.md) pour les choix de terminologie, les risques, Rindle, Nevashi et les conséquences sur Pointesable et l'Anneau d'Alséta.

## Ouverture préparée — `1-00` et Yaz à Quantium

**Préparation enregistrée dans le Journal MJ le 12 novembre 2026 :** `fa2d18bd-32b1-48cf-904e-9873691a55eb`, liée à la campagne `open-road` et au scénario `pfs-season-1-1-00`. **Scénario joué depuis, détails de résolution à consigner séparément.** Plage habituelle 19 h–23 h.

1. **19 h–19 h 30 — Grande Loge d'Absalom** : première rencontre avec **Ambrus Valsin** (PNJ métier `npc_ambrus_valsin`). Il donne **directement à l'oral** les quatre objectifs documentaires et remet le saphir codé destiné à Sebnet ; **aucune seconde lettre de briefing n'est nécessaire**. Le voyage vers Quantium suit en ellipse.
2. **19 h 30–20 h 30 — Ancienne académie de Yaz** : enquête personnelle prioritaire de **Yaz Lorok** auprès de **maître Uxir** (`npc_maitre_uxir`). Les circonstances du rituel et du frère disparu restent ouvertes aux décisions de jeu ; la vérité MJ sur le demi-plan de Larantis demeure secrète. [Fiche de Yaz](../pj/PJ-Yaz-Lorok.md).
3. **20 h 30–21 h 15 — Maison du Nexus** : rencontre de **Sebnet Sanserkoht** (`npc_sebnet_sanserkoht`), diplomatie, archives et apparition de la référence au Pacte ; l'orrerie est traitée narrativement pour l'instant.
4. **21 h 15–21 h 45 — Enquête dans Quantium** : indices liés au vol des ouvrages, ancien archiviste **Igrigi Lokar**, piste des alchimistes et de **Les Remèdes de l'Espoir**.
5. **21 h 45–23 h — Égouts** : exploration B1–B5, affrontement et récupération éventuelle du folio. Le final peut basculer sur la séance suivante sans forcer le rythme.

**Fourchette des quatre archives explicitement demandées :** récits de Durvin Gest au Mwangi ; manifeste d'épices de Selmius Foster ; permis d'Adolphus sur la fondation de la Maison du Nexus ; récits de Kerinha Napsunar. **Le Pacte n'est pas un cinquième objectif connu au briefing.** Le **briefing oral d'Ambrus** est l'adaptation MJ ; la lettre de Kreighton Shaine dans le PDF reste une aide de jeu originale distincte, non indispensable à notre préparation. La description et les courts textes de lecture des quatre documents, **ainsi que le texte intégral à lire aux joueurs lorsqu'ils récupèrent le Pacte en B5**, sont dans [la fiche du scénario](Scenario-Origines-Route-Ouverte.md). Le texte du Pacte est une **reconstitution MJ pour la table** : le PDF original décrit le contenu du folio, sans en reproduire la lettre. Le retour auprès de Sebnet permet de le copier, puis l'énigme de la porte au Mwangi lance la suite de la campagne.

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

### 1-08 — Révolution sur les rives (21 novembre 2026)

Foundry `test-pf2` connecté. Ancien rangement MJ, désormais sous La Route ouverte à la racine de chacun des trois onglets (voir dernière passe du 22/11) :

| Zone | Scène | Journal MJ |
| --- | --- | --- |
| A — Ancienne loge | `Scene.CFJ43V5mzoCUkXTQ` | `JournalEntry.SAxCR2o8s9B1nPHN` |
| B — Camp des rebelles | `Scene.Q9RG1YjlisqmiJQQ` | `JournalEntry.Gla5icGuQgBcCG1L` |
| C — Installations hydrauliques | `Scene.ZkJI76ZusTeykCiS` | `JournalEntry.AkjsjXff4TrCnW7o` |
| D — Salle du trône | `Scene.qTDCo3Q0psGhw88E` | `JournalEntry.RdY25eiLaJzIjKNP` |

Quatre cartes du PDF original, grilles, murs et porte secrète, notes MJ privées ; 10 fiches officielles des adversaires (palier 3–4) et 5 PNJ sociaux, 1 danger de marais, 6 conteneurs de butin masqués, liés et verrouillés. 10 journaux (dont les deux aides de jeu traduites, privées jusqu'à remise) et 24 tokens au total. Les documents de Napsunar et Pavo ouvrent la piste andoranaise indépendamment du choix politique. Les scènes et fiches ont été relues via le relais ; le modèle SQLite renvoie aux UUID correspondants. Ne pas déclencher d'emblée le combat du camp, des canaux ni du trône : négociation prioritaire possible.

Audit du rangement le 21/11 : les trois dossiers 1-08 existent mais sont vides ; les 36 documents (4 scènes, 22 Actors, 10 journaux) sont à la racine. Les six Actors de butin portent à tort des flags Age des Cendres, mais leurs tokens et inventaires prouvent leur appartenance à Artume. Le plan est de remonter les trois dossiers La Route ouverte à la racine des onglets et de rattacher les documents sans modifier leurs UUID ; conserver le Labyrinthe et les notes des Origines. Les deux anciennes scènes 1-00 n'ont pas été retrouvées, ne pas les recréer à l'occasion du rangement. Aucune modification Foundry effectuée pendant cet audit.

Reste à vérifier sur le canvas : ouvertures, lignes de vue, positions et déplacements ; adapter le nombre de créatures aux PJ présents (annexes originales) et compléter les portraits génériques des PNJ si souhaité. Les montants des lots de trésor PFS restent à adapter à la table. Checklist Foundry : **partiel** ; progression : **Non joué**. Aucun autre scénario n'a été modifié lors de cette passe.

### Audit des préparations (22 novembre 2026)

- Les six scénarios à venir restent chacun un seul module de préparation (clé logique scénario + composant vide) : 1-08, 1-11, 1-16, 1-17, 1-20 et 2-00. Les modèles ont été enrichis et relus dans SQLite ; les checklists et le champ « Reste à faire » contiennent désormais l'état de chaque module. Préserver les quatre modules déjà joués (1-00 : trois composants, 1-21 : module unique).
- 1-08 : rangement confirmé sous La Route ouverte à la racine des trois onglets. **Quatre journaux de carte A–D et quatre journaux RP révisés**, quinze Actors contextualisés (notes privées « Comment le jouer (MJ) » et « Se souvenir »), liens aux coffres, indices et passages, anciennes notes maintenues en référence. Deux aides de jeu préservées. Les 24 tokens et murs n'ont pas été déplacés. Le palier reste 3–4 à adapter ; aucun test de combat ou de canvas en client. Portraits manquants : Smine, Aula, Chops, Harsus, Sovella, Karyn, rebelles/gardes.
- **Propositions MJ non validées** : Chops intercepte des étrangers qui ont repéré son camp, ne leur révèle pas spontanément tout le complot, puis cherche à garantir leur discrétion. La rencontre avec Nalla est une proposition et non une obligation ; le scénario publié reste en référence. Ne pas présenter la Fille dorée comme un nouveau fil de quête (mention historique facultative). Le journal de Pavo est indépendant de la solution politique.
- Cinq journaux centraux privés créés sous les sous-dossiers correspondants : 1-11 `JournalEntry.ENr5ywP6mWbmClIr` (mandat, archives et pacte infernal) ; 1-16 `JournalEntry.gmvy8BuAVCoX52xV` (coutumes, enquête Selmius, bal) ; 1-17 `JournalEntry.x9g9HRB3gelZA8iZ` (Audho, poursuite) ; 1-20 `JournalEntry.PirWEsPyxt2N3Blh` (voyage, Defaka, décodeur) ; 2-00 `JournalEntry.fg3sHXuoUVidkbcq` (expédition, rituel H1/H2). Quatorze pages privées et références aux pages dans les conducteurs, UUID relus via Relay. Ces journaux centraux restent en référence ; les scènes tactiques, notes et Actors ont été ajoutés dans la passe suivante. Aucun statut Foundry « terminé » avant test en client.
- 2-00 : conserver un module unique par défaut, mais valider la compression du spécial pour quatre heures ; les DD originaux palier 7–8 ne sont pas les valeurs d'une adaptation à un autre groupe. Aucun scénario futur n'est marqué joué.

### Passe Foundry complète — 22 novembre 2026

Les six futurs scénarios ont un module unique non joué (0/1). Les deux scénarios déjà joués sont inchangés. Les modèles sont reliés aux UUID des cartes et journaux privés, avec un champ « Reste à faire » propre à chaque module. Le niveau et l’effectif réels des PJ sont encore à fixer.

| Scénario | Scènes | Actors (coffres inclus) | Coffres | Journaux | Tokens | Murs |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1-08 | 4 | 22 | 6 | 10 | 24 | 104 |
| 1-11 | 6 | 18 | 6 | 7 | 31 | 368 |
| 1-16 | 3 | 7 | 1 | 4 | 10 | 270 |
| 1-17 | 3 | 7 | 2 | 4 | 11 | 88 |
| 1-20 | 3 | 9 | 3 | 4 | 12 | 0 |
| 2-00 | 7 | 17 | 0 | 8 | 20 | 0 |

**Vérification par REST Relay :** 26 cartes, 80 Actors (dont 18 coffres), 37 journaux, 108 tokens, 830 segments de murs. Chaque scène a sa note MJ ancrée vers la page correcte ; les cartes existent en fichier, padding nul, noms de tokens affichés au survol, coffres masqués/liés et propriété par défaut 0. Le contrôle des références et dossiers ne remonte plus d’anomalie. Les cartes des cinq nouveaux scénarios sont les illustrations du PDF reconstruites sans annotations de placement MJ. Les huit cartes d’intérieur ont des murs de limite générés sur grille (726 segments) ; contrôler portes, escaliers, plateformes, géométrie et lumière sur le canvas. Les autres cartes de plein air restent ouvertes ; les ponts de l’Insubmersible et les falaises nécessitent une décision de circulation si utile.

Les portraits de créatures officiels disponibles ont été associés à 15 Actors et leurs tokens, dont Qxal final ; 17 illustrations ont été ajoutées aux pages centrales (Thalia, Kerinha, Blackthane, Webhekiz, Couronne, Voth et contacts de l’expédition). Nalla/Edryd déjà illustrés. Ne pas substituer d’illustration trompeuse aux PNJ non représentés.

#### Scènes et notes privées à réutiliser

| Scénario / zone | Scène | Journal MJ |
| --- | --- | --- |
| 1-11 / A | `Scene.QYw9D2tegLB0xPQE` | `JournalEntry.mXEpD2HfBZwvwGrM` |
| 1-11 / B1 | `Scene.0FOFMGfs1AClxfnW` | `JournalEntry.iCNFVa2oJWS5worw` |
| 1-11 / B2 | `Scene.ruFB5D4JWzTd5kqZ` | `JournalEntry.OdPBtDwEnwGtQicv` |
| 1-11 / B3 | `Scene.tOkhJqWI2170Z1Pi` | `JournalEntry.DoH7foRD6v0ObiUb` |
| 1-11 / B4 | `Scene.ePig2woaOALOsZZ4` | `JournalEntry.3mrZpQOSKADUGkHj` |
| 1-11 / B5 | `Scene.R702iqMrG2SDzU3d` | `JournalEntry.myQtAvgndDKLlKJd` |
| 1-16 / A | `Scene.46gIvEuTYPJoAldL` | `JournalEntry.bCdiTl4N2mrfkigu` |
| 1-16 / B | `Scene.9Id8I1s5GaZ4Cgaz` | `JournalEntry.FnqJBvN1WWRDoOAs` |
| 1-16 / C | `Scene.ZoaT3yhOvzl6bgpC` | `JournalEntry.3s3G3c4XrHvEYami` |
| 1-17 / A | `Scene.poLX8ZUNF4Dpr28Q` | `JournalEntry.6dzk98WmSsrbVc5V` |
| 1-17 / B | `Scene.KyQXDKjoSJcnhLiw` | `JournalEntry.Z0kMA0u4NQZvdILY` |
| 1-17 / C | `Scene.6Ta6MEydN6wS66TU` | `JournalEntry.0Ow0sA2aSTxIhz5u` |
| 1-20 / A | `Scene.6ck4ph2XDIeYsFGw` | `JournalEntry.RJxpGd9ooZKdArhO` |
| 1-20 / B | `Scene.JLnxMY3vTxyvJkGo` | `JournalEntry.QT3CzacZkggfz1ri` |
| 1-20 / C | `Scene.tdWR6f7ygb8yLLHs` | `JournalEntry.BmEg3rxQaa5vYjVY` |
| 2-00 / A | `Scene.ysS6yUUsZsg2e9B4` | `JournalEntry.g94V4D1VVpLaVJkX` |
| 2-00 / B | `Scene.p2qmomVr800tvT2s` | `JournalEntry.5ZndwOIwNA2oWqj5` |
| 2-00 / C | `Scene.MVXmPtUjKCHfWAtk` | `JournalEntry.GqUmEBrargjiQJHN` |
| 2-00 / D | `Scene.pgblI5ApKv7jdhiH` | `JournalEntry.b0VpXGJIXpaXsdoo` |
| 2-00 / F | `Scene.pxYld35dYrYvbjyC` | `JournalEntry.tYPZeNI6oN5CgLNa` |
| 2-00 / I | `Scene.m2jrnR3pXHGaVodY` | `JournalEntry.ruL1376RZ7C5UIfL` |
| 2-00 / J | `Scene.L0nyoisTbkQddK6e` | `JournalEntry.PBj9xKG0joYLFyza` |

**À terminer avant validation :** test en client GM des déplacements, visibilité, attaques, sorts, dangers et interactions de coffre ; équilibrage selon effectif/niveau ; portraits manquants et partage des aides de jeu. Les lots de richesse PFS demandent conversion ; le parchemin de nuage nauséabond en 1-20 est pour l’instant narratif. Les vagues distinctes (Bhopan, finale I) et les apparitions conditionnelles doivent être déclenchées au bon moment. 2-00 reste une adaptation d’un spécial multitable (palier 7–8 source), G1/G2 facultatifs, réutilisation de cartes, le nombre de scènes à jouer et la durée devront être confirmés. Les six checklists sont à 2/5 : source et modèle validés, entités/Foundry/relecture partiels jusqu’aux tests. Les documents liés sont privés et aucun résultat de scénario n’est pré-écrit comme joué.

## Sources et niveaux de certitude

- **Faits publiés** : PDFs français de travail et original anglais de *PFS 1-00*, bibliothèque privée `pf2-data` (pas sur GitHub) ; `PFS 1-21` pour le Labyrinthe.
- **Décisions MJ documentées** : nom initial Labyrinthe de Narven, première liaison vers Pointesable, Magnimar comme destination ultérieure potentielle, trois écoles comme pôles majeurs, ordre prévu de la quête de Yaz avant le scénario.
- **Données actuelles** : SQLite (`open-road`, séances, PNJ et préparations), Foundry pour les scènes/Actors.
- **Joué selon le MJ** : `1-00` et `1-21`, celui-ci sous une forme allégée. Détails précis du déroulement et choix de Yaz non consignés ici ; ne pas inventer.
- **Modèles de préparation** : six nouveaux modèles SQLite, un par scénario futur, avec récapitulatif, cinq étapes 19 h–23 h, PNJ, rencontres, indices, secrets, butins et transitions. Sources originales disponibles (1-16 et 1-17 en anglais). Les six modèles sont enregistrés ; les scènes et notes Foundry sont importées et référencées ; les tests en client, l’équilibrage et les ajustements finaux restent à effectuer. `2-00` est un spécial multi-tables ; PDF disponible palier 7–8, donc adapter à la table et au niveau effectif. Réévaluer les rencontres si les PJ sont trop faibles.
