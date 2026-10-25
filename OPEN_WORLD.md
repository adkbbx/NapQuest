# Open woodland implementation

`web/open-world-model.js` owns deterministic generation, inventory, object edits, planting, crafting, construction, trading, quests, save serialization, and A* routes. Terrain generates in 16-by-16 chunks. The seed and coordinate hash determine resources independently of chunk load order. Authored landmarks establish the village, river crossing, and beekeeper settlement. Saves store the generator version and edits rather than every generated tile.

`web/explore.js` owns the camera, two canvas layers, object hit areas, collision, map input, resource UI, actor movement, goose pursuit, bee followers, and autonomous pacing. Trees in front of Mallow become translucent when close. The repaired bridge and chopped trees change visibly. Completed bell repair displays the muffler. `web/explore.css` adapts the layout and adds phone movement controls. Canvas resolution follows device pixel density up to 2x, and artwork preserves its aspect ratio.

`POST /api/world/decide` validates a goal, world context, and up to twelve action IDs and descriptions. It serializes inference through the existing model lock and returns the actual Laya choice and timing. The client executes the chosen action using the same world rules as manual play. Cancellation generations prevent stale responses from controlling a later run. No fallback chooses an action when inference fails. This local casual game keeps its world state in the browser, without server-side anti-cheat guarantees.

## Story

The bell that will not let anyone nap asks for 4 wood and 2 stone to repair the crossing. Beyond the river, free honey comes with employment and three bee coworkers. At a workbench, 2 fiber and 1 honey make a muffler. Fit it to the bell to finish. The sandbox remains open. Coworkers stop following after one work shift, entering home, sleeping through a meeting, or dismissing them; employment continues until you quit. Sleeping through their meeting grants a promotion. Kevin's picnic triggers goose pursuit, with a returned snack or bribe available during the chase.

## Art and animation

Generated on 25 October 2026 through the built-in image-generation tool. Source PNGs remain intact in `web/assets`. Four object sheets are 1536 by 1024, with three columns and two rows of isolated transparent assets. The grass image is a square raster texture. Runtime cell extraction removes faint alpha halos and computes visible bounds. It preserves source aspect ratios.

| Source | Cells in row order |
| --- | --- |
| `environment-a.png` | Oak, apple tree, rocks, market stall, vertical bridge, stump |
| `environment-b.png` | Hollow home, bee office, workbench, mushrooms, berry bush, hive |
| `environment-c.png` | Bell, picnic basket, sapling, muffler, campfire, lantern |
| `environment-d.png` | Garden, watchtower, palisade, legacy home variants, shed |
| `bell-states.png` | Two equal columns: ringing bell and felt-covered bell cup |
| `grass-painted.png` | Repeating muted green painted grass |

Production prompts requested matching warm gouache woodland art, a three-quarter overhead view, cocoa outlines, ochre/olive colors, separate objects centered within six equal cells, generous transparent gutters, no text, no people, and no contact between cells. The grass request specified a seamless square, restrained contrast, and no objects or paths. Campfire and lantern are prepared art assets, not implemented gameplay systems.

Astra repaired the character rigs in `web/rig.js` and the atlas manifest. The Mallow arm crop previously included a fragment of a neighboring head. Corrected crops, preserved aspect ratios, torso-parented shoulders and head, planted idle feet, restrained strides, and eased pose changes address the broken motion. Nested atlas SVGs must retain hidden overflow; only the outer skeleton can overflow. `web/rig-preview.html` presents the pose inspection grid, and `test-rig.mjs` verifies crop, hierarchy, easing, and reduced-motion behavior. See `ART_AND_RIGS.md` for original character generation prompts.

## Scope

## Interaction clarity revision

The bell now emits visible ringing waves every eight seconds until muffled. Sound is optional through the Sound control. Sleeping before it is silenced is interrupted by the next ring. Home has a front-door approach, an entry animation, and an illustrated bedroom. Sleep finishes the story after four quiet seconds inside; Mallow stays in bed until the player wakes him. Merely standing near home does not complete that step. Home/sleep state is saved.

Map clicks inspect and walk rather than immediately buying, stealing, or harvesting. `web/world-guide.js` supplies the same explicit action names, costs, consequences, current objective, and five-step checklist to the interface. Resource tasks have visible durations and resource-delta feedback. Movement cancels unfinished tasks. Narrow, irregular footpaths replace the large cross. Building and planting are disclosed as optional.

The version-two generator accepts version-one saves without discarding edits or inventory. `?practice=1` uses a separate practice save so the story can be replayed without replacing the main woodland. `test-interactions.mjs` verifies interrupted sleep, indoor completion and wake-up, save migration, non-mutating inspection, and objective progression.

`web/assets/mallow-bedroom.png` was generated with the built-in image-generation tool using the original Mallow PNG as the identity reference. The production prompt requested a 3:2 warm gouache hollow-tree bedroom, Mallow asleep with both eyes closed on a wooden bed under his leaf cape, orange satchel hanging on the bedpost, round woodland window, lantern, stump table, rug, and no UI or lettering. The original generated PNG remains in the generation output directory. This is an illustrated room scene rather than a newly animated skeletal sleep atlas.

## Current limits

This is a small 2D sandbox with one authored story. Exploration generates more terrain and resources, not new quest lines. It has no multiplayer, terrain elevation, caves, redstone-style automation, mesh skinning, or 3D block building. Combat has geese, wall-breaking boars, fox bandits and a Goose Captain, plus whistles, towers, cannons and automatic allied defenders. Walls and gates absorb damage and can break. Berry growth advances after twelve world actions. The current chunk cache grows while exploring and has no eviction. Single click routes search at most 65 tiles from the player; continue traveling in shorter trips. Generated raster art has finite source resolution. The Laya action menu supports the bell story, continuing home upgrades to level 5, spending, exploration, gathering, food, rest and defense. Structure placement, planting, troop recruitment, store purchases, repairs, layout moves and land clearing are available manually and as Laya goals. It pursues one primary goal at a time. Resource mines produce only during active play; collect their capped stock at the building. Home level 2 blocks bell interruptions even before the bell story is complete. The generated felt muffler covers the brass bell cup, replacing the ambiguous rolled mat on the post.

## Continuing projects and settlement

`web/laya-agent.js` asks the real model to identify intent and numeric home target using the player goal without optional story context. `web/world-actions.js` supplies current costs, legal resource and trade actions, and return-energy budgets. The model chooses the next action; domain rules enforce costs and project completion. An upgrade project cannot expose Finish before its requested level. This avoids the earlier goal dilution from long world context. It does not make arbitrary language infallible.

`web/settlement.js` owns levels, costs, voluntary raids, enemy courage, home defense, acorn shots and once-only raid rewards. Gardens produce every eight actions. Home levels, gardens, raids, active goals, route discoveries and automatic play serialize with the saved world. `web/game-audio.js` mixes the ElevenLabs recordings, procedural fallback, separate effects/ambience settings and visibility muting.

The bridge exit and south-bank approach are reserved path tiles. Seed 507937956 previously put a tree at the one-tile exit, making the beekeeper unreachable after bridge repair; a regression checks that seed and fifty others. Existing player edits remain preserved. Temporary inference-busy responses retry after two seconds, so reloading during an in-flight decision does not abandon the saved project.


The current five-level chapter uses `web/progression.js` as the registry for level identities, building costs and unlocks, troop statistics and enemy compositions. `web/settlement.js` implements production, training, wall breaches, projectiles and captain rewards. `web/village-ui.js` renders the registry and offers explicit visit and placement controls. See `LEVEL_FIVE.md` for the current behavior and art provenance. Old saves above level 5 retain their old high-water mark in `settlement.legacyHighestLevel`, with resources and edits intact.
