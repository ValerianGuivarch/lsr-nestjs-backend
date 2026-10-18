# TODO

## Projets

- [ ] Créer une page ou un document d’aide pour les PJ, ainsi qu’une aide pour les MJ.

## Pathfinder 2

- [ ] Supprimer la page web **`/pf2-mj/journaux`**, son entrée de navigation et le routage associé : les journaux d'Absalom seront désormais produits comme **images** à partir du guide `pf2/outils/journaux.md`, puis publiés sur Discord / le wiki selon le besoin.
- [ ] Poursuivre l'audit des scénarios Pathfinder Society pour créer uniquement les **campagnes transverses réellement utiles** qui manquent encore au catalogue ; éviter les regroupements artificiels de deux scénarios simplement parce qu'ils partagent un métaplot lointain.
- [ ] Normaliser les **anciens imports Foundry** dans l'arborescence dérivée du catalogue (`MJ/Campagnes officielles`, `Campagnes transverses`, `Campagnes transverses courtes`, `Scénarios individuels`) et supprimer les anciens dossiers `MJ/Divers/Autres` uniquement une fois qu'ils sont vides et les documents relocalisés.
- [ ] Enrichir progressivement les packages avec les **portraits/tokens présents dans les PDF** et gérer les identités d'affichage secrètes sans révéler prématurément le vrai nom d'un antagoniste ou d'un imposteur.
- [ ] Poursuivre l'audit des **Scenes Foundry importées** et corriger par le pipeline les imports partiels (cas témoin documenté : Sentence d'Extinction volume 1, images présentes sur disque mais non reliées à plusieurs Scenes).


### Projet prioritaire — refondre le workflow Discord de planification des séances

**But :** pouvoir repartir de cette section dans une nouvelle discussion et reconstruire proprement tout le workflow de planification, depuis la proposition des disponibilités jusqu'à la création des discussions de mission dans `#objectif-prochaine-mission`, sans dépendre du texte des anciens messages Discord comme pseudo-base de données.

#### État actuel vérifié dans le code — ne pas refaire

Les commandes suivantes existent déjà dans `DiscordCommandsService` :

- `/proposer-date-seance` : propose les jours de la semaine suivante, publie le message de planification, ajoute les réactions de jours + ❌ + ❓ et crée le fil de planification ;
- `/modifier-date-seance` : permet de modifier les jours proposés depuis le fil ;
- `/relancer-date-seance` : distingue déjà correctement **les joueurs sans aucune réponse** et **les joueurs encore sur ❓ « Ne sais pas encore »**, prépare un aperçu privé puis mentionne les deux catégories séparément après validation ;
- `/analyse-date-seance` : lit les réactions, forme des groupes de 4, cherche à maximiser le nombre de groupes sans réutiliser un joueur et favorise à égalité les personnes ayant joué le moins de séances ;
- `/valider-date-seance` : relit la dernière analyse publiée et valide une proposition complète numérotée ;
- `/valider-date-seance-manuel` : solution de secours déjà opérationnelle ; permet de choisir une date de la planification ou une date libre, puis exactement 4 membres Discord, avec aperçu privé avant publication ;
- `/preparer-prochaine-mission` : part d'une séance déjà validée et crée, après confirmation, l'annonce puis le fil `Séance JJ/MM` dans `#objectif-prochaine-mission`.

Le solveur actuel sait représenter certaines égalités sous une forme compacte telle que **« Choisir 2/3 »**. Le défaut connu est que `/valider-date-seance` ne sait relire que des groupes complets numérotés et **rejette explicitement** les lignes `Choisir N/M`. Une analyse valide peut donc produire un affichage que l'étape suivante ne sait pas valider.

La validation manuelle contourne ce défaut, mais elle **ne crée pas encore directement le fil de mission** : il faut encore lancer `/preparer-prochaine-mission`. Elle doit devenir le chemin de secours complet, pas seulement la moitié d'un workflow.

#### Cible fonctionnelle

Le workflow cible doit être un assistant cohérent et, autant que possible, continu :

1. **Proposer les dates** avec `/proposer-date-seance`, puis laisser les joueurs répondre avec les réactions existantes.
2. **Relancer** avec `/relancer-date-seance` en conservant la distinction actuelle :
   - sans réponse ;
   - ❓ « Ne sais pas encore » ;
   - réponse définitive = au moins un jour ou ❌.
3. **Analyser** avec `/analyse-date-seance` en construisant un **snapshot structuré** des disponibilités et des IDs Discord. Le message Discord affiché ne doit plus être la source de vérité du calcul.
4. Présenter les **créneaux réellement jouables** et permettre au MJ d'en sélectionner **un ou plusieurs** dans le même workflow.
5. Pour l'ensemble des créneaux sélectionnés, calculer des groupes de 4 **globalement cohérents** :
   - par défaut, un joueur ne peut apparaître que dans **une seule séance du lot** ;
   - un joueur ne peut être placé que sur une date à laquelle il a réellement indiqué être disponible ;
   - le solveur conserve la priorité actuelle : solutions permettant le plus de séances, puis avantage aux joueurs ayant le moins joué ;
   - si le MJ sélectionne explicitement plusieurs dates, soit toutes peuvent être constituées de façon cohérente, soit le bot doit expliquer que la combinaison est impossible et proposer/revenir à une sélection valide ; ne jamais supprimer silencieusement une date.
6. Lorsqu'il reste plusieurs solutions strictement équivalentes, effectuer **automatiquement le tirage au sort au niveau des solutions complètes**, pas joueur par joueur et pas date par date. Exemple : si deux groupes du lundi et du jeudi se concurrencent sur les mêmes personnes, choisir au hasard une **affectation globale valide**. Cela évite qu'un premier tirage rende le second groupe impossible.
7. Afficher un **récapitulatif privé final** avant toute publication :
   - chaque date retenue ;
   - les 4 joueurs affectés ;
   - les éventuels choix/tirages effectués et leur pool de départ ;
   - les avertissements éventuels ;
   - aucun ping à ce stade.
8. Au clic **Valider**, relire les réactions ou leur version fraîche et vérifier qu'aucune disponibilité déterminante n'a changé depuis le snapshot. Si elles ont changé, bloquer la publication et demander un recalcul plutôt que publier un planning obsolète.
9. Après confirmation finale, faire **dans le même workflow** :
   - publier la ou les séances validées dans le fil de planification avec mentions ciblées ;
   - ajouter le 👍 de validation si ce comportement est conservé ;
   - créer pour **chaque date** l'annonce correspondante dans `#objectif-prochaine-mission` ;
   - créer automatiquement le fil `Séance JJ/MM` ;
   - publier dans le fil le message « Que voulez-vous faire ? » et le rappel de `/choix-quete`.
10. Le MJ ne doit plus avoir à enchaîner manuellement `/valider-date-seance` puis `/preparer-prochaine-mission` dans le cas normal.

#### Validation manuelle à conserver

`/valider-date-seance-manuel` doit rester comme **voie de secours explicite** lorsque l'analyse automatique n'est pas souhaitée ou qu'une décision a été prise hors du solveur.

Travail restant :

- [ ] Réutiliser le même pipeline final que le workflow automatique : **date + 4 joueurs → aperçu privé → confirmation → publication de la séance → création immédiate de l'annonce et du fil dans `#objectif-prochaine-mission`**.
- [ ] Conserver le choix d'une date issue de la planification et l'option **Autre date**.
- [ ] Assumer que le mode manuel peut volontairement outrepasser les réactions de disponibilité, mais afficher clairement un avertissement si les 4 joueurs choisis ne correspondent pas aux réactions du jour lorsque cette comparaison est possible.
- [ ] Garder `/preparer-prochaine-mission` comme commande de **récupération/compatibilité** pendant la migration, puis décider si elle reste utile ou peut être retirée.

#### Refactor technique attendu

- [ ] Introduire des structures métier explicites pour ce workflow, par exemple `PlanningSnapshot`, `PlanningAvailability`, `CandidateSession`, `SessionBatchProposal` et `ValidatedSession`. Les noms exacts peuvent changer, mais les **IDs Discord, dates ISO et disponibilités** doivent vivre dans des objets structurés.
- [ ] Séparer le **calcul** du **rendu Discord**. Les fonctions de solveur doivent recevoir des données structurées et retourner des données structurées ; les messages Markdown Discord ne sont qu'une vue.
- [ ] Ne plus dépendre de `parsePublishedSessionProposals()` pour piloter le nouveau workflow. Le parseur peut rester temporairement pour la compatibilité avec les messages déjà publiés.
- [ ] Remplacer le cas compact `Choisir N/M` comme état intermédiaire textuel par une représentation structurée des différentes solutions ex æquo. Le rendu peut rester compact pour le MJ, mais les solutions complètes doivent rester accessibles au code.
- [ ] Factoriser une seule opération de fin, réutilisable par la validation automatique et manuelle, qui :
  1. produit le message « séances validées » ;
  2. publie avec les mentions autorisées ;
  3. crée les annonces et fils de mission ;
  4. gère les doublons et les erreurs partielles.
- [ ] Rendre le tirage testable : isoler la sélection aléatoire ou injecter la fonction de hasard afin d'écrire des tests déterministes.
- [ ] Vérifier les limites Discord des menus et composants si le nombre de dates ou de solutions augmente ; ne pas concevoir un workflow qui suppose plus d'options qu'un composant Discord ne peut en afficher.
- [ ] Décider si les états d'interaction doivent rester dans les `Map` mémoire actuelles ou être reconstructibles/persistés. Un redémarrage du bot entre l'analyse et la confirmation ne doit idéalement pas produire un état ambigu ; au minimum, le message d'erreur doit demander proprement de relancer l'analyse.

#### Cas métier à couvrir explicitement

- [ ] **Moins de 4 disponibles sur une date** : date non jouable, raison visible.
- [ ] **Exactement 4 disponibles** : groupe déterministe, aucun tirage.
- [ ] **Plus de 4 disponibles avec une meilleure combinaison selon l'historique** : appliquer la priorité « moins de séances jouées » avant le hasard.
- [ ] **Égalité parfaite**, par exemple 2 places pour 3 joueurs équivalents : tirage automatique, détail du tirage dans le récapitulatif privé.
- [ ] **Plusieurs dates avec joueurs communs** : calcul global sans réutilisation d'un joueur.
- [ ] **Sélection de dates incompatible** : ne jamais produire deux groupes qui réutilisent implicitement le même joueur ; expliquer l'impossibilité ou demander une autre sélection.
- [ ] **Joueur disponible plusieurs jours** : il peut servir à n'importe lequel de ces jours, mais une seule fois dans le lot tant que la règle actuelle reste en vigueur.
- [ ] **Évolution future : joueur acceptant plusieurs séances dans la semaine** : ne pas l'implémenter par défaut maintenant, mais éviter de figer le solveur de façon à rendre cette option impossible. Une future préférence explicite pourra autoriser une capacité > 1 par joueur.
- [ ] **❓ uniquement** : joueur non disponible pour le solveur et présent dans la catégorie « en attente » de la relance.
- [ ] **❓ + un jour** : aujourd'hui la relance considère la réponse de jour comme définitive ; conserver ce comportement ou le rendre explicite, mais ne pas le classer « en attente ».
- [ ] **❌ + un jour** : réponse contradictoire à signaler ; ne pas deviner silencieusement l'intention lors de la validation finale.
- [ ] **Réaction modifiée après l'analyse** : snapshot périmé, recalcul obligatoire avant publication.
- [ ] **Dates modifiées avec `/modifier-date-seance` après l'analyse** : même traitement, l'analyse doit être considérée comme périmée.
- [ ] **Date manuelle hors planification** : autorisée uniquement via le mode manuel, avec date ISO validée.
- [ ] **Erreur pendant la création d'un fil après publication de l'annonce** : signaler précisément ce qui a déjà été créé et rendre la reprise idempotente pour éviter les doublons.
- [ ] **Double clic / relance de commande** : détecter les annonces et fils déjà créés pour une validation donnée.
- [ ] **Plusieurs séances validées en une fois** : créer toutes les annonces/fils prévus, avec un bilan final indiquant succès ou échec par date.

#### Notifications et sécurité

- [ ] Conserver les prévisualisations et sélections intermédiaires en **éphémère**, sans mention active.
- [ ] Ne notifier les joueurs qu'au **dernier clic de confirmation**.
- [ ] Utiliser `allowedMentions.users` avec uniquement les IDs des joueurs réellement affectés ; éviter `@everyone` pour la validation et la création de mission.
- [ ] Garder l'ensemble des commandes de préparation/validation réservé aux admins/MJ.
- [ ] La relance reste une action séparée : son aperçu est silencieux, puis seuls les joueurs « sans réponse » ou « en attente » sont mentionnés après confirmation.

#### Tests d'acceptation minimum

- [ ] Une date avec 4 joueurs : analyse → sélection → récapitulatif → validation → annonce + fil de mission créés sans commande supplémentaire.
- [ ] Une date avec « choisir 2 parmi 3 » : le workflow ne bloque plus sur `Choisir N/M`, effectue un tirage valide et peut aller jusqu'à la création du fil.
- [ ] Deux dates avec des candidats qui se chevauchent : le tirage/solveur produit deux groupes disjoints ou annonce que la sélection conjointe est impossible.
- [ ] Plusieurs solutions ex æquo : seules des **solutions complètes valides** participent au tirage.
- [ ] Un joueur moins prioritaire selon le nombre de séances jouées n'entre dans le tirage que si les solutions sont réellement à égalité après application du score.
- [ ] Une disponibilité change entre aperçu et validation : aucune publication n'est faite et le MJ est invité à recalculer.
- [ ] `/relancer-date-seance` continue de séparer correctement « sans réponse » et ❓.
- [ ] `/valider-date-seance-manuel` va jusqu'à la création du fil de mission sans nécessiter `/preparer-prochaine-mission`.
- [ ] Aucun ping avant confirmation ; après confirmation, seules les personnes des séances finales sont mentionnées.
- [ ] Un second clic ou une reprise après erreur ne crée pas deux annonces/fils identiques.
- [ ] Les anciens messages « proposition N » déjà publiés restent utilisables tant que la compatibilité legacy est conservée.

#### Fichiers à examiner dans la prochaine discussion

- `apps/api-jdr/src/discord/DiscordCommandsService.ts` — implémentation actuelle des commandes, solveur, états d'interaction et création des fils ;
- `apps/api-jdr/src/discord/DiscordCommandsService.spec.ts` — tests existants à étendre avant le refactor ;
- éventuellement les helpers d'identité Discord/PJ utilisés par ce service si le refactor extrait le workflow hors de la classe principale.

**Résultat attendu :** un seul chemin normal **planification → analyse → sélection d'un ou plusieurs créneaux → résolution automatique des égalités → aperçu → validation → discussions de mission**, plus un chemin manuel de secours qui aboutit au même résultat final.


### Projet futur — améliorer la gestion Discord

**Objectif :** réduire la surcharge de notifications et rendre les commandes/salons plus lisibles, avec des règles cohérentes plutôt qu'une accumulation de cas particuliers.

**Audit à mener :**

- [ ] Inventorier **toutes les commandes Discord PF2** à partir du code courant et décider, pour chacune, si elle doit être réservée au MJ/admin ou accessible aux joueurs.
- [ ] Pour chaque commande qui publie quelque chose, décider si elle doit publier immédiatement ou passer par une **prévisualisation / validation** avant envoi public.
- [ ] Pour chaque commande, préciser sa politique de **mentions et notifications** : `@everyone`, rôle ciblé, joueurs concernés seulement, ou aucune mention.
- [ ] Auditer les salons, forums et fils pour les classer en trois usages : **action requise / notification forte**, **information à lire sans urgence**, **archive / information passive**.
- [ ] Identifier les salons où seuls le MJ ou le bot doivent écrire, ceux où les joueurs peuvent répondre, et ceux qui pourraient être supprimés, fusionnés ou simplifiés.
- [ ] Vérifier si des **rôles de notification optionnels** (par exemple planning, quêtes, lore) seraient utiles, sans remplacer les rares notifications réellement obligatoires.
- [ ] Définir une règle commune pour les annonces de séance : nouvelle proposition, relance, validation, préparation de mission et changement de dernière minute ne doivent pas tous notifier de la même manière.
- [ ] Définir une règle commune pour les contenus non urgents : choix de quête, compte rendu de quête, journaux, résumés, lore et publications de référence devraient être silencieux par défaut sauf besoin explicite.
- [ ] Vérifier l'usage de `allowedMentions` et privilégier les **mentions ciblées** aux joueurs réellement concernés plutôt que `@everyone`.
- [ ] Rédiger à la fin une **consigne simple pour les joueurs** sur les réglages Discord recommandés (par exemple serveur en « mentions uniquement », puis exceptions volontaires), uniquement si l'organisation côté bot ne suffit pas.
- [ ] Documenter la matrice finale **commande → destination → droits → validation → notification** et **salon/forum → rôle → niveau de notification** avant de modifier massivement le comportement du bot.

**Principe directeur :** un ping doit signifier qu'une action ou une attention rapide est réellement attendue. Les autres messages doivent rester consultables sans provoquer de notification inutile.


### Projet futur — élargir et présélectionner la bibliothèque de ressources MJ

**Point de départ déjà en place — ne pas refaire :**

- la section métier **Ressources** existe dans PF2-MJ et est distincte du Catalogue ;
- SQLite est la source de vérité via `pf2_resource`, `pf2_resource_file` et `pf2_resource_link` ;
- une ressource gère titre français, `nom_vo`, description courte, résumé détaillé, origine, tags, favori, plusieurs PDF et rattachements optionnels à une campagne, un scénario ou un composant jouable ;
- recherche, filtres tag/origine, filtre **Favoris uniquement**, étoile de favori et export JSON sont déjà disponibles ;
- **Trilemma Adventures est déjà intégré** : 53 ressources, `TRI-001` à `TRI-053`, sans trou ni doublon de `nom_vo` au contrôle du 18 octobre 2026 ;
- les PDF source Trilemma ont été regroupés dans `pf2-data/Ressources/Trilemma`, tandis que les fichiers réellement attachés aux ressources sont gérés par le stockage applicatif ;
- lorsqu'une aventure possède plusieurs variantes PDF, l'objectif est de conserver une seule ressource métier avec plusieurs fichiers plutôt que plusieurs doublons.

**Objectif du projet futur :**

Construire une grande bibliothèque d'inspiration MJ sans transformer PF2-MJ en dépôt de centaines de fiches médiocres ou redondantes. Les sources massives doivent d'abord alimenter un **index léger de candidats** ; seules les meilleures entrées deviennent ensuite des ressources complètes.

**Sources à étudier, par ordre approximatif de priorité :**

1. **One Page Dungeon Contest** — priorité suivante ; plusieurs centaines d'entrées, très bon terrain pour tester le préfiltrage.
2. **DiceAverageRPG – Free One-Page Adventures** — catalogue plus petit et facile à parcourir.
3. **1pagedungeons (itch.io)** — one-page dungeons et anthologies system-neutral.
4. **d4 Caltrops** — wilderness hexes, rencontres, lieux et tables ; probablement à indexer différemment des scénarios.
5. **Dyson Logos** — surtout cartes de donjon ; déterminer quand une carte seule mérite une fiche ou doit rester une simple source graphique.
6. **Watabou / Procgen Arcana** et **donjon** — conserver principalement comme générateurs/outils, sans import massif.
7. **The Alexandrian** — conserver comme référence méthodologique, pas comme collection de ressources unitaires.

Liens de départ connus :

- Trilemma Adventures : `https://blog.trilemma.com/search/label/adventure?m=1`
- One Page Dungeon Contest : `https://www.dungeoncontest.com/`
- DiceAverageRPG : `https://diceaveragerpg.itch.io/`
- 1pagedungeons : `https://1pagedungeons.itch.io/`
- d4 Caltrops : `https://blog.d4caltrops.com/`
- Dyson Logos : `https://dysonlogos.blog/`
- Watabou : `https://watabou.itch.io/`
- donjon : `https://donjon.bin.sh/`
- The Alexandrian : `https://thealexandrian.net/`

**Travail restant :**

- [ ] Pour chaque source, vérifier le mode d'accès réel : index HTML, PDF individuels, compilations, ZIP éventuels, liens directs et stabilité des URL.
- [ ] Vérifier licences, attribution et conditions de réutilisation avant toute collecte ou copie en masse ; ne pas automatiser un téléchargement lorsque les droits ou l'accès sont ambigus.
- [ ] Définir un identifiant stable par source pour les futures ressources, sur le modèle `TRI-001`, sans figer les nouveaux préfixes avant d'avoir choisi la structure globale.
- [ ] Concevoir l'**index léger de candidats**. Il ne doit pas être confondu avec `pf2_resource`. Son support reste à choisir : JSON versionné, table SQLite dédiée ou autre structure simple.
- [ ] Pour chaque candidat, conserver au minimum : source, titre VO, lien ou chemin source, pitch d'une phrase, quelques tags, type de lieu/contenu et évaluation rapide.
- [ ] Ajouter si utile des métadonnées de présélection : durée approximative, environnement, tonalité, présence d'une carte, degré d'adaptation nécessaire à Golarion/PF2, et éventuelle redondance avec une ressource existante.
- [ ] Définir puis tester une notation simple. Hypothèse de départ à valider : originalité, réutilisabilité dans Golarion, intérêt pour table ouverte, jouabilité en environ 1 à 3 séances, qualité du lieu/de la carte et absence de redondance.
- [ ] Tester un seuil de présélection autour de **7/10** plutôt que d'importer tout ce qui existe.
- [ ] Sur une grosse collection comme One Page Dungeon Contest, viser d'abord un entonnoir indicatif : plusieurs centaines de candidats → environ 50 à 100 présélectionnés → environ 20 à 40 ressources complètes. Ces chiffres sont des ordres de grandeur à ajuster après le premier lot.
- [ ] Dédupliquer avant promotion : variantes, éditions système, traductions et révisions d'une même aventure doivent autant que possible devenir plusieurs fichiers d'une seule ressource.
- [ ] Lors de la promotion d'un candidat, générer la fiche complète au standard actuel : titre français, `nom_vo`, description courte, résumé MJ détaillé en plusieurs paragraphes, origine, tags pertinents, fichiers, puis rattachements seulement s'ils sont réellement utiles.
- [ ] Décider si les traductions PDF doivent être générées/conservées systématiquement ou seulement à la demande ; le modèle actuel accepte déjà plusieurs PDF par ressource.
- [ ] Prévoir une procédure d'ingestion par lot depuis un dossier/ZIP afin d'éviter de recréer manuellement le travail fait pour Trilemma.
- [ ] Faire en sorte qu'une recherche future puisse interroger d'abord les **ressources complètes**, puis l'**index de candidats**. Un candidat particulièrement adapté à une demande (« ruines azlantes », « enquête urbaine », « donjon maritime », etc.) pourra alors être promu à la demande.
- [ ] Évaluer s'il faut exposer cet index léger dans PF2-MJ ou simplement l'inclure dans un export destiné à l'IA ; ne pas alourdir l'interface avant d'avoir validé le besoin réel.
- [ ] Après le premier test One Page Dungeon, réévaluer les critères et ne conserver que ce qui améliore réellement la recherche et la préparation de parties.

**Résultat attendu :**

Une bibliothèque complète qui reste petite et de qualité, complétée par un catalogue de candidats beaucoup plus large. Le but n'est pas de posséder tous les PDF, mais de pouvoir répondre rapidement à une demande de préparation (« qu'est-ce que j'ai pour des ruines azlantes ? », « un petit scénario dans un marais ? », « une auberge inquiétante ? ») sans relire des centaines de documents.
