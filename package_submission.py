"""Build a reviewable, allowlisted NapQuest source archive. Never includes player saves or caches."""
import hashlib, json, re, zipfile
from pathlib import Path

ROOT=Path(__file__).resolve().parent
OUT=ROOT/'submission';OUT.mkdir(exist_ok=True)
files=[p for p in ROOT.iterdir() if p.is_file() and (p.suffix in {'.py','.ps1','.mjs','.md','.txt'} or p.name in {'.gitignore','LICENSE'})]
files.extend(p for p in (ROOT/'web').rglob('*') if p.is_file() and p.suffix.lower() in {'.js','.json','.html','.css','.svg','.png','.mp3','.webp','.jpg'})
files.extend(p for p in (OUT/'media').glob('*') if p.is_file() and p.suffix in {'.png','.gif','.mp4','.json'})
files.extend(p for p in OUT.glob('*') if p.is_file() and (p.suffix in {'.md','.py'} or p.name in {'node-tests.txt','home-level-five-run.txt','browser-laya-result.txt','browser-siege-result.txt','public-media.json'}))
for name in ['home-project-five-level-replay.json','laya-agent-capabilities-real.json','world-goal-decisions.json']:
    path=ROOT/'evidence'/name
    if path.is_file():files.append(path)
files=sorted(set(files))
patterns=[re.compile(r'gh[pousr]_[A-Za-z0-9]{30,}'),re.compile(r'github_pat_[A-Za-z0-9_]{30,}'),re.compile(r'sk-[A-Za-z0-9_-]{24,}'),re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----')]
manifest=[]
for path in files:
    relative=path.relative_to(ROOT).as_posix()
    assert not any(part in {'.env','.venv','.cache','.git','.tools','frames'} for part in path.relative_to(ROOT).parts),relative
    data=path.read_bytes()
    if path.suffix not in {'.png','.gif','.mp4','.mp3','.webp','.jpg'}:
        content=data.decode('utf-8')
        if any(pattern.search(content) for pattern in patterns):raise ValueError(f'Credential-like content in {relative}; archive not written.')
        if re.search(r'C:[/\\]+Users[/\\]+',content):raise ValueError(f'Private absolute path in {relative}; archive not written.')
    manifest.append({'path':relative,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
archive=OUT/'napquest-submission-source.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as package:
    for path in files:package.write(path,Path('napquest')/path.relative_to(ROOT))
with zipfile.ZipFile(archive) as package:
    assert package.testzip() is None
    assert len(package.namelist())==len(manifest)
(OUT/'release-manifest.json').write_text(json.dumps({'archive':archive.name,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'files':manifest},indent=2))
print(f'Packaged and re-read {len(files)} allowlisted files ({archive.stat().st_size:,} bytes). Known credential scan clean; caches and player saves excluded by allowlist.')
