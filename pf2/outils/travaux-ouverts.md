# travaux ouverts — documentation PF2

[← Outils](../../OUTILS.md) · [Archive intégrale](archive/RECAP-2026-09-27.md)

> Contenu repris de l'audit du 27 septembre 2026 : **historique à confronter au code et à l'état de production** avant de considérer une observation ou une anomalie comme actuelle.

## 13. Procédure idéale d’enrichissement des données

### Principe général

**Ne pas jeter les données existantes et ne pas retraiter tous les PDF à l’aveugle.**

Le référentiel actuel contient déjà beaucoup d’informations utiles. Il doit servir de base et de registre d’identités.

Le meilleur ordre est hybride :

1. stabiliser les mécanismes transverses ;
2. rattacher ce qui existe déjà lorsque la relation est certaine ;
3. enrichir profondément, campagne par campagne, uniquement les campagnes réellement prioritaires ;
4. générer ensuite les ZIP correspondants.

### Phase A — stabiliser avant de produire des dizaines de ZIP

À faire une seule fois :

1. corriger l’association **un PDF physique ↔ plusieurs unités logiques** ;
2. vérifier que les mises à jour de curation sont bien persistées ;
3. conserver `pf2.sqlite` comme unique vérité métier ;
4. faire fonctionner proprement l’affichage scénario/campagne ↔ ressources ;
5. peupler les relations scénario ↔ PNJ déjà certaines à partir des données existantes ;
6. traiter ensuite les lieux/régions/factions/événements existants lorsque le lien est suffisamment fiable.

Objectif : l’interface doit déjà devenir utile **avant** l’arrivée des ZIP.

### Phase B — backfill des PNJ existants

Les 145 PNJ existants sont précieux : ils évitent de recréer des doublons.

Pour chaque relation explicitement prouvée par les données existantes :

```text
PNJ existant
→ pf2_scenario_npc
→ scénario existant
```

Ne pas créer de nouveau PNJ pendant ce passage sauf nécessité évidente.

Les relations ambiguës doivent être laissées pour revue, pas inventées.

### Phase C — sélectionner les campagnes réellement prioritaires

Le statut visible est désormais volontairement simple :

```text
Retenu
Sélectionné
En cours
Joué
Plus tard
Écarté
```

Les deux axes restent distincts : `preparationStatus=selected` sans `playStatus` correspond à **Retenu** (candidat, hors Journal), tandis que `playStatus=to_play` correspond au statut visible **Sélectionné** (périmètre actif). Le Journal ne contient que `Sélectionné`, `En cours` et `Joué`. Le pipeline IA/Foundry de génération est réservé aux cibles explicitement `Sélectionné`.

On ne cherche pas à finaliser les centaines de scénarios d’un coup.

### Phase D — traitement profond d’une campagne / aventure

Pour une unité prioritaire, le workflow cible est désormais direct :

1. retrouver l'unité canonique dans le catalogue et ses PDF déjà associés dans `pf2-data` ;
2. récupérer le catalogue / SQLite et le `package-registry` **courants** ;
3. auditer ce qui existe déjà dans Foundry avant de recréer Actors ou Scenes ;
4. analyser les sources et identifier :
   - PNJ existants à réutiliser ;
   - nouveaux PNJ réellement nécessaires ;
   - lieux/régions existants ;
   - nouveaux lieux importants ;
   - factions ;
   - événements utiles ;
   - Actors mécaniques ;
   - rencontres ;
   - cartes ;
   - Journal MJ ;
5. résoudre les créatures via les compendiums/références Foundry lorsque c'est fiable ; créer un Actor `custom` seulement lorsque nécessaire ;
6. ne promouvoir en entités métier que les éléments narratifs réellement utiles et persistants ;
7. construire un package v4 complet et reproductible ;
8. valider toutes les références contre l'état live de SQLite / `package-registry` ;
9. intégrer le ZIP via l'API ;
10. créer la demande de déploiement ;
11. laisser le Toolkit importer Actors, Scenes, Journal et assets puis renvoyer son résultat ;
12. vérifier le succès réel dans l'application et, si Foundry est connecté, dans le monde lui-même ;
13. seulement alors passer à l'unité suivante.

L'ancien workflow quotidien « préanalyse IA → export manuel Foundry → retour IA → package final » n'est plus le chemin recommandé. Son code peut rester disponible pour compatibilité ou diagnostic, mais il est volontairement masqué dans l'interface courante.

### Phase E — registre à consulter avant création d’un ZIP

Il n’est pas souhaitable de recopier manuellement la liste des PNJ/lieux/factions à chaque fois.

L’API expose :

```text
GET /api/pf2-mj/package-registry
```

Ce registre contient les IDs stables disponibles pour :

- PNJ ;
- lieux/régions ;
- factions ;
- événements.

La procédure normale est donc :

```text
PDF déjà associé au catalogue
+
package-registry live
+
catalogue / SQLite courant
+
références Foundry à la demande
→ génération et validation du package
```

Le registre doit être consulté au moment de produire le package : un ancien snapshot peut contenir un ID devenu invalide ou manquer une identité créée depuis.

Dans une collaboration sans accès direct au serveur/API, fournir le dernier `pf2.sqlite` ou un export récent reste un mode de secours acceptable.

### Pourquoi cet ordre

Si tous les PDF sont retraités avant de stabiliser les IDs et les relations :

- les doublons vont se multiplier ;
- des lieux déjà existants risquent d’être recréés ;
- des PNJ existants risquent d’être dupliqués ;
- les erreurs de modèle documentaire seront répétées dans chaque package.

À l’inverse, attendre que tous les PNJ historiques soient parfaitement nettoyés avant de traiter une campagne bloquerait inutilement le projet.

Le compromis est donc :

> **socle stable → backfill sûr → campagnes sélectionnées une par une → ZIP complets.**

---

---

## 18. Fichiers et répertoires importants

### Backend

```text
apps/api-jdr/src/pf2-mj/
apps/api-jdr/src/pf2-storage/
apps/api-jdr/src/pf2-sessions/
apps/api-jdr/src/foundry/
apps/api-jdr/src/discord/
```

### Frontend

```text
apps/web-misc/src/pf2-mj/
apps/web-misc/src/resumes/
```

### Foundry

```text
pf2e-val-toolkit/
```

### Données

```text
pf2.sqlite
pf2-data/
```

### Services indépendants

```text
support/foundry-rest/
support/xwiki/
apps/web-golarion-map/
```

---

---

## 21. Ordre de travail recommandé à partir de maintenant

1. **Conserver Journal / Catalogue / Ressources / Monde / Administration comme navigation principale.**
2. **Enrichir les arcs narratifs PFS transverses**, en commençant par les ensembles réellement joués ; une saison PFS n’est pas une campagne.
3. **Auditer la couverture Foundry préexistante** avant de générer de nouveaux assets ; réutiliser ce qui existe déjà.
4. **Durcir le pipeline désormais automatisé** : catalogue/PDF → analyse → références Foundry à la demande → package validé → intégration → déploiement Toolkit → vérification ; traiter les anomalies révélées campagne par campagne plutôt que réintroduire l'ancien aller-retour manuel.
5. **Réparer PDF ↔ plusieurs unités logiques** pour les compilations.
6. **Nettoyer la duplication `pf2_record scenario`** seulement après vérification des fallbacks.
7. **Réduire progressivement les statuts hérités** : les séances deviennent la preuve du jeu commencé, les déploiements deviennent la preuve du contenu Toolkit présent.

Cas de validation recommandé pour les PDF : **Agents d’Absalom**, car il combine une campagne, six aventures et deux PDF de compilation.


---

---

## Audit Foundry à poursuivre

Voir le diagnostic détaillé dans [Foundry et portraits](foundry.md#13-audit-des-scènes-et-des-imports).

Ordre retenu pour la prochaine reprise :

1. terminer l'inventaire **en lecture seule** des Scenes et de leur hiérarchie de dossiers ;
2. comparer, pour chaque import, manifeste/flags, assets sur disque et documents Foundry ;
3. classer les anomalies certaines : scène vide, image présente mais non reliée, asset manquant, mauvais chemin, import partiel, doublon ou incohérence de grille ;
4. utiliser **Sentence d'Extinction volume 1** comme cas témoin, plusieurs Scenes ayant été créées sans image attachée malgré la présence des fichiers ;
5. seulement après validation de l'audit, sauvegarder puis corriger par l'API / le pipeline de package plutôt que par écriture directe dans LevelDB.

L'objectif est d'abord de distinguer les défauts de données ponctuels d'un défaut systémique de l'importeur.

