# Quêtes Discord créées et gérées par le bot

## État appliqué au 28 octobre 2026

- Le forum journal-de-quetes contient désormais des **quêtes bot** avec une fiche interactive en premier message. Le sujet épinglé « Créer une quête » est conservé.
- Les **15 discussions historiques** ont été recréées : chaque message a été préservé avec **pseudo Discord, date et heure**, sans mention active. Les **4 images** ont été réimportées.
- Les 15 anciens fils ont été archivés puis **supprimés le 2 novembre 2026** sur décision du MJ, après sauvegarde locale des 122 messages et des 21 réactions. Les nouveaux fils bot et leurs liens cartographiques restent la source active.
- Les anciennes réactions ne sont **pas attribuées artificiellement** à leurs auteurs. Le bot prépare 👍 (intérêt) et 🔒 (réservation prioritaire) sur les nouvelles quêtes ; chaque joueur doit y réagir lui-même.
- La quête test « Détruire le monde » et le lieu PJ « Port de la fin du monde » ont été **supprimés** sur demande ; « Trouver la fosse » est conservée.
- La synchronisation régulière de Discord continue de lire les états des fils. La fiche bot conserve son attribution historique et son lien d'archive dans la description enregistrée en SQLite.
- **Le forum n'utilise plus aucun tag** depuis le 2 novembre 2026. Les quêtes considérées comme finies sont archivées ET verrouillées ; l'archivage automatique non verrouillé ne suffit pas. La création directe de discussions reste autorisée temporairement.

**Sauvegarde hors dépôt Git sur le mini-PC :** `/home/valou/pf2-migrations/quest-bot-migration-20261028/`. Contient l'export des messages, quatre images, la sauvegarde SQLite, les états de migration, les journaux et les anciennes réactions.

## Choix définitif d'icône par réaction Discord

1. Le sujet épinglé **📌 Créer une quête** existe déjà dans le forum des quêtes.
2. Cliquer sur **Créer une quête** ou utiliser la commande de nouvelle quête. Le formulaire ouvre directement **titre** et **description**, sans choix d'emoji.
3. Le bot crée une discussion provisoire sans icône, publie la fiche **sans répéter le titre** et ajoute **👍** pour signaler l’intérêt et **🔒** pour indiquer une mission à faire absolument.
4. Un avertissement apparaît dans la fiche : **« Quête non finalisée : ajoutez une réaction (autre que 👍 ou 🔒) à ce message pour choisir définitivement l'icône de la quête. »**
5. La première réaction avec un **emoji Unicode standard autre que 👍 ou 🔒** (par exemple 🐸, 👻, 😈) déposée sur le **premier message du bot** fixe définitivement l'icône dans le titre du fil. L'avertissement disparaît automatiquement. Les réactions suivantes, les réactions sur des réponses et celles du bot ne changent rien. 👍 et 🔒 restent réservés aux préférences des joueurs.
6. **Modifier** ouvre directement le formulaire titre + description, sans choix d'icône. **Exception volontaire :** `/changer-icone-quete icone:🐸`, lancée dans une quête créée par le bot, permet à n'importe quel PJ de changer l'icône après sa finalisation. La commande valide un emoji Unicode unique et met à jour le titre Discord, SQLite et le catalogue cartographique. La confirmation est privée. Les anciennes quêtes conservent leur icône précédente tant que la commande n'est pas utilisée.
7. Pour les lieux, utiliser **Associer un lieu** ou **Créer un lieu sur la carte** ; le bot synchronise ensuite la fiche.
8. **Terminer** et **Relancer** conservent leurs fonctionnalités, dont le compte rendu obligatoire.

La commande `/changer-icone-quete` est utilisable dans les quêtes créées par le bot encore ouvertes, pas dans le sujet d'accueil, une discussion historique ni une quête fermée et verrouillée. Tous les PJ ont les mêmes droits.

Les réactions de type **emoji personnalisé du serveur** ne peuvent pas être représentées par un véritable emoji dans un titre de discussion : seules les réactions Unicode standards servent ici au choix de l'icône.

Les commandes `/terminer-quete` et `/relancer-quete` restent disponibles et utilisent les mêmes opérations que les boutons, y compris le compte rendu et la mise à jour du premier message.


## Réactions de priorité et /choix-quete (2 novembre 2026)

- Sur chaque fiche de quête, **👍** indique « intéressé » et **🔒** indique « je tiens absolument à faire cette mission ». Un joueur peut réagir avec les deux emojis. Le cadenas ne fixe jamais l’icône de la quête.
- Les **18 quêtes bot présentes le 2 novembre** ont été mises à jour directement sur Discord ; le sujet épinglé « Créer une quête » reste intact. Les fiches sont régénérées depuis le modèle du bot : le déploiement de ce code est nécessaire à la persistance des nouvelles consignes.
- La commande `/choix-quete` doit être lancée depuis un fil de mission « Séance JJ/MM » du salon `objectif-prochaine-mission` dont le message initial identifie quatre participants. Elle lit les réactions des premiers messages des quêtes non terminées et non obsolètes.
- **Trois catégories visibles** : **👍 Intérêt des présents** (les 🔒 d'un présent sans 🔒 d'un absent apparaissent en premier, avant les simples 👍), **📋 Autres** et **🚫 Réservées par les absents**. Elles ne sont affichées que si des quêtes y figurent, sans ligne vide entre les groupes. Le tri interne reste inchangé : quatre niveaux de priorité (cadenas présent, intérêts des présents, autres, cadenas absent), puis nombre croissant de 👍, date et titre pour départager.
- Chaque ligne utilise **uniquement la mention native du fil**, suivie des éventuelles préférences entre parenthèses. Les noms des joueurs **présents à la séance** sont en gras dans les deux mentions (réservé par / intéresse) ; ceux des absents restent en texte normal. Discord affiche dynamiquement le nom actuel de la quête : il peut le tronquer visuellement, mais le bot ne répète pas le titre en texte.
- /choix-quete présente une **prévisualisation privée identique à la version publiée**. Si tout tient dans la limite Discord, **un seul message** est affiché et publié. Sinon les parties sont réparties sans intitulé « suite », et les boutons **Publier ou Actualiser** et **Annuler** se trouvent uniquement sur le **dernier message privé**. Une seule validation publie la totalité des parties ; aucun message n'est publié avant celle-ci.
- Les quêtes **fermées (archivées ET verrouillées)** sont exclues du classement. Les fils simplement auto-archivés restent éligibles. Aucun tag n'est utilisé. La source de vérité reste Discord ; les réactions 👍/🔒 sont copiées dans SQLite pour permettre un recalcul rapide, puis vérifiées périodiquement contre Discord.


### Récapitulatifs dynamiques de choix de quêtes (2 novembre 2026)

- Une fois publiée et validée, la liste est **dynamique** : chaque ajout ou retrait de 👍/🔒 est enregistré immédiatement dans SQLite. Les listes suivies sont ensuite recalculées depuis SQLite. Une temporisation de deux secondes regroupe les éditions rapprochées, sans relire Discord. Les réactions du bot, les autres emojis et les réactions sous des réponses sont ignorés.
- Les fils de séance et leurs messages sont suivis dans pf2_discord_quest_recap (migration 050). Les votes sont stockés dans pf2_discord_quest_vote (migration 052) : clé (thread_id, user_id, emoji), liée logiquement au catalogue pf2_discord_quest. **Discord reste la source de vérité**, SQLite sa projection persistante.
- La séance est authentifiée à partir du message initial créé par le bot dans `#objectif-prochaine-mission`, de ses quatre participants et du marqueur `[PF2-SESSION:YYYY-MM-DD]`. L’ancien format avec année complète et lien `Source :` est aussi reconnu pour compatibilité.
- **Arrêt à minuit en heure de Paris à la fin du jour de séance** : la date de la séance est incluse, et toute actualisation est interdite à partir du lendemain 00 h 00. Exemple : séance du 03/11 actualisable le 03/11 inclus, figée dès le 04/11. La même règle vaut pour les réactions, la prévisualisation et la confirmation manuelle.
- Au démarrage puis **toutes les cinq minutes**, le bot relit les votes Discord (quatre quêtes simultanées maximum), réconcilie leurs différences dans SQLite en transaction et édite les récapitulatifs suivis. La séance du 03/11 reste éditable jusqu'au 03/11 inclus et est figée à partir du 04/11 à 00 h (heure de Paris). Les messages anciens non suivis ne sont pas adoptés.
- Les éditions sont sérialisées par séance et les réactions regroupées avec deux secondes de temporisation. Les messages publiés sont conservés en SQLite et les actualisations automatiques les **éditent sans republier**. Seule une nouvelle confirmation peut autoriser un message supplémentaire.
- Les **nouveaux récapitulatifs ne reçoivent aucune réaction de vote** : les pouces et cadenas restent sur les **fiches des quêtes**. Le bot laisse intégralement intacts les anciens messages et leurs réactions. Si un récapitulatif suivi a été supprimé manuellement, le bot ne le recrée jamais silencieusement.
- La réconciliation ne doit jamais éditer des messages non publiés par le bot ni identifier un récapitulatif sur la seule base d'un titre de fil ambigu.

### Prévisualisation privée : publier, actualiser ou republier (4 novembre 2026)

- La commande /choix-quete produit toujours une **prévisualisation privée**. Si aucun récapitulatif n'est enregistré pour la séance, le dernier volet propose **Publier les choix** et **Annuler**. Seule la validation du MJ crée le message public.
- Si un récapitulatif existe déjà en SQLite, le dernier volet propose **Actualiser les choix**, **Republier les choix**, **Annuler** et, lorsque le message est accessible, **Voir les choix publiés**.
- **Actualiser** force une nouvelle lecture des votes Discord et remet à jour les **messages publics existants**, sans les déplacer et sans en créer de doublon. Cela sert notamment à réparer un décalage ou à ajouter des parties si le récapitulatif a grandi.
- **Republier** force aussi la lecture des votes, mais crée un nouveau récapitulatif **à la fin du fil de séance** puis supprime les anciens messages du bot. Pour éviter de perdre les choix si une publication échoue, le bot envoie d'abord tous les nouveaux messages, remplace **atomiquement dans SQLite** les identifiants des parties suivies, puis supprime les anciens messages. Un échec avant le basculement laisse l'ancien récapitulatif suivi et nettoie les nouveaux messages déjà envoyés.
- Si Discord refuse de supprimer un ancien message après le basculement, **la confirmation privée affiche l'erreur**, le nombre de messages restants et leurs identifiants ; les nouveaux messages restent alors ceux suivis en SQLite. Aucun ancien message d'un autre auteur n'est supprimé.
- Chaque validation fournit **un lien vers le récapitulatif public** et un bouton pour y accéder, même lorsqu'aucun contenu n'a changé. Aucune publication, republication ou création de nouvelle partie ne se fait automatiquement sur une réaction ou lors de la synchronisation toutes les cinq minutes.
- Les boutons restent uniquement sur le dernier volet privé d'une liste découpée ; les classements et les trois catégories restent inchangés.

### Affichage compact, cadenas uniques et notifications (2 novembre 2026)

- Les noms des quêtes dans /choix-quete sont affichés via **une seule mention native Discord**, sans doublon en gras ni lien séparé. Le titre affiché suit automatiquement les renommages de quêtes effectués sur Discord.
- Chaque quête affiche uniquement les préférences présentes : (réservé par Éric, intéresse Sameh) si les deux existent, (réservé par Éric) ou (intéresse Sameh) si un seul existe, et **aucune parenthèse** s'il n'y a aucun vote. Le tri reste inchangé : 🔒 d'un présent sans cadenas d'absent, puis 👍 présents (nombre croissant de pouces), les autres (nombre croissant), puis 🔒 d'un absent.
- Les 👍 sont **illimités**. L'alerte en fin de récapitulatif signale uniquement les joueurs ayant réservé **plusieurs quêtes avec 🔒**.
- Lorsqu'un joueur ajoute un 🔒 sur une deuxième quête non terminée, le bot envoie un avertissement **dans son salon PJ privé**, avec une mention Discord ciblée, et lui demande de ne conserver qu'un cadenas. L'identification du salon repose sur la jointure SQLite entre pf2_player_character_owner et pf2_player_discord_channel, sans inférer le salon depuis un pseudonyme. S'il n'a pas de salon associé (ex. Valou), aucune notification n'est envoyée.
- Lorsqu'une quête est terminée avec /terminer-quete ou le bouton associé, le bot lit **avant fermeture** les joueurs ayant placé 🔒 et envoie à chacun disposant d'un salon privé une notification ciblée avec le titre de la quête terminée. Les erreurs de notification sont journalisées et ne bloquent pas la fermeture.
- **Une actualisation automatique édite uniquement les messages du récapitulatif déjà enregistrés** : elle ne publie aucun nouveau message, même si la liste grandit. Si le contenu dépasse les parties existantes, le bot indique qu'une confirmation /choix-quete est nécessaire pour ajouter la suite. Seul **Actualiser** peut ajouter des parties au récapitulatif existant, ou **Republier** peut le déplacer intégralement en bas du fil après validation explicite.
- Démonstration effectuée sur les **deux messages déjà présents** dans « Séance 03/11 » : ils ont été édités sans nouvelle publication. Les réactions du bot sous l'ancien récapitulatif ont été retirées ; une réaction de joueur 💍 reste, car le bot ne dispose pas de la permission Discord permettant de la supprimer.

### Affichage minimaliste de /choix-quete

- **Une seule liste** triée, avec **trois sous-titres courts** et sans espaces vides superflus. Les catégories sans quête n'apparaissent pas. Les réservations des joueurs présents sont en tête de **👍 Intérêt des présents**, avant les quêtes seulement appréciées.
- Chaque ligne contient uniquement la **mention cliquable du fil Discord**, puis les préférences entre parenthèses si elles existent. Si aucune préférence n'existe, aucune parenthèse.
- Les 👍 multiples sont autorisés. Seuls plusieurs 🔒 pour un joueur déclenchent une alerte.
- Une découpe ne survient que si la limite de Discord est dépassée. **Pas d'intitulé « suite »**, ni de titre répété ; en prévisualisation, les boutons sont **sur la dernière partie uniquement**. Le nombre de messages publiés ne dépend donc pas d'un nombre fixe de quêtes.
- Les anciens récapitulatifs restent sous le contrôle du MJ, sans modification automatique durant cette mise à jour.

### Première optimisation des lectures de quêtes (2 novembre 2026)

- Les lectures Discord des quêtes sont désormais effectuées par **quatre travailleurs parallèles au maximum** (messages initiaux, 👍 et 🔒 et leurs auteurs) plutôt que séquentiellement. Le tri reste inchangé.
- Le contrôle des 🔒 multiples réutilise cette limite à quatre quêtes en parallèle.
- **Projection persistante des votes (migration 052)** : le cache mémoire aide à traiter les événements, mais le texte des récapitulatifs lit les votes en SQLite. Chaque nouvelle commande /choix-quete et chaque validation forcent une lecture Discord, ainsi que le job toutes les cinq minutes. Seules les différences détectées sont écrites.
- Le récapitulatif du **03/11** reste suivi dans SQLite et peut être actualisé jusqu'au **03/11 23 h 59 min 59 s, heure de Paris**, sans publication de nouveau message automatique.

### Cache événementiel des votes et réconciliation

- Discord reste la source de vérité. La table SQLite pf2_discord_quest_vote conserve, par quête et joueur, les 👍 et 🔒. Le cache mémoire est éphémère et reconstruit au démarrage depuis Discord, avec quatre lectures simultanées maximum.
- Chaque ajout ou retrait de réaction est ordonné et enregistré dans SQLite immédiatement ; seuls les recalculs et éditions sont regroupés pendant deux secondes. Les alertes de doubles 🔒 utilisent les votes SQLite, sans rescanner le forum.
- Le job de réconciliation existant tourne **toutes les cinq minutes** : il compare Discord à SQLite, répare les différences dans une transaction et traite les séances suivies avec **deux travailleurs indépendants**. La commande /choix-quete et sa validation demandent également une lecture fraîche.
- Les créations, changements, fermetures et réouvertures de fils invalident le cache mémoire. Les réactions reçues pendant une synchronisation Discord sont rejouées pour ne pas écraser les changements récents ; les écritures SQLite sont sérialisées.
- Les quatre participants de chaque séance restent déterminés par son fil. Le classement n'est pas enregistré : il est recalculé depuis les votes SQLite pour chaque séance. Les noms des joueurs présents sont en gras.
- Aucune création de récapitulatif n'est déclenchée par la synchronisation : les nouveaux messages nécessitent toujours la validation explicite du MJ. Les récapitulatifs sont modifiables **jusqu'à la fin du jour J inclus**, heure de Paris.

### Diagnostic des récapitulatifs multiples (3 novembre 2026)

- Le 03/11 et le 05/11 pouvaient diverger malgré une réaction Discord retirée. Le stockage précédent des votes était uniquement en mémoire et l'exécution séquentielle pouvait retarder les séances suivantes.
- La synchronisation journalise désormais **ses démarrages, le nombre de séances, les corrections des votes en SQLite, chaque séance vérifiée, les éditions Discord, les exclusions, les erreurs et les durées**. Une synchronisation toujours active lors d'un nouveau déclenchement produit un avertissement.
- Deux travailleurs de séances indépendants empêchent qu'une séance lente bloque immédiatement l'autre. Une indisponibilité Discord peut toujours créer un retard provisoire ; le prochain contrôle toutes les cinq minutes tentera une correction.
- Les récapitulatifs inexistants ou non suivis en SQLite ne sont jamais publiés automatiquement ; seule une validation explicite du MJ peut créer un message ou une nouvelle partie.

### Fermeture des quêtes sans tags (2 novembre 2026)

Le forum Discord `journal-de-quetes` ne comporte plus aucun tag disponible, ni tag sur ses fils. Les deux quêtes anciennement marquées `Terminée` (« La contrebande de golems de chair », « L'appel de Brèchemont ») et les deux anciennement `obsolète` (« Le tueur d'esclaves », « Les ruines Azlantes de Pluie d'un jour d'été ») ont été **archivées et verrouillées**. Les autres restent ouvertes, même si Discord les auto-archive ultérieurement par inactivité.

La commande `/terminer-quete` publie d'abord le compte rendu, retire les pouces des joueurs comme avant, puis verrouille et archive le fil. `/relancer-quete` le déverrouille et le désarchive. Le bot fonde ses fiches et le catalogue de la carte sur **`archived && locked`**, et `/choix-quete` exclut uniquement ces fils fermés. Aucun tag ne revient lors d'une synchronisation.

## Ce qui est reporté

- **Terminé le 28 octobre 2026 :** migration des 15 discussions historiques et copie des messages.
- Désactivation du bouton natif « Nouvelle publication » pour les joueurs.
- Création directe de **lieux officiels MJ** depuis Discord : non développée. En revanche, les PJ peuvent déjà créer immédiatement leurs **lieux communautaires** sur la carte via **+ Lieu**, sans validation du MJ, et y associer la quête. Ne pas confondre ces deux types de lieux.
- **Développé le 28 octobre 2026 :** carte hybride (regroupement et séparation au zoom), emojis sur les lieux de quête, et bouton **Voir sur la carte** qui centre ou cadre les lieux liés au fil Discord. Un message apparaît si aucun lieu public n'est lié.

## Vérifications et sécurité

- Les migrations SQLite **045** et **046** enregistrent les quêtes du bot et le choix définitif de leur emoji. Le mécanisme existant sauvegarde la base avant migration.
- Les boutons, les descriptions et le verrou de l'emoji sont conservés dans SQLite et survivent aux redémarrages.
- Si la création de discussion fonctionne mais qu'une opération SQLite ou Discord échoue ensuite, le bot peut laisser une discussion partiellement créée. Vérifier et corriger ce cas avant un déploiement étendu.
- Les tests de code couvrent notamment le service de quêtes (`DiscordQuestPilotService.spec.ts`), le verrou d'icône (`Pf2QuestIconReaction.spec.ts`), les changements de liens (`Pf2QuestMapChange.spec.ts`), le regroupement et les liens directs cartographiques (`hybrid-quest-grouping.spec.ts`, `quest-map-navigation.spec.ts`). Ces tests ne remplacent pas un contrôle manuel Discord + carte + SQLite en production.
- Le sujet d'accueil est **déjà installé**. La commande d'installation n'est plus publiée ; le bouton existant continue de fonctionner.
- Les boutons ne doivent pas mentionner massivement les joueurs : `allowedMentions.parse=[]`.
- Les fils historiques ont été définitivement supprimés le 2 novembre 2026 après sauvegarde locale ; l’ancien retour arrière qui supposait ces fils encore présents n’est plus opérationnel.

## Parcours actuel Discord → carte (28 octobre 2026)

Le parcours conseillé est **📌 Créer une quête** (sujet épinglé) ou `/nouvelle-quete` → formulaire titre/description → réaction Unicode (autre que 👍 et 🔒) sur le premier message pour fixer l'icône → **Associer un lieu**. Les joueurs utilisent 👍 pour signaler leur intérêt et 🔒 pour signaler une réservation prioritaire. Les boutons **Modifier**, **Terminer**, **Relancer** et **Retirer un lieu** restent associés à la fiche du bot. Pour remplacer volontairement une icône déjà fixée, utiliser `/changer-icone-quete` dans le fil bot.

**Associer un lieu** propose les lieux publiés non encore liés (25 par page), affiche les liens existants et permet d'en retirer sans supprimer le lieu lui-même. **Créer un lieu sur la carte** ouvre `/pj` : il faut ensuite cliquer sur **+ Lieu**, positionner le point, choisir **★ Lieu de quête**, sélectionner la quête et enregistrer ; le bouton Discord ne préremplit pas automatiquement la sélection. On peut aussi laisser la quête sans lieu et la compléter plus tard.

**Voir sur la carte** ouvre `https://map.l7r.fr/pj?quest=<thread_id>` ; la carte recherche les lieux publiés associés à cet ID, zoome sur l'unique lieu ou cadre plusieurs lieux. Une quête terminée ciblée réactive l'affichage des quêtes terminées si nécessaire. Sans lieu visible, une information apparaît sans inventer de localisation. Les marqueurs reprennent les emojis de titre ; plusieurs quêtes d'un même lieu peuvent afficher jusqu'à trois emojis et un compteur. Les clusters de quêtes différentes conservent leur étoile et leur compteur. La page doit être actualisée pour lire un changement de catalogue synchronisé.

La création native d'une discussion dans le forum reste techniquement autorisée pour le moment mais n'est **plus le parcours recommandé** : elle ne bénéficie pas d'une fiche de quête gérée par le bot. Ne pas confondre ce forum avec les fils de mission servant à planifier les séances.

## Synchronisation des lieux après création depuis la carte

Le lien quête–lieu est dans `pf2_map_place_quest`. Un lieu créé sur la carte
avec une quête sélectionnée est **immédiatement associé**, même s'il n'apparaît
plus dans le sélecteur Discord « Ajouter un lieu » (qui masque les associations
déjà faites). Le sélecteur affiche donc séparément les lieux déjà associés.

Les écritures cartographiques notifient le bot après validation de la transaction
SQLite, afin de mettre à jour le premier message de la discussion Discord.
Une vérification de toutes les fiches bot à chaque synchronisation du forum
(5 min) corrige également les changements perdus lors d'une interruption du bot.
Une fiche dont le texte est déjà correct n'est pas éditée.

## Migration historique et retour arrière

**Résultat de migration (28 octobre 2026) :** 15 quêtes bot, 122 entrées de messages historiques représentées dans **118 publications**, dont 5 compléments regroupant 9 très courts messages de répétition de titres. Quatre pièces jointes/images conservées et réimportées. Les vérifications portent sur les statuts, les tags, les liens, les composants Discord, l'absence de mentions et l'option `SUPPRESS_NOTIFICATIONS` (pas de notification push ou bureau, mais une activité peut toujours apparaître dans Discord).

### Présentation des historiques après migration

**Convention appliquée à toutes les 15 quêtes historiques le 28 octobre 2026 :**
la fiche initiale commence directement par sa description, **sans préfixe d'auteur/date**.
Dans les réponses importées encore présentes, le pseudo historique en tête de message
a été remplacé par la **mention Discord de l'auteur d'origine**, en conservant la date,
l'heure et le texte. Ces mentions sont envoyées avec `allowed_mentions.parse=[]` :
elles sont visibles mais **ne déclenchent pas de ping**. Les liens de lieux, images,
tags et boutons ne sont pas modifiés par cette transformation.

**Les suppressions de messages effectuées ensuite par le MJ sont intentionnelles.**
Il ne faut **jamais reconstituer, recopier ou republier** un message disparu depuis
l'export historique. L'ancienne action `repair` du script a été retirée pour cela. Les modes d'import et de rafraîchissement sont également désactivés. Seuls les modes verify et rollback restent disponibles.
Le mode `verify` contrôle désormais seulement la structure des fils encore présents,
sans exiger un nombre de messages ou une correspondance avec tous les textes archivés.
Les chiffres « 122 entrées / 118 publications » correspondent à la migration **initiale**,
pas au nombre actuel après les suppressions.

Les données SQLite conservent le mapping `ancien ID → nouvel ID` dans `pf2_quest_migration_20261028`. Cette table de suivi est créée par le script de migration ponctuel `scripts/pf2/migrate-discord-quests-20261028.py`. Les journaux et le rapport d'anciennes réactions sont dans le répertoire privé de sauvegarde ; ne **pas** les versionner dans GitHub.

Pour un retour global, exécuter sur le mini-PC après sauvegarde :

`python3 scripts/pf2/migrate-discord-quests-20261028.py rollback`

Cela archive les nouvelles discussions et les marque `obsolète`, remet les associations cartographiques sur les fils historiques et désarchive/déverrouille ceux-ci en rétablissant leurs tags d'origine. **Retirer le tag seul ne suffit pas** pour remettre les associations de carte et écarter les doublons. Le retour arrière de la migration ne ressuscite **pas** la quête test volontairement supprimée.

La **carte hybride a été livrée le 28 octobre 2026**, après cette migration : regroupement visuel des lieux au zoom inférieur à 9 (rayon de 64 px), séparation à partir du zoom 9, nombre de quêtes distinctes, emojis dans les repères et accès direct par **Voir sur la carte**. La migration des fils et l'affichage hybride sont des opérations différentes : le regroupement n'altère ni les liens SQLite ni les fils Discord. Voir [Synchronisation des quêtes avec la carte](discord-quest-map-sync.md) et le [README de l'application](../../apps/web-golarion-map/README.md).
