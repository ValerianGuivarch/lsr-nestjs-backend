#!/usr/bin/env python3
import argparse
import asyncio
import json
import re
import shutil
from pathlib import Path
from urllib.parse import urlparse

try:
    from playwright.async_api import async_playwright
except ImportError:
    raise SystemExit(
        "Playwright n'est pas installé.\n"
        "Installe-le avec:\n"
        "  python3 -m pip install playwright\n"
        "  python3 -m playwright install chromium"
    )

def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--data", required=True, help="Chemin vers pf2_personnages.json")
    p.add_argument("--limit", type=int, default=0, help="Nombre max de portraits à traiter (0=tous)")
    p.add_argument("--apply", action="store_true", help="Met à jour le JSON et télécharge les images")
    p.add_argument(
        "--portraits-dir",
        default=None,
        help="Dossier physique où enregistrer les portraits si --apply",
    )
    p.add_argument(
        "--report",
        default=None,
        help="Chemin du rapport JSON (par défaut: data/portrait-search-report.json)",
    )
    p.add_argument(
        "--headful",
        action="store_true",
        help="Affiche Chromium pendant la recherche (utile pour déboguer)",
    )
    return p.parse_args()

def slugify(name: str) -> str:
    s = name.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-") or "portrait"

def load_people(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))

def save_people(path: Path, data):
    backup = path.with_suffix(path.suffix + ".bak")
    if not backup.exists():
        shutil.copy2(path, backup)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

def get_name(person):
    for key in ("nom", "name", "label"):
        v = person.get(key)
        if isinstance(v, str) and v.strip():
            return v.strip()
    return "Sans nom"

def has_portrait(person):
    v = person.get("portrait")
    return isinstance(v, str) and v.strip()

async def first_bing_image(page, name: str):
    query = f'{name} PF2 Pathfinder'
    url = "https://www.bing.com/images/search?q=" + query.replace(" ", "+")
    await page.goto(url, wait_until="domcontentloaded", timeout=30000)
    await page.wait_for_timeout(1800)

    # Consent banners, if present.
    for selector in [
        'button:has-text("Accept")',
        'button:has-text("Accepter")',
        '#bnp_btn_accept',
    ]:
        try:
            el = page.locator(selector).first
            if await el.count():
                await el.click(timeout=1000)
                await page.wait_for_timeout(500)
                break
        except Exception:
            pass

    # Bing image result cards commonly store original image URL in JSON metadata ("m").
    cards = page.locator("a.iusc")
    count = await cards.count()
    for i in range(min(count, 25)):
        card = cards.nth(i)
        raw = await card.get_attribute("m")
        if not raw:
            continue
        try:
            meta = json.loads(raw)
        except Exception:
            continue

        # murl = original image URL, turl = thumbnail.
        for key in ("murl", "turl"):
            image_url = meta.get(key)
            if isinstance(image_url, str) and image_url.startswith(("http://", "https://")):
                return {
                    "query": query,
                    "image_url": image_url,
                    "source_page": meta.get("purl"),
                    "title": meta.get("t"),
                    "position": i + 1,
                }

    return {
        "query": query,
        "image_url": None,
        "source_page": None,
        "title": None,
        "position": None,
    }

async def download_image(context, image_url: str, destination: Path):
    response = await context.request.get(image_url, timeout=30000)
    if not response.ok:
        raise RuntimeError(f"HTTP {response.status}")
    body = await response.body()
    content_type = (response.headers.get("content-type") or "").lower()

    ext = ".jpg"
    if "png" in content_type:
        ext = ".png"
    elif "webp" in content_type:
        ext = ".webp"
    elif "gif" in content_type:
        ext = ".gif"
    else:
        path_ext = Path(urlparse(image_url).path).suffix.lower()
        if path_ext in (".jpg", ".jpeg", ".png", ".webp", ".gif"):
            ext = ".jpg" if path_ext == ".jpeg" else path_ext

    destination = destination.with_suffix(ext)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(body)
    return destination

async def main():
    args = parse_args()
    data_path = Path(args.data).expanduser().resolve()
    data = load_people(data_path)

    if not isinstance(data, list):
        raise SystemExit("Le JSON attendu doit être une liste de personnages.")

    missing = [(idx, p) for idx, p in enumerate(data) if not has_portrait(p)]
    if args.limit and args.limit > 0:
        missing = missing[:args.limit]

    print(f"{len(data)} personnages au total; {len(missing)} portraits à traiter.")

    report_path = (
        Path(args.report).expanduser().resolve()
        if args.report
        else Path.cwd() / "data" / "portrait-search-report.json"
    )
    report_path.parent.mkdir(parents=True, exist_ok=True)

    portraits_dir = Path(args.portraits_dir).expanduser().resolve() if args.portraits_dir else None
    if args.apply and portraits_dir is None:
        raise SystemExit("--apply nécessite --portraits-dir.")

    report = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=not args.headful)
        context = await browser.new_context(
            locale="fr-FR",
            viewport={"width": 1440, "height": 1000},
        )
        page = await context.new_page()

        for pos, (idx, person) in enumerate(missing, 1):
            name = get_name(person)
            print(f"[{pos}/{len(missing)}] {name}")
            item = {"name": name}

            try:
                found = await first_bing_image(page, name)
                item.update(found)

                if found["image_url"]:
                    print(f"  -> {found['image_url']}")
                else:
                    print("  -> aucun résultat exploitable")
                    report.append(item)
                    continue

                if args.apply:
                    base = portraits_dir / slugify(name)
                    saved = await download_image(context, found["image_url"], base)
                    rel = f"assets/l7r/portraits/pnj/{saved.name}"
                    person["portrait"] = rel
                    item["saved_to"] = str(saved)
                    item["portrait"] = rel

            except Exception as e:
                item["error"] = f"{type(e).__name__}: {e}"
                print(f"  !! {item['error']}")

            report.append(item)
            await page.wait_for_timeout(350)

        await browser.close()

    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Rapport: {report_path}")

    if args.apply:
        save_people(data_path, data)
        print(f"JSON mis à jour: {data_path}")

    ok = sum(1 for r in report if r.get("image_url") and not r.get("error"))
    errors = sum(1 for r in report if r.get("error"))
    print(f"Terminé: {ok} OK, {errors} erreur(s).")

if __name__ == "__main__":
    asyncio.run(main())
