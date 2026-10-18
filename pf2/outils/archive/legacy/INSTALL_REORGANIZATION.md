# Installation — réorganisation PF2

Le script ne renomme aucun PDF : il déplace uniquement les 377 fichiers déjà connus du catalogue vers une arborescence centrée sur les œuvres.

## 1. Sauvegarde

Dans le repo :

```bash
cd ~/services/lsr-nestjs-backend
git add -A
git commit -m "backup avant réorganisation bibliothèque PF2"
```

Une sauvegarde/snapshot de `~/services/pf2-data` est aussi recommandée.

## 2. Décompresser le paquet

Place `pf2-library-reorganization-2026-09-01.zip` à la racine du repo puis :

```bash
cd ~/services/lsr-nestjs-backend
unzip -o pf2-library-reorganization-2026-09-01.zip
```

Cela installe aussi le `catalogue-pf2.json` dont les chemins correspondent à la nouvelle arborescence.

## 3. Simulation obligatoire

```bash
python3 reorganize_pf2_library.py --root ~/services/pf2-data
```

Le script fait un preflight des 377 fichiers. S'il manque une source ou si une destination existe déjà, il abandonne **avant le premier déplacement**.

## 4. Appliquer

```bash
python3 reorganize_pf2_library.py --root ~/services/pf2-data --apply
```

Optionnel :

```bash
python3 reorganize_pf2_library.py --root ~/services/pf2-data --apply --scaffold
```

`--scaffold` crée également les dossiers vides attendus pour les PDF/traductions/ZIP manquants. Il y en a beaucoup ; ne l'utilise que si tu veux réellement tout précréer.

## 5. Vérifier

Relance API/frontend puis lance un scan bibliothèque. Juste après la réorganisation, le résultat attendu est :

- 377 PDF ;
- 0 ajout ;
- 0 absence ;
- 0 ZIP (tant que tu n'en as pas ajouté).

Le script écrit `~/services/pf2-data/_reorganisation-log.json` avec tous les déplacements effectués.
