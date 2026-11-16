#!/usr/bin/env python3
"""Generate a separate river graph from the original GeoPackage (CC BY-NC-SA 4.0).
Width is a cartographic proxy, NOT evidence of navigability.
Known navigable systems retain their narrower connecting segments.
"""
import argparse
import json
import math
import runpy
import sqlite3
from pathlib import Path

grid = runpy.run_path(str(Path(__file__).with_name("generate-golarion-travel-grid.py")))
KNOWN = {"Andoshen River", "River Foam", "Profit's Flow"}
# Narrow but explicitly continuous segments in known systems.
CONNECTORS = {1527, 1530}
def km(a, b):
    return math.hypot((b[0]-a[0])*111.2*math.cos(math.radians((a[1]+b[1])/2)), (b[1]-a[1])*111.2)

def sample(line):
    if len(line) < 2:
        return []
    # Keep vertices at ~4 km intervals, including every original endpoint.
    result = [line[0]]
    for a, b in zip(line, line[1:]):
        count = max(1, math.ceil(km(a, b)/4))
        for k in range(1, count+1):
            p = tuple(a[i]+(b[i]-a[i])*k/count for i in range(2))
            if km(result[-1], p) >= 3 or k == count and b == line[-1]:
                result.append(p)
    return [[round(x, 5), round(y, 5)] for x, y in result]

def generate(source, output):
    c = sqlite3.connect(source.resolve().as_uri() + "?mode=ro", uri=True)
    paths=[]
    for fid, name, width, blob in c.execute("select fid,labels,width,geom from rivers where geom is not null order by fid"):
        if blob[3] & 16 or not (name in KNOWN or fid in CONNECTORS or (width or 0) >= (1000 if name else 1500)):
            continue
        for kind, line in grid["shapes"](grid["geometry"](blob)):
            if kind != 2:
                continue
            chunk=[]
            for p in sample(line):
                if -50 <= p[0] < 20 and -5 < p[1] <= 68:
                    chunk.append(p)
                else:
                    if len(chunk)>1: paths.append(chunk)
                    chunk=[]
            if len(chunk)>1: paths.append(chunk)
    output.write_text(json.dumps({"version":1,"source":"pf-wikis/mapping-data","license":"CC BY-NC-SA 4.0","paths":paths},separators=(",",":"))+"\n")
    print(len(paths),sum(len(p) for p in paths),"vertices",output.stat().st_size,"bytes")

if __name__ == "__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("source",type=Path)
    parser.add_argument("output",type=Path)
    args=parser.parse_args()
    generate(args.source,args.output)
