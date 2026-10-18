# Wiki PF2, Foundry REST Relay et portraits

[← Index des outils](../OUTILS.md) · [Wiki et Discord](../pf2/outils/wiki-discord.md) · [Foundry](../pf2/outils/foundry.md)

> Référence actualisée contre le code GitHub le 18 octobre 2026. **Aucun contrôle live du mini-PC** : les services réellement démarrés et ports exposés doivent être vérifiés sur le serveur.

## Wiki joueur

Le backend utilise des clients et endpoints **MediaWiki** (`apps/api-jdr/src/pf2-mj/MediaWikiClientService.ts`, `support/mediawiki/`), notamment pour les publications narratives et le répertoire PJ. Des fichiers `support/xwiki/` et anciennes procédures XWiki existent toujours : ils ne prouvent pas que XWiki soit le wiki actif. Ne pas interchanger XWiki et MediaWiki sans audit de déploiement.

URL configurée historiquement : `https://wiki.l7r.fr` ; configuration et disponibilité réelles à vérifier.

## Foundry REST Relay

Service indépendant sous `support/foundry-rest/`, utilisé par le backend PF2 pour interagir avec Foundry. Les paramètres de connexion sont en configuration serveur (ne jamais exposer les clés). Voir [l'architecture](../pf2/outils/architecture.md) et [le déploiement](../pf2/outils/deploiement.md).

## Portraits PNJ

Le code de `Pf2MjService.ts` consulté utilise :

```text
FOUNDRY_ASSETS_ROOT/portraits/pnj/<id-pnj>.webp
assets/l7r/portraits/pnj/<id-pnj>.webp
```

Le backend sert les fichiers par `GET /api/pf2-mj/portraits/:filename`. Une liaison à l'Actor Foundry peut permettre la synchronisation via le Relay. **Ne pas présenter `STORAGE_PATH/portraits` ni `pf2_media` comme le chemin actif par défaut sans décision et implémentation explicites.**

## Vérification opérationnelle

Contrôler sur le mini-PC : wiki réellement exécuté, stacks Docker, URL publique, service Relay, dossiers Foundry accessibles et permissions d'écriture. La documentation ne doit pas remplacer ce contrôle.
