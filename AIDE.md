# Aide PF2

[← Espace PF2](PF2_WORKSPACE.md)

Espace réservé aux aides réutilisables : règles maison validées, procédures MJ, générateurs et guides. Ne pas archiver ici les simples questions résolues, ni recopier les règles officielles inutilement.

Les règles mécaniques utilisées en jeu doivent être confirmées avec les sources PF2 et Foundry. Les guides techniques d'intégration relèvent des [Outils](OUTILS.md).

## Ressources MJ externes

La bibliothèque métier **Ressources** de PF2-MJ sert à conserver des contenus externes ou génériques réutilisables sans les transformer en scénarios du catalogue. Les données complètes vivent dans SQLite ; ce document ne doit conserver que les sources, méthodes et conventions utiles.

### Sources identifiées

- **Trilemma Adventures** — première source réellement intégrée ; aventures et lieux compacts, souvent system-neutral, faciles à adapter.
- **One Page Dungeon Contest** — prochaine source prioritaire à explorer ; plusieurs centaines de petits donjons, donc à présélectionner plutôt qu'à importer intégralement.
- **DiceAverageRPG – Free One-Page Adventures** — petits scénarios et lieux à faible coût de lecture, adaptés à une présélection.
- **1pagedungeons (itch.io)** — one-page dungeons et anthologies system-neutral.
- **d4 Caltrops** — hexes, rencontres, lieux sauvages et tables ; utile surtout pour exploration et improvisation.
- **Dyson Logos** — surtout une banque de cartes ; ne pas créer automatiquement une ressource métier pour chaque plan.
- **Watabou / Procgen Arcana** et **donjon** — générateurs à conserver comme outils de MJ, pas comme catalogues à importer entrée par entrée.
- **The Alexandrian** — méthodes de conception de scénarios et d'enquêtes ; référence méthodologique, pas banque de quêtes.

### Méthode de curation

Ne pas importer mécaniquement des centaines de contenus. La méthode cible est :

```text
source externe
→ index léger de candidats
→ pitch + tags + évaluation rapide
→ présélection
→ ressource complète uniquement si elle est réellement intéressante
```

Une ressource promue dans PF2-MJ reçoit alors au minimum un titre français, le `nom_vo`, une description courte, un résumé MJ détaillé et lisible, l'origine, des tags et ses fichiers utiles. Plusieurs variantes d'un même contenu doivent rester rattachées à **une seule ressource** lorsque c'est pertinent.

L'état technique courant de la bibliothèque est documenté dans [pf2/outils/donnees.md](pf2/outils/donnees.md). Le projet futur d'élargissement et de présélection est détaillé dans [todo.md](todo.md).
