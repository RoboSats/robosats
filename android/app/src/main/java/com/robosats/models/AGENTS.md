# /android/…/com/robosats/models — Data Models & Clients

## Purpose
Shared singleton services consumed by both `MainActivity` and `NotificationsService`: encrypted key-value storage, locale management, and Nostr relay client for push notifications.

## File map
| File | Role |
|---|---|
| `EncryptedStorage.kt` | Android Keystore-backed encrypted SharedPreferences |
| `LanguageManager.kt` | Device locale → frontend i18n language mapping + locale override |
| `NostrClient.kt` | Nostr relay pool management + kind 1059 subscription for push notifications |

---

## EncryptedStorage (`object EncryptedStorage`)
`init(context)` — builds `MasterKey` (AES256_GCM) + `EncryptedSharedPreferences` (AES256_SIV keys, AES256_GCM values). Must be called before any get/set.

| Method | Signature |
|---|---|
| `setEncryptedStorage(key, value)` | Write (String → String) |
| `getEncryptedStorage(key): String` | Read; returns empty string if absent |
| `deleteEncryptedStorage(key)` | Remove key |

### Storage key contract (shared with frontend JS via `WebAppInterface`)
| Key | Written by | Read by | Purpose |
|---|---|---|---|
| `settings_use_proxy` | Frontend / `MainActivity` | `MainActivity` | `"false"` → Orbot mode, skip kmp-tor |
| `settings_notifications` | Frontend | `MainActivity` | `"false"` → don't start `NotificationsService` |
| `settings_language` | `LanguageManager` (init) / Frontend | `LanguageManager` | Active i18n locale tag |
| `garage_slots` | Frontend | `NostrClient`, `NotificationsService` | JSON object of robot slots; each slot has `nostrPubKey` + `nostrSecKey` |
| `federation_relays` | Frontend | `NostrClient` | JSON array of Nostr relay URLs |
| `federation_pubkeys` | Frontend | `NotificationsService` | JSON array of allowed coordinator Nostr pubkeys (sender allow-list) |
| `last_notification` | `NotificationsService` | `NotificationsService` | Timestamp of last displayed notification (dedup) |

---

## LanguageManager (`object LanguageManager`)
`SETTINGS_KEY = "settings_language"`. `init(context: MainActivity)` → `applySystemLanguage()`:
1. Reads `Resources.getSystem().configuration.locales.get(0)` (system locale)
2. If `settings_language` is empty **and** `systemLocale.language` is in `SUPPORTED_LANGUAGES`, writes the raw system language tag to EncryptedStorage — this is how the WebView frontend learns the initial language on first launch
3. Applies locale via `LocaleList.setDefault` + `resources.updateConfiguration` (deprecated call, `@Suppress`)

`getValidatedLocale(lang)`:
- `zh` + country `CN|SG` → `SIMPLIFIED_CHINESE`
- `zh` + country `TW|HK` → `TRADITIONAL_CHINESE`
- other `zh` → `ENGLISH`
- any unsupported lang → `Locale.ENGLISH`

Supported language tags (17): `en, es, de, pl, fr, sw, ru, ja, it, pt, zh-si, zh-tr, sv, cs, th, ca, eu`

## Traps (LanguageManager)
- `SUPPORTED_LANGUAGES` contains `zh-si` and `zh-tr`, but the membership check uses `systemLocale.language` (bare `"zh"`) — these two entries can **never match**. Chinese is handled solely by the special-case country branch; `zh-si`/`zh-tr` in the set are dead entries.

---

## NostrClient (`object NostrClient`)
Nostr relay pool client used exclusively for **incoming push notification subscriptions**. Does not publish events.

`subscriptionNotificationId = "robosatsNotificationId"`. `authors` list initialized at object construction from `garagePubKeys()`.

### Key methods
| Method | Behavior |
|---|---|
| `init()` | `RelayPool.register(Client)` once (guarded by `initialized` flag; not set on exception) |
| `start()` | `connectRelays()` + `subscribeToInbox()` |
| `stop()` | `RelayPool.unloadRelays()` |
| `refresh()` | Re-subscribes only if the pubkey set changed since last call |
| `checkRelaysHealth()` | Restarts if pool empty; else calls `connectAndSendFiltersIfDisconnected` per relay |

### Relay connection (`connectRelays`)
Reads `federation_relays` from EncryptedStorage (JSON array of URLs). **Shuffles and takes only 3 relays** to connect; each relay: `read=true, write=false, forceProxy=true, activeTypes=COMMON_FEED_TYPES`.

### Subscription (`subscribeToInbox`)
```
Client.sendFilter(
  subscriptionNotificationId,
  TypedFilter(COMMON_FEED_TYPES, SincePerRelayFilter(
    kinds = listOf(1059),          // NIP-59 gift-wrap DMs
    tags  = mapOf("p" to authors)  // robot pubkeys from garage_slots
  ))
)
```
Subscribes to **kind 1059 (NIP-59 gift-wrap)** — not kind 38383. Events are delivered to the registered `Client.Listener` in `NotificationsService`.

### Robot key retrieval (`getRobotKeyPair(hexPubKey)`)
Finds the matching slot in `garage_slots`, decodes `slot.nostrSecKey` — stored as **a JSON object keyed by stringified byte index** (`"0"`, `"1"`, … → byte values) — into a hex private key string, returns `KeyPair(Hex.decode(privKey), Hex.decode(pubKey))`.

## Traps (NostrClient)
- `init()` does not set `initialized = true` if an exception is thrown — a failed init leaves the guard unset; the next call will retry rather than silently skip (this is likely correct behavior, but note it).
- `nostrSecKey` in `garage_slots` is a **JSON object** with stringified integer keys, not a plain byte array or hex string — deserializing it requires iterating indices, not `toByteArray()`.
- Only 3 relays are used (randomly selected each `start()`). Relay selection is non-deterministic across restarts.

## Constraints
- `EncryptedStorage.init(context)` must be called before any storage read/write — including inside `LanguageManager.init`.
- Never read `garage_slots` or `federation_relays` as plain strings — both are JSON and must be parsed accordingly.
- `NostrClient` subscribes read-only (`write=false`) — do not add write/publish paths here; publishing is the coordinator's responsibility.
