# Local Docker Image Build Guide

This note captures the repeatable process for producing release images that will run on the Netcup VPS. We build everything on macOS, but the commands work anywhere Docker Buildx is available.

## Requirements
- Docker Engine 24.x or newer with Buildx enabled (`docker buildx ls` should list a builder that supports `linux/amd64`).
- Bun 1.2.x images are pulled automatically; no extra runtime tooling is required locally.
- Adequate disk space (≈10 GB) for cached layers—clean up with `docker system prune` afterwards.

## Build Commands
Run these from the repository root so the `turbo prune` steps can see the whole workspace. Each invocation produces staging and production tags that share the same image ID.

```bash
# Dashboard (needs Debian nodejs inside the builder stage for Next.js optimizations)
docker buildx build \
  --builder orbstack \
  --platform linux/amd64 \
  --load \
  -t zeke-dashboard:staging \
  -t zeke-dashboard:prod \
  -f apps/dashboard/Dockerfile .
```

```bash
# Website
docker buildx build \
  --builder orbstack \
  --platform linux/amd64 \
  --load \
  -t zeke-website:staging \
  -t zeke-website:prod \
  -f apps/website/Dockerfile .
```

```bash
# API (Bun runtime)
docker buildx build \
  --builder orbstack \
  --platform linux/amd64 \
  --load \
  -t zeke-api:staging \
  -t zeke-api:prod \
  -f apps/api/Dockerfile .
```

```bash
# Engine (Bun runtime)
docker buildx build \
  --builder orbstack \
  --platform linux/amd64 \
  --load \
  -t zeke-engine:staging \
  -t zeke-engine:prod \
  -f apps/engine/Dockerfile .
```

> **Why the dashboard/website Dockerfiles install `nodejs`:** When cross-compiling with QEMU emulation, Bun’s built-in Node shim cannot finish the Next.js optimization step and throws `RangeError: Array length must be a positive integer of safe magnitude`. Installing Debian’s `nodejs` package inside the builder stage gives Next.js a native Node runtime and resolves the crash.

## Recording Image IDs
After a successful build, capture the digests so we can tag or transfer them predictably:

```bash
for svc in dashboard website api engine; do
  docker image inspect zeke-${svc}:staging --format 'zeke-%s: %s' "${svc}" '{{.Id}}'
done
```

Example outputs from 2025-10-05 (macOS M3 Pro):
- `zeke-dashboard`: `sha256:b3eb6d22744efd904dd1314548e3389ef7228f0fd4c62176ce6c2e4c7ae3c782` (≈4.64 GB)
- `zeke-website`: `sha256:72775fa6a09451108da81bc6c5da8fe12b8d2c637d91c5e2d60ae5d7efe1f82c` (≈1.63 GB)
- `zeke-api`: `sha256:3d56d106115ac852995e60781860dbcf0e8ed5dba8e1bbf586b94f07baebfacf` (≈1.63 GB)
- `zeke-engine`: `sha256:eaf381409666be9338046f206c90dfa29f40ce8163b526d9af91be24022bbf62` (≈0.68 GB)

## Next Steps
- Push the tags to the registry of choice (`docker push ghcr.io/<org>/<image>:staging`) **or** save and stream them to the VPS (`docker save zeke-dashboard:staging | ssh user@vps docker load`).
- Update `deploy/docker-compose.yml` to reference the published tags before bringing the stack up.
