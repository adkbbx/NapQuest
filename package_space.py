"""Create a reviewable four-file Space upload, excluding credentials and player saves."""
import hashlib
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'space-upload'
OUT.mkdir(exist_ok=True)
sources = ['space_runtime.py', 'decisions.py', 'inference.py', 'engine.py', 'LICENSE']
sources += [p.relative_to(ROOT).as_posix() for p in sorted((ROOT / 'web').rglob('*')) if p.is_file()]
with zipfile.ZipFile(OUT / 'runtime.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    for name in sources:
        archive.write(ROOT / name, name)
digest = hashlib.sha256((OUT / 'runtime.zip').read_bytes()).hexdigest()
bootstrap = (ROOT / 'space_app.template.py').read_text().replace('__RUNTIME_SHA256__', digest)
(OUT / 'space_app.py').write_text(bootstrap)
shutil.copyfile(ROOT / 'requirements-space.txt', OUT / 'requirements.txt')
(OUT / 'README.md').write_text('''---
title: NapQuest
emoji: 🦥
colorFrom: green
colorTo: yellow
sdk: gradio
sdk_version: 6.30.0
python_version: 3.12.12
app_file: space_app.py
base_path: /play/
fullWidth: true
license: mit
models:
  - convaiinnovations/laya
---

# NapQuest

[Play NapQuest](https://adkbbx-napquest.hf.space/play/)

Build a woodland village, defend it, or give Mallow a goal and watch Laya work on it.
Your village saves in this browser. Online AI sends your goal and available actions
to Laya on a shared free ZeroGPU worker. GPU calls can queue or reach a visitor's
daily quota. Manual play stays available without AI.

[Source, tests and local version](https://github.com/adkbbx/NapQuest)

Hosting added October 26, 2026, after the Week 3 submission. The original entry
and local model version remain in the GitHub history. The hosted worker uses
PyTorch 2.13.0, a supported ZeroGPU version, and the same pinned Laya checkpoint
and decision rules as the local version.

The runtime archive contains only game code, public art, audio and licenses.
`python package_space.py` rebuilds this upload from the source repository.
''', encoding='utf-8')
print(f'Packaged {len(sources)} public runtime files. SHA256 {digest}')
for path in sorted(OUT.iterdir()):
    print(f'{path.name}: {path.stat().st_size:,} bytes')
