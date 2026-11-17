<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

## Règles de développement PF2

- Lire `PF2_WORKSPACE.md` et les règles de déploiement avant toute intervention. Petites corrections : commit sur main après tests ; PR réservées aux grosses fonctionnalités.
- Pour toute préparation ou modification de contenu Foundry PF2, suivre obligatoirement la convention « fiches immédiatement jouables » de `pf2/outils/foundry.md` (modèle Malveillance) et `docs/pf2/session-preparations.md`, même dans une autre discussion ou campagne.
- Si la méthode nominale est bloquée, diagnostiquer et signaler le blocage. Ne pas chercher ni appliquer un contournement sans accord explicite.
- Le portail MJ/admin repose sur la confiance entre amis : ne pas introduire de clé MJ, d'authentification ni de restriction d'accès supplémentaire. Conserver les secrets et contrôles techniques existants des services (Foundry, Wiki, Discord, SSH, etc.).
