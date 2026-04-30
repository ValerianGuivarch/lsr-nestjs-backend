# Cadrage Micro — [Nom de la feature]

> **Board cadrage (CIDF) :** CIDF-XXXX

## 1. Rappel synthétique du besoin

[1 paragraphe max — problème à résoudre, règles métier impactantes, invariants clés.
Ne pas refaire le macro-cadrage.]

---

## 2. Composants impactés

| Composant | Chemin | Rôle dans cette feature |
| --------- | ------ | ----------------------- |
| ...       | ...    | ...                     |

---

## 3. Architecture cible

[Schéma logique : qui déclenche / orchestre / exécute / persiste / loggue]

```
Ex : Scheduler → DB (queue) → Executor → Keycloak + DB → Logs → Graylog
```

---

## 4. Répartition des responsabilités

| Composant | Responsabilité | Ne fait PAS |
| --------- | -------------- | ----------- |
| ...       | ...            | ...         |

---

## 5. Modèle de données

[Nouvelles tables, colonnes, index, contraintes d'unicité, volumétrie estimée]

---

## 6. Flux technique détaillé

[Étapes réelles d'exécution — préciser l'ordre et les points de failure possibles]

1. ...
2. ...

---

## 7. Stratégie d'idempotence

- Comment éviter les doublons ?
- Comportement en cas de retry ?
- Comportement si le job crashe en cours d'exécution ?
- Comportement si le cron tourne deux fois simultanément ?

---

## 8. Gestion des erreurs

| Cas | Type               | Comportement               |
| --- | ------------------ | -------------------------- |
| ... | Technique / Métier | retry / log / no-op / fail |

---

## 9. Sécurité & RGPD

- Données sensibles manipulées ?
- PII présents dans les logs ?
- Suppression définitive ? Archivage ?
- Qui a accès à quoi ?

---

## 10. Performance & volumétrie

- Nombre d'entités impactées
- Batch size recommandé
- Temps max d'exécution
- Timeout

---

## 11. Stratégie de migration

[Si applicable — script unique / backfill / feature flag / job temporaire]
[Toujours séparer migration et feature]

---

## 12. Stratégie de déploiement

[Feature flag ? Ordre de déploiement ? Rollback possible ?]

1. ...
2. ...

---

## 13. Monitoring & observabilité

- Logs obligatoires : ...
- Métriques souhaitées : ...
- Alertes : ...
- Dashboard : ...

---

## 14. Tests attendus

- Unitaires : ...
- Intégration : ...
- E2E : ...
- Manuels : ...

---

## 15. Questions ouvertes

- À valider avec ... : ...
- À confirmer sur volumétrie : ...
- À POCer : ...
