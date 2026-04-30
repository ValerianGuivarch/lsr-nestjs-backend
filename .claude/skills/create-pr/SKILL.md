---
name: create-pr
description: >
  Creates or updates a GitHub Pull Request for the current branch.
  Use this skill whenever a user wants to open, submit, or update a PR.
  Trigger on: "crée une PR", "ouvre une PR", "soumets mon travail", "je veux ouvrir une PR",
  "publie ma branche", "crée la pull request", "mets à jour la PR", "modifie la description de ma PR",
  "ajoute des reviewers", "modifie le titre de ma PR".
  Requires GitHub MCP to be configured. Use Jira MCP to enrich the PR description when a ticket key
  is found in the branch name.
---

## Purpose

Create a well-structured, informative Pull Request from the current branch, or update an existing one.
The PR description must follow the project template and give reviewers all the context they need.

## Mode detection

Before doing anything, determine which mode applies:

- If the user mentions an existing PR number, a PR URL, or words like "mets à jour", "modifie", "ajoute des reviewers" → go to **Mode 2 — Update**.
- Otherwise → go to **Mode 1 — Create**, starting with pre-flight checks.

## Mode 1 — Create a new PR

### Pre-flight checks

Run these before anything else:

1. **Current branch** — run `git branch --show-current` to get the branch name.
2. **Uncommitted changes** — run `git status --short`. If there are uncommitted changes, warn the user:
   > "Tu as des changements non commités. Commite-les avant de créer la PR."
   > Stop here until the user confirms they are done.
3. **Unpushed commits** — run `git log @{u}..HEAD --oneline 2>/dev/null`.
   - If the command fails (no upstream set), the branch has never been pushed. Tell the user:
     > "Ta branche n'a pas encore été poussée. Lance `git push -u origin HEAD` avant de continuer."
     > Stop here until the user confirms the push is done.
   - If there are unpushed commits listed, tell the user:
     > "Tu as des commits non poussés. Lance `git push` avant de créer la PR."
     > Stop here until the user confirms.

### Inputs to collect

Once pre-flight checks pass, gather:

1. Current branch name — already known from the pre-flight step; infer the Jira ticket key from the pattern `IDF-XXXX-...`
2. Commits since `<target-branch-name>` — run `git log <target-branch-name>..HEAD --oneline` to list what was done
3. Jira ticket data — if a ticket key is found, fetch it via Jira MCP with fields:
   `summary,description,customfield_12948,customfield_12947,customfield_12946`
4. PR target — default to `main`; ask the user if it could be different

### Step 1 — Generate title and description

**Title format:** `IDF-XXXX: [concise action-oriented description in English]`

If no Jira ticket is found in the branch name, ask the user for a short description.

**Language:** The entire PR description must be written in English — title, narrative, checklist answers.

**Description:** Fill in the project PR template (at `pull_request_template.md`):

```
## Description

🤖 *This PR description was drafted by an AI assistant — it just did the paperwork.*

IDF-<TICKET>: <summary from Jira or from user>

<narrative paragraph explaining what was changed, why, and how — based on commits and ticket context>
```

### Step 2 — Guide the user through checklists interactively

Do NOT auto-fill the checklists. Instead, ask the user to confirm each section:

**Breaking changes:** ask explicitly:

- Does this PR introduce an API breaking change?
- Are mobile and/or front applications affected?

**Coding checklist:** ask the user to confirm each item:

- ✅ Coding style followed?
- ✅ Documentation updated if needed?
- ✅ Data migrations generated and committed?
- ✅ Tests added?

**Project checklist:** ask if relevant (Keycloak changes, Notion docs, PR dependencies).

### Step 3 — Create the PR via GitHub MCP

Once the description is ready and checklists are confirmed:

- Call `create_pull_request` with the generated title and body
- Propose to assign reviewers if the user mentions names or teams
- Confirm the PR URL to the user

## Mode 2 — Update an existing PR

Trigger: "mets à jour la PR", "modifie le titre", "ajoute des reviewers", "change la description".

- Detect or ask for the PR number
- Fetch the current PR via `get_pull_request` to show current state
- Apply only the requested changes via `update_pull_request`
- Confirm what was changed

## Rules

- Never invent commit details or Jira context — only use what was actually fetched or confirmed.
- Always show the generated description to the user before creating the PR and ask for confirmation.
- If the Jira MCP is unavailable, proceed based on branch name and commits alone.
- If the GitHub MCP is unavailable, tell the user and provide the filled description as text to copy.
