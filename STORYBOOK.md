# NapQuest

Give Mallow one goal. A real local Laya model interprets it, chooses a route, then makes seven decisions without further steering. Watch the consequences accumulate: a stolen sandwich summons a goose, royalty brings constituents, borrowing creates a debt, and a bee contract can end in middle management.

## Play

Open **http://127.0.0.1:8788** while the local server is running. To restart it:

~~~powershell
cd napquest
.\\start.ps1
~~~

Write a goal or choose an editable example, then select **Set Mallow loose**. The entire afternoon runs automatically. The journal is closed by default; **Show journal** opens the optional action and model evidence. The map performs the theft, pursuit, sandwich hand-back, bee commute, and work outcomes. Pause and speed controls change viewing pace. **New goal** stops viewing the current run and lets you change its ambition.

At the end, **Watch this recording** performs the actual stored decisions again without calling the model. **Replay this day** repeats the same goal and seed. **Change the goal** keeps the same day's conditions for comparison. **Try another day** uses a new seed, changing prices and weather. Completed receipts are stored in this browser and compared when you revisit the same seed. Same goal + same day generally repeats the same model decisions. Replay variety comes from changing the goal or day, not random replacement of Laya's answer.

## What actually chooses

- Real model: [convaiinnovations/laya](https://huggingface.co/convaiinnovations/laya), English checkpoint, revision 7b928d828b7b0e022f929d9bd2e44165aa270148.
- Laya first interprets the goal as food, glory, friendship, or rest. This reading is visible, and may be imperfect.
- Each autonomous step sends the original goal, situation, current resources, recent choices, and the current consequence to Laya. The engine supplies only affordable actions.
- Laya alone picks among those actions. No keyword router, random choice, or canned fallback selects an action.
- The engine authors outcomes and jokes, updates state, and picks subsequent situations from the accumulated consequences. Laya does not generate the prose.
- Expand a journal entry to inspect actual model scores and timing.

The model can misunderstand goals and constraints. In a recorded run it bought lunch despite a no-spending goal. The ending reports real food, coins spent, naps, friends, souvenirs, and outstanding problems. It does not claim every condition of an arbitrary free-text goal was met.

## Setup elsewhere

Install [uv](https://docs.astral.sh/uv/getting-started/installation/), then run setup.ps1 and start.ps1. Setup installs an isolated CPU runtime and the pinned checkpoint. Allow several GB of disk and memory. The model weights are about 843 MB. Once setup completes, start.ps1 uses the cached checkpoint with HF_HUB_OFFLINE=1. No paid API key or Node build is required.

Python serves both the browser files and model API on loopback. This is a local game, not a hosted deployment. Sessions are in memory; reloading starts a fresh page and restarting the server expires unfinished days. A lost response can be recovered without applying an action twice. Model errors pause the adventure; they never produce a substitute choice.

## Verification

~~~powershell
.\\.venv\\Scripts\\python.exe -m unittest test_engine.py test_service.py
.\\.venv\\Scripts\\python.exe verify.py
node --test test-world.mjs
node --check web/adventure.js
~~~

The engine test simulates 600 complete days and checks valid actions, nonnegative resources, the seven-turn ending, and causal branches. HTTP tests check failure leaves the entire adventure unchanged, stale revisions, busy inference, and invalid inputs. These tests use explicit test adapters. verify.py instead runs complete goals through the actual local Laya service, checks idempotent steps and resource limits, and saves all choices and failures in evidence/autonomous-evaluation.json.

The watchable iteration additionally completed a real seven-decision day containing theft, goose pursuit and return, bee employment, commute, and presentation. Browser fixtures exercised all four goose resolutions and all three work outcomes. Recorded playback completed seven entries with zero additional model steps. See evidence/watchable-real-run.json, evidence/watchable-browser-checks.json, evidence/watchable-layout-checks.json, and evidence/recorded-playback-check.json. Five Node motion/atlas tests and seven Python engine/service tests pass.

The recorded evaluation completed six goals and 42 real offline model decisions, producing five different action sequences across the four interpreted ambitions. The browser checks covered a complete seven-decision theft adventure, same-day replay, and pause holding at zero decisions until resumed.

This is a development evaluation, not evidence that the game will understand every goal or that a simulated run is fun.

## Source and art

- engine.py owns the director, legal options, consequences, and endings.
- inference.py owns pinned local Laya inference and evidence.
- app.py owns sessions, serialized inference, idempotent HTTP steps, and static serving.
- web/adventure.js owns autonomous pacing, movement, animation, the journal, and replay receipts.
- Mallow, Kevin, the goose, and bees use newly generated cutout atlases with 2D skeletal rigs. The coherent painted map includes the market, trees, bridge, orchard, and bee workplace. See ART_AND_RIGS.md for sources, prompts, and resolution limits. Secondary NPCs and portable props use authored SVG. Sound is muted by default and synthesized with Web Audio.
- web/world-runtime.js owns persistent actors, shared-clock movement, pursuit, followers, transfers, and staged consequences. web/rig.js owns bones and poses; web/world-motion.js owns pure motion math.
- Open /lab.html for clearly labeled scripted animation fixtures covering every goose and bee outcome. /responsive-check.html displays phone and tablet rehearsal viewports. These fixtures do not call Laya. The default day is 41, whose conditions allow the bee encounter. Use /?day=41 to reproduce it while changing the goal. The model still chooses every action.

The original bridge-only demo was replaced. PLAN.md is preserved as history; AUTONOMOUS_PLAN.md describes the current loop. Detailed local runtime traces are saved in evidence/autonomous-decisions.jsonl and ignored by Git because goals can contain personal text.
