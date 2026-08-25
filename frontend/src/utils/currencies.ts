/**
 * Typed accessor for static/assets/currencies.json.
 *
 * currencies.json uses integer keys (as strings) indexing into the currency list.
 * `resolveJsonModule` gives the JSON a literal-key type — every numeric lookup
 * requires a cast at the call site.  Import from here instead to get a single
 * properly-typed `Record<string, string>` without scattering inline casts.
 */
import rawCurrencies from '../../static/assets/currencies.json';

const currencies: Record<string, string> = rawCurrencies as unknown as Record<string, string>;

export default currencies;
