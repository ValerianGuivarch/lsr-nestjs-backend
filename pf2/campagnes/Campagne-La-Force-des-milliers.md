# La Force des milliers

[← Index des campagnes](Campagnes.md) · [Labyrinthe de Narven](../univers/Labyrinthe-et-portails.md) · [La Route ouverte](Campagne-Route-Ouverte.md) · [Yaz Lorok](../pj/PJ-Yaz-Lorok.md)

> **Statut runtime vérifié le 19 novembre 2026 : campagne intégrée, sélectionnée « à jouer », aucune séance de La Force des milliers encore jouée.**
>
> **Kindled Magic est entièrement préparé** : source complète, cinq modules Choix libre, scènes, Actors, rencontres, dangers, butins, notes de carte et Journal MJ sont prêts. Le seul verrou restant avant de commencer est narratif : **le passage du Labyrinthe de Narven vers Nantambu doit avoir été ouvert en jeu**.

## Décisions validées

- Les PJ ne sont **pas des élèves de la Magaambya**. Ils interviennent comme alliés extérieurs de la **Société des Éclaireurs**.
- La continuité académique est portée par les étudiants, enseignants et responsables récurrents de la Magaambya ; les équipes de PJ peuvent varier entre les missions de terrain.
- Les examens, rangs et promotions de l'Adventure Path ne sont pas imposés aux PJ. Les rites intéressants sont conservés comme invitations, partenariats, protections ou témoignages.
- L'entrée dans la campagne passe par le **Labyrinthe de Narven / futur Labyrinthe de la Route ouverte**. La préparation de La Force des milliers ne doit jamais créer ce passage à la place de la progression réellement jouée.
- Pour **Yaz Lorok**, sa première année à la Magaambya avec **Narek Lorok** est déjà établie. Ce passé peut enrichir le retour à Nantambu, mais la campagne reste jouable sans Yaz et ne doit pas révéler hors jeu les découvertes d'Uxir ou le secret de Narek.
- Les allocations et récompenses purement scolaires du scénario original ne deviennent pas automatiquement des paiements aux Éclaireurs ; les récompenses liées aux missions, découvertes et combats sont conservées.

## Progression réelle

Au 19 novembre 2026 :

- aucune séance `strength-of-thousands-*` n'est enregistrée comme jouée ;
- aucune quête Discord / Choix libre n'est encore rattachée à la campagne ;
- la curation SQLite indique une campagne incluse, sélectionnée et `to_play` ;
- les cinq modules de `Kindled Magic` restent en `progress: todo`, mais chacun a une checklist de préparation complète et `ready: true`.

L'état « prêt » signifie **préparé**, pas « joué ». Tant que le passage vers Nantambu n'a pas été ouvert dans la fiction, le premier module reste inaccessible narrativement.

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
| 1 | `allies-a-nantambu` | **Alliés à Nantambu** | libre, groupe variable | **Prêt** ; Foundry N/A ; verrou narratif = passage vers Nantambu |
| 2 | `services-de-la-magaambya` | **Services de la Magaambya** | libre, groupe variable | **Prêt** |
| 3 | `masques-et-incidents` | **Masques et incidents** | verrou souple | **Prêt** |
| 4 | `stone-ghost` | **Le Fantôme de pierre** | verrou dur pendant l'exploration profonde | **Prêt** |
| 5 | `anadi-et-griffons` | **Les anadi et les griffons** | verrou souple | **Prêt** |

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

### 5 — Les anadi et les griffons

Le texte complet corrige l'estimation antérieure : il s'agit de **trois anadi et trois griffons**, pas d'une paire de griffons.

Les futurs étudiants sont :

- **Rainbows-Reflected-Upon-Gossamer-Strands**, dit **Goss** ;
- **Droplets-Hanging-Gently Savanakin** ;
- **Barest-Threads-Billowing Maztachia**.

Ils sont aidés par Takulu Ot et attaqués par **trois griffons**. La rencontre est Extreme 3. Au moins un anadi devrait survivre afin que les deux mystères — pourquoi ils sont venus à la Magaambya et pourquoi les griffons les ont ciblés — puissent être repris par Janatimo au début de `Spoken on the Song Wind`.

Le scénario situe cette scène près du **Speaker's Stage**. Aucun champ de bataille dédié n'existant dans les scènes importées, Foundry utilise **Promenade de bienvenue** comme **arène tactique d'adaptation**. Cette substitution est volontairement documentée comme non canonique.

## Foundry — Tome 1 prêt

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

**63 tokens de rencontres fixes** ont été placés. Ils sont masqués par défaut lorsque nécessaire ; les trois anadi et Takulu sont visibles dans la scène finale. Les trois vagues du tournoi sont superposées et masquées pour être révélées successivement.

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

### Journal et notes de carte

Le Journal MJ canonique est :

- `JournalEntry.ocvt0G55FnohLcT0` — **La Force des milliers — 01 — La magie éveillée — Préparation MJ**.

Il contient 13 pages structurées : vue d'ensemble, cinq modules, services, bibliothèque B1–B8, tournoi/faveurs, First Masking, cavernes C1–C7 et C8–C15, arrivée anadi, butins et état Foundry.

L'ancien journal provisoire a été supprimé.

**34 notes de scène** pointent directement vers les bonnes pages du Journal, notamment B1–B8 et C1–C15.

### Vérification mécanique

La préparation a été relue depuis Foundry après écriture :

- le Journal canonique expose bien 13 pages ;
- les scènes contiennent les quantités de tokens et notes attendues ;
- un coffre C11 a été relu avec ses vrais objets — Sac spacieux type I et Trompe de cherchesang ;
- une action mécanique a été vérifiée par un vrai jet Foundry utilisant le bonus de Morgenstern de Stone Ghost (`+15`), sans publier de message parasite dans le chat.

Les critères `source`, `template`, `entities`, `foundry` et `review` sont donc tous `done` pour les modules 2–5. Le module 1 conserve `foundry: N/A`.

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
