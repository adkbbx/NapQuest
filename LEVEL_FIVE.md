# Five-level village chapter

This chapter stops at home level 5. The home transforms on the map at every upgrade. The five portraits preview appearances and explain the next reward without granting progress.

| Level | Home | Main unlocks | Raid |
| --- | --- | --- | --- |
| 1 | Humble hollow | Workbench, guest cabins, paths, gardens | Goose scout |
| 2 | Timber lodge | Soundproof bedroom, lumber mill, quarry, walls, gates, towers | Two geese |
| 3 | Village hall | Barracks, gold mine, three defender slots, rabbit guards | Goose and wall-breaking boar |
| 4 | Woodland stronghold | Acorn cannon, hedgehog rangers, five defender slots | Boar and two fox bandits |
| 5 | Acorn keep | Eight defender slots, final siege and earned Acorn crest | Boar, two bandits and Goose Captain |

## Play the loop

Gather or collect wood and stone, sell berries for coins, and keep food for energy and recruitment. Stand near home and upgrade when the displayed materials are ready. Select a building from the catalog, select empty nearby ground and confirm Place here. Wall placement remains selected for a line of segments. Each placement spends its real material cost.

Mills produce 2 wood per 8 seconds, quarries 2 stone per 9 seconds, and gold mines 1 coin per 12 seconds. Stocks stop at 16, 16 and 10 respectively. Visit walks Mallow to the building; Collect transfers stock into inventory once. Production advances while the village simulation is active, with no offline catch-up or full-mine backlog. Stock and partial production time survive saves.

Build a barracks before training. A rabbit guard costs 1 food and 1 coin; a ranger costs 1 food and 2 coins. Guards intercept enemies in melee. Rangers fire acorns from a distance. Defenders rally near home, pursue raiders and recover after battle. Towers fire at enemies within six steps. Cannons reach seven steps and damage nearby enemies together.

Start raids when ready. Boars attack walls and gates, with extra wall damage. Foxes use openings when they can. Gates admit friendly traffic while raiders must breach or route around them. Damaged walls show durability; select one nearby to repair for 1 wood and 1 stone. Broken walls disappear and must be rebuilt. Dismantling refunds half the original materials, rounded down, and returns remaining mine stock. An occupied barracks cannot be dismantled.

Defeat the Captain to display a saved crest beside the keep. Victory pays once per battle. Defeat costs up to two berries. Home levels, mines and troops remain; breached walls remain broken. Raids are voluntary and replayable. Enemies attack walls, gates, nearby defenders and home; they do not currently destroy mines or barracks.

## Laya and persistence

Home level 5 identifies a continuing project. The real local Laya model chooses legal gathering, trade, food, rest and upgrade actions until the target is reached. Ready mine stock becomes a resource action. Laya can place structures and train troops through the same paid actions as manual play, gathering prerequisites first. This version does not claim automatic base design or an optimal global strategy.

The main woodland, story practice and supplied defense practice have separate local storage keys. The `?defense=5` demo supplies a prepared village and materials; it is not earned progress. Its reset button affects only that scenario. Old saves above the chapter cap preserve materials and edits, retain the previous highest level in `settlement.legacyHighestLevel`, and continue at chapter level 5.

## Interaction audio

Twenty-one local ElevenLabs Sound Effects v3 recordings load after the first interaction. Ten additions cover construction mallets, acorn cannon, slingshot, shield impact, wall impact, wall collapse, troop readiness, collection, boar snort and eating. Collection and training cues follow successful state changes. Combat effects follow emitted impacts. Repeated effects have cooldowns, slight pitch variation and a maximum of fourteen concurrent recorded voices. Combat effects use distance attenuation and stereo position; ambience becomes quieter during battle. A compressor limits combined peaks. Hidden tabs mute and indoors reduces ambience. Separate effects and ambience controls persist. Procedural effects cover unavailable files.

`web/assets/audio/manifest.json` contains the generation prompts and durations. Recordings were generated and exported through the signed-in ElevenLabs subscription with public Explore sharing disabled. No runtime paid audio requests are required. All 21 files decoded in the browser. Sound mix quality still benefits from human listening on the target speakers or headphones.

## New painted art provenance

Created on 25 October 2026 through the built-in image-generation tool. Three transparent PNG atlases are 1536 x 1024, each a 3-column by 2-row grid of 512-pixel cells. The production briefs specified warm hand-painted gouache woodland game assets, consistent cocoa outlines and green/gold timber architecture, isolated centered objects with generous transparent gutters, no labels or text, matching the existing sloth village. Original sheets remain in `web/assets`.

| Sheet | Cell order, left to right then second row |
| --- | --- |
| `village-homes.png` | Humble hollow, timber lodge, village hall, woodland stronghold, Acorn keep, Acorn crest |
| `village-industry.png` | Lumber mill, stone quarry, gold mine, rabbit barracks, acorn cannon, timber gate |
| `village-units.png` | Rabbit guard, hedgehog ranger, boar breaker, fox bandit, Goose Captain, rally flag |

The homes brief required five progressively larger but recognizably related woodland homes, keeping a clear front door and footprint. Industry used the same timber, moss, warm roof and stone palette, with readable functions. The units brief required complete isolated side-view woodland characters, with distinct silhouettes and friendly storybook equipment. These new units have eased whole-sprite movement; they are not newly skinned skeletons. Existing Mallow, Kevin, goose and bee cutout rigs remain.

Runtime crops isolate each cell, preserve aspect ratios, and remove faint transparent halos. Canvas follows device pixel density up to 2x. Mobile starts with a wider map camera; zoom remains adjustable. Raster art has finite source resolution.

## Verification

- 48 Node regressions pass, including unlocks, every home identity, mining timing and stock limits, actual collection, training costs and capacities, friendly gate routing, boar breaches, wall delay/repair, captain victory and save migration.
- 9 Python engine and local HTTP tests pass. HTTP tests require local socket access outside the restricted sandbox.
- `node verify-home-project.mjs` reached level 5 in 40 actions from a fresh world using actual local Laya decisions and no resource grants. Evidence: `evidence/home-project-five-level-replay.json`.
- Browser story practice also saved an earned level 5 with the continuing Laya ambition. Evidence: `evidence/earned-level-five-browser.txt`.
- Browser supplied siege won with defenders and cannons; the crest persisted, training spent one food and one coin, and collecting 16 stone moved inventory from 92 to 108. All 21 audio recordings loaded, with no browser errors during these checks. Evidence: `evidence/level-five-browser-checks.txt` and screenshots.
- Responsive layout inspected at desktop and 390 x 844 override, with no horizontal document overflow.
