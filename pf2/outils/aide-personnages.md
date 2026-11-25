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
2. **Faire son prochain niveau** : décisions concrètes à prendre pour le **niveau cible** enregistré (2 à 20), avec leurs alternatives et prérequis. **Maximum 1 700 caractères**. Discord affiche cette section **si le niveau théorique dépasse le niveau réel Foundry**, uniquement si la fiche correspond au niveau réel + 1 ; sinon un avertissement signale qu'il faut préparer cette montée.
3. **Comment progresser** : vision du build à moyen et long terme, rôles, personnalité, décisions actées et alternatives futures, **maximum 16 000 caractères**. Consultable dans le Wiki, pas envoyé dans Discord.

L'onglet **Aide** du Wiki, dans **Mes personnages**, contient les trois sections. L'admin Wiki peut lire et modifier ; le propriétaire du personnage peut lire. Le contrôle des droits est vérifié côté serveur.

## Commande Discord /aide

- Ouvre une sélection privée de **ses propres personnages** parmi les cinq, d'après l'association Discord ↔ PJ enregistrée dans SQLite. **Valérian** peut choisir parmi les cinq.
- Sélection multiple possible, une réponse privée par personnage.
- Comparaison automatique des **niveaux réel et théorique** via les snapshots Foundry enregistrés. Foundry reste la vérité mécanique ; si la dernière synchronisation est indisponible, ne pas supposer qu'un niveau est à faire.
- Si un nouveau niveau est à faire, présente la section dédiée au niveau suivant. Sinon, présente **Comment le jouer**. Si la section est vide, afficher explicitement qu'elle reste à préparer.
- Aucun contenu n'est publié dans le salon, aucune mention Discord n'est utilisée. Un message Discord ne dépasse jamais 2 000 caractères.

## Mise à jour dans une discussion ultérieure

Pour « mets à jour Pépin/Sashka/Zab/Vaga/Neyla » :

1. Lire **PF2_WORKSPACE.md**, **PJ.md**, la fiche individuelle dans **pf2/pj/** et ce document. Vérifier les niveaux et dons réels **dans Foundry**, puis confronter au Wiki et à SQLite.
2. **Si le niveau n'a pas changé**, ne pas fabriquer une modification : demander quel besoin, choix ou événement a évolué. **Si le niveau a changé ou si un niveau est à faire**, réviser les choix proposés et le contenu correspondant.
3. Séparer **choix réellement appliqués**, **choix décidés**, **propositions encore ouvertes** et **projets futurs**. Ne jamais enfermer Sashka dans une seule construction, ni privilégier l'optimisation contre la personnalité de Zab.
4. Préparer les trois sections, respecter la limite Discord, enregistrer par l'API autorisée du Wiki et vérifier l'affichage. **Ne pas modifier l'Actor Foundry** sans instruction explicite.
5. Les documents existants pour Pépin et Sashka seront fournis par le MJ. Ne pas inventer leur contenu avant réception. Amorcer ensuite les propositions pour Zab, Vaga et Neyla.

## Implémentation

- Métier : **PlayerCodexService.ts** et **PlayerCharacterHelp.ts**, dans apps/api-jdr/src/pf2-mj.
- Accès Wiki : **PlayerCodexController.ts**, API interne Wiki et extension **support/mediawiki/extensions/PF2PlayerCodex**.
- Discord : **DiscordCommandsService.ts**, commande /aide.
- Stockage : migration **060-player-character-help** dans **Pf2PersistenceService.ts**.

Les textes des trois sections appartiennent à **SQLite** ; ce Markdown conserve les règles de travail, pas une copie divergente des textes du Wiki.
