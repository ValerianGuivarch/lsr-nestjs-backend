# Catalogue des Journaux PF2

Le catalogue éditorial est dans SQLite, table `pf2_journal` :

```ts
{ "number": 68, "title": "Thassilon", "content": "Texte Markdown…", "dependencies": [] }
```

Les dépendances sont une liste de numéros. Ne mettre ni `revealed`, ni date,
ni identifiant Discord dans cette table : ces états dynamiques restent dans
`pf2_journal_revelation`.

Importer initialement la liste complète par SQL ou via l’administration de la
page wiki `Journaux`, puis créer des pages wiki vides `Journaux` et
`Journal-<numéro>`. L'extension PF2Journals les remplit côté serveur sans que le
contenu non révélé ne soit présent dans le HTML ou l'API publique.
