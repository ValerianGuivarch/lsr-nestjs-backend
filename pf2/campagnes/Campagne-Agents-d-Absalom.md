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
- L'ancien module **L’hôtel des meurtres** est conservé seulement dans l'archive. Le module provisoire **Enquête sur l’hôtel** a été supprimé le 27 novembre ; son enjeu est absorbé par la première séance.
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

### Répartition provisoire des actes de Pratchett

Le rite doit faire correspondre plusieurs incidents du Festival aux quatre aspects :

- **Père Écorcheur** : les disparitions et meurtres du Palais des rêves constituent son acte principal.
- **Noirs Doigts** : poison ou produit utilisé pour provoquer le chaos parmi les animaux de la ménagerie / du zoo.
- **Maître Gris** : le vol du Ratisseur de tombes lui-même, conçu comme un exploit impossible et ostentatoire accompli sans que personne puisse prouver comment il a été réalisé.
- **Faucheur de Réputation** : Pratchett cherche à **détruire la réputation de Lavarsus** avant le Festival par une opération de désinformation et de faux suffisamment crédible pour l'affaiblir, le faire suspendre ou au minimum mettre sa parole en doute. Le crime doit être découvert comme une fabrication, idéalement trop tard pour empêcher complètement ses effets.

Le rite n'a pas besoin d'être parfaitement symétrique. Pratchett peut avoir conçu une théologie personnelle et imparfaite, ce qui laisse de la liberté pour les événements du scénario.

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

## Structure validée du mini-arc — deux séances

Les modèles en SQLite font foi pour les scènes et les horaires détaillés.

**Partie 1 — 1er au 11 Kuthona, 19 h–23 h** : rencontre des Chasseurs de l'Étoile et des organisateurs ; arrestation de Lavarsus au début de la séance. Asilia de Gyr mandate Valsombre (agent canonique de niveau 14) pour reprendre le dispositif de sécurité. Corvan Keris demande aux aspirants d'obéir et étudie le dossier falsifié. Dix incidents quotidiens (réserve de 20 amorces, sans remise) entre 20 h et 22 h, avec une demi-heure de compétition des deux cirques de 20 h 45 à 21 h 15. Le 11, catastrophe planaire du Ratisseur, 22 h–23 h. La séance se conclut par une victoire et la première preuve norgorbérite permettant de reconnaître les quatre aspects ; Pratchett n'est pas identifié.

**Partie 2 — 12 au 21 Kuthona** : empoisonnement du cirque gagnant, surveillance des hébergements, piste fraîche vers le Palais des rêves, confrontation avec Pratchett dont la puissance dépend de la réussite de ses actes, clôture lors de la fête de Shelyn. Le conducteur de Partie 2 est créé ; les résultats de la première restent à reporter.

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

Pratchett est le responsable du vol et du sabotage ; il exploite les informations obtenues grâce à son hôtel. La méthode magique exacte reste à préciser.

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

## À préparer ensuite

- préciser le mécanisme magique du vol et du retour du Ratisseur ;
- construire le rite de Pratchett en quatre actes avec indices progressifs ;
- définir le générateur d'incidents du Festival et sa jauge de sécurité ;
- sélectionner 2 à 4 incidents majeurs ;
- condenser le Palais des rêves en quelques zones essentielles ;
- déterminer ce que les PJ peuvent apprendre de Norgorber sans ouvrir immédiatement le Quatuor.


## Hypothèse de travail — Palais des rêves comme source d'information

Le **Palais des rêves** est un hôtel récent mais haut de gamme du Précipice. Pendant les années et mois de préparation du Festival, des architectes, techniciens, délégations et responsables de chantier peuvent y avoir séjourné.

Pratchett profite de cette clientèle :
- observation via les passages secrets de son hôtel ;
- écoute des conversations ;
- copie de notes et plans laissés dans les chambres ;
- récupération de documents ou objets jetés ;
- manipulation de Ralso et de contacts criminels pour obtenir du matériel supplémentaire.

C'est ainsi qu'il découvre l'existence des propriétés extraordinaires du Ratisseur et finit par décider d'en faire l'acte du **Maître Gris** de son rite.

Le vol du Ratisseur est donc **son idée, son exploit et sa responsabilité**, même si la méthode exacte de déphasage reste à concevoir à partir du fonctionnement canonique de la machine.

## Cirques et acte des Noirs Doigts

Deux spectacles peuvent être en concurrence pendant le Festival :
- la **Ménagerie Céleste** de Dusklight ;
- le cirque allié / rival des PJ issu de *Sentence d'Extinction*.

Pratchett ne choisit pas nécessairement sa cible à l'avance. Il observe lequel des deux devient **le spectacle le plus populaire ou le plus prestigieux**, puis frappe celui-ci.

L'acte des **Noirs Doigts** consiste à contaminer ou empoisonner le spectacle choisi afin de transformer le succès public en catastrophe. Cette logique renforce son ego : il ne veut pas simplement empoisonner des animaux, il veut corrompre **ce que la foule célèbre le plus**.

## Combat final — puissance variable du rite

Le combat contre Pratchett doit dépendre directement de la réussite de ses quatre actes.

Chaque acte pleinement accompli peut lui conférer une bénédiction temporaire de Norgorber, une ressource de combat, une réaction, une résistance, un poison renforcé, un avantage de terrain ou un effet rituel.

Ainsi, les actions des PJ pendant le Festival influencent mécaniquement le boss final :
- le vol du Ratisseur est déjà accompli et constitue au minimum un succès ;
- empêcher la catastrophe liée à sa réapparition peut limiter la validation de cet acte ;
- empêcher ou réduire le sabotage des cirques affaiblit l'acte de Noirs Doigts ;
- déjouer l'acte du Faucheur de Réputation affaiblit un autre volet ;
- sauver la victime finale ou interrompre le sacrifice empêche l'accomplissement du Père Écorcheur.

Le boss final doit donc être nettement plus dangereux si les PJ ont laissé le rite progresser.


### Cible du Faucheur de Réputation : Lavarsus

Décision MJ : la victime du volet **Faucheur de Réputation** est **Lavarsus**.

Pratchett organise avant le Festival une campagne de faux, de témoignages arrangés et de preuves fabriquées destinée à ruiner sa crédibilité. L'objectif n'est pas nécessairement de le faire condamner définitivement, mais de :
- l'affaiblir politiquement et administrativement ;
- détourner la garde sur une enquête interne ;
- réduire sa capacité à coordonner les agents pendant le Festival ;
- accomplir un crime qui corresponde clairement au Faucheur de Réputation.

Lavarsus est arrêtée au début de la partie 1 ; Corvan enquête en parallèle. La marque du Maître Gris trouvée dans le Ratisseur arrêté permet, à la fin de cette première séance, de rapprocher les accusations contre Lavarsus des trois autres crimes. Religion ou un PNJ de secours révèle le motif possible des quatre aspects. L'innocence de Lavarsus reste à établir en jeu.

Cette révélation ne doit pas identifier Pratchett ni un hôtel précis. Elle doit seulement permettre aux PJ d'anticiper que le Festival risque d'être le théâtre d'une nouvelle étape et de préparer notamment la surveillance des cirques et des hébergements.


## Continuité maison — Lavarsus

Dans cette campagne, **le lieutenant Lavarsus est une femme**. Le PNJ canonique et le personnage secondaire plus conciliant ont été fusionnés pour réduire le nombre d'interlocuteurs.

Lavarsus est :
- la cheffe opérationnelle de la **garde de la Falaise** ;
- le contact direct des PJ / aspirants Éclaireurs affectés comme agents spéciaux ;
- la responsable de leur intégration aux interventions locales du Précipice ;
- une figure plus accessible et coopérative que le Lavarsus canonique, tout en conservant son autorité et son expérience.

Toute future préparation doit utiliser **elle / la lieutenant Lavarsus** et ne pas recréer le second officier fusionné.


## Adaptation du Ratisseur et intervention de la Société — 27 novembre 2026

Le but initial de Wakeiwa Atikak est de démontrer au Festival que l'engin, protégé contre la magie instable par ses systèmes planaires, permettra de réhabiliter l'**Étreinte du Tyran**, zone ravagée par l'attaque de 4719. Il s'agit d'une adaptation de la mission canonique d'excavation de cette fosse commune. Pratchett le trafique ; son retour le 11 Kuthona déchaîne une tempête planaire et des manifestations de plusieurs plans. Les PJ sont à proximité, entrent avant le verrouillage, et sont les seuls à pouvoir agir rapidement sur les couplages. Les vétérans à l'extérieur contiennent la tempête, protègent les civils, et pourront intervenir dans le cœur après stabilisation des accès. Fola Barun assure la liaison mentale empathique (pouvoir maison, pas canon attesté) et transmet les indications de Wakeiwa. Eando Kline dirige le confinement ; Ambrus coordonne ; Corvan, Gardétoile, Gorm Granmarteau et Calisro Benarry assurent secours et soutien. Sheila Heidmarch, Aelyra, Galahen, Rovan Dheris et Veska Ornel forment les Chasseurs de l'Étoile. Galahen est le nom définitif du champion et dirigeant du Serment Radieux dans notre continuité ; la fiche PNJ existante a été renommée sans changer son identifiant. Hestriviniaas (ké'ktar niveau 22 dans le canon) ne doit pas être un adversaire direct des aspirants. Les PJ neutralisent la transmission et les distorsions, stabilisent les ancrages et ouvrent l'accès aux vétérans ; arrêt et libération peuvent être contrôlés. Préférer confinement et retour au Maelström à un combat obligatoire contre les captifs.

## État de préparation du 27 novembre 2026

La préparation de Partie 1 a été créée en base, sans séance Discord liée : [ouvrir le conducteur](https://l7r.fr/pf2-mj/session-preparations?preparationId=f0e9ce7b-41d5-4195-bb2c-3a9bd779792b). Les 20 incidents ont des blocs distincts et sont tirés dix fois sans remise. Professeur Zarlian Kyosophus et Dusklight sont les interlocuteurs des deux troupes ; Daring Danika, Viktor Volkano et Jellico Bounce-Bounce appartiennent aux rivaux de la Ménagerie Céleste. Myron ne doit pas être réintroduit après sa mort. La [PR technique #60](https://github.com/ValerianGuivarch/lsr-nestjs-backend/pull/60) a été fusionnée ; le 27 novembre, l'API en production renvoie bien les sept blocs de compteurs typés. La publication réelle dans le chat Foundry reste à tester. Les scènes et Actors Foundry existants n'ont pas été modifiés ; DD, dangers et portraits restent à finaliser. Les modèles restent non joués et les checklists partiellement préparées.


## Ratisseur — conducteur détaillé du 27 novembre 2026

Le modèle de la Partie 1 et la préparation indépendante ont été enrichis en base (révision 6 de la préparation). Les données jouables détaillées restent dans le conducteur SQLite ; aucun événement de cette séance n'est encore considéré joué.

- 22 h : retour du Ratisseur au Parterre d'argent, sauvetage motivant l'entrée avant verrouillage, tempête planaire. Pratchett a programmé le retour par un dispositif occulte fictif ; aucun pilote à bord. Les vétérans ne peuvent percer la coque sans risque pour les captifs et le noyau.
- Parcours fondé sur la carte publiée (tome 6, chapitre L'excavateur fou, pp. 136–149) : A2/A4/A5 (secours et rencontre de Kaeron possédée par Murmure-Dans-l'Éther), A6 (neutraliser le pilotage automatique et vision non interactive du siège Radieux de 1619), A7 (couplage coopératif, instructions et manipulation de cristaux), A8 (second couplage, choix de libération graduelle ou d'isolement forcé), A9 (trois ancrages et levier d'arrêt). Les DD et rencontres de bas niveau sont des propositions maison et doivent être ajustés au groupe réel. Le rapport temporel canonique est simplifié pour coordonner les deux fronts.
- La progression des vétérans est conditionnée par celle des PJ : après A7 la machine ralentit ; après A8 le passage se stabilise ; les Chasseurs ne pénètrent qu'après le signal des aspirants. Fola relie les équipes et transmet les conseils de Wakeiwa. Galahen, Sheila, Aelyra, Rovan et Veska interviennent, tandis qu'Eando maintient le confinement. Hestriviniaas et les deux imenteshs du noyau restent hors du combat direct des aspirants.
- Le combat du noyau est une rencontre à objectifs, avec deux manifestations de quintessence et un danger de niveau adapté (exemple provisoire pour quatre PJ de niveau 2 dans le conducteur). Arrêt d'urgence possible si les ancrages ne sont pas tous sécurisés. La libération contrôlée et le retour au Maelström sont préférés à la destruction des captifs. Le choix appartient aux joueurs.
- Jauge publique de catastrophe de 0 à 6 : dommages cumulés et conséquences graduées, pas de points de vie ni de réparation rétroactive. Les mauvais résultats accélèrent la crise sans bloquer le parcours ; les succès des joueurs et la sécurité préalable limitent les dégâts. Bilan secret MJ provisoire : le vol est acquis ; catastrophe 0–2 aucun bonus additionnel, 3–4 bénédiction grise mineure, 5–6 renforcée (effets de la partie 2 à définir).
- À 22 h 50 : le sceau du Maître Gris sous la plaque étrangère de la console A6 est normalement révélé après l'arrêt, ou plus tôt si les PJ réussissent une investigation ingénieuse. Indice garanti ; Religion ou aide d'un spécialiste pour reconnaître les quatre visages. La victoire et la découverte de la piste norgorbérite ne révèlent ni Pratchett ni l'hôtel et ne constituent pas une preuve de l'innocence de Lavarsus.

À faire : adapter une copie de la carte et des journaux Foundry, créer les manifestations et le danger au niveau réel de la table, tester les compteurs, régler les effets de la bénédiction de Pratchett. Aucune modification des scènes originales. Les statuts de préparation restent partiels.

### Approfondissement opérationnel du Ratisseur (révision 6)

Le conducteur SQLite comprend désormais une description jouable de la réapparition, un parcours respectant le puits A4b et ses trois niveaux, un accès de secours par A1, des conséquences extérieures concrètes, une énigme coopérative des quatre symboles pour A7 et les positions/conditions d'intervention du combat d'A9. Le tri magique des souvenirs des morts de l'Étreinte du Tyran est canonique (tome 6, p.137) ; il sert à montrer la vocation de l'engin au briefing et dans A2. La plaque de rappel occulte, les coordonnées faussées et le choix de cap entre le Parterre d'argent et la voie de service sont des adaptations : le premier expose les attractions, le second réduit le danger pour la foule mais menace les remparts en cas de catastrophe élevée. Les vétérans entrent au signal des PJ après coupure des deux couplages. L'arrêt maîtrisé fait disparaître les manifestations sans exiger de vider leurs PV. La responsabilité de Wakeiwa quant à l'asservissement des protéens reste un choix MJ à confirmer : elle croyait à un accord de service dans la proposition du conducteur. Le bilan et la preuve du Maître Gris sont adaptés aux décisions et résultats réels ; aucun indice n'est artificiellement retardé si les PJ le découvrent avant l'arrêt. Les compteurs existants, les autres scènes du conducteur et la campagne archivée n'ont pas été modifiés. La carte et les Actors Foundry n'ont pas été adaptés à ce stade ; les tâches restantes sont enregistrées dans le module.

### Épreuve coopérative du couplage A — 27 novembre 2026

Décision MJ : remplacer le casse-tête aveugle par une salle de maintenance inspirée de la communication asymétrique. Prototype fixe de 10 min : conduits, trois séries de runes, pulsations Simon en repères de scène, circuit 5×5, molette, régulateur récurrent. Pression initiale 7 %, hausse régulière +5/30 s, erreur +5 et première réussite −10 ; seuil 100 % ou échéance → arrêt d'urgence, convertir en complication de catastrophe au conducteur. Les manuels sont séparés de la console ; un opérateur et les experts, pas de DD obligatoire. Panneau dédié dans Outils MJ du Val Toolkit. Création explicite de la scène de test, pas de modification d'une scène existante. Validation multiclient et déploiement à vérifier avant de remplacer le défi A7 dans le conducteur.


## Partie 2 — conducteur opérationnel (27 novembre 2026)

Le modèle SQLite et la [préparation indépendante de Partie 2](https://l7r.fr/pf2-mj/session-preparations?preparationId=256ff036-d1bd-4b6a-830a-0efb2f558f5d) sont créés, sans séance Discord associée. Huit étapes, 61 blocs, 19 h–23 h. Aucun événement de la partie 1 n'a été présumé effectivement joué dans les données : les vingt textes d'incidents sont conservés à l'identique, retirer les dix titres réellement tirés avant la partie 2. Reporter sécurité, confiance, vainqueur des cirques, catastrophe, dossier Lavarsus et preuves. Ne pas réinitialiser la continuité.

- 19 h : bilan et trois preuves indépendantes pour le réexamen de Lavarsus ; choix des dispositifs de surveillance.
- 19 h 15 : cinq incidents restants ; 19 h 45 : attaque des Noirs Doigts contre le cirque gagnant. Prévention possible avant exposition, sinon défi en trois rounds avec trois objectifs (source, victimes, foule). La troupe rivale n'est pas coupable par défaut. Les indices du matériel ne désignent pas directement Pratchett.
- 20 h 30 : cinq derniers incidents ; 20 h 55 : disparition fraîche, trois voies d'indice vers le Palais des rêves. Nalia Serevan, interprète adulte d'une délégation, est une victime proposée (figurante maison, modifiable). Si les PJ empêchent l'enlèvement, ne pas réimposer une victime.
- 21 h 15 : Palais des rêves minimal, fondé sur le tome 1, pp.46–66 : E1/E2/E3 (réception, bagages, grand hall), E24 (Ralso et journal), E30 (bureau et escalier secret), E31 (cave), E36/E37 (sanctuaire et laboratoire). Les autres pièces et monstres ne constituent plus des obstacles obligatoires. Ralso reste une complice, les poupées des âmes sont écartées du combat obligatoire. Les faux documents de Lavarsus et les correspondances avec le Ratisseur et le cirque sont des preuves maison ajoutées.
- 21 h 50 : un seul combat principal à objectifs, libération de la captive et neutralisation du sceau ; Pratchett alchimiste adapté au niveau réel. Quatre avantages rituels conditionnels, deux avantages directs simultanés au maximum. La réussite des PJ réduit les pouvoirs du boss ; interruption de la progression si Pratchett est empêché d'agir. Poursuite éventuelle courte, sans suite obligatoire. 22 h 40 : preuves, réhabilitation selon le dossier et clôture de Shelyn.

Le niveau du groupe, le choix définitif de la victime, la présence de Hesper et Meitas, les profils mécaniques provisoires et les scènes Foundry restent à valider. Checklist modèle prête, autres critères partiels/à faire ; aucune carte ni Actor Foundry modifié dans cette opération. Les règles maison et conséquences détaillées sont dans le conducteur, pas dans une seconde source de données.
