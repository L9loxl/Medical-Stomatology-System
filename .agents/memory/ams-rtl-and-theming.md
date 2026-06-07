---
name: AMS RTL & accent theming
description: How Arabic RTL and the whole-UI accent tint work in the AMS app; non-obvious gotchas.
---

# Arabic RTL — do NOT add `flex-row-reverse`
i18n sets `dir="rtl"` on `<html>` in Arabic, which already mirrors flex rows. Adding `flex-row-reverse`
on top of `dir=rtl` is a DOUBLE flip → sidebar stays on the LEFT (the bug users report).

**Rule:** rely on `dir=rtl` + logical Tailwind utilities (`border-e`/`border-s`, `ms-*`/`me-*`, `ps-*`/`pe-*`,
`start-0`/`end-0`) for direction-aware layout. Never gate layout direction on an `isRTL && "flex-row-reverse"` toggle.
`isRTL` is still fine for things logical props can't express (e.g. flipping a chevron with `rotate-180`,
or a transform x-offset sign on hover).

# Whole-UI accent tint (the "make it ~80% green" request)
`accent-provider.tsx` `applyAccent` writes CSS vars (`--background/--card/--popover/--muted/--accent/--secondary/--sidebar/--border/--chart-1` + primary tokens)
derived from the accent's HUE, with separate light/dark value sets chosen by `document.documentElement.classList.contains("dark")`.
Inline styles on `<html>` override the static `:root`/`.dark` CSS, so on theme toggle they MUST be recomputed —
a `MutationObserver` on the html `class` attribute reapplies `applyAccent(accent)`. Safe (watches `class`, writes `style`, no loop).

**Why:** users expect choosing an accent to retint the whole app, not just the primary button.
**How to apply:** add new accents to `ACCENT_COLORS`; the settings picker auto-renders them. Keep `DEFAULT_ACCENT` = sky by id so existing default branding is unchanged.
