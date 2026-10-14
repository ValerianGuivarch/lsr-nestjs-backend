# Synchronisation des quêtes Discord avec la carte PF2

## Source de vérité
Le forum Discord `journal-de-quetes` (`PF2_DISCORD_QUEST_FORUM_CHANNEL_ID`) est l'unique source pour les noms, les fils et le tag **Terminée**. Le service `DiscordService` lit les fils actifs et archivés au démarrage, puis toutes les cinq minutes. Il enregistre les métadonnées dans `pf2_discord_quest` et conserve les données précédentes si la lecture de Discord échoue. Il ne publie pas de commande `/créer quête` et ne modifie pas les discussions Discord.

### SQLite
- `pf2_discord_quest(thread_id PK, title, completed, archived, url, discord_created_at, synced_at)`
- `pf2_map_place_quest(place_id, thread_id, legacy_name)`, clef composite `(place_id,thread_id)`.
- La migration du code `039-discord-quest-catalogue-and-map-links` crée les deux tables si elles n'existent pas déjà. Elle est idempotente et utilise le système existant de sauvegardes SQLite avant migration.

Les identifiants Discord, et non les noms, portent les liens. Une quête peut apparaître dans plusieurs lieux et un lieu peut contenir plusieurs quêtes. Une quête terminée reste conservée, tout comme ses associations.

## Migration des données existantes exécutée sur le mini-PC
Une sauvegarde SQLite a été créée **avant** toute modification.
Les tables ont été créées directement sur le mini-PC et peuplées avec 12 fils lus via l'API Discord (10 en cours, 2 terminés à la date de la première migration). Huit associations ont été établies après rapprochement manuel des noms, avec `legacy_name` pour préserver les libellés initiaux.
Les deux anciennes associations ci-dessous ont volontairement été conservées sans lien Discord (pas de correspondance certaine) :
- « Ruines Azlant de Pluie d'un Jour d'Été »
- « Veiller sur Pointesable »

Les champs historiques `map_quest_name` / `map_quest_names` restent présents pour lecture de ces éléments non résolus. Toute édition avec le nouveau sélecteur remplace explicitement ces libellés par les liens vers les quêtes Discord.

## Affichage
Les repères de quête liés sont visibles tant qu'au moins une quête est ouverte ou qu'une ancienne association reste non résolue. Si toutes les quêtes identifiées sont terminées, le lieu n'apparaît pas par défaut, **sans suppression** ; la case « Afficher les quêtes terminées » restaure ces repères et les entrées de liste. Un lieu sans association certaine reste visible.

Le clic sur un lieu affiche les titres synchronisés, les statuts (en cours ou terminée) et les liens vers les fils Discord. L'utilisateur peut sélectionner plusieurs fils depuis un formulaire intégré. La création de nouvelles quêtes **se fait uniquement sur Discord**, par création de discussion.

## Participation des PJ
Le bouton « + Lieu » permet aux PJ, MJ-light et MJ de cliquer sur la carte pour choisir des coordonnées géographiques, saisir nom/description puis choisir un ou plusieurs fils Discord ou un **lieu personnalisé** sans quête. Les lieux communautaires sont marqués `map_origin='pj'` et se différencient visuellement des lieux MJ/de référence. Les joueurs peuvent modifier et supprimer toute fiche d'origine PJ, sans validation MJ. L'API refuse modification/suppression communautaire d'une fiche MJ.

**Sécurité à renforcer avant ouverture publique** : l'application historique `map.l7r.fr` et son API `pf2-mj` n'ont pas de mécanisme d'authentification autorisant à distinguer un visiteur anonyme d'un PJ connecté. L'interface distingue MJ et PJ, mais les endpoints publics d'ajout/modification communautaire ne savent pas identifier leur auteur et ne fournissent pas de contrôle anti-abus personnalisé. Un accès authentifié est recommandé avant de considérer cette fonction sécurisée sur internet.

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
