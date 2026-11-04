# Wiki — aide XP et trésors par séance (outil MJ)

[← Index des outils PF2](../../OUTILS.md) · [Règles MJ](../../AIDE.md) · [Courbe d'XP](../../pf2/outils/foundry.md)

## Objectif

Un bouton **« Outil MJ · XP et or »** est visible **uniquement aux administrateurs** du wiki dans les actions de chaque séance, sur la liste existante des séances. Il ouvre la page personnalisée `Special:PF2SessionXp?session=<id-sqlite>`. Pas de commande Discord, pas de page dans l'application MJ, pas de publication.

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

## Budget de trésors et d'argent (GM Core, novembre 2026)

L'outil réutilise **exactement les mêmes participants et niveaux en début de séance** que l'aide XP. Le serveur publie deux indicateurs **pour le groupe entier**, sans modifier les données :

- **Argent / valeurs vendables** : monnaie, gemmes, bijoux et autres récompenses de valeur monétaire, d'après la colonne « Party Currency » de la **table 10-9 : Party Treasure by Level** du *Pathfinder 2e GM Core*.
- **Trésor total** : valeur cumulée en or **des pièces et des objets permanents/consommables** prévus pendant la progression d'un niveau. L'enveloppe d'équipement correspond à « trésor total moins argent », sans inventer une nouvelle table d'objets.

Source des montants : [GM Core / Treasure by Level](https://pathfinder2e.org/browse/tables/p.html), table de groupe de **4 PJ de même niveau**, pour la progression **d'un niveau entier**. Les valeurs par niveau, de **1 à 20**, sont conservées dans `Pf2SessionTreasureAid.ts` : par exemple niveau 1 **175 po / 40 po argent**, niveau 2 **300 / 70**, niveau 3 **500 / 120**, niveau 4 **850 / 200**, niveau 20 **490 000 / 140 000**.

La répartition en séances et niveaux mixtes est une **adaptation maison**, conforme au choix MJ :

`objectif_argent = somme(argent_pour_4_PJ_au_niveau_de_chaque_participant) / (4 × 2,5)`

`objectif_trésor = somme(trésor_total_pour_4_PJ_au_niveau_de_chaque_participant) / (4 × 2,5)`

Le budget équipement est la différence et le budget individuel est divisé par le nombre réel de participants. Cela revient à prendre la **moyenne des quatre-PJ de chaque niveau**, puis à appliquer l'approximation proportionnelle `nombre_de_PJ / 4` et le rythme maison de **2,5 séances par niveau**. Pour les groupes de **plus ou moins de quatre PJ**, le *GM Core* donne des ajustements plus spécifiques (objets et monnaie par participant supplémentaire) : notre projection proportionnelle est donc **volontairement une approximation maison** affichée comme telle dans l'interface, pas une transcription exacte de ces ajustements. Aucune extrapolation des richesses **au-delà du niveau 20** : le budget est masqué et un avertissement explique pourquoi. Sans PJ inscrit, aucune recommandation n'est inventée.

**Exemple validé :** deux PJ niveau 2 et deux niveau 4 donnent `(70+70+200+200)/(4×2,5) = 54 po` d'argent par séance et `(300+300+850+850)/(4×2,5) = 230 po` de trésor total, dont **176 po d'équipement**. Ce budget est une référence souple sur plusieurs séances, pas un objectif à atteindre à tout prix à chaque rencontre.

### Saisie en direct dans le même champ

Le champ de texte **reste unique**, et le total XP fonctionne inchangé. Chaque ligne peut contenir plusieurs valeurs :

```text
Gnome libéré : 30XP
Bandits : 12po, 5 pa
Récompense du village : 25 po
Coffre : 8po
Objet : potion de soins (4 po)
Objet : parchemin de protection — prix à définir
```

- Les monnaies **po, pa, pc, pp** sont détectées en majuscules/minuscules, avec ou sans espace : **1 pp = 10 po = 100 pa = 1 000 pc**. Les décimales françaises et les milliers avec espaces sont reconnus ; un montant négatif peut corriger une ligne. L'interface affiche le **total d'argent** et l'écart au budget monétaire.
- Une ligne commençant par **`Objet :` / `Objets -`**, ou contenant **`objet trouvé`**, est considérée comme de l'**équipement**, **jamais** comme de l'argent immédiatement disponible. Si elle contient `4po`, c'est la **valeur nominale de l'objet** (à renseigner manuellement d'après son prix) qui entre dans le *trésor total*, pas sa valeur de revente en argent. Si le prix manque, cette ligne est comptée séparément parmi les objets non valorisés et un avertissement indique que le total est incomplet.
- Les **objets et l'argent ne sont pas comptés deux fois** : trésor valorisé = monnaie + valeur nominale des objets connus ; le solde d'argent reste indépendant. Une même ligne peut contenir XP et or sans conflit.

La saisie n'affecte **ni les inventaires Foundry, ni les récompenses de séance SQLite, ni Discord**. Comme pour les XP, le brouillon appartient au navigateur et à la séance, en `sessionStorage`, et il n'y a aucun bouton de validation. La page est toujours réservée à `pf2sessions-admin`, avec proxy serveur protégé.


## Implémentation et tests

- Backend : `Pf2SessionXpAid.ts`, barèmes complets et calculs `Pf2SessionTreasureAid.ts` et route protégée dans `Pf2WikiSessionsController.ts`.
- Wiki : bouton admin `pf2-sessions.js`, page spéciale `SpecialPF2SessionXp`, API proxy `ApiPF2SessionXp`, module ResourceLoader `ext.pf2sessions.xp`.
- Tests : `Pf2SessionXpAid.spec.ts`, `Pf2SessionTreasureAid.spec.ts` (barèmes 1–20, groupe mixte, hors niveau 20, taille de groupe), `Pf2WikiSessionsController.spec.ts` (clé admin et sortie), `pf2-session-xp-calc.test.cjs` (XP, pièces, objets, corrections), `pf2-session-xp-ui.test.cjs` (totaux en direct et absence de sauvegarde réseau).

Après déploiement de `main`, ouvrir le wiki avec un compte sysop, aller à la liste des séances et cliquer sur « Outil MJ · XP et or » pour une séance ayant des participants. Contrôler également qu'un compte joueur n'a **ni le bouton ni l'accès** à la page/API. Si l'extension semble inchangée après déploiement, vérifier le cache ResourceLoader MediaWiki et que le volume `support/mediawiki/extensions/PF2Sessions` correspond au checkout de la version déployée.
