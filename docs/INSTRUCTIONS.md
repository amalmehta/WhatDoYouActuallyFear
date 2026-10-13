# Instructions

## Requirements

- macOS 14 (Sonoma) or later
- Xcode 16 or later (built and tested with Xcode on macOS 26, Swift 6.3 in Swift 5 language mode)
- [XcodeGen](https://github.com/yonaskolb/XcodeGen) (`brew install xcodegen`), only if you change `project.yml`

## Build and run

```bash
xcodegen generate
```

```bash
xcodebuild -project WhatDoYouActuallyFear.xcodeproj -scheme WhatDoYouActuallyFear -configuration Release -derivedDataPath build build
```

```bash
open "build/Build/Products/Release/What Do You Actually Fear.app"
```

Or open `WhatDoYouActuallyFear.xcodeproj` in Xcode and press ⌘R. To keep it, drag the `.app` into `/Applications`.

## Run the tests

```bash
xcodebuild -project WhatDoYouActuallyFear.xcodeproj -scheme WhatDoYouActuallyFear -derivedDataPath build test
```

## Regenerate the README screenshots

```bash
"build/Build/Products/Debug/What Do You Actually Fear.app/Contents/MacOS/What Do You Actually Fear" --screenshots "$PWD/docs/images"
```

This renders the main screens with sample data, in light and dark mode, and quits.

## Website

Live at **https://amalmehta.github.io/WhatDoYouActuallyFear/** (add `?demo` to see sample answers; nothing is saved in demo mode).

It's in `web/` (React + Vite + TypeScript) and needs Node 20 or later.

```bash
npm --prefix web install
```

```bash
npm --prefix web run dev
```

```bash
npm --prefix web test
```

```bash
npm --prefix web run build
```

- **Phone screenshot for the README:** `node web/scripts/phone-screenshot.mjs` captures the live demo at a 390×844 phone viewport (3×) with Chrome and saves `docs/images/website-phone.png`. You can pass a different URL and output path.
- **Deploying:** every push to `main` runs `.github/workflows/pages.yml`, which tests, builds and publishes `web/dist` to GitHub Pages.
- **Changing quiz content:** edit the Swift files in `App/Model/`, then run `npm --prefix web run copy-content`. The parity test fails until the website's copy matches the Swift.
- **Where website data lives:** in the browser's localStorage (`wdyaf.profile`, `wdyaf.settings`, `wdyaf.feedback`), only on that browser and device.
- **Settings:** the gear button, or ⌘, / Ctrl+, (some browsers keep that shortcut for themselves).
- **Feedback:** saved in the browser. You can also copy it, or open it as a prefilled GitHub issue.

## Using it

The Mac app and the website work the same way.

1. **Begin.** Pick the part of life where you feel most stuck, and (optionally) write what you'd do if you weren't afraid. That becomes your final boss.
2. **Answer 22 statements** on a five-point scale. Press 1–5 to answer, and go back with ⌘[ on the Mac or the Back link on the website.
3. **Find the source.** For each of your top three fears, pick where it most likely started and, if you like, note your earliest memory of it.
4. **See your results.** Your top fears, the belief underneath each one, and a chart of all eleven fears, colored by family.
5. **Play the quest board.** Each fear has a *root* quest (working on where it came from) and five exposure steps, smallest to biggest. They unlock one at a time.
   - **Accept** a quest and rate how scary it feels (0–10).
   - Go and do it, then press **I did it** and rate how scary it actually was.
   - You earn XP and ranks (Frozen → Stirring → Stepping Out → Brave → Bold → Fear Facer), and the header shows how much less scary reality has been than you expected.
6. **Final boss.** It unlocks once you finish every quest for any one fear.

**Moving your progress** (between browsers, or between the website and the Mac app):

- **Export:** Mac app: File → Export Progress… (⌘E), the toolbar's progress-file menu, or Settings. Website: **Export progress** in the sidebar or Settings. Either one saves `What Do You Actually Fear Progress.json`.
- **Import:** Mac app: File → Import Progress… (⌘O), the toolbar menu, Settings, or "Have a progress file? Import it…" on the welcome screen. Website: **Import progress…** in the sidebar or Settings, or the welcome-screen link. In both, you can also drop the file anywhere on the window, or paste it (or its text) with ⌘V when you're not typing in a field.
- You'll see what's in the file (date, top fear, quests done) first. If you already have progress, it asks before replacing your answers, quests and journal.

Other screens:

- **Fear Profile:** how each fear keeps you stuck, the belief underneath it, a reframe, and where it started. Use the toolbar button to retake the questionnaire. Your journal and progress are kept.
- **Journal:** every quest you've finished, with what you feared, what you felt, and your notes.
- **Feedback** (bottom of the sidebar): saves a note to `Feedback.json` in the data folder.
- **Settings** (⌘, or the gear): how many fears to focus on (1–3), show or hide XP and ranks, the theme (light, dark or system), export or import progress, show the data folder, retake, or erase everything.

## Where your data lives

`~/Library/Application Support/What Do You Actually Fear/`

- `Profile.json`: your answers, sources, accepted quests and journal
- `Feedback.json`: feedback you've saved

Nothing leaves your Mac.

This app is a self-reflection tool, not therapy. If fear or anxiety is seriously affecting your life, talk to a licensed professional.
