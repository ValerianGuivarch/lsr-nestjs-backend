# Personnages joueurs — index

[← Espace PF2](PF2_WORKSPACE.md)

Les fiches MJ suivent un [modèle commun de continuité](pf2/pj/STRUCTURE_FICHES_MJ.md) distinguant faits connus, secrets validés, quêtes prévues, pistes théoriques et questions ouvertes.

Les **douze PJ** disposent chacun d'une fiche de continuité. Les biographies et choix d'évolution seront étoffés lorsque les documents et descriptions des joueurs seront disponibles : ne pas remplir les blancs artificiellement. L'état mécanique effectif est celui de Foundry.

| Personnage | Fiche |
| --- | --- |
| Éos | [Éos](pf2/pj/PJ-Eos.md) |
| Eryn / Elyn | [Eryn / Elyn](pf2/pj/PJ-Eryn-Elyn.md) |
| Jilkra Adoric Larantis | [Jilkra](pf2/pj/PJ-Jilkra-Adoric-Larantis.md) |
| Neyla | [Neyla](pf2/pj/PJ-Neyla.md) |
| Pen-Pen | [Pen-Pen](pf2/pj/PJ-Pen-Pen.md) |
| Pépin | [Pépin](pf2/pj/PJ-Pepin.md) |
| Ruhtra Sang-du-Soleil | [Ruhtra](pf2/pj/PJ-Ruhtra-Sang-du-Soleil.md) |
| Sashka | [Sashka](pf2/pj/PJ-Sashka.md) |
| Tsuyu-Nagori / Tsuyi | [Tsuyu](pf2/pj/PJ-Tsuyu-Nagori.md) |
| Vaga | [Vaga](pf2/pj/PJ-Vaga.md) |
| Yaz Lorok | [Yaz](pf2/pj/PJ-Yaz-Lorok.md) |
| Zab | [Zab](pf2/pj/PJ-Zab.md) |

Conserver des champs facultatifs pour le **joueur**, les **liens wiki/Google Docs/Discord/ChatGPT** et les **choix envisagés**. Les éléments à ranger plus tard vont dans la section `À trier`, sans leur attribuer une certitude qu'ils n'ont pas. [Ancienne synthèse de groupe](pf2/pj/Personnages-joueurs.md) (cosmologie et arc Camus).

## Contacts et salons Discord des personnages

Pour compléter et vérifier les contacts des douze PJ, consulter les conversations de leurs salons Discord via le lecteur local en lecture seule décrit dans [Wiki / Discord](pf2/outils/wiki-discord.md). Recouper les messages avec le Background et les Notes du Wiki/SQLite, ainsi que la continuité MJ des fichiers `pf2/pj/`. Toute nouvelle information à enregistrer requiert validation du MJ.

## Visibilité des personnages et des portraits

La documentation technique de référence est [Visibilité des personnages PF2](pf2/outils/personnages-visibilite.md). Le statut `is_published` concerne le **carnet général**, et non l'existence d'une fiche MJ. Un contact privé n'apparaît que dans les Contacts des PJ qui le connaissent ; une fiche privée ne devient pas publique lorsqu'on l'associe. Le champ `portrait_known` de chaque relation permet au MJ de cacher **l'image** à un PJ tout en lui laissant connaître le nom et la description autorisée. Les secrets MJ restent exclusivement dans les données MJ.

## Champ Caractère des douze PJ

L'onglet **Fiche** du wiki contient un champ **Caractère** éditable (2 à 3 phrases, sans secret MJ) dans `pf2_player_character_profile.personality`. Les propositions initiales sont établies à partir du Background SQLite et des notes de continuité MJ, sans révéler d'éléments réservés au MJ. La validation et les retouches finales appartiennent au MJ.
