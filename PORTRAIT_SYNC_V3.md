# PF2 Portrait Sync V3

Correctif ciblé pour la récupération des portraits PF2 vers Foundry.

## Changements principaux

- sortie Python immédiatement flushée ;
- option `--only` pour tester un PNJ précis ;
- un fournisseur MediaWiki dont l'API renvoie 404/410 est désactivé pour le reste du run ;
- timeouts réseau ramenés à 8 s pour les recherches ;
- prise en charge des URLs d'images Fandom de forme `image.jpg/revision/latest` ;
- inspection des images réellement liées à une fiche MediaWiki (`prop=images`) ;
- sondage direct des noms de fichiers (`File:Nom.jpg`, `Fichier:Nom.jpg`, variantes portrait/full-body) ;
- amélioration particulière de Wiki Pathfinder Lacrypte, dont les fichiers sont souvent nommés directement d'après le PNJ ;
- les correspondances ambiguës restent `missing` au lieu d'être téléchargées au hasard.

## Test recommandé

```bash
python3 -u scripts/sync_pf2_portraits.py \
  --online --verbose \
  --only 'Abstalar Zantus' \
  --only 'Ameiko Kaijitsu' \
  --only 'Ambrus Valsin'
```

Puis, si les candidats sont bons :

```bash
python3 -u scripts/sync_pf2_portraits.py --online --verbose \
  2>&1 | tee /tmp/pf2-portraits-online-v3.log
```

Toujours sans `--apply` pour ce premier passage complet.
