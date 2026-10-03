# Congratulations

Shared static celebrations for any application. The caller owns achievement verification and persistence.

The required query fields are `source`, `date` (YYYY-MM-DD), and `achievement`. Their contract is `src/contracts/celebration.mjs`. No credentials or learning data are accepted. Unknown or duplicate fields are rejected.

The `@expgolemclone/congratulations/celebration` entry provides `celebrationURL`, `celebrationSearch`, and `parseCelebration`. Consumers pin `expgolemclone-congratulations-<version>.tgz` from a GitHub Release. Internal file paths and the package root are not public entries. The deployed URL remains `https://kakomonn-congratulations.kakomonn.workers.dev/`.

```js
import { celebrationURL } from '@expgolemclone/congratulations/celebration';
```

`@expgolemclone/congratulations/feedback` exports the short correct-answer feedback: secure rarity selection, copy, visuals, chimes, five local MP3 assets, and a gesture-prepared player. Callers own correctness, score persistence, duplicate prevention, KPI speech and navigation. `prepare()` must run during the save/answer gesture; await `play()` before starting the next question. Audio failures are explicit and never select another playback method.

## Source layout

- `src/contracts/`: public celebration URL contract.
- `src/achievement/`: full-page shell, experience selection, manifest and frame runtime.
- `src/feedback/`: reusable short feedback and its audio assets.
- `tests/contracts/`, `tests/achievement/`, `tests/feedback/`: matching verification suites.
- `tests/helpers/`: shared browser server.
- `public/`: static delivery configuration and versioned vendors.
- `experiences/`: deployable third-party snapshots, not included in the package.
- `dist/`: generated deployment output.

The package contains only the contract and feedback sources/assets. Consumers bundle or copy the feedback directory as one unit, preserving relative module and asset paths. Reader bundles the five MP3s as data URLs; smec-second serves them with its own public static assets.

The shell reveals the selected iframe as soon as navigation starts and keeps a
small loading status over it until the experience announces readiness. The
Perigee particle field initializes after the first paint, pauses while the page
is hidden, renders at no more than 30 fps, caps DPR at 1.5, and uses half of its
previous mobile particle count.

Deployable experience snapshots live in `experiences/` and are listed in
`src/achievement/experiences.json`. The locally cloned design references in `upstreams/` are
ignored by the parent repository and are not part of the production build.

## Acknowledgements

Congratulations is built on a wonderful collection of open-source design
experiences created by [bswxyz](https://github.com/bswxyz). A heartfelt thank
you for sharing this work and making these celebrations possible.

| Experience | Source repository |
| --- | --- |
| Aperture Lab | [bswxyz/aperture-lab](https://github.com/bswxyz/aperture-lab) |
| Conche | [bswxyz/conche](https://github.com/bswxyz/conche) |
| Driftline Ocean | [bswxyz/driftline-ocean](https://github.com/bswxyz/driftline-ocean) |
| Fathom | [bswxyz/fathom](https://github.com/bswxyz/fathom) |
| Chroma | [bswxyz/formwork-chroma](https://github.com/bswxyz/formwork-chroma) |
| Contour | [bswxyz/formwork-contour](https://github.com/bswxyz/formwork-contour) |
| Heliodon | [bswxyz/formwork-heliodon](https://github.com/bswxyz/formwork-heliodon) |
| Isometria | [bswxyz/formwork-isometria](https://github.com/bswxyz/formwork-isometria) |
| Meridian | [bswxyz/formwork-meridian](https://github.com/bswxyz/formwork-meridian) |
| Nebula Drift | [bswxyz/formwork-nebula](https://github.com/bswxyz/formwork-nebula) |
| Neon Sprawl | [bswxyz/formwork-neon](https://github.com/bswxyz/formwork-neon) |
| Glyphica | [bswxyz/glyphica](https://github.com/bswxyz/glyphica) |
| Halcyon Ring | [bswxyz/halcyon-ring](https://github.com/bswxyz/halcyon-ring) |
| Halfstep | [bswxyz/halfstep](https://github.com/bswxyz/halfstep) |
| Northbound | [bswxyz/northbound-ev](https://github.com/bswxyz/northbound-ev) |
| Perigee | [bswxyz/perigee-astro](https://github.com/bswxyz/perigee-astro) |

The snapshots are adapted under the MIT License. Copyright and license notices
are preserved in each experience's `LICENSE` file.

### Third-party software

The deployed experiences and their snapshot builds also use the following
open-source projects and resources.

Runtime fonts, GSAP, and Three.js are served from versioned local assets under
`public/vendor/`. Font and Three.js licenses, plus the GSAP package metadata and
license reference, are deployed with those assets.

| Purpose | Source repository |
| --- | --- |
| Animation runtime | [greensock/GSAP](https://github.com/greensock/GSAP) |
| 3D rendering runtime | [mrdoob/three.js](https://github.com/mrdoob/three.js) |
| Glyphica snapshot framework | [vercel/next.js](https://github.com/vercel/next.js) |
| Glyphica UI runtime | [react/react](https://github.com/react/react) |
| Conche snapshot framework | [withastro/astro](https://github.com/withastro/astro) |
| Halfstep snapshot and Congratulations build tooling | [vitejs/vite](https://github.com/vitejs/vite) |
| Web fonts | [google/fonts](https://github.com/google/fonts) |

## Development and testing

Run the complete local build and browser suite from the repository root.

```bash
npm test
```

The suite verifies public exports, package contents and the complete browser suite. Feedback uses real audio in Chromium. Windows Playwright WebKit has no media decoder backend: its feedback scheduling uses a controlled media clock, and a separate native playback test verifies the explicit decoding error. This does not replace audio verification on an actual iPhone. Before publishing, pack into `C:/dev/tmp/congratulations-release-<timestamp>`, install that tgz into an isolated consumer there, and verify the public entry. Publish the tgz as a GitHub Release `v<version>` from the tested, synchronized `main` SHA, then update consumers to its fixed release URL. Remove the temporary directory after verification.

The production URL is
`https://kakomonn-congratulations.kakomonn.workers.dev/`. Deployment and the
production browser checks are contained in one command.

```bash
npm run deploy
```
