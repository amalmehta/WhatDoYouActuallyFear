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
│   │   └── Engine.swift             Pure logic: scoring, plan building, unlocking, XP, ranks, fear vs. reality
│   ├── Store/
│   │   └── AppStore.swift           Observable app state, questionnaire flow, JSON load and save
│   ├── Views/
│   │   ├── Theme.swift              Hue-family colors, cards, fear and source tags, bar chart, meter, appearance
│   │   ├── OnboardingViews.swift    Welcome, stuck area and goal, statements, sources, results
│   │   ├── MainViews.swift          Sidebar shell, Quest Board, quest sheet, Fear Profile, Journal
│   │   └── SettingsAndFeedback.swift  Settings (⌘,) and feedback form
│   ├── Support/
│   │   └── ScreenshotRenderer.swift Renders README images from sample data
│   └── Assets.xcassets/             App icon
├── Tests/
│   ├── EngineTests.swift            Content integrity, scoring, plans, unlocking, XP and ranks
│   └── StoreTests.swift             Full questionnaire flow, persistence, retake, erase, feedback
└── docs/
    ├── INSTRUCTIONS.md              Setup, run, use
    ├── SYSTEM-DESIGN.md             Architecture and decisions
    ├── FILE-STRUCTURE.md            This file
    └── images/                      Screenshots and icon used by the README
```

`build/` (Xcode output) and `.claude/` are git-ignored.
