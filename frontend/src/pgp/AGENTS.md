# /frontend/src/pgp — OpenPGP Key Management

## Purpose

Client-side PGP (Curve25519 / ECC) key generation, message encryption, decryption, and
cleartext signing for the encrypted chat system. The entire module lives in one file:
`index.ts`. All operations are **async** (OpenPGP.js API).

## Exports

```ts
// Interfaces
interface generatedKeyPair {
  publicKeyArmored: string;
  encryptedPrivateKeyArmored: string;
}
interface decryptedValidatedMessage {
  decryptedMessage: string;
  validSignature: boolean;
}

// Functions
async function genKey(highEntropyToken: string): Promise<generatedKeyPair>;
async function encryptMessage(
  plaintextMessage: string,
  ownPublicKeyArmored: string,
  peerPublicKeyArmored: string,
  privateKeyArmored: string,
  passphrase: string,
): Promise<string>;
async function decryptMessage(
  encryptedMessage: string,
  publicKeyArmored: string,
  privateKeyArmored: string,
  passphrase: string,
): Promise<decryptedValidatedMessage>;
async function signCleartextMessage(
  message: string,
  privateKeyArmored: string,
  passphrase: string,
): Promise<string>;
```

There is **no `verifySignature` export** — signature verification is embedded inside
`decryptMessage` (returns `validSignature: boolean`).

## Operations

### `genKey(highEntropyToken)`

Creates a Curve25519 ECC keypair using `openpgp/lightweight`. Key `userID.name` is set to
`'RoboSats ID ' + sha256(sha256(highEntropyToken))`. The private key is PGP-armored and
encrypted with `highEntropyToken` as the passphrase. A one-day date offset is applied to
avoid errors from clients whose system clocks are ahead.

### `encryptMessage(...)`

Encrypts `plaintextMessage` to **both** `ownPublicKey` and `peerPublicKey`, then signs
with the sender's private key (also unlocked with `passphrase`). Returns an armored PGP
message string. Encrypted to both keys so either trader can decrypt the full chat history.

### `decryptMessage(...)`

Decrypts with `privateKeyArmored` (unlocked by `passphrase`), verifies the signature
against `publicKeyArmored`. Returns `{ decryptedMessage, validSignature }`. If signature
verification throws (invalid or missing), `validSignature: false` is returned — the
decrypted text is still returned even on invalid signature.

### `signCleartextMessage(...)`

Produces a PGP clearsign signature block. Used for robot authentication proofs (e.g.,
`api/utils.py`'s `verify_signed_message`).

## Encryption Model

```
Sender                           Server                  Recipient
  │                                │                         │
  ├─ encrypt(msg,                  │                         │
  │   [ownPK, peerPK],             │                         │
  │   signingKey=senderSK) ───────►│ stores ciphertext only  │
  │                                ├────────────────────────►│
  │                                │               decrypt(ciphertext,
  │                                │                        recipientSK)
  │                                │               → { text, validSignature }
```

Private keys are stored via `systemClient` in armored+encrypted form. The token is the
passphrase — losing the token makes past chat history permanently inaccessible (by design).

## Integration Points

- `EncryptedSocketChat` and `EncryptedApiChat` call `encryptMessage` before sending.
- `GET /api/robot/` returns the counterparty's `public_key` at trade start; that key
  is passed as `peerPublicKeyArmored`.
- `api/utils.py`'s `validate_pgp_keys` / `verify_signed_message` are the backend
  counterparts for key validation and clearsign verification.
- Uses `openpgp/lightweight` (tree-shaken OpenPGP.js build) — async API throughout.

## Product Intent

- **End-to-end encryption is a core privacy guarantee** — `chat.Message` rows store
  ciphertext only. Even a compromised coordinator cannot read past chat messages unless
  the robot token is also leaked.
- **Encryption to both keys** ensures either trader has full chat history — intentional
  for the symmetric trade chatroom model.
- **Token as passphrase** ties key access to robot identity — the token is the single
  secret that unlocks both the PGP private key and robot authentication.
- **Curve25519 ECC** is chosen for modern security and performance; do not downgrade to
  RSA without explicit product sign-off.

## Traps

- All exports are **async** — never call them synchronously; they return `Promise`.
- `encryptMessage` must receive **both** `ownPublicKeyArmored` and `peerPublicKeyArmored`
  — encrypting to only one party locks out the other.
- Private key is stored encrypted; `passphrase` must be provided at every call — do not
  cache the decrypted private key object in module or global scope.
- `openpgp/lightweight` depends on WebAssembly — if WASM is blocked, all PGP operations
  throw. This shares the same WASM dependency as `robo-identities-wasm`.
- `decryptMessage` logs `'Signature is valid'` to the console on success — a deliberate
  debug aid, not a bug, but it leaks trade timing information in browser devtools.

## Constraints

- Never store plaintext message content server-side — always encrypt before `POST /api/chat/`.
- Never cache decrypted private key objects in module or global scope.
- Encryption must always target both trader public keys — not just the sender's own key.
- Do not change the key algorithm from Curve25519 without product sign-off.
