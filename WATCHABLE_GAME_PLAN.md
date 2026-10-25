# NapQuest: consequences you can watch

Research and implementation plan, 25 October 2026. Status: proposed work. This document does not claim the map behaviors below are implemented. It supersedes AUTONOMOUS_PLAN.md for the next iteration.

## The experience we are building

Give a sleepy sloth one ambition, then watch a short woodland comedy happen without supervising him. The default goal is "Bring lunch back to my hammock with as little effort as possible." Other goals remain editable.

The player's meaningful input is the ambition. Laya chooses what Mallow does. The pleasure comes from anticipating trouble, seeing his response, and discovering what follows him home. A successful afternoon and a ridiculous failure should both produce an ending worth watching.

Target a roughly two-minute afternoon at normal speed, subject to measured local inference latency. Keep seven decisions for the first release. No encounter should require another player click.

## What the research changes

There is no universal recipe for a good game. The useful question is which experience this particular game promises and which rules create it.

Hunicke, LeBlanc, and Zubek's [MDA paper](https://www.cs.northwestern.edu/~hunicke/MDA.pdf) separates rules, their resulting behavior, and the experience of the player. Applied here, the target is relaxed curiosity and comic narrative. Our rules need to produce observable interactions that support those feelings. Adding more written outcomes alone does not meet that target.

Kfir Adut's [A Feature Isn't Finished Until the Player Can Read It](https://dev.to/kfiradut/a-feature-isnt-finished-until-the-player-can-read-it-41ab) describes the gap between a working counter and a player understanding its cause. Our test must be whether a viewer can explain why the goose arrived, not whether the trouble counter increased.

Shun's [Script Design Notes](https://dev.to/shun126/why-i-chose-requests-instead-of-function-calls-for-game-actions-17aa) distinguishes requesting an action, starting it, and completing it. It also describes the complexity of interruption and resumption. Our world needs explicit action lifecycles and one cancellation mechanism. We do not need a scripting language or a general-purpose priority scheduler.

These are design inputs, not proof that our game will be enjoyable. The two DEV posts are individual development accounts, not a community consensus. Comment requests for both returned 404, so no comment-based conclusions are claimed. GDC Vault's relevant talks redirected to a maintenance page; their full contents were not used as evidence.

### Rules for this game

- Make the ambition easy to remember and its progress visible. Lunch should be an object in a bag, not just a number.
- Let the viewer predict an outcome, then deliver a readable twist. A goose notices the stolen sandwich before it pursues Mallow.
- Stage each important moment as setup, action, reaction, and aftermath. Leave a brief pause for recognition.
- Preserve consequences across movement and scenes. Followers must actually follow; objects must keep their owners.
- Make choices trade something meaningful. A free lunch can cost effort, friendship, or an unwanted obligation.
- Let doing less sometimes work. Rest can restore energy or let a snail carry Mallow, but it should not be a universal free win.
- Give the afternoon an ending. Return to the hammock with the actual lunch, followers, souvenirs, and unfinished obligations.
- Make replay answer a question: "What changes if I ask him to make friends instead?" Identical input may produce identical choices.

## Fit with Hacktoberfest Week 3

Verified against the organizer's [challenge page](https://dev.to/challenges/hacktoberfest-week3-2026-10-19), [launch post](https://dev.to/devteam/join-the-hacktoberfest-open-source-ai-challenge-slow-and-steady-2850-in-prizes-across-21-3iee), and DevRelay event 81 full_details.

The theme is Slow and Steady. It asks for open AI that rewards laziness, helps relaxation, or reduces effort. NapQuest's intended fit is hands-off entertainment: the player sets one goal and the local model handles every encounter. A sloth mascot alone would be a weak connection to the prompt.

| Requirement | What we will demonstrate |
| --- | --- |
| Open AI is central | Real pinned local Laya selects every consequential action. Show decision traces and a different-goal comparison. |
| Lazy payoff | One goal starts the complete afternoon, with zero required encounter inputs. Measure this in the recorded demo. |
| Relaxation | Calm viewing pace, gentle comedy, optional sound, pause and speed controls, no punishment for looking away. Ask viewers whether it actually feels relaxing. |
| Open innovation matters | Cached offline inference, inspectable choice scores, replaceable policy interface, and documented model mistakes. |
| Technical execution | Persistent visible consequences, reliable pause/restart, factual endings, and a reproducible local setup. |
| Writing and demo | Explain the user experience, show a short capture, disclose authored outcomes and AI assistance, and use the organizer's template. |

Writing is the most heavily weighted judging criterion. The entry must be a new project built during the challenge window; the template includes devchallenge and hf26challenge. Laya itself is not one of the listed partner prize categories. Aim for the overall category unless we genuinely integrate a partner for a product reason.

Deadline discrepancy to resolve before submitting: the launch post says October 25 at 11:59 PM PDT, which is October 26 at 15:59 JST. Event 81's ends_at is October 25 at 06:59 UTC, one day earlier. At the research time, October 24 at 17:49 UTC, those imply about 37 hours versus 13 hours. Do not assume the longer window is guaranteed; prepare against the earlier timestamp. No entry is submitted by this plan.

## What exists and why it feels too much like reading

Verified in the current source and browser:

- engine.py:71 directs seven scenes using resources and flags. Theft already causes a later goose scene; honey already causes a later work review.
- engine.py:298 commits the action and emits a story, resource deltas, and one animation string. It does not describe persistent physical characters or carried objects.
- web/adventure.js:77 replaces the single NPC element when introducing each scene. Characters cannot remain independently active across scenes.
- web/adventure.js:112 gives a chase one short Mallow movement and then repositions the goose once. Most outcomes use a pose and a 2.2-second hold.
- web/adventure.js:30 attaches bee and duck decorations to Mallow. They show persistent flags, but they do not navigate, perform jobs, or react as separate actors.
- web/adventure.js:153 moves to a scene, waits for inference, updates the journal, then animates. The journal often reveals the punchline before the map performs it.
- web/adventure.js:131 hides the NPC at the ending. Arriving home with a visible entourage is not represented.

Keep the local model, authoritative Python rules, seven-decision structure, generated Mallow asset, and illustrated woodland. Focus the next work on staging and persistent world behavior.

## First playable sequence: Kevin's lunch

| Moment | What the viewer sees | Actual consequence |
| --- | --- | --- |
| Temptation | Kevin sits beside a clearly visible sandwich. Mallow looks toward it, then sneaks closer if Laya selects theft. | The action is still chosen by Laya from legal options. |
| Theft | The sandwich moves into Mallow's bag. Kevin looks at the empty plate, then turns toward Mallow. | Food and theft state commit once. |
| Pursuit | A goose emerges from the orchard. It follows Mallow's route through the ferns, closes the gap, and honks. Mallow looks back. | The pursuit is caused by theft, including when Laya later chooses to return the food. |
| Decision | Goose and sloth reach a readable confrontation point. Mallow hesitates while local Laya chooses. Ambient movement continues without resolving the encounter early. | Return, flee, bribe, or nap remain real model choices. |
| Resolution | Return: sandwich visibly travels back to Kevin. Bribe: coin changes owner and goose leaves. Flee: Mallow struggles around the route, then goose gives up. Nap: goose settles on sleeping Mallow and stays as a passenger. | Apply only the selected, committed outcome. Each branch has a distinct visible ending. |
| Aftermath | Kevin returns to his picnic, the goose leaves or stays according to the outcome, and Mallow continues with the correct bag contents. | Later scenes retain the resulting resources, items, and relationships. |

The chase must begin from the theft setup, not only when Laya chooses an action named run. Our previous real-model theft runs chose return; that branch still deserves a complete chase and hand-back scene.

## Second playable sequence: free honey has a job attached

Use the existing stage clearing as a recognizable bee workplace. Add a small sign, desk, honey crate, and presentation board in the same map.

1. A bee offers a visible jar of honey. If Laya accepts the job, the jar enters Mallow's bag and a bee attaches a tiny employee badge.
2. Two or three bees become independent followers. They trail his path with different spacing and gather when he stops. They persist while he travels.
3. At the work review, a supervisor leads the last stretch toward the desk. Followers settle into office positions. The contract is visibly connected to the earlier jar.
4. Laya's decision changes the performance. Pitch: Mallow presents a honey sign and bees react. Quit: return the required honey portion and hand back the badge; work followers depart. Sleep: Mallow slumps at the desk; bees continue the presentation and place a manager badge on him.
5. The final home tableau preserves the outcome. Employed Mallow arrives with a bee carrying paperwork; someone who quit arrives without the work entourage.

The brief asks for a watchable consequence, so the workplace cannot exist only as a sentence in the journal.

## Shared world behavior

Add a small world runtime inside the existing browser app. No framework migration is needed for this scope; this is a project-specific choice based on the existing DOM/SVG map and small actor count.

Each actor has a stable ID, kind, position, facing, behavior, target, and carried-object IDs. Behaviors are idle, move, pursue, follow, sleep, carry, and work. A goose passenger is attached to Mallow; a pursuing goose is independent. They are distinct states.

Props have a stable ID and exactly one location: a map position or an owner. Sandwiches, honey, coins used in transactions, crowns, badges, and paperwork become visible transfers. Props are small authored SVG assets matching the existing world. Add directional and action poses for Mallow where needed; sliding the standing sprite is insufficient for every gag.

Use a shared path graph over the current logical 960 by 600 map. Movement crosses the bridge or the fern detour through explicit waypoints. Followers track recent leader positions with spacing. Pursuers move toward a target along paths; contact is staged at a controlled resolution point. No actor should cut through the river because a destination lies across it.

One simulation clock owns movement and action progress. Pause freezes it; speed scales it. A new adventure cancels all pending movement, beats, sounds, and old model responses. Clamp frame deltas after a hidden-tab suspension. Reduced motion uses clear static stages and transfers so the sequence remains understandable.

During inference, characters may look around, breathe, honk, or settle. They cannot spend resources, finish a pursuit, or invent a new outcome before Laya's answer arrives.

## Contract and ownership

Usage sketch:

```text
world.showEncounter(encounter, currentSnapshot)
decision = await localLayaStep(revision, requestId)
await world.perform(decision.visualBeats, adventureToken)
journal.append(decision)
world.reconcile(decision.worldAfter)
```

The Python engine owns legal options, consequence state, resource changes, object ownership, and the resulting semantic world state. Laya selects a high-level action only at decision points. It does not calculate coordinates or run once per animation frame.

An action result gains revision, worldAfter, and ordered visualBeats. Beat variants are move, transfer, react, pursue, follow, settle, and depart. Each variant has the fields it needs. The renderer must not infer transfers from English story text. Beat IDs derive from adventure, revision, and beat index.

The browser owns continuous trajectories, visual timing, poses, depth ordering, and the presentation queue. Movement is reactive to actor positions; the committed game rules determine the encounter's result. This is a small authored simulation, not a claim that Laya invented the jokes or that full physical emergence already exists.

Append the journal's outcome after its visual payoff. Hold newly committed HUD values until the relevant transfer or resolution beat. The final rendered state must match the authoritative result even after reconnecting. A recovered response must not give another coin or spawn another goose.

Proposed module map:

- engine.py: semantic transitions and world state; keep HTTP and rendering out.
- world_content.py: explicit mapping from scene/action to staging beats and stable cast IDs. Shared helpers handle recurring transfers and followers.
- web/world-runtime.js: clock, paths, actor behaviors, props, beat completion, cancellation, and reconciliation.
- web/adventure.js: user controls, API requests, run sequencing, and optional journal.
- web/assets/world.svg and web/adventure.css: map affordances, SVG props, actor layers, poses, and visual focus.

### Alternatives to test before expanding

Compare two short goose prototypes with the same setup: a fixed animation timeline, and persistent actors following a path. The timeline is cheaper for one shot but becomes fragile when followers, pause, and cancellation interact. Choose persistent actors with a small beat sequencer if the prototype remains easy to stage. A full physics engine, multi-agent model calls, and a general scripting language add work without proving this comedy.

## Build order and completion gates

1. **Prove the goose scene.** Add actor IDs, path movement, props, one clock, theft staging, and all four pursuit resolutions. Use explicitly labeled test fixtures for branch coverage, then watch a complete run using actual Laya. Close the journal during review. Do not expand content if the cause and payoff are unclear.
2. **Prove persistent bees.** Add followers, workplace staging, honey and badge transfers, and pitch/quit/sleep outcomes. Verify they remain present through travel and disappear only when the rules say they should.
3. **Finish the small afternoon.** Apply the same behaviors to duck followers, snail transport, shared naps, and the final hammock tableau. Give remaining existing actions an explicit readable staging treatment before calling the whole seven-decision day ready. Defer new encounters.
4. **Make replay useful.** Separate rerunning Laya with a changed goal from watching a recorded run. Recorded playback uses the actual stored decisions without inference. Save goal, day seed, model revision, and visual-content version. Offer a short replay of the goose or bee moment only after the full sequence is reliable.
5. **Prepare the challenge demonstration.** Record the one-goal start, a visible causal sequence, and a different-goal comparison. Explain local Laya, authored outcomes, lazy payoff, and model limitations in the DEV template. Publishing remains a separate action.

The journal becomes optional supporting evidence. The map gets the visual space and the action; model scores stay in a disclosure.

## How we will know it works

Automated checks cover reachable consequence branches, stable actor IDs, unique prop ownership, transfers matching resource changes, duplicate event application, and authoritative recovery. Runtime tests cover follow spacing, pursuit movement, bridge routing, pause, speed, cancellation, and a large background-tab frame gap.

Browser checks use both real-model adventures and clearly labeled fixture scenes. Exercise return/bribe/flee/nap even if the model favors one branch. Watch bees accept work, follow across locations, perform at the workplace, quit, and survive through the employed ending. Confirm old actors and callbacks cannot reappear after starting a new goal.

The experience gate is a muted, journal-closed watch test with three people who have not seen the implementation. At least two should be able to say what Mallow wanted, why the goose or bees appeared, and how his choice changed the situation. Ask which moment they wanted to replay and whether the pacing felt relaxing or tedious. Record the answers; an automated pass cannot certify fun.

Measure time to the first visible action, idle inference gaps, total afternoon duration, required player inputs after goal submission, and repeated scenes. Tune from the recording. Do not hide slow inference with fake progress or make every character continuously bounce.

## First milestone

A viewer watches Mallow steal Kevin's sandwich, get pursued by a goose, and resolve that problem visibly, with the journal closed. The next milestone is Mallow accepting honey and physically acquiring a job and an entourage. Everything else follows those two proofs.
