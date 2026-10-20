# PF2 — Personnages wiki, contacts et portraits

[← PJ](../../PJ.md) · [← Espace de travail](../../PF2_WORKSPACE.md) · [Wiki / Discord](wiki-discord.md)

## Trois niveaux de visibilité

- **Public** : `pf2_player_character_profile.is_published = 1`. Présent dans le carnet général PJ/PNJ et dans le canal Discord `#personnages`. Un personnage public peut aussi être un contact d'un ou plusieurs PJ. Son portrait public reste visible.
- **Contact personnel** : association explicite dans `pf2_player_character_contact`. Le PNJ peut garder `is_published = 0`, donc absent de la liste générale. Il est visible dans l'onglet Contacts du ou des PJ associés. La fiche wiki de contact existe indépendamment du statut de publication.
- **Strictement MJ** : fiche métier `pf2_record(kind='pnj')` sans publication ni association. Invisible du carnet général et des Contacts ; reste dans l'administration MJ.

L'existence d'un portrait, d'une page wiki, de tags `contact-pj`, ou le `scope=global` n'implique **jamais** la publication. L'accès à une URL de page wiki connue peut rendre son contenu public : ne jamais placer de secrets MJ dans une page wiki destinée aux contacts.

## Portrait connu par un PJ

`pf2_player_character_contact.portrait_known` est un booléen SQLite, **par relation entre un PJ et un PNJ**, avec valeur par défaut `1` (« oui »). La migration `043-contact-portrait-known` initialise les anciennes associations à 1. Pour un contact non publié, `0` signifie que le joueur connaît le personnage mais **pas son apparence actuelle** : le wiki montre une silhouette neutre, sans fournir l'URL du portrait dans les données de contact. `1` autorise l'image, lorsqu'elle existe.

Un PNJ publié conserve son portrait public, même si `portrait_known=0` pour une relation. Le portrait d'origine du PNJ MJ n'est jamais modifié par cet indicateur.

### Modifier depuis l'administration MJ

1. Aller à `https://l7r.fr/pf2-mj/npcs` et ouvrir le PNJ.
2. Dans **Contacts privés**, chaque PJ a une case d'association et, à côté, la case **Portrait visible**.
3. Associer d'abord le PNJ au PJ si nécessaire ; la case « Portrait visible » devient alors modifiable. Elle est cochée par défaut.
4. Décocher pour masquer l'image **à ce PJ uniquement** ; la sauvegarde est immédiate.
5. Tester l'onglet Contacts de la page wiki du PJ.

Exemples d'arbitrages **non appliqués automatiquement** : Neyla ne reconnaît pas l'apparence d'Avarneus ; Pen-Pen ne connaît pas l'apparence actuelle de Tikaak. Le MJ peut décocher les deux associations correspondantes.

## Schéma technique et sources

- `pf2_record(kind='pnj')` : données MJ (y compris portrait et secrets).
- `pf2_player_character_profile` : profil du carnet wiki, `is_player`, `is_published`, description courte, nom, ascendance, classe et objectif.
- `pf2_player_character_contact` : `player_npc_id`, `contact_npc_id`, `portrait_known`.
- NestJS `PlayerCodexService.contactPlayers` et `setContactPortraitKnown` : consultation et édition du drapeau.
- NestJS `privateCharacterDto/privateContactDto` : restitution du portrait seulement lorsqu'il est visible.
- Application MJ `Pnj.tsx` : case d'association et case « Portrait visible ».
- MediaWiki `pf2-player-codex.js` : carte de contact et silhouette de remplacement.

Le statut « portrait visible » ne protège **pas** à lui seul une image accessible par son URL MJ ou une autre API. Les routes MJ et les contenus secrets doivent être sécurisés séparément ; ne pas traiter ce drapeau comme une autorisation d'accès aux documents privés.
