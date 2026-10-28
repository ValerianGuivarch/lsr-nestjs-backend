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

## Après validation de la PR et déploiement

1. Le sujet épinglé **📌 Créer une quête** existe déjà dans le forum journal-de-quetes. La commande d'installation a été retirée.
2. Cliquer **Créer une quête** ou utiliser /nouvelle-quete. Choisir une icône dans le menu visuel ; **Autre emoji…** permet de saisir un emoji Unicode personnalisé.
3. Saisir le titre et la description dans le formulaire suivant, sans champ emoji prérempli.
4. Pour le test : 😈 Invoquer le démon de la destruction du monde, description fantaisiste du rituel à la Grande Loge.
5. Dans la quête, cliquer **Associer un lieu**. Le menu explique deux parcours : sélectionner un lieu existant ou ouvrir la carte PJ avec le bouton **Créer un lieu sur la carte**. Sur la carte, bouton **＋ Lieu**, clic sur la position, type **★ Lieu de quête**, sélection de la quête puis enregistrement.
6. Les boutons **Modifier**, **Terminer**, **Relancer**, et **Voir sur la carte** restent utilisables. **Modifier** permet aussi de modifier l'icône via le même menu, pour tous les PJ.
7. Vérifier /choix-quete : les discussions historiques continuent de fonctionner, le sujet d'accueil n'est jamais compté.

Les commandes `/terminer-quete` et `/relancer-quete` restent disponibles et utilisent les mêmes opérations que les boutons, y compris le compte rendu et la mise à jour du premier message.

## Ce qui est reporté

- Migration, recréation des 15 anciennes discussions et copie des historiques.
- Désactivation du bouton natif « Nouvelle publication » pour les joueurs.
- Création de nouveaux lieux officiels depuis Discord : pour le pilote, seul le MJ crée les lieux, les joueurs choisissent parmi les lieux actuellement publiés sur la carte.
- Carte hybride, emojis comme marqueurs, regroupement géographique et séparation au zoom. Le bouton **Voir sur la carte** ouvre pour le moment la carte PJ, sans zoom automatique sur le lieu.

## Vérifications et sécurité

- La migration SQL **045** ajoute `pf2_discord_quest.obsolete` et `pf2_quest_ui`. Le mécanisme existant effectue une sauvegarde SQLite avant migration en production.
- Les boutons de création et d'édition n'utilisent pas d'état temporaire : leurs identifiants et les descriptions du bot sont en SQLite, donc survivent à un redémarrage.
- Si la création de discussion fonctionne mais qu'une opération SQLite ou Discord échoue ensuite, le bot peut laisser une discussion partiellement créée. Vérifier et corriger ce cas avant un déploiement étendu.
- Le sujet d'accueil est **déjà installé**. La commande d'installation n'est plus publiée ; le bouton existant continue de fonctionner.
- Les boutons ne doivent pas mentionner massivement les joueurs : `allowedMentions.parse=[]`.
- **Ne pas utiliser** `obsolète` sur les anciennes discussions avant la migration prévue.
