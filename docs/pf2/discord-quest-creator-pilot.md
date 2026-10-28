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

1. **MJ/admin :** lancer une seule fois `/installer-creation-quete` sur le serveur Discord. Le bot crée le sujet `📌 Créer une quête` dans `journal-de-quetes` et essaie de l'épingler en tête du forum. Si l'épinglage échoue, épingler manuellement le sujet (permission *Gérer les fils* nécessaire). La commande est idempotente et réaffiche le lien si le sujet existe.
2. **Joueur :** ouvrir le sujet épinglé et cliquer sur **Créer une quête**. Alternativement, utiliser `/nouvelle-quete` sur le serveur.
3. Pour le test, choisir l'emoji **😈**, le titre **Invoquer le démon de la destruction du monde**, et une description fantaisiste sur le rituel à la Grande Loge.
4. Le bot crée la discussion. Ouvrir son premier message : les boutons **Associer un lieu**, **Retirer un lieu**, **Modifier**, **Terminer** et **Voir sur la carte** s'y trouvent.
5. Cliquer **Associer un lieu**, puis choisir **Grande Loge**. Les lieux existants peuvent être associés un par un ou par sélection multiple. La fiche se met à jour; l'API cartographique contient le nouveau lien.
6. Cliquer **Modifier** depuis un **autre compte PJ** : les mêmes droits s'appliquent à tous les joueurs, sans restriction à l'auteur.
7. Cliquer **Terminer** : le formulaire existant demande toujours un **compte rendu obligatoire**, le bot applique `Terminée` et libère les réservations 👍. Vérifier que le bouton est devenu **Relancer**; celui-ci retire le tag et réouvre la quête.
8. Vérifier `/choix-quete` : les anciennes quêtes et la quête pilote sont présentes (si elles ne sont pas terminées), mais **pas** le sujet d'accueil.

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
- La création du sujet d'accueil est une **action manuelle** après déploiement, déclenchée via la commande admin. Aucune discussion n'est publiée lors de la compilation, de la CI ou de la migration SQL.
- Les boutons ne doivent pas mentionner massivement les joueurs : `allowedMentions.parse=[]`.
- **Ne pas utiliser** `obsolète` sur les anciennes discussions avant la migration prévue.
