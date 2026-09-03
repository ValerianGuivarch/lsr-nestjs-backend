# Matrice de test — Actions guidées v0.21.0

- ⚡ **Direct** : le bouton lance immédiatement l'automatisation PF2e.
- ☰ **Menu d'action** : l'action fournit un choix ou une carte interactive.
- 🎲 **Choix de jet** : choix de compétence/statistique avant le jet.
- ▣ **Assistant PF2e** : dialogue/sélecteur natif PF2e.
- 📖 **Déclaration** : publie une carte courte dans le chat.
- × **Non automatisé** : règle consultable, implémentation à venir.

Changements de cette passe :
- une réussite d'une action **Bravade** utilisée via le Toolkit en combat ajoute automatiquement l'effet officiel **Panache** ;
- cela couvre notamment **Déplacement acrobatique** et les actions de style détectées depuis les Rule Elements PF2e, par exemple **Se produire** pour un Danseur de combat ;
- **Frapper** devient un vrai menu d'attaque ;
- si le personnage possède le Panache et **Aboutissement assuré**, le menu propose l'Aboutissement ;
- l'Aboutissement transmet les roll options `finisher` / `finisher:confident` à la vraie Frappe PF2e, puis consomme le Panache ;
- les dégâts restent ceux de PF2e : **Frappe précise** calcule elle-même le bon nombre de d6 selon le niveau.

## ⚡ Direct — 42

| Test | Action | Slug |
|---|---|---|
| ☐ | Chercher | `seek` |
| ☐ | Deviner les intentions | `sense-motive` |
| ☐ | Détourner le regard | `avert-gaze` |
| ☐ | Lever un bouclier | `raise-a-shield` |
| ☐ | Se jeter à terre | `drop-prone` |
| ☐ | Se relever | `stand` |
| ☐ | Contraindre | `coerce` |
| ☐ | Contrefaire | `create-forgery` |
| ☐ | Croc-en-jambe | `trip` |
| ☐ | Crocheter une serrure | `pick-a-lock` |
| ☐ | Diriger un animal | `command-an-animal` |
| ☐ | Dissimuler un objet | `conceal-an-object` |
| ☐ | Démoraliser | `demoralize` |
| ☐ | Déplacement acrobatique | `tumble-through` |
| ☐ | Désamorcer un dispositif | `disable-a-device` |
| ☐ | Désarmer | `disarm` |
| ☐ | Escalader | `climb` |
| ☐ | Escamoter un objet | `palm-an-object` |
| ☐ | Faire bonne impression | `make-an-impression` |
| ☐ | Feinter | `feint` |
| ☐ | Garder l'équilibre | `balance` |
| ☐ | Identifier l'alchimie | `identify-alchemy` |
| ☐ | Manœuvrer en vol | `maneuver-in-flight` |
| ☐ | Mentir | `lie` |
| ☐ | Nager | `swim` |
| ☐ | Ouvrir de force | `force-open` |
| ☐ | Pister | `track` |
| ☐ | Pousser | `shove` |
| ☐ | Recueillir des informations | `gather-information` |
| ☐ | Repositionner | `reposition` |
| ☐ | S'orienter | `sense-direction` |
| ☐ | Saisir | `grapple` |
| ☐ | Sauter en hauteur | `high-jump` |
| ☐ | Sauter en longueur | `long-jump` |
| ☐ | Se cacher | `hide` |
| ☐ | Se faire passer pour | `impersonate` |
| ☐ | Se faufiler | `squeeze` |
| ☐ | Soigner un empoisonnement | `treat-poison` |
| ☐ | Soigner une maladie | `treat-disease` |
| ☐ | Solliciter | `request` |
| ☐ | Voler (Larcin) | `steal` |
| ☐ | Être furtif | `sneak` |
## ☰ Menu d'action — 6

| Test | Action | Slug |
|---|---|---|
| ☐ | Bondir | `leap` |
| ☐ | Mise à l'abri | `take-cover` |
| ☐ | Faire diversion | `create-a-diversion` |
| ☐ | Prodiguer les premiers soins | `administer-first-aid` |
| ☐ | Se produire | `perform` |
## 🎲 Choix de jet — 9

| Test | Action | Slug |
|---|---|---|
| ☐ | Aider | `aid` |
| ☐ | Arrêter une chute | `arrest-a-fall` |
| ☐ | S'échapper | `escape` |
| ☐ | Se raccrocher in extremis | `grab-an-edge` |
| ☐ | Apprendre un sort | `learn-a-spell` |
| ☐ | Déchiffrer un texte | `decipher-writing` |
| ☐ | Identifier la magie | `identify-magic` |
| ☐ | Se souvenir | `recall-knowledge` |
| ☐ | Subsister | `subsist` |
## ▣ Assistant PF2e — 4

| Test | Action | Slug |
|---|---|---|
| ☐ | Fabriquer | `craft` |
| ☐ | Gagner de l'argent | `earn-income` |
| ☐ | Réparer | `repair` |
| ☐ | Soigner les blessures | `treat-wounds` |
## 📖 Déclaration — 6

| Test | Action | Slug |
|---|---|---|
| ☐ | Faire un pas | `step` |
| ☐ | Interagir | `interact` |
| ☐ | Préparer | `ready` |
| ☐ | Relâcher | `release` |
| ☐ | Retarder | `delay` |
| ☐ | Signaler | `point-out` |
## × Non automatisé — 17

| Test | Action | Slug |
|---|---|---|
| ☐ | Creuser | `burrow` |
| ☐ | Fixer un fulu | `affix-a-fulu` |
| ☐ | Fixer un talisman | `affix-a-talisman` |
| ☐ | Frapper | `strike` |
| ☐ | Investir un objet | `invest-an-item` |
| ☐ | Lancer un sort | `cast-a-spell` |
| ☐ | Maintenir | `sustain` |
| ☐ | Ramper | `crawl` |
| ☐ | Révoquer | `dismiss` |
| ☐ | Se mettre en selle | `mount` |
| ☐ | Voler (déplacement aérien) | `fly` |
| ☐ | Dissimuler des traces | `cover-tracks` |
| ☐ | Démanteler | `deconstruct` |
| ☐ | Emprunter un sort arcanique | `borrow-an-arcane-spell` |
| ☐ | Fortifier le camp | `fortify-camp` |
| ☐ | Roulade en chute libre | `plummeting-roll` |
| ☐ | Évaluation psychométrique | `psychometric-assessment` |


## Organisation v0.21.0

À vérifier dans l'interface :

- `Se souvenir` apparaît une seule fois dans **Actions courantes**.
- `Identifier la magie` apparaît une seule fois dans **Actions courantes**.
- `Déchiffrer un texte`, `Apprendre un sort`, `Subsister` et `Gagner de l'argent`
  apparaissent une seule fois dans **Actions situationnelles**.
- Les rubriques de compétences sont triées alphabétiquement selon leur nom français.
- `Voler`, `Creuser` et `Marcher rapidement` ne sont plus affichés.
- La page native **Maîtrises** doit afficher `Larcin`.
- `Mise à l'abri` ne doit présenter qu'un seul choix PF2e de niveau d'abri.

## v0.23.0 — Tests Bravade / marchand natif

### Bravade

| Profil | Action | Attendu |
|---|---|---|
| Bretteur Escrimeur | Déplacement acrobatique | Bravade ; contexte transmis à PF2e |
| Bretteur Escrimeur | Feinte | Bravade ; contexte transmis à PF2e |
| Bretteur Escrimeur | Créer une diversion | Bravade ; contexte transmis à PF2e |
| Bretteur Escrimeur | Se produire | Pas Bravade sauf autre capacité |
| Bretteur Danseur de combat | Déplacement acrobatique | Bravade |
| Bretteur Danseur de combat | Se produire | Bravade |
| Bretteur Danseur de combat | Feinte | Pas Bravade sauf autre capacité |
| Tout Bretteur | Action non accordée par ses Rule Elements | Aucun roll option Bravade injecté |

En combat, vérifier sur une action Bravade :
1. `Combattant stylé` apparaît dans les modificateurs applicables ;
2. le +1 de circonstances est pris en compte ;
3. réussite / réussite critique accorde l'effet officiel Panache ;
4. échec n'accorde pas Panache.

Hors combat, le roll option Bravade reste correct, mais le prédicat de
`Combattant stylé` décide lui-même si son bonus s'applique (par exemple via une
future capacité comme Continuous Flair). Le Toolkit n'ajoute aucun +1 à la
main.

### Marchand natif

Avec un compte joueur et un Loot Actor en mode Marchand :
1. ouvrir le marchand ;
2. vérifier le bouton `Acheter` sur chaque ligne ;
3. cliquer sur `Acheter` ;
4. vérifier le dialogue PF2e de quantité / prix ;
5. acheter une unité ;
6. vérifier la monnaie du PJ ;
7. vérifier l'objet dans l'inventaire du PJ ;
8. vérifier la quantité et la monnaie du marchand.

Tester aussi :
- fonds insuffisants ;
- plusieurs unités ;
- objet déjà présent dans l'inventaire du PJ ;
- aucun personnage assigné ;
- plusieurs personnages possédés sans personnage assigné.

## v0.23.1 — Test ciblé Danseur de combat

1. Démarrer une rencontre de combat avec Yaz.
2. Vérifier que Yaz n'a pas déjà Panache.
3. Cibler exactement un ennemi.
4. Actions → Se produire → Danse (ou autre variante).
5. Vérifier que le jet utilise le DD de Volonté de la cible.
6. Vérifier que Bravade apparaît dans le contexte/les traits du jet.
7. Vérifier que Combattant stylé applique son +1 de circonstances.
8. Sur réussite ou réussite critique : Panache doit être ajouté.
9. Sur échec ou échec critique : Panache ne doit pas être ajouté.

Sans cible, le Toolkit doit avertir qu'il ne peut pas automatiser le degré de
réussite de Se produire et ne doit pas inventer un Panache.

## v0.24.0 — Tests États & conditions

1. Ouvrir une fiche de personnage.
2. Vérifier le nouvel onglet `États & conditions`.
3. Vérifier les catégories :
   - Visibilité & sens
   - Position & entraves
   - Économie d’actions
   - Mental & comportement
   - Affaiblissements
   - Survie & blessures
   - Attitudes sociales
   - Autres états
4. Cliquer sur `À terre` / `Prone` :
   - le résumé doit s'étendre ;
   - la description officielle PF2e doit être affichée.
5. Cliquer sur l'icône livre :
   - la fiche de la Condition du compendium doit s'ouvrir.
6. Ajouter `Effrayé 2` au personnage puis rouvrir / actualiser la fiche :
   - la condition doit être surlignée ;
   - le badge doit indiquer `Actif 2` ;
   - le bandeau `Sur le personnage` doit afficher l'état actif.
7. Tester la recherche `volonté`, `caché`, `action`, etc.
8. Vérifier qu'une recherche ouvre les sections correspondantes puis restaure
   leur état lorsque la recherche est effacée.

## v0.25.0 — Tests XP de carrière

### Initialisation

1. Personnage niveau 1, XP PF2e 0 / 1000.
   - attendu : `0 / 300 XP`
   - niveau PF2e : 1.
2. Personnage niveau 2, XP PF2e 500 / 1000 avant première activation.
   - attendu après migration : `600 / 900 XP`
   - niveau PF2e : 2.

### Seuils

1. Saisir `299`.
   - niveau 1.
2. Saisir `300`.
   - niveau PF2e passe à 2.
3. Saisir `899`.
   - niveau 2.
4. Saisir `900`.
   - niveau PF2e passe à 3.
5. Saisir `84 500`.
   - niveau 11.
   - affichage `84 500 / 105 000 XP`.
6. Saisir `105000`.
   - niveau PF2e passe à 12.

### Deltas

À `84 500` :
- saisir `+500` => `85 000`;
- saisir `-250` => `84 750`.

### Niveau manuel

À `84 500`, niveau 11 :
1. modifier manuellement le niveau PF2e vers 12 ;
2. attendu : XP carrière `105 500`;
3. niveau et XP doivent rester synchronisés après rerender.

### Compatibilité native

Après une modification d'XP carrière :
- `system.details.xp.max` ne doit pas être modifié ;
- `system.details.xp.value` doit rester une progression proportionnelle dans
  le niveau, pour compatibilité avec PF2e ;
- toutes les statistiques dépendant du niveau doivent utiliser le nouveau
  niveau PF2e normal.

### Niveau 20

À `356 000` :
- niveau 20 ;
- affichage sans faux seuil de niveau 21 ;
- aucune tentative de passer au niveau 21.

## v0.26.0 — XPC synchronisée depuis l’API

1. Créer ou modifier les séances dans l’API PF2 / SQLite.
2. Lancer `game.pf2eValToolkit.careerXp.syncFromApi()`.
3. Vérifier que chaque PJ reçoit le total recalculé, sans cumul de la valeur
   précédente, et que niveau/XP PF2e sont les valeurs dérivées de l’XPC.

## v0.27.0 — Images des Actors de scénario

1. Réimporter `PFS-S01-04-Bandits-d-Immenwood.json`.
2. Ouvrir les Actors déjà existants ou nouvellement créés.
3. Vérifier portrait + prototype token pour :
   - Druide halfelin 1–2 et 3–4 ;
   - Loup / compagnons loups ;
   - Tourbillon vivant ;
   - Rejeton de pince des récifs ;
   - Éclaireur diable des mers ;
   - Vengeant Thorn 1–2 et 3–4.
4. Vérifier que les statistiques restent celles du compendium PF2e.
5. Vérifier qu'un Actor sans champ `image` conserve son image PF2e d'origine.
6. Réimporter une seconde fois : les Actors existants doivent recevoir ou
   conserver l'image sans duplication.

## v0.28.0 — Test cartes de scénario

1. Importer le JSON S01-04 v0.28.
2. Vérifier le dossier Scene MJ du scénario.
3. Vérifier les quatre Scènes A, B1, B2/B3 et C.
4. Vérifier : grille 50 px, distance 5 ft.
5. Vérifier les liens `Carte` dans la page Rencontres du Journal.
6. Vérifier la nouvelle page Journal `Cartes`.
7. Ajouter un Token ou un mur sur une Scene, puis réimporter le JSON.
8. Vérifier que ce Token / mur n'a pas été supprimé.

## v0.29.0 — Test import JSON / ZIP

### JSON seul
1. Importer le JSON S01-04 JSON-only.
2. Vérifier Actors + Journal.
3. Vérifier que l'XP / autres fonctionnalités ne sont pas concernées.
4. Vérifier que les Actors conservent leurs images PF2e natives.

### ZIP complet
1. Importer `PFS-S01-04-Bandits-d-Immenwood-package.zip`.
2. Vérifier le dossier :
   `worlds/<world-id>/pf2e-val-toolkit/scenarios/PFS-S01-04/`.
3. Vérifier les portraits et `maps/`.
4. Vérifier que Vengeant Thorn est créé avec son illustration comme portrait
   ET prototype Token.
5. Vérifier les quatre Scenes.
6. Activer une Scene avec un joueur :
   toute la carte doit être visible, sans besoin de lumière ou vision Token.
7. Ajouter un mur/Token puis réimporter le ZIP :
   il doit être conservé.

## v0.29.1 — Test navigation personnage

1. Ouvrir une fiche PF2e à sa largeur habituelle.
2. Vérifier que le texte `Personnage` ne prend plus de place dans la barre.
3. Vérifier que tous les onglets, y compris Actions guidées et États, sont
   visibles sans agrandir la fiche.
4. Vérifier que la rangée d'onglets est centrée dans la barre.
5. Vérifier que le premier onglet personnage reste cliquable et possède un
   tooltip `Personnage`.
6. Vérifier Actions guidées puis États, puis revenir sur les onglets PF2e.

## v0.29.2 — Test fond de Scene V14

Après installation, réimporter le ZIP S01-04.

Dans la console :

```js
game.scenes
  .filter(s =>
    s.getFlag("pf2e-val-toolkit", "scenarioId") === "PFS-S01-04"
  )
  .map(s => ({
    scene: s.name,
    level: s.firstLevel?.name,
    image: s.firstLevel?.background?.src,
    tokenVision: s.tokenVision
  }));
```

Attendu :
- 4 Scenes ;
- 4 chemins WebP non nuls ;
- `tokenVision: false`.

Activer ensuite une Scene avec un compte joueur :
- carte entièrement visible ;
- aucune lumière nécessaire ;
- aucun fog d'exploration.

## v0.30.0 — validation

### XPC

`flags.pf2e-val-toolkit.xpc = 2430` doit produire :
- niveau 3 ;
- XP PF2 850.

`flags.pf2e-val-toolkit.xpc = 3130` doit produire :
- niveau 4 ;
- XP PF2 113.

Sans flag XPC :
- aucune XPC créée ;
- niveau/XP PF2 laissés tels quels.

### Grille mesurée

Pour 27 colonnes, 17 lignes et des bounds 1485 × 935 démarrant à 18,24 :
- `grid.size = 55`;
- `shiftX = -18`;
- `shiftY = -24`.

Le format legacy `"size": 50` reste compatible.

### Mécaniques de classe

Aucun code actif Toolkit ne doit automatiser :
- Hunt Prey ;
- Panache ;
- Bravade ;
- Aboutissement assuré.

