# File Structure

```
WhatDoYouActuallyFear/
├── WhatDoYouActuallyFear.md         Project brief (spec, open questions, changelog)
├── README.md                        At-a-glance overview with screenshots
├── project.yml                      XcodeGen spec → WhatDoYouActuallyFear.xcodeproj
├── App/
│   ├── WhatDoYouActuallyFearApp.swift   App entry: main window, Settings scene, menu commands, --screenshots flag
│   ├── Model/
│   │   ├── Fear.swift               Fear IDs and families, source kinds (with root exercises), life areas
│   │   ├── FearLibrary.swift        Content for all 11 fears: summary, belief, reframe, 5-step ladder
│   │   ├── Questions.swift          The 22 statements and how each one weights the fears
│   │   ├── Profile.swift            Saved data: answers, sources, accepted quests, completions; feedback entries
│   │   ├── Engine.swift             Pure logic: scoring, plan building, unlocking, XP, ranks, fear vs. reality
│   │   └── ProgressFile.swift       Progress file shared with the website: encode, decode, validate, preview
│   ├── Store/
│   │   └── AppStore.swift           Observable app state, questionnaire flow, JSON load and save
│   ├── Views/
│   │   ├── Theme.swift              Hue-family colors, cards, fear and source tags, bar chart, meter, appearance
│   │   ├── OnboardingViews.swift    Welcome, stuck area and goal, statements, sources, results
│   │   ├── MainViews.swift          Sidebar shell, Quest Board, quest sheet, Fear Profile, Journal
│   │   ├── SettingsAndFeedback.swift  Settings (⌘,) and feedback form
│   │   └── ProgressTransfer.swift   Export and import: file panels, confirmation, drop anywhere, ⌘V paste
│   ├── Support/
│   │   └── ScreenshotRenderer.swift Renders README images from sample data
│   └── Assets.xcassets/             App icon
├── web/                             The website (React + Vite + TypeScript)
│   ├── index.html                   Page shell
│   ├── vite.config.ts               Build config (base path /WhatDoYouActuallyFear/) and test setup
│   ├── scripts/
│   │   ├── swift-content.mjs        Reads the quiz content out of App/Model/*.swift
│   │   ├── copy-content.mjs         `npm run copy-content`: writes src/model/content.ts from the Swift
│   │   └── phone-screenshot.mjs     Captures the README's phone screenshot through Chrome device emulation
│   ├── public/icon.png              Favicon
│   └── src/
│       ├── main.tsx                 Entry: injects theme colors, ?demo switch, renders App
│       ├── App.tsx                  State (useReducer), saving, theme, ⌘, shortcut, dialogs
│       ├── styles.css               Layout, light and dark tokens, phone layout
│       ├── model/
│       │   ├── content.ts           Copied quiz content (fears, questions, sources, XP rules)
│       │   ├── types.ts             Shared types; Profile matches the Mac app's JSON
│       │   ├── engine.ts            Port of Engine.swift
│       │   ├── store.ts             Reducer, localStorage, feedback
│       │   ├── progress.ts          Progress file shared with the Mac app: export, parse, validate, preview
│       │   ├── theme.ts             Hue-family colors as CSS variables
│       │   └── demo.ts              Sample profile for ?demo and screenshots
│       ├── views/
│       │   ├── Common.tsx           Store context, tags, bars, meter, modal
│       │   ├── Onboarding.tsx       Welcome, area and goal, statements, sources, results
│       │   ├── Main.tsx             Sidebar shell, Quest Board, quest dialog, Fear Profile, Journal
│       │   ├── SettingsFeedback.tsx Settings and feedback dialogs
│       │   └── ProgressTransfer.tsx Export and import: file picker, confirmation, drop anywhere, paste
│       └── test/                    Parity, engine, progress-file and full-UI tests (Vitest + Testing Library)
├── .github/workflows/pages.yml      Tests, builds and deploys the website to GitHub Pages
├── Tests/
│   ├── EngineTests.swift            Content integrity, scoring, plans, unlocking, XP and ranks
│   ├── StoreTests.swift             Full questionnaire flow, persistence, retake, erase, feedback
│   ├── ProgressFileTests.swift      Progress file: format, website compatibility, validation, import
│   └── Fixtures/                    Progress from Mac.json and Progress from Website.json (each app's real output)
└── docs/
    ├── INSTRUCTIONS.md              Setup, run, use
    ├── SYSTEM-DESIGN.md             Architecture and decisions
    ├── FILE-STRUCTURE.md            This file
    └── images/                      Screenshots and icon used by the README
```

`build/` (Xcode output), `web/node_modules/`, `web/dist/` and `.claude/` are git-ignored.
