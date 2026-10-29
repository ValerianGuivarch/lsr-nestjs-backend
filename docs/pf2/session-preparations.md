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

**Protection obligatoire :** toutes ces routes requièrent `x-pf2-preparation-key` correspondant à `PF2_SESSION_PREP_KEY` dans l'environnement de `api-jdr` ; sans configuration elles refusent l'accès. La clé est saisie sur la page puis conservée seulement dans `sessionStorage` du navigateur pour cet onglet ; **ne pas la mettre dans le dépôt ou les paramètres publics du Toolkit**. Le bouton **Verrouiller** efface cette donnée de session. Cette protection est ajoutée parce que les préparations contiennent des secrets MJ et le partage déclenche une publication Discord. Les API préexistantes ne sont pas modifiées.

## Exploitation et vérifications

- Configurer `PF2_SESSION_PREP_KEY` dans le `.env` **persistant** du déploiement ; le script `deploy-main.sh` n'écrase plus ce fichier à chaque mise à jour. Redéployer `api-jdr` pour la prise en compte.
- Ouvrir la page avec la clé puis créer et enregistrer une préparation ; choisir une séance dont le canal est affiché ; partager un personnage lié ou temporaire.
- Vérifier que le message apparaît dans le **salon exact** où `/debut-seance` a créé le brouillon, puis côté Foundry ; contrôler le cas nom masqué et l'absence de doublon après effacement du chat.
- Vérifier également qu'une séance terminée ne permet plus de partager et qu'une création de fiche depuis Discord/Foundry reste fonctionnelle.

Les tests unitaires SQLite couvrent CRUD, révisions, salon mémorisé/clos, création d'une présentation Discord simulée et absence de PNJ permanent pour un figurant. **Un test de bout en bout dans le navigateur et sur Discord/Foundry est encore nécessaire après déploiement.**
