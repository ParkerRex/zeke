# @zeke/encryption

A focused, dependency-free cryptographic utility package that provides secure encryption, decryption, and hashing capabilities using Node.js built-in crypto module.

## Architectural Insight

This encryption package exemplifies the principle of doing one thing well - it's a focused, dependency-free cryptographic utility that leverages Node's native capabilities. The concatenation pattern (IV‖tag‖ciphertext) and base64 encoding ensures the encrypted data is self-contained and transport-safe, while the strict validation prevents common cryptographic mistakes.

## Features

- **Zero dependencies** - Uses only Node.js built-in crypto module
- **AES-256-GCM encryption** - Industry-standard authenticated encryption
- **Secure defaults** - Random IVs, proper auth tags, strict key validation
- **Simple API** - Clean string-based interface for encrypt/decrypt operations
- **Type-safe** - Full TypeScript support with strict typing

## Installation

```bash
pnpm add @zeke/encryption
```

## Usage

```typescript
import { encrypt, decrypt, hash } from '@zeke/encryption';

// Encryption key must be 64-character hex string (32 bytes)
const key = process.env.MIDDAY_ENCRYPTION_KEY;

// Encrypt data
const encrypted = encrypt('sensitive data', key);

// Decrypt data
const decrypted = decrypt(encrypted, key);

// Hash data (SHA-256)
const hashed = hash('data to hash');
```

## Security

- Always use a cryptographically secure random key
- Store keys securely (environment variables, key management systems)
- Never commit keys to version control
- The package validates key format and length before operations
- Uses authenticated encryption (AES-256-GCM) to prevent tampering

## Testing

```bash
pnpm test
```

Tests cover encryption/decryption round trips, edge cases, and tampering detection.