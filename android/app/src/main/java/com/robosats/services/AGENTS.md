# /android/…/com/robosats/services — Background Services

## Purpose
Foreground Android service that maintains a persistent Nostr relay connection to receive trade notifications while the app is backgrounded. Runs independently of `MainActivity` — started by the WebView load, stopped by user action or explicit `ACTION_STOP_SERVICE` intent.

## File map
| File | Role |
|---|---|
| `NotificationsService.kt` | Foreground `Service`; owns Nostr subscription, notification display, network monitoring, wake lock |

## Architecture
```
NotificationsService (foreground)
  ├── NostrClient            ← relay pool (read-only, kind 1059)
  ├── ConnectivityManager    ← network change callbacks
  ├── PowerManager.WakeLock  ← keeps CPU awake for relay connection
  ├── Timer (keepAlive)      ← periodic relay health check
  └── CoroutineScope(IO)     ← async event processing
```

## Manifest declaration
`foregroundServiceType="specialUse"`, `exported="false"`. The `PROPERTY_SPECIAL_USE_FGS_SUBTYPE` value: `"Run a foreground service to check for notes and keep the connection to the relays active"`. Requires `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_SPECIAL_USE`, and `WAKE_LOCK` permissions.

No `<intent-filter>` for URL deep links — "deep link" is purely the internal `order_id` extra passed via `Intent.putExtra("order_id", orderId)` from `displayOrderNotification`, handled by `MainActivity.onNewIntent`.

## Notification channels
| Channel ID | Importance | Purpose |
|---|---|---|
| `RelaysConnections` | DEFAULT | Ongoing foreground service notification |
| `Notifications` | HIGH | Trade event notifications |

Both in `NotificationChannelGroupCompat("ServiceGroup")`. Foreground notification: ongoing, PRIORITY_MIN, with a hardcoded (unlocalized) `"Stop"` action → `PendingIntent.getService(ACTION_STOP_SERVICE)`.

## Event flow (incoming trade notification)
1. `clientNotificationListener` receives a Nostr event from `NostrClient`
2. `event.firstTaggedUser()` → check it exists in `garagePubKeys()` (robot must be in local garage)
3. `NostrSignerInternal(getRobotKeyPair(firstTaggedUser))` unwraps the NIP-59 gift-wrap
4. Check `last_notification` (EncryptedStorage) for dedup
5. Check `federation_pubkeys` (EncryptedStorage) — sender must be in the allow-list
6. Call `displayOrderNotification(event, hexPubKey)`

## `displayOrderNotification`
- `orderId = event.firstTag("order_id")`
- Builds `Intent(applicationContext, MainActivity::class.java).putExtra("order_id", orderId)` — **this is the deep-link contract with `MainActivity`**
- Avatar: `roboIdentities.generateRobohash("$hashId;80")` → Base64 → `getRoundedBitmap`
- Notification title: `orderId.replace("/", "#").replaceFirstChar { uppercase }`
- Notification body: `event.content`
- `notificationManager.notify(event.id.hashCode(), ...)`

## Network handling
`networkCallback: ConnectivityManager.NetworkCallback` tracks `lastNetwork`. On network change: restarts Nostr subscription if network availability changes. `keepAlive()` runs as a `TimerTask` — calls `NostrClient.checkRelaysHealth()` periodically.

## Relay subscription
Delegates to `NostrClient.start()` / `NostrClient.stop()`. Subscribes to **kind 1059 (NIP-59 gift-wrap)** DMs addressed to robot pubkeys read from `garage_slots`. See `models/AGENTS.md` → NostrClient for relay selection and subscription details.

## EncryptedStorage keys consumed
| Key | Usage |
|---|---|
| `garage_slots` | Robot pubkeys for subscription filter + key material for unwrapping |
| `federation_pubkeys` | Sender allow-list (coordinator pubkeys) |
| `last_notification` | Dedup: timestamp of last displayed notification |

## Product intent
The service exists so users learn about active trades without the app being in the foreground — notifications are delivered via Nostr DMs (kind 1059 gift-wrap) to each robot's pubkey. The app **never background-polls the coordinator REST API** — Nostr push is the only signal.

## Traps
- The foreground notification `"Stop"` label is **hardcoded English** — not localized. Changing it requires updating the string literal in Kotlin, not a resource file.
- `processedEvents: ConcurrentHashMap<String, Boolean>` deduplicates events in-memory only — restarts lose the seen-set, so a notification could re-fire if the service is killed and restarted for the same pending event.
- `roboIdentities.generateRobohash` is called on the notification display path — if the Rust `.so` fails to load, avatar generation fails silently (graceful fallback in `RoboIdentities`), but the notification still posts with a fallback icon.
- `getRobotKeyPair` (in `NostrClient`) will throw if the `nostrSecKey` JSON structure is malformed — no try/catch on the notification path; a corrupt slot silently breaks notifications for that robot.

## Constraints
- Never add REST API polling to this service — trade discovery must remain Nostr-only.
- Always check `federation_pubkeys` before displaying a notification — skipping the allow-list would allow any Nostr pubkey to push arbitrary notifications to the user.
- `ACTION_STOP_SERVICE` must remain the only programmatic stop path (besides OS kill) — do not add other stop triggers without considering the wake lock release path.
