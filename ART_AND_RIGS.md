# Painted woodland and cutout skeletons

Created on 25 October 2026 using the built-in image-generation tool. All five generated assets are copied into web/assets; the original Mallow PNG remains available. No paid runtime image service is required to play.

| Asset | File | Use |
| --- | --- | --- |
| Woodland | web/assets/woodland-painted.png | One coherent generated map containing matching trees, market, bridge, home, orchard, pond, hammock, and bee workplace. |
| Goose | web/assets/goose-parts.png | Torso, neck/head, wing, two feet, tail. |
| Bee | web/assets/bee-parts.png | Abdomen, head, two wings, legs, badge. |
| Kevin | web/assets/fox-parts.png | Torso, head, tail, arms and leg. |
| Mallow | web/assets/mallow-parts.png | Torso/cape/satchel, head, arms, legs. Original Mallow image supplied as identity reference. |

Every image is 1536 by 1024 pixels. The four atlases have generated alpha transparency. The map is a raster illustration: it is scaled proportionally, never cropped to cover a different aspect ratio. It is not infinitely scalable vector artwork. Interface text remains HTML, and props remain SVG, so those stay sharp independently of the map's source resolution.

## Skeletons

web/rig.js defines a 2D cutout skeleton for each character. Body, head, arms/legs, tail, and wings rotate around explicit pivots. The root supplies leaning and sleeping poses. Leg swing follows actual movement speed; bee wing motion uses the same simulation clock. This is procedural skeletal cutout animation, not 3D bones, mesh skinning, or a claim of generated in-between frames.

The runtime renders original atlas regions through nested SVG viewBoxes. It preserves the source PNGs. A renderer alpha curve reduces the generated translucent halos. One goose torso exceeded its requested grid cell, so its crop and the adjacent head crop are explicitly measured in build_rig_manifest.py.

Run build_rig_manifest.py with a Python environment containing Pillow to regenerate web/rig-data.js and web/assets/rig-atlases.json. Normal gameplay needs neither Pillow nor a build step.

## Generation prompt set

All character requests specified true transparency, isolated parts in a three-column/two-row atlas, no text or labels, and warm painted storybook rendering. The following records the production instructions used, including the layout and visual constraints.

### Goose

Production game asset: a CUTOUT SKELETAL ANIMATION PARTS ATLAS for ONE funny indignant goose, matching a warm hand-painted children's storybook woodland game, soft gouache cream feathers, orange beak/feet, cocoa outlines, similar rendering to a cute sleepy brown sloth with leaf cape. TRUE transparent background. Landscape sheet arranged EXACTLY 3 columns x 2 rows, six equal square cells. Each part isolated centered well inside its cell, no contact between cells, generous empty transparent gutter. No labels, no text, no shadows, no complete assembled goose. All pieces face RIGHT, orthographic side view. Top row left: plump horizontal goose torso alone with no neck/head/wing/legs. Top row middle: complete long curved neck plus expressive angry head and orange beak, neck cut at its base, no body. Top row right: separate oval cream feathered wing, shoulder end on left. Bottom row left: orange left shin and webbed foot, hip end at top. Bottom row middle: matching orange right shin and webbed foot. Bottom row right: cream tail feather fan. Pieces should overlap cleanly at joints when assembled. Keep each piece's long dimension roughly 65 percent of its cell. Game-ready clean alpha edges.

### Bee

Production CUTOUT SKELETAL ANIMATION PARTS ATLAS for a cute bossy honey bee in warm hand-painted gouache children's storybook style, golden ochre stripes cocoa outlines cream highlights, matching woodland sloth adventure. True transparent background. EXACTLY 3 columns by 2 rows equal cells, each independent part centered with wide transparent gutters, no labels/text or shadows. Not an assembled bee. Side view faces right. Top left cell: oval golden black-striped fuzzy abdomen torso with no wings/head/legs. Top middle: separate cheerful round bee head with dark eyes tiny smile and two antennae, head looking right. Top right: single large translucent pale ivory upper wing with fine warm veins. Bottom left: single smaller translucent ivory lower wing. Bottom middle: two dangling dark brown little legs as one independent part. Bottom right: tiny cream employee badge on a green cord, no text except a small honeycomb symbol. Fill each cell at most65percent. Clean alpha silhouette, pieces suitable for overlapping at shoulder/head joints.

### Kevin

Production game CUTOUT skeletal animation parts atlas for Kevin, a cute suspicious red fox, warm gouache children's book art, cocoa outlines, muted terracotta orange fur cream cheeks, same soft painted woodland style as sloth and goose. True transparent background, no shadows. EXACTLY 3 columns by 2 rows equal square cells, each part centered with wide clear gutters, no labels, no text, no assembled character. All facing RIGHT in side three-quarter view. Top row left: pear-shaped sitting torso no head tail or limbs. Top middle: large fox head triangular ears cream muzzle small dark eyes looking right, no neck/body. Top right: broad orange bushy tail cream tip, tail base at left. Bottom left: separate short front arm paw, shoulder at top. Bottom middle: separate short rear leg black paw foot. Bottom right: second front arm paw matching first. Parts fit within65percent of eachcell. Clean alpha edges for bone pivot animation.

### Map

Production 2D woodland game MAP BACKGROUND, high resolution landscape 3:2, exquisite cohesive hand-painted gouache children's storybook art, warm muted sage olive greens terracotta roofs honey parchment paths soft turquoise water cocoa details matching a cute sloth with leaf cape. A single consistent bird's-eye three-quarter overhead perspective throughout, miniature diorama. Every tree, wooden market booth, footbridge, picnic and beehive workplace shares identical brushwork lighting perspective scale. Fully illustrated edge to edge, NO frame, NO text NO labels NO people or animals. Important playable composition: a winding narrow turquoise stream runs vertically in the center at55percent width. ONE wooden plank bridge crosses horizontally at54percent imageheight connecting both banks, clear open paths. Left bank: small cozy hollow-tree sloth home at20percentwidth63percentheight, red-and-cream striped farmer market booth at30percentwidth28percentheight, three apple orchard trees and picnic blanket at38percentwidth78percentheight. Right bank: tiny round duck pond at78percentwidth75percentheight, royal hill with hammock between trees at82percentwidth29percentheight, a charming bee office made from a hollow log and golden hive with tiny outdoor desk and presentation easel at78percentwidth53percentheight. Mushroom clearing at38percentwidth38percentheight. Sandy paths link all landmarks through wide OPEN grass clearings for characters, especially orchard-to-bridge and bridge-to-office. Cluster beautiful coherent rounded oak trees and ferns mainly along perimeter and between paths, don't obscure clearings. Soft afternoon light upperleft, gentle paper grain, rich detail that remains legible as a small map. No duplicated bridges, no nonsensical extra rivers, no gigantic objects, no text.

### Mallow

Use the attached sloth as CHARACTER IDENTITY REFERENCE. Create a new skeletal animation CUTOUT PARTS ATLAS for exactly this same cute warm brown sloth Mallow, cream face dark eye patches, green leaf cape orange satchel, warm painterly children's book rendering. True transparent background, absolutely no glow or background tint. Landscape1536x1024, EXACT 3columns by2rows equal512squarecells. Each independent part entirely INSIDE its owncell with at least60pixels empty gutter. No assembled complete character, no text no labels. All pieces in threequarter view looking slightly RIGHT. TOPLEFT: torso with green leaf cape and orange satchel, no head no arms no legs. TOPMIDDLE: expressive smiling sloth head identical to reference, no body. TOPRIGHT: left arm hanging downward with cream claws, shoulder at top. BOTTOMLEFT: right arm hanging downward with cream claws. BOTTOMMIDDLE: left short leg with foot and claws, hip at top. BOTTOMRIGHT: right short leg foot claws. Each part isolated completely, cutout joints have enough overlap for skeletal rigging. Keep identity colors textures reference. No shadows, no floor, no whole sloth.
