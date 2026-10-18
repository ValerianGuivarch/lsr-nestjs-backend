# TODO

## Projets

- [ ] Créer une page ou un document d’aide pour les PJ, ainsi qu’une aide pour les MJ.

## Pathfinder 2

- [ ] Supprimer la page web **`/pf2-mj/journaux`**, son entrée de navigation et le routage associé : les journaux d'Absalom seront désormais produits comme **images** à partir du guide `pf2/outils/journaux.md`, puis publiés sur Discord / le wiki selon le besoin.
- [ ] Poursuivre l'audit des scénarios Pathfinder Society pour créer uniquement les **campagnes transverses réellement utiles** qui manquent encore au catalogue ; éviter les regroupements artificiels de deux scénarios simplement parce qu'ils partagent un métaplot lointain.
- [ ] Normaliser les **anciens imports Foundry** dans l'arborescence dérivée du catalogue (`MJ/Campagnes officielles`, `Campagnes transverses`, `Campagnes transverses courtes`, `Scénarios individuels`) et supprimer les anciens dossiers `MJ/Divers/Autres` uniquement une fois qu'ils sont vides et les documents relocalisés.
- [ ] Enrichir progressivement les packages avec les **portraits/tokens présents dans les PDF** et gérer les identités d'affichage secrètes sans révéler prématurément le vrai nom d'un antagoniste ou d'un imposteur.
- [ ] Poursuivre l'audit des **Scenes Foundry importées** et corriger par le pipeline les imports partiels (cas témoin documenté : Sentence d'Extinction volume 1, images présentes sur disque mais non reliées à plusieurs Scenes).


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
