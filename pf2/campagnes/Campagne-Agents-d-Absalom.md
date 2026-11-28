# Agents d'Absalom — suivi de campagne

[← Index des campagnes](../../CAMPAGNES.md) · [Absalom et ses institutions](../univers/Absalom.md) · [Fronts transverses](Fronts-de-campagne.md)

> **Statut : adaptation fortement condensée en cours.** La campagne publiée n'est plus destinée à être jouée telle quelle. La continuité maison est un **mini-arc autonome du Festival Radieux** en deux séances, sans Quatuor du Crépuscule.

## État runtime — restructuration du 21 novembre 2026

La base de données a été réorganisée pour repartir sur une version courte propre :

- **Agents d’Absalom — version originale** (`agents-of-edgewatch-original`) conserve l’intégralité de la structure publiée, les six aventures et les anciens identifiants de scénarios. Elle est **écartée / non sélectionnée** dans la curation.
- Les anciens identifiants de scénarios (`agents-of-edgewatch-adventure-1` à `-6`) restent attachés à cette version originale afin de préserver les références techniques et les contenus Foundry existants.
- La campagne active `agents-of-edgewatch` est renommée **Agents d’Absalom — Festival Radieux**.
- Elle ne comporte plus que deux groupes narratifs :
  1. **Avant le Festival** (`agents-of-edgewatch-before-festival`) ;
  2. **Festival Radieux** (`agents-of-edgewatch-radiant-festival`).
- Les cinq premiers modules déjà joués ont été recopiés dans **Avant le Festival** et restent marqués joués dans la curation.
- L'ancien module **L’hôtel des meurtres** est conservé seulement dans l'archive. Le module provisoire **Enquête sur l’hôtel** a été supprimé le 27 novembre ; son enjeu est absorbé par le mini-arc, avec résolution au Palais des rêves en partie 2.
- Le groupe **Festival Radieux** comporte désormais deux modules jouables, **Festival Radieux — Partie 1** et **Festival Radieux — Partie 2**, avec modèles enregistrés en SQLite. Les cinq modules joués ne sont pas modifiés.
- Un export de sauvegarde du catalogue avant transformation est conservé sur le mini-PC dans `/home/valou/services/pf2-data/_AI/catalogue-backups/agents-of-edgewatch-before-radiant-short-20261121.json`.

## Cadre

*Agents d'Absalom* fournit le matériau de base autour d'Absalom pendant le **Festival Radieux de 4720**, de la garde de la Falaise, de Hendrid Pratchett, du Ratisseur de tombes et du Quatuor du Crépuscule.

Le matériau publié sert désormais surtout de **réservoir de scènes, factions et révélations**, sans obligation de suivre la progression niveaux 1–20.

## Décision structurante — mini-arc autonome du Festival Radieux

La continuité abandonne désormais **entièrement le Quatuor du Crépuscule pour ce mini-arc**. Aucun membre du Quatuor n'est à l'origine des événements, ne manipule Pratchett et n'a besoin d'être révélé ou suggéré.

La campagne publiée sert uniquement de réservoir de scènes, lieux, PNJ et idées. Le mini-arc du Festival doit fonctionner et se conclure **entièrement avec Hendrid Pratchett comme mastermind**.

Éléments à intégrer :
- incidents de sécurité pendant le Festival ;
- sabotage / poison touchant un spectacle de cirque ou une ménagerie ;
- disparition puis réapparition du **Ratisseur de tombes** ;
- action liée au contrôle ou à la manipulation de l'information ;
- reprise des disparitions de visiteurs ;
- **Palais des rêves** et confrontation finale avec **Hendrid Pratchett**.

Le mini-arc est désormais prévu en **deux séances de quatre heures**, du 1er au 11 puis du 12 au 21 Kuthona.

## Adaptation MJ — Pratchett comme auteur central du mini-arc

### Principe

**Hendrid Pratchett** devient le principal antagoniste du mini-arc du Festival.

Il reste :
- propriétaire du **Palais des rêves** ;
- tueur en série ;
- fanatique de **Norgorber** ;
- principalement attiré par l'aspect du **Père Écorcheur**.

Dans l'adaptation, il ne se contente toutefois pas de tuer discrètement des clients : il tente d'accomplir pendant le Festival un **rite personnel de dévotion aux quatre aspects de Norgorber** afin d'obtenir une bénédiction, un signe divin ou un gain limité de puissance.

L'échelle doit rester volontairement inférieure à celle du Quatuor publié :
- pas de renversement du primarque ;
- pas de prise de pouvoir sur Absalom ;
- pas d'étincelle divine majeure ;
- pas d'obligation de révéler le Quatuor.

Le rite est une œuvre personnelle de Pratchett, sans lien avec le Quatuor.

### Positionnement de Pratchett

Pratchett doit être traité comme un antagoniste **intelligent, ambitieux, vaniteux et capable de planifier longtemps à l'avance**.

Son profil public reste celui déjà établi : propriétaire du **Palais des rêves**, hôtel haut de gamme du Précipice, dandy mondain, charmeur et notable local. Les PJ l'ont déjà rencontré brièvement sous cette identité.

Le Palais des rêves peut avoir hébergé ponctuellement des architectes, ingénieurs, délégations et responsables liés aux travaux du Festival. Cette position permet à Pratchett :
- d'écouter et observer ses clients ;
- d'obtenir des plans, habitudes et informations techniques ;
- d'identifier Wakeiwa Atikak, Blune Bandrevaleur et d'autres acteurs du Ratisseur ;
- de voler ou recopier discrètement des documents ;
- de bâtir ses plans sans jamais appartenir officiellement au comité du Festival.

Il n'est donc **pas membre de l'organisation du Festival**, ce qui évite de le rendre immédiatement suspect.

## Les quatre aspects de Norgorber — repères pour le rite

Les quatre aspects utiles sont :

- **Père Écorcheur** — meurtre, violence, assassinats, torture.
- **Noirs Doigts** — poison, maladie, alchimie meurtrière.
- **Faucheur de Réputation** — secrets, mensonges, information, réputation détruite et manipulation.
- **Maître Gris** — vol, furtivité, larcin et crime clandestin.

### Répartition des quatre actes — adaptation retenue le 28 novembre

- **Père Écorcheur** : les disparitions et meurtres du Palais préparent le dernier hommage, le meurtre du dignitaire osirien Nesret Ankhari, rencontré par les PJ en partie 1. Il est mort quand les agents arrivent dans le sanctuaire, sauf prévention effectivement réussie par leurs actions antérieures.
- **Noirs Doigts** : les troubles déjà joués de la ménagerie sont, dans l'adaptation, une première expérience de Pratchett. Il contamine ensuite l'accessoire magique du grand spectacle officiel du 16 Kuthona. Le succès de l'hommage dépend de la propagation réelle.
- **Maître Gris** : le vol impossible du Ratisseur, préparé grâce aux plans obtenus par l'hôtelier ; la catastrophe lors de son retour amplifie la récompense, sans être nécessaire pour que le vol ait été accompli.
- **Faucheur de Réputation** : faux ordre de déplacement du Ratisseur imitant le cachet de Lavarsus, pour faire croire que Lavarsus a autorisé le transfert du Ratisseur et suspendu les recherches. La calomnie et le discrédit sont l'acte rituel, indépendamment d'une condamnation définitive.

Le rite est personnel. Pratchett obtient progressivement des faveurs limitées pendant le combat final ; il ne devient pas un avatar complet. Les actes peuvent être contrariés et leurs faveurs interrompues.

## Éléments déjà établis ou à conserver

- Les PJ ont déjà été confrontés à plusieurs incidents autour du Précipice et du futur Festival.
- Le **Ratisseur de tombes** a disparu de façon spectaculaire et demeure une question ouverte.
- Des visiteurs ont déjà disparu, mais l'enquête n'a pas permis de remonter jusqu'au Palais des rêves.
- Pratchett cible principalement des **visiteurs de passage**, ce qui explique pourquoi plusieurs disparitions ont été détectées tardivement.
- La période du Festival doit rendre la détection de nouvelles disparitions particulièrement difficile et donner aux PJ une raison d'organiser la surveillance en amont.
- Le Palais des rêves reste la conclusion naturelle du mini-arc.

## Festival Radieux — format maison

Pour cette adaptation, le Festival Radieux est condensé sur **trois semaines**.

Dates maison retenues :
- **1 Kuthona** : ouverture du Festival ;
- **11 Kuthona** : célébrations de l'Ascension de Cayden Cailean ;
- **21 Kuthona** : **Crystalhue**, fête de Shelyn liée à la lumière, aux couleurs et à la beauté, utilisée comme cérémonie de clôture du Festival.

> Le scénario publié place le Festival sur tout un été et omet volontairement les dates précises. Les dates ci-dessus sont donc une adaptation de continuité.

Pendant cette période, les aspirants Éclaireurs affectés comme agents spéciaux auprès de la garde de la Falaise doivent rester disponibles à Absalom.

## Structure du mini-arc — deux séances (révision du 28 novembre)

Les conducteurs SQLite font foi pour les textes de jeu et horaires détaillés ; les décisions ci-dessous remplacent les anciennes répartitions. Les deux séances sont encore non jouées.

**Partie 1 — 1er au 11 Kuthona, 19 h–23 h**

| Heure | Séquence |
|---|---|
| 19 h–19 h 30 | Grande Loge : Chasseurs de l'Étoile, équipe concurrente des « chouchous », Corvan et Ambrus. |
| 19 h 30–20 h | Arrestation de Lavarsus ; courte enquête sur l’ordre de déplacement ; comité, délégations, Wakeiwa et Nesret. |
| 20 h–20 h 45 | Jours 1–5 : incidents de sûreté et d'organisation. |
| 20 h 45–21 h 10 | Aide aux Merveilles Vagabondes : maintenir leur candidature. |
| 21 h 10–21 h 35 | Jours 6–10 : autres patrouilles et préparatifs. |
| 21 h 35–22 h 45 | 11 Kuthona : retour, embarquement, combat, secours, miroirs et deux couplages du Ratisseur. |
| 22 h 45–23 h | Le Retour à l'Ancrage : rituel de stabilisation, bilan, signe du Maître Gris. |

**Partie 2 — 12 au 21 Kuthona, 19 h–23 h**

| Heure | Séquence |
|---|---|
| 19 h–19 h 15 | Reporter les vrais résultats et affecter les gardes. |
| 19 h 15–19 h 45 | Incidents restants et sélection du spectacle, si elle n'a pas déjà été décidée. |
| 19 h 45–20 h 40 | 16 Kuthona : grand spectacle et attaque alchimique des Noirs Doigts. |
| 20 h 40–21 h 05 | Derniers incidents, clôture de Shelyn, absence du dignitaire osirien. |
| 21 h 05–21 h 40 | Palais des rêves : donjon express et preuves du meurtre accompli. |
| 21 h 40–22 h 40 | Pratchett, ses deux ombres et quatre sceaux d'ascension. |
| 22 h 40–23 h | Enquête conclue selon les preuves, réhabilitation éventuelle, deuil et clôture. |

### Rencontre des deux équipes

Chasseurs : Sheila Heidmarch, Aelyra, Galahen, Rovan Dheris, Veska Ornel. Rivalité : Caelan Voss, Sivri Nymm, Tareth Olan, Lyssara Vel, aspirants choisis par Elysye ([fiche de l'équipe rivale](../univers/Equipe-rivale.md)). Ne pas supposer la présence physique d'Elysye. Les rivaux ne sont pas des antagonistes du rite ni une équipe condamnée à échouer. Corvan Keris et Ambrus Valsin introduisent les aspirants et leurs affectations. Corvan les envoie en mission et reste disponible à leur demande ; il ne revient pas spontanément dans les événements, les secours ou l’enquête. Asilia de Gyr confie le dispositif de sûreté à Valsombre (niveau canonique 14), sans effacer l'autorité habituelle de Lavarsus dans la continuité.

### Réserve d'incidents et organisation

Dix-neuf fiches identiques dans les deux conducteurs (2d10 additionnés, sommes 2 à 20). Si le numéro a déjà été traité, y compris par la garde, action libre sans relance. Les deux fausses disparitions sont réunies en deux variantes d’une seule fiche. Les scènes principales ne dépendent pas du tirage. Les résultats centraux sont courants ; les bas extrêmes sont insolites, les hauts extrêmes dangereux. Numéros à reporter entre séances.

| 2d10 | Événement |
| --- | --- |
| 2 | Bras de Neigivre — procession des souvenirs |
| 3 | Labyrinthe de l’effroi — passage impossible |
| 4 | Scandale diplomatique |
| 5 | Camp d’Esker |
| 6 | Querelle des délégations |
| 7 | Erreur de la Gardétoile |
| 8 | Paris clandestins |
| 9 | Voleurs du Parterre d’argent |
| 10 | Enfant perdu |
| 11 | Le Canard pourpre |
| 12 | Disparition signalée (deux variantes) |
| 13 | Affaire Lavarsus |
| 14 | Colère des commerçants |
| 15 | Coupole martiale |
| 16 | Feux de Beckabee |
| 17 | Bête en liberté |
| 18 | Magie incontrôlée |
| 19 | Char en flammes — parade menacée |
| 20 | Château de corail — effondrement imminent |

Les six responsables de faction sont disponibles selon la situation : Fola Barun (Alliance des Émissaires), Calisro Benarry (Chasseurs d’Horizons), Gorm Greathammer (Grandes Archives), Eando Kline (Sceau Vigilant), Urwal (Roue Verdoyante, animaux et milieux naturels), Galahen (Serment Radieux, déjà présent avec les Chasseurs de l’Étoile). Leur aide ne remplace pas les PJ. Voir [Société des Éclaireurs](../univers/Societe-des-Eclaireurs.md).

Sécurité, confiance de Valsombre, réputation organisation et popularité des deux cirques, jauges 0–10 : départs indicatifs 5/3/3/3/5. Ne pas remplacer les résultats réels. Délégations et détails des litiges : ajouts MJ. Conducteurs : index rapide, paragraphes distincts, références réunies en fin de séance.

## Ratisseur de tombes — canon utile

Dans le scénario publié :
- l'inventrice du Ratisseur est **Wakeiwa Atikak** ;
- l'engin devait à l'origine servir à excaver les restes de l'Étreinte du Tyran ;
- **Blune Bandrevaleur** obtient de l'utiliser pour les travaux du Précipice ;
- grâce à la **canne du Maelström**, Blune lie des protéens au moteur ;
- l'intérieur de la machine déforme l'espace et le temps comme un demi-plan et est plus vaste qu'il ne devrait l'être ;
- pour l'arrêter, il faut normalement entrer dans la machine, couper deux couplages de puissance puis le noyau principal.

Pour l'adaptation basse puissance, conserver surtout l'idée suivante :
**des forces beaucoup plus puissantes peuvent tenter de contenir le Ratisseur à l'extérieur tandis que les PJ, présents au bon endroit au bon moment, doivent intervenir à l'intérieur sur des sous-systèmes adaptés à leur niveau.**

Pratchett est le responsable du vol et du sabotage ; il exploite les informations obtenues grâce à son hôtel. Le conducteur utilise une plaque de rappel occulte fictive et un retour préprogrammé ; le détail métaphysique reste libre.

## Repères du scénario publié mis en réserve

Les éléments suivants ne sont plus des obligations pour le mini-arc :
- Main de cuivre ;
- progression par les catacombes vers la Dépiauteuse ;
- Jonis Flakfatter et le fléau des Noirs Doigts à grande échelle ;
- arrestation de Wynsal ;
- Baleine noire ;
- Miogimo ;
- ascension d'Olansa ;
- Étincelle radieuse ;
- final de la Reine grise.

Ils restent uniquement dans la version publiée archivée, pas dans notre Partie 2.

## À vérifier et à préparer avant jeu

- Valider groupe réel, DD, niveau des rencontres et durée de la salle A7 ; les profils maison sont écrits pour quatre PJ N2.
- Tester le Toolkit sur la scène existante avec deux comptes ; vérifier la disposition et les obstacles.
- Préparer dans Foundry les scènes nécessaires au parcours A1–A9 et E1–E37, les Actors des fragments, dangers, ombres et Pratchett ; la mécanique décrite sur papier ne garantit pas leur création.
- Vérifier les portraits importants (Wakeiwa, Nesret, Ralso, Pratchett) et présence/affiliation des artistes dans la continuité. Trois portraits du Ratisseur sont déjà importés, voir ci-dessous.
- Valider l'équilibrage du rituel final du Ratisseur et des quatre sceaux de Pratchett. Reporter les résultats réellement joués, pas les valeurs proposées.
- Les modèles et conducteurs sont actualisés ; les statuts de préparation et de partie jouée ne sont pas modifiés par cette réécriture.

## Hypothèse de travail — Palais des rêves comme source d'information

Le **Palais des rêves** est un hôtel récent mais haut de gamme du Précipice. Pendant les années et mois de préparation du Festival, des architectes, techniciens, délégations et responsables de chantier peuvent y avoir séjourné.

Pratchett profite de cette clientèle :
- observation via les passages secrets de son hôtel ;
- écoute des conversations ;
- copie de notes et plans laissés dans les chambres ;
- récupération de documents ou objets jetés ;
- manipulation de Ralso et de contacts criminels pour obtenir du matériel supplémentaire.

C'est ainsi qu'il découvre l'existence des propriétés extraordinaires du Ratisseur et finit par décider d'en faire l'acte du **Maître Gris** de son rite.

Le vol du Ratisseur est donc **son idée, son exploit et sa responsabilité**, le conducteur retient le déphasage et la plaque de rappel occulte comme explication maison, sans décrire de procédé technique réel.

## Cirques et acte des Noirs Doigts

Les **Merveilles Vagabondes** et la **Ménagerie Céleste** de Dusklight concourent au Festival. Ne pas réintroduire Myron après sa mort. Professeur Zarlian Kyosophus, Dusklight, Daring Danika, Viktor Volkano, Jellico Bounce-Bounce, Hesper et Meitas Jaxis sont répertoriés dans les conducteurs ; vérifier leur présence et leur affiliation selon la continuité jouée, et ne pas forcer Vaga à participer.

- Partie 1, aide facultative : dossier MV-4 (treuil, axe et sangles) envoyé par erreur au pavillon d'Alkenastre ; MA-4 concerne la troupe rivale. Récupérer le matériel, sécuriser l'agrès, convaincre l'homologateur (deux objectifs sur trois), puis répétition. Une solution au sol permet de maintenir la candidature même après un échec. Ce problème est ordinaire, sans poison ni implication de Pratchett.
- La sélection officielle peut être acquise en partie 1 si les décisions le justifient ; sinon courte compétition en partie 2, fondée sur la popularité et une répétition. Ne pas refaire une décision déjà prise.
- Partie 2, Pratchett vise le spectacle choisi, pas une troupe par rancune. Q-16 est le cristal d'or de finale autorisé ; Q-17 est le remplacement à rune noire et visa absent, chargé d'une quintessence alchimique fantastique qui ne s'active qu'au spectacle. Le dépôt dessert plusieurs clients dont le Palais ; la facture précise E30 confirme l'auteur. Les troubles de la ménagerie antérieure constituent un essai dans l'adaptation, pas une révélation canonique.
- Prévention réelle avant activation par inspection de la piste, du registre en coulisses, des malaises à l'atelier/enclos ou d'un témoin dans les gradins. Un indice crédible permet d'isoler le cristal ; ne pas imposer la crise.
- Si activation : trois rounds PF2, quatre secteurs P/C/A/G, trois objectifs (source, victimes, foule). À la fin de chaque round, un secteur intact adjacent est menacé si la source reste active. Ne jamais recontaminer un secteur évacué. Actions concrètes et DD16 (hypothèse N2), trois actions par PJ ; la garde prend le relais à la fin du troisième round. Degré N : 0 prévention, 1 activation localisée maîtrisée, 2 source encore active ou deux secteurs ou plus menacés. Garder les preuves même si la catastrophe est évitée.

## Affaire Lavarsus — faux ordre de déplacement

Le fantôme qui tuait les anciens esclaves a été retrouvé ; cette affaire est terminée et n’a aucun rapport avec la disparition du Ratisseur. L’ancien dossier R-17 et la piste du détournement d’argent sont abandonnés.

Pratchett a dérobé le Ratisseur puis fabriqué un ordre de déplacement au nom de Lavarsus avec imitation du cachet. Le greffe reçoit cet ordre le lendemain de la disparition : transfert pour maintenance hors du Précipice, suspension des recherches. Lavarsus est suspendue à l’ouverture du Festival, pas condamnée.

- L’ordre contesté et le registre du greffe sont accessibles. Le greffier n’a pas reçu le document de la main de Lavarsus.
- Wakeiwa confirme que ni départ, ni destination, ni autorisation technique ne figurent dans son carnet. Les PJ peuvent interroger Lavarsus, le greffier et Wakeiwa ; Asilia conserve les pièces et poursuit la procédure hors champ.
- Partie 2, bureau de Pratchett (E30) : brouillon de l’ordre, essais d’imitation du cachet et corrections manuscrites prouvent la falsification. Les pièces saisies permettent la réhabilitation. Respecter une découverte anticipée effective.
- Corvan n’intervient que si les PJ vont spontanément le consulter ; il n’est pas enquêteur ni responsable de la garde.

Degré Faucheur : 0 si réhabilitation publique anticipée, 1 accusation contestée mais suspension, 2 discrédit durable. La difficulté du boss en dépend, pas la culpabilité réelle de Lavarsus.

## Continuité maison — Lavarsus

Dans cette campagne, **le lieutenant Lavarsus est une femme**. Le PNJ canonique et le personnage secondaire plus conciliant ont été fusionnés pour réduire le nombre d'interlocuteurs.

Lavarsus est :
- la cheffe opérationnelle de la **garde de la Falaise** ;
- le contact direct des PJ / aspirants Éclaireurs affectés comme agents spéciaux ;
- la responsable de leur intégration aux interventions locales du Précipice ;
- une figure plus accessible et coopérative que le Lavarsus canonique, tout en conservant son autorité et son expérience.

Toute future préparation doit utiliser **elle / la lieutenant Lavarsus** et ne pas recréer le second officier fusionné.


## Adaptation du Ratisseur et intervention de la Société — 27 novembre 2026

Le but initial de Wakeiwa Atikak est de démontrer au Festival que l'engin, protégé contre la magie instable par ses systèmes planaires, permettra de réhabiliter l'**Étreinte du Tyran**, zone ravagée par l'attaque de 4719. Il s'agit d'une adaptation de la mission canonique d'excavation de cette fosse commune. Pratchett le trafique ; son retour le 11 Kuthona déchaîne une tempête planaire et des manifestations de plusieurs plans. Les PJ sont à proximité, entrent avant le verrouillage, et sont les seuls à pouvoir agir rapidement sur les couplages. Les vétérans à l'extérieur contiennent la tempête, protègent les civils, et pourront intervenir dans le cœur après stabilisation des accès. Fola Barun assure la liaison mentale empathique (pouvoir maison, pas canon attesté) et transmet les indications de Wakeiwa. Eando Kline dirige le confinement ; Ambrus coordonne ; la Gardétoile, Gorm Greathammer, Calisro Benarry et Urwal assurent secours et soutien. Sheila Heidmarch, Aelyra, Galahen, Rovan Dheris et Veska Ornel forment les Chasseurs de l'Étoile. Galahen est le nom définitif du champion et dirigeant du Serment Radieux dans notre continuité ; la fiche PNJ existante a été renommée sans changer son identifiant. Hestriviniaas (ké'ktar niveau 22 dans le canon) ne doit pas être un adversaire direct des aspirants. Les PJ neutralisent la transmission et les distorsions, stabilisent les ancrages et ouvrent l'accès aux vétérans ; arrêt et libération peuvent être contrôlés. Préférer confinement et retour au Maelström à un combat obligatoire contre les captifs.

## État des conducteurs — 28 novembre 2026

Enregistrement et relecture API confirmés, avec remplacement des modèles des deux modules existants, sans création de doublon ni modification des cinq missions jouées. Aucun événement des deux séances n'est marqué accompli.

- [Partie 1](https://l7r.fr/pf2-mj/session-preparations?preparationId=f0e9ce7b-41d5-4195-bb2c-3a9bd779792b) : révision 9, sept étapes, 81 blocs, 43 537 caractères de contenu.
- [Partie 2](https://l7r.fr/pf2-mj/session-preparations?preparationId=256ff036-d1bd-4b6a-830a-0efb2f558f5d) : révision 7, sept étapes, 68 blocs, 50 366 caractères de contenu.
- Modèles `festival-partie-1` et `festival-partie-2` du scénario `agents-of-edgewatch-radiant-festival` synchronisés ; réserve commune de dix-neuf fiches contrôlée (2d10). Aucune séance Discord liée. Sauvegarde avant réécriture : `/home/valou/services/_sauvegardes/PF2/agents-absalom/festival-reorganisation-20261128-093642.json`.
- La [PR technique #60](https://github.com/ValerianGuivarch/lsr-nestjs-backend/pull/60) a fourni les blocs compteurs typés. Publication réelle dans le chat Foundry à tester ; ne pas confondre les compteurs SQLite avec la pression du Toolkit.

## Ratisseur — conducteur révisé de Partie 1

Tome 6, *L'excavateur fou*, pagination imprimée pp. 136–149, notamment p. 137 pour le rôle de Wakeiwa et le tri des souvenirs, p. 139 pour A2, p. 140 pour le plan, pp. 141–142 pour A5/Kaeron, pp. 143–145 pour les couplages et le noyau. Les descriptions de la préparation sont réécrites pour la table, pas des citations intégrales.

- Le premier jour, Wakeiwa peut expliquer l'origine de l'excavateur, sa mission pour l'Étreinte du Tyran, les tapis de tri, l'utilisation des protéens par Blune, l'espace déformé, les conditions de sécurité et les deux couplages. Elle croyait à un accord de service dans cette proposition : sa responsabilité morale reste à confirmer par le MJ. Blune et Ama Uomi font partie des interlocuteurs rencontrés.
- Retour le 11 au Parterre d'argent ; le dispositif occulte de Pratchett lance la machine sans pilote. Accès par la porte avant verrouillage, ou A1, glissière canonique longue de 18 m et débouchant à 9 m du sol ; accès adapté à la table. Les PJ peuvent utiliser cordes, échelles, entraide et magie réellement disponible.
- A2 : premier combat adapté, deux éclats d'imentesh N1 et un danger de convoyeur N0 (80 XP pour quatre PJ N2), sauvetage d'un technicien. Les vrais imenteshs ne sont pas abaissés arbitrairement : ce sont des manifestations maison. A3 : tri et indices, pas de pillage des souvenirs des morts. A4/A5 : palier, refuge et Kaeron possédée par le pélagastr Murmure-Dans-l'Éther ; négociation et secours.
- A6 : plaque étrangère du rappel, choix du cap, liaison empathique de Fola Barun (pouvoir maison) et grands miroirs vers la tempête extérieure ; scènes d'entités planaires, rues menacées, vétérans à l'œuvre et vision non interactive du siège de 1619. Les PJ restent indispensables à l'intérieur. Hestriviniaas N22 et les vrais imenteshs ne sont jamais des adversaires directs imposés.
- A7 : mini-jeu interactif du Toolkit, six mécanismes. Viser environ 10–20 minutes réelles ; secours par décision MJ/solution adaptée si le temps manque. A8 : trois valves, séparation de transmission, libération graduelle du chœur préférée à l'arrêt brutal ; conséquence de gravité et risque adaptés. A9 : noyau, ancrages, levier et préparation du rituel, **pas de deuxième combat obligatoire** ; les vétérans contiennent les grands protéens et n'exécutent pas le rituel à la place des PJ.
- Catastrophe 0–6 : jauge narrative distincte de la pression, dégâts cumulés, pas de points de vie. Degré Maître Gris 0 si 0–2, 1 si 3–4, 2 si 5–6. Le vol est acquis. Le signe sous la plaque A6 est un indice garanti après l'arrêt ou plus tôt si découvert ; Religion ou spécialiste pour l'interpréter. Pas d'identification directe de Pratchett.
- Trois illustrations extraites des PDF privés et réellement importées via l'API de portraits : Éclat d'imentesh `prep-agents-absalom-imentesh.webp`, Kaeron/Murmure `prep-agents-absalom-murmure.webp`, Hestriviniaas `prep-agents-absalom-keketar.webp` (vol. 2, pages PDF 141, 143, 148). Elles sont liées aux blocs de personnages temporaires de la préparation, pas à de nouveaux Actors Foundry.

### Épreuve coopérative du couplage A7 — état de référence au 28 novembre 2026

**Décision MJ, adaptation maison :** remplacer le casse-tête de cristaux à guidage aveugle prévu dans le conducteur du 27 novembre par une salle de maintenance interactive inspirée de la communication asymétrique de Keep Talking. Un PJ opérateur manipule les mécanismes, les autres cherchent les notices et lui dictent leurs conclusions ; ils peuvent aussi actionner la soupape. Aucun DD obligatoire pour résoudre les six mécanismes. Les PJ se déplacent physiquement dans la salle. L'épreuve reste le couplage A7 du parcours A2/A5 → A6 → A7 → A8 → A9 ; elle ne remplace ni les secours ni le cœur de la machine.

**Règles en vigueur (Val Toolkit 0.44.36, déployé et vérifié sur le mini-PC le 28 novembre) :**

- Pression initiale 7 %, hausse par défaut de 5 points toutes les 30 s (intervalle et hausse réglables), erreur +5 points, première réussite de chaque mécanisme −10 points. Pression minimale 0 %, **aucun plafond**, aucun arrêt automatique à 100 % ou à la fin du temps indicatif. Durée proposée 600 s ; le panneau montre le dépassement. Le MJ peut mettre en pause, reprendre, ajuster, arrêter ou résoudre. La réussite automatique intervient quand les six mécanismes sont stabilisés.
- **Conduits :** liste numérotée de couleurs et état actif/isolé ; 3 à 6 conduits tirés au sort à chaque partie. La notice comporte les règles pour 1 à 6 conduits ; appliquer la première règle valable pour le nombre affiché. Un seul bon conduit isolé valide l'épreuve. Isoler un mauvais conduit ou un second conduit coûte +5 ; rétablir un conduit ne coûte rien. La récompense n'est donnée qu'une fois.
- **Sceaux runiques :** dix lignes de six symboles, avec recouvrements. Trois séries de quatre symboles tirées parmi les combinaisons appartenant à une seule ligne ; l'opérateur ne voit que ses quatre touches. L'expert dicte l'ordre de la ligne, sans activer les autres symboles. Les trois permutations de saisie sont distinctes. Erreur : recommencer la série en cours, +5. Grandes touches et témoins de progression.
- **Pulsations du Maelström :** quatre lampes colorées directement sur la carte ; séquence initiale de quatre couleurs, diffusion répétée après 10 s. Premier double-clic = première saisie et interruption de la diffusion ; reproduire l'ordre identique. À chaque série correcte, ajouter une pulsation, jusqu'à douze. Une faute fait clignoter les quatre lampes 3 s puis les éteint 1 s avant rediffusion ; dix secondes sans saisie relancent sans pénalité. À la réussite, les quatre lampes restent allumées.
- **Circuit planaire :** l'expert dispose du plan 5×5 de A1 à E5 ; l'opérateur ne voit ni grille ni position, uniquement quatre directions et un retour accepté/refusé. Mur = +5, sans déplacement ; rappel à A1 sans pénalité. Le MJ voit la position.
- **Rose des plans :** douze gemmes en deux rangées ; cinq constellations distinctes tirées parmi huit au départ. La notice associe chaque motif à un cardinal. Choisir Nord/Est/Sud/Ouest puis sceller l’accord. Compteur 0/5 à 5/5 ; nouvelle constellation seulement après réussite. Mauvaise validation +5, constellation inchangée ; aucune pénalité d’inactivité. Réduction unique de 10 points et stabilisation au cinquième accord.
- **Soupape :** une activation immédiate réduit la pression de 10 points, première purge comprise ; recharge de 60 s, pas de maintien ou de relâchement. Les purges suivantes restent utiles jusqu'à la réussite globale.

Les six notices courtes sont des textes d'atelier **maison**, signés Wakeiwa Atikak (inventrice canonique). Pas de références aux jetons ni aux clics dans leur texte, pas de grand logo décoratif. L'accès passe par les repères thématiques : sélection d'un jeton propriétaire à 1,5 case maximum, fermeture en s'éloignant. Les mécanismes exigent normalement une proximité de 2,5 cases pour les joueurs ; les lampes 1,5 case, même en test MJ. Les manuels sont réservés aux experts, avec exception de test MJ. Voir le [fonctionnement technique Foundry](../outils/foundry.md#épreuves-coopératives-du-ratisseur) et le [README du Toolkit](../../pf2e-val-toolkit/README.md#épreuves-coopératives--04435).

**Carte Foundry :** deux scènes de test existent dans le dossier Agents d'Absalom du monde `test-pf2` ; utiliser **Le Ratisseur de tombes — carte** plutôt que recréer une salle. Image privée BirdieMaps `rati.png`, source 1000 × 1136 px, scène 3000 × 3408, grille 100 px, marge nulle et grille Foundry invisible. Le MJ a confirmé l'affichage du fond et supprimé lui-même la cloison horizontale : ne pas la remettre. Les obstacles de déplacement suivent les conduits verts et les trois grandes machines centrales (pas d'occlusion de vision) ; ils sont préparés dans le préréglage et ajoutés une seule fois sur la scène existante lors de la prochaine épreuve. Ne pas déplacer les repères déjà ajustés par le MJ. Icônes agrandies à 120 px, lampes à 94 px. Aucun Actor créé automatiquement.

**État des tests :** le MJ a essayé les mécanismes et signalé le manque de lisibilité, les arrêts à 100 %, la molette changeante et le maintien de purge ; la 0.44.35 répondait à ces retours ; la 0.44.36 ajoute les cinq accords. Les tests automatisés du moteur passent (règles des conduits exhaustives, unicité et permutations des runes, Simon, circuit, pression au-delà de 100 %, temps dépassé, molette fixe, recharge, bornes des obstacles, permissions). La version est installée ; le rendu du nouveau pavé et des touches, la taille des pictogrammes, le placement des obstacles et une partie à deux comptes restent à valider sur le client après rechargement. La migration de la salle elle-même n'est pas confirmée.

**Report effectué le 28 novembre :** conducteur et modèle de Partie 1 révision 9 utilisent désormais cette salle à la place du défi de cristaux. Solution de secours et limite indicative de temps prévues. La pression n'est pas la catastrophe ; ni arrêt ni catastrophe automatique à 100 %. Le DD du rituel final peut dépendre de la pression (proposition ci-dessous). Les essais techniques ne constituent pas des événements joués. Validation en situation et DD réels à confirmer.


## Le Retour à l'Ancrage — rituel de stabilisation

Décision MJ : la fin de Partie 1 doit être un **véritable rituel inspiré de PF2**, joué ensemble après les couplages, plutôt qu'un simple bouton ou un combat obligatoire. Le conducteur inclut une explication des règles de base et une version adaptée, avec texte d'invocation, gestes et conséquences.

### Règles PF2 de référence

Voir [Rituals](https://pathdb.net/rules/rituals) (règles de jeu). Durée normalement au moins une heure. Un rituel ne dépense pas d'emplacement de sort et son incantateur n'a pas besoin d'être un lanceur de sorts ; il doit connaître le rituel, remplir les exigences de compétence et pouvoir effectuer un rituel de ce rang (moitié du niveau arrondie au supérieur). Les participants secondaires ne sont pas soumis à la même restriction générale de niveau. Le MJ peut adapter les exigences selon les circonstances. Le DD principal est très difficile pour un niveau égal au double du rang, les DD secondaires standards du même niveau. Rang 1 : principal DD21, secondaires DD16.

Les participants secondaires font leurs tests avant le principal : réussite critique +2 de circonstance ; réussite aucun modificateur ; échec −4 de circonstance ; échec critique −4 de circonstance et degré du test principal abaissé d'un cran. Les bonus ou malus de circonstance identiques ne s'additionnent pas ; respecter les degrés du résultat. Les effets de fortune/infortune ne s'appliquent pas aux tests de rituel. Puis test principal, résolution selon le degré du rituel.

### Adaptation proposée et enregistrée dans le conducteur

Rituel maison rang 1, durée réduite à dix minutes fictionnelles grâce aux ancrages déjà en place, instructions de Wakeiwa transmises par Fola, pas de coût supplémentaire ni d'apprentissage préalable imposé dans cette situation. Principal Arcanes ou Occultisme ; trois postes secondaires : Artisanat, Religion, Athlétisme. Adapter postes au groupe réel et compétences disponibles. DD secondaires 16.

Proposition de DD principal selon pression de fin d'A7 : 0–24 % DD16 ; 25–49 % DD18 ; 50–99 % DD21 ; 100 % et plus DD26. Ce dernier seuil est sévère, à valider. Variante plus simple : DD18 fixe, ou plafonner à 21. Ne pas additionner les modificateurs par maison à ceux des règles PF2. L'ancienne idée de modificateurs secondaires +2/+1/−1/−2 est mise de côté en faveur de la règle officielle. Le rituel n'est pas un test d'Arcanes unique détaché des autres PJ.

- **Critique :** stabilisation exceptionnelle, noyau préservé, captifs libérés en sécurité.
- **Réussite :** arrêt contrôlé, libération et réparation ordinaire.
- **Échec :** arrêt possible mais réparation importante et catastrophe +1.
- **Échec critique :** arrêt d'urgence, catastrophe +2, dégâts au noyau ; pas de mort obligatoire des captifs ou des PJ. Jauge toujours bornée à 6.

Le succès des agents à l'intérieur débloque l'accès des vétérans ; Fola transmet, les Chasseurs contiennent, les PJ font réellement le rituel. Ne pas compter une victoire de PNJ comme leur réussite.

## Partie 2 — Nesret, Palais des rêves et ascension

**Nesret Ankhari**, personnage maison : humain d'Osirion, envoyé d'un comité de prêteurs d'antiquités, d'une cinquantaine d'années, robe ivoire, broche de lapis en scarabée. Rencontre normale avec le comité et Wakeiwa le premier jour : conservation des souvenirs et prêt d'objets, séjour au Palais des rêves, allocution annoncée le 21. Le nom et le portrait physique sont des choix de préparation, pas une figure canonique. Son portrait spécifique reste à trouver ou créer. L'ancienne captive Nalia Serevan est abandonnée.

Le dernier jour, son assistant constate son absence à la cérémonie de Shelyn, dément le faux départ annoncé par l'hôtel et fournit directement l'adresse. Les PJ ne passent pas la séance à chercher l'hôtel. Par défaut, Nesret est **déjà mort**, dernier hommage du Père Écorcheur, lorsqu'ils découvrent E36. Si une action préventive effective a sauvé Nesret plus tôt, ne pas substituer une autre victime de force. L'absorption des faveurs, et non la vie du dignitaire, est l'enjeu immédiat du combat.

### Palais express

Tome 1, *Le Diable du Palais des rêves*, pp. 46–66 imprimées. Parcours : E1 réception (Ralso, départ mensonger) → E2 vestiaire (effets Takeko Lon et Nesret) et E3 hall (portrait) → E24 facultatif (journal, clé, histoire de Cora, poupées inertes) → E30 bureau et placard-escalier → E31 cave → E36 sanctuaire (fosse visible, masque, registre, corps identifié dignement) → E37 laboratoire. E21 possible sauvetage de Kemeneles et Lyrma si compatible avec les faits déjà joués ; E16 piège facultatif adapté ; E32–35 non obligatoires. Issue E37 vers E32, à bloquer si l'on a prévu la garde. Ralso est une complice, pas le boss ; négociation, arrestation ou fuite. Pas de donjon complet à nettoyer. Préserver les objets et registres ; ne pas déclarer tous les disparus morts sans preuve.

Quatre pièces E30 : brouillon du faux ordre et essais de cachet, plan de Wakeiwa et croquis de la plaque, paiement Q-17 par le Palais, ordre concernant l'invité d'Osirion du 20. Le journal de Ralso et le registre E36 sont des preuves autonomes. Le rapprochement révèle la responsabilité de Pratchett dans les quatre actes et permet le réexamen de Lavarsus. Le théâtre de la preuve ne doit pas empêcher une enquête anticipée crédible.

### Boss final : ascension à quatre sceaux (règle maison)

Pratchett est un alchimiste fanatique qui vient d'achever le rite mais doit encore absorber les faveurs ; pas d'avatar complet. Une rencontre unique avec deux ombres. Hypothèse 4 PJ N2 : Pratchett N3 CA19 PV48 Perception+9 Vig+10 Réf+12 Vol+8 attaque+11 1d6+4 ; deux fioles fictives (1 éclaboussure). Ombres N0 CA15 PV12 +6 1d4+2, budget total 100 XP entre modéré et sévère. Ajuster avant initiative au groupe réel.

Ordre **Père Écorcheur → Faucheur de Réputation → Noirs Doigts → Maître Gris**. Début à 0. Annoncer le prochain signe et son effet au début du round ; absorber un signe à la fin du round si Pratchett est conscient et relié, sauter les signes neutralisés. Quatre étapes maximum, pas de soin complet ni action supplémentaire. Chaque sceau demeure accessible et alimente son avantage tant qu'il est intact. Deux actions Religion/Occultisme/Arcanes/Artisanat/Vol DD16 ou Athlétisme DD18 ; réussite désactive, critique empêche également l'absorption suivante une fois ; échec critique 1d6 force, Vigueur basique DD16. Destruction physique possible : CA16 solidité3 PV12 seuil brisé6. Neutraliser un signe déjà absorbé retire son avantage et décrémente le compteur. Un moyen pertinent de rompre effectivement le lien est accepté. Inconscient ou mort : signes et ombres disparaissent. Les ombres disparaissent aussi quand tous les signes sont neutralisés. Pas de régénération ni nouvelle phase obligatoire.

| Sceau | Dégré et effet |
|---|---|
| Père Écorcheur | 2 par défaut : 8 PV temporaires une fois, +2 dégâts première mêlée réussie du tour ; 0 et signe inactif si meurtre empêché (variante degré 1 : 4 PV temporaires et +1). |
| Faucheur | 0 : pas 1,5 m sans réaction à absorption ; 1 : +1 CA première attaque par round ; 2 : premières deux attaques. |
| Noirs Doigts | 0 : +1 dégâts fantastiques au premier projectile réussi du tour ; 1 : idem et cône unique 1d6 Vig basique16 ; 2 : +2 et cône unique 2d6 Vig basique19, deux actions. |
| Maître Gris | 0 : pas 1,5 m sans réaction à absorption ; 1 : +1 circonstance premier jet d'attaque par round ; 2 : idem et déplacement d'ombre unique de 3 m, une action. |

Les degrés proviennent des faits, voir les sections précédentes. Les effets ne se cumulent pas sur la même attaque pour P/N. Les PJ peuvent concentrer dégâts, couper les supports ou protéger les preuves ; la fuite éventuelle est courte et évitable. Le combat reste le final de cet arc, sans nouvelle intrigue imposée. Le bilan et la fête de Shelyn tiennent compte du deuil, de la sécurité, de la réputation, de la preuve du faux et des conséquences réellement jouées.

## Pistes envisagées, non imposées à la table

- Les anciennes idées de calomnie plus fantastique (corps ou identité altérés, plusieurs Lavarsus, faux témoignage, souvenirs falsifiés, prédiction) sont en réserve ; le faux ordre de déplacement ordinaire et documentable est la version active. Ne pas ajouter un complot indépendant pour les utiliser.
- La compétition complète des deux cirques initialement prévue en partie 1 est déplacée en partie 2, sauf sélection déjà obtenue par les PJ ; l'aide matérielle à la candidature constitue la première rencontre.
- Des activités annexes (concours de cerfs-volants pour Pen-Pen, ateliers d'alchimie et d'invention, parade et logistique, archives de l'Ascension, foires culinaires, régate, concours liés à Cayden ou enchères) peuvent enrichir les fiches selon les PJ présents. Rien n'oblige à les jouer toutes.
- Piste personnelle Tsuyi : archives liées à l'Ascension, enquête des Tisseurs de Mémoire, noms et morts signalées autour de la Confirmation, Seo Haneul à Absalom, questions concernant Grand-Mère Araignée. Ne pas transformer ces pistes en preuves ou réponses déjà acquises ; se reporter au dossier personnel et à ce que le joueur sait réellement.
- Les propositions de ritualisation simplifiée (DD18 fixe ; modificateurs secondaires maison) et de catastrophe liée directement à la pression sont conservées comme variantes discutées, non règles actives. Le conducteur propose la version PF2 avec DD selon pression.
- La version précédente de P2 avec captive Nalia à sauver est remplacée par Nesret mort ; ne pas mélanger les deux. La prévention antérieure effective reste possible, sans railroading.

Les choix provisoires (identité de Nesret, profils N2, responsabilités de Wakeiwa, DD du rituel et effets des sceaux) sont ajustables par le MJ. Les conducteurs enregistrés constituent la version jouable, et le présent fichier la mémoire des décisions et des variantes. Ne pas marquer les événements comme joués avant la séance.


### Révision du 28 novembre — table et lisibilité

Les deux préparations SQLite et leurs modèles sont synchronisés (P1 révision 10, P2 révision 8), index des 19 incidents, règles de doublon, six factions, accusation indépendante du fantôme, références finales. Sauvegarde avant modification dans `/home/valou/services/pf2-data/_AI/catalogue-backups/festival-20261128-2d10-102757.json`. Les statuts de préparation et la progression en jeu ne sont pas changés. La Rose 0.44.36 passe les tests de cinq accords, absence de répétition, erreurs, récompense unique et non-divulgation des futures configurations ; le rendu réel à deux comptes reste à vérifier après rechargement.
