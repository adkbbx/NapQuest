# Try NapQuest

This chapter is a local, single-player browser game with CPU Laya inference. The source archive excludes model weights, caches and saved games.

## Run the game on Windows

1. Extract the source archive and open PowerShell in its `napquest` folder.
2. Install [uv](https://docs.astral.sh/uv/getting-started/installation/) if it is not already available.
3. Run `./setup.ps1`. This creates the Python environment, installs the pinned dependencies and downloads the pinned Laya checkpoint. Allow several GB of disk space and memory.
4. Run `./start.ps1`.
5. Open [NapQuest](http://127.0.0.1:8788/). Wait for **Laya · running locally** before starting automatic play. Manual play remains available while it loads.

The game binds to loopback. It is not configured as a public multi-user server. After setup, `start.ps1` uses the cached model offline.

## Watch the lazy payoff

1. Open **Laya**.
2. Choose **Earn 10 coins**.
3. Select **Let Laya take over**.
4. Watch Mallow move, gather or work, and increase **Coins earned**. The goal ends at ten newly earned coins, regardless of his opening wallet.
5. Select **Take control** or click the map to play manually.

To test progression, choose **Home level 5**. It is a longer goal: Mallow must acquire and spend real resources. One recorded fresh-world replay completed it in 40 domain actions. This is not a promise that every run takes the same time or route.

## Try defenses without grinding

Open the [supplied level-five practice world](http://127.0.0.1:8788/?defense=5). Its banner explicitly identifies supplied buildings, troops and resources. It uses a separate save from your main woodland.

Open **Village**, choose **Challenge Goose Captain**, then return to **Map**. Watch towers, cannons, enemies and defenders act on the map. A prepared four-defender fixture won the checked siege and earned the crest. Layout and combat outcomes can differ after edits.

## Basic controls

- Tap a tree, rock or forage item to walk over and gather. Tap a stocked mine to collect it. Tap an empty tile to walk.
- Tap home to walk inside and nap. It wakes automatically; Settings offers five, seven or ten seconds.
- Use **Store** for structures, tools and supplies. Select a building, choose legal nearby ground and confirm before paying.
- Use **Settings → Layout** to move assets. Moves preserve stock, durability and the main home's identity.
- Clear a stump to free its tile. **Sit and rest instead** remains an explicit alternative.
- Use the header **Mute** button, or Settings for separate effects and ambience controls.
- Use WASD or arrows on desktop. Phones have tap-to-walk and an optional movement pad in Settings.

## Verification and limits

Run the Node test command in README. Python HTTP tests need local socket access. The real-model replay scripts require the game server to be running; they create in-memory test worlds and do not modify the browser save.

This is a prototype with one optional bell story and a five-level village chapter. Laya selects from legal action descriptions; it does not invent rules, generate new story chapters or guarantee an optimal strategy. Saves and production are local to the active browser, with no offline production catch-up.

The included silent MP4s and GIFs show native browser screenshots. `media/recording-notes.json` describes the earning demo's selected excerpts. To re-encode locally, install `imageio-ffmpeg==0.6.0` into `submission/.tools`, supply the separately retained capture frames and run `submission/encode_demo.py`. Raw frames and the encoding tool are excluded from the release archive.
