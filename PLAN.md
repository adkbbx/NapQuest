# NapQuest first playable

Historical plan for the original bridge prototype. The current autonomous loop is specified in AUTONOMOUS_PLAN.md. The one-encounter APIs and manual movement below have been replaced.

Design brief, 25 October 2026. This document precedes implementation. No game or model benchmark is complete yet.

Make a tiny game where the player gives a sleepy sloth an instruction in their own words, watches Laya choose a response to a bridge goblin, and sees that choice change the world. One woodland map, one sloth, one encounter, four possible endings. A run should take about two minutes after the model is ready.

## The playable loop

1. Mallow starts beside a hollow-tree post office with two berries, three energy, and a letter for the hammock on the far bank.
2. The player clicks or taps the path to move. Arrow keys or WASD also work. The camera stays fixed. Mallow cannot enter the stream or pass the bridge goblin before resolving the encounter.
3. Reaching the bridge opens a short encounter panel: "A goblin asks for one berry to cross. A fern path skirts the bridge. You still have a delivery to make."
4. The player types a plan, up to 280 characters, and selects "Let Mallow decide". Example chips insert editable sentences. They do not select an action directly.
5. The map continues its quiet idle animation while a real Laya request runs. The panel says "Mallow is thinking..." and prevents duplicate submissions.
6. Laya selects exactly one of `trade`, `sneak`, `fight`, or `nap`. The engine applies the corresponding authored outcome. Show the selected action and a short story sentence, animate the scene, and update inventory and energy.
7. Trade, sneak, and fight open the crossing. The player reaches the hammock and delivers the letter. Nap ends the run at the bridge with a cozy "Delivery can wait" ending. Every ending offers "Try a different plan", resetting the same scene.

Mallow's personality belongs in the art and writing. Do not give the model a blanket "always nap" instruction that overwhelms what the player wrote. The instruction should have an observable effect.

## One map

Use a 960 by 600 logical game area that scales to the viewport. A narrow stream divides a clearing. The post office sits on the west bank, the goblin stands at the bridge, and a hammock marks the eastern destination. A visible fern route explains the sneak option, but the engine unlocks it only after the model chooses sneak. Keep interactive objects on a single readable ground plane.

The map contains one traversal corridor, one collision outline for each stream bank, a bridge trigger, and a destination trigger. No procedurally generated world, inventory screen, combat system, quest tree, or second encounter. A desktop layout places the encounter card beside the map; on a phone it goes below the map. Keep the instruction field and submit button visible without covering the bridge.

## Outcomes owned by the game

All four actions are valid from the initial bridge state. There are no dice rolls. A model choice is a decision, never permission to mutate arbitrary game state.

| Action | Fixed result | Visible animation and authored line |
| --- | --- | --- |
| `trade` | Berries 2 to 1, energy remains 3, crossing opens | Mallow offers a berry; goblin steps aside. "One berry buys a very polite crossing." |
| `sneak` | Berries remain 2, energy 3 to 2, fern route opens | Mallow ducks behind ferns and emerges on the east bank. "The ferns keep your little secret." |
| `fight` | Berries remain 2, energy 3 to 1, crossing opens | A single comic dust puff, then goblin retreats. "You win the argument. Your legs request a break." |
| `nap` | Berries remain 2, energy becomes 5, run ends at bridge | Mallow curls up; goblin sits nearby. "The letter will arrive after this extremely important nap." |

Fighting is a brief cartoon scuffle with no injury. Nap is an intentional ending, so repeated napping cannot stall the game. Show a small outcome card with the action, inventory change, and ending. Do not present authored prose as model-generated reasoning.

## Inference choice

Recommend a local Python service for the first playable. Serve the static browser files and the JSON API from one loopback origin. This removes cross-origin setup and lets the service load Laya once. Use a dedicated `napquest/.venv` and dependencies, without changing the unrelated root application.

| Option | What it requires | Decision |
| --- | --- | --- |
| Local Python Laya | Python environment, checkpoint download, warm model process, loopback API | Build first. It follows the primary Python interface and keeps the inference proof easy to inspect. |
| Browser Laya | `laya-ts`, exported encoder and head ONNX files, tokenizer/config assets, WebGPU or WASM, browser caching and parity checks | Valid later option for a shareable static build. Test on target browsers before selecting it. |
| Hosted model API | A deployed service and any required credentials | Outside this local first playable. Do not silently replace Laya with a hosted generative model. |

The official [Python quickstart](https://github.com/NandhaKishorM/laya) accepts a state and typed questions through `Router.predict`. The official [TypeScript README](https://raw.githubusercontent.com/NandhaKishorM/laya/main/laya-ts/README.md) documents browser inference using split ONNX exports, WebGPU with WASM fallback, and about 1.3 GB for its example's first model transfer. That example size is not a measured NapQuest download. This comparison is a project choice, not a claim that browser inference is impossible or always slower.

The [model card](https://huggingface.co/convaiinnovations/laya) describes a typed decision model, not a prose generator. Begin with one explicitly selected English checkpoint for English instructions. Pin the package version and model revision actually tested. Do not rely on model-family auto-routing or preload several checkpoints for this four-choice scene. Record the exact checkpoint, revision, device, and measured loading and inference times. No latency promise until measured on this computer.

Local inspection found no `laya`, `torch`, or `transformers` package in the workspace root `.venv`, and no Laya-named folder in the default Hugging Face hub cache. This was a narrow read-only check, not an inventory of every Python installation or cache. The existing root server targets Gemma and belongs to another project. Do not reuse it as proof of a working Laya installation.

## Model contract

The service constructs a compact state from its own game data and the player's exact text. Include the bridge scene, berries, energy, delivery objective, and `player_instruction`. Keep model instructions and player text separate. The player text may direct Mallow but may not replace the schema, invent resources, or alter the server.

Ask one choice question: "Which available action best follows the player's instruction in this situation?" Keep the four criteria short and distinct:

- `trade`: Give the goblin one berry for permission to cross peacefully.
- `sneak`: Keep the berries and quietly take the fern route, spending one energy.
- `fight`: Challenge the goblin directly in a harmless scuffle, spending two energy.
- `nap`: Stop the delivery and sleep beside the bridge, recovering energy.

This is a proposed question, to be evaluated rather than assumed accurate. Explicit positive instructions and paraphrases must change decisions across otherwise identical resets. Do not implement keyword routing, canned results, a random action, or a default nap when inference fails. Do not override an unexpected but valid model choice to make a demonstration look better.

Reject blank or oversized input at the request boundary. Inspect actual token usage or tokenize the complete input before inference; reject truncation rather than silently discard the instruction. Validate that the response contains a known action. Return probabilities only when the installed model API actually supplies them, label them "model scores", and never invent a confidence or explanation.

## Ownership and interfaces

Keep four small modules rather than a generic agent framework:

| Module | Owns |
| --- | --- |
| `engine.py` | Initial state, legal phases, authored action results, destination completion |
| `inference.py` | Laya initialization, question schema, validated decision, model evidence |
| `app.py` | Loopback HTTP, sessions, request validation, one active inference job, static files |
| `web/game.js` with `index.html` and `style.css` | Input, map rendering, movement animation, accessible encounter UI |

The engine has no imports from the inference adapter or HTTP server. The adapter knows the decision context, not the renderer. A single service process owns in-memory sessions; persistence and multi-user hosting are outside this scope.

Proposed domain shapes:

- `Action = trade | sneak | fight | nap`.
- `GamePhase = exploring | encounter | resolving | crossed | ended`.
- `GameState` contains session ID, revision, phase, berries, energy, letter-delivered flag, crossing route, and the last completed decision if any.
- `DecisionEvidence` contains action, actual checkpoint/revision, elapsed inference time, request ID, and any genuine model scores.
- `DecisionFailure` contains a stable error code and safe display message. It is separate from `DecisionEvidence` and never contains a substitute action.

Usage from the browser:

1. `GET /api/status` returns `loading`, `ready`, or `error` plus actual model metadata when known.
2. `POST /api/game` creates a fresh state.
3. `POST /api/game/{id}/encounter` advances a valid exploring session to its single bridge encounter.
4. `POST /api/game/{id}/decide` accepts instruction, expected revision, and request ID. The server snapshots the valid encounter, calls Laya, applies one engine action, and returns updated state plus evidence.
5. `GET /api/game/{id}` recovers the current state after a lost connection.
6. `POST /api/game/{id}/finish` accepts completion only after a non-nap crossing result.

The first playable trusts browser movement because there is no competitive score. The server still owns encounter results and ending eligibility. All movement through the bridge remains locked before an action result.

Reject a second distinct decision while a request is active. A repeated request ID returns its stored result and does not spend a second berry. The same ID with different text is an error. The client ignores responses for an older session after reset. If a request times out in the browser, fetch session state before retrying. A server restart clears runs and tells the client to start a new one.

## Honest failure flow

Allow the map to render while the model loads, with "Loading Laya on this computer" next to the encounter control. Show actual download or load state when the runtime exposes it, otherwise an indeterminate indicator. Never animate fake percentage progress.

If the package, checkpoint, memory, or model call fails, keep the encounter and instruction intact. Display "Laya is unavailable. Your plan has not been played." Offer "Retry model" and a short expandable setup/error detail. No action animation, inventory change, completion badge, or claimed successful AI choice may occur. An invalid model result gets the same no-state-change behavior.

After the checkpoint is cached, test with network access disabled. The intended local build should still infer. If it cannot, document the dependency that prevented offline use. Test a missing checkpoint separately from an already warm process.

## Build order and acceptance

1. Prove real inference before building around it. Install in the isolated environment, load the chosen checkpoint, run four plain instructions, and save the genuine outputs and environment metadata. Stop and report a blocker if the model cannot run. Do not finish a fake AI substitute.
2. Implement the pure outcome table and session transitions. Check all four endings, duplicate requests, and invalid phase rejection with small automated tests.
3. Build the single map and input panel. Keyboard and pointer movement must reach the bridge. Collision and encounter gating must prevent bypass. A keyboard user must reach the text field, submit, retry, and restart controls.
4. Generate Mallow from `CHARACTER.md`, inspect the asset at game size, and place it on the map. Check transparency, frame alignment, small-screen readability, and no clipped limbs.
5. Run the actual browser against the actual service. Submit new text, watch a real model response, verify the rendered action and resources match that response, and complete the corresponding ending. Repeat for all four actions using fresh runs.
6. Run an instruction sensitivity set with at least three fresh paraphrases per action. Include negation cases such as "Do not fight; offer a berry" and "Do not pay; slip through the ferns." Save failures as well as successes. Suggested release gate is all four direct instructions and at least ten of twelve simple paraphrases correct. Negation failures must be disclosed, not concealed by a keyword patch.
7. Exercise real service failure, duplicate submit, reset during inference, browser refresh, lost response, and offline cached inference. Inventory changes at most once. Failure never produces an action.
8. Record cold-load time and ten warmed decisions on this computer. Separate UI response time from model time. Keep the map responsive during inference, even if CPU inference takes seconds.

The delivery should include a reproducible start command, pinned dependencies, model identity, an integration evidence file, and screenshots of the actual playable. The evidence records exact player text, model input, returned action, timing, state before/after, and checkpoint revision. Unit tests may stub decisions to test engine branches, but integration evidence must use Laya.

## Research note

One relevant community implementation account was inspected alongside its discussion. In [What I Learned Quantizing DistilBERT to ONNX for Browser Inference](https://dev.to/fuxionixt/what-i-learned-quantizing-distilbert-to-onnx-for-browser-inference-5fok), [@fuxionixt](https://dev.to/fuxionixt) reports packaging and runtime differences between native and browser inference. A commenter notes that quantization behavior depends on hardware and quantization method. This supports measuring our target environment; it does not establish Laya performance. [Read the discussion](https://dev.to/fuxionixt/what-i-learned-quantizing-distilbert-to-onnx-for-browser-inference-5fok).
