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

## Verification

- Twelve Python tests cover existing engine/HTTP behavior, exact HTTPS origin handling behind a proxy, rejected foreign origins and the health endpoint.
- All 48 Node gameplay tests pass.
- A separate local process in hosted mode loaded the pinned checkpoint from the cache and made a real `earn` decision. This verifies the hosted application path, not a cloud deployment or a built Docker image.
- Docker is not installed on the development host, so a container build and public smoke test still have to pass on the selected hosting service.

## Post-submission update

These hosting changes were started on 26 October 2026 after the Week 3 entry deadline. The original submission used local play and a public video demonstration. The submitted application snapshot remains in Git history at `d016d05a86b9077f485b8c35b514673339389202`. Public-host support and any later deployment should be identified as post-submission changes; they are not part of the original deadline snapshot.
