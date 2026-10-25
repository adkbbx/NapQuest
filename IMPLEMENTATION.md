# Autonomous version

The original bridge prototype has been replaced with a one-goal, seven-decision loop. No legacy gameplay API or browser caller remains. Astra's character design and generated sprite are retained.

## Decision flow

Laya interprets the initial goal into an ambition. Each step receives that original goal, the current scene, resources, recent actions, and the specific consequence now facing Mallow. The engine filters only unaffordable actions; Laya selects from the remainder. The engine then applies a fixed outcome, stores a journal event, and derives the next scene from the updated state.

The director has causal branches: stealing summons Kevin's goose; trouble leads to a hearing; a crown brings royal obligations; a borrowed toll creates a collector visit; a grudge creates a personal return toll; free honey creates an employment review. Exhaustion summons a rescue snail. The day seed changes prices and rain versus bees. Endings use the actual accumulated state.

The browser automatically travels, introduces the scene, requests one step, animates the result, and continues. Pause prevents the next request. An in-flight choice can finish but waits to animate while paused. New-goal actions abort the browser request and isolate the next run with a generation token. The old server session may finish its already-started inference, but its response cannot mutate the new browser run.

## Replay and correctness

Request IDs and revisions prevent duplicated steps from spending resources twice. Model errors do not change game state. All state transitions are server-owned; the browser supplies a goal and step requests, never an action. The local model is loaded once and its inference is serialized. Completed browser receipts compare runs from the same seed. Repeating the same goal and seed is intentionally mostly deterministic.

The ending reports facts rather than claiming an arbitrary goal was completely fulfilled. Laya can ignore a budget constraint or misunderstand an ambition. The initial autonomous evaluation and a less effective cost-heavy prompt trial are preserved alongside the current evidence.

## Art and presentation

The original transparent PNG is animated with CSS. Crowns, duck companions, bees, NPCs, weather, resource changes, trails, and dialogue are live DOM/SVG layers. The original map was expanded into world.svg. A full sprite sheet, physics engine, free roaming, and generated narrative are not claimed.

## Research used

In [A browser story game needs visible consequences, not just more choices](https://dev.to/threshingdaygame/a-browser-story-game-needs-visible-consequences-not-just-more-choices-1m0b), @threshingdaygame explains pairing narrative consequences with signed resource deltas and inexpensive local replay. This build uses that connection in its journal, HUD, callback scenes, and browser receipts. It is one author's implementation account, not a community consensus or a Laya benchmark.


## Watchable consequence iteration

The browser now has a persistent Woodland runtime. The Python engine remains authoritative for decisions and consequences. Presentation is explicitly keyed by scene and action, not parsed from story prose. The runtime stages theft before pursuit, a distinct resolution for every goose choice, persistent bee followers, a commute over the bridge, workplace outcomes, and the employed home tableau. A shared clock drives cutout rigs, movement, transfers, and waits. Reset rejects old pending work so it cannot resume inside a new adventure. The journal and HUD reveal outcomes after their map sequence completes.

Recorded playback stores each authoritative response in memory and performs those same choices without new inference. The default day is 41 so the first woodland conditions allow the bee encounter. Model decisions remain free; other goals and days still branch. The optional lab page uses labeled fixture actions solely to test choreography.

Four character atlases and a coherent map are generated raster assets. ART_AND_RIGS.md records the prompt set and practical resolution limits. Node tests cover route, follower, frame-gap, and atlas invariants. Browser evidence distinguishes real Laya runs from scripted branch fixtures.

The world clock uses an independent 60 Hz timer rather than depending on compositor animation callbacks. This fixes stalled gameplay in inactive/offscreen preview surfaces. Delta clamping still prevents one suspended frame from skipping an entire pursuit. The same paused flag freezes movement, joints, transfers, callout expiry, and staged waits.
