# Mallow, the sleepy courier

Character and asset brief, 25 October 2026. Companion to `PLAN.md`.

Mallow is a young adult sloth with a round pear-shaped body, long loose arms, and a cream heart-shaped face inside a cocoa mask. A tiny moss-green leaf cape is fastened with a single amber button. A burnt-orange mail satchel hangs across the chest, with one ivory envelope peeking out. Mallow has a short uneven forelock and three blunt cream claws on each visible paw. The eyes are half open, alert enough to deliver the letter and sleepy enough to consider not doing so.

The satchel and leaf cape make Mallow readable as a particular character. Keep both in every pose. The design needs to read at 64 pixels tall. Use broad color shapes, a dark warm contour, and very little fur detail. No robe, hat, sword, logo, or text. Mallow should look gentle and slightly stubborn rather than helpless.

## Palette and drawing

| Part | Color |
| --- | --- |
| Outline and face mask | Deep cocoa `#49372F` |
| Main fur | Warm clay `#B68E6C` |
| Fur highlights | Toasted oat `#D6B595` |
| Face and claws | Cream `#F5E6C8` |
| Leaf cape | Moss `#6C8050` |
| Satchel | Terracotta `#B95F3D` |
| Button | Honey `#D5A44B` |

Use a hand-painted storybook cutout look, with flat shapes, restrained gouache shading, and a clean outer silhouette. This is a 2D game sprite, not a detailed character painting. Light comes from the upper left. Draw in a three-quarter front view facing screen-right, with an eye line visible from a slightly elevated camera. The feet share one ground line. Use a transparent background and draw the contact shadow separately in the game.

## First asset

Generate one excellent neutral sprite first. Prefer it over an inconsistent sheet. Store the original transparent PNG as `web/assets/mallow.png`. Target 1024 by 1024 source, character centered, full body within the inner 76 percent of the canvas. Normalize to a fixed game frame after inspecting transparency and silhouette. Render about 68 pixels tall in a 960 by 600 map, with foot position anchored to the path. Keep aspect ratio intact.

The first playable may animate this single sprite with small translation, rotation, breathing scale, and blink overlays. Those are authored animation effects, not a claim that a full generated walk cycle exists. Sneak uses a small lowered pose, fight uses one lean and a separate dust puff, and nap uses a curled pose if generated successfully. If only the neutral pose is approved, a gentle tilt onto a leaf bed is acceptable for the initial nap ending.

Exact prompt for the first generation, with `transparent_background: true`:

> Create a single production-ready 2D game character sprite of Mallow, an original cozy woodland sloth courier. Full body, three-quarter front view facing screen-right, seen from a slightly elevated game camera, standing with feet on one level ground line. Mallow has a compact pear-shaped body, very long relaxed arms, warm clay-brown fur, an ivory-cream heart-shaped face framed by a deep cocoa eye mask, tiny half-open dark eyes with one warm highlight each, a short uneven forelock, and a small calm closed-mouth smile. Three short blunt ivory claws on each visible paw. A small moss-green leaf cape fastens at the collar with one honey-amber button. A burnt-orange terracotta mail satchel on a diagonal strap rests at the hip, with one little ivory envelope visibly peeking out. Preserve a clear chunky silhouette readable at 64 pixels tall. Hand-painted storybook paper-cut game art, clean warm dark-brown contour, broad flat color shapes, subtle restrained gouache shading, warm upper-left lighting, no fine fur strokes. Palette: outline #49372F, fur #B68E6C, fur highlight #D6B595, face #F5E6C8, cape #6C8050, satchel #B95F3D, button #D5A44B. One character only, centered on a square canvas, entire character inside the central 76 percent with generous transparent padding, no cropping. Truly transparent alpha background. No scenery, no ground, no shadow, no text, no letters printed on the envelope, no watermark, no grid, no props beyond the cape and mail satchel. Not pixel art, not 3D, not photorealistic. The result must work as a clean standalone sprite placed on a woodland game map.

## Optional pose expansion after the neutral sprite passes review

Use the approved sprite as the image reference. Do not regenerate the character from memory. Generate individual pose files before attempting a sheet; image generation may not maintain exact cell registration.

| Pose | Constraints |
| --- | --- |
| Idle | Neutral sprite with a tiny eyelid or breathing variation; feet fixed |
| Walk A and B | Opposite shallow foot swings, body height within 4 percent of neutral, bag stays on same side |
| Offer | Near arm extends one berry, far arm still visible, no extra paw |
| Sneak | Knees and head lower slightly, cape and envelope still visible |
| Brace | Both paws forward, planted feet, determined closed mouth, no weapon |
| Nap | Curled side pose, closed eyes, satchel used as pillow, cape draped over body |

All upright frames use a 256 by 256 cell, feet anchored at x 128 and y 226. Keep the body center aligned, with about 20 pixels of transparent clearance. Nap can occupy a wider silhouette but uses the same bottom anchor. The renderer has an explicit frame map; do not assume generated rows match their requested names. Horizontal mirroring is acceptable for the first playable, including the mirrored bag. If a consistent bag side across directions becomes important, make separate facing-left frames later.

Walk uses two frames at 4 frames per second. Idle breathing takes about three seconds. Offer and brace are short once-only gestures. Nap has a slow breathing loop. Disable bobbing, shaking, and dust bursts when reduced motion is requested; the action text must still communicate the outcome.

## Map art direction

Build a warm paper woodland diorama that leaves space around Mallow. Ground is muted sage `#B8C39A`, path is pale ochre `#D8BD83`, stream is dusty teal `#7FABA1`, tree canopies are deep olive `#64754C`, and the bridge is walnut `#8A6547`. A few cream flowers echo Mallow's face. Small terracotta accents connect the post office and satchel.

Keep the background lower in contrast than the characters. Use rounded treetops, broad fern leaves, and a gently curved stream. Two or three large tree masses are enough; avoid fields of tiny decorative objects. The bridge and hammock must be obvious without labels. Put foreground foliage along the outer border, never over the path or encounter controls.

The bridge goblin is a squat moss-colored caretaker with a beet-red nose, an oversized acorn cap, and a tiny wooden toll cup. It uses the same outline and light direction as Mallow. It carries no blade. A short annoyed eyebrow and a reluctant wave cover the whole encounter.

Use DOM text over or beside the canvas for instructions and outcomes. Keep all important information readable without relying on color or sound. The game title may use a rounded display face, while controls use a plain readable face. Do not put text into generated map art.

## Asset acceptance

- Inspect on both light and dark backgrounds. The alpha channel must be transparent, without a white rectangle, checkerboard paint, fringe, or baked shadow.
- Inspect at 64 pixels tall. Face, leaf cape, and satchel must still be recognizable.
- Check limb and claw counts, a single strap, one envelope, and no duplicated face detail.
- Check that all poses depict the same character, costume, lighting, view angle, and baseline.
- Preview on the actual map at desktop and phone widths. Mallow must stand apart from the path and foliage.
- Keep source PNGs and prompt provenance. Describe CSS or canvas motion honestly if no multi-frame sheet was produced.
