# Storage Package

MinIO S3-compatible object storage client.

## Overview

| Property | Value |
|----------|-------|
| Package | `@zeke/storage` |
| Backend | MinIO |
| Protocol | S3-compatible |

## Exports

```typescript
import { storageClient } from "@zeke/storage/client";
import { uploadFile } from "@zeke/storage/upload";
import { getSignedUrl } from "@zeke/storage/download";
```

| Export | Description |
|--------|-------------|
| `./client` | MinIO client |
| `./upload` | Upload utilities |
| `./download` | Download/signed URLs |

## Buckets

| Bucket | Purpose |
|--------|---------|
| `vault` | Private user files |
| `inbox` | Temporary uploads |
| `assets` | Public assets |

## Upload

```typescript
import { uploadFile } from "@zeke/storage/upload";

const result = await uploadFile({
  bucket: "vault",
  key: "team/123/file.pdf",
  body: fileBuffer,
  contentType: "application/pdf",
});
// { key: "team/123/file.pdf", url: "..." }
```

## Download

### Signed URLs

```typescript
import { getSignedUrl } from "@zeke/storage/download";

const url = await getSignedUrl({
  bucket: "vault",
  key: "team/123/file.pdf",
  expiresIn: 3600,  // 1 hour
});
```

### Direct Download

```typescript
import { getObject } from "@zeke/storage/download";

const file = await getObject({
  bucket: "vault",
  key: "team/123/file.pdf",
});
```

## Client

```typescript
import { storageClient } from "@zeke/storage/client";

// List objects
const objects = await storageClient.listObjects("vault", "team/123/");

// Delete object
await storageClient.removeObject("vault", "team/123/file.pdf");

// Check if exists
const exists = await storageClient.statObject("vault", "team/123/file.pdf");
```

## Configuration

```typescript
import { Client } from "minio";

const storageClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: 9000,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});
```

## Environment Variables

```bash
# MinIO endpoint
MINIO_ENDPOINT=localhost
MINIO_PORT=9000

# Credentials
MINIO_ROOT_USER=zeke_minio
MINIO_ROOT_PASSWORD=zeke_minio_password
MINIO_ACCESS_KEY=zeke_minio
MINIO_SECRET_KEY=zeke_minio_password

# Bucket names
MINIO_BUCKET_VAULT=vault
MINIO_BUCKET_INBOX=inbox
MINIO_BUCKET_ASSETS=assets

# Public URL for signed URLs
NEXT_PUBLIC_STORAGE_URL=http://localhost:9000
```

## Docker Setup

```bash
# Start MinIO
docker compose up -d minio

# Access console
open http://localhost:9001
# Login: zeke_minio / zeke_minio_password
```

## File Structure

Files are organized by team:

```
vault/
├── team-123/
│   ├── uploads/
│   │   └── file.pdf
│   └── exports/
│       └── report.csv
```

## Presigned Upload

For client-side uploads:

```typescript
// Server: Generate presigned URL
const presignedUrl = await storageClient.presignedPutObject(
  "inbox",
  "uploads/file.pdf",
  3600  // 1 hour expiry
);

// Client: Upload directly
await fetch(presignedUrl, {
  method: "PUT",
  body: file,
  headers: { "Content-Type": file.type },
});
```

## Related

- [API Application](../apps/api.md)
- [Dashboard Application](../apps/dashboard.md)
