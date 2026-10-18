# PF2-MJ — Portrait Sync V2

Ce correctif remplace uniquement `scripts/sync_pf2_portraits.py`.

## Pourquoi

La première version ne trouvait que 9 images locales et 1 ancienne URL distante sur 145 PNJ. La recherche Internet dépendait presque uniquement de `pageimages` sur PathfinderWiki, qui n'expose pas systématiquement les illustrations de personnage.

## V2

Ordre de recherche :

1. portraits déjà centralisés dans `assets/l7r/portraits/pnj` ;
2. Actors/données JSON Foundry ;
3. fichiers image Foundry au nom exact ;
4. fichiers image Foundry avec correspondance forte (`NPC - Nom.webp`, `portrait_nom.png`, etc.) ;
5. anciennes URLs connues du référentiel, uniquement comme source de migration ;
6. PathfinderWiki (page + recherche directe dans l'espace Fichier) ;
7. Pathfinder Wiki sur Fandom (API MediaWiki + espace Fichier) ;
8. Wiki Pathfinder Lacrypte (API MediaWiki + espace Fichier) ;
9. fallback HTML/OpenGraph sur PathfinderWiki/Fandom.

Aucun lien externe n'est enregistré dans le PNJ. Un résultat accepté devient toujours :

`assets/l7r/portraits/pnj/<id>.<extension>`

Le rapport conserve la provenance (`source`, `source_page`, `source_type`) pour audit.

## Installation

Depuis la racine du dépôt :

```bash
unzip -o pf2-portraits-sync-v2-2026-09-01.zip
```

## Dry-run en ligne

```bash
python3 scripts/sync_pf2_portraits.py --online --verbose \
  2>&1 | tee /tmp/pf2-portraits-online-v2.log
```

Le dry-run n'écrit ni portrait, ni JSON, ni SQLite.

## Application

Après revue du dry-run :

```bash
python3 scripts/sync_pf2_portraits.py --online --apply --verbose \
  2>&1 | tee /tmp/pf2-portraits-apply-v2.log
```

Les portraits sont copiés/téléchargés sous le `FOUNDRY_ASSETS_ROOT` configuré, dans `portraits/pnj/`.

## Désactiver une source

```bash
--no-wiki       # PathfinderWiki
--no-fandom     # Pathfinder Wiki Fandom
--no-lacrypte   # Wiki Pathfinder Lacrypte
```

Le script privilégie les correspondances strictes. Un PNJ reste `missing` plutôt que d'accepter une image au nom ambigu.
