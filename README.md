# THE SYSTEM — Solo Leveling-inspired browser RPG (V5)

A standalone, static, mobile-first HTML/CSS/JavaScript app. No Base44, servers, build chain, tracking, external APIs, or login required.

## Launch

- Public GitHub Pages: https://deepdash0.github.io/solo-leveling-system-mobile/
- Private PC1 Tailscale: http://100.69.39.83:4186/ (PC1 and Tailscale must be running)
- Open `index.html` using a local HTTP server for local development:
  `python -m http.server 4186`

## Modules

- `index.html`: semantic shell for Status, Quests, Inventory, Gates, Shop and Settings.
- `css/base.css`, `css/experience.css`, `css/fx.css`, `css/sound.css`: base styles, responsive neon UI, effects, sound settings.
- `js/rules.js`: pure testable progression math and shadow extraction rules.
- `js/game.js`: legacy-compatible state, rendering and gameplay commands.
- `js/experience.js`: event-driven quick actions, exercise logger, swipe/hold UX, haptics.
- `js/particles.js`: capped, reduced-motion-aware canvas animation.
- `js/sfx.js` and `sounds/`: Web Audio API and original cinematic WAV sound effects.
- `service-worker.js`: offline shell and sound caching on HTTPS.

## Gameplay

- Daily quest logging: LOG → tap once per completed repetition, hold to rapidly self-report, tap the completed-goal button, or swipe an objective right to log the full target. These controls **do not automatically measure actual exercises**.
- Claim All: available when all quest objectives are satisfied.
- Gate combat: Attack or Mana Strike; successful Gate Clears can randomly extract a Shadow Soldier.
- Shadow Army: idle XP and Gold, capped to 8 hours since the last check, with 12 soldiers max. Rank-dependent drop odds and income.
- Dynamic daily targets: base goals selected in Settings, increased by up to 20% after consecutive claimed days. New targets apply on a **new day**, not during your current quest.
- Quick Heal: Health Potions from a persistent action dock, without opening Inventory.
- Auto-Equip Best: equips the strongest owned weapon and armor if stronger than what is equipped.

## Save compatibility and privacy

- Existing storage key **`the-system-v1`** and version-1 JSON saves remain compatible.
- Import/export is in Settings. **Export a backup before importing, resetting, or clearing browser storage.**
- Shadow and streak fields are additive; older saves are migrated in memory.
- No cloud sync. Different browser origins (public HTTPS vs private Tailscale HTTP) have independent local saves.
- All game progression is fictional, including exercise logging.

## Performance and accessibility

- No third-party runtime dependencies.
- Canvas draws a bounded number of particles; pauses when hidden and respects `prefers-reduced-motion`.
- CSS effects primarily use transforms/opacity; animations can be reduced by operating system settings.
- Web Audio uses a shared compressor and decoded sound buffers; SFX mute/volume is persisted.
- Keyboard shortcuts 1-6 switch tabs; H uses a potion, Q opens quests; Escape closes dialogs.
- Touch targets and a bottom navigation work at 320px and above.

## Tests

```
node --test tests/rules.test.js
python tests/browser_smoke.py
python tests/gameplay_smoke.py
python tests/final_smoke.py
python tests/offline_smoke.py
```

Python browser tests use Playwright + a local Chrome installation. Run `python -m http.server 4186` before browser tests.

## Legal note

Unofficial fan-made UI inspired by Solo Leveling. All sound effects are newly generated originals, not copied from the anime; no official endorsement or affiliation.
