# Congratulations

An achievement-first celebration with a trophy, personal recognition, and replayable confetti. Reduced-motion users get the same recognition without animation. The caller owns achievement verification and persistence.

The required query fields are `source`, `date` (YYYY-MM-DD), and `achievement`. Their contract is `src/contracts/celebration.mjs`. No credentials or learning data are accepted. Unknown or duplicate fields are rejected.

The `@expgolemclone/congratulations/celebration` entry provides `celebrationURL`, `celebrationSearch`, and `parseCelebration`. Consumers pin `expgolemclone-congratulations-<version>.tgz` from a GitHub Release. Internal file paths and the package root are not public entries. The deployed URL remains `https://kakomonn-congratulations.kakomonn.workers.dev/`.

```js
import { celebrationURL } from '@expgolemclone/congratulations/celebration';
```

`@expgolemclone/congratulations/feedback` exports the short correct-answer feedback: secure rarity selection, copy, visuals, chimes, five local MP3 assets, and a gesture-prepared player. Callers own correctness, score persistence, duplicate prevention, KPI speech and navigation. `prepare()` must run during the save/answer gesture; await `play()` before starting the next question. Audio failures are explicit and never select another playback method.

Consumers must preserve relative module and asset paths when bundling or copying the feedback directory. The React/Mantine celebration screen is deployment-only, not part of the package.

## Acknowledgements

Built with [React](https://react.dev/), [Mantine](https://mantine.dev/),
[canvas-confetti](https://github.com/catdad/canvas-confetti), and [Vite](https://vite.dev/).

## Development and testing

Run the complete local build and browser suite from the repository root.

```bash
npm test
```

The suite verifies public exports, package contents and the complete browser suite. Feedback uses real audio in Chromium. Windows Playwright WebKit has no media decoder backend: its feedback scheduling uses a controlled media clock, and a separate native playback test verifies the explicit decoding error. This does not replace audio verification on an actual iPhone. Before publishing, pack into `C:/dev/tmp/congratulations-release-<timestamp>`, install that tgz into an isolated consumer there, and verify the public entry. Publish the tgz as a GitHub Release `v<version>` from the tested, synchronized `main` SHA, then update consumers to its fixed release URL. Remove the temporary directory after verification.

Deployment and production browser checks run together:

```bash
npm run deploy
```
