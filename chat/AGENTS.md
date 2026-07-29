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

## Frontend Chat Implementations
Three implementations in `frontend/src/components/EncryptedChat/`:
1. **Socket** (`EncryptedSocketChat`) — WebSocket-based, preferred
2. **API** (`EncryptedAPIChat`) — REST polling fallback
3. **Nostr** (`EncryptedNostrChat`) — Nostr relay-based (decentralized option)

## Notification Throttling
Chat notifications (Telegram/Nostr/webhook) are rate-limited:
- Only triggered if more than 5 minutes have elapsed since the robot's last notification
- Configurable via `MIN_NOTIFICATION_INTERVAL` (default 5 min)
- Prevents notification spam during active conversations

## Views (`views.py`)
- `ChatView` — combined GET/POST for HTTP-based chat access
- Validates order ownership before allowing access
- Returns ordered messages from requested index onward
