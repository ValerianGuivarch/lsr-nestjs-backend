#!/usr/bin/env python3
"""Synchronise les portraits PF2-MJ vers le dossier d'assets Foundry.

Principes :
- aucun hotlink n'est conservé dans pf2_personnages.json ;
- tous les portraits actifs pointent vers assets/l7r/portraits/pnj/<fichier> ;
- recherche d'abord les portraits déjà présents dans Foundry (Actors/compendiums/fichiers) ;
- peut ensuite récupérer des sources historiques et, en option, PathfinderWiki ;
- met à jour le JSON du dépôt et peut pousser les PNJ vers l'API locale pour
  resynchroniser la copie SQLite.

Le mode par défaut est un dry-run : aucun fichier n'est écrit et aucun appel
Internet n'est effectué sans --online.
"""
from __future__ import annotations

import argparse
import html
import json
import mimetypes
import os
import re
import shutil
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, asdict
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any, Iterable

IMAGE_EXTENSIONS = {".webp", ".png", ".jpg", ".jpeg", ".gif"}
MAX_IMAGE_BYTES = 12 * 1024 * 1024
FOUNDRY_PREFIX = "assets/l7r/portraits/pnj"
USER_AGENT = "PF2MJ-PortraitSync/3.0 (+private Foundry library maintenance)"
PATHFINDERWIKI_API = "https://pathfinderwiki.com/mediawiki/api.php"
FANDOM_API = "https://pathfinder.fandom.com/api.php"
LACRYPTE_API = "https://wiki-path.lacrypte.fr/api.php"

MEDIAWIKI_SOURCES = (
    ("pathfinderwiki", PATHFINDERWIKI_API),
    ("pathfinder-fandom", FANDOM_API),
    ("lacrypte", LACRYPTE_API),
)

# Deux URLs existaient encore dans le référentiel V3.2. Elles sont conservées
# uniquement comme sources de migration ; l'application ne les charge jamais.
LEGACY_REMOTE_SOURCES = {
    "npc_abrogail_thrune_ii": "https://www.worldanvil.com/uploads/images/f790af6df551667b35bdf2728e98926f.png",
    "npc_janira_gavix": "https://cdn.paizo.com/image/content/Blog/072419_JaniraGavix.jpg",
}

IGNORED_IMAGE_MARKERS = (
    "mystery-man", "default", "placeholder", "icons/svg", "icons\\svg",
    "logo", "wayfinder", "token-border", "transparent", "blank",
    "site-logo", "wordmark", "community-header", "favicon", "avatar-default",
)


def normalize(value: str) -> str:
    value = unicodedata.normalize("NFD", value)
    value = "".join(c for c in value if unicodedata.category(c) != "Mn")
    value = value.lower().replace("’", "'")
    return re.sub(r"[^a-z0-9]+", " ", value).strip()


def slug(value: str) -> str:
    return normalize(value).replace(" ", "-") or "pnj"


def comparable_title(value: str) -> str:
    value = re.sub(r"\s*\([^)]*\)\s*$", "", value.strip())
    return normalize(value)


def similarity(left: str, right: str) -> float:
    a, b = comparable_title(left), comparable_title(right)
    if not a or not b:
        return 0.0
    if a == b:
        return 1.0
    if a in b or b in a:
        shorter, longer = sorted((a, b), key=len)
        if len(shorter) >= 5 and len(shorter) / max(len(longer), 1) >= 0.72:
            return 0.97
    return SequenceMatcher(None, a, b).ratio()


def pnj_names(pnj: dict[str, Any]) -> list[str]:
    return [str(pnj.get("nom") or ""), *[str(x) for x in pnj.get("aliases", []) if isinstance(x, str)]]


def canonical_filename(pnj: dict[str, Any], extension: str) -> str:
    return f"{slug(str(pnj.get('id') or pnj.get('nom') or 'pnj'))}{extension.lower()}"


def url_image_extension(value: str) -> str | None:
    """Détecte l'extension même dans les URLs Fandom `/image.jpg/revision/latest`."""
    path = urllib.parse.unquote(urllib.parse.urlparse(value).path).lower()
    match = re.search(r"\.(webp|png|jpe?g|gif)(?:/|$)", path)
    if not match:
        return None
    ext = match.group(1)
    return ".jpg" if ext in {"jpg", "jpeg"} else f".{ext}"


def content_extension(content_type: str | None, url: str = "") -> str | None:
    mime = (content_type or "").split(";", 1)[0].strip().lower()
    by_mime = {
        "image/webp": ".webp",
        "image/png": ".png",
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/gif": ".gif",
    }
    if mime in by_mime:
        return by_mime[mime]
    return url_image_extension(url)


def read_env_file(path: Path) -> dict[str, str]:
    result: dict[str, str] = {}
    if not path.is_file():
        return result
    for raw in path.read_text(errors="ignore").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        result[key.strip()] = value.strip().strip('"').strip("'")
    return result


def detect_foundry_assets_root(repo: Path, explicit: str | None) -> Path:
    if explicit:
        return Path(explicit).expanduser().resolve()
    env = dict(os.environ)
    for candidate in (repo / ".env", repo / ".env.local", repo / "apps/api-jdr/.env"):
        env = {**read_env_file(candidate), **env}
    configured = env.get("FOUNDRY_ASSETS_ROOT")
    if configured:
        path = Path(configured).expanduser()
        return (path if path.is_absolute() else repo / path).resolve()
    return (repo / "../../FoundryVTT/Data/assets/l7r").resolve()


def foundry_data_root(assets_root: Path, explicit: str | None) -> Path:
    if explicit:
        return Path(explicit).expanduser().resolve()
    # .../Data/assets/l7r -> .../Data
    if assets_root.name == "l7r" and assets_root.parent.name == "assets":
        return assets_root.parent.parent
    return assets_root.parent.parent


def is_usable_image_path(value: str) -> bool:
    lowered = urllib.parse.unquote(value).lower()
    return url_image_extension(value) in IMAGE_EXTENSIONS and not any(marker in lowered for marker in IGNORED_IMAGE_MARKERS)


def resolve_foundry_asset(data_root: Path, value: str) -> Path | None:
    if not value or re.match(r"^https?://", value, re.I):
        return None
    clean = urllib.parse.unquote(value).replace("\\", "/").lstrip("/")
    candidate = (data_root / clean).resolve()
    try:
        candidate.relative_to(data_root.resolve())
    except ValueError:
        return None
    return candidate if candidate.is_file() and candidate.suffix.lower() in IMAGE_EXTENSIONS else None


def nested(record: dict[str, Any], *keys: str) -> Any:
    value: Any = record
    for key in keys:
        if not isinstance(value, dict):
            return None
        value = value.get(key)
    return value


def actor_image(record: dict[str, Any]) -> str | None:
    candidates = [
        record.get("img"),
        nested(record, "prototypeToken", "texture", "src"),
        nested(record, "token", "texture", "src"),
        nested(record, "texture", "src"),
    ]
    for value in candidates:
        if isinstance(value, str) and is_usable_image_path(value):
            return value
    return None


def iter_json_records(value: Any, depth: int = 0) -> Iterable[dict[str, Any]]:
    if depth > 5:
        return
    if isinstance(value, dict):
        yield value
        for child in value.values():
            if isinstance(child, (dict, list)):
                yield from iter_json_records(child, depth + 1)
    elif isinstance(value, list):
        for child in value:
            if isinstance(child, (dict, list)):
                yield from iter_json_records(child, depth + 1)


@dataclass
class Candidate:
    source_type: str
    source: str
    label: str
    score: float
    local_path: str | None = None
    source_page: str | None = None


@dataclass
class Result:
    id: str
    name: str
    status: str
    portrait: str | None
    source_type: str | None = None
    source: str | None = None
    score: float | None = None
    detail: str | None = None


def build_actor_candidates(data_root: Path, pnjs: list[dict[str, Any]], verbose: bool) -> dict[str, Candidate]:
    wanted: dict[str, list[str]] = {str(p["id"]): pnj_names(p) for p in pnjs}
    best: dict[str, Candidate] = {}
    db_roots = [data_root / "worlds", data_root / "modules", data_root / "systems"]
    files_scanned = 0

    def consider(record: dict[str, Any], source_file: Path) -> None:
        name = record.get("name")
        image = actor_image(record)
        if not isinstance(name, str) or not image:
            return
        local = resolve_foundry_asset(data_root, image)
        if not local:
            return
        for pnj_id, names in wanted.items():
            score = max((similarity(name, candidate) for candidate in names), default=0.0)
            if score < 0.985:
                continue
            candidate = Candidate("foundry-actor", image, name, score, str(local), str(source_file))
            if pnj_id not in best or candidate.score > best[pnj_id].score:
                best[pnj_id] = candidate

    for root in db_roots:
        if not root.is_dir():
            continue
        for path in root.rglob("*"):
            if not path.is_file() or path.suffix.lower() not in {".db", ".json", ".jsonl"}:
                continue
            try:
                if path.stat().st_size > 80 * 1024 * 1024:
                    continue
            except OSError:
                continue
            files_scanned += 1
            try:
                if path.suffix.lower() in {".db", ".jsonl"}:
                    with path.open("r", encoding="utf-8", errors="ignore") as handle:
                        for line in handle:
                            line = line.strip()
                            if not line.startswith("{"):
                                continue
                            try:
                                value = json.loads(line)
                            except json.JSONDecodeError:
                                continue
                            if isinstance(value, dict):
                                consider(value, path)
                else:
                    value = json.loads(path.read_text(encoding="utf-8", errors="ignore"))
                    for record in iter_json_records(value):
                        consider(record, path)
            except (OSError, json.JSONDecodeError):
                continue
    if verbose:
        print(f"Foundry: {files_scanned} fichiers de données inspectés, {len(best)} correspondances Actor certaines.")
    return best


def build_filename_candidates(data_root: Path, pnjs: list[dict[str, Any]], existing_ids: set[str], verbose: bool) -> dict[str, Candidate]:
    best: dict[str, Candidate] = {}
    images: list[tuple[Path, str]] = []
    by_stem: dict[str, list[Path]] = {}
    image_count = 0
    for root_name in ("worlds", "modules", "systems", "assets"):
        root = data_root / root_name
        if not root.is_dir():
            continue
        for path in root.rglob("*"):
            if not path.is_file() or path.suffix.lower() not in IMAGE_EXTENSIONS or any(marker in str(path).lower() for marker in IGNORED_IMAGE_MARKERS):
                continue
            image_count += 1
            key = normalize(path.stem.replace("_", " ").replace("-", " "))
            if key:
                images.append((path, key))
                by_stem.setdefault(key, []).append(path)

    # 1) correspondances exactes.
    for pnj in pnjs:
        pnj_id = str(pnj["id"])
        if pnj_id in existing_ids:
            continue
        names = candidate_names(pnj)
        keys = {normalize(name) for name in names if normalize(name)}
        keys.add(normalize(pnj_id.removeprefix("npc_")))
        paths = [path for key in keys for path in by_stem.get(key, [])]
        if not paths:
            continue
        paths.sort(key=lambda path: ("/assets/" not in str(path).replace("\\", "/"), len(str(path))))
        path = paths[0]
        label = path.stem.replace("_", " ").replace("-", " ")
        best[pnj_id] = Candidate("foundry-file", str(path.relative_to(data_root)).replace(os.sep, "/"), label, 1.0, str(path))

    # 2) correspondances locales fortes mais non exactes :
    # "NPC - Warbal Bumblebrasher.webp", "portrait_ameiko_kaijitsu.png", etc.
    # On refuse les noms à un seul mot en fuzzy pour éviter des faux positifs
    # (Geb, Nex, Xin...).
    fuzzy_count = 0
    for pnj in pnjs:
        pnj_id = str(pnj["id"])
        if pnj_id in existing_ids or pnj_id in best:
            continue
        names = [normalize(name) for name in candidate_names(pnj) if normalize(name)]
        multi_names = [name for name in names if len(name.split()) >= 2 and len(name) >= 7]
        if not multi_names:
            continue
        chosen: tuple[float, Path] | None = None
        for path, stem in images:
            score = 0.0
            for name in multi_names:
                if name in stem:
                    score = max(score, 0.995)
                    continue
                tokens = [token for token in name.split() if len(token) >= 3]
                if len(tokens) >= 2 and all(token in stem.split() for token in tokens):
                    score = max(score, 0.985)
                    continue
                ratio = SequenceMatcher(None, name, stem).ratio()
                # Une similarité seule n'est acceptée que si le premier et le
                # dernier token sont présents : cela évite les noms voisins.
                if ratio >= 0.94 and name.split()[0] in stem and name.split()[-1] in stem:
                    score = max(score, ratio)
            if score >= 0.985 and (chosen is None or score > chosen[0]):
                chosen = (score, path)
        if chosen:
            score, path = chosen
            label = path.stem.replace("_", " ").replace("-", " ")
            best[pnj_id] = Candidate("foundry-file-fuzzy", str(path.relative_to(data_root)).replace(os.sep, "/"), label, score, str(path))
            fuzzy_count += 1

    if verbose:
        exact_count = len(best) - fuzzy_count
        print(f"Foundry: {image_count} images indexées par nom, {exact_count} exactes + {fuzzy_count} fortes supplémentaires.")
    return best


def http_json(url: str, timeout: int = 15) -> dict[str, Any]:
    request = urllib.request.Request(url, headers={
        "User-Agent": USER_AGENT,
        "Accept": "application/json, text/javascript, */*;q=0.1",
    })
    with urllib.request.urlopen(request, timeout=timeout) as response:
        if response.status != 200:
            raise RuntimeError(f"HTTP {response.status}")
        return json.loads(response.read().decode("utf-8"))


def http_text(url: str, timeout: int = 15) -> str:
    request = urllib.request.Request(url, headers={
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml",
    })
    with urllib.request.urlopen(request, timeout=timeout) as response:
        if response.status != 200:
            raise RuntimeError(f"HTTP {response.status}")
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read(4 * 1024 * 1024).decode(charset, errors="replace")


def candidate_names(pnj: dict[str, Any]) -> list[str]:
    """Noms susceptibles d'exister dans des sources anglophones."""
    values = pnj_names(pnj)
    replacements = {
        "Papillon de Saphir": "Sapphire Butterfly",
        "Choral le Conquérant": "Choral the Conqueror",
        "Ardax le Cheveu-Blanc": "Ardax White-Hair",
        "Gorm Granmarteau": "Gorm Greathammer",
        "Vieux-Mage Jatembe": "Old-Mage Jatembe",
    }
    name = str(pnj.get("nom") or "")
    if name in replacements:
        values.append(replacements[name])
    if name.startswith("Reine "):
        values.append("Queen " + name[len("Reine "):])
    result: list[str] = []
    seen: set[str] = set()
    for value in values:
        value = value.strip()
        key = normalize(value)
        if value and key and key not in seen:
            seen.add(key)
            result.append(value)
    return result


def file_title_label(title: str) -> str:
    title = re.sub(r"^(?:File|Fichier):", "", title, flags=re.I)
    title = re.sub(r"\.(?:webp|png|jpe?g|gif)$", "", title, flags=re.I)
    title = re.sub(r"\b(?:portrait|character|npc|token|artwork|art)\b", " ", title, flags=re.I)
    return re.sub(r"[_-]+", " ", title).strip()


def mediawiki_image_from_page(page: dict[str, Any], names: list[str], source_type: str) -> Candidate | None:
    if not isinstance(page, dict) or page.get("missing") is not None:
        return None
    title = str(page.get("title") or "")
    score = max((similarity(title, name) for name in names), default=0.0)
    original = page.get("original")
    image = original.get("source") if isinstance(original, dict) else None
    if image and score >= 0.94 and is_usable_image_path(str(image)):
        return Candidate(source_type, str(image), title, score, source_page=page.get("fullurl"))
    return None


def plausible_remote_image(url: str, width: int | None = None, height: int | None = None) -> bool:
    if not is_usable_image_path(url):
        return False
    lowered = urllib.parse.unquote(url).lower()
    if any(marker in lowered for marker in IGNORED_IMAGE_MARKERS):
        return False
    if width is not None and height is not None and (width < 160 or height < 160):
        return False
    return True


def imageinfo_candidates(api: str, source_type: str, titles: list[str], names: list[str], *, page_exact: bool = False) -> list[Candidate]:
    """Résout des titres File:/Fichier: en URLs d'images.

    `page_exact` autorise une image liée à une fiche personnage au nom exact même
    lorsque le nom du fichier est peu descriptif, mais uniquement si elle est
    suffisamment grande et n'a pas l'apparence d'un logo/icône.
    """
    if not titles:
        return []
    # MediaWiki accepte plusieurs titres séparés par | ; on découpe par sécurité.
    found: list[Candidate] = []
    for start in range(0, len(titles), 25):
        batch = titles[start:start + 25]
        params = urllib.parse.urlencode({
            "action": "query", "format": "json", "formatversion": "2", "redirects": "1",
            "prop": "imageinfo|info", "iiprop": "url|size|mime", "inprop": "url",
            "titles": "|".join(batch),
        })
        data = http_json(f"{api}?{params}", timeout=8)
        for page in data.get("query", {}).get("pages", []):
            if not isinstance(page, dict) or page.get("missing") is not None:
                continue
            info = page.get("imageinfo")
            if not isinstance(info, list) or not info or not isinstance(info[0], dict):
                continue
            image = info[0].get("url")
            if not isinstance(image, str):
                continue
            width = info[0].get("width") if isinstance(info[0].get("width"), int) else None
            height = info[0].get("height") if isinstance(info[0].get("height"), int) else None
            if not plausible_remote_image(image, width, height):
                continue
            label = file_title_label(str(page.get("title") or ""))
            score = max((similarity(label, candidate) for candidate in names), default=0.0)
            normalized_label = normalize(label)
            strong_substring = any(
                len(normalize(candidate)) >= 6 and normalize(candidate) in normalized_label
                for candidate in names
            )
            # Une fiche personnage exacte avec UNE image liée plausible peut avoir
            # un nom de fichier opaque. On garde un score prudent et la sélection
            # finale n'acceptera ce cas que s'il n'y a pas d'ambiguïté.
            if strong_substring:
                score = max(score, 0.995)
            elif page_exact:
                score = max(score, 0.955)
            if score < 0.95:
                continue
            found.append(Candidate(
                f"{source_type}-linked-file", image, label, score,
                source_page=page.get("fullurl"),
            ))
    return found


def direct_file_probes(api: str, source_type: str, names: list[str]) -> Candidate | None:
    """Teste quelques conventions de noms de fichiers fréquentes.

    Deux phases évitent d'exploser le nombre de requêtes : nom exact d'abord,
    puis variantes portrait/full-body seulement si nécessaire.
    """
    extensions = ("jpg", "jpeg", "png", "webp")
    names = names[:2]

    def make_titles(suffixes: tuple[str, ...]) -> list[str]:
        titles: list[str] = []
        seen: set[str] = set()
        for name in names:
            for suffix in suffixes:
                base = f"{name}{suffix}".strip()
                for ext in extensions:
                    for ns in ("File", "Fichier"):
                        title = f"{ns}:{base}.{ext}"
                        key = normalize(title)
                        if key not in seen:
                            seen.add(key)
                            titles.append(title)
        return titles

    exact = imageinfo_candidates(api, source_type, make_titles(("",)), names)
    if exact:
        return sorted(exact, key=lambda c: c.score, reverse=True)[0]

    variants = imageinfo_candidates(
        api, source_type,
        make_titles((" portrait", " full-body", " full body", " artwork")),
        names,
    )
    if not variants:
        return None
    return sorted(variants, key=lambda c: c.score, reverse=True)[0]


def linked_page_images(api: str, source_type: str, title: str, names: list[str]) -> Candidate | None:
    """Inspecte les fichiers réellement liés par la fiche personnage."""
    params = urllib.parse.urlencode({
        "action": "query", "format": "json", "formatversion": "2", "redirects": "1",
        "prop": "images|info", "imlimit": "50", "inprop": "url", "titles": title,
    })
    data = http_json(f"{api}?{params}", timeout=8)
    pages = [p for p in data.get("query", {}).get("pages", []) if isinstance(p, dict) and p.get("missing") is None]
    if not pages:
        return None
    page = pages[0]
    page_title = str(page.get("title") or "")
    exact_score = max((similarity(page_title, n) for n in names), default=0.0)
    if exact_score < 0.96:
        return None
    titles = []
    for item in page.get("images", []) if isinstance(page.get("images"), list) else []:
        title_value = item.get("title") if isinstance(item, dict) else None
        if isinstance(title_value, str) and title_value:
            low = title_value.lower()
            if not any(marker in low for marker in IGNORED_IMAGE_MARKERS):
                titles.append(title_value)
    candidates = imageinfo_candidates(api, source_type, titles, names, page_exact=True)
    if not candidates:
        return None
    # Si un fichier porte clairement le nom du PNJ, priorité absolue.
    strong = [c for c in candidates if c.score >= 0.985]
    if strong:
        return sorted(strong, key=lambda c: c.score, reverse=True)[0]
    # Sinon on n'accepte un nom opaque que s'il n'y a qu'une seule image plausible
    # sur la fiche ; cela évite de choisir une carte/couverture au hasard.
    if len(candidates) == 1:
        return candidates[0]
    return None


def mediawiki_file_candidate(api: str, source_type: str, names: list[str]) -> Candidate | None:
    """Cherche directement dans l'espace Fichier d'un MediaWiki."""
    best: Candidate | None = None
    for name in names:
        params = urllib.parse.urlencode({
            "action": "query", "format": "json", "formatversion": "2",
            "generator": "search", "gsrsearch": f'"{name}"', "gsrnamespace": "6", "gsrlimit": "12",
            "prop": "imageinfo|info", "iiprop": "url", "inprop": "url",
        })
        data = http_json(f"{api}?{params}", timeout=8)
        for page in data.get("query", {}).get("pages", []):
            if not isinstance(page, dict):
                continue
            info = page.get("imageinfo")
            if not isinstance(info, list) or not info or not isinstance(info[0], dict):
                continue
            image = info[0].get("url")
            if not isinstance(image, str) or not is_usable_image_path(image):
                continue
            label = file_title_label(str(page.get("title") or ""))
            score = max((similarity(label, candidate) for candidate in names), default=0.0)
            normalized_label = normalize(label)
            strong_substring = any(
                len(normalize(candidate)) >= 6 and normalize(candidate) in normalized_label
                for candidate in names
            )
            if not strong_substring and score < 0.95:
                continue
            candidate = Candidate(
                f"{source_type}-file", image, label,
                max(score, 0.985 if strong_substring else score),
                source_page=page.get("fullurl"),
            )
            if best is None or candidate.score > best.score:
                best = candidate
        if best and best.score >= 0.995:
            break
    return best


def mediawiki_candidate(pnj: dict[str, Any], source_type: str, api: str) -> Candidate | None:
    names = candidate_names(pnj)
    best: Candidate | None = None

    # Lacrypte nomme souvent directement les fichiers d'après le personnage
    # (ex. Fichier:Abstalar Zantus.jpg). C'est le chemin le plus court.
    if source_type == "lacrypte":
        direct = direct_file_probes(api, source_type, names)
        if direct and direct.score >= 0.985:
            return direct
        if direct:
            best = direct

    # 1) fiche exacte / alias. On inspecte d'abord pageimages puis les fichiers
    # réellement liés, particulièrement utile sur Fandom.
    for title in names:
        params = urllib.parse.urlencode({
            "action": "query", "format": "json", "formatversion": "2", "redirects": "1",
            "prop": "pageimages|info", "piprop": "original", "inprop": "url", "titles": title,
        })
        data = http_json(f"{api}?{params}", timeout=8)
        pages = data.get("query", {}).get("pages", [])
        page_exists = False
        for page in pages:
            if isinstance(page, dict) and page.get("missing") is None:
                page_exists = True
            candidate = mediawiki_image_from_page(page, names, source_type)
            if candidate and (best is None or candidate.score > best.score):
                best = candidate
        if best and best.score >= 0.995:
            return best

        if page_exists:
            try:
                linked = linked_page_images(api, source_type, title, names)
            except Exception:
                linked = None
            if linked and (best is None or linked.score > best.score):
                best = linked
            if best and best.score >= 0.995:
                return best

    # Sur les autres MediaWiki, essayer maintenant les conventions de fichier.
    if source_type != "lacrypte":
        direct = direct_file_probes(api, source_type, names)
        if direct and (best is None or direct.score > best.score):
            best = direct
        if best and best.score >= 0.995:
            return best

    # 2) recherche de page stricte.
    for query in names[:3]:
        params = urllib.parse.urlencode({
            "action": "query", "format": "json", "formatversion": "2",
            "generator": "search", "gsrsearch": f'"{query}"', "gsrnamespace": "0", "gsrlimit": "6",
            "prop": "pageimages|info", "piprop": "original", "inprop": "url",
        })
        data = http_json(f"{api}?{params}", timeout=8)
        for page in data.get("query", {}).get("pages", []):
            candidate = mediawiki_image_from_page(page, names, source_type)
            if candidate and candidate.score >= 0.97 and (best is None or candidate.score > best.score):
                best = candidate
            page_title = str(page.get("title") or "") if isinstance(page, dict) else ""
            if page_title and max((similarity(page_title, n) for n in names), default=0) >= 0.97:
                try:
                    linked = linked_page_images(api, source_type, page_title, names)
                except Exception:
                    linked = None
                if linked and (best is None or linked.score > best.score):
                    best = linked

    # 3) recherche dans l'espace Fichier, dernière chance.
    file_candidate = mediawiki_file_candidate(api, source_type, names)
    if file_candidate and (best is None or file_candidate.score > best.score):
        best = file_candidate
    return best


def html_meta_map(document: str) -> dict[str, str]:
    result: dict[str, str] = {}
    for tag in re.findall(r"<meta\b[^>]*>", document, flags=re.I):
        attrs: dict[str, str] = {}
        pattern = r"([:\w-]+)\s*=\s*([\"'])(.*?)\2"
        for key, _quote, value in re.findall(pattern, tag, flags=re.I | re.S):
            attrs[key.lower()] = html.unescape(value.strip())
        prop = attrs.get("property") or attrs.get("name")
        content = attrs.get("content")
        if prop and content:
            result[prop.lower()] = content
    return result


def html_page_candidate(pnj: dict[str, Any], source_type: str, base: str) -> Candidate | None:
    names = candidate_names(pnj)
    for name in names[:5]:
        path = urllib.parse.quote(name.replace(" ", "_"), safe="()'!,-_")
        url = f"{base.rstrip('/')}/{path}"
        try:
            document = http_text(url)
        except Exception:
            continue
        meta = html_meta_map(document)
        title = re.sub(r"\s*\|.*$", "", meta.get("og:title", name)).strip()
        image = meta.get("og:image") or meta.get("twitter:image")
        score = max((similarity(title, candidate) for candidate in names), default=0.0)
        if image and score >= 0.94 and is_usable_image_path(image):
            return Candidate(f"{source_type}-html", image, title, score, source_page=url)
    return None


def online_candidate(
    pnj: dict[str, Any],
    disabled: set[str] | None = None,
    provider_failures: dict[str, int] | None = None,
    verbose: bool = False,
) -> tuple[Candidate | None, list[str]]:
    disabled = disabled if disabled is not None else set()
    provider_failures = provider_failures if provider_failures is not None else {}
    errors: list[str] = []
    for source_type, api in MEDIAWIKI_SOURCES:
        if source_type in disabled:
            continue
        if verbose:
            print(f"    ↳ {source_type}…", flush=True)
        try:
            candidate = mediawiki_candidate(pnj, source_type, api)
            provider_failures[source_type] = 0
            if candidate:
                if verbose:
                    print(f"      trouvé: {candidate.source_type} ({candidate.score:.3f})", flush=True)
                return candidate, errors
            if verbose:
                print("      rien de suffisamment certain", flush=True)
        except urllib.error.HTTPError as error:
            message = f"{source_type}: HTTP {error.code}"
            errors.append(message)
            provider_failures[source_type] = provider_failures.get(source_type, 0) + 1
            # Un endpoint API renvoyant 404/410 est cassé, pas un simple PNJ absent.
            # On le désactive pour le reste du run afin de ne pas perdre des minutes.
            if error.code in {404, 410}:
                disabled.add(source_type)
                errors.append(f"{source_type}: désactivé pour ce run (endpoint indisponible)")
            elif provider_failures[source_type] >= 3:
                disabled.add(source_type)
                errors.append(f"{source_type}: désactivé après 3 erreurs réseau")
            if verbose:
                print(f"      {message}", flush=True)
        except Exception as error:
            errors.append(f"{source_type}: {error}")
            provider_failures[source_type] = provider_failures.get(source_type, 0) + 1
            if provider_failures[source_type] >= 3:
                disabled.add(source_type)
                errors.append(f"{source_type}: désactivé après 3 erreurs")
            if verbose:
                print(f"      erreur: {error}", flush=True)

    # HTML de secours. Sur Fandom, og:image pointe souvent sur l'illustration
    # de la fiche même si l'API pageimages est vide.
    for source_type, base in (
        ("pathfinder-fandom", "https://pathfinder.fandom.com/wiki"),
        ("pathfinderwiki", "https://pathfinderwiki.com/wiki"),
    ):
        if source_type in disabled:
            continue
        try:
            candidate = html_page_candidate(pnj, source_type, base)
            if candidate:
                return candidate, errors
        except Exception as error:
            errors.append(f"{source_type}-html: {error}")
    return None, errors


def legacy_remote_sources(repo: Path) -> dict[str, str]:
    """Récupère toute ancienne URL connue sans la conserver dans le runtime."""
    result = dict(LEGACY_REMOTE_SOURCES)
    data_root = repo / "apps/web-misc/src/pf2-mj/data"
    candidates = [data_root / "pf2_personnages.json"]
    archive = data_root / "archive"
    if archive.is_dir():
        candidates.extend(archive.rglob("pf2_personnages.json"))
    for path in candidates:
        if not path.is_file():
            continue
        try:
            items = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            continue
        if not isinstance(items, list):
            continue
        for item in items:
            if not isinstance(item, dict):
                continue
            item_id = str(item.get("id") or "")
            if not item_id:
                continue
            for key in ("portrait", "image"):
                value = item.get(key)
                if isinstance(value, str) and re.match(r"^https?://", value, re.I):
                    result.setdefault(item_id, value)
    return result


def download_image(url: str, destination: Path, dry_run: bool) -> tuple[Path, int]:
    if dry_run:
        return destination, 0
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "image/*"})
    with urllib.request.urlopen(request, timeout=20) as response:
        content_type = response.headers.get("Content-Type")
        extension = content_extension(content_type, response.geturl())
        if extension is None:
            raise RuntimeError(f"type d'image non reconnu: {content_type or 'inconnu'}")
        target = destination.with_suffix(extension)
        target.parent.mkdir(parents=True, exist_ok=True)
        temporary = target.with_name(f".{target.name}.{os.getpid()}.tmp")
        size = 0
        with temporary.open("wb") as handle:
            while True:
                chunk = response.read(64 * 1024)
                if not chunk:
                    break
                size += len(chunk)
                if size > MAX_IMAGE_BYTES:
                    handle.close()
                    temporary.unlink(missing_ok=True)
                    raise RuntimeError("image > 12 Mo")
                handle.write(chunk)
        temporary.replace(target)
        return target, size


def copy_local_image(source: Path, destination: Path, dry_run: bool) -> Path:
    target = destination.with_suffix(source.suffix.lower())
    if dry_run:
        return target
    target.parent.mkdir(parents=True, exist_ok=True)
    if source.resolve() != target.resolve():
        temporary = target.with_name(f".{target.name}.{os.getpid()}.tmp")
        shutil.copy2(source, temporary)
        temporary.replace(target)
    return target


def existing_portrait_file(portrait_root: Path, pnj: dict[str, Any]) -> Path | None:
    portrait = pnj.get("portrait")
    if isinstance(portrait, str):
        match = re.match(r"^assets/l7r/portraits/pnj/([^/]+)$", portrait, re.I)
        if match:
            path = portrait_root / match.group(1)
            if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS:
                return path
    stems = {slug(str(pnj.get("id") or "")), slug(str(pnj.get("nom") or ""))}
    for path in portrait_root.glob("*") if portrait_root.is_dir() else []:
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS and slug(path.stem) in stems:
            return path
    return None


def post_api(api_base: str, items: list[dict[str, Any]]) -> None:
    url = f"{api_base.rstrip('/')}/pnj"
    body = json.dumps({"action": "import", "items": items}, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(url, data=body, method="POST", headers={"Content-Type": "application/json", "User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=20) as response:
        if response.status < 200 or response.status >= 300:
            raise RuntimeError(f"API PF2-MJ HTTP {response.status}")
        response.read()


def main() -> int:
    parser = argparse.ArgumentParser(description="Centralise tous les portraits PNJ dans Foundry.")
    parser.add_argument("--repo", default=".", help="Racine de lsr-nestjs-backend (défaut: répertoire courant)")
    parser.add_argument("--foundry-assets-root", help="Dossier Foundry assets/l7r ; sinon FOUNDRY_ASSETS_ROOT ou ~/FoundryVTT/Data/assets/l7r")
    parser.add_argument("--foundry-data-root", help="Dossier Foundry Data ; déduit automatiquement si omis")
    parser.add_argument("--api-base", default="http://127.0.0.1:3333/api/pf2-mj", help="API locale utilisée pour resynchroniser SQLite")
    parser.add_argument("--no-api", action="store_true", help="Ne pas pousser les PNJ vers l'API après modification")
    parser.add_argument("--online", action="store_true", help="Autorise la recherche/téléchargement externe (sources historiques + MediaWiki/Fandom)")
    parser.add_argument("--no-wiki", action="store_true", help="Avec --online, désactive PathfinderWiki (compatibilité ancienne option)")
    parser.add_argument("--no-fandom", action="store_true", help="Avec --online, désactive Pathfinder Wiki sur Fandom")
    parser.add_argument("--no-lacrypte", action="store_true", help="Avec --online, désactive Wiki Pathfinder Lacrypte")
    parser.add_argument("--apply", action="store_true", help="Écrit réellement les portraits et les données ; sinon dry-run")
    parser.add_argument("--verbose", action="store_true")
    parser.add_argument("--limit", type=int, default=0, help="Limite le nombre de PNJ traités (0 = tous)")
    parser.add_argument("--only", action="append", default=[], help="Traite seulement un PNJ (nom ou id). Répétable.")
    args = parser.parse_args()

    repo = Path(args.repo).expanduser().resolve()
    data_file = repo / "apps/web-misc/src/pf2-mj/data/pf2_personnages.json"
    if not data_file.is_file():
        print(f"ERREUR: {data_file} introuvable", file=sys.stderr)
        return 2

    assets_root = detect_foundry_assets_root(repo, args.foundry_assets_root)
    data_root = foundry_data_root(assets_root, args.foundry_data_root)
    portrait_root = assets_root / "portraits" / "pnj"
    pnjs: list[dict[str, Any]] = json.loads(data_file.read_text(encoding="utf-8"))
    if args.only:
        wanted = {normalize(value) for value in args.only}
        pnjs = [p for p in pnjs if normalize(str(p.get("id") or "")) in wanted or normalize(str(p.get("nom") or "")) in wanted]
        if not pnjs:
            print("ERREUR: aucun PNJ ne correspond à --only", file=sys.stderr)
            return 2
    if args.limit > 0:
        pnjs = pnjs[: args.limit]

    print(f"Repo            : {repo}", flush=True)
    print(f"Foundry Data    : {data_root}", flush=True)
    print(f"Portraits cible : {portrait_root}", flush=True)
    print(f"PNJ             : {len(pnjs)}", flush=True)
    print(f"Mode            : {'APPLY' if args.apply else 'DRY-RUN'}{' + ONLINE' if args.online else ''}", flush=True)

    # On commence toujours par les assets Foundry existants.
    actor_candidates = build_actor_candidates(data_root, pnjs, args.verbose) if data_root.is_dir() else {}
    file_candidates = build_filename_candidates(data_root, pnjs, set(actor_candidates), args.verbose) if data_root.is_dir() else {}
    legacy_sources = legacy_remote_sources(repo)
    disabled_online_sources: set[str] = set()
    provider_failures: dict[str, int] = {}
    if args.no_wiki:
        disabled_online_sources.add("pathfinderwiki")
    if args.no_fandom:
        disabled_online_sources.add("pathfinder-fandom")
    if args.no_lacrypte:
        disabled_online_sources.add("lacrypte")

    results: list[Result] = []
    changed = False
    for index, pnj in enumerate(pnjs, 1):
        pnj_id = str(pnj.get("id") or slug(str(pnj.get("nom") or "pnj")))
        name = str(pnj.get("nom") or pnj_id)
        destination = portrait_root / canonical_filename(pnj, ".webp")
        existing = existing_portrait_file(portrait_root, pnj)
        candidate: Candidate | None = None

        try:
            if existing:
                target = existing
                result = Result(pnj_id, name, "existing", f"{FOUNDRY_PREFIX}/{target.name}", "foundry-portrait", str(target), 1.0)
            else:
                candidate = actor_candidates.get(pnj_id) or file_candidates.get(pnj_id)
                if candidate and candidate.local_path:
                    target = copy_local_image(Path(candidate.local_path), destination, not args.apply)
                    result = Result(pnj_id, name, "copied" if args.apply else "would-copy", f"{FOUNDRY_PREFIX}/{target.name}", candidate.source_type, candidate.source, candidate.score, candidate.source_page)
                elif args.online:
                    online_errors: list[str] = []
                    result = None
                    source = legacy_sources.get(pnj_id)
                    if source:
                        try:
                            target, _ = download_image(source, destination, not args.apply)
                            result = Result(pnj_id, name, "downloaded" if args.apply else "would-download", f"{FOUNDRY_PREFIX}/{target.name}", "legacy-url", source, 1.0)
                        except (OSError, urllib.error.URLError, urllib.error.HTTPError, RuntimeError, ValueError) as error:
                            online_errors.append(f"source historique: {error}")
                    if result is None:
                        try:
                            candidate, provider_errors = online_candidate(pnj, disabled_online_sources, provider_failures, args.verbose)
                            online_errors.extend(provider_errors)
                            if candidate:
                                target, _ = download_image(candidate.source, destination, not args.apply)
                                result = Result(pnj_id, name, "downloaded" if args.apply else "would-download", f"{FOUNDRY_PREFIX}/{target.name}", candidate.source_type, candidate.source, candidate.score, candidate.source_page)
                        except (OSError, urllib.error.URLError, urllib.error.HTTPError, RuntimeError, ValueError, json.JSONDecodeError) as error:
                            online_errors.append(f"recherche externe: {error}")
                    if result is None:
                        result = Result(pnj_id, name, "missing", None, detail=" ; ".join(online_errors) or "Aucune correspondance certaine")
                else:
                    result = Result(pnj_id, name, "missing", None, detail="Aucun portrait Foundry local ; relancer avec --online pour chercher davantage")
        except (OSError, urllib.error.URLError, urllib.error.HTTPError, RuntimeError, ValueError, json.JSONDecodeError) as error:
            result = Result(pnj_id, name, "error", None, candidate.source_type if candidate else None, candidate.source if candidate else None, candidate.score if candidate else None, str(error))

        results.append(result)
        if result.portrait:
            if pnj.get("portrait") != result.portrait or "image" in pnj:
                changed = True
            pnj["portrait"] = result.portrait
        elif isinstance(pnj.get("portrait"), str) and re.match(r"^https?://", pnj["portrait"], re.I):
            pnj.pop("portrait", None)
            changed = True
        if "image" in pnj:
            pnj.pop("image", None)
            changed = True

        if args.verbose or result.status not in {"existing", "missing"}:
            line = f"[{index:03}/{len(pnjs):03}] {name}: {result.status}" + (f" <- {result.source_type}" if result.source_type else "")
            if args.verbose and result.detail:
                line += f" | {result.detail[:500]}"
            print(line, flush=True)
        if args.online and result.status in {"would-download", "downloaded", "missing"}:
            time.sleep(0.18)

    report = {
        "schemaVersion": 1,
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "foundryAssetsRoot": str(assets_root),
        "foundryPortraitRoot": str(portrait_root),
        "dryRun": not args.apply,
        "online": args.online,
        "summary": {},
        "disabledProviders": sorted(disabled_online_sources),
        "items": [asdict(result) for result in results],
    }
    summary: dict[str, int] = {}
    for result in results:
        summary[result.status] = summary.get(result.status, 0) + 1
    report["summary"] = summary

    report_path = repo / "portrait-sync-report.json"
    if args.apply:
        portrait_root.mkdir(parents=True, exist_ok=True)
        if changed:
            # Si --limit est utilisé, on ne doit pas tronquer le référentiel : on
            # réinjecte seulement les PNJ traités dans le document complet.
            full: list[dict[str, Any]] = json.loads(data_file.read_text(encoding="utf-8"))
            by_id = {str(item.get("id")): item for item in pnjs}
            merged = []
            for item in full:
                current = by_id.get(str(item.get("id")), item)
                current.pop("image", None)
                if isinstance(current.get("portrait"), str) and re.match(r"^https?://", current["portrait"], re.I):
                    current.pop("portrait", None)
                merged.append(current)
            data_file.write_text(json.dumps(merged, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            pnjs_for_api = merged
        else:
            pnjs_for_api = json.loads(data_file.read_text(encoding="utf-8"))
        report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

        if not args.no_api:
            try:
                post_api(args.api_base, pnjs_for_api)
                print(f"SQLite/API      : synchronisée via {args.api_base}")
            except Exception as error:  # l'absence d'API ne doit pas annuler les fichiers déjà sûrs
                print(f"ATTENTION API   : {error}")
                print("Les fichiers et le JSON sont à jour, mais relance le script quand api-jdr est disponible ou importe le JSON via l'interface.")
    else:
        print("Dry-run : aucun fichier ni JSON n'a été modifié.")

    print("Résumé          : " + " · ".join(f"{key}={value}" for key, value in sorted(summary.items())))
    if args.apply:
        print(f"Rapport         : {report_path}")
    return 0 if not summary.get("error") else 1


if __name__ == "__main__":
    raise SystemExit(main())
