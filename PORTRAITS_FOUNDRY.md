# PF2-MJ — portraits 100 % Foundry

## Règle

PF2-MJ n'utilise plus d'URL d'image distante au runtime.

Chemin logique enregistré dans un PNJ :

```text
assets/l7r/portraits/pnj/npc-janira-gavix.webp
```

Chemin physique :

```text
$FOUNDRY_ASSETS_ROOT/portraits/pnj/npc-janira-gavix.webp
```

Si `FOUNDRY_ASSETS_ROOT` n'est pas défini, le backend et le script reprennent
la convention déjà utilisée par le projet :

```text
~/FoundryVTT/Data/assets/l7r/portraits/pnj/
```

## Interface

- le portrait ouvre la fiche du PNJ ;
- le bouton ⧉ en haut à droite copie le portrait ;
- après copie, le bouton devient ✓ « Copié » pendant 1,4 s ;
- le bouton « Voir la fiche » sous chaque carte a été supprimé ;
- les cartes ne chargent jamais `http://` ou `https://` ;
- upload, glisser-déposer, collage et import d'une URL enregistrent d'abord le
  fichier dans Foundry.

## Migration / recherche automatique

Depuis la racine de `lsr-nestjs-backend` :

### 1. Diagnostic local uniquement

```bash
python3 scripts/sync_pf2_portraits.py --verbose
```

Le script cherche sans rien modifier :

1. les portraits déjà présents dans `assets/l7r/portraits/pnj` ;
2. les Actors trouvables dans les `.db`, `.json` et `.jsonl` des worlds,
   modules et systèmes Foundry ;
3. les images Foundry dont le nom correspond de façon stricte au PNJ.

### 2. Copier les correspondances Foundry certaines

```bash
python3 scripts/sync_pf2_portraits.py --apply --verbose
```

Les fichiers sont centralisés dans `assets/l7r/portraits/pnj`, le JSON est mis
à jour et le script tente de pousser le référentiel vers l'API locale
`http://127.0.0.1:3333/api/pf2-mj` pour mettre également SQLite à jour.

### 3. Chercher davantage en ligne

```bash
python3 scripts/sync_pf2_portraits.py --apply --online --verbose
```

En plus des sources Foundry locales, le script :

- récupère les deux anciennes sources connues (Abrogail Thrune II et Janira
  Gavix) mais ne conserve jamais leurs URLs dans le référentiel ;
- interroge PathfinderWiki pour les PNJ encore sans portrait ;
- n'accepte qu'une correspondance de titre très forte ;
- télécharge le fichier dans Foundry et conserve la source seulement dans
  `portrait-sync-report.json` pour audit.

Si aucune image certaine n'est trouvée, le PNJ reste simplement sans portrait.
Aucun portrait n'est inventé et aucune correspondance faible n'est appliquée.

## Si Foundry est ailleurs

```bash
python3 scripts/sync_pf2_portraits.py \
  --foundry-assets-root /chemin/vers/FoundryVTT/Data/assets/l7r \
  --apply --online --verbose
```

Pour vérifier la valeur utilisée par le backend :

```bash
grep -n '^FOUNDRY_ASSETS_ROOT=' .env .env.local 2>/dev/null
```

## Résultat attendu

Après migration :

```bash
find "${FOUNDRY_ASSETS_ROOT:-$HOME/FoundryVTT/Data/assets/l7r}/portraits/pnj" \
  -maxdepth 1 -type f | sort
```

Et pour vérifier qu'aucune URL externe ne reste dans le référentiel source :

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

Le résultat doit être `URLs externes: 0`.
