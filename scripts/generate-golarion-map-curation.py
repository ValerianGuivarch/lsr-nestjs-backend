#!/usr/bin/env python3
"""Refresh the local curation catalogue from the upstream Golarion map checkout.

The upstream assets stay untouched. This script materializes only stable metadata
needed by the PF2 app: source identity, coordinates, display icon and the default
set of label categories hidden from players.
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path


def java_hash(value: str) -> int:
    result = 0
    for char in value:
        result = (31 * result + ord(char)) & 0xFFFFFFFF
    if result >= 2**31:
        result -= 2**32
    return abs(result)


def point_coordinates(geometry: object) -> list[list[float]]:
    if not isinstance(geometry, dict):
        return []
    kind = geometry.get("type")
    coordinates = geometry.get("coordinates")
    if kind == "Point" and isinstance(coordinates, list) and len(coordinates) >= 2:
        return [[float(coordinates[0]), float(coordinates[1])]]
    if kind == "MultiPoint" and isinstance(coordinates, list):
        return [
            [float(value[0]), float(value[1])]
            for value in coordinates
            if isinstance(value, list) and len(value) >= 2
        ]
    return []


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--mapping-root",
        default=os.environ.get("GOLARION_MAP_SOURCE_ROOT", "../golarion-map-build/mapping"),
        help="checkout racine du projet pf-wikis/mapping",
    )
    parser.add_argument(
        "--output-root",
        default="apps/web-golarion-map/resources",
        help="dossier des ressources générées dans le dépôt PF2",
    )
    args = parser.parse_args()

    mapping = Path(args.mapping_root).resolve()
    output = Path(args.output_root).resolve()
    output.mkdir(parents=True, exist_ok=True)

    cities_path = mapping / "sources/cities.geojson"
    locations_path = mapping / "sources/locations.geojson"
    search_path = mapping / "frontend/public/search.json"
    sprites_path = mapping / "tile-compiler/sprites"
    required = [cities_path, locations_path, search_path, sprites_path]
    missing = [str(path) for path in required if not path.exists()]
    if missing:
        raise SystemExit("Ressources Golarion manquantes : " + ", ".join(missing))

    location_sprite_types = {
        path.stem.removeprefix("location-")
        for path in sprites_path.glob("location-*.svg")
    }

    points: list[dict[str, object]] = []
    for source_kind, source_path in (("city", cities_path), ("location", locations_path)):
        data = json.loads(source_path.read_text(encoding="utf-8"))
        for feature in data.get("features", []):
            properties = feature.get("properties") or {}
            label = properties.get("labels") or properties.get("label")
            if not isinstance(label, str) or not label.strip():
                continue
            label = label.strip()
            coordinates = point_coordinates(feature.get("geometry"))
            if not coordinates:
                continue
            source_url = properties.get("link") if isinstance(properties.get("link"), str) else ""
            source_url = source_url.strip()
            source_key = source_url or (
                f"{source_kind}:{label.casefold()}:"
                f"{coordinates[0][0]:.6f},{coordinates[0][1]:.6f}"
            )
            text = properties.get("text") if isinstance(properties.get("text"), str) else ""
            # This is the fid of the ungrouped source feature. The live MJ map can
            # expose a grouped fid at lower zoom levels, so the API also resolves
            # by label/source key rather than treating this hash as durable identity.
            fid = java_hash(
                f'<h3><a href="{source_url}" target="_blank">{label}</a></h3>{text}'
            )

            if source_kind == "city":
                size = properties.get("size")
                icon = {1: "city-large", 2: "city-medium", 3: "city-small"}.get(size, "city-major")
                if properties.get("capital") is True:
                    icon += "-capital"
                min_zoom = {0: 2, 1: 3, 2: 4}.get(size, 4)
                source_type = "city"
            else:
                source_type = str(properties.get("type") or "other")
                icon = (
                    f"location-{source_type}"
                    if source_type in location_sprite_types
                    else "location-other"
                )
                min_zoom = 4

            row: dict[str, object] = {
                "sourceKey": source_key,
                "fid": fid,
                "kind": source_kind,
                "label": label,
                "type": source_type,
                "icon": icon,
                "minZoom": min_zoom,
                "coordinates": coordinates,
            }
            if source_url:
                row["sourceUrl"] = source_url
            points.append(row)

    # A few upstream placeholder URLs are intentionally shared by unrelated
    # points. Only a URL shared by the same label represents one conceptual
    # source; otherwise include the label in our local stable key.
    labels_by_key: dict[str, set[str]] = {}
    for point in points:
        labels_by_key.setdefault(str(point["sourceKey"]), set()).add(str(point["label"]))
    for point in points:
        key = str(point["sourceKey"])
        if len(labels_by_key.get(key, set())) > 1:
            point["sourceKey"] = f"{key}#pf2-map-label={str(point['label']).casefold()}"

    points.sort(key=lambda item: (str(item["label"]).casefold(), str(item["kind"]), str(item["sourceKey"])))
    (output / "map-source-points.json").write_text(
        json.dumps({"schemaVersion": 1, "points": points}, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )

    hidden_categories = {"buildings", "districts", "generic", "specials"}
    search = json.loads(search_path.read_text(encoding="utf-8"))
    # Keep a backend-readable copy of the source search index. The player UI
    # asks the API for a filtered view instead of downloading this full index.
    (output / "map-search-index.json").write_text(
        json.dumps(search, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    hidden_labels = sorted(
        {
            entry["label"]
            for category in search
            if category.get("category") in hidden_categories
            for entry in category.get("entries", [])
            if isinstance(entry.get("label"), str)
        },
        key=str.casefold,
    )
    (output / "map-default-hidden-labels.json").write_text(
        json.dumps(
            {
                "schemaVersion": 1,
                "categories": sorted(hidden_categories),
                "labels": hidden_labels,
            },
            ensure_ascii=False,
            separators=(",", ":"),
        ),
        encoding="utf-8",
    )

    print(
        f"Catalogue PF2 carte : {len(points)} points "
        f"({sum(point['kind'] == 'city' for point in points)} villes, "
        f"{sum(point['kind'] == 'location' for point in points)} POI), "
        f"{len(hidden_labels)} labels masqués par défaut."
    )


if __name__ == "__main__":
    main()
