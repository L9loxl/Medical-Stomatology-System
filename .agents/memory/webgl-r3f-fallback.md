---
name: react-three-fiber WebGL fallback
description: Headless test browsers lack WebGL; guard r3f Canvas to avoid hard crashes
---

# react-three-fiber needs a WebGL availability guard

The 3D dental chart uses react-three-fiber `<Canvas>`. Before mounting it, the
component checks WebGL support (create a canvas, try `getContext("webgl")`) and
renders a translated fallback message when unavailable.

**Why:** Without the guard, when WebGL is unavailable the `WebGLRenderer`
constructor throws and the Vite runtime-error overlay covers the whole page. The
Playwright-based testing subagent runs a headless browser that has NO WebGL, so
e2e tests on any 3D page fail with "Error creating WebGL context" and block all
later test steps — even though real users' browsers render fine.

**How to apply:** Any r3f / WebGL surface in this app must have a graceful
non-WebGL fallback, both for robustness and so e2e tests can proceed past the
page. Don't treat a headless "Error creating WebGL context" as a code bug.
