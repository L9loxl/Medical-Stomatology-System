---
name: i18n status label fallback
description: tr() maps snake_case API status values to camelCase i18n keys
---

# Localizing snake_case status values

API status values are snake_case (`in_progress`, `no_show`, `root_canal`), but
i18n keys are camelCase (`inProgress`, `noShow`, `rootCanal`). The `tr()` helper
in `lib/i18n.tsx` does a direct lookup first, then falls back to a snake→camel
conversion before returning the raw key.

**Why:** Pages were calling `tr(record.status)` directly. Without the fallback,
`tr("in_progress")` returned the raw `"in_progress"` string (visible localization
bug) because only `inProgress` existed. Centralizing the conversion in `tr()`
fixed every page at once instead of per-page status maps.

**How to apply:** To localize any snake_case enum/status, just add a camelCase key
to BOTH the `en` and `ar` dicts and call `tr(rawValue)`. No per-call mapping
needed. Every new i18n key must exist in both dictionaries.
