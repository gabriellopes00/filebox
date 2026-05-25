# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Run from the repo root — they fan out to every workspace via `pnpm -r`:

| Command | Description |
| --- | --- |
| `pnpm dev` | Run all apps in dev mode in parallel (api on :3000, web on :5173) |
| `pnpm build` | Build all apps |
| `pnpm lint` / `pnpm lint:fix` | ESLint across packages |
| `pnpm typecheck` | `tsc --noEmit` in every package |
| `pnpm format` / `pnpm format:check` | Prettier |

Per-app dev:

- `pnpm --filter api dev` — `serverless offline --reloadHandler` (http://localhost:3000)
- `pnpm --filter web dev` — Vite (http://localhost:5173)

Deploy API: `cd apps/api && pnpm exec serverless deploy`. After deploy, set `VITE_SERVER_URL` in `apps/web/.env` to the API Gateway URL.

No test runner is configured.

## Architecture

pnpm monorepo with three workspaces:

- `apps/api` — Serverless Framework, AWS Lambda (Node 24, arm64), esbuild-bundled, per-function packaging.
- `apps/web` — Vite + React 19 + Tailwind v4 + shadcn (style: `radix-nova`, icon lib: lucide).
- `packages/shared` — published as `@filebox/shared`, source-only (`"main": "src/index.ts"` — but actual files live under `data/`, `http-contracts/`, `utils/`, imported as `@filebox/shared/<subpath>.js`).
- `packages/eslint-plugins` — local ESLint plugin exposing the `local/lucide-icon-suffix` rule (enforces the `Icon` suffix on `lucide-react` imports).

### Upload flow (the central design)

The upload pipeline is the most non-obvious part of the system — it spans both apps and S3 event handlers:

1. **`POST /upload`** ([apps/api/src/functions/http/get-upload-url.ts](apps/api/src/functions/http/get-upload-url.ts)) accepts a batch of files. For each, it decides single vs multipart based on `MULTIPART_THRESHOLD` (50MB, defined in [packages/shared/data/file-data.ts](packages/shared/data/file-data.ts)):
   - **Single (< 50MB):** presigned `PutObject` URL with a `ChecksumSHA256` (hex from client → base64 for S3).
   - **Multipart (≥ 50MB):** `CreateMultipartUpload` + presigned `UploadPart` URL per 5MB chunk (`PART_SIZE`).
   All file rows are written to the `FileboxFiles` DynamoDB table with `status: 'pending'` and a 5-minute TTL — the TTL is the cleanup mechanism for uploads that are never finalized.
2. **Client** ([apps/web/src/api/files-api.ts](apps/web/src/api/files-api.ts)) PUTs directly to S3. Multipart uploads use `p-limit(3)` concurrency, retry chunks with backoff, and on success call `POST /upload/mpu/{fileId}/complete`; on failure they call `POST /upload/mpu/{fileId}/abort`.
3. **S3 `ObjectCreated` event** → [complete-upload.ts](apps/api/src/functions/s3/complete-upload.ts) flips DynamoDB status to `available`, sets `availableAt`, and **removes the TTL** — that's how pending rows are promoted to permanent.

### Delete / restore flow

Soft-delete via S3 delete markers + lifecycle policies, with a three-step state machine driven by S3 events:

1. **`POST /files/delete`** ([delete-files.ts](apps/api/src/functions/http/delete-files.ts)) transitions DynamoDB `available` → `deleting` (conditional, via `TransactWriteCommand`), then issues `DeleteObjects` on S3 (which creates delete markers if versioning is enabled).
2. **S3 `ObjectRemoved:DeleteMarkerCreated`** → [complete-file-deletion.ts](apps/api/src/functions/s3/complete-file-deletion.ts) transitions `deleting` → `deleted`.
3. **S3 `ObjectRemoved:Delete`** (lifecycle expiration) → [cleanup-file-deletion.ts](apps/api/src/functions/s3/cleanup-file-deletion.ts) removes the DynamoDB row.

Restore is the reverse on the still-existing delete-marker. `FileStatus` values are defined in [file-data.ts](packages/shared/data/file-data.ts): `pending | available | deleting | deleted | delete_failed`.

### Shared contracts

- HTTP request/response shapes live in [packages/shared/http-contracts/](packages/shared/http-contracts/) (`.d.ts` files) and are imported by both api and web.
- The `FileData` interface and status constants live in [packages/shared/data/](packages/shared/data/). The API has its own `File` class in [apps/api/src/models/file.ts](apps/api/src/models/file.ts) that implements `FileData`.
- Filename ↔ S3 key conversion (`generateFileKey`, `getFileName`, `getFileExtension`) lives in [packages/shared/utils/file.ts](packages/shared/utils/file.ts). S3 keys are `{uuid}.{ext}` and the DynamoDB id is the bare uuid.

### API conventions

- Handlers import via the `@/*` path alias (mapped to `apps/api/src/*` in [apps/api/tsconfig.json](apps/api/tsconfig.json)). Imports use the `.js` extension (NodeNext ESM).
- HTTP handlers always go through `parseHttpEvent` ([apps/api/src/utils/parse-http-event.ts](apps/api/src/utils/parse-http-event.ts)) and `parseHttpResponse` for consistent body/path/query parsing and CORS-friendly responses.
- Single shared `s3Client` / `dynamoDbClient` instances in [apps/api/src/lib/](apps/api/src/lib/).
- IAM in [serverless.yml](apps/api/serverless.yml) grants the Lambda role full S3 on `${BUCKET_NAME}` and CRUD on the `FilesTable` DynamoDB resource.
- The bucket is **not** managed by Serverless — it's expected to already exist (set `BUCKET_NAME` in `apps/api/.env`); S3 event triggers use `existing: true`.

### Web conventions

- Path alias `@/*` → `apps/web/src/*` (configured in [vite.config.ts](apps/web/vite.config.ts) and tsconfig).
- React Query for server state ([apps/web/src/lib/react-query.ts](apps/web/src/lib/react-query.ts)); `axios` instance in [lib/axios.ts](apps/web/src/lib/axios.ts) reads `VITE_SERVER_URL`.
- Checksums computed client-side with `hash-wasm` ([lib/checksum.ts](apps/web/src/lib/checksum.ts)); hex → base64 conversion in [utils/hex-to-base64.ts](apps/web/src/utils/hex-to-base64.ts) for the `x-amz-checksum-sha256` header.
- shadcn primitives are vendored in [apps/web/src/components/ui/](apps/web/src/components/ui/) — do not edit them; apply fixes at the call site.

### Lint rules worth knowing

[eslint.config.ts](eslint.config.ts) enforces:

- `local/lucide-icon-suffix` — all `lucide-react` imports must use the `Icon` suffix (e.g. `TrashIcon`, not `Trash`). Autofixable.
- `@typescript-eslint/consistent-type-imports` with inline type imports.
- `import/enforce-node-protocol-usage: 'always'` — use `node:crypto`, `node:path`, etc.
- `no-restricted-imports`: no default/namespace import of `react` — only named imports.
