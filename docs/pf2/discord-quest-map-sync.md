# Synchronisation des quêtes Discord avec la carte PF2

## Source de vérité
Le forum Discord `journal-de-quetes` (`PF2_DISCORD_QUEST_FORUM_CHANNEL_ID`) est l'unique source pour les noms, les fils et le tag **Terminée**. Le service `DiscordService` lit les fils actifs et archivés au démarrage, puis toutes les cinq minutes. Il enregistre les métadonnées dans `pf2_discord_quest` et conserve les données précédentes si la lecture de Discord échoue. Il ne publie pas de commande `/créer quête` et ne modifie pas les discussions Discord.

### SQLite
- `pf2_discord_quest(thread_id PK, title, completed, archived, url, discord_created_at, synced_at)`
- `pf2_map_place_quest(place_id, thread_id, legacy_name)`, clef composite `(place_id,thread_id)`.
- La migration du code `039-discord-quest-catalogue-and-map-links` crée les deux tables si elles n'existent pas déjà. Elle est idempotente et utilise le système existant de sauvegardes SQLite avant migration.

Les identifiants Discord, et non les noms, portent les liens. Une quête peut apparaître dans plusieurs lieux et un lieu peut contenir plusieurs quêtes. Une quête terminée reste conservée, tout comme ses associations.

## Migration et décisions de curation (historique du 14 octobre 2026)

**Statut validé et appliqué sur le mini-PC**, avec sauvegarde SQLite préalable et contrôle d'intégrité. La première importation a créé 12 quêtes Discord (10 non terminées, 2 terminées) et 8 associations certaines. Une seconde intervention en données a porté le total à **10 associations** ; les sept points de quête cartographiques avaient alors tous leurs liens Discord résolus. Les chiffres et noms ci-dessous sont **un instantané daté**, jamais un inventaire à substituer à \`pf2.sqlite\`.

Conventions éditoriales actées lors de cette migration :

| Repère / lieu | Règle d'association |
| --- | --- |
| **Agents d'Absalom** | Un seul point pour trois quêtes : mafieux Myojimo, Cartel du Sel, disparition de la machine (fils Discord distincts). |
| **Grande Loge** | Point de quête pour « Les Druides Ecoterroristes » et « Le mystérieux Corvan » ; **ne pas confondre** ce repère avec le favori distinct « Grande Loge » du catalogue géographique. |
| **Brèchemur** | Nom du point = ville ; quête = « L'appel de Brèchemur ». |
| **Pointe-Sable** | Exception voulue à la règle « un lieu, une quête, même titre » : point « Pointe-Sable » ; quête « Veiller sur Pointesable ». |
| **Ruines Azlant** | Point « Ruines Azlant » ; fil « Les ruines Azlantes de Pluie d'un jour d'été » (terminé à la date du rapprochement). |
| **Recherche sur les origines** | Quête homonyme liée à un point proche de **Quantium**, ville de Nex déjà publique ; sa visibilité a été rendue explicite dans la curation. |
| **Creux de Faucon** | Point associé à « Le Roi Kobold », recentré sur les coordonnées du site cartographique de Falcon's Hollow / Nid-du-Faucon. |

L'utilisateur a demandé de **ne jamais renommer les fils Discord** pour satisfaire la carte : leurs titres sont lus tels quels et peuvent changer ultérieurement. Les correspondances historiques ont été établies par les IDs des fils. Après cette migration, deux quêtes Discord n'avaient toujours aucun point associé (état du **14 octobre 2026**) : « La contrebande de golems de chair » (ouverte) et « Le tueur d'esclaves » (terminée). Leur localisation n'a **pas** été décidée dans la discussion et ne doit pas être inventée ; vérifier d'abord SQLite et Discord lors de la reprise.

Les champs hérités \`map_quest_name\` / \`map_quest_names\` subsistent pour compatibilité et audit ; une association effective se fonde sur \`pf2_map_place_quest.thread_id\`, jamais sur une égalité de texte. Toute correction de curation propre à la carte se fait dans SQLite, avec sauvegarde et vérification de l'API ; elle n'exige pas de PR de code.

## Affichage
Les repères de quête liés sont visibles tant qu'au moins une quête est ouverte ou qu'une ancienne association reste non résolue. Si toutes les quêtes identifiées sont terminées, le lieu n'apparaît pas par défaut, **sans suppression** ; la case « Afficher les quêtes terminées » restaure ces repères et les entrées de liste. Un lieu sans association certaine reste visible.

Le clic sur un lieu affiche les titres synchronisés, les statuts (en cours ou terminée) et les liens vers les fils Discord. L'utilisateur peut sélectionner plusieurs fils depuis un formulaire intégré. La création de nouvelles quêtes **se fait uniquement sur Discord**, par création de discussion.

### Synchronisation et mise à jour des titres

La création d'une quête consiste **uniquement à ouvrir un fil** dans le forum Discord, sans commande dédiée du bot. Le même service NestJS déjà connecté à Discord interroge les fils actifs et archivés au démarrage puis toutes les **cinq minutes** ; les commandes \`/terminer-quete\` et \`/relancer-quete\` modifient le tag Discord, qui reste la source de vérité du statut. Un fil archivé n'est pas automatiquement terminé. Le synchroniseur effectue des upserts et préserve le dernier catalogue connu en cas d'échec de lecture.

Un renommage de fil conserve le même \`thread_id\` : il est répercuté dans SQLite à la prochaine synchronisation réussie et apparaît sur la carte **après rechargement de la page** (pas encore de rafraîchissement temps réel du navigateur). Les associations demeurent stables. Un lieu avec plusieurs quêtes conserve un seul repère, et une même quête peut être liée à plusieurs lieux.

### Lieux de quête et favoris

Les menus **★ Lieux de quête** et **☆ Favoris** sont distincts, partagés entre les modes PJ, MJ-light et MJ. Le menu des quêtes et les marqueurs affichent par défaut les lieux possédant au moins une quête non terminée. Si toutes les quêtes liées sont terminées, **masquer le repère sans supprimer le lieu ni les liens** ; la case « Afficher les quêtes terminées », décochée par défaut, permet de le retrouver. Une quête relancée rend son repère à nouveau visible après synchronisation et rechargement. En présence d'une ancienne association non résolue ou d'un état inconnu, ne pas masquer silencieusement le lieu.

Les favoris de lieux ordinaires sont indépendants du cycle de vie des quêtes. Ils doivent conserver leur logique de zoom et ne pas devenir des étoiles de quête permanentes. La carte illustrée d'Absalom contient déjà les noms des quartiers : les surimpressions de quartiers destinées aux PJ doivent donc être masquées par les **données de visibilité**, sans masquer les noms des autres lieux ni les icônes au zoom. Un défaut de superposition raster/labels relève, lui, du moteur d'affichage et non de la curation SQLite.

## Participation des PJ
Le bouton « + Lieu » permet aux PJ, MJ-light et MJ de cliquer sur la carte pour choisir des coordonnées géographiques, saisir nom/description puis choisir un ou plusieurs fils Discord ou un **lieu personnalisé** sans quête. Les lieux communautaires sont marqués `map_origin='pj'` et se différencient visuellement des lieux MJ/de référence. Les joueurs peuvent modifier et supprimer toute fiche d'origine PJ, sans validation MJ. L'API refuse modification/suppression communautaire d'une fiche MJ.

Voir **Décision de partage et limite de sécurité** ci-dessous pour la limite d'authentification des mutations communautaires.

### Décision de partage et limite de sécurité

**Décision validée :** aucun circuit d'approbation MJ pour un lieu PJ. Tout PJ peut créer un lieu de quête ou un **lieu personnalisé** (petit symbole distinct, sans quête obligatoire) et le rendre immédiatement visible à tous. Les fiches \`map_origin='pj'\` peuvent être modifiées ou supprimées par les PJ ; les points MJ et les lieux du fond cartographique ne doivent pas être réécrits par ces actions. Le formulaire intégré (« + Lieu », position sur la carte, titre libre, description, sélection multiple des quêtes du catalogue synchronisé) remplace les anciens \`window.prompt\`. Un lieu n'a pas besoin d'être une quête pour être intéressant.

**Attention :** dans l'implémentation auditée, aucune authentification d'auteur PJ côté API ne vérifie qui appelle les routes communautaires ; l'API distingue l'**origine de la fiche**, non le propriétaire réel de la requête. Le libre partage entre PJ est une décision fonctionnelle, pas une autorisation pour les visiteurs anonymes. Pour sécuriser les mutations, identifier les utilisateurs, traiter les droits côté serveur et vérifier séparément les routes MJ historiques. La politique validée n'exige pas que chaque PJ ne puisse modifier que ses propres fiches : les fiches d'origine PJ sont communautaires.

## Endpoints
- `GET /api/pf2-mj/map/discord-quests` : catalogue synchronisé
- `PUT /api/pf2-mj/map/quests/:id/links` : liens d'un lieu de quête
- `POST /api/pf2-mj/map/community-places` : ajout communautaire
- `PUT /api/pf2-mj/map/community-places/:id` : modification communautaire
- `DELETE /api/pf2-mj/map/community-places/:id` : suppression communautaire
- `GET /api/pf2-mj/map/places` : champs `questLinks`, `questUnresolved`, `questCompleted`, `origin`, `custom`

## Vérifications
- Compilation `api-jdr`
- Compilation et typage `web-golarion-map`
- Tests ciblés `Pf2MjService.spec.ts` et `DiscordService.spec.ts`
- Sauvegarde et `PRAGMA quick_check` de la base SQLite réelle

Ne jamais déduire un lien ambigu à partir de la seule proximité des noms. Ne jamais mettre une quête « terminée » du seul fait que son fil est archivé.
