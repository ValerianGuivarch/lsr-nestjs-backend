# Installation — catalogue PF2 enrichi (2026-09-01)

Sur le mini-PC, depuis le dépôt :

```bash
cd ~/services/lsr-nestjs-backend

git add -A
git commit -m "backup avant enrichissement des donnees PF2"

unzip -o pf2-catalogue-enriched-2026-09-01.zip
```

Le paquet remplace uniquement les fichiers de données suivants :

- `apps/web-misc/src/pf2-mj/data/catalogue-pf2.json`
- `apps/web-misc/src/pf2-mj/data/catalogue-player.json`
- `apps/web-misc/src/pf2-mj/data/synopsis-overrides.json`
- `apps/web-misc/src/pf2-mj/data/pfs-spoiler-details.json`
- `apps/web-misc/src/pf2-mj/data/pfs-analysis-overrides.json`
- `apps/web-misc/src/pf2-mj/data/title-fr-overrides.json`

Il ajoute également les rapports d'audit de cette passe.

Aucun PDF physique n'est déplacé, renommé ou supprimé. Aucun ZIP Foundry n'est ajouté.
