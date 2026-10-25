---
name: NapQuest
description: One goal. Zero supervision.
colors:
  paper: "#F4EBD8"
  ink: "#382E26"
  muted: "#6A5D4B"
  moss: "#53633D"
  line: "#C8BDA0"
  rust: "#A85B3B"
  panel: "#FAF4E7"
typography:
  display:
    fontFamily: "Georgia, 'Times New Roman', serif"
    fontSize: "28px"
    fontWeight: 400
    lineHeight: 1.2
  body:
    fontFamily: "system-ui, sans-serif"
    fontSize: "14px"
    lineHeight: 1.55
rounded:
  controls: "8px"
  map: "13px"
spacing:
  small: "8px"
  medium: "16px"
  large: "28px"
components:
  button-primary:
    backgroundColor: "{colors.moss}"
    textColor: "#FFF9E9"
    rounded: "{rounded.controls}"
    padding: "12px 16px"
---
# NapQuest design

## Overview

Keep Astra's woodland storybook direction and Mallow's identity. The current world uses a coherent generated painting and four generated cutout character atlases. The product is now a watchable simulation: one goal begins a complete afternoon. The map carries the action; the journal carries causes and consequences. Interface controls recede after the run begins.

## Colors

Warm paper surrounds a muted sage world. Cocoa is the text color, moss is the main action color, and rust marks costs and trouble. Pale resource deltas distinguish gains from costs with signed text as well as color.

## Typography

Georgia sets the title, scene dialogue, journal heading, and ending. System sans sets goals, actions, resources, and journal prose. Body text is 14px; supporting controls and state are 12px. The small model-score disclosure is secondary. Goal input grows to 16px on phones.

## Layout

A centered 1450px maximum composition contains a proportional 3:2 map. The journal is closed by default; opening it restores a 308px secondary column. The map scales to available width and desktop height without cropping its landmarks. On screens below 800px the journal moves below the map. Short desktop viewports reduce header spacing and cap map height so the autonomous action remains visible. The map uses normalized logical coordinates, with actor, NPC, trail, weather, speech, and reward layers.

The initial goal form is replaced by a goal ribbon and pause/speed/new-goal controls. Completed runs add an inline ending beneath the map. The journal scrolls independently and preserves the whole afternoon.

## Elevation & Depth

The map has one soft offset shadow. Other areas use warm rules and tonal separation. Dialogue and resource feedback sit above the world without glossy effects.

## Shapes

The map has a 13px radius. Main controls use 8px; quiet controls use 7px. NPCs and map objects share rounded outlined storybook shapes.

## Components

Primary buttons begin or replay an adventure. Preset goal buttons insert editable text; they do not choose an action. The live resource strip reports server state. Journal entries combine the chosen action, authored story, prior-consequence callback, signed deltas, and optional model details.

Mallow, Kevin, the goose, and bees use 2D cutout skeletons with joint pivots. The runtime clock drives gait, flight, poses, pursuit, followers, and object transfers. Remaining secondary NPCs use authored SVG. Crowns, ducks, bees, rain, and wanted status represent actual accumulated state. Sound is optional. Reduced-motion preferences remove bobbing and shorten movement without removing story outcomes.

## Do's and Don'ts

- Do keep the original goal visible during autonomous play.
- Do show what a decision changed and when it causes a later scene.
- Do preserve the distinction between real model choices and authored dialogue.
- Do keep the ending factual when the model ignores a goal constraint.
- Don't ask for player steering at each encounter.
- Don't decorate the map with a crown, entourage, or employment effect absent from the run state.
- Don't invent decisions or scores when inference fails.


## Woodland sandbox controls, October 26

The current game surface operates as a map with focused Store, Village, Laya, Bag and Settings panels. Preserve the existing gouache art, paper, cocoa and moss palette. The default map takes the available screen height; no page-length inventory or feature sidebar pushes it out of reach. Desktop uses an optional side panel; phone uses a dismissible bottom sheet and persistent bottom navigation. Mute stays visible in the header. Core actions have at least 44px targets. Supporting functional labels use at least 12px in the new shell. Body and setting text use 13–16px; compact headings use 17–24px Georgia. Eight-pixel edges and offset shadows keep panels distinct over the world.

Safe gathering is a single tap followed by authored movement and the actual interaction. Purchases, employment and repairs keep explicit intent controls. Structure purchases preview before charging. Layout editing is a separate state with a ghost, validity reason, confirm and cancel; simulation pauses while editing. Sleep shows a countdown and wakes automatically. Panels use native scrolling, visible labels and keyboard focus; Escape closes them and cancels a pending layout or building preview.
