# TODO

## Projets

- [ ] Créer une page ou un document d’aide pour les PJ, ainsi qu’une aide pour les MJ.

## Pathfinder 2

- [ ] Supprimer la page web **`/pf2-mj/journaux`**, son entrée de navigation et le routage associé : les journaux d'Absalom seront désormais produits comme **images** à partir du guide `pf2/outils/journaux.md`, puis publiés sur Discord / le wiki selon le besoin.
- [ ] Poursuivre l'audit des scénarios Pathfinder Society pour créer uniquement les **campagnes transverses réellement utiles** qui manquent encore au catalogue ; éviter les regroupements artificiels de deux scénarios simplement parce qu'ils partagent un métaplot lointain.
- [ ] Normaliser les **anciens imports Foundry** dans l'arborescence dérivée du catalogue (`MJ/Campagnes officielles`, `Campagnes transverses`, `Campagnes transverses courtes`, `Scénarios individuels`) et supprimer les anciens dossiers `MJ/Divers/Autres` uniquement une fois qu'ils sont vides et les documents relocalisés.
- [ ] Enrichir progressivement les packages avec les **portraits/tokens présents dans les PDF** et gérer les identités d'affichage secrètes sans révéler prématurément le vrai nom d'un antagoniste ou d'un imposteur.
- [ ] Poursuivre l'audit des **Scenes Foundry importées** et corriger par le pipeline les imports partiels (cas témoin documenté : Sentence d'Extinction volume 1, images présentes sur disque mais non reliées à plusieurs Scenes).


### Projet futur — vocal et webcams intégrés à Foundry (LiveKit)

**Objectif :** proposer aux joueurs une interface unique Foundry pour la carte, le vocal et les petites webcams, sans obligation d'utiliser le vocal Discord. Capacité cible : 4 à 6 joueurs habituels, jusqu'à 10 exceptionnellement. Discord reste la solution de secours.

**Contexte vérifié (21/10/2026) :** Foundry V14.365 sous Docker sur mini-PC i5-8500T / 8 Go RAM ; environ 4,2 Go disponibles à l'audit ; liaison Ethernet 1 Gbit/s ; test Internet ponctuel ≈ 267 Mbit/s descendants, 122 Mbit/s montants, latence ≈ 12,4 ms sans perte de paquets. Ces mesures ne garantissent pas les performances sous charge. Vérification HTTPS à poursuivre (certificat non validé depuis le mini-PC lors du test).

**Plan d'exécution (aucune installation effectuée) :**

- [ ] Vérifier sur l'installation réelle la compatibilité du module LiveKit AVClient avec la version précise de Foundry/PF2e, ainsi que les possibilités d'interface et l'état du HTTPS/certificat.
- [ ] Préparer un serveur LiveKit **Docker isolé sur le mini-PC** (hypothèse de départ, à confirmer après les vérifications), avec configuration, secrets, sauvegarde et retour arrière ; ne pas perturber les services LSR/Foundry existants.
- [ ] Mettre en place l'accès réseau sécurisé : sous-domaine dédié envisagé (`livekit.l7r.fr`), WSS/TLS, UDP et éventuellement TURN/TCP ; vérifier NAT et besoins d'ouverture de ports.
- [ ] Installer et paramétrer le client LiveKit dans Foundry, conserver Discord comme solution de secours, vérifier autorisations navigateur micro/webcam.
- [ ] Tester à 2–3 utilisateurs puis 4–6 et si possible 10 : qualité vocale, latence/jitter, coupures, consommation CPU/RAM, débit montant, fiabilité derrière NAT.
- [ ] Valider une interface compacte avec webcams réductibles/masquables, portraits fixes en absence de caméra et mise en évidence de la personne qui parle ; préférer les fonctions/modules existants avant du développement sur mesure.
- [ ] Documenter exploitation, démarrage, arrêt, restauration et procédure de secours ; décider de l'activation durable après essai.

**Répartition :** ChatGPT peut auditer, préparer Docker/réseau/configuration, surveiller et documenter via les accès autorisés ; le MJ intervient pour les réglages Freebox/DNS si non accessibles, l'autorisation micro/webcam, les tests joueurs et la validation du rendu. Aucune modification de production sans validation explicite.

### Planification Discord des séances — refonte et correctif des régressions (23/10/2026)

**Objectif :** une proposition de disponibilités, un calcul privé côté MJ et **une seule annonce par séance** dans `#objectif-prochaine-mission`. Aucune annonce intermédiaire de groupe dans le fil de planification, donc aucun second ping de validation.

**Parcours opérationnel :**

1. `/proposer-date-seance` publie les dates et réactions ; `/modifier-date-seance` ajuste la planification ; `/relancer-date-seance` distingue les joueurs sans réponse et les ❓.
2. `/analyse-date-seance` lit les réactions et l'historique des séances, affiche les **joueurs nommément, leurs nombres de séances jouées, les groupes optimisés et les éventuelles égalités**, puis propose au MJ un menu privé de sélection d'une ou plusieurs dates, sans ping. Les analyses dépassant la limite Discord sont complétées par des messages privés supplémentaires.
3. Le solveur constitue des groupes de 4 : il maximise le nombre de séances, ne réutilise pas de joueur dans un même lot, respecte les réactions des jours et privilégie ceux qui ont le moins joué. **Le tirage n'est jamais automatique** : s'il reste plusieurs solutions globalement optimales, le MJ peut choisir une proposition nominative ou demander explicitement un tirage au sort entre solutions complètes. Une pagination permet de consulter d'autres propositions. Au-delà de 100 solutions, le solveur conserve un échantillon par réservoir.
4. Si la combinaison des dates est impossible, le MJ peut refaire sa sélection dans le menu, sans publication.
5. Le MJ examine l'**aperçu privé** des dates et groupes, peut modifier son choix, puis valide. Le bot **accuse réception du clic immédiatement**, avant de relire le message initial, les disponibilités et les réponses ❌. En cas de modification, il bloque la publication et demande de relancer l'analyse ; en cas d'erreur de publication, il conserve l'état pour proposer **Réessayer** sans republier les annonces déjà présentes.
6. La confirmation MJ crée directement chaque annonce dans `#objectif-prochaine-mission`, avec mentions limitées aux joueurs retenus, puis un fil `Séance JJ/MM`. Le même message demande ✅/❌ pour confirmer la présence et renvoie à `/choix-quete` pour choisir la mission. Le fil sert à la discussion.
7. Les réactions ✅/❌ sur l'annonce actualisent **sans ping** son statut : confirmations reçues, désistements, attente, groupe complet ou réponses contradictoires.
8. `/modifier-groupe-seance`, réservé au MJ dans le fil, ajoute ou retire un joueur en modifiant **la même annonce** ; seul le nouveau joueur est mentionné. Les changements manuels ne sont pas limités à quatre participants.
9. `/valider-date-seance-manuel` constitue une séance sans solveur (date de planification ou autre date) et suit la même opération finale. `/valider-date-seance` reste pour les anciennes analyses publiées. **`/preparer-prochaine-mission` est supprimée.**

**Comportement technique et notifications :**

- Tous les menus de sélection et aperçus restent éphémères. Seul le dernier clic de confirmation du MJ crée l'annonce publique. Le bot utilise `allowedMentions.users` avec les joueurs concernés ; les actualisations de statut sont silencieuses.
- Les structures de groupe conservent dates, IDs Discord et disponibilités. Les anciennes analyses restent lisibles via leur commande de compatibilité, mais le nouveau parcours ne parse plus un affichage `Choisir N/M` pour valider.
- La publication utilise un marqueur `[PF2-SESSION:YYYY-MM-DD]` pour éviter de dupliquer une annonce récente et reprendre un fil partiellement créé.
- Les menus intermédiaires restent en mémoire du bot : après redémarrage, il faut relancer l'analyse. Un ancien bouton ne déclenche pas de publication hasardeuse.

**Vérifications :** compilation TypeScript, build Nx `api-jdr`, tests Jest `DiscordCommandsService.spec.ts` (62 réussis au dernier contrôle local après les correctifs du 23 octobre 2026). Les essais de bout en bout sur le véritable serveur Discord et la confirmation du déploiement automatique restent à vérifier.

**Points de vigilance ultérieurs (non bloquants) :**

- Vérifier le comportement réel des réactions et notifications dans le salon de test MJ, sans ping sur le serveur public.
- L'antidoublon consulte actuellement les 100 messages récents du salon : une recherche plus ancienne ou une clé métier persistée améliorera la reprise dans un salon très actif.
- Si une interaction d'analyse doit survivre aux redémarrages du bot, prévoir une persistance dédiée de ses snapshots et sélections.

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
