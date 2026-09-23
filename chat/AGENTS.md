# /chat — Encrypted Peer-to-Peer Chat

## Purpose
Real-time, end-to-end encrypted chat between maker and taker during active trades. Built on Django Channels (WebSocket). All message content is PGP-encrypted before storage — the server stores ciphertext only.

## Models

### ChatRoom (`models.py`)
One room per order. Created when trade enters CHA status.

- `order` → OneToOne to Order
- `maker` / `taker` → FK to User
- `maker_connected` / `taker_connected`: boolean connection status (for UI indicators)
- `maker_last_seen` / `taker_last_seen`: timestamp for presence tracking

### Message (`models.py`)
One row per chat message.

- `chatroom` → FK to ChatRoom
- `index`: sequential integer — used for ordering, client requests messages after last known index
- `sender` → FK to User
- `PGP_message`: encrypted ciphertext (OpenPGP armored format)
- `created_at`: timestamp

## WebSocket Consumer (`consumers.py`)
Django Channels consumer handles real-time message delivery.

- Authentication: validates robot token on connect
- Groups: each chatroom has a channel group (`chat_{order_id}`)
- On message receive: saves to DB, broadcasts to group
- Tracks connection/disconnection to update `maker_connected`/`taker_connected`

## REST Fallback (`views.py`)
`ChatView` at `/api/chat/` provides HTTP polling alternative for clients that can't use WebSocket.

- `GET`: returns messages since `offset` index
- `POST`: submit new encrypted message

## Encryption Model
Messages are encrypted **client-side** before sending. The server never sees plaintext.

Encryption uses PGP (Curve25519) with robot's keypair:
- Each robot's `public_key` is fetched from their profile at trade start
- Messages encrypted to **both** maker and taker public keys so either can decrypt
- Messages signed with sender's private key for authenticity verification
- Private key stored encrypted with robot token as passphrase

### Image attachments (Blossom)
Chat image uploads are also end-to-end encrypted — the server stores only ciphertext:
1. Image is re-encoded through a canvas to **strip EXIF/metadata** before encryption.
2. Encrypted client-side with **XChaCha20-Poly1305** (`@noble/ciphers`, random 32-byte key
   + 24-byte nonce per file). Only the ciphertext is uploaded to the coordinator's
   `/blossom/upload`, authorised by a Nostr **kind-24242** auth event signed with the
   robot's `nostrSecKey`.
3. Blobs are **content-addressed by the SHA-256 of the ciphertext** — the coordinator
   cannot link different uploads from the same robot.
4. The decryption key and nonce travel inside the PGP-encrypted chat `Message` row —
   never stored in plaintext on the server.

See `frontend/src/utils/blossom.ts` and `frontend/src/utils/crypto/xchacha20.ts`.

### Dispute evidence
The chat's E2E encryption is compatible with coordinator dispute adjudication. On dispute,
both parties **voluntarily provide the decrypted chat export alongside the original
ciphertext**. The coordinator verifies the PGP signatures on the decrypted plaintext against
each robot's stored `public_key` — cryptographically confirming the decrypted text is the
authentic content of the encrypted messages, without the coordinator ever having held the
private keys or seen the plaintext during the trade.

## Frontend Chat Implementations
Three implementations in `frontend/src/components/TradeBox/EncryptedChat/`:
1. **Socket** (`EncryptedSocketChat`) — WebSocket-based, preferred
2. **API** (`EncryptedApiChat`) — REST polling fallback
3. **Nostr** (`EncryptedNostrChat`) — Nostr relay-based, under development

## Notification Throttling
Chat notifications (Telegram/Nostr/webhook) are rate-limited:
- Throttles on `CHAT_NOTIFICATION_TIMEGAP` min (env, default 5) since the prior chatroom
  message for the receiving robot — **except the first message**, which always notifies
  regardless of the time gap.
- Controlled by env var `CHAT_NOTIFICATION_TIMEGAP` (not `MIN_NOTIFICATION_INTERVAL`).
- Prevents notification spam during active conversations.

## Views (`views.py`)
- `ChatView` — combined GET/POST for HTTP-based chat access
- Validates order ownership before allowing access
- Returns ordered messages from requested index onward
