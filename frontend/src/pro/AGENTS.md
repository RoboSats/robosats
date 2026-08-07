# /frontend/src/pro — ProMain Dashboard

## Purpose

`ProMain` is the advanced multi-panel dashboard for arbitrage traders. Available on
`web-pro` and `selfhosted-pro` targets only — there is no `desktop-pro` or `mobile-pro`
entry point.

## File Map

| File / Dir                 | Role                                                            |
| -------------------------- | --------------------------------------------------------------- |
| `Main.tsx`                 | Root component — React-Grid-Layout grid, widget slot management |
| `LandingDialog/index.tsx`  | First-use dialog shown before the grid is visible               |
| `ToolBar/index.tsx`        | Top toolbar: add-widget picker, global controls                 |
| `ToolBar/WidgetDrawer.tsx` | Slide-out drawer listing available widgets to add               |
| `Widgets/Book.tsx`         | Order book widget (wraps `<BookTable/>`)                        |
| `Widgets/Depth.tsx`        | Price/premium depth chart widget                                |
| `Widgets/Federation.tsx`   | Federation coordinator summary widget                           |
| `Widgets/Maker.tsx`        | Order creation widget (wraps `<MakerForm/>`)                    |
| `Widgets/Placeholder.tsx`  | Empty slot placeholder shown before a widget is placed          |
| `Widgets/Settings.tsx`     | Settings widget                                                 |
| `Widgets/index.ts`         | Barrel export of all widgets                                    |

## Architecture

```
Main.tsx
  ├── <LandingDialog/>       ← shown on first visit
  ├── <ToolBar/>
  │     └── <WidgetDrawer/>  ← picks widget to add to a slot
  └── React-Grid-Layout responsive grid
        └── <Widgets.*/>     ← Book, Depth, Federation, Maker, Placeholder, Settings
```

Widgets are user-draggable and resizable via `react-grid-layout`. Shared components
(`MakerForm`, `BookTable`) are reused from `src/components/` — changes there affect
both BasicMain and ProMain.

## CSS

`css_pro/` stylesheets (`fonts.css`, `react-grid-layout.css`, `react-resizable.css`) are
loaded only for pro targets — gated by `<% if (pro) { %>` in
`templates/frontend/index.ejs`. The JS for `react-grid-layout` is in the main bundle;
only the CSS is split. These styles are **not** loaded for BasicMain.

## Product Intent

- **Target audience: arbitrage traders** — users who need simultaneous visibility into
  orderbook depth, multiple coordinators, and portfolio controls. Not designed for
  first-time or casual users.
- **BasicMain is the primary product; ProMain is additive** — ProMain reuses `MakerForm`,
  `BookTable`, and other components from `src/components/`. Any fix to shared components
  must not break BasicMain.
- **No desktop-pro entry point** — `desktop-basic` is the only desktop target. ProMain is
  web/selfhosted only. Do not add a `desktop-pro` HTML entry without explicit product
  sign-off.
- **`LandingDialog` introduces the pro interface** to users arriving from BasicMain —
  it is the first-time onboarding for the multi-panel layout.

## Traps

- `css_pro/` styles are loaded via HTML `<link>` tags, not imported JS — accidentally
  including them in BasicMain will break the layout.
- The JS for `react-grid-layout` and `react-resizable` is bundled into the main webpack
  output regardless of target; only the CSS is split. Pro-exclusive JS cannot be removed
  from the BasicMain bundle through CSS gating alone.
- Shared components (`MakerForm`, `TradeBox`, `BookTable`) are the same instances used
  in BasicMain — changes to them require BasicMain regression testing too.

## Constraints

- Never add a `desktop-pro` HTML entry point without explicit product sign-off.
- Do not import `css_pro/` styles from JavaScript — keep them as `<link>` tags in
  `templates/frontend/index.ejs` only.
- Shared components (`MakerForm`, `TradeBox`, `BookTable`) must not be modified in ways
  that break BasicMain — test both surfaces after changes.
