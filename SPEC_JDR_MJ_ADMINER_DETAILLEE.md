# SPEC JDR - Adminer MJ (detaillee)

## 1. Contexte

Le besoin est de faire evoluer l'outil MJ vers un vrai adminer de donnees metier, pour gerer proprement:
- JdR
- Groupes
- Classes
- Personnages
- Traits
- Ressources
- Objets
- Associations entre ces entites

Demande immediate incluse:
- vider les donnees du feed (historique de lancers)
- deplacer la notion de niveau depuis le personnage vers la classe
- ajouter les impacts numeriques de traits par stat en UX simple
- permettre l'association de ressources a une classe
- permettre la creation de groupes et l'association d'un personnage a un groupe

## 2. Etat actuel (resume)

- Le feed est stocke dans la table `jdr_dice_roll`.
- Le personnage porte actuellement `level`.
- Les traits supportent deja des modificateurs par stat cote backend.
- Il n'existe pas encore d'entite metier `Classe` ni `Groupe` dediee.
- Le menu MJ est principalement oriente usage, pas administration transverse des entites.

## 3. Objectifs fonctionnels

1. Centraliser l'edition des donnees metier JdR dans un ecran Adminer MJ.
2. Clarifier la modelisation: le niveau appartient a la classe, pas au personnage.
3. Rendre explicites et editables les impacts de traits sur chaque stat.
4. Rendre configurable les ressources disponibles par classe.
5. Introduire les groupes et l'affectation personnage -> groupe.
6. Preserver la coherence de jeu (associations valides, pas de references orphelines).

## 4. Hors perimetre (v1)

- Gestion des droits multi-role (RBAC fin)
- Historisation complete des changements metier
- Import/export CSV
- Regles avancees de progression (XP, talents dynamiques)

## 5. Modele metier cible

### 5.1 Entite Classe

Champs:
- slug
- jdrSlug
- name
- text (optionnel)
- level (nombre entier >= 1)
- resourceProfiles: liste des ressources disponibles pour la classe

ResourceProfile (par classe et ressource):
- resourceSlug
- resourceType
- defaultValue
- comportement: `fixed` | `scalable`

Regle:
- Une classe appartient toujours a un unique JdR (non partagee entre JdR).
- Un personnage reference au plus une classe (`classSlug` nullable).

### 5.2 Entite Groupe

Champs:
- slug
- name
- text (optionnel)
- memberCharacterSlugs (derive ou relation)

Regles:
- Un personnage peut etre sans groupe (null) ou dans un seul groupe.
- Un groupe peut contenir 0..n personnages.

### 5.3 Entite Personnage

Evolution:
- retirer `level`
- ajouter `classSlug`
- ajouter `groupSlug` (optionnel)

Regles:
- `classSlug` doit exister dans le JdR.
- `groupSlug` doit exister dans le JdR si renseigne.
- Si une classe est supprimee, les personnages lies conservent leurs autres donnees et passent a `classSlug = null`.
- Si un groupe est supprime, ses membres passent a `groupSlug = null`.

### 5.4 Traits et impacts stats

Un trait garde:
- name
- type
- modifiers[] = { statSlug, value }

Regles:
- un seul modifier par couple (trait, statSlug)
- value entier signe (support + et -)
- la stat finale d'un personnage = base stat + somme des modifiers des traits equips

## 6. UX cible - Adminer MJ

## 6.1 Navigation

Ajouter une entree principale "Adminer MJ" avec onglets:
1. JdR
2. Groupes
3. Classes
4. Personnages
5. Traits
6. Ressources
7. Objets
8. Associations

## 6.2 Ecran Traits (demande popup)

Creation/edition d'un trait:
- champs: nom, type
- bouton "Configurer impacts stats"
- ouvre une popup listant toutes les stats du JdR
- pour chaque stat:
  - stepper decrement/increment
  - affichage valeur courante
  - reset a 0
- validation popup = ecrit `modifiers[]` (uniquement les valeurs != 0)

## 6.3 Ecran Classes

Creation/edition:
- nom, description, niveau
- section "Ressources de classe":
  - selection d'une ressource existante
  - type de comportement (`fixed` | `scalable`)
  - valeur par defaut
  - max optionnel

## 6.4 Ecran Groupes

Creation/edition:
- nom, description
- membres (ajout/retrait de personnages)

## 6.5 Ecran Personnages

Creation:
- nom, description
- classe (optionnelle)
- groupe (optionnel)

Edition:
- changer classe
- changer groupe
- gerer traits, objets, ressources derivees

## 6.6 Associations

Vue transverse pour gerer:
- classe -> ressources
- personnage -> groupe
- personnage -> classe
- trait -> impacts stats

## 7. Contrats API cibles (proposition)

### 7.1 Classes
- POST /api/v1/jdr/:jdrSlug/classes
- PUT /api/v1/jdr/:jdrSlug/classes/:classSlug
- DELETE /api/v1/jdr/:jdrSlug/classes/:classSlug
- POST /api/v1/jdr/:jdrSlug/classes/:classSlug/resources
- DELETE /api/v1/jdr/:jdrSlug/classes/:classSlug/resources/:resourceSlug

### 7.2 Groupes
- POST /api/v1/jdr/:jdrSlug/groups
- PUT /api/v1/jdr/:jdrSlug/groups/:groupSlug
- DELETE /api/v1/jdr/:jdrSlug/groups/:groupSlug
- PUT /api/v1/jdr/:jdrSlug/groups/:groupSlug/members/:characterSlug
- DELETE /api/v1/jdr/:jdrSlug/groups/:groupSlug/members/:characterSlug

### 7.3 Personnages
- POST /api/v1/jdr/:jdrSlug/characters (avec classSlug, groupSlug optionnel)
- PUT /api/v1/jdr/:jdrSlug/characters/:characterSlug (classSlug, groupSlug modifiables)

### 7.4 Traits
- POST /api/v1/jdr/:jdrSlug/traits (modifiers obligatoires en payload, potentiellement vide)
- PUT /api/v1/jdr/:jdrSlug/traits/:traitSlug/modifiers

### 7.5 Feed
- operation SQL/dev uniquement (temporaire, pas d'API dediee)

## 8. Migration de donnees

## 8.1 Migration schema

- ajouter entite Classe
- ajouter entite Groupe
- ajouter character.classSlug nullable
- ajouter character.groupSlug nullable
- deprecier puis retirer character.level

## 8.2 Backfill

- creer une classe par defaut "Sans classe" avec level = 1
- pour chaque personnage existant:
  - creer/mapper une classe derivee si necessaire selon level actuel
  - sinon laisser `classSlug = null`
- groupSlug = null par defaut

## 8.3 Compatibilite transitoire

Pendant une phase courte:
- accepter `level` en lecture legacy
- ne plus exposer `level` en ecriture cote front
- journaliser les payloads legacy recus

## 9. Criteres d'acceptation

1. Un personnage ne possede plus de champ niveau editable directement.
2. Le niveau est editable uniquement dans la classe.
3. La creation d'un trait permet de definir une valeur numerique par stat via popup.
4. Une classe peut declarer ses ressources autorisees et leur comportement.
5. Un groupe peut etre cree et recevoir des personnages.
6. A la creation d'un personnage, on peut choisir un groupe.
7. Adminer MJ permet d'editer toutes les entites cles et leurs associations.

## 10. Plan de livraison incremental

Phase 1:
- Feed reset + stabilisation admin actuelle
- modeles backend Classes/Groupes + migrations

Phase 2:
- API Classes/Groupes + adaptation DTO Character (classSlug/groupSlug)
- front creation personnage avec selection classe/groupe

Phase 3:
- popup impacts de traits par stat
- ecran Classes avec ressources associees

Phase 4:
- ecran Adminer MJ unifie (onglets + associations)
- nettoyage champs legacy (suppression finale level personnage)

## 11. Questions ouvertes (a trancher)

Aucune a ce stade pour le cadrage macro. Les decisions sont figees en section 12.

## 12. Decisions validees

1. Une classe est strictement scopee au JdR.
2. Le niveau de classe est une valeur simple.
3. Les ressources de classe n'ont pas de max obligatoire.
4. Un personnage ne peut appartenir qu'a un seul groupe.
5. Le feed/reset feed est temporaire et gere hors API metier.
6. Suppression d'une classe: les personnages perdent simplement leur classe (`classSlug = null`).
7. Suppression d'un groupe: les personnages perdent leur groupe (`groupSlug = null`).
