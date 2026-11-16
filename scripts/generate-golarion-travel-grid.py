#!/usr/bin/env python3
"""Generate the coarse travel mesh from the original GIS, without copying source geometry.
Requires Pillow (pip install Pillow). Reads GPKG only, writes generated JSON.
Source: pf-wikis/mapping-data, via pf-wikis/mapping (CC BY-NC-SA 4.0).
"""
import argparse
import collections
import hashlib
import json
import math
import sqlite3
import struct
from pathlib import Path
from PIL import Image, ImageDraw

WEST, NORTH, STEP, WIDTH, HEIGHT = -50, 68, 0.1, 700, 730
SCALE = 4
SIZE = (WIDTH * SCALE, HEIGHT * SCALE)

def geometry(blob):
    # GPKG header: magic, version, flags, SRID, optional envelope, then WKB.
    envelope = (0, 32, 48, 48, 64)[(blob[3] >> 1) & 7]
    offset = 8 + envelope
    def read(i):
        order = '<' if blob[i] else '>'
        kind, = struct.unpack_from(order + 'I', blob, i + 1)
        i += 5
        def uint():
            nonlocal i
            n, = struct.unpack_from(order + 'I', blob, i)
            i += 4
            return n
        def points():
            nonlocal i
            n = uint()
            p = list(struct.iter_unpack(order + 'dd', blob[i:i+n*16]))
            i += n * 16
            return p
        if kind == 2:
            return (2, points()), i
        if kind == 3:
            return (3, [points() for _ in range(uint())]), i
        if kind in (5, 6, 7):
            children = []
            for _ in range(uint()):
                child, i = read(i)
                children.append(child)
            return (kind, children), i
        raise ValueError(f'Unsupported WKB geometry: {kind}')
    return read(offset)[0]

def pixel(p):
    return ((p[0] - WEST) / STEP * SCALE, (NORTH - p[1]) / STEP * SCALE)

def shapes(item):
    kind, content = item
    if kind in (2, 3):
        yield kind, content
    else:
        for child in content:
            yield from shapes(child)

def mask(connection, table, line=False):
    image = Image.new('1', SIZE)
    draw = ImageDraw.Draw(image)
    for (blob,) in connection.execute(f'SELECT geom FROM {table} WHERE geom IS NOT NULL'):
        if blob[3] & 16:
            continue
        for kind, content in shapes(geometry(blob)):
            if kind == 3 and content:
                draw.polygon([pixel(p) for p in content[0]], fill=1)
                for hole in content[1:]:
                    draw.polygon([pixel(p) for p in hole], fill=0)
            elif kind == 2 and line and len(content) > 1:
                draw.line([pixel(p) for p in content], fill=1, width=SCALE + 1)
    # Pixel centers, not arbitrary corners: the mesh intentionally approximates small features.
    return image.convert('L').resize((WIDTH, HEIGHT), resample=Image.Resampling.NEAREST).tobytes()

def generate(source, output):
    connection = sqlite3.connect(source.resolve().as_uri() + '?mode=ro', uri=True)
    land, water = mask(connection, 'land'), mask(connection, 'waters')
    cells = bytearray(1 if l and not w else 5 for l, w in zip(land, water))
    for table, value in [('forests', 2), ('hills', 2), ('deserts', 2), ('swamps', 3), ('mountains', 3), ('ice', 3), ('roads', 4)]:
        print('Rasterizing', table, flush=True)
        layer = mask(connection, table, table == 'roads')
        for i, present in enumerate(layer):
            if present and 1 <= cells[i] <= 4:
                cells[i] = max(cells[i], value)
    # Marine water must connect to the outside of the mesh. Disconnected lakes stay 5.
    todo = collections.deque()
    def ocean(i):
        if cells[i] == 5:
            cells[i] = 0
            todo.append(i)
    for x in range(WIDTH):
        ocean(x)
        ocean((HEIGHT - 1) * WIDTH + x)
    for y in range(HEIGHT):
        ocean(y * WIDTH)
        ocean(y * WIDTH + WIDTH - 1)
    while todo:
        i = todo.popleft()
        x, y = i % WIDTH, i // WIDTH
        if x: ocean(i - 1)
        if x + 1 < WIDTH: ocean(i + 1)
        if y: ocean(i - WIDTH)
        if y + 1 < HEIGHT: ocean(i + WIDTH)
    # RLE rows (count, value). Small, human-inspectable artifact bundled at build time.
    rows = []
    for y in range(HEIGHT):
        row = cells[y*WIDTH:(y+1)*WIDTH]
        runs = []
        for value in row:
            if runs and runs[-1] == value:
                runs[-2] += 1
            else:
                runs.extend([1, value])
        rows.append(runs)
    result = dict(version=1, west=WEST, north=NORTH, step=STEP, width=WIDTH, height=HEIGHT,
                  source='pf-wikis/mapping-data', license='CC BY-NC-SA 4.0',
                  sha256=hashlib.sha256(source.read_bytes()).hexdigest(), rows=rows)
    output.write_text(json.dumps(result, separators=(',', ':')) + '\n')
    print(collections.Counter(cells), 'bytes', output.stat().st_size)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('source', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    generate(args.source, args.output)
