# One goal, seven decisions

This describes the current implementation. The next iteration is planned in [WATCHABLE_GAME_PLAN.md](WATCHABLE_GAME_PLAN.md), which adds persistent actors and consequences performed on the map.

The player gives Mallow one goal. Real Laya interprets the ambition and chooses every subsequent action from that goal, the current situation, resources, and recent consequences. No per-encounter steering is required.

The game owns a seven-turn director, resource legality, authored dialogue, and consequences. Locations branch from chosen routes. Theft triggers a goose pursuit, royalty summons constituents, borrowing creates a collector encounter, and angering the goblin changes the return journey. A seeded day changes prices and weather. Replaying the same seed with a different goal exposes different decisions rather than substituting random endings.

The browser owns presentation and pacing. It moves Mallow automatically, introduces each situation, requests one idempotent server step, animates the resulting choice, and records it in a visible journal. Pause, speed, and restart are viewing controls. An error pauses the loop without inventing a choice.

Acceptance: complete autonomous runs for four materially different goals through real Laya; verify resources, exactly seven history entries, at least three different action traces on the same day, and no extra action from duplicate requests. Simulate many reachable engine states to check valid options, consequences, and endings. Watch a full browser run and replay it with a changed goal. Preserve failed decisions in evidence.

The existing Mallow bitmap and storybook map are retained. This change replaces the original bridge-only APIs and callers rather than keeping a second gameplay path.
