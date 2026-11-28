# Fiat order preview

Proposed first step for [#2949](https://github.com/RoboSats/robosats/issues/2949). Show a sentence above the Create Order action that tells the maker who pays whom before they submit. The first patch covers the shared fiat form in Basic and Pro. The order book and taker confirmation can be reviewed separately.

## Proposed behavior

- Read the direction from the visible Buy or Sell choice. `fav.type === 1` is Buy in the form. The form maps that choice to `type: 0` in the order payload. Use the form value for the preview and leave the existing mapping in `buildOrderAttributes`.
- Use the form's `makerHasAmountRange` to choose the fixed amount or range. Show the currency and the signed premium. For a zero or blank premium, say “at market rate”. Wait until the amount or range passes the existing form checks.
- Format the selected payment method names from `maker.paymentMethods`. The form stores a separate flattened string for submission. Show “Payment method unspecified” when the list is empty.
- Translate each complete sentence as a flat i18next key, with the amount, premium and method list as interpolation values. Use the active locale to format the numbers and list. Web and Android already fall back to English. Skip the preview in Swap In and Swap Out mode.

## Examples for review

| Form input | Expected preview in English |
| --- | --- |
| Buy, fixed EUR 125, +2%, Revolut | I buy €125 worth of sats at a 2% premium and pay by Revolut. |
| Sell, EUR 80 to 240, −1.5%, Revolut and Wise | I sell €80 to €240 worth of sats at a 1.5% discount and receive payment by Revolut or Wise. |
| Buy, fixed USD 90, zero premium, Cash App, PayPal and Wise | I buy $90 worth of sats at market rate and pay by Cash App, PayPal, or Wise. |
| Sell, fixed USD 90, blank premium, no payment method | I sell $90 worth of sats at market rate. Payment method unspecified. |
| Amount missing, range inverted, or limit exceeded | Wait until the existing amount validation passes. |
| Swap In or Swap Out | Hide the fiat order preview. |

Review the Buy and Sell paths in Basic and Pro, and change the direction, amount mode, premium and payment methods without reloading. Verify the preview's initial English fallback under a locale missing the new strings. The implementation PR would include Jest coverage for direction, fixed and range amounts, premium and payment methods.
