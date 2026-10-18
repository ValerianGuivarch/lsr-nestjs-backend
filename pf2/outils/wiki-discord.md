# wiki discord — documentation PF2

[← Outils](../../OUTILS.md) · [Archive intégrale](archive/RECAP-2026-09-27.md)

> Contenu repris de l'audit du 27 septembre 2026 : **historique à confronter au code et à l'état de production** avant de considérer une observation ou une anomalie comme actuelle.

## 11. Discord

Le module Discord appartient à `api-jdr`.

Il est optionnel : si les variables Discord sont absentes ou si Discord est indisponible, l’API continue de fonctionner.

### 11.1 Résumés courts

Lors de la création ou mise à jour d’une séance :

1. la séance est enregistrée en SQLite ;
2. l’API tente de synchroniser le résumé court vers Discord ;
3. si le message existe déjà, il est édité ;
4. sinon il est créé ;
5. un thread de commentaires est créé avec un nouveau message ;
6. l’identifiant Discord est enregistré dans la séance.

### 11.2 Commandes

Le bot contient notamment :

```text
/ping
/rec
/recap
```

`/rec` et `/recap` comptent les participations aux séances.

Quand Foundry est indisponible, un cache des noms d’Actors peut être utilisé.

---

---

## 15. Wiki joueur / MediaWiki

Le wiki joueur participe désormais au flux PF2 actif via `MediaWikiClientService`. Le backend utilise l’Action API pour publier ou référencer des contenus narratifs destinés aux joueurs ; ces textes restent dans le wiki et ne sont pas dupliqués comme source narrative dans SQLite.

Commandes documentées :

```text
npm run wiki
npm run wiki:up
npm run wiki:down
npm run wiki:logs
```

Port local documenté :

```text
4205
```

URL publique documentée :

```text
https://wiki.l7r.fr
```

Les anciennes documentations décrivant le wiki comme hors flux sont obsolètes. Discord reste un canal de diffusion/synchronisation des résumés courts, pas une source de vérité métier. `pf2_media` n’est pas la source canonique des portraits PNJ.

---

---

## 16. Dettes et anomalies connues

### Priorité haute

#### A. PDF multi-cibles

Un fichier de compilation doit pouvoir satisfaire plusieurs unités jouables.

Le modèle actuel ne le représente pas correctement partout.

Cas témoin : Agents d’Absalom.

#### B. Arcs narratifs PFS transverses

Le catalogue sait déjà représenter des `arcIds` traversant plusieurs saisons (`blackwood`, `clockwork-mystery`, etc.). Le Journal et le Catalogue les présentent désormais comme des campagnes transverses. La saison PFS reste un conteneur éditorial et ne devient pas une campagne de jeu.

La campagne transverse éditoriale `open-road` / « La Route ouverte » est désormais modélisée après vérification des sources Paizo : elle relie le métaplot du Pacte de la Route ouverte à la remise en service puis aux perturbations du Labyrinthe de la Route ouverte. Ce regroupement est propre à la table ouverte et n’est pas présenté comme un arc Paizo unique.

Dans le Catalogue, un scénario Pathfinder Society appartenant à une campagne transverse n’est plus répété sous sa saison : il reste dans sa saison au niveau des données, mais l’affichage canonique passe par la campagne transverse. Les actions `Retenir`, `Ajouter au Journal`, `Plus tard` et `Écarter` se propagent à ses membres ; sélectionner directement un scénario membre propage également la sélection aux autres scénarios encore non commencés de l’arc.

#### C. Provenance Foundry

L’application détecte les dossiers de scènes préexistants hors Toolkit et les affiche séparément du package géré. La détection prouve une présence dans le monde mais pas à elle seule une provenance « officielle Paizo » ; cette provenance devra être ajoutée uniquement lorsqu’elle est vérifiable.

### Priorité moyenne

#### D. Deux représentations des scénarios

L’audit contient :

```text
pf2_record kind=scenario : 250
pf2_catalogue_entity entry : 250
```

Les 250 IDs correspondent, mais seuls 114 payloads sont identiques ; 136 divergent.

Le runtime catalogue principal utilise `pf2_catalogue_entity`, mais certaines routes conservent `pf2_record scenario` comme fallback.

Ce doublon doit être supprimé ou rendu explicitement legacy quand les dépendances auront été vérifiées.

#### E. XPC dans le wrapper Relay

Le wrapper Nest peut encore reconstruire une XPC absente depuis niveau/XP PF2e.

Le Toolkit ne le fait pas.

La règle cible est : l’XPC provient du recalcul depuis les séances et utilise la courbe historique.

### Non bloquant actuellement

#### F. Packages

Le pipeline de packages est maintenant utilisé en production. La dette restante porte surtout sur l’automatisation de la génération et sur la réduction des allers-retours manuels, pas sur l’existence du pipeline.

---
