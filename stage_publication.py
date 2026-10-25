"""Stage only the reviewed release archive in the separate, cloned public repository."""
import hashlib,json,zipfile
from pathlib import Path,PurePosixPath

ROOT=Path(__file__).resolve().parent
stage=(ROOT/'submission/publish').resolve()
assert stage.is_relative_to((ROOT/'submission').resolve())
assert (stage/'.git').is_dir(),'Clone the public NapQuest repository into submission/publish first.'
manifest=json.loads((ROOT/'submission/release-manifest.json').read_text())
archive=ROOT/'submission'/manifest['archive']
assert hashlib.sha256(archive.read_bytes()).hexdigest()==manifest['sha256']
expected={row['path']:row for row in manifest['files']}
omit={'submission/READINESS.md','submission/DEV-BODY.md','submission/public-media.json'}
count=0
with zipfile.ZipFile(archive) as package:
    for entry in package.infolist():
        parts=PurePosixPath(entry.filename).parts
        assert parts[0]=='napquest' and '..' not in parts
        relative=PurePosixPath(*parts[1:]).as_posix()
        if relative in omit:continue
        data=package.read(entry)
        assert hashlib.sha256(data).hexdigest()==expected[relative]['sha256'],relative
        target=(stage/relative).resolve()
        assert target.is_relative_to(stage) and '.git' not in target.relative_to(stage).parts
        target.parent.mkdir(parents=True,exist_ok=True)
        target.write_bytes(data)
        assert hashlib.sha256(target.read_bytes()).hexdigest()==expected[relative]['sha256']
        count+=1
print(f'Staged and hash-verified {count} reviewed files. Private handoff notes are omitted; the parent checkout is not used for publication.')
