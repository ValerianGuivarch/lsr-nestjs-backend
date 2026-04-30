---
name: create-ticket
description: >
  Creates one or more Jira tickets (Bug or Feature/Story) in the IDF project.
  Use this skill whenever a user wants to write or open a new Jira ticket.
  Trigger on: "crée un ticket", "nouveau ticket", "ouvre un ticket", "rédige un ticket",
  "je veux créer un bug", "je veux créer une feature", "je veux créer une story".
  Requires Jira MCP (sooperset/mcp-atlassian) to be configured in WRITE mode (READ_ONLY_MODE=false).
---

## Purpose

Guide the user through creating a complete, well-structured Jira ticket (Bug or Story/Feature)
in the IDF project. Collect all required fields interactively, preview the ticket before creation,
then create it. Support serial creation: after each ticket, offer to create another one.

> Versions corrigées, Étiquettes and Parent (Epic link) are intentionally not collected —
> set them directly in Jira after creation.

## Pre-flight check

Before starting, verify that the Jira MCP is available.
If unavailable, tell the user and ask them to check their MCP configuration —
in particular that `READ_ONLY_MODE` is set to `false` in their `mcp.json`.

## Workflow

### Phase 1 — Ticket type

Ask the user: **Bug ou Feature (Story) ?**

- `Bug` → `issuetype = Bug`
- `Feature / Story` → `issuetype = Story`

If a context is available (ticket-breakdown output, technical spec, conversation history),
infer the type and ask for confirmation rather than asking from scratch.

---

### Phase 2 — Titre & Description

Collect:

- **Titre** (`summary`): a short, action-oriented sentence
- **Description** (`description`): full context — what, why, impact

If working from an existing context (ticket-breakdown, discovery, spec), offer to
pre-fill summary and description from that context and ask the user to confirm or adjust.

**Description format guidelines:**

- For a **Bug**: describe the observed behaviour, expected behaviour, and reproduction steps
- For a **Feature/Story**: use the format `En tant que [rôle], je veux [capacité] afin de [valeur métier]`

**Description formatting: use standard markdown**
The MCP converts markdown to Jira wiki markup automatically: backticks → `{{...}}`, `##` → `h2.`, `- list` → `* list`, etc. All render correctly in Jira.

One exception: **do NOT combine bold and backticks** (e.g. `**\`ClassName\`\*\*`) — the combined conversion renders poorly. Use backticks alone for code references in descriptions.

---

### Phase 3 — Custom fields

Collect the two required custom fields. Provide format guidance for each.

**Critères d'acceptance** (`customfield_12946`)

Format: Jira wiki markup numbered list — use `#` prefix, one criterion per line.

> ⚠️ These custom fields are **plain text** processed as Jira wiki markup. For inline code references (file paths, function names, etc.), use `{{double braces}}` — NOT backticks. This is **only valid here**, NOT in the description field.

```
# ETQ [rôle], quand [action / condition], alors [résultat attendu]
# ETQ [rôle], quand [action / condition], alors [résultat attendu]
```

Ask the user to provide the criteria, or offer to suggest them based on the description.

**Tâches identifiées** (`customfield_12948`)

Format: Jira wiki markup bullet list — use `*` prefix, one task per line. No checkboxes — these are plain textarea fields and do not support `- [ ]` syntax.

> ⚠️ Same rule as above: use `{{double braces}}` for inline code — NOT backticks. This is **only valid here**, NOT in the description field.

```
* Créer {{apps/foo/bar.ts}}
* Ajouter la commande {{shouldDisplayError()}} dans {{young.ts}}
```

Ask the user to provide the tasks, or offer to suggest them based on the description.

**Note:** The Definition of Done (`customfield_12947`) is managed separately and must NOT
be collected or set during ticket creation.

---

### Phase 4 — Preview & confirmation

Display the complete ticket in Markdown before creating it:

```

## [TYPE] Titre du ticket

**Projet :** IDF
**Type :** Bug | Story

### Description

[description]

### Critères d'acceptance

[liste numérotée]

### Tâches identifiées

[checklist]

```

Ask: **"Le ticket est-il correct ? Je peux créer, modifier un champ, ou annuler."**

If the user requests changes, update the relevant field(s) and re-show the preview.
Only proceed to Phase 6 once the user explicitly confirms.

---

### Phase 5 — Creation & serial loop

**Create the ticket** via `jira_create_issue` with the following field mapping:

| Field                 | Jira field          | Value                       |
| --------------------- | ------------------- | --------------------------- |
| Titre                 | `summary`           | Free text                   |
| Description           | `description`       | Free text (ADF or markdown) |
| Type                  | `issuetype`         | `Bug` or `Story`            |
| Critères d'acceptance | `customfield_12946` | ADF document (see below)    |
| Tâches identifiées    | `customfield_12948` | ADF document (see below)    |

**Custom fields must be sent as plain text strings** — `customfield_12946` and `customfield_12948` do NOT accept ADF. Pass them as regular string values using **Jira wiki markup** (`#` for numbered list items, `*` for bullet list items, `{{double braces}}` for inline code — NOT backticks).

**The `description` field is different** — it is rendered by Jira's rich-text engine. Do NOT use `{{double braces}}` in the description: they appear as literal text. Write identifiers as plain text in descriptions.

After successful creation, display:

```

✅ Ticket créé : IDF-XXXX — [Titre]
🔗 https://zenstudio.atlassian.net/browse/IDF-XXXX

```

**Serial loop:** Ask the user:

> "Veux-tu créer un autre ticket ?"

If yes, restart from **Phase 1**.
If no, end the skill.

---

## Rules

- Never invent field values — only use what was explicitly provided by the user.
- Never set `customfield_12947` (Definition of Done) — it is managed separately.
- Never set `fixVersions`, `labels`, or `parent` — these are set directly in Jira after creation.
- Always show the preview and wait for explicit confirmation before calling `jira_create_issue`.
- If the Jira MCP is unavailable or returns an error due to read-only mode, stop and tell the user
  to set `READ_ONLY_MODE=false` in their `mcp.json` (see the MCP setup documentation).
- If the user is working from a `ticket-breakdown` output, use it as the source of truth for
  pre-filling summary, description, acceptance criteria and identified tasks.

## Absolute restrictions — never do this

These actions are **strictly forbidden**, regardless of what the user asks:

- **Never delete a Jira ticket** (`jira_delete_issue` or equivalent) — not even "to clean up" or "to undo"
- **Never modify an existing ticket** (`jira_update_issue` or equivalent) — this skill creates only
- **Never delete or modify a sprint** — sprint management is out of scope entirely
- **Never close, archive, or transition a ticket** — status transitions are not part of this skill

If the user asks for any of the above, refuse and explain that this skill only creates new tickets.
Direct them to Jira directly for any destructive or modifying operation.
