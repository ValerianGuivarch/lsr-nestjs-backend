# Specs : Page MJ pour HP

## Vue d'ensemble
Page MJ pour Harry Potter, inspirée de la page L7R.
Permet de gérer et afficher plusieurs personnages (sorciers) simultanément avec leurs stats, PV, sorts et maisons.

---

## 1. Sélection et affichage des personnages

### 1.1 Liste déroulante des personnages
- **Source de données** : API `/api/v1/hp/wizards` (GET tous les sorciers)
- **Comportement** :
  - Affiche tous les sorciers disponibles
  - Permet de sélectionner/ajouter plusieurs personnages à la session
  - Une fois sélectionné, le perso s'ajoute à une liste d'affichage
  - Chaque perso affiche :
    - Nom
    - Maison (avec icône)
    - PV actuel / PV max
    - 3-4 stats principales (à voir)
    - Liste des sorts actifs (menu déroulant + bouton "Lancer")

### 1.2 Persistance de la session
**Décidé** : localStorage (front uniquement, perte au refresh)
- Clé : `hp_mj_session`
- Contenu : `{ selectedWizards: string[] }`

---

## 2. Boutons de contrôle

### 2.1 Bouton "D20"
- Positionné près de la liste déroulante
- Cible : personnage **"MJ Helluin"** (hardcodé, toujours)
- Comportement :
  - Lance un d20 pour MJ Helluin
  - Affiche le résultat (toast/modal/inline)
  - Appel API : `POST /api/v1/hp/flips`

### 2.2 Bouton "Créer perso"
- Redirige vers `/hp/create` (route new wizard form)
- Simple redirection

### 2.3 Bouton "Points de maison"
- Ouvre une modal/pop-up
- Affiche et édite les points pour chaque maison (4 champs : Gryffondor, Serdaigle, Poufsouffle, Serpentard)
- Format : `<NomMaison> : <valeur>` (nom + nombre éditable)
- 2 boutons dans la modal :
  - "Quitter" (ferme sans sauvegarder)
  - "Enregistrer" (POST vers API pour sauvegarder les points en BDD)
- Points de maison déjà en BDD, récupérés via champ `house` sur le perso/session

---

## 3. Affichage des personnages sélectionnés

### 3.1 Carte de personnage (pour chaque perso affiché)
```
+---------------------+
| Nom (Maison)        |
| PV : [=====]50/100  |
| Stats:              |
|  - Force : 15       |
|  - Dex : 12         |
|  - etc.             |
| Compétences :             |
|  [Métamorphoser ▼]   |
|  [Lancer]           |
| Sorts :             |
|  [Expelliarmus ▼]   |
|  [Lancer]           |
+---------------------+
```

### 3.2 Menu déroulant (compétences et sorts)
- **Compétences** : déroulant avec sélection + bouton "Lancer"
- **Sorts** : déroulant avec sélection + bouton "Lancer"
- Au clic "Lancer" : appel API `POST /api/v1/hp/flips`

### 3.3 Bouton pour retirer un perso de la session
- Petit "X" ou "Retirer" sur chaque carte

---

## 4. API à utiliser / créer

- `GET /api/v1/hp/wizards` - liste des sorciers
- `GET /api/v1/hp/wizards/name/:name` - détails d'un sorcier
- `POST /api/v1/hp/flips` - lancer un d20 / compétence / sort
- `POST /api/v1/hp/session` - sauvegarder la session MJ (à définir)
- `PATCH /api/v1/hp/houses` - sauvegarder les points de maison (bulk)

---

## 5. Routes Front à créer

- `/hp/mj` - page MJ principale
- `/hp/create` - création de nouveau sorcier (peut réutiliser WizardFormCreate ?)

---

## 6. Composants à créer/modifier

**Nouveaux composants** :
- `HpMjPage.tsx` - page principale
- `HpMjWizardSelector.tsx` - liste déroulante + boutons contrôle
- `HpMjWizardCard.tsx` - affichage d'un perso
- `HpMjHousePointsModal.tsx` - modal points de maison

**Existants à adapter** :
- `WizardFormCreate.tsx` - pour "Créer perso"

---

## 7. État/Contexte

### 7.1 État local (MJ page)
```typescript
{
  selectedWizards: string[] // noms des perso affichés
  wizards: Wizard[] // détails complets (dont .house pour points maison)
  housePoints: {
    gryffondor: number
    serdaigle: number
    poufsouffle: number
    serpentard: number
  }
  isHousePointsModalOpen: boolean
}
```

### 7.2 Persistance
- localStorage key : `hp_mj_session` → JSON des selectedWizards
- housePoints : récupérés de la BDD (champ `house` sur le wizard/session) → POST au "Enregistrer"
- Restaurer selectedWizards au montage de la page

---

## 8. API requise

- `GET /api/v1/hp/wizards` - liste des sorciers
- `GET /api/v1/hp/wizards/name/:name` - détails d'un sorcier
- `POST /api/v1/hp/flips` - lancer d20/compétence/sort pour un perso
- `GET /api/v1/hp/houses` - récupérer les points de maison
- `PATCH /api/v1/hp/houses` - sauvegarder les points de maison en BDD

---

## Checklist de développement

- [x] Créer `HpMjPage.tsx` + route `/hp/mj`
- [x] Créer `HpMjWizardSelector.tsx` avec liste déroulante
- [x] Créer `HpMjWizardCard.tsx` avec affichage stats/sorts
- [x] Créer `HpMjHousePointsModal.tsx`
- [x] Implémenter persistance localStorage
- [x] Bouton D20 → appel API flip
- [x] Bouton "Créer perso" → redirection `/hp/create`
- [x] Styling et intégration design
- [ ] Tester avec plusieurs perso affichés

---

**Notes** :
- Page inspirée de `/l7r/mj` - à consulter pour le design
- Réutiliser composants existants autant que possible
- MVP : localStorage, pas BDD pour session
