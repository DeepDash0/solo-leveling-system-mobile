# THE SYSTEM V6 — original-only sound configuration

The live Solo Leveling-inspired web app has **strict original-audio mode**. No generated or imitation audio is bundled, synthesized, or used as a fallback.

## Current status
- PC2 private Tailscale: http://desktop-7m1b43u.tail4e4e94.ts.net:4186/
- GitHub Pages public: https://deepdash0.github.io/solo-leveling-system-mobile/
- Original sound samples bundled: **0** (no verified redistributable recordings found)
- All events silent until you supply your own permission-cleared actual sound clips

## Use
Open **Settings → Solo Leveling Sound Library**. Select **IMPORT** for an event, choose an authentic audio file, then press **▶** to preview. Volume and SFX mute are on the same screen/header. The imported bytes are kept unchanged inside browser IndexedDB; no copy is uploaded to PC2/GitHub/any server. Remove any entry with ×.

References to potential sample recordings and verification limitations are listed in [AUTHENTIC_SFX_SOURCES.md](./AUTHENTIC_SFX_SOURCES.md). Fan soundboards are not proof of authenticity or a reuse license.

## Compatibility and hosting
The app preserves the existing \`the-system-v1\` JSON/localStorage save file. Audio has a *separate* browser-local IndexedDB store; the GitHub Pages and Tailscale origins have independent audio libraries. The V6 service worker deliberately deletes the earlier V5 audio cache and precaches **no** generated WAV files. The private PC2 Tailscale server starts on Windows login.

## Files
- \`js/authentic-audio.js\`: IndexedDB sound library, file validation, original-bytes-only playback, volume/mute
- \`js/sfx.js\`: existing UI effects and event mappings; no synthesis or fallback
- \`css/authentic-audio.css\`: responsive sound import panel
- \`tools/static-server.js\`: local PC2 server, bound to loopback, proxied through Tailscale
- \`service-worker.js\`: V6 app shell without any bundled sound effects

## Tests
- Existing game rules: \`node --test tests/rules.test.js\`
- Playwright checks from a computer that can reach the PC2 Tailscale hostname.
- Import/remove audio using a temporary test file in a private test browser context. Do not commit test sound files.

The UI is fan-made and unaffiliated with Solo Leveling licensors.
