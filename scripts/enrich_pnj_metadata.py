#!/usr/bin/env python3
import argparse
import json
import re
import sqlite3
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "pf2.sqlite"

def norm(value: str) -> str:
    value = unicodedata.normalize("NFD", value or "")
    value = "".join(ch for ch in value if unicodedata.category(ch) != "Mn")
    return value.lower()

def text_blob(p: dict) -> str:
    values = [
        p.get("nom", ""), p.get("description", ""), p.get("role", ""),
        p.get("notes", ""), " ".join(p.get("tags") or []),
        " ".join(p.get("aliases") or []),
    ]
    return norm(" ".join(str(v) for v in values if v))

def identity_blob(p: dict) -> str:
    # Pour l'ascendance/classe, on évite les biographies longues qui peuvent
    # mentionner d'autres créatures ou professions sans décrire le PNJ.
    description = str(p.get("description") or "")
    first_sentence = re.split(r"[.!?]\s", description, maxsplit=1)[0][:320]
    values = [
        first_sentence,
        str(p.get("role") or ""),
        " ".join(p.get("tags") or []),
    ]
    return norm(" ".join(values))

ANCESTRY_PATTERNS = [
    (r"\bdemi[- ]elfe\b|\bhalf[- ]elf\b", "Demi-elfe"),
    (r"\bdemi[- ]orque\b|\bhalf[- ]orc\b", "Demi-orque"),
    (r"\baasimar\b", "Aasimar"),
    (r"\bnephilim\b", "Nephilim"),
    (r"\btieffelin\b|\btiefling\b", "Tieffelin"),
    (r"\bdhampir\b", "Dhampir"),
    (r"\biruxi\b|\blizardfolk\b", "Iruxi"),
    (r"\bhalfelin\b|\bhalfling\b|\bhobbit\b", "Halfelin"),
    (r"\bhobgobelin\b|\bhobgoblin\b", "Hobgobelin"),
    (r"\bgobeline?\b|\bgoblin\b", "Gobelin"),
    (r"\bkobold\b", "Kobold"),
    (r"\bgnome\b", "Gnome"),
    (r"\bnain(?:e)?\b|\bdwarf\b", "Nain"),
    (r"\belfe\b|\belven\b", "Elfe"),
    (r"\borc\b", "Orc"),
    (r"\bhumaine?\b|\bhuman\b|\bulfen\b", "Humain"),
    (r"\banadi\b", "Anadi"),
    (r"\bminotaure\b|minotaur", "Minotaure"),
    (r"\bfelide\b|\bfeline\b|\bcatfolk\b", "Félide"),
    (r"\bfetchling\b", "Fetchling"),
    (r"\btengu\b", "Tengu"),
    (r"\bkitsune\b", "Kitsune"),
    (r"\bleshy\b", "Leshy"),
    (r"\bandroid\b", "Androïde"),
    (r"\bautomate\b|\bautomaton\b", "Automate"),
    (r"\bsuccube\b|\bsuccubus\b", "Succube"),
    (r"\brakshasa\b", "Rakshasa"),
    (r"\bxulgath\b", "Xulgath"),
    (r"\bguenaude\b|\bhag\b", "Guenaude"),
    (r"\bdragon\b", "Dragon"),
    (r"\bmort[- ]vivant\b|\bundead\b", "Mort-vivant"),
]

CLASS_PATTERNS = [
    (r"\bmagus\b", "Magus"),
    (r"\balchimiste\b|\balchemist\b", "Alchimiste"),
    (r"\bchampion\b", "Champion"),
    (r"\broublarde?\b|\brogue\b", "Roublard"),
    (r"\brodeur\b|\branger\b", "Rôdeur"),
    (r"\bguerriere?\b|\bfighter\b", "Guerrier"),
    (r"\bmoine\b|\bmonk\b", "Moine"),
    (r"\bensorceleu(?:r|se)\b|\bsorcerer\b", "Ensorceleur"),
    (r"\bbarde?\b|\bbard\b", "Barde"),
    (r"\bbarbare\b|\bbarbarian\b", "Barbare"),
    (r"\bdruide\b|\bdruid\b", "Druide"),
    (r"\binvestigat(?:eur|rice)\b", "Investigateur"),
    (r"\benquetrice?\b|\benqueteur\b", "Investigateur (pas sûr)"),
    (r"\binventeur\b|\binventor\b", "Inventeur"),
    (r"\bthaumaturge\b", "Thaumaturge"),
    (r"\boracle\b", "Oracle"),
    (r"\bsorciere\b|\bwitch\b", "Sorcière"),
    (r"\bmagicienne?\b|\bwizard\b", "Magicien"),
    (r"\bclerc\b|\bcleric\b", "Clerc"),
    (r"\bpretresse?\b|\bpretre\b", "Clerc (pas sûr)"),
    (r"\bdivinatrice?\b|\bdiviner\b", "Magicien (divination)"),
    (r"\bnecromancienne?\b|\bnecromancer\b", "Nécromancien (pas sûr)"),
    (r"\bdetective\b", "Détective (profil PNJ)"),
    (r"\bastrologue\b|\bastrologer\b", "Astrologue (profil PNJ)"),
    (r"\britualiste\b|\britualist\b", "Ritualiste (profil PNJ)"),
]

EXACT = {
    "pfs-season-1-1-21--eliza-petulengro": {
        "ascendance": "Humain",
        "classe": "Magicien (divination)",
        "caractere": "Douce, polie et très posée. Elle retient remarquablement bien les noms et les visages et traite les agents comme des personnes, pas comme de simples subordonnés ; sa réserve masque une vie privée qu’elle protège soigneusement.",
    },
    "pfs-season-1-1-21--armeline-jirneau": {
        "ascendance": "Demi-elfe",
        "classe": "Détective (profil PNJ)",
        "caractere": "Méthodique, discrète et réformatrice. Elle observe beaucoup avant de parler, protège jalousement les secrets de la loge et préfère les solutions fines aux démonstrations d’autorité. (pas sûr)",
    },
    "pfs-season-1-1-01--gorm-greathammer": {
        "ascendance": "Nain",
        "classe": "Conteur / chroniqueur (profil PNJ)",
        "caractere": "Exubérant, audacieux et très sociable : il raconte volontiers des histoires, plaisante et préfère l’expérience de terrain à l’érudition poussiéreuse. Il n’hésite pas à mettre lui-même les mains dans le cambouis.",
    },
    "pfs-season-1-1-01--tamrin-credence": {
        "ascendance": "Halfelin",
        "classe": "Espion / agent de terrain (profil PNJ)",
        "caractere": "Prudent, débrouillard et très sensible aux questions de liberté. Il pense en termes de réseaux, de couverture et de conséquences à long terme, et se méfie instinctivement des structures oppressives. (pas sûr)",
    },
    "pfs-season-1-1-01--urwal": {
        "ascendance": "Iruxi",
        "classe": "Astrologue (profil PNJ)",
        "caractere": "Abrupt, pointilleux et parfois cryptique. Il corrige les erreurs sans beaucoup de diplomatie, cite volontiers les signes célestes et semble considérer l’exactitude comme plus importante que les conventions sociales.",
    },
    "pfs-season-1-1-01--valais-durant": {
        "ascendance": "Aasimar",
        "classe": "Ritualiste (profil PNJ)",
        "caractere": "Altruiste, résiliente et attentive aux vulnérables. Son expérience de la corruption démoniaque l’a rendue déterminée sans la rendre dogmatique ; elle cherche à aider sans imposer sa propre vision du bien.",
    },
    "agents-of-edgewatch-adventure-1--ollo": {
        "ascendance": "Nain",
        "classe": "Officier supérieur (profil PNJ)",
        "caractere": "Pragmatique, fiable et peu porté sur les grands discours. Il fait tourner le quartier général, donne des consignes claires et traite les agents compétents comme des collègues plutôt que comme des exécutants. (pas sûr)",
    },
    "crown-of-the-kobold-king--deldrin-baleson": {
        "ascendance": "Demi-elfe",
        "classe": "Guerrier 3 / Expert 3",
        "caractere": "Obstiné, franc et difficile à intimider. Il ne tolère guère les absurdités ni les abus d’autorité, mais reste humble et préfère servir efficacement plutôt que rechercher les honneurs.",
    },
    "crown-of-the-kobold-king--vamros-harg": {
        "ascendance": "Halfelin",
        "classe": "Ensorceleur 5 / Aristocrate 2",
        "caractere": "Bureaucratique, prudent et très attentif aux rapports de force locaux. Il parle volontiers règlements et procédures, mais son courage dépend beaucoup de qui risque de lui en tenir rigueur. (pas sûr)",
    },
    "crown-of-the-kobold-king--thuldrin-kreed": {
        "ascendance": "Humain",
        "classe": "Roublard 4 / Expert 3",
        "caractere": "Cruel, dominateur et habitué à ce que son pouvoir ne soit pas contesté. Il humilie volontiers les faibles mais devient nettement plus prudent quand quelqu’un lui résiste réellement.",
    },
    "crown-of-the-kobold-king--jaurpaye-teedum": {
        "ascendance": "Humain",
        "classe": "Moine 2 / Guerrier 3",
        "caractere": "Brutal, intimidant et fidèle à Kreed tant que cette fidélité lui donne du pouvoir. Il préfère la menace et la violence aux discussions longues et nourrit une hostilité particulière envers Deldrin.",
    },
    "crown-of-the-kobold-king--cirthana-gensar": {
        "ascendance": "Humain",
        "classe": "Clerc d’Iomédae",
        "caractere": "Droite, compatissante et courageuse. Elle essaie d’aider concrètement les habitants tout en restant ferme face aux abus et aux menaces. (pas sûr)",
    },
    "npc_gorm_greathammer": {
        "ascendance": "Nain",
        "classe": "Conteur / chroniqueur (profil PNJ)",
        "caractere": "Chaleureux, audacieux et très sociable. Il préfère les récits concrets et les anecdotes vivantes aux exposés académiques trop secs, et pousse les Éclaireurs à raconter ce qu’ils ont réellement vécu.",
    },
    "player-4d5a827e-88fa-445a-ad82-e2e999d3879a": {
        "ascendance": "Félide",
        "classe": "Inconnue",
        "caractere": "Tyrannique, calculatrice et possessive envers son cirque. Elle préfère manipuler, humilier et saboter à distance avant de se confronter directement à ceux qui menacent son prestige.",
    },
    "pfs-season-1-1-21--rindle-rainfickle": {
        "ascendance": "Halfelin",
        "classe": "Éclaireur / explorateur (profil PNJ)",
        "caractere": "Compétent, courageux et profondément attaché au Galt et à la loge de Woodsedge. Il aborde l’exploration avec sérieux et professionnalisme, sans chercher à voler la vedette aux autres agents. (pas sûr)",
    },
    "pfs-season-1-1-21--nevashi": {
        "ascendance": "Rakshasa",
        "classe": "Inconnue",
        "caractere": "Sous l’apparence de Rindle, il se montre serviable et sûr de lui tout en poussant subtilement les PJ vers les choix les plus risqués. Il préserve sa couverture aussi longtemps que possible et privilégie la fuite une fois démasqué si le combat tourne mal.",
    },
}

MERGES = {
    "pfs-season-1-1-01--gorm-greathammer": "npc_gorm_greathammer",
    "extinction-curse-volume-1--mistress-dusklight": "player-4d5a827e-88fa-445a-ad82-e2e999d3879a",
}

PROMOTE_GLOBAL = {
    # Pathfinder Society : figures de faction/loge ou personnages récurrents.
    "pfs-season-1-1-21--eliza-petulengro",
    "pfs-season-1-1-21--armeline-jirneau",
    "pfs-season-1-1-01--gorm-greathammer",
    "pfs-season-1-1-01--tamrin-credence",
    "pfs-season-1-1-01--urwal",
    "pfs-season-1-1-01--valais-durant",
    # Agents d'Absalom : responsable récurrent de la garde.
    "agents-of-edgewatch-adventure-1--ollo",
    # Nid-du-Faucon / Val de Sombrelune : habitants et autorités persistantes.
    "crown-of-the-kobold-king--barlus-chortun",
    "crown-of-the-kobold-king--cirthana-gensar",
    "crown-of-the-kobold-king--colbrin-jabbs",
    "crown-of-the-kobold-king--deldrin-baleson",
    "crown-of-the-kobold-king--laurel-gebre",
    "crown-of-the-kobold-king--savram",
    "crown-of-the-kobold-king--sharvaros-vade",
    "crown-of-the-kobold-king--thuldrin-kreed",
    "crown-of-the-kobold-king--jaurpaye-teedum",
    "crown-of-the-kobold-king--vamros-harg",
    "crown-of-the-kobold-king--verrin-tieruk",
    # Extinction Curse : membres de troupes / responsables persistants au-delà d'une seule scène.
    "extinction-curse-volume-1--cubby",
    "extinction-curse-volume-1--daring-danika",
    "extinction-curse-volume-1--gidarron-elbus",
    "extinction-curse-volume-1--hesper-jaxis",
    "extinction-curse-volume-1--jae-abber",
    "extinction-curse-volume-1--jellico-bounce-bounce",
    "extinction-curse-volume-1--meitas-jaxis",
    "extinction-curse-volume-1--mistress-dusklight",
    "extinction-curse-volume-1--tahala-roadwatcher",
    "extinction-curse-volume-1--viktor-volkano",
    # Contacts/factions locales réutilisables.
    "rose-street-revenge--engashez",
    "rose-street-revenge--fazgyn",
    "rose-street-revenge--valette",
    "rose-street-revenge--ziraya-al-shurati",
    "quest-03-grehunde-s-gorget--eynilla-vriggdahl",
    "quest-03-grehunde-s-gorget--lirall",
}

def infer_ancestry(p: dict) -> str:
    current = str(p.get("ascendance") or "").strip()
    if current and current not in {"Inconnue", "Inconnu"}:
        return current

    # Les rôles et tags peuvent décrire explicitement n'importe quel type de
    # créature ("succube", "rakshasa", etc.) sans ambiguïté.
    role_tags = norm(f"{p.get('role', '')} {' '.join(p.get('tags') or [])}")
    for pattern, label in ANCESTRY_PATTERNS:
        if re.search(pattern, role_tags):
            return label

    # Dans une biographie, des mots comme "dragon" ou "mort-vivant" peuvent
    # désigner un lieu, un ennemi ou un événement. On n'y infère donc que les
    # ascendances humanoïdes classiques.
    safe_labels = {
        "Demi-elfe", "Demi-orque", "Aasimar", "Nephilim", "Tieffelin",
        "Dhampir", "Iruxi", "Halfelin", "Hobgobelin", "Gobelin", "Kobold",
        "Gnome", "Nain", "Elfe", "Orc", "Humain", "Anadi", "Minotaure",
        "Félide", "Fetchling", "Tengu", "Kitsune", "Leshy", "Androïde",
        "Automate",
    }
    description = identity_blob(p)
    for pattern, label in ANCESTRY_PATTERNS:
        if label in safe_labels and re.search(pattern, description):
            return label
    return "Inconnue"

def infer_class(p: dict) -> str:
    current = str(p.get("classe") or "").strip()
    if current and current not in {"Inconnue", "Inconnu"}:
        return current
    blob = identity_blob(p)
    for pattern, label in CLASS_PATTERNS:
        if re.search(pattern, blob):
            return label
    # Quelques rôles fonctionnels suffisamment explicites pour être utiles.
    role = norm(str(p.get("role") or ""))
    if "venture-capitaine" in role:
        return "Inconnue"
    if any(word in role for word in ("officier", "sergent")):
        return "Officier (profil PNJ)"
    return "Inconnue"

GENERATED_CHARACTER_TEMPLATES = {
    "Méfiant et calculateur ; cherche à garder l’ascendant et donne peu d’informations gratuitement. Devient plus agressif ou menaçant quand il perd le contrôle de la situation. (pas sûr)",
    "Assuré et professionnel, habitué à être écouté. Donne des consignes claires et ramène rapidement la conversation aux responsabilités concrètes de sa fonction. (pas sûr)",
    "Précis et analytique ; s’anime lorsqu’on aborde son domaine d’expertise et préfère les faits aux effets de manche. Peut sembler absorbé par son sujet quand une découverte l’intéresse. (pas sûr)",
    "Pragmatique et serviable tant que les PJ prennent la situation au sérieux. Va à l’essentiel, fournit volontiers les informations utiles et laisse les aventuriers agir. (pas sûr)",
    "Prudent et encore marqué par ce qu’il vient de subir. Cherche d’abord sécurité et réponses avant de se livrer complètement aux PJ. (pas sûr)",
    "Posé et guidé par ses convictions ; écoute avant de répondre et ramène volontiers les choix à des principes moraux ou spirituels. (pas sûr)",
    "Affable mais attentif à son intérêt ; jauge rapidement ce que les PJ peuvent lui apporter et transforme facilement une discussion en négociation. (pas sûr)",
    "Expressif et habitué à capter l’attention d’un public. Met volontiers un peu de théâtralité dans ses réactions, même hors représentation. (pas sûr)",
    "Direct, curieux et habitué au risque ; traite les PJ comme des collègues capables et apprécie les informations concrètes venues du terrain. (pas sûr)",
}

def infer_character(p: dict) -> str:
    current = str(p.get("caractere") or "").strip()
    if current and current not in {"Inconnu", "Inconnue"} and current not in GENERATED_CHARACTER_TEMPLATES:
        return current
    roleplay = str(p.get("roleplay") or "").strip()
    if roleplay and roleplay not in GENERATED_CHARACTER_TEMPLATES:
        return roleplay
    role = norm(str(p.get("role") or ""))
    description = norm(str(p.get("description") or ""))
    tags = norm(" ".join(p.get("tags") or []))
    role_or_tags = f"{role} {tags}"
    if any(k in role_or_tags for k in ("antagoniste", "criminel", "cultiste", "corruptr", "chef de gang", "homme de main", "esclavagiste")) or re.search(r"\bassassin\b", role_or_tags):
        return "Méfiant et calculateur ; cherche à garder l’ascendant et donne peu d’informations gratuitement. Devient plus agressif ou menaçant quand il perd le contrôle de la situation. (pas sûr)"
    if any(k in role for k in ("venture-capitaine", "dirigeant", "dirigeante", "maire", "magistrat", "autorite", "officier", "sergent", "prevot", "capitaine")):
        return "Assuré et professionnel, habitué à être écouté. Donne des consignes claires et ramène rapidement la conversation aux responsabilités concrètes de sa fonction. (pas sûr)"
    if any(k in role for k in ("chercheur", "chercheuse", "erudit", "archiviste", "archeologue", "mage", "magicien", "necromancien", "historique")):
        return "Précis et analytique ; s’anime lorsqu’on aborde son domaine d’expertise et préfère les faits aux effets de manche. Peut sembler absorbé par son sujet quand une découverte l’intéresse. (pas sûr)"
    if any(k in role for k in ("allie", "alliee", "contact", "guide", "accueil", "guerisse", "gardien", "transport")):
        return "Pragmatique et serviable tant que les PJ prennent la situation au sérieux. Va à l’essentiel, fournit volontiers les informations utiles et laisse les aventuriers agir. (pas sûr)"
    if any(k in role for k in ("victime", "prisonnier", "disparu", "secourir", "temoin")):
        return "Prudent et encore marqué par ce qu’il vient de subir. Cherche d’abord sécurité et réponses avant de se livrer complètement aux PJ. (pas sûr)"
    if any(k in role for k in ("pretre", "pretresse", "relig", "cler")):
        return "Posé et guidé par ses convictions ; écoute avant de répondre et ramène volontiers les choix à des principes moraux ou spirituels. (pas sûr)"
    if any(k in role for k in ("marchand", "commerce", "boutiqu", "negoci")):
        return "Affable mais attentif à son intérêt ; jauge rapidement ce que les PJ peuvent lui apporter et transforme facilement une discussion en négociation. (pas sûr)"
    if any(k in role for k in ("artiste", "cirque", "conteur", "spectacle")):
        return "Expressif et habitué à capter l’attention d’un public. Met volontiers un peu de théâtralité dans ses réactions, même hors représentation. (pas sûr)"
    if any(k in role_or_tags for k in ("eclaireur", "aventurier", "explorateur", "pathfinder")):
        return "Direct, curieux et habitué au risque ; traite les PJ comme des collègues capables et apprécie les informations concrètes venues du terrain. (pas sûr)"
    # Une description seule n'est utilisée qu'en dernier recours pour les rôles
    # manifestement descriptifs, jamais pour décider qu'un PNJ est hostile.
    if any(k in description for k in ("marchand", "boutiquier")):
        return "Affable mais attentif à son intérêt ; jauge rapidement ce que les PJ peuvent lui apporter et transforme facilement une discussion en négociation. (pas sûr)"
    return "Inconnu"

def merge_values(target: dict, source: dict, source_name: str) -> dict:
    merged = dict(target)
    # Les champs structurants du référentiel global restent prioritaires.
    for field in ("description", "role", "roleplay", "caractere", "ascendance", "classe", "notes", "portrait"):
        current = str(merged.get(field) or "").strip()
        incoming = str(source.get(field) or "").strip()
        if (not current or current in {"Inconnue", "Inconnu"}) and incoming:
            merged[field] = incoming
    for field in ("factions", "tags", "lieux", "regions", "evenements"):
        current = list(merged.get(field) or [])
        incoming = list(source.get(field) or [])
        if field == "factions":
            seen = {(str(item.get("faction_id")), str(item.get("role", "")), str(item.get("statut", ""))) for item in current if isinstance(item, dict)}
            for item in incoming:
                if not isinstance(item, dict):
                    continue
                key = (str(item.get("faction_id")), str(item.get("role", "")), str(item.get("statut", "")))
                if key not in seen:
                    current.append(item)
                    seen.add(key)
        else:
            for item in incoming:
                if item not in current:
                    current.append(item)
        merged[field] = current
    aliases = list(merged.get("aliases") or [])
    for alias in [source_name, source.get("nom"), *(source.get("aliases") or [])]:
        if alias and alias != merged.get("nom") and alias not in aliases:
            aliases.append(alias)
    merged["aliases"] = aliases
    merged["scope"] = "global"
    merged.pop("ownerScenarioId", None)
    return merged

def apply_merges(db: sqlite3.Connection, apply: bool) -> list[tuple[str, str]]:
    performed = []
    for source_id, target_id in MERGES.items():
        source_row = db.execute("SELECT name,payload FROM pf2_record WHERE kind='pnj' AND id=?", (source_id,)).fetchone()
        target_row = db.execute("SELECT name,payload FROM pf2_record WHERE kind='pnj' AND id=?", (target_id,)).fetchone()
        if not source_row or not target_row:
            continue
        performed.append((source_id, target_id))
        if not apply:
            continue
        source = json.loads(source_row["payload"])
        target = json.loads(target_row["payload"])
        merged = merge_values(target, source, source_row["name"])
        db.execute(
            "UPDATE pf2_record SET payload=?, updated_at=CURRENT_TIMESTAMP WHERE kind='pnj' AND id=?",
            (json.dumps(merged, ensure_ascii=False, separators=(",", ":")), target_id),
        )
        links = list(db.execute(
            "SELECT scenario_id,role,importance,source_page,notes FROM pf2_scenario_npc WHERE npc_id=?",
            (source_id,),
        ))
        for link in links:
            db.execute(
                """INSERT INTO pf2_scenario_npc(scenario_id,npc_id,role,importance,source_page,notes)
                   VALUES(?,?,?,?,?,?)
                   ON CONFLICT(scenario_id,npc_id) DO UPDATE SET
                     role=COALESCE(excluded.role,pf2_scenario_npc.role),
                     importance=COALESCE(excluded.importance,pf2_scenario_npc.importance),
                     source_page=COALESCE(excluded.source_page,pf2_scenario_npc.source_page),
                     notes=COALESCE(excluded.notes,pf2_scenario_npc.notes),
                     updated_at=CURRENT_TIMESTAMP""",
                (link["scenario_id"], target_id, link["role"], link["importance"], link["source_page"], link["notes"]),
            )
        db.execute("DELETE FROM pf2_scenario_npc WHERE npc_id=?", (source_id,))
        db.execute("DELETE FROM pf2_record WHERE kind='pnj' AND id=?", (source_id,))
    return performed

def enrich(p: dict, id_: str) -> tuple[dict, list[str]]:
    before = json.dumps(p, ensure_ascii=False, sort_keys=True)
    if id_ in EXACT:
        p.update(EXACT[id_])
    p["ascendance"] = infer_ancestry(p)
    p["classe"] = infer_class(p)
    p["caractere"] = infer_character(p)
    existing_roleplay = str(p.get("roleplay") or "").strip()
    if (not existing_roleplay or existing_roleplay in GENERATED_CHARACTER_TEMPLATES) and p["caractere"] not in {"Inconnu", "Inconnue"}:
        p["roleplay"] = p["caractere"]
    if id_ in PROMOTE_GLOBAL and p.get("scope") == "scenario":
        p["scope"] = "global"
        p.pop("ownerScenarioId", None)
    after = json.dumps(p, ensure_ascii=False, sort_keys=True)
    changes = []
    if before != after:
        changes.append("updated")
    return p, changes

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    db = sqlite3.connect(DB)
    db.row_factory = sqlite3.Row
    merges = apply_merges(db, args.apply)
    if args.apply and merges:
        db.commit()
    rows = list(db.execute("SELECT id,name,payload FROM pf2_record WHERE kind='pnj' ORDER BY name"))
    changed = 0
    ancestry_known = 0
    class_known = 0
    character_known = 0
    promoted = []
    preview = []

    for row in rows:
        p = json.loads(row["payload"])
        old_scope = p.get("scope")
        new, changes = enrich(p, row["id"])
        if new.get("ascendance") != "Inconnue":
            ancestry_known += 1
        if new.get("classe") != "Inconnue":
            class_known += 1
        if new.get("caractere") != "Inconnu":
            character_known += 1
        if old_scope == "scenario" and new.get("scope") == "global":
            promoted.append((row["id"], row["name"]))
        if changes:
            changed += 1
            if len(preview) < 40:
                preview.append((row["name"], new.get("ascendance"), new.get("classe"), new.get("caractere"), new.get("scope")))
            if args.apply:
                db.execute(
                    "UPDATE pf2_record SET payload=?, updated_at=CURRENT_TIMESTAMP WHERE kind='pnj' AND id=?",
                    (json.dumps(new, ensure_ascii=False, separators=(",", ":")), row["id"]),
                )
    if args.apply:
        db.commit()

    scenario_after = sum(
        1
        for row in rows
        if enrich(json.loads(row["payload"]), row["id"])[0].get("scope") == "scenario"
    )
    print(f"PNJ: {len(rows)}")
    print(f"Fusions prévues/appliquées: {len(merges)}")
    for source_id, target_id in merges:
        print(f"  - {source_id} -> {target_id}")
    print(f"Modifiés: {changed}")
    print(f"Ascendance connue: {ancestry_known}/{len(rows)}")
    print(f"Classe/profil connu: {class_known}/{len(rows)}")
    print(f"Caractère connu: {character_known}/{len(rows)}")
    print(f"Promus scenario -> global: {len(promoted)}")
    print(f"Resteraient spécifiques: {scenario_after}")
    print("\nPromotions:")
    for id_, name in promoted:
        print(f"- {name} [{id_}]")
    print("\nAperçu:")
    for row in preview:
        print(" | ".join(str(v) for v in row))

if __name__ == "__main__":
    main()
