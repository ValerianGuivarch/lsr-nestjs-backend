# Specs : Système JdR générique

## Vue d'ensemble

Objectif : ajouter un nouveau contexte JdR générique avec une API dédiée `api-jdr` et un front dédié `web-jdr`, capables d'héberger plusieurs jeux de rôle paramétrables par leurs propres stats, traits, ressources, objets et personnages.

Le système doit permettre :

- d'afficher une page MJ pour chaque JdR avec la liste des personnages sous forme de cartes ;
- d'afficher une page de configuration MJ pour créer les données du JdR (stats, personnages, groupe) ;
- d'afficher une page personnage pour chaque personnage d'un JdR ;
- d'éditer un personnage (stats, objets, traits, ressources) ;
- de voir en continu les lancers de dé côté MJ et côté personnage ;
- de préparer un jeu de données de test via un script de feed.


---

## 1. Routing front attendu

Le routing doit suivre une convention dédiée par JdR :

- `/<jdr-slug>/MJ` : page MJ du JdR — liste des personnages sous forme de cartes + feed des lancers de dé ;
- `/<jdr-slug>/MJ/config` : page de configuration — création/édition des stats, personnages, groupe (items, ressources de groupe) ;
- `/<jdr-slug>/<character-slug>` : page personnage — fiche de lecture + boutons de lancer de dé + feed des lancers de dé ;
- `/<jdr-slug>/<character-slug>/edit` : édition du personnage (stats de base, traits, objets, ressources).

Règles :

- un `jdr-slug` identifie un JdR de manière unique côté front et backend ;
- le slug est la clé de routing ; le nom affiché reste un champ métier éditable ;
- `MJ` est un segment réservé (insensible à la casse — `/mj` redirige vers `/MJ`) ;
- toute URL personnage doit être résolue dans le contexte d'un JdR donné ;
- le segment `MJ` ne peut pas être un slug de personnage.

Politique de slug retenue :

- normalisation Unicode vers ASCII (suppression des accents) ;
- conversion en minuscules ;
- remplacement des séparateurs non alphanumériques par `-` ;
- suppression des `-` en début/fin, puis réduction des doublons de `-` ;
- format final strict `^[a-z0-9]+(?:-[a-z0-9]+)*$` ;
- en cas de collision, suffixage numérique stable (`-2`, `-3`, etc.).

---

## 2. Modèle métier fonctionnel

### 2.1 JdR

Un JdR est défini par :

- un nom ;
- un slug technique ;
- un texte libre ;
- une liste de stats propres au JdR ;
- une liste de traits ;
- une liste de ressources ;
- une liste de ressources de groupe avec leur valeur ;
- une liste d'objets portés par le groupe.

### 2.2 Stat

Une stat est définie par :

- un nom unique dans le périmètre du JdR.

Exemples : Force, Intelligence, Adresse, Volonté.

### 2.3 Trait

Un trait est défini par :

- un nom ;
- un type ;
- une liste d'impacts sur les stats du JdR.

Un impact de trait est défini par :

- une stat cible ;
- une valeur entière positive ou négative.

Les types de traits sont :

- `Normal` ;
- `Defaut` ;
- `Objet` ;
- `Secret`.

Règles :

- un trait `Objet` ne peut être porté que par un objet ;
- un personnage peut posséder des traits `Normal`, `Defaut` et `Secret` ;
- un personnage ne peut pas posséder directement un trait `Objet` ;
- un objet ne peut référencer qu'un trait de type `Objet`.

### 2.4 Ressource

Une ressource est définie par :

- un nom ;
- un type.

Les types de ressource sont :

- `all` ;
- `specific` ;
- `group`.

Sémantique :

- une ressource `all` existe dans le référentiel du JdR et doit être possédée par chaque personnage ;
- une ressource `specific` existe dans le référentiel du JdR et peut être possédée ou non par chaque personnage ;
- une ressource `group` existe dans le référentiel du JdR et sa valeur est portée au niveau du groupe/JdR.

### 2.5 Ressource possédée

Posséder une ressource signifie :

- référencer une ressource du JdR ;
- lui associer une valeur numérique.

### 2.6 Objet

Les objets existent dans un **catalogue** rattaché au JdR. Un objet est défini par :

- un nom ;
- un slug technique ;
- une description libre, potentiellement vide ;
- un indicateur `unique` : si `true`, chaque possesseur ne peut en détenir qu'un exemplaire (quantité = 1 implicite) ;
- éventuellement un trait associé de type `Objet`.

Un objet du catalogue peut être possédé simultanément par le groupe et/ou plusieurs personnages.

**Posséder un objet** (`OwnedItem`) signifie créer un lien entre un possesseur et un objet du catalogue :

- pour un objet unique (`unique = true`) : la quantité est implicitement 1, toute autre valeur est rejetée ;
- pour un objet non unique (`unique = false`) : une quantité entière >= 1 est stockée (valeur par défaut : 1).

### 2.7 Personnage

Un personnage est défini par :

- un nom ;
- un slug technique (unique dans son JdR) ;
- éventuellement un niveau ;
- un texte libre ;
- une valeur de base pour chaque stat du JdR ;
- une liste de traits ;
- une liste d'objets ;
- une liste de ressources possédées.

Règles :

- chaque stat du JdR doit avoir une valeur sur chaque personnage ;
- la valeur par défaut d'une stat personnage est `2` ;
- un personnage doit posséder une entrée de ressource pour chaque ressource `all` du JdR ;
- un personnage peut posséder zéro, une ou plusieurs ressources `specific` ;
- un personnage ne porte jamais directement de ressource `group`.

### 2.8 Lancer de dé (DiceRoll)

Un lancer de dé enregistre le résultat d'une tentative d'un personnage :

- un identifiant unique ;
- la référence au JdR ;
- la référence au personnage (slug et nom) ;
- la référence à la stat tentée (slug et nom) ;
- la valeur finale de la stat (nombre de d6 lancés, >= 0) ;
- la liste des résultats (chaque d6 = 1-6) ;
- l'horodatage de création.

Sémantique :

- un lancer utilise la **stat finale** du personnage (base + modificateurs de traits + traits des objets) ;
- le nombre de d6 est égal à la stat finale (minimum 0, jamais négatif) ;
- chaque d6 est aléatoire entre 1 et 6 ;
- les lancers sont immuables ; il ne peut pas y avoir d'édition ;
- les lancers sont affichés en continu (feed) côté MJ et côté personnage.

---

## 3. Calcul métier

### 3.1 Stats de base

Les stats de base d'un personnage sont les valeurs explicitement stockées pour chaque stat du JdR.

### 3.2 Modificateurs de traits

Les modificateurs applicables à un personnage proviennent :

- de ses traits propres ;
- des traits portés par les objets qu'il possède.

### 3.3 Stats finales

Les stats finales d'un personnage sont calculées selon la formule :

`stats finales = stats de base + somme des modificateurs de ses traits + somme des modificateurs des traits de ses objets`

Règles :

- un trait sans impact sur une stat n'affecte pas cette stat ;
- plusieurs impacts sur une même stat sont cumulés ;
- un personnage sans trait ni objet conserve ses stats de base.

---

## 4. Invariants métier

- le slug d'un JdR est unique dans le système ;
- le slug d'une stat est unique dans le périmètre d'un JdR ;
- une ressource appartient à un seul JdR ;
- un trait appartient à un seul JdR ;
- un personnage appartient à un seul JdR ;
- le slug d'un personnage est unique dans le périmètre d'un JdR ;
- un item appartient au catalogue d'un seul JdR ;
- un personnage contient exactement une valeur de base par stat du JdR ;
- un trait référencé par un personnage ou un item doit appartenir au même JdR ;
- un item ne peut référencer qu'un trait de type `Objet` ;
- une ressource possédée par un personnage doit référencer une ressource du même JdR ;
- une ressource `group` ne peut pas être possédée individuellement par un personnage ;
- chaque personnage possède obligatoirement toutes les ressources `all` du JdR ;
- si un item est `unique`, la quantité possédée est toujours 1 ; si non-unique, la quantité est un entier >= 1 ;
- toutes les valeurs numériques (stats, ressources, modificateurs) sont des nombres finis ;
- les champs texte libre du JdR et du personnage sont optionnels et peuvent être vides.

---

## 5. Hors périmètre du premier lot

- gestion d'authentification et droits fins ;
- historique des modifications ;
- moteur de règles avancé au-delà des modificateurs de traits ;
- import/export avancé ;
- gestion multi-session d'un même JdR avec états séparés ;
- optimisation pour gros volumes de données ;
- UI riche au-delà des pages minimales nécessaires.

---

## 6. Questions ouvertes (ou depuis fixées)

- ~~Le segment `MJ` doit-il être traité de manière insensible à la casse ?~~ **Oui, `/mj` redirige vers `/MJ`** 
- Les noms des personnages doivent-ils être uniques dans un JdR ou seul leur slug ? **À trancher avant l'API édition**
- Une ressource `specific` peut-elle exister plusieurs fois sur un même personnage si le besoin métier apparaît ? **À trancher avant l'API édition**

---

## 7. Structure domain existante (validée)

```text
libs/jdr/domain/src/lib/
  jdr/
    Jdr.ts
    JdrText.ts
  stats/
    Stat.ts
    CharacterStat.ts
    TraitStatModifier.ts
  traits/
    Trait.ts
    TraitType.ts
  resources/
    Resource.ts
    ResourceType.ts
    CharacterResource.ts
    GroupResourceValue.ts
  items/
    Item.ts
    OwnedItem.ts
  characters/
    Character.ts
  rolls/
    DiceRoll.ts
  shared/
    Guards.ts
    Slug.ts
```

La structure inclut :

- les modèles métier purs (Jdr, Character, Trait, Stat, Resource, Item, etc.) ;
- les types d'énumération `TraitType` et `ResourceType` ;
- la séparation référentiel/état (JdR = contexte, Character = état) ;
- le calcul des stats finales (`Jdr.computeFinalStats()`) ;
- pas de détail Nest, TypeORM ou DTO HTTP ;
- des lancers de dé (DiceRoll) comme entité d'événement immuable.

Cas d'usage validés :

- créer un JdR avec stats, traits, ressources, objets ;
- créer un personnage dans un JdR ;
- ajouter/retirer traits et objets à un personnage ;
- calculer les stats finales d'un personnage ;
- effectuer un lancer de dé (immuable).
- exemple minimal de JdR en mémoire pour vérifier que la modélisation tient.

---

## 8. Plan d'implémentation

### Étape 1 - Domain uniquement ✅

- créer `libs/jdr/domain` ou la structure équivalente dans le contexte Nx retenu ;
- poser les entités, types et invariants métier ;
- faire valider cette structure avant toute suite.

Critère de sortie : validation explicite de la modélisation domain. **VALIDÉ**

### Étape 2 - Backend applicatif et data ✅

- créer le contexte backend JdR autour du domain validé ;
- exposer les cas d'usage nécessaires pour lire et éditer un JdR, ses personnages, ses objets, ses traits et ses ressources ;
- créer la persistance et les mappings data ;
- brancher l'API dédiée `api-jdr`.

Critère de sortie : endpoints minimaux opérationnels pour lecture/édition et données persistées. **VALIDÉ**

#### Suppléments Étape 2

- ajout du modèle `DiceRoll` au domain ;
- ajout de la persistance `jdr_dice_roll` ;
- endpoints pour lancer un dé : `POST /:jdrSlug/characters/:characterSlug/roll/:statSlug` ;
- endpoint pour récupérer les lancers : `GET /:jdrSlug/rolls?size=30` ;
- implémentation du calcul de la valeur de dé (stat finale, minimum 0).

### Étape 3 - Front minimal `web-jdr`

- créer la page `/<jdr-slug>/MJ` — liste des personnages sous forme de cartes ;
- créer la page `/<jdr-slug>/MJ/config` — création/édition des données du JdR ;
- créer la page `/<jdr-slug>/<character-slug>` — fiche du personnage ;
- créer la page `/<jdr-slug>/<character-slug>/edit` — édition du personnage ;
- afficher les données principales sans chercher une UI riche au premier lot ;
- intégrer un feed de lancers de dé continu (like L7R / HP).

Critère de sortie : navigation bout en bout fonctionnelle sur un JdR de test, avec lancers de dé visibles.

### Étape 4 - Script de feed

- préparer un script `feed` dédié JdR ;
- injecter un jeu de données de test ;
- construire ce jeu de données avec toi avant finalisation du script.

Critère de sortie : environnement local alimenté automatiquement avec un JdR de démonstration.

---

## 9. Pages minimales attendues pour l'Étape 3

### 9.1 Page MJ `/<jdr-slug>/MJ`

- liste des personnages sous forme de cartes (nom, niveau si présent, texte libre)
- lien vers la page config MJ ;
- feed continu des lancers de dé (côté droit ou en bas) ;
- sélection de personnage pour voir ses lancers en détail ;
- accès direct à chaque personnage.

### 9.2 Page de configuration MJ `/<jdr-slug>/MJ/config`

- création/édition du JdR (nom, texte) ;
- gestion des stats (ajout/suppression) ;
- gestion des personnages (ajout/suppression) ;
- gestion des traits (ajout/suppression) ;
- gestion des ressources (ajout/suppression) ;
- gestion des ressources de groupe (valeurs) ;
- gestion des objets de groupe (ajout/suppression) ;
- interface simple, focalisée sur l'efficacité sans design riche.

### 9.3 Page personnage `/<jdr-slug>/<character-slug>`

- identité (nom, niveau si présent, texte libre) ;
- stats de base et stats finales (tableau comparatif) ;
- traits ;
- objets possédés ;
- ressources possédées ;
- boutons de lancer de dé par stat (ou zone centralisée pour lancer) ;
- feed des lancers de ce personnage ;
- lien vers l'édition.

### 9.4 Page d'édition `/<jdr-slug>/<character-slug>/edit`

- édition du nom, niveau, texte ;
- édition des stats de base (inputs numériques) ;
- ajout/retrait de traits ;
- ajout/retrait d'objets ;
- édition des ressources possédées ;
- bouton retour / annuler.

### 9.5 Feed de lancers de dé

- affiché côté MJ et côté personnage ;
- montrant les 30 derniers lancers (limite configurable) ;
- détail : nom personnage, nom stat, résultats (liste de dés) ;
- mise à jour en continu (polling toutes les 3-5 secondes ou WebSocket si possible) ;
- design simple, style L7R/HP.

---

## 10. Risques et inconnues

| Risque / Inconnu | Impact | Statut | Commentaires |
| --- | --- | --- | --- |
| Convention de génération des slugs (normalisation et collisions) | Moyen | 🟢 RÉSOLU | Implémenté dans `Slug.ts` |
| Forme canonique du domain | Fort | � VALIDÉ | Domain complet + lancers de dé |
| Endpoints backend (CRUD + rollDice) | Moyen | 🟢 VALIDÉ | POST roll, GET rolls implémentés |
| Routage front et pages | Moyen | 🟡 EN COURS (Étape 3) | À démarrer |
| Feed continu de lancers | Moyen | 🟡 À IMPLÉMENTER | Polling ou WebSocket côté front |
| Modèle de feed de données (seed) | Moyen | 🟡 À DÉFINIR (Étape 4) | À décider avec toi |
| Gestion des collisions de noms personnage | Moyen | 🟡 À TRANCHER | Slug vs nom unique ? |

---

## 11. Résumé de la stratégie

**Lotissement révisé** : 

1. ✅ Domain + entités (validé)
2. ✅ Backend CRUD + lancers de dé (validé + implémenté)
3. 🔨 **Front Étape 3 : pages MJ, config, personnage, édition + feed de lancers**
4. 🔨 Étape 4 : Script de seed de données de test

La cible reste un socle générique et maintenable : une API fonctionnelle branchée à un front minimal intuitif, avec lancers de dé visibles en continu.

---

## 12. Refacto prévu (post-Étape 3)

Le `JdrController` monolithique et le `JdrService` / `IJdrProvider` doivent être découpés par sous-domaine fonctionnel :

- `JdrController` → lecture/écriture du JdR racine + découverte
- `StatsController` → ajout/suppression des stats
- `TraitsController` → ajout/suppression des traits
- `ResourcesController` → ajout/suppression des ressources, valeur de groupe
- `ItemsController` → catalogue + items de groupe
- `CharactersController` → personnages, stats, traits, items, ressources
- `DiceRollsController` → lancers de dé (rolls)

Même découpage côté services et providers.

Ce refacto se fait **après** que le front est branché et fonctionnel.