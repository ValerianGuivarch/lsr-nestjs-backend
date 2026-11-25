# Aide aux personnages — commande /aide et Wiki

[← Outils](../../OUTILS.md) · [Personnages joueurs](../../PJ.md)

## Périmètre

Cinq PJ sont concernés : **Sashka, Pépin, Zab, Vaga et Neyla**.
Les autres PJ n'ont pas besoin d'aide guidée spécifique.

- **Sashka** : accompagner la création tout en préservant plusieurs possibilités et la liberté de choisir.
- **Pépin** : roublard social et éclaireur-aventurier ; importer les décisions déjà prises depuis le fichier du MJ lorsqu'il sera transmis.
- **Zab** : bâtir les conseils à partir de sa personnalité et de son jeu de rôle.
- **Vaga** : accompagnement pas à pas sans présupposer qu'il planifiera ses futurs niveaux.
- **Neyla** : conseils simples et directement utilisables en jeu.

Ces orientations ne sont **pas** des dons déjà choisis ou appliqués.

## Contenu des trois sections

Source de vérité éditable : **SQLite**, table **pf2_player_character_help**, clé NPC, migration **060-player-character-help**.

1. **Comment le jouer** : résumé opérationnel de ce que le personnage sait faire à son niveau actuel, utilisable immédiatement en séance. **Maximum 1 700 caractères**. C'est le texte normalement affiché par Discord /aide.
2. **Faire son prochain niveau** : décisions concrètes à prendre pour le **niveau cible** enregistré (2 à 20), avec leurs alternatives et prérequis. **Maximum 1 700 caractères**. Discord affiche cette section si un passage de niveau est dû **ou si le MJ a indiqué un niveau déjà affiché sur Foundry mais dont les choix ne sont pas terminés**. Le guide doit correspondre exactement au niveau à faire ; sinon un avertissement signale qu'il reste à le préparer.
3. **Comment progresser** : vision du build à moyen et long terme, rôles, personnalité, décisions actées et alternatives futures, **maximum 16 000 caractères**. Consultable dans le Wiki, pas envoyé dans Discord.

L'onglet **Aide** du Wiki, dans **Mes personnages**, contient les trois sections. L'admin Wiki peut lire et modifier ; le propriétaire du personnage peut lire. Le contrôle des droits est vérifié côté serveur.

## Commande Discord /aide

- Ouvre une sélection privée de **ses propres personnages** parmi les cinq, d'après l'association Discord ↔ PJ enregistrée dans SQLite. **Valérian** peut choisir parmi les cinq.
- Sélection multiple possible, une réponse privée par personnage.
- Comparaison automatique des **niveaux réel et théorique** via les snapshots Foundry enregistrés. Foundry reste la vérité mécanique ; **le niveau affiché ne garantit pas que les choix de dons/capacités sont terminés**.
- Champ distinct **Niveau à terminer** (unfinished_level, de 2 à 20 ou vide), piloté par le MJ dans le Wiki : permet d'indiquer un niveau dont les choix ne sont pas finalisés **même lorsque les deux niveaux Foundry/théorique sont identiques**. Il n'est jamais rempli par la simple égalité des niveaux. Lorsque ce niveau correspond au niveau affiché Foundry, la commande demande de **terminer ce niveau** et non d'en faire le suivant.
- **Cas confirmé par le MJ le 25 novembre 2026 : Pépin est affiché niveau 4, mais ses choix de niveau 4 restent à effectuer.** Migration 061-player-help-unfinished-level : unfinished_level=4 et next_level_for=4 si la cible n'avait pas déjà été définie. Le texte des choix reste à rédiger avec le MJ ; aucune modification de l'Actor n'est faite.
- Une fois les choix appliqués dans Foundry, **le MJ doit vider le champ Niveau à terminer** depuis l'onglet Aide. Un ancien marqueur ne prime pas sur un Actor Foundry ayant déjà changé de niveau : ne jamais servir le texte d'un niveau périmé.
- Si la dernière synchronisation est indisponible et qu'aucun état manuel n'est connu, ne pas supposer qu'un niveau est à faire. Lorsqu'un niveau est réellement à terminer, Discord présente le guide pour ce niveau s'il est rédigé ; sinon il indique explicitement que le contenu reste à préparer. Dans les autres cas, Discord affiche **Comment le jouer**.
- Aucun contenu n'est publié dans le salon, aucune mention Discord n'est utilisée. Un message Discord ne dépasse jamais 2 000 caractères.

## Mise à jour dans une discussion ultérieure

Pour « mets à jour Pépin/Sashka/Zab/Vaga/Neyla » :

1. Lire **PF2_WORKSPACE.md**, **PJ.md**, la fiche individuelle dans **pf2/pj/** et ce document. Vérifier les niveaux et dons réels **dans Foundry**, puis confronter au Wiki et à SQLite.
2. **Ne pas déduire qu'une montée est terminée de l'égalité niveau Foundry = niveau théorique.** Vérifier si les dons, augmentations et choix attendus pour le niveau affiché ont été effectués. Lorsque le niveau n'a pas changé et qu'aucun choix ni événement nouveau n'a évolué, demander quel besoin doit être travaillé, sauf si un niveau déjà affiché reste explicitement à finaliser (cas Pépin niveau 4). **Si un niveau a été gagné ou doit encore être terminé**, réviser les choix proposés et le contenu correspondant.
3. Séparer **choix réellement appliqués**, **choix décidés**, **propositions encore ouvertes** et **projets futurs**. Ne jamais enfermer Sashka dans une seule construction, ni privilégier l'optimisation contre la personnalité de Zab.
4. Préparer les trois sections, respecter la limite Discord, enregistrer par l'API autorisée du Wiki et vérifier l'affichage. **Ne pas modifier l'Actor Foundry** sans instruction explicite.
5. Les documents existants pour Pépin et Sashka seront fournis par le MJ. Ne pas inventer leur contenu avant réception. Amorcer ensuite les propositions pour Zab, Vaga et Neyla.

## Implémentation

- Métier : **PlayerCodexService.ts** et **PlayerCharacterHelp.ts**, dans apps/api-jdr/src/pf2-mj.
- Accès Wiki : **PlayerCodexController.ts**, API interne Wiki et extension **support/mediawiki/extensions/PF2PlayerCodex**.
- Discord : **DiscordCommandsService.ts**, commande /aide.
- Stockage : migrations **060-player-character-help** (textes) et **061-player-help-unfinished-level** (niveau encore à terminer) dans **Pf2PersistenceService.ts**.

Les textes des trois sections appartiennent à **SQLite** ; ce Markdown conserve les règles de travail, pas une copie divergente des textes du Wiki.
