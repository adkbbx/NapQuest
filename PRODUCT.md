# NapQuest

## Platform

web

## Purpose

A watchable, replayable autonomous woodland adventure. The player supplies one goal and watches a sleepy sloth make decisions and live with the consequences. The former manual bridge interaction was rejected as a classifier demonstration with no meaningful game loop.

## Current experience

A local Laya model interprets the player's goal and chooses seven actions. Mallow moves automatically between a market, orchard, pond, hill, bridge, and home. State includes food, money, energy, fame, trouble, friends, souvenirs, debts, and grudges. The director brings earlier consequences back as later scenes.

The player can pause, adjust viewing speed, change the goal, repeat the same seeded day, or try another day. Replay should reveal different behavior under different ambitions. The game reports what happened, including failures to obey the original goal.

## Constraints

Real local Laya, not a replacement hosted model or heuristic action policy. Outcomes and jokes are authored game content. No per-encounter player input is required. Model failure pauses the run. Preserve the existing Mallow character and woodland visual world. The surrounding workspace is unrelated.


## Watchable consequences

The current iteration makes the map the main view and closes the journal by default. A generated coherent woodland contains the market, orchard, bridge, home, and bee workplace. Generated cutout skeletons animate Mallow, Kevin, the goose, and bees. Theft stages a pursuit and its resolution; accepting honey creates followers who commute to work, react to the model-selected work outcome, and can bring paperwork home. Recorded playback repeats actual decisions without new inference.
