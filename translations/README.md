# API-backed translation starter

This proposal uses hosted OpenAI inference through AISuite: `gpt-4o-mini` for
translation and `gpt-5.6-terra` for review, with review reasoning effort `none`.
That pair passed an isolated Spanish JSON smoke test; the full 16-locale backfill
and this GitHub Actions workflow have not been run.

KoalaSat previously preferred local inference. This API starter is a proposed
alternative for the initial setup, **not a claim that RoboSats approved sending
strings to a hosted provider**. Confirm the project's privacy and cost policy
before activation.

## Activation

1. Review and merge the setup only if the project accepts the API-backed proposal.
2. Permit Actions to create pull requests in repository/organization settings.
   The workflow requests contents-write and pull-requests-write permissions.
3. Add an `OPENAI_API_KEY` repository secret with access to both configured models
   and appropriate usage limits. Do not place credentials in configuration files.
4. Dispatch **Translate** manually from `main` for the first controlled run.
   Leave `process_all_files=true` and `locale_filter_glob=es.json` to start with
   Spanish only. Choose another exact filename, such as `ca.json`, for another
   locale; `*.json` selects all 16 target locales. Leaving `locale_filter_glob`
   blank also selects all 16: the workflow expression
   `github.event_name == 'workflow_dispatch' && inputs.locale_filter_glob || '*.json'`
   treats an empty string as falsy and falls back to `*.json`.
   Review scope and cost first.
   The boolean forces file selection, not a per-key limit; false on a clean
   manual checkout normally selects no files.
5. Review generated locale changes and quality reports before merging any output.

Without the API key, the guard exits green before checkout or model calls.
PR-creation permissions are an additional requirement, not part of that guard:
a configured API key can incur inference cost even if PR creation later fails.
Removing the key stops future translation jobs; it does not cancel an active job.

The workflow uses GitHub-hosted Ubuntu, the normal `GITHUB_TOKEN`, and default
`github-actions[bot]` attribution. Generated commits are unsigned: no extra
signing secret, personal token, operator runner, or local model service is required.
Projects requiring signed commits must explicitly configure and verify that
separate policy before enabling publication.

Only upstream `RoboSats/robosats` trusted-main pushes and manual dispatches run.
There is no pull-request trigger. Each attempt creates a fresh PR branch instead
of replacing a branch under review. The workflow never merges PRs. Its 120-minute
timeout bounds execution, not provider cost or successful completion of a full
backfill. Review or close obsolete generated PRs before accepting overlapping
batches. The normal GitHub token may not trigger other push/PR workflows on the
generated PR; do not infer downstream checks ran merely because a PR exists.

The request limiter permits 60 calls/minute with five concurrent calls. These
settings improve throughput, not total token cost. A full backfill can require
roughly 1,900 translation/review calls at the inspected snapshot; allow for
latency, retries and provider limits. Start with one locale, not the full backlog.

## What gets translated

The JSON adapter uses English `en.json` as source and the existing 16 locale
filenames, including `zh-SI` and `zh-TR`. English-identical target values are
eligible for backfill. Some identical words are legitimate, so reviewers must
not equate that count with a count of translation errors.
This eligibility also applies when a normal source push selects a locale file;
do not assume only newly edited English keys can incur model calls.
There is no persisted source-echo ledger in this workflow: still-English values,
including legitimate identical terms and model echoes, are retried on each
source push. This can mean hundreds of paid calls repeatedly. After the accepted
backfill PR merges, set `retranslate_identical_source_strings: false` to stop that
backfill policy, or agree explicit expected-identical/brand terminology first.

Section markers `#N`, the exact token-only key `{{description}}`, and six exact
nonlinguistic keys (`RoboSats`, `PGP`, `nostr`, `X`, `ID`, `API`) are
excluded and kept equal to source. Do not broaden this to messages containing
placeholders or all technical words. Some existing locales intentionally localize
`URL`, `Mainnet`, `Testnet`, or `Lightning`; their mixed conventions need review,
not blanket source-value replacement. Initial brand guidance is proposed policy,
not evidence that every existing locale already follows it.

Keep the quality gates enabled. Source echoes are reverted to English and listed
in the generated PR report; an individual echo does not necessarily block the PR.
The gate blocks on configured thresholds and reported placeholder, skipped-file,
or model failures, not every per-key warning.

`{{var}}` interpolations and numeric React-i18next `<N>` / `</N>` / `<N/>`
component tags are protected and parity-checked in v0.1.21. The check compares
exact token counts; it does not validate component nesting or rendered output.
Existing translations in `es`, `fr`, `pt`, `zh-SI`, `eu`, `it`, and `ja` still
have damaged tags in `unsafe_alert`, `let_us_know_hot_to_improve`, or
`open_dispute`. Those need separate corrections and native-speaker review.
The numeric-tag protection from [pipeline PR #178](https://github.com/bisq-network/localize-pipeline/pull/178)
is included in this pin; installing the workflow does not repair existing files.
Do not exclude these keys: exclusion copies English over existing translations.
Neither these checks nor two model passes replace native-speaker review.

The inspected snapshot has three existing interpolation-name errors in Catalan,
Basque, and French. Those are separate corrections; installing the workflow does
not by itself repair them.

## Starting glossary

`glossary.json` contains 93 term mappings across the 16 locales. They were
selected from [existing RoboSats translations](https://github.com/RoboSats/robosats/tree/8f178476297333c83224bb7da467df8296069878/frontend/static/locales),
with 31 matching entries taken from the
[Bisq 2 glossary](https://github.com/bisq-network/localize-pipeline/blob/385a75b25931e1031f7840d7309632e7f98de26e/profiles/bisq/glossary.json).
Every mapping has wording present in at least two distinct RoboSats messages
whose English source uses that term. This provides evidence of existing usage;
it does not establish that a native speaker has approved the choice.

The entries cover `robot`, `garage`, `coordinator`, `bond`, `fee`, `trade`, and
`wallet`, where the existing wording supports a choice. Coverage varies by
locale. For example:

| Locale | English term | Preferred wording | Source |
| --- | --- | --- | --- |
| German | fee | Gebühr | Bisq 2 and RoboSats |
| French | wallet | Portefeuille | Bisq 2 and RoboSats |
| Japanese | trade | 取引 | Bisq 2 and RoboSats |
| Spanish | fee | Comisión | RoboSats; Bisq 2 uses Tarifa |
| Italian | trade | Scambio | RoboSats; Bisq 2 uses Commercio |
| Catalan | garage | Garatge | RoboSats' longer messages; the label is still English |

Bisq's `zh-Hans` / `zh-Hant` entries were matched to `zh-SI` / `zh-TR`.
The three Portuguese carryovers also agree between Bisq's `pt_BR` and `pt_PT`
glossaries and RoboSats' `pt` messages. Basque entries come from RoboSats alone.
Bisq-specific concepts and keys that do not occur in the English messages were
left out.

These are preferred terms for both translation and review. The config uses
`translation_glossary_enforcement: "prompt-only"`, so it allows inflection and
compounds instead of rejecting a translation for not containing the exact base
word. For example, Czech `Robot` becomes `robota` in `Přidat robota`.
Terminology compliance therefore needs human review. Interpolation and numeric
tag checks remain enabled; brand guidance is configured separately.

Some choices are left open: `order`, `maker`, and `taker`; `bond` in Polish,
Portuguese, Swedish, and Thai; Basque `garage`; and Traditional Chinese
`coordinator`. Existing labels, longer messages, or the trading meaning need
reconciling before using them as glossary guidance. Keep these decisions in
translator review rather than importing a different project's wording wholesale.
Adding the glossary does not change any existing locale file.

## Other providers and local inference

No automatic provider fallback is configured. Anthropic is an explicit alternative
that requires its own credential/model configuration and separate compatibility,
format, and language-quality verification. It is not enabled by this starter.

Local inference can be considered later with an operator-managed endpoint and
appropriate runner/network setup. A GitHub-hosted runner's localhost does not
reach a maintainer's machine. No local-model harness test is required for this
API starter, and none is claimed.

## Optional Guardian

The separately documented self-hosted Guardian assesses trusted review feedback
and can propose corrections and prevention PRs. This workflow does not install or
activate Guardian. Its RoboSats JSON remediation path still needs separate
verification. Adopters provide their own operator, infrastructure, credentials,
trusted-reviewer allowlist, and budget. No ongoing managed service is included.
