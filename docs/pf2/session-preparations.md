# Préparation de séance — application MJ

[← Outils PF2](../../OUTILS.md) · [Journal et campagnes](../../CAMPAGNES.md)

## But et périmètre V1

La page **Préparation séance** (`/pf2-mj/session-preparations`) est un conducteur MJ **entièrement manuel**. Elle ne lit ni ne génère de préparation par IA ; l'import PDF/IA est expressément hors périmètre de cette version. Elle reste distincte de **Préparation technique** (`/pf2-mj/prepare`), consacrée aux ressources PDF/Foundry.

Le Journal MJ expose un lien **Préparer une séance** sur les œuvres suivies. On peut aussi créer une préparation indépendamment, puis la rattacher à une campagne, un scénario et une séance Discord au moment opportun. Les liaisons sont des identifiants : elles ne dupliquent pas les données des campagnes, PNJ, scènes ou objets.

Chaque préparation comprend titre, objectif général et étapes ordonnées. Une étape possède titre, horaire indicatif, notes, état `jouée` et blocs ordonnés de types :

- **Personnage** (lien vers PNJ MJ existant, ou figurant temporaire avec **nom, ascendance et portrait**) ;
- **Lore**, avec indicateur secret MJ ;
- **Loot**, quantité et état ;
- **Rencontre**, avec référence Foundry textuelle ;
- **Texte libre** et **Checklist**.

Le mode **Édition** est ouvert par défaut ; l'autre mode, **Vue**, conserve ordre et contenu sans champ de saisie. La vue permet les actions ponctuelles **Marquer jouée/Terminé** et **Partager personnage**. Les changements sont enregistrés explicitement en édition ; le partage enregistre d'abord les modifications en attente. Une révision numérique refuse l'écrasement silencieux d'une sauvegarde concurrente.

Les figurants temporaires sont stockés *uniquement dans la préparation* **tant qu'on ne déclenche pas explicitement leur conversion**. Leur partage seul ne crée ni fiche PNJ MJ, ni Actor Foundry, ni fiche wiki. La création d'une fiche wiki reste une action explicite distincte depuis la carte Discord/Foundry.

**Ascendance et portrait (12 novembre 2026).** Tout personnage temporaire de préparation possède un champ libre **Ascendance (pour le portrait)**, affiché en édition et en lecture. Le renseigner même si le portrait n'existe pas encore : « Humain », « Gnome », « Elfe », etc. Lorsque le scénario ne précise pas l'ascendance, inscrire **« Inconnue »**, ou une proposition explicitement signalée **« Humain (choix MJ) »** ; le nom du PNJ seul n'est jamais une preuve. Le champ persiste avec le reste du bloc et est repris si le personnage devient permanent.

**Bouton « Enregistrer comme PNJ permanent » (12 novembre 2026).** Disponible **uniquement sur les personnages temporaires**, à côté de **« Partager · Discord + Foundry »**. Le bouton affiche une confirmation claire : il **crée une fiche PNJ globale privée dans le référentiel MJ** et **lie le bloc à son nouvel `npcId`**, sans publication sur Discord, Foundry ou wiki. Le nom, l'ascendance, le portrait asset Foundry et les notes de scène sont conservés (ces notes sont versées au champ **`notes` MJ**, et **pas dans la description publique**). Les champs non connus prennent les valeurs neutres existantes (« Inconnue » pour la classe, etc.). Après conversion, le sélecteur indique la fiche liée et le bouton devient un lien **« Ouvrir la fiche MJ »**. Le PNJ est global afin de pouvoir être réutilisé dans plusieurs scénarios, indépendamment du fait que les joueurs l'aient rencontré.

**Sécurité et intégrité :** la promotion est effectuée dans **une seule transaction SQLite** (insertion de `pf2_record` et mise à jour de `pf2_session_preparation`) avec révision optimiste ; rejouer la même requête sur un bloc déjà converti n'ajoute pas de deuxième PNJ. Un portrait n'est transférable en fiche permanente que s'il est déjà un asset local `assets/l7r/portraits/pnj/...` ; une URL HTTPS externe doit être importée d'abord avec **« Choisir un portrait »**, pour éviter qu'une fiche permanente perde son image. Le partage Discord/Foundry reste volontaire et indépendant.

**Portraits temporaires (29 octobre 2026).** En mode Édition, un personnage sans fiche MJ peut recevoir un portrait via **Choisir/Remplacer le portrait**, glisser-déposer ou collage d'une image sur la vignette. Formats PNG, JPEG, WebP et GIF, jusqu'à **10 Mo** ; l'alternative URL HTTPS/asset Foundry reste proposée. L'upload réutilise l'API existante `POST /api/pf2-mj/pnj/portrait` et la validation/conversion des images : l'identifiant de fichier `prep-<preparationId>-<blockId>` est propre à la préparation, **sans création de PNJ**, et le fichier est placé sous `assets/l7r/portraits/pnj/`. L'aperçu de la préparation lit les fichiers via `GET /api/pf2-mj/portraits/:filename`, en édition comme en vue. Après upload, cliquer sur **Enregistrer le portrait** (ou sur Enregistrer en haut) pour sauvegarder la référence du fichier dans la préparation ; un upload non suivi d'une sauvegarde peut laisser une image orpheline.

**Collage et enregistrement explicite (29 octobre 2026).** Cliquer sur la vignette du personnage temporaire lui donne le focus (contour visible), puis **Ctrl+V** colle immédiatement une image depuis le presse-papiers. Après upload ou saisie de l'URL, le bouton local **Enregistrer le portrait**, placé sous l'URL, enregistre la préparation dans SQLite et affiche la confirmation. L'URL ou le chemin Foundry restent présents après actualisation. Le bouton global Enregistrer reste disponible pour les autres modifications ; en présence de modifications non enregistrées, le navigateur avertit avant de rafraîchir ou fermer l'onglet. Les tests `SessionPreparations.test.tsx` couvrent le clic+collage et l'enregistrement d'URL avec rechargement du composant.

**Correction d’isolement des portraits (29 octobre 2026).** L'upload multipart doit envoyer le champ `pnjId` **avant** le fichier. Le contrôleur consomme intégralement le flux du fichier **avant** de lire `file.fields.pnjId`, car Fastify ne peuple pas nécessairement les champs arrivant après le fichier avant sa lecture. Il refuse désormais un identifiant absent plutôt que de retomber silencieusement sur `pnj.webp`. La même correction de l'ordre des champs s'applique à la création manuelle des PNJ du catalogue. Des tests vérifient que deux personnages obtiennent des noms distincts et qu'un identifiant manquant bloque l'écriture.

**Données existantes :** dans la préparation « L'Âge des Cendres », Greta, Rinna et Helba avaient déjà reçu la référence commune `assets/l7r/portraits/pnj/pnj.webp` avant la correction. Leurs images ont donc pu s'écraser et **ne peuvent pas être réattribuées de façon fiable à partir de ce fichier unique**. Les références ne sont pas effacées automatiquement : l'éditeur affiche un avertissement et le MJ doit réimporter une image pour chaque personnage afin d'obtenir des fichiers indépendants. Les scènes et leurs textes ne sont pas affectés.

Lors du partage, le backend lit l'asset local pour le joindre à la présentation Discord. L'URL de la pièce jointe Discord est ensuite enregistrée par `savePresentationMessage` et le Toolkit Foundry utilise cette même image. Aucune fiche PNJ/Actor n'est créée à cette occasion.


## Salon Discord de la séance

Après la création effective d'un brouillon par `/debut-seance`, le backend enregistre **l'ID de la séance, l'ID du salon/fil et l'ID du serveur Discord** dans `pf2_session_discord_context`. La simple invocation ou l'annulation du formulaire ne mémorisent aucun salon. `/fin-seance` date la fin du contexte mais conserve l'association historique. Une séance terminée n'est plus une destination de partage.

Si la préparation est liée explicitement à une séance, son salon enregistré est utilisé. Sinon, le partage est permis uniquement si **une seule séance active** possède un salon ; en cas d'ambiguïté, l'interface demande de sélectionner la séance. La page affiche la destination connue et interdit le partage lorsqu'aucune destination valide n'est disponible.

Le bouton unique **Partager · Discord + Foundry** :

1. relit le bloc Personnage réellement enregistré dans SQLite ;
2. charge nom/portrait **depuis le PNJ source** si un identifiant est lié, ou depuis le bloc temporaire ;
3. envoie un message du bot dans le salon mémorisé, comme `/personnage` : nom affiché/masqué, portrait, sélection de faction si non publié, bouton **Créer/Publier/Voir la fiche** ;
4. enregistre l'ID du message Discord avec `PlayerCodexService.createPresentation` / `savePresentationMessage` ;
5. laisse le Toolkit Foundry répliquer **la même présentation** via son mécanisme existant (1 s en séance, 30 s hors séance, reprise après reconnexion).

Le succès immédiat API signifie **Discord envoyé, Foundry en attente**, et non une preuve que Foundry a déjà affiché le message. La publication n'utilise pas deux identités PNJ concurrentes. Chaque nouvelle action volontaire de partage crée un nouveau message ; les présentations supprimées de Foundry ne sont pas republiées automatiquement.

## Persistance et accès

Migration `049-session-preparations-and-discord-channel` :

- `pf2_session_preparation` : `id`, `title`, `campaign_id`, `scenario_id`, `session_id`, `body_json`, `revision`, dates ;
- `pf2_session_discord_context` : `session_id`, `channel_id`, `guild_id`, `started_at`, `ended_at`.

Le schéma JSON des étapes et blocs est validé côté API (longueurs, types, unicité des identifiants, nombres maximum de blocs/étapes). L'API est sous `/api/pf2-mj/session-preparations` avec `GET` liste/détail/sessions, `POST` création/partage/**promotion `:id/promote/:blockId`**, `PATCH` modification, `DELETE` suppression.

**Accès :** cette V1 fonctionne sans clé supplémentaire à saisir : elle suit le même modèle d'accès que l'application MJ actuelle. **Limite de sécurité :** l'application et ses API n'ont actuellement pas d'authentification MJ centralisée. Les routes de préparation contiennent des secrets narratifs et le partage déclenche une publication Discord : prévoir une authentification centralisée pour l'ensemble du portail plutôt qu'une seconde clé propre à cette page. Ne pas confondre absence d'usage par les joueurs et restriction technique d'accès.

## Exploitation et vérifications

- L’interface de préparation ne demande plus de clé distincte. Une authentification MJ commune au portail et à ses API reste nécessaire pour protéger durablement les contenus confidentiels.
- Ouvrir la page puis créer et enregistrer une préparation ; choisir une séance dont le canal est affiché ; partager un personnage lié ou temporaire.
- Vérifier que le message apparaît dans le **salon exact** où `/debut-seance` a créé le brouillon, puis côté Foundry ; contrôler le cas nom masqué et l'absence de doublon après effacement du chat.
- Vérifier également qu'une séance terminée ne permet plus de partager et qu'une création de fiche depuis Discord/Foundry reste fonctionnelle.

Les tests unitaires SQLite couvrent CRUD, révisions, salon mémorisé/clos, création d'une présentation Discord simulée, absence de PNJ permanent pour un simple partage et promotion explicite avec contrôle du portrait, de l'ascendance, de l'idempotence et des conflits de révision. **Un test de bout en bout dans le navigateur et sur Discord/Foundry est encore nécessaire après déploiement.**

## Exemple saisi directement dans la base (29 octobre 2026)

Une préparation « **L’Âge des Cendres — Séance 1 · Brèchemur / Altaerein** » a été créée dans la base du mini-PC depuis le PDF MJ fourni, avec **9 étapes et 65 blocs** (personnages, notes, lore, secrets, rencontres, loot et checklist). Elle pointe vers la campagne catalogue `age-of-ashes`, et n’est **pas** associée artificiellement à une séance Discord passée : son `session_id` est nul jusqu’à `/debut-seance` et le choix de séance dans l’éditeur. Warbal, Alak et Voz sont liés aux PNJ MJ existants ; Calmont, Greta et Helba sont laissés temporaires en l’absence de fiche correspondante dans le référentiel consulté. Certains portraits temporaires sont encore à fournir par le MJ.

ID de la préparation exemplaire : `15eb2bb6-7e62-482b-9f96-57b080fddd79`. Le script d’import reproductible et **idempotent** est `scripts/pf2/import-age-of-ashes-session1.py`. Il vérifie si le titre/la campagne existent déjà avant de créer l’exemple, sans écraser les modifications faites ensuite dans l’interface. Le script historique cible le backend déployé avec clé de préparation ; après retrait de la saisie de clé en V1, cette clé n’est plus exigée par la version courante de l’API.

### Organisation conseillée pour les conducteurs MJ (retour de séance, 29 octobre 2026)

La fiche d'exemple a d'abord été importée avec 9 étapes et 65 micro-blocs, puis simplifiée à **6 étapes et 12 blocs** après révision humaine. Dans ce type de préparation, privilégier les scènes structurantes ; **regrouper mission, description et enjeux sous le PNJ qui les présente**, sans répétition de sa fiche. Mettre les salles annexes dans **un seul guide de lieu**, repérées par numéro avec leurs créatures et leur butin ; ne détacher une salle en scène propre que lorsqu'elle porte un événement majeur. Réunir le lore par thème et réduire les checklists purement narratives. Cette organisation n'est pas une limitation du modèle de données : l'éditeur conserve la liberté de créer autant d'étapes et de blocs que nécessaire pour d'autres séances.

L'état runtime de référence est dans SQLite ; le script ponctuel `storage/backups/pf2-session-preparations/compact-age-cendres-session1.py` documente la transformation appliquée et ne peut être rejoué sur une révision ultérieure. L'ancienne version est sauvegardée sous `storage/backups/pf2-session-preparations/age-cendres-session1-before-compact-rev-9.json` sur le mini-PC. Les noms corrigés dans cette préparation sont **Brèchemont** et **Impétueux-Bafouilleurs**.

**Plusieurs préparations simultanées :** aucun index unique sur campagne/scénario/séance ; chaque préparation possède un UUID distinct. La page affiche la liste des préparations enregistrées et permet de sélectionner celle à modifier, ou de l’ouvrir directement avec `?preparationId=<UUID>`. Les révisions optimistes empêchent qu’une ancienne sauvegarde écrase la nouvelle.

## Complément aux préparations : aide tactique MJ (12 novembre 2026)

Pour chaque rencontre à jouer, en particulier si elle comporte des pouvoirs, des objets alchimiques, des réactions ou des **sorts**, inscrire dans le bloc de rencontre ou dans la **note de la pièce Foundry** une **courte tactique en 2–4 lignes** : première action marquante, capacité à combiner, emploi du terrain et attitude à la défaite. Garder les **données complètes et cliquables** dans l'Actor (spells/Items/attacks et leurs DD, rangs, quantités et consommations), sans les réduire à un commentaire narratif. La section privée **« Comment le jouer (MJ) »** doit aussi exister sur la fiche Actor pour pouvoir agir sans connaître immédiatement tout le système PF2e.

**Adapter les rencontres au groupe réellement prévu** : nombre et niveau de PJ, budget d'XP, éventuels dangers complexes et créatures produites ou invoquées. Lorsque la connexion Foundry est bloquée, documenter le plan mais ne jamais présenter les statblocks comme créés ou testés. Voir [Foundry](../../pf2/outils/foundry.md).

## Convention MJ — préparation compacte et rôle des cartes (12 novembre 2026)

**Décision de fonctionnement pour les préparations futures**, à appliquer quand le MJ demande « prépare la séance », en gardant la liberté d'en dévier pour une séance particulière.

### Conducteur de 19 h à 23 h

- Le **créneau par défaut est 19 h–23 h** (4 heures), sauf instruction différente. Proposer des horaires indicatifs réalistes, à ajuster selon le roleplay et les combats ; distinguer les voyages en ellipse du temps réel à table. Prévoir une sortie naturelle ou un cliffhanger à 23 h.
- Préférer **4 à 6 grandes étapes utiles**, plutôt que des dizaines de mini-étapes : briefing, enquête, RP, voyage, donjon, final/conclusion. Un donjon exploré pendant deux heures constitue **une seule étape**, accompagnée d'un guide des salles ; ne scinder que si une salle porte un événement majeur, une décision ou un final autonome.
- Préférer **une douzaine de blocs riches et lisibles** à des dizaines de blocs descriptifs répétés. Des blocs `texte` et `lore` décrivent les enjeux, les indices, la progression, les dangers et le cadre ; les listes purement détaillées de salles vont plutôt sur les journaux de la scène Foundry.
- **Chaque personnage n'apparaît qu'une seule fois en bloc `personnage`** dans la préparation : regrouper toutes ses apparitions, sa mission, son caractère, son information utile et ses suites dans ce bloc. Le MJ peut le retrouver dans la première séquence significative, et le conducteur peut lui faire référence ailleurs sans recréer son bloc.
- **Réutiliser le `npcId`** de la fiche du référentiel métier `pf2_record(kind='pnj')` lorsqu'elle existe ; sinon utiliser **un personnage temporaire** (`name`, éventuellement portrait privé fourni) sans fabriquer une fiche métier pour un figurant. Ne jamais créer un PNJ en double sur simple proximité de nom.
- La **personnalité jouable** (2–3 traits, ton, motivation, limites) doit figurer dans le bloc personnage ; si un PNJ récurrent a un champ `caractere` en base, le conserver ou l'améliorer via l'interface/API métier, sans promouvoir des hypothèses en faits canoniques.
- Un bloc `loot` séparé est réservé à **un trésor ou objet vraiment structurant pour la séance** ; pour le butin ordinaire, préférer les notes MJ de la carte et les coffres/Actors `loot` masqués aux joueurs. Les quantités et objets ne s'inventent pas : vérifier les références du scénario.
- **Statuts** : distinguer proposition, préparation non jouée et événement réellement joué ; séparer secrets MJ et informations connues des PJ. Ne pas associer artificiellement la préparation à une séance Discord déjà close ; la sélectionner lors du véritable `/debut-seance`.

### Cartes et notes Foundry complémentaires

Pour les lieux réellement explorés, créer des **repères de journal MJ par pièce ou zone** (description, dangers, DD, rencontres, loot) et poser **les tokens d'Actors et coffres MJ** aux bons endroits, sur le modèle de la Fosse des Sept Fléaux de Pointesable. Le **conducteur de séance ne duplique pas ces journaux salle par salle** : une vue d'ensemble et, éventuellement, un bloc final suffisent.

Une carte n'est pas obligatoire pour une simple visite de loge ou une consultation d'archives : le théâtre de l'esprit ou une illustration fixe vaut parfois mieux qu'une carte à explorer artificiellement. Le choix de la cartographie doit servir le jeu, pas devenir un travail systématique.

**Exemple actuel** : préparation PFS `1-00`, identifiant `fa2d18bd-32b1-48cf-904e-9873691a55eb` (5 étapes, 12 blocs ; 19 h–23 h ; quête de Yaz avant la mission principale). Cette entrée vit **dans SQLite**, pas dans le Markdown ; sa présence ici sert uniquement d'exemple de méthode.
