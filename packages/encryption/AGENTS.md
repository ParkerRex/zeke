# Encryption Package

## Encryption Preferences

- Keep the module dependency-free beyond Node's builtin crypto; prefer pure helpers and surface any new utilities via src/index.ts.
- Enforce strict key validation (64-char hex → 32 bytes) before encrypt/decrypt work; throw fast with descriptive errors.
- Use aes-256-gcm with random 16-byte IVs and 16-byte auth tags; concatenate as IV‖tag‖ciphertext and base64 encode for transport.
- Return strings for public APIs; accept/produce UTF-8 plaintext and hex/base64 artifacts only inside the module.
- Cover new functionality with Bun tests; seed MIDDAY_ENCRYPTION_KEY inside the suite and assert round-trip integrity plus edge cases (empty strings, tampered payloads).
- Keep hashing helpers deterministic and side-effect free; prefer SHA-256 unless there's a strong reason to add another digest algorithm.

## Layout Guide

```
packages/encryption/
├── package.json       # Package metadata, build/test scripts, and dependency list (should remain minimal).
├── tsconfig.json      # TypeScript compiler settings tailored for this package's build and test targets.
└── src/
    ├── index.ts       # Main module exporting encrypt, decrypt, and hash; handles key validation, AES-256-GCM implementation details, and hash helpers.
    └── index.test.ts  # Bun test suite covering happy path and baseline edge cases for encryption/decryption using a generated test key.
```