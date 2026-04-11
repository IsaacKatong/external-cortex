# Encryption

AES-256-GCM encryption and decryption for `graph.json` using password-based key derivation (PBKDF2).

- `encrypt.ts` — Node.js encryption used at deploy time to encrypt `graph.json` before uploading.
- `decrypt.ts` — Browser decryption using Web Crypto API to decrypt `graph.json` at runtime.
- `constants.ts` — Shared encryption parameters (algorithm, key length, iterations).
