# Pilote : quêtes créées par le bot Discord

## Portée

Ce pilote **ne migre, ne supprime et n'archive aucune discussion existante**.
On conserve la création normale dans Discord pendant les essais.
Pas de tag `essai` et aucun feature flag général.

- Les anciennes discussions continuent à fonctionner comme aujourd'hui.
- Les quêtes créées par le bot ont un premier message structuré et des boutons persistants.
- Le bot utilise le tag exact **`obsolète`** pour exclure une discussion de `/choix-quete`, du catalogue de quêtes actives et des associations cartographiques actives. Ce tag **n'est appliqué automatiquement à aucune discussion**. Les données et les fils restent conservés pour une future migration.
- Le tag `Terminée` continue de déterminer la fin d'une quête; ne pas confondre avec `obsolète`.
- L'accueil `📌 Créer une quête` n'est **jamais comptabilisé comme une quête**, même quand il est visible dans le forum.

## Choix définitif d'icône par réaction Discord

1. Le sujet épinglé **📌 Créer une quête** existe déjà dans le forum des quêtes.
2. Cliquer sur **Créer une quête** ou utiliser la commande de nouvelle quête. Le formulaire ouvre directement **titre** et **description**, sans choix d'emoji.
3. Le bot crée une discussion provisoire sans icône, publie la fiche **sans répéter le titre** et ajoute une réaction **👍** pour que les joueurs signalent leur intérêt.
4. Un avertissement apparaît dans la fiche : **« Quête non finalisée : ajoutez une réaction (autre que 👍) à ce message pour choisir définitivement l'icône de la quête. »**
5. La première réaction avec un **emoji Unicode standard** (par exemple 🐸, 👻, 😈) déposée sur le **premier message du bot** fixe définitivement l'icône dans le titre du fil. L'avertissement disparaît automatiquement. Les réactions suivantes, les réactions sur des réponses et celles du bot ne changent rien. Les 👍 restent réservés aux inscriptions.
6. **Modifier** ouvre directement le formulaire titre + description. L'icône retenue n'y est plus modifiable. Les quêtes antérieures à cette modification conservent leur icône précédente et ne repassent pas en état non finalisé.
7. Pour les lieux, utiliser **Associer un lieu** ou **Créer un lieu sur la carte** ; le bot synchronise ensuite la fiche.
8. **Terminer** et **Relancer** conservent leurs fonctionnalités, dont le compte rendu obligatoire.

Les réactions de type **emoji personnalisé du serveur** ne peuvent pas être représentées par un véritable emoji dans un titre de discussion : seules les réactions Unicode standards servent ici au choix de l'icône.

Les commandes `/terminer-quete` et `/relancer-quete` restent disponibles et utilisent les mêmes opérations que les boutons, y compris le compte rendu et la mise à jour du premier message.

## Ce qui est reporté

- Migration, recréation des 15 anciennes discussions et copie des historiques.
- Désactivation du bouton natif « Nouvelle publication » pour les joueurs.
- Création de nouveaux lieux officiels depuis Discord : pour le pilote, seul le MJ crée les lieux, les joueurs choisissent parmi les lieux actuellement publiés sur la carte.
- Carte hybride, emojis comme marqueurs, regroupement géographique et séparation au zoom. Le bouton **Voir sur la carte** ouvre pour le moment la carte PJ, sans zoom automatique sur le lieu.

## Vérifications et sécurité

- Les migrations SQLite **045** et **046** enregistrent les quêtes du bot et le choix définitif de leur emoji. Le mécanisme existant sauvegarde la base avant migration.
- Les boutons, les descriptions et le verrou de l'emoji sont conservés dans SQLite et survivent aux redémarrages.
- Si la création de discussion fonctionne mais qu'une opération SQLite ou Discord échoue ensuite, le bot peut laisser une discussion partiellement créée. Vérifier et corriger ce cas avant un déploiement étendu.
- Le sujet d'accueil est **déjà installé**. La commande d'installation n'est plus publiée ; le bouton existant continue de fonctionner.
- Les boutons ne doivent pas mentionner massivement les joueurs : `allowedMentions.parse=[]`.
- **Ne pas utiliser** `obsolète` sur les anciennes discussions avant la migration prévue.

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
