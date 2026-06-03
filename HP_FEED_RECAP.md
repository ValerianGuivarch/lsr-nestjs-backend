# Récap HP → seed Poudlard (JdR)

Source : `https://l7r.fr/apil7r/v1/hp/wizards` + `/hp/spells` (150 sorts, base : Grimoire Keul) + image fiche Pearl.

## Décisions

- **PNJ animaux** : `Suzhan`, `Chiron`, `Taz`, `Bellefeuille` sont les mascottes des PJ — pas des maisons.
- **Maisons Poudlard** : Gryffondor, Serpentard, Serdaigle, Poufsouffle + groupe `Poudlard`.
- **Sorts** : nouveau `TraitType.SORT = 'Sort'` + champ `level: number | null`.
  - On crée **les 150 sorts HP** (rangs 0 à 4) en traits `Sort`, `level = rank`.
  - `Animagus` (rang 4) est créé comme sort mais **pas attribué à Pearl** (sur demande).
- **Traits PJ** :
  - Tous les PJ : 1 trait perso = leur animal mascotte (`Normal`, sans mod), sauf Gédéon (pas d'animal).
  - Pearl : ses 11 avantages (`Normal`) + 4 désavantages (`Defaut`), **avec modificateurs de stat** pour atteindre ses stats cibles.
- **Stats** : 6 stats HP — `Physique, Dextérité, Intelligence, Perception, Charisme, Pouvoir`.
  - **Base par défaut : 2 pour chaque stat, pour tous les PJ.**
  - Pearl : les traits perso modifient cette base pour aboutir aux stats voulues.
  - Autres PJ (Caly, Maggie, Actéon, Gédéon) : restent à 2/2/2/2/2/2 (pas de traits avec mods côté seed).

## Personnages joueurs (5)

| PJ | Animal | Stats finales (Phys/Dex/Int/Perc/Char/Pou) |
|---|---|---|
| Pearl | Suzhan | 0 / -1 / 2 / 1 / 4 / -3 (via mods de traits) |
| Caly | Taz | 2 / 2 / 2 / 2 / 2 / 2 |
| Maggie | Bellefeuille | 2 / 2 / 2 / 2 / 2 / 2 |
| Actéon | Chiron | 2 / 2 / 2 / 2 / 2 / 2 |
| Gédéon Runelock | — | 2 / 2 / 2 / 2 / 2 / 2 |

PV : 5/5 chacun. Tous classe `Élève` (lvl 1), groupe `Poudlard`, `isPlayable=true`.

## Traits de Pearl (15) avec modificateurs

Cibles Pearl (base 2) → final : Phys 0, Dex -1, Int 2, Perc 1, Char 4, Pouv -3.
Net mods à appliquer : Phys -2, Dex -3, Int 0, Perc -1, Char +2, Pouv -5.

### Avantages (type `Normal`)

| Trait | Mods |
|---|---|
| Doué (commandement) | Charisme +1 |
| Chouchou de Mme Bibine | — (narratif) |
| Famille influente | Charisme +1 |
| Charismatique | Charisme +2 |
| Premier de la classe | Intelligence +1 |
| Sang Pur | Pouvoir +1 |
| Excellent jeu d'échec | Intelligence +1 |
| Self Contrôle | Pouvoir +1 |
| Jeu d'échec de sorcier | Intelligence +1 |
| Voyant véritable | Perception +1 |
| Lien sensoriel avec le familier | — (narratif) |

Sous-total : Char +4, Int +3, Pouv +2, Perc +1.

### Désavantages (type `Defaut`)

| Trait | Mods |
|---|---|
| Amoureux collant | Intelligence -1 |
| Poissard | Physique -2, Dextérité -2, Perception -2 |
| Fauché | Pouvoir -3 |
| Défaut psychologique : méprisant avec les inférieurs et les rivaux | Charisme -2, Dextérité -1, Intelligence -2, Pouvoir -4 |

Sous-total : Phys -2, Dex -3, Int -3, Perc -2, Char -2, Pouv -7.

### Vérification

| Stat | Base | + Avantages | + Désavantages | Final |
|---|---|---|---|---|
| Physique | 2 | 0 | -2 | **0** ✓ |
| Dextérité | 2 | 0 | -3 | **-1** ✓ |
| Intelligence | 2 | +3 | -3 | **2** ✓ |
| Perception | 2 | +1 | -2 | **1** ✓ |
| Charisme | 2 | +4 | -2 | **4** ✓ |
| Pouvoir | 2 | +2 | -7 | **-3** ✓ |

## Sorts (150, tous créés en `TraitType.Sort`)

Tous les sorts du grimoire HP sont créés comme traits `Sort` avec `level = rank` (0 à 4).

- Rang 0 : 10 sorts (cantrips). Ex. Chauffe-boisson, Flocon de neige, Parapluie, Magie domestique, Ruban, Creation temporaire…
- Rang 1 : 58 sorts. Ex. Wingardium leviosa, Lumos/Nox, Alohomora, Incendio, Aparecium, Pesternum, Lapsus, Lenister, Avifors, Reparo…
- Rang 2 : 79 sorts. Ex. Alarte Ascendare, Aresto Momentum, Expelliarmus, Mobili "Nom", Lashlabask, Riddikulus, Locomotor…
- Rang 3 : 2 sorts. Agrandissement (Engorgio), Serenitas.
- Rang 4 : 1 sort. **Animagus** (créé mais pas attribué à Pearl).

Liste complète tirée de `GET /apil7r/v1/hp/spells` (snapshot dans `/tmp/hp_spells.json`).

## Sorts attribués aux PJ (depuis HP API)

- **Pearl (12)** : Pesternum, Creation temporaire, Liquide vers Liquide, Lévitation d'objets (Wingardium leviosa), Ouverture simple (Alohomora), Sortilège de feu (Incendio), Nettoyage de vêtements (Tergeo), Croche-pied (Lapsus), Finestra, Lumière / Obscurité (Lumos / Nox), Ralentissement de petites créatures (Lenister), Refroidissement (Frigidus). _(Animagus retiré)_
- **Caly (14)** : Pesternum, Magie domestique, Objet vers Objet, Creation temporaire, Lacer (Laqueare), Wingardium leviosa, Objets chantant (Cantis), Reparo, Incendio, Lapsus, Lumos/Nox, Lenister, Avifors, Frigidus.
- **Maggie (12)** : Pesternum, Wingardium leviosa, Reparo, Aparecium, Incendio, Surface miroir (Mirare), Lapsus, Lumos/Nox, Lenister, Frigidus, Décélération (Aresto Momentum), Serenitas.
- **Actéon (13)** : Pesternum, Flocon de neige, Ruban, Detonation (Badabam), Wingardium leviosa, Incendio, Tergeo, Lapsus, Lumos/Nox, Lenister, Avifors, Frigidus, Déplacement (Mobili "Nom").
- **Gédéon (8)** : Pesternum, Chauffe-boisson, Flocon de neige, Parapluie, Lumos/Nox, Frigidus, Alarte Ascendare, Libération (Lashlabask).

## Plan d'implémentation `seedHpFeed()`

1. Reset (`deleteJdr` si existant) puis `createJdr('Feed HP', …)`.
2. 6 stats : Physique, Dextérité, Intelligence, Perception, Charisme, Pouvoir.
3. 1 classe `Élève` (lvl 1).
4. 5 groupes : Gryffondor, Serpentard, Serdaigle, Poufsouffle, Poudlard.
5. Ressources : `PV` (all), `Points Gryffondor`/`Serpentard`/`Serdaigle`/`Poufsouffle` (group).
6. Traits PNJ-animaux (4, type `Normal`, sans mod) : Suzhan, Chiron, Taz, Bellefeuille.
7. Traits Pearl (15) : 11 `Normal` + 4 `Defaut` avec mods tableau ci-dessus.
8. Traits Sort (150) : un par sort HP, `level = rank`.
9. 5 PJ : Pearl, Caly, Maggie, Actéon, Gédéon (classe `Eleve`, `isPlayable=true`, groupe `Poudlard`).
10. Pour chaque PJ : `updateCharacterStat` ×6 (toutes à 2 — Pearl idem, ses traits feront le travail), `addCharacterTrait` pour son animal mascotte (sauf Gédéon), `addCharacterTrait` pour chacun de ses sorts.
11. Pour Pearl uniquement : `addCharacterTrait` pour ses 15 traits perso.

## Modifs domaine déjà appliquées

- `TraitType` : ajout de `SORT = 'Sort'`.
- `Trait` (domain) : champ `level: number | null`.
- `DBJdrTrait` : colonne `level int nullable` (synchronize=true → auto-migrée).
- `TraitDto` / `AddTraitRequest` / `UpdateTraitRequest` / `JdrApiClient.addTrait` / `updateTrait` : champ `level` propagé bout en bout.
