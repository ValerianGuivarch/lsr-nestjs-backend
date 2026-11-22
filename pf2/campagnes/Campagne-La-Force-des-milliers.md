# La Force des milliers

[← Index des campagnes](Campagnes.md) · [Labyrinthe de Narven](../univers/Labyrinthe-et-portails.md) · [La Route ouverte](Campagne-Route-Ouverte.md) · [Yaz Lorok](../pj/PJ-Yaz-Lorok.md)

> **Statut runtime vérifié le 22 novembre 2026 : campagne intégrée, sélectionnée « à jouer », aucune séance de La Force des milliers encore jouée.**
>
> **Audit des préparations de Kindled Magic terminé** : les sources et conducteurs des cinq composants ont été relus et corrigés ; Foundry est vérifié pour les quatre composants tactiques et reste légitimement N/A pour l’ouverture RP. Les composants ne sont toutefois **pas encore `ready`** : les portraits/illustrations encore génériques sont suivis dans `entities: partial` et l’équilibrage doit être refait pour le groupe réellement inscrit (`review: partial`). Le verrou narratif reste inchangé : **le passage du Labyrinthe de Narven vers Nantambu doit avoir été ouvert en jeu**.

## Décisions validées

- Les PJ ne sont **pas des élèves de la Magaambya**. Ils interviennent comme alliés extérieurs de la **Société des Éclaireurs**.
- La continuité académique est portée par les étudiants, enseignants et responsables récurrents de la Magaambya ; les équipes de PJ peuvent varier entre les missions de terrain.
- Les examens, rangs et promotions de l'Adventure Path ne sont pas imposés aux PJ. Les rites intéressants sont conservés comme invitations, partenariats, protections ou témoignages.
- L'entrée dans la campagne passe par le **Labyrinthe de Narven / futur Labyrinthe de la Route ouverte**. La préparation de La Force des milliers ne doit jamais créer ce passage à la place de la progression réellement jouée.
- Pour **Yaz Lorok**, sa première année à la Magaambya avec **Narek Lorok** est déjà établie. Ce passé peut enrichir le retour à Nantambu, mais la campagne reste jouable sans Yaz et ne doit pas révéler hors jeu les découvertes d'Uxir ou le secret de Narek.
- Les allocations et récompenses purement scolaires du scénario original ne deviennent pas automatiquement des paiements aux Éclaireurs ; les récompenses liées aux missions, découvertes et combats sont conservées.

## Progression réelle

Au 22 novembre 2026 :

- aucune séance `strength-of-thousands-*` n'est enregistrée comme jouée ;
- aucun `pf2_session_content` ni `pf2_session_preparation` n'est rattaché au tome 1 ;
- la curation SQLite indique toujours une campagne incluse, sélectionnée et `to_play` ;
- les cinq composants restent en `progress: todo` ;
- `source` et `template` sont `done` pour les cinq ;
- `foundry` est `done` pour les quatre composants tactiques et `N/A` pour **Alliés à Nantambu** ;
- `entities` et `review` restent `partial` tant que les portraits manquants et l'équilibrage au groupe réel ne sont pas vérifiés.

L'état de préparation est indépendant de l'état joué. Tant que le passage vers Nantambu n'a pas été ouvert dans la fiction, le premier composant reste en outre inaccessible narrativement.

## Sources

La bibliothèque contient désormais les **six volumes principaux complets** :

- **Tome 1 — Kindled Magic** : PDF anglais complet, 100 pages, associé à `strength-of-thousands-volume-1` ;
- **Tome 2 — Spoken on the Song Wind** : PDF anglais complet, 100 pages ;
- **Tome 3 — Hurricane's Howl** : PDF anglais complet, 100 pages ;
- **Tome 4 — Secrets of the Temple-City** : PDF anglais complet + traduction partielle ;
- **Tome 5 — Doorway to the Red Star** : PDF anglais complet + traduction partielle ;
- **Tome 6 — Shadows of the Ancients** : PDF anglais complet + traduction partielle ; l'original a été replacé dans le dossier `Documents` du tome le 21/11/2026.

La couverture du catalogue est donc **6/6**. Les cartes secondaires des tomes 3 à 6 et les trois anciens PDF d'information des tomes 1 à 3 ont été retirés de la bibliothèque active le 21/11/2026 et archivés hors de `PF2_LIBRARY_ROOT`. Les détails mécaniques doivent être lus dans les PDF principaux ou dans Foundry ; ce Markdown conserve seulement les décisions et l'état de préparation durable.

## Kindled Magic — découpage jouable

| Ordre | Clé | Module | Continuité | Préparation |
| --- | --- | --- | --- | --- |
| 1 | `allies-a-nantambu` | **Alliés à Nantambu** | libre, groupe variable | source/template `done`, entities/review `partial`, Foundry `N/A` ; verrou narratif = passage vers Nantambu |
| 2 | `services-de-la-magaambya` | **Services de la Magaambya** | libre, groupe variable | source/template/foundry `done`, entities/review `partial` |
| 3 | `masques-et-incidents` | **Masques et incidents** | verrou souple | source/template/foundry `done`, entities/review `partial` |
| 4 | `stone-ghost` | **Le Fantôme de pierre** | verrou dur pendant l'exploration profonde | source/template/foundry `done`, entities/review `partial` |
| 5 | `anadi-et-griffons` | **Les anadi et les griffons** | reprise courte seulement si nécessaire | source/template/foundry `done`, entities/review `partial` |

### 1 — Alliés à Nantambu

Une fois la route réellement ouverte, les Éclaireurs arrivent comme **partenaires extérieurs**. Le module fixe le point de débouché établi par La Route ouverte, présente la philosophie de service de la Magaambya et conclut l'accord de coopération.

Le conducteur tient compte de Yaz s'il est présent, sans ajouter de révélation Uxir/Narek. Aucune scène tactique n'est obligatoire : le critère Foundry est légitimement `N/A`.

### 2 — Services de la Magaambya

Le chapitre 1 est transformé en missions de terrain proposées aux alliés :

1. **Rain-Scribes** : Kafesi Market et poussins ojofiri ;
2. **Tempest-Sun Mages** : quatre pugwampis dans la grange, avec résolution non létale privilégiée ;
3. **Cascade Bearers** : ingrédients du `fey abeyance`, dont Umbo aux chapeaux écarlates ;
4. **Emerald Boughs** : livraisons et service communautaire à Nantambu ;
5. **Uzunjati** : partage de récits et réflexion sur la responsabilité magique.

Le module se termine sur l'**Introduction Ceremony** attaquée par **Kurshkin** et **Havvix**, qui peut fournir les premiers renseignements directs sur Stone Ghost et les tunnels.

### 3 — Masques et incidents

Le chapitre 2 garde son caractère de bac à sable :

- **Bug Problems** de Koride : dortoir, Leshy Gardens, Speaker's Stage et cuisine ;
- **Takulu's Reading List** : exploration complète de la bibliothèque B1–B8 ;
- expérience de **Zuma** ;
- **Starday Tournament**, trois combats successifs ;
- cinq faveurs facultatives aux camarades ;
- **First Masking**, conservée comme cérémonie à laquelle les Éclaireurs sont invités, pas comme promotion académique.

La First Masking se termine par une attaque coordonnée : un scarabée goliath géant, deux scarabées-flash et deux mille-pattes géants. L'événement révèle les tunnels et conduit directement au module suivant.

### 4 — Le Fantôme de pierre

L'exploration des **15 zones C1–C15** sous Archhorn Library est préparée intégralement : abeilles minières, pièges de carcasses, moisissure brune, vase grise, nids de gremlins, étudiants en danger, Binji, Urbel et Stone Ghost.

Particularité durable : les **nids C7a–d restent aléatoires**, conformément au scénario. Pour chaque nid, l'occupation et la composition sont tirées au moment du jeu ; l'absence de tokens fixes ici est donc volontaire et ne constitue pas un manque de préparation.

La confrontation finale C15 utilise Stone Ghost et deux Jinkins. Les conséquences à conserver sont notamment : état de Stone Ghost, Kurshkin, Urbel, Binji, étudiants sauvés, notes récupérées, masques des victimes rendus et comportement des gremlins survivants.

Pour éviter un découpage artificiel, **l'arrivée des anadi peut être jouée directement comme épilogue** si environ 45–60 minutes restent après la sortie des cavernes. Le composant `anadi-et-griffons` n'est importé comme séance séparée que si la séance précédente s'est réellement arrêtée avant cet épilogue.

### 5 — Les anadi et les griffons

Le texte complet corrige l'estimation antérieure : il s'agit de **trois anadi et trois griffons**, pas d'une paire de griffons.

Les futurs étudiants sont :

- **Rainbows-Reflected-Upon-Gossamer-Strands**, dit **Goss** ;
- **Droplets-Hanging-Gently Savanakin** ;
- **Barest-Threads-Billowing Maztachia**.

Ils sont aidés par Takulu Ot et attaqués par **trois griffons**. La rencontre est Extreme 3. Au moins un anadi devrait survivre afin que les deux mystères — pourquoi ils sont venus à la Magaambya et pourquoi les griffons les ont ciblés — puissent être repris par Janatimo au début de `Spoken on the Song Wind`.

Le scénario situe cette scène près du **Speaker's Stage**. Aucun champ de bataille dédié n'existant dans les scènes importées, Foundry utilise **Promenade de bienvenue** comme **arène tactique d'adaptation**. Cette substitution est volontairement documentée comme non canonique.

Ce composant est désormais défini comme **reprise courte conditionnelle** : ne jamais le rejouer si l'Anadi Arrival a déjà été résolu à la fin du module Stone Ghost.

## Foundry — Tome 1 audité

Le monde `test-pf2` / **Les Eclaireurs** utilise Foundry 14.365 et PF2e 8.4.1. Toutes les écritures ont été réalisées via le Relay autorisé ; aucun accès direct LevelDB n'a été utilisé.

### Scènes réutilisées

Le dossier `La Force des milliers / 01 — La magie éveillée` contient 11 scènes existantes, réutilisées sans doublon :

- `Scene.O3rc0xM6kglcA6n5` — Cérémonie d'accueil ;
- `Scene.dCGvdhVGUOj9Z0nz` — Promenade de bienvenue ;
- `Scene.CFCcMr0O2BO13B2k` — Dortoir de la flèche ;
- `Scene.a2D4BvW6F1QD9cb7` — Cuisine ;
- `Scene.Z7dymsaAAGYFvucZ` — Grange de stockage ;
- `Scene.yQ3o4nVBmkAD4egh` — Bibliothèque de la souche ;
- `Scene.vbivc7jTUKcsTMO3` — Caverne infestée ;
- `Scene.79VDNx8gLXJ0sFyy` — Chapeaux écarlates ;
- `Scene.WxZJDR1HDOTVfvCh` — Auditorium ;
- `Scene.BemrdX45skua7AoA` — Auditorium — Détruit ;
- `Scene.vCSwFmHLvMrfwpYW` — Tournoi du jour des étoiles.

Les cartes, murs et éclairages préexistants sont conservés.

### Actors et rencontres

Le dossier d'Actors `La Force des milliers / 01 — La magie éveillée` contient les fiches nécessaires clonées depuis les compendiums officiels, avec leur `sourceUuid` conservé dans `flags.l7r`.

Parmi les Actors préparés : Stone Ghost, Kurshkin, Havvix/Vexgit, Umbo, Pugwampi, Scrit, Gnagrif, Mitflit, Jinkin, Binji, Urbel, Tissorts, silverfish, abeilles minières, mouche tsé-tsé, scarabées, mille-pattes, dangers, constructs du tournoi, anadi, Takulu et griffon.

**63 tokens de rencontres fixes** sont en place. L'audit du 22/11 a supprimé les codes techniques (`C10 —`, `Bout 3 —`, etc.) de leurs noms visibles et impose `displayName: Always` aux créatures. Les tokens statiques visibles à l'entrée de leur salle ont été révélés ; restent masqués uniquement les embuscades, dangers, créatures cachées par le scénario, vagues futures du tournoi et arrivées différées. La mise à jour a aussi laissé PF2e recalculer la taille de certains tokens depuis la taille réelle de leur Actor (pugwampis/Scrits 1/2 case, griffons/constructs larges 2 cases, etc.) sans modifier leurs coordonnées.

### Butins

Un sous-dossier `Butins` contient **16 Actors de butin**. Les objets mécaniques utilisent de vrais Items PF2e ; les parchemins contiennent leurs sorts embarqués. Les récompenses couvrent notamment :

- Chapeaux écarlates ;
- Cuisine ;
- Bibliothèque B1/B2/B3/B4/B6 ;
- tournoi et faveurs ;
- cavernes C1/C2/C10/C11/C14/C15 ;
- récompense des anadi.

Les objets legacy sont remplacés explicitement par leur équivalent remaster lorsque nécessaire : le `bag of holding type I` du texte est ainsi représenté par le **Sac spacieux type I**.

**15 tokens de butin** sont prépositionnés et masqués sur les cartes concernées. La récompense des faveurs, qui n'a pas de scène tactique dédiée, reste disponible dans le dossier sans token.

### Journaux et notes de carte

Deux Journaux privés ont désormais des rôles distincts :

- `JournalEntry.ocvt0G55FnohLcT0` — **La Force des milliers — 01 — La magie éveillée — Préparation MJ** : 13 pages de contexte général, transitions et liens ; les longues listes mécaniques B/C en ont été retirées ;
- `JournalEntry.WuhHKhCm3x1oifE3` — **La Force des milliers — 01 — La magie éveillée — Fiches de scène** : **35 pages opérationnelles**, chacune commençant par `En jeu — …` puis, selon le besoin, `À l'arrivée`, `Interactions / déclenchement`, `Jets / dangers`, `Indices / informations accessibles`, `Recherche`, `Passages et butin`, puis `Contexte MJ et détails (référence)`.

Les **35 notes de scène** pointent maintenant vers la page exacte qui correspond à leur repère : B1–B8, C1–C15/C7a–d et les scènes hors donjon. L'auditorium détruit, qui n'avait aucune note, possède maintenant sa propre fiche d'après-combat.

### Vérification après audit

L'audit du 22 novembre a relu les données depuis le Relay après chaque correction :

- les backgrounds, grilles, murs et coordonnées `(x, y)` des tokens existants n'ont pas été modifiés ;
- aucune statistique mécanique des Actors n'a changé lors de l'ajout des notes privées MJ ;
- les 35 pages de scène commencent bien par `En jeu — …` et toutes les notes de campagne pointent vers le nouveau Journal et une page précise ;
- les 27 Actors NPC effectivement utilisés possèdent désormais une section privée `Comment le jouer (MJ)` avec rôle, déclenchement, attitude, tactique courte, fuite/renfort et informations accessibles ; les hazards restent documentés par leur Actor mécanique et la fiche de salle ;
- les coffres et objets mécaniques existants sont conservés.

Cette vérification suffit à valider `foundry: done` pour les modules tactiques, **pas** `review: done` : aucun groupe de séance n'est encore inscrit, donc les budgets de rencontre du PDF ne peuvent pas être déclarés équilibrés pour la table ouverte.

## Reste à faire suivi dans Choix libre

Les détails exacts sont enregistrés dans le champ `remaining_tasks` de chaque composant. Les catégories durables sont :

- **portraits / illustrations** : les blocs de préparation des PNJ centraux n'ont pas encore de portrait associé et plusieurs Actors clonés utilisent encore l'icône PF2e générique ; cela maintient `entities: partial` ;
- **équilibrage** : lors de l'inscription à une séance, recalculer les budgets et ajustements pour le nombre/niveau réel des PJ ; cela maintient `review: partial` sur les quatre composants tactiques ;
- **continuité conditionnelle** : confirmer l'ouverture réelle du Labyrinthe avant `allies-a-nantambu`, l'état de Kurshkin avant C10, et vérifier que l'Anadi Arrival n'a pas déjà été joué comme épilogue avant d'importer `anadi-et-griffons` ;
- **contrôle visuel juste avant jeu** : ouvrir les scènes concernées en client MJ pour vérifier visuellement tailles, reveals et lisibilité ; l'audit API/Relay ne remplace pas ce dernier contrôle de table.

Ces éléments ne doivent pas être masqués par un statut `ready` prématuré.

## Volumes suivants

Ils sont sourcés mais ne sont pas encore exposés comme choix immédiatement jouables, car la progression de `Kindled Magic` n'a pas commencé.

- **Spoken on the Song Wind** : chapitre 1 `The Learned One Returns`, chapitre 2 `Service to the City`, chapitre 3 `The Flooded Mansion` ; progression publiée du niveau 4 au niveau 8. Les deux premiers chapitres se prêtent particulièrement bien au choix libre.
- **Hurricane's Howl** : `The Missing Student`, `Vanished Villagers`, `Prison of the Vacant Eye`, `Jula's Plight` ; niveaux 8 à 12. Le rôle de professeurs sera converti en mission d'accompagnement / partenariat.
- **Secrets of the Temple-City** : délégation à Mzali, Sanctuaire de l'Éclipse et piste d'Osibu.
- **Doorway to the Red Star** : préparation de l'expédition, Iobane, Akiton, Contemplatifs et Roi des Fourmis Mordantes.
- **Shadows of the Ancients** : Vesicant Egg et défense finale de la Magaambya.

Ces volumes seront découpés en modules Choix libre lorsqu'ils deviendront narrativement prochains, afin de ne pas présenter aux joueurs des choix inaccessibles.

## Règle de reprise

À chaque reprise de campagne :

1. vérifier si le passage du Labyrinthe vers Nantambu a réellement été ouvert ;
2. vérifier le dernier module effectivement joué ;
3. importer le modèle Choix libre correspondant dans une séance seulement lorsque les joueurs l'ont choisi ;
4. après la séance, enregistrer les conséquences persistantes dans SQLite et, lorsqu'elles sont durables, dans ce Markdown ;
5. ne jamais déduire qu'un événement est joué simplement parce que son module est `ready`.
