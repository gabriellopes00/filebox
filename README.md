![Screenshot](docs/screenshot.jpeg)
# Filebox 📦

Complete upload & download flow with AWS S3 pre-signed URLs and large file processing with aws lambda and dynamodb. Everything with error tolerance and retries.

## features:
- [x] File upload to S3 with presigned URLs
- [x] Large file processing with multipart uploads (50MB+)
- [ ] Pause/resume uploads
- [x] File download from S3 with presigned URLs
- [x] Checksum validation for file integrity 
- [x] Dynamodb for file metadata storage sync
- [x] Delete & restore files flow with S3 delete-markers & lifecycle policies
- [x] Copy files on S3 & update metadata in DynamoDB
- [ ] File sharing via expiring pre-signed URLs with URL shortening
- [ ] Video streaming support
- [ ] Folder support with prefix-based operations
- [ ] Image processing with AWS SQS and Lambda
- [ ] Import files from external URLs

## AWS costs

Filebox is built entirely on pay-per-use AWS primitives, so an idle deployment costs effectively nothing:

- **Lambda** — no charge while idle; the free tier covers 1M requests + 400k GB-seconds per month.
- **API Gateway (HTTP API)** — billed per request only; first 1M requests/month are free for the first 12 months.
- **DynamoDB** — table is `PAY_PER_REQUEST`, so you only pay for reads/writes you actually make.
- **S3** — you pay for what you store and the requests you issue; lifecycle rules (below) keep junk from piling up.

For light personal use, expect the monthly bill to be in the cents range — the dominant cost is whatever you actually store in S3.

## Project stack & layout
This project is a monorepo managed with pnpm workspaces, containing the backend API and the frontend web app, along with shared types and utilities in a separate package.
```
apps/
  api/        Serverless Framework backend (Lambda + S3 + DynamoDB)
  web/        Vite + React with Shadcn frontend
packages/
  shared/     Shared types and HTTP contracts
```

## Getting started

### Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/installation)
- An AWS account with credentials configured (`aws configure`)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Create the S3 bucket

The Serverless stack does **not** create the bucket — it expects one to already exist (because S3 event triggers are wired up with `existing: true`). Create it once via the AWS Console:

1. **S3 → Create bucket**
   - Pick a globally unique name and a region close to you.
   - Leave **Block all public access** enabled (Filebox uses presigned URLs, never public objects).
   - **Enable Bucket Versioning** — this is required for the soft-delete/restore flow to work (it relies on S3 delete markers).
2. **Permissions → CORS** — paste the rule below so the web app can `PUT`/`GET` directly to S3:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```
   Tighten `AllowedOrigins` to your web app's URL for production.
3. **Management → Lifecycle rules → Create lifecycle rule** — add the two rules below. Both keep the bucket tidy and avoid paying for hidden storage.

   **Rule A — expire delete markers & old versions** (completes the soft-delete flow):
   - Rule name: `cleanup-deleted-files`
   - Scope: *Apply to all objects in the bucket*
   - Actions:
     - ✅ *Permanently delete noncurrent versions of objects* — set **Days after objects become noncurrent** to whatever retention you want (e.g. `30`). This is what eventually fires the `s3:ObjectRemoved:Delete` event that cleans up the DynamoDB row.
     - ✅ *Delete expired object delete markers or incomplete multipart uploads* → check **Delete expired object delete markers**.

   **Rule B — abort incomplete multipart uploads** (frees orphaned upload parts):
   - Rule name: `abort-incomplete-mpu`
   - Scope: *Apply to all objects in the bucket*
   - Actions:
     - ✅ *Delete expired object delete markers or incomplete multipart uploads* → check **Delete incomplete multipart uploads** and set **Number of days** to `1` (or `7` if you want a wider safety net). Without this, every failed/abandoned multipart upload keeps its parts in S3 forever and you keep paying for them.

### 3. Configure environment variables

Copy **`apps/api/.env.example`** to **`apps/api/.env`** — set your bucket name:

```env
BUCKET_NAME=your-s3-bucket-name
```

Same thing on web app: **`apps/web/.env`** — point the web app at your API:

```env
VITE_SERVER_URL=http://localhost:3000
```

### 4. Run in development

From the repo root, start both apps in parallel:

```bash
pnpm dev
```

Or run each one separately:

```bash
# API (serverless-offline on http://localhost:3000)
pnpm --filter api dev

# Web (Vite on http://localhost:5173)
pnpm --filter web dev
```

### 5. Deploy the API

Inside `apps/api`:

```bash
pnpm exec serverless deploy
```

After deployment, update `VITE_SERVER_URL` in `apps/web/.env` with the API Gateway URL printed by Serverless, then build the web app:

```bash
pnpm --filter web build
```

## Scripts

Run from the repo root — they fan out to every workspace:

| Command | Description |
| --- | --- |
| `pnpm dev` | Run all apps in dev mode |
| `pnpm build` | Build all apps |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | TypeScript check all packages |
| `pnpm format` | Format with Prettier |
