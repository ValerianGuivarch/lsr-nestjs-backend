# Catalogue des Journaux PF2

Le catalogue éditorial est dans `JournalCatalogue.ts`, sous la forme d'objets :

```ts
{ number: 68, title: 'Thassilon', content: 'Texte Markdown…', dependencies: [] }
```

Les dépendances sont une liste de numéros. Ne mettre ici ni `revealed`, ni date,
ni identifiant Discord : ces états dynamiques restent dans SQLite, table
`pf2_journal_revelation`.

Après avoir ajouté le catalogue, créer des pages wiki vides `Journaux` et
`Journal-<numéro>`. L'extension PF2Journals les remplit côté serveur sans que le
contenu non révélé ne soit présent dans le HTML ou l'API publique.
