#!/usr/bin/env python3
import argparse, json, os, shutil, sys
from pathlib import Path

HERE=Path(__file__).resolve().parent
PLAN=HERE/'move-plan.json'

def load_plan():
    return json.loads(PLAN.read_text(encoding='utf-8'))['moves']

def resolve_root(raw):
    return Path(os.path.expanduser(raw)).resolve()

def preflight(root,moves):
    errors=[]; already=[]; ready=[]
    for m in moves:
        src=root/m['from']; dst=root/m['to']
        if src.exists() and dst.exists() and src.resolve()!=dst.resolve(): errors.append(f'COLLISION: {dst}')
        elif src.exists(): ready.append((src,dst,m))
        elif dst.exists(): already.append((src,dst,m))
        else: errors.append(f'INTROUVABLE: {src}')
    return errors,already,ready

def main():
    ap=argparse.ArgumentParser(description='Réorganise la bibliothèque PF2 sans renommer les fichiers.')
    ap.add_argument('--root',default='~/services/pf2-data',help='Racine de la bibliothèque PF2')
    ap.add_argument('--apply',action='store_true',help='Effectue réellement les déplacements. Sans cette option: simulation.')
    ap.add_argument('--scaffold',action='store_true',help='Crée aussi les dossiers Documents/Foundry attendus pour le contenu manquant.')
    args=ap.parse_args(); root=resolve_root(args.root); moves=load_plan()
    errors,already,ready=preflight(root,moves)
    print(f'Racine: {root}')
    print(f'Plan: {len(moves)} PDF | à déplacer: {len(ready)} | déjà rangés: {len(already)} | erreurs: {len(errors)}')
    if errors:
        print('\n'.join(errors[:50]),file=sys.stderr)
        print('ABANDON: aucune modification effectuée.',file=sys.stderr); return 2
    for src,dst,m in ready:
        print(f'{src.relative_to(root)}  ->  {dst.relative_to(root)}')
    if not args.apply:
        print('\nSimulation uniquement. Relance avec --apply quand le plan te convient.'); return 0
    log=[]
    try:
        for src,dst,m in ready:
            dst.parent.mkdir(parents=True,exist_ok=True)
            shutil.move(str(src),str(dst)); log.append({'from':m['from'],'to':m['to']})
        # move helper script if it exists
        helper=root/'Campagnes'/'find.sh'
        if helper.exists():
            target=root/'_Outils'/'find.sh'; target.parent.mkdir(parents=True,exist_ok=True)
            if not target.exists(): shutil.move(str(helper),str(target))
        (root/'_reorganisation-log.json').write_text(json.dumps(log,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        print(f'\nOK: {len(log)} fichiers déplacés. Journal: {root / "_reorganisation-log.json"}')
    except Exception as exc:
        print(f'ERREUR après {len(log)} déplacements: {exc}',file=sys.stderr)
        print('Le journal partiel est enregistré pour permettre une remise en place manuelle.',file=sys.stderr)
        (root/'_reorganisation-log-partiel.json').write_text(json.dumps(log,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        return 1
    if args.scaffold:
        exp=HERE/'apps/web-misc/src/pf2-mj/data/resource-expectations.json'
        if exp.exists():
            data=json.loads(exp.read_text(encoding='utf-8'))
            dirs=set()
            for d in data.get('missingCoreDocuments',[]): dirs.add(d['folder'])
            for d in data.get('missingFrenchTranslations',[]): dirs.add(d['folder'])
            for z in data.get('resourceZipTargets',[]): dirs.add(str(Path(z['preferredPath']).parent))
            for d in sorted(dirs): (root/d).mkdir(parents=True,exist_ok=True)
            print(f'Scaffold: {len(dirs)} dossiers attendus créés.')
    return 0
if __name__=='__main__': raise SystemExit(main())
