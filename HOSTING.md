# Public online play

The game and the Laya decision API must be hosted together, or connected through a same-origin proxy. Uploading the HTML to a static host alone does not supply AI decisions.

## Container

The root Dockerfile installs the existing CPU runtime and loads the pinned English checkpoint during the build. Runtime uses that cached checkpoint offline. It runs as UID 1000 and serves port 7860.

```sh
docker build -t napquest .
docker run --rm -p 7860:7860 -e NAPQUEST_PUBLIC_ORIGIN=http://localhost:7860 napquest
```

For public hosting, set `NAPQUEST_PUBLIC_ORIGIN` to the app's exact HTTPS origin. It must not contain a path. The API accepts browser requests from that origin, including when TLS terminates at a hosting proxy. Local startup continues to bind only to loopback by default.

Hugging Face Docker Spaces can use this container with `sdk: docker`, `app_port: 7860` and `fullWidth: true` in their README metadata. The platform supplies `SPACE_HOST`; the server uses its HTTPS origin. Current Docker Spaces on CPU Basic require an existing paid account plan even though that hardware has no hourly charge. Do not create paid resources without the owner's approval.

`GET /api/health` reports server and model readiness. The map and manual actions are available while Laya loads. The model status and goal panel distinguish online inference from local inference. Hosted goals and action descriptions are sent to the game server; browser saves stay on the visitor's device. Hosted mode does not write the legacy story's goal history to disk.

## Live free ZeroGPU deployment

[Play NapQuest](https://adkbbx-napquest.hf.space/play/)

The owner uploaded the four-file deployment on October 27, 2026. The public Gradio Space `adkbbx/NapQuest` runs on free ZeroGPU hardware. No paid hosting was enabled.

`python package_space.py` builds `README.md`, `requirements.txt`, `runtime.zip` and `space_app.py` in the ignored `space-upload/` directory. The runtime allowlist excludes credentials, account tokens, model caches and player saves. The entry point verifies the archive hash before extraction. Its readable source is `space_app.template.py`.

The Space entry point defines its GPU callback directly and uses the native Gradio launch lifecycle. SSR is disabled so custom map and status routes reach Python. The `/play` alias resolves the directory link to the game document. `/api/status` reports the pinned model, CUDA device and Gradio transport. The model is placed on CUDA at module level and predictions run inside `@spaces.GPU`.

Online play sends goals and action descriptions to the shared GPU server. Village saves stay in the visitor's browser. The vendored Apache-2.0 Gradio client 2.7.1 uses no owner account token. The hosted worker uses supported PyTorch 2.13.0; local/container requirements retain 2.14.1.

Free GPU usage is limited. A public SDK smoke test returned `earn` for “Earn 10 coins” with the pinned checkpoint in 662 ms. A browser goal classified the earning task and moved Mallow to the workplace, then paused when the guest runs limit was reached. The hosted ten-coin goal was **not** verified to completion. Manual play remained available: a store purchase reduced coins from 18 to 17, eating consumed one food and restored energy from 63 to 88, and the browser reported no console errors. Practice saves survived reloads. These tests used the separate supplied defense village.

Do not bypass quotas, add owner tokens to the browser or enable paid hardware/top-ups without separate authorization. The downloadable local version is the option for unrestricted AI play. Phone layout was checked in the original local build; a new hosted phone-sized check has not been completed.

## Completed checks

- Twelve Python tests cover existing engine/HTTP behavior, exact HTTPS origin handling behind a proxy, rejected foreign origins and the health endpoint.
- All 48 Node gameplay tests pass.
- A separate local process in hosted mode loaded the pinned checkpoint from the cache and made a real `earn` decision. This verifies the hosted application path, not a cloud deployment or a built Docker image.
- Docker is not installed on the development host. The Docker image remains unbuilt here; the live deployment uses the Gradio entry point instead.

## Post-submission update

These hosting changes were started on 26 October 2026 after the Week 3 entry deadline. The original submission used local play and a public video demonstration. The submitted application snapshot remains in Git history at `d016d05a86b9077f485b8c35b514673339389202`. Public-host support and any later deployment should be identified as post-submission changes; they are not part of the original deadline snapshot.
