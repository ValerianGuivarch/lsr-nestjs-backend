# Cadrage Macro — [Nom de la feature]

> **Board cadrage (CIDF) :** CIDF-XXXX

## 1. Vue d'ensemble

### 1.1 Contexte

- Pourquoi cette feature existe-t-elle ?
- Quel problème réel vient-elle résoudre ?
- Est-ce un besoin métier, réglementaire, technique, ou externe (partenaire) ?
- Y a-t-il un retour d'expérience (v1 → v2) ?

### 1.2 Objectifs

- Empêcher / Permettre / Garantir / Centraliser ...
- ...

### 1.3 Hors périmètre

- Pas de ...
- Pas de ...

---

## 2. Règles métier

[Règles déclaratives, testables, sans ambiguïté — chaque règle doit pouvoir se traduire en condition logique]

- Règle 1 : ...
- Règle 2 : ...

### 2.1 Cas particuliers

- Si [condition] → [comportement]
- Si [valeur absente / null] → fallback sur [...]
- ...

### 2.2 Invariants

[Ce qui ne doit jamais être violé]

- ...
- ...

---

## 3. Architecture cible (haut niveau uniquement)

[Quels composants sont impactés ? Qui orchestre ? Qui exécute ? Pas de code.]

- Composant A = rôle
- Composant B = rôle

---

## 4. Flux fonctionnels

[Description narrative du flux principal — pas de pseudo-code]

1. ...
2. ...

---

## 5. Données impactées

- Nouveaux attributs / tables / statuts / queues ?
- Migration nécessaire ?
- Volumétrie estimée ?

---

## 6. Dépendances externes

| Dépendance | Certaine / Hypothétique |
| ---------- | ----------------------- |
| ...        | ...                     |

---

## 7. Risques & Inconnues

[Ne jamais cacher les incertitudes. Statuts : 🔴 Ouvert · 🟡 En cours · 🟢 Résolu · ⚫ Accepté]

| Risque / Inconnu | Impact | Statut    | Commentaires |
| ---------------- | ------ | --------- | ------------ |
| ...              | ...    | 🔴 Ouvert | ...          |

---

## 8. Critères de réussite

[Comment saura-t-on que la feature est réussie ?]

- ...
- ...

---

## 9. Questions ouvertes

> **Section de travail** — vivante pendant le cadrage, vide à la clôture.
> Chaque question résolue migre soit vers une règle métier, soit vers le tableau Risques & Inconnues (statut 🟢 ou ⚫).
> Si des questions restent ouvertes à l'entrée du cadrage technique, les identifier explicitement comme bloquantes ou non.

- À valider avec ... : ...
- À confirmer par ... : ...
- À tester en POC ... : ...
- À mesurer ... : ...
