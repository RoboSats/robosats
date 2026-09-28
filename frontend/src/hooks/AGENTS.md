# /frontend/src/hooks — Custom React Hooks

## Purpose

Custom hooks that encapsulate derived computations consumed by BasicMain pages, ProMain
panels, and shared components.

## Hook Inventory

| Hook              | File                 | Purpose                                                               |
| ----------------- | -------------------- | --------------------------------------------------------------------- |
| `useBondEstimate` | `useBondEstimate.ts` | Estimates bond amount in sats from current maker/order params         |
| `useLegacyMode`   | `useLegacyMode.ts`   | Returns `isLegacyMode` + `legacyDisabledTooltip` from `GarageContext` |

## `useBondEstimate`

**Signature**

```ts
useBondEstimate({
  maker: Maker,
  fav: Favorites,
  federation: Federation,
  currentPrice?: number,
  federationUpdatedAt: number,   // cache-bust dependency
  amountRangeEnabled: boolean,
}): number | null
```

**Bond-size resolution (3-level fallback chain)**

1. `maker.bondSize` — user-specified value in the form, if set.
2. `federation.getCoordinator(maker.coordinator)?.info?.bond_size` — coordinator's live
   `/api/info` value, if loaded.
3. `3` (percent) — hardcoded fallback that mirrors `api/settings.py`'s
   `DEFAULT_BOND_SIZE`. If the backend default is changed, this fallback drifts silently.

**Delegates to `calculateBondAmount` in `../utils/bondCalculator`**

```ts
calculateBondAmount({
  amount,
  minAmount,
  maxAmount,
  isRange,
  bondSize, // resolved above
  mode: fav.mode as 'fiat' | 'swap',
  price,
  premium,
});
```

`makerHasAmountRange = maker.advancedOptions && amountRangeEnabled` controls whether
`minAmount`/`maxAmount` (range) or `amount` (fixed) is used.

Returns `null` when `currentPrice` is unavailable (coordinator not yet contacted).

## Product Intent

- **`useBondEstimate` 3% fallback is intentional** — it prevents showing 0% or an error
  to the user before the coordinator responds; 3% is the coordinator default so the
  estimate is almost always correct. The fallback is a UX convenience, not a product
  policy — if `DEFAULT_BOND_SIZE` changes on the backend, update this too.
- **Bond estimate is display-only** — the real bond is computed by the coordinator at
  order-creation time; this hook just provides a visual preview in `MakerForm`.

## `useLegacyMode`

**Signature**

```ts
useLegacyMode(): { isLegacyMode: boolean; legacyDisabledTooltip: string }
```

Reads `garage.getMode()` from `GarageContext` and returns:

- `isLegacyMode: true` when `garage.mode === 'legacy'` — used to disable UI elements that require garageKey mode.
- `legacyDisabledTooltip` — translated string shown in `<Tooltip>` wrappers on disabled buttons.

**Used by:** `AppBar` (Offers button, FAB), `DesktopBar`/`TopBar` (Create/Offers tabs), `MakerForm` (submit button), `TakeButton` (Take Order button), `Routes.tsx` (redirect from `/offers` and `/create` to `/garage`).

**Product intent:** Legacy mode is read-only — users must complete any ongoing trades before they can create new orders. The hook is the single gate for this policy in the UI; never add a separate `garage.getMode() === 'legacy'` check in components — always use this hook.

## Traps

- The 3% hardcoded fallback can drift from `api/settings.py`'s `DEFAULT_BOND_SIZE`.
  There is no runtime sync — only a code change keeps them aligned.
- `federationUpdatedAt` is the `useMemo` dependency that causes recalculation when
  coordinator info refreshes. Removing it silently stales the estimate.
- Returns `null`, not `0`, when price is unavailable — components must handle `null`.

## Constraints

- Keep the 3% fallback in sync with `api/settings.py`'s `DEFAULT_BOND_SIZE`.
- Do not add network calls to any hook — price/coordinator data must flow in via props.
- Do not add one-active-order enforcement logic — surface coordinator state only.
- Never inline `garage.getMode() === 'legacy'` in components — always consume `useLegacyMode()` so the disabled-tooltip and policy stay in one place.
