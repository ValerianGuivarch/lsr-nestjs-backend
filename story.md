# STORY.md — Index de la bible de continuité PF2

> **Point d'entrée unique pour le lore de campagne.** Les informations détaillées sont rangées dans le dossier [`story/`](story/). Ce fichier explique où chercher et comment maintenir la continuité ; il ne doit plus redevenir un grand document monolithique. Pour l'état technique de l'infrastructure, voir [RECAP.md](RECAP.md).

## Comment utiliser cette bible

Chaque décision narrative doit être rangée dans **le fichier thématique qui lui correspond**. Lorsqu'un sujet touche plusieurs domaines, on conserve l'information principale à un seul endroit et on ajoute des liens depuis les fichiers connexes plutôt que de recopier le même texte partout.

Quatre statuts doivent rester distincts :

1. **Canon Pathfinder** — élément provenant des publications officielles.
2. **Adaptation validée** — élément explicitement vrai dans notre version de Golarion, même s'il diffère du canon.
3. **Provisoire / à définir** — piste de travail discutée mais pas encore verrouillée.
4. **Chronique de lecture** — exploration narrative d'une aventure, qui ne signifie pas que les PJ l'ont réellement vécue.

**Règle générale :** ne jamais combler un blanc par une invention silencieuse. Si une information canonique exacte n'a pas été vérifiée ou si une décision de campagne n'a pas été prise, le document doit le dire.

## Où chercher

| Sujet | Fichier de référence |
| --- | --- |
| Principes de la campagne, continuité, statuts des informations | [Cadre et continuité](story/Cadre-et-continuite.md) |
| Intrigues commencées, pistes et campagnes actuellement ouvertes | [Fronts de campagne](story/Fronts-de-campagne.md) |
| Corvan, Veilleurs de la Côte Perdue, Chasseurs de l'Étoile | [Héros historiques](story/Heros-historiques.md) |
| Repères historiques thassiloniens et Nouvelle Thassilon | [Chronologie thassilonienne](story/Chronologie-thassilon.md) |
| Société des Éclaireurs, mentors, Décemvirat, Torche, Eylysia | [Société des Éclaireurs](story/Societe-des-Eclaireurs.md) |
| Groupe rival d'Eylysia | [Équipe rivale](story/Equipe-rivale.md) |
| Les douze PJ et leurs intrigues personnelles | [Personnages joueurs](story/Personnages-joueurs.md) |
| Labyrinthe de la Route Ouverte, portails et Anneau d'Alséta | [Labyrinthe et portails](story/Labyrinthe-et-portails.md) |
| Pointesable, Nualia et les Sept Fléaux | [Pointesable](story/Pointesable.md) |
| **Absalom : ville, presse, Agents de la Falaise, pègre et guildes de voleurs** | [Absalom](story/Absalom.md) |
| Campagnes envisagées et chroniques servant à leur évaluation | [Campagnes et lectures](story/Campagnes-et-lectures.md) |
| Héros issus d'anciennes campagnes PF1 intégrés au monde PF2 | [Héritage PF1](story/Heritage-PF1.md) |

## Liens transverses utiles

- **Absalom** est le fichier de référence pour tout ce qui concerne la ville elle-même. Les organisations criminelles et guildes de voleurs y sont centralisées ; les personnages qui les fréquentent restent décrits dans leurs fichiers propres.
- **Société des Éclaireurs** contient les institutions, mentors et figures récurrentes de la Société. Lorsqu'un personnage ou un réseau d'Absalom sert aussi de contact à la Société, les deux fichiers doivent se renvoyer l'un à l'autre.
- **Personnages joueurs** contient les arcs personnels. Les détails géographiques, historiques ou institutionnels associés doivent rester dans les fichiers thématiques correspondants.
- **Héritage PF1** ne remplace pas les biographies des héros historiques : il enregistre spécifiquement les décisions qui font d'anciennes campagnes PF1 une partie de l'histoire réelle du monde actuel.
- **Fronts de campagne** décrit l'état actuel des pistes ; il ne doit pas absorber tout le lore permanent des lieux et factions concernés.

## Maintenance

- Ajouter une décision définitive dans le fichier thématique concerné.
- Si la décision relie une aventure PF1 au monde PF2 actuel, mettre également à jour [Héritage PF1](story/Heritage-PF1.md).
- Après les séances, actualiser l'état réel des intrigues dans [Fronts de campagne](story/Fronts-de-campagne.md).
- Ne pas confondre **lore MJ** et informations déjà publiées aux joueurs.
- Quand un nouveau grand lieu ou sujet devient assez dense, créer un nouveau fichier dans `story/`, puis l'ajouter à cet index avec des liens depuis les documents connexes.
- La première réorganisation du 10 octobre 2026 avait réparti les 30 sections de l'ancien `story.md` en fichiers thématiques. La présente structure conserve ce contenu mais place désormais tous ces fichiers sous `story/` avec des noms explicites et un index stable.
