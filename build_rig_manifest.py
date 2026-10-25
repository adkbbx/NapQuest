"""Measure cutout atlas cells without altering the generated PNGs. Requires Pillow."""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).parent / 'web' / 'assets'
manifest = {}
for name in ('goose', 'bee', 'fox', 'mallow'):
    image = Image.open(ROOT / f'{name}-parts.png')
    alpha = image.getchannel('A')
    boxes = []
    for row in range(2):
        for col in range(3):
            cell = (col * 512, row * 512, (col + 1) * 512, (row + 1) * 512)
            box = alpha.crop(cell).point(lambda v: 255 if v > 180 else 0).getbbox()
            boxes.append([box[0] + cell[0], box[1] + cell[1], box[2] - box[0], box[3] - box[1]])
    # This generated torso crosses the cell boundary. Its head remains separate.
    if name == 'goose':
        boxes[0] = [37, 145, 560, 344]
        boxes[1] = [706, 46, 310, 444]
    # The head touches the next cell. Measuring that whole cell includes a
    # sliver of the head and shifts the arm's apparent shoulder by ~40px.
    if name == 'mallow':
        boxes[1] = [565, 74, 490, 400]
        boxes[2] = [1230, 40, 245, 462]
    manifest[name] = {'file': f'{name}-parts.png', 'width': image.width, 'height': image.height, 'boxes': boxes}
(ROOT / 'rig-atlases.json').write_text(json.dumps(manifest, indent=2))
(ROOT.parent / 'rig-data.js').write_text('export const atlases = ' + json.dumps(manifest) + ';\n')
print('Measured 24 cutout parts across four generated atlases. Originals preserved.')
