# Installation — portraits PF2-MJ 100 % Foundry

Le patch ne remplace **aucun fichier de données PNJ**. Il modifie le code et
fournit un script qui travaille sur le `pf2_personnages.json` actuellement
présent dans ton dépôt, afin de ne pas écraser tes modifications récentes.

## 1. Sauvegarde Git

Depuis la racine du dépôt :

```bash
cd ~/services/lsr-nestjs-backend
git add -A
git commit -m "backup avant migration portraits Foundry"
```

## 2. Extraire le patch

```bash
unzip -o pf2-portraits-foundry-fix-2026-09-01.zip
```

Les fichiers remplacés sont :

```text
apps/api-jdr/src/pf2-mj/Pf2MjController.ts
apps/api-jdr/src/pf2-mj/Pf2MjService.ts
apps/api-jdr/src/pf2-mj/Pf2MjService.spec.ts
apps/web-misc/src/pf2-mj/Pnj.tsx
```

Le script ajouté est :

```text
scripts/sync_pf2_portraits.py
```

## 3. Vérifier le dossier Foundry utilisé

```bash
grep -n '^FOUNDRY_ASSETS_ROOT=' .env .env.local 2>/dev/null || true
```

Sans configuration explicite, le code reprend la convention déjà présente dans
PF2-MJ :

```text
~/FoundryVTT/Data/assets/l7r/portraits/pnj/
```

Tu peux vérifier que le dossier parent existe avec :

```bash
ls -ld ~/FoundryVTT/Data/assets/l7r 2>/dev/null || true
```

Si Foundry est ailleurs, passe son chemin au script avec
`--foundry-assets-root` et conserve la même valeur dans `FOUNDRY_ASSETS_ROOT`.

## 4. Rebuild / redémarrage

Rebuild puis redémarre `api-jdr` et `web-misc` comme d'habitude pour ton repo.
Le nouveau backend doit être actif avant la migration en ligne, car il sert les
PNG/JPEG/WebP/GIF depuis le dossier Foundry.

## 5. Diagnostic sans modification

```bash
python3 scripts/sync_pf2_portraits.py --verbose
```

Le script recherche d'abord les portraits déjà disponibles dans Foundry :
Actors, compendiums lisibles et fichiers dont le nom correspond exactement.

## 6. Centraliser les portraits Foundry déjà trouvés

```bash
python3 scripts/sync_pf2_portraits.py --apply --verbose
```

Cela :

- copie les correspondances certaines vers `assets/l7r/portraits/pnj/` ;
- supprime l'ancien champ `image` du JSON source ;
- remplace les portraits par le chemin Foundry canonique ;
- tente de mettre SQLite à jour via l'API locale sur le port 3333.

## 7. Chercher et télécharger davantage de portraits

```bash
python3 scripts/sync_pf2_portraits.py --apply --online --verbose
```

Ce mode tente ensuite les anciennes sources connues puis PathfinderWiki pour les
PNJ encore sans portrait. Les correspondances faibles sont refusées. Les URLs
servent uniquement au téléchargement : elles ne sont jamais gardées dans le
référentiel utilisé par l'application.

Le rapport est écrit dans :

```text
portrait-sync-report.json
```

## 8. Vérifications

Aucune URL externe dans les PNJ :

```bash
python3 - <<'PY'
import json
p='apps/web-misc/src/pf2-mj/data/pf2_personnages.json'
data=json.load(open(p))
remote=[]
for x in data:
    for k in ('image','portrait'):
        v=x.get(k)
        if isinstance(v,str) and v.startswith(('http://','https://')):
            remote.append((x.get('id'),k,v))
print('URLs externes:', len(remote))
for row in remote: print(row)
PY
```

Résultat attendu :

```text
URLs externes: 0
```

Lister les portraits réellement stockés dans Foundry :

```bash
find "${FOUNDRY_ASSETS_ROOT:-$HOME/FoundryVTT/Data/assets/l7r}/portraits/pnj" \
  -maxdepth 1 -type f | sort
```
