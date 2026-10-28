# Quêtes Discord créées et gérées par le bot

## État appliqué au 28 octobre 2026

- Le forum journal-de-quetes contient désormais des **quêtes bot** avec une fiche interactive en premier message. Le sujet épinglé « Créer une quête » est conservé.
- Les **15 discussions historiques** ont été recréées : chaque message a été préservé avec **pseudo Discord, date et heure**, sans mention active. Les **4 images** ont été réimportées.
- Les 15 anciens fils sont marqués `obsolète`, **archivés et verrouillés**, sans suppression. La migration a transféré les liens cartographiques vers les nouveaux identifiants Discord.
- Les anciennes réactions ne sont **pas attribuées artificiellement** à leurs auteurs. Le bot a posé 👍 sur les nouvelles quêtes ouvertes ; chaque joueur doit y réagir de nouveau.
- La quête test « Détruire le monde » et le lieu PJ « Port de la fin du monde » ont été **supprimés** sur demande ; « Trouver la fosse » est conservée.
- La synchronisation régulière de Discord continue de lire les états des fils. La fiche bot conserve son attribution historique et son lien d'archive dans la description enregistrée en SQLite.
- Aucun tag `essai` ni feature flag global. La création directe de discussions par les joueurs reste autorisée temporairement, en attendant une décision distincte.

**Sauvegarde hors dépôt Git sur le mini-PC :** `/home/valou/pf2-migrations/quest-bot-migration-20261028/`. Contient l'export des messages, quatre images, la sauvegarde SQLite, les états de migration, les journaux et les anciennes réactions.

## Choix définitif d'icône par réaction Discord

1. Le sujet épinglé **📌 Créer une quête** existe déjà dans le forum des quêtes.
2. Cliquer sur **Créer une quête** ou utiliser la commande de nouvelle quête. Le formulaire ouvre directement **titre** et **description**, sans choix d'emoji.
3. Le bot crée une discussion provisoire sans icône, publie la fiche **sans répéter le titre** et ajoute une réaction **👍** pour que les joueurs signalent leur intérêt.
4. Un avertissement apparaît dans la fiche : **« Quête non finalisée : ajoutez une réaction (autre que 👍) à ce message pour choisir définitivement l'icône de la quête. »**
5. La première réaction avec un **emoji Unicode standard** (par exemple 🐸, 👻, 😈) déposée sur le **premier message du bot** fixe définitivement l'icône dans le titre du fil. L'avertissement disparaît automatiquement. Les réactions suivantes, les réactions sur des réponses et celles du bot ne changent rien. Les 👍 restent réservés aux inscriptions.
6. **Modifier** ouvre directement le formulaire titre + description, sans choix d'icône. **Exception volontaire :** `/changer-icone-quete icone:🐸`, lancée dans une quête créée par le bot, permet à n'importe quel PJ de changer l'icône après sa finalisation. La commande valide un emoji Unicode unique et met à jour le titre Discord, SQLite et le catalogue cartographique. La confirmation est privée. Les anciennes quêtes conservent leur icône précédente tant que la commande n'est pas utilisée.
7. Pour les lieux, utiliser **Associer un lieu** ou **Créer un lieu sur la carte** ; le bot synchronise ensuite la fiche.
8. **Terminer** et **Relancer** conservent leurs fonctionnalités, dont le compte rendu obligatoire.

La commande `/changer-icone-quete` est utilisable dans les quêtes créées par le bot, pas dans le sujet d'accueil, une discussion historique ni une quête portant le tag `obsolète`. Tous les PJ ont les mêmes droits.

Les réactions de type **emoji personnalisé du serveur** ne peuvent pas être représentées par un véritable emoji dans un titre de discussion : seules les réactions Unicode standards servent ici au choix de l'icône.

Les commandes `/terminer-quete` et `/relancer-quete` restent disponibles et utilisent les mêmes opérations que les boutons, y compris le compte rendu et la mise à jour du premier message.

## Ce qui est reporté

- **Terminé le 28 octobre 2026 :** migration des 15 discussions historiques et copie des messages.
- Désactivation du bouton natif « Nouvelle publication » pour les joueurs.
- Création de nouveaux lieux officiels depuis Discord : pour le pilote, seul le MJ crée les lieux, les joueurs choisissent parmi les lieux actuellement publiés sur la carte.
- Carte hybride, emojis comme marqueurs, regroupement géographique et séparation au zoom. Le bouton **Voir sur la carte** ouvre pour le moment la carte PJ, sans zoom automatique sur le lieu.

## Vérifications et sécurité

- Les migrations SQLite **045** et **046** enregistrent les quêtes du bot et le choix définitif de leur emoji. Le mécanisme existant sauvegarde la base avant migration.
- Les boutons, les descriptions et le verrou de l'emoji sont conservés dans SQLite et survivent aux redémarrages.
- Si la création de discussion fonctionne mais qu'une opération SQLite ou Discord échoue ensuite, le bot peut laisser une discussion partiellement créée. Vérifier et corriger ce cas avant un déploiement étendu.
- Le sujet d'accueil est **déjà installé**. La commande d'installation n'est plus publiée ; le bouton existant continue de fonctionner.
- Les boutons ne doivent pas mentionner massivement les joueurs : `allowedMentions.parse=[]`.
- Les fils historiques sont maintenant marqués `obsolète` ; toute annulation doit suivre le plan de retour arrière ci-dessous, pas simplement retirer le tag.

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

**Résultat vérifié (28 octobre 2026) :** 15 quêtes bot, 122 entrées de messages historiques représentées dans **118 publications**, dont 5 compléments regroupant 9 très courts messages de répétition de titres. Quatre pièces jointes/images conservées et réimportées. Les vérifications portent sur les statuts, les tags, les liens, les composants Discord, l'absence de mentions et l'option `SUPPRESS_NOTIFICATIONS` (pas de notification push ou bureau, mais une activité peut toujours apparaître dans Discord).

Les données SQLite conservent le mapping `ancien ID → nouvel ID` dans `pf2_quest_migration_20261028`. Cette table de suivi est créée par le script de migration ponctuel `scripts/pf2/migrate-discord-quests-20261028.py`. Les journaux et le rapport d'anciennes réactions sont dans le répertoire privé de sauvegarde ; ne **pas** les versionner dans GitHub.

Pour un retour global, exécuter sur le mini-PC après sauvegarde :

`python3 scripts/pf2/migrate-discord-quests-20261028.py rollback`

Cela archive les nouvelles discussions et les marque `obsolète`, remet les associations cartographiques sur les fils historiques et désarchive/déverrouille ceux-ci en rétablissant leurs tags d'origine. **Retirer le tag seul ne suffit pas** pour remettre les associations de carte et écarter les doublons. Le retour arrière de la migration ne ressuscite **pas** la quête test volontairement supprimée.

La migration historique ne constitue pas encore la **carte hybride** (regroupement des points par lieu et éclatement au zoom) ; ce chantier reste distinct.
