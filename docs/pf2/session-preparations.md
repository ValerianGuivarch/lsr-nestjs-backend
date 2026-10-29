# Préparation de séance — application MJ

[← Outils PF2](../../OUTILS.md) · [Journal et campagnes](../../CAMPAGNES.md)

## But et périmètre V1

La page **Préparation séance** (`/pf2-mj/session-preparations`) est un conducteur MJ **entièrement manuel**. Elle ne lit ni ne génère de préparation par IA ; l'import PDF/IA est expressément hors périmètre de cette version. Elle reste distincte de **Préparation technique** (`/pf2-mj/prepare`), consacrée aux ressources PDF/Foundry.

Le Journal MJ expose un lien **Préparer une séance** sur les œuvres suivies. On peut aussi créer une préparation indépendamment, puis la rattacher à une campagne, un scénario et une séance Discord au moment opportun. Les liaisons sont des identifiants : elles ne dupliquent pas les données des campagnes, PNJ, scènes ou objets.

Chaque préparation comprend titre, objectif général et étapes ordonnées. Une étape possède titre, horaire indicatif, notes, état `jouée` et blocs ordonnés de types :

- **Personnage** (lien vers PNJ MJ existant, ou figurant temporaire avec nom et URL de portrait) ;
- **Lore**, avec indicateur secret MJ ;
- **Loot**, quantité et état ;
- **Rencontre**, avec référence Foundry textuelle ;
- **Texte libre** et **Checklist**.

Le mode **Édition** est ouvert par défaut ; l'autre mode, **Vue**, conserve ordre et contenu sans champ de saisie. La vue permet les actions ponctuelles **Marquer jouée/Terminé** et **Partager personnage**. Les changements sont enregistrés explicitement en édition ; le partage enregistre d'abord les modifications en attente. Une révision numérique refuse l'écrasement silencieux d'une sauvegarde concurrente.

Les figurants temporaires sont stockés *uniquement dans la préparation*. Leur partage ne crée ni fiche PNJ MJ, ni Actor Foundry, ni fiche wiki. La création ultérieure d'une fiche wiki reste une action explicite depuis la carte Discord/Foundry.

**Portraits temporaires (29 octobre 2026).** En mode Édition, un personnage sans fiche MJ peut recevoir un portrait via **Choisir/Remplacer le portrait**, glisser-déposer ou collage d'une image sur la vignette. Formats PNG, JPEG, WebP et GIF, jusqu'à **10 Mo** ; l'alternative URL HTTPS/asset Foundry reste proposée. L'upload réutilise l'API existante `POST /api/pf2-mj/pnj/portrait` et la validation/conversion des images : l'identifiant de fichier `prep-<preparationId>-<blockId>` est propre à la préparation, **sans création de PNJ**, et le fichier est placé sous `assets/l7r/portraits/pnj/`. L'aperçu de la préparation lit les fichiers via `GET /api/pf2-mj/portraits/:filename`, en édition comme en vue. Après upload, cliquer sur **Enregistrer le portrait** (ou sur Enregistrer en haut) pour sauvegarder la référence du fichier dans la préparation ; un upload non suivi d'une sauvegarde peut laisser une image orpheline.

**Collage et enregistrement explicite (29 octobre 2026).** Cliquer sur la vignette du personnage temporaire lui donne le focus (contour visible), puis **Ctrl+V** colle immédiatement une image depuis le presse-papiers. Après upload ou saisie de l'URL, le bouton local **Enregistrer le portrait**, placé sous l'URL, enregistre la préparation dans SQLite et affiche la confirmation. L'URL ou le chemin Foundry restent présents après actualisation. Le bouton global Enregistrer reste disponible pour les autres modifications ; en présence de modifications non enregistrées, le navigateur avertit avant de rafraîchir ou fermer l'onglet. Les tests `SessionPreparations.test.tsx` couvrent le clic+collage et l'enregistrement d'URL avec rechargement du composant.

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

Le schéma JSON des étapes et blocs est validé côté API (longueurs, types, unicité des identifiants, nombres maximum de blocs/étapes). L'API est sous `/api/pf2-mj/session-preparations` avec `GET` liste/détail/sessions, `POST` création/partage, `PATCH` modification, `DELETE` suppression.

**Accès :** cette V1 fonctionne sans clé supplémentaire à saisir : elle suit le même modèle d'accès que l'application MJ actuelle. **Limite de sécurité :** l'application et ses API n'ont actuellement pas d'authentification MJ centralisée. Les routes de préparation contiennent des secrets narratifs et le partage déclenche une publication Discord : prévoir une authentification centralisée pour l'ensemble du portail plutôt qu'une seconde clé propre à cette page. Ne pas confondre absence d'usage par les joueurs et restriction technique d'accès.

## Exploitation et vérifications

- L’interface de préparation ne demande plus de clé distincte. Une authentification MJ commune au portail et à ses API reste nécessaire pour protéger durablement les contenus confidentiels.
- Ouvrir la page puis créer et enregistrer une préparation ; choisir une séance dont le canal est affiché ; partager un personnage lié ou temporaire.
- Vérifier que le message apparaît dans le **salon exact** où `/debut-seance` a créé le brouillon, puis côté Foundry ; contrôler le cas nom masqué et l'absence de doublon après effacement du chat.
- Vérifier également qu'une séance terminée ne permet plus de partager et qu'une création de fiche depuis Discord/Foundry reste fonctionnelle.

Les tests unitaires SQLite couvrent CRUD, révisions, salon mémorisé/clos, création d'une présentation Discord simulée et absence de PNJ permanent pour un figurant. **Un test de bout en bout dans le navigateur et sur Discord/Foundry est encore nécessaire après déploiement.**

## Exemple saisi directement dans la base (29 octobre 2026)

Une préparation « **L’Âge des Cendres — Séance 1 · Brèchemur / Altaerein** » a été créée dans la base du mini-PC depuis le PDF MJ fourni, avec **9 étapes et 65 blocs** (personnages, notes, lore, secrets, rencontres, loot et checklist). Elle pointe vers la campagne catalogue `age-of-ashes`, et n’est **pas** associée artificiellement à une séance Discord passée : son `session_id` est nul jusqu’à `/debut-seance` et le choix de séance dans l’éditeur. Warbal, Alak et Voz sont liés aux PNJ MJ existants ; Calmont, Greta et Helba sont laissés temporaires en l’absence de fiche correspondante dans le référentiel consulté. Certains portraits temporaires sont encore à fournir par le MJ.

ID de la préparation exemplaire : `15eb2bb6-7e62-482b-9f96-57b080fddd79`. Le script d’import reproductible et **idempotent** est `scripts/pf2/import-age-of-ashes-session1.py`. Il vérifie si le titre/la campagne existent déjà avant de créer l’exemple, sans écraser les modifications faites ensuite dans l’interface. Le script historique cible le backend déployé avec clé de préparation ; après retrait de la saisie de clé en V1, cette clé n’est plus exigée par la version courante de l’API.

**Plusieurs préparations simultanées :** aucun index unique sur campagne/scénario/séance ; chaque préparation possède un UUID distinct. La page affiche la liste des préparations enregistrées et permet de sélectionner celle à modifier, ou de l’ouvrir directement avec `?preparationId=<UUID>`. Les révisions optimistes empêchent qu’une ancienne sauvegarde écrase la nouvelle.
