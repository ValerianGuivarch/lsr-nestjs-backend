# Wiki — aide XP par séance (outil MJ)

[← Index des outils PF2](../../OUTILS.md) · [Règles MJ](../../AIDE.md) · [Courbe d'XP](../../pf2/outils/foundry.md)

## Objectif

Un bouton **« Outil MJ · XP »** est visible **uniquement aux administrateurs** du wiki dans les actions de chaque séance, sur la liste existante des séances. Il ouvre la page personnalisée `Special:PF2SessionXp?session=<id-sqlite>`. Pas de commande Discord, pas de page dans l'application MJ, pas de publication.

L'extension MediaWiki `PF2Sessions` vérifie le droit `pf2sessions-admin` pour **afficher** la page et pour **répondre** à sa requête API `action=pf2sessionxp`. Cette API PHP utilise un secret **serveur à serveur** déjà configuré (`PF2_WIKI_LOGIN_INTERNAL_KEY`, avec repli sur `PF2_JOURNALS_INTERNAL_KEY`) et interroge la nouvelle route Nest `GET /api/pf2-mj/wiki/sessions/:id/xp-aid`. Le backend refuse les appels sans la clé interne. Aucun niveau individuel calculé par cette route n'est exposé aux lecteurs ordinaires du wiki. Il n'y a ni nouvelle clé côté navigateur ni nouvelle permission Discord.

## Source des niveaux

La liste de participants est celle de la séance choisie, dans `pf2.sqlite` (Actors identifiés par UUID), avec les noms provenant du cache de noms des Actors Foundry. Si aucun participant n'est enregistré, l'aide affiche explicitement qu'il manque les participants et **n'invente pas de niveaux ni de budget**.

Les XPC au début de la séance sont recalculées **chronologiquement** par `careerXpBeforeSession` dans `Pf2CareerXp.ts`, qui tient compte de l'XP des séances antérieures et des bonus de résumés courts/longs. Le niveau est `levelForCareerXp(XPC)`, **pas** `XPC/1000`, ni le niveau Foundry brut. La séance en cours n'est pas incluse dans son propre calcul, même si elle porte déjà un montant d'XP. La courbe est celle déjà documentée dans `pf2/outils/foundry.md` : 0 au niveau 1, 300 au niveau 2, 900 au niveau 3, 2700 au niveau 4, 6500 au niveau 5… jusqu'à 356 000 au niveau 20, puis +50 000 XPC par niveau.

## Budget cible

Pour chaque PJ `i` de niveau `n_i`, on calcule la **largeur de la bande** :

`delta_i = palier(n_i + 1) - palier(n_i)`.

Un niveau 1 donne 300, un niveau 2 donne 600, un niveau 3 donne 1800. La moyenne des bandes est calculée sur les personnages réellement inscrits à la séance. La règle MJ cible **2,5 séances** par montée de niveau :

`budget_groupe = somme(delta_i) / 2,5` ; `budget_par_PJ = budget_groupe / nombre_de_PJ`.

Par exemple, deux niveau 2 et deux niveau 3 donnent `2 × 600 + 2 × 1800 = 4800` ; soit **1920 XP pour le groupe**, **480 XP par personnage**. Pour un groupe 1/2/2/3, `300 + 600 + 600 + 1800 = 3300`, soit **1320 XP de groupe**, **330 par PJ**. Les bas niveaux bénéficient du niveau moyen du groupe et progressent donc plus vite, ce qui est intentionnel. Ce budget reste une **indication MJ**, pas une attribution automatique.

## Saisie des événements en direct

Sur la page apparaissent la séance, chaque personnage avec son niveau au début, ses paliers XPC et la largeur de sa bande, puis **un seul grand champ de texte redimensionnable**. Le MJ peut taper des phrases libres et des montants comme :

```text
Le gnome a été libéré : 30XP
Le groupe a trouvé l'accès secret : 100 xp
Le chef a été vaincu : 2 000 XP
```

Une expression régulière, insensible à la casse, repère les nombres immédiatement suivis de `xp`, avec ou sans espaces. Les sommes sont interprétées **comme des récompenses du groupe**. L'écran montre en direct le total, l'équivalent par personnage et l'écart avec le budget. Les nombres non suivis de `xp` et les mentions `XPC` sont ignorés ; `-20XP` peut servir à corriger une ligne. Le brouillon est préservé dans `sessionStorage`, **par utilisateur et séance**, tant que l'onglet est ouvert, pour résister à un rafraîchissement ; aucune sauvegarde serveur, aucun bouton de validation.

**Ne pas confondre :** le calculateur **n'écrit pas** la colonne `session_xp`, ne modifie pas les PJ et ne partage aucun message. Le MJ continue à utiliser l'édition habituelle de la séance pour attribuer définitivement une quantité d'XP.

## Implémentation et tests

- Backend : `Pf2SessionXpAid.ts` et route protégée dans `Pf2WikiSessionsController.ts`.
- Wiki : bouton admin `pf2-sessions.js`, page spéciale `SpecialPF2SessionXp`, API proxy `ApiPF2SessionXp`, module ResourceLoader `ext.pf2sessions.xp`.
- Tests : `Pf2SessionXpAid.spec.ts` (mix de niveaux, courbe haute, zéro PJ, dédoublonnage), `Pf2WikiSessionsController.spec.ts` (clé admin), `pf2-session-xp-calc.test.cjs` (syntaxe des mentions XP).

Après déploiement de `main`, ouvrir le wiki avec un compte sysop, aller à la liste des séances et cliquer sur « Outil MJ · XP » pour une séance ayant des participants. Contrôler également qu'un compte joueur n'a **ni le bouton ni l'accès** à la page/API. Si l'extension semble inchangée après déploiement, vérifier le cache ResourceLoader MediaWiki et que le volume `support/mediawiki/extensions/PF2Sessions` correspond au checkout de la version déployée.
