# /api/nick_generator — deterministic nickname generator (agent reference)

`NickGenerator.short_from_SHA256(hash, max_length)` builds a nickname from a hex SHA256:
min-max scale the hash into `[0, pool_size)` to get `nick_id`, then decompose it via
mixed-radix division/modulo into adverb/adjective/noun/number "digits", each looked up in
a dictionary. Retries with a re-hashed `str(hash)+"42"` (up to `max_iter` times) if the
assembled nick exceeds `max_length`.

## Production instantiation differs from the class default
Class default: `use_adv=True, use_adj=True, use_noun=True, max_num=999` (docstring claims
~28 trillion combinations). Production, in `robosats/middleware.py`:
```python
NickGen = NickGenerator(lang="English", use_adv=False, use_adj=True, use_noun=True, max_num=999)
...
nickname = NickGen.short_from_SHA256(hash, max_length=18)[0]
```
**`use_adv=False`** (adverbs disabled) and a tighter `max_length=18` (vs. the method's own
default of 25). English dictionary sizes: 4832 adjectives, 450 adverbs, 12591 nouns. With
adverbs off, the real pool is `999 * 12591 * 4832` ≈ **60.8 billion**, not the docstring's
~28 trillion (`999 * 12591 * 4832 * 450`) — that number only applies to a path that's never
used in production and, per the trap below, can't actually run anyway.

## Traps
- **`use_adv=True` raises `UnboundLocalError`.** The `if self.use_adv:` branch body is
  entirely commented out except a bare `pass` — `remainder` never gets assigned, and it's
  referenced unconditionally right after. The class *default* constructor argument
  (`use_adv=True`) is therefore uncallable as-is; only the production `use_adv=False`
  instantiation works.
- **Spanish dictionaries are unreachable.** `dicts/es/{adjectives,adverbs,nouns}.py` exist
  and are populated, but `__init__`'s `elif lang == "Spanish":` import block is entirely
  commented out with no `else` — passing `lang="Spanish"` raises `NameError` at
  `self.adjectives = adjectives` instead of loading them.
- **`compute_pool_size_loss` is a no-op.** Body is a bare `return` followed by an entirely
  commented-out implementation.
- **Off-by-one in the trailing number.** The docstring promises `Numeric(0-999)` (1000
  values), but the decomposition modulus (`num_id = remainder - noun_id * self.max_num`)
  only ever yields `[0, max_num - 1]` = `[0, 998]` — 999 does not appear.

## Constraints
Don't "fix" the `use_adv=True` path without checking every caller — production explicitly
opts out of it. Don't change `max_num`/`use_adv`/`use_adj`/`use_noun` in
`robosats/middleware.py` without recomputing the actual pool size (it is not what the class
docstring claims) and confirming existing nicknames stay stable (this generator must be
deterministic per-token across app restarts).
