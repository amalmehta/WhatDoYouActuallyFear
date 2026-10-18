PROJECT NAME: WhatDoYouActuallyFear

META-INSTRUCTIONS:

<Read it all before acting. Ask about anything unclear, contradictory or
 underspecified — before starting and mid-build. Ask in the question widget
 (AskUserQuestion): related questions batched, concrete options, your
 recommendation first. Plain text only if the widget isn't available.>

<Don't expand scope. Anything not listed here is a proposal, including changes
 to this file — propose it, don't do it.>

<Prefer doing over describing: run the code, write the files, test it.>

<Always in scope, no proposal needed: when it goes on GitHub, a README that is
 easy to read at a glance — a line on what it is, then clear visuals
 (screenshots, a diagram or a chart), then links. Everything else goes in
 linked files: docs/INSTRUCTIONS.md (setup, run, use),
 docs/SYSTEM-DESIGN.md (see below) and docs/FILE-STRUCTURE.md (what's where). If what you're
 building is an application rather than a script, also a small unobtrusive feedback tab, and a settings
 button or tab (⌘, on the Mac) that gathers its preferences in one place.>

<If what you're building is an application, build it as a Mac app first; the
 website comes after, as its own step.>

<When an application takes files as input, offer a visible Upload button that
 opens the file picker, accept files dragged anywhere onto the window (not
 only onto a small drop zone), and accept pasting them with ⌘V.>

<Color-code tags, categories and types by similarity: related ones share a
 hue family, with shades far enough apart to tell them apart at a glance, in
 both light and dark mode.>

<Name things the way a person would say them — "Goal Tracker", not
 goal_tracker — for the app, its windows, titles, files people open, repo
 descriptions and README headings. When you create the GitHub repo, name it
 with no "_" or "-": one word or joined words, e.g. GoalTracker.>

<Always in scope: a system design doc in the codebase, docs/SYSTEM-DESIGN.md,
 kept current as the build changes. Cover the architecture (with a Mermaid
 diagram), each component's job, the main flows, where data lives, the key
 design decisions and their trade-offs, how it's tested, and known limits.>

<Finish by listing every deliverable: path, what it is, how to check it works.>

<Git rules (no Claude attribution, never commit .claude/) are in
 ~/.claude/CLAUDE.md and apply on their own — nothing to repeat here.>

<Keep the changelog at the bottom current.>

CONTEXT:

Project type: Game (something to play).

figure out the fears that are keeping the person stuck in life. and then come up with a game plan to actually face and grow from facing that fear. figure out the source of the fear and come up with an action plan that overcomes it

DELIVERABLES:

a mac app questionaire

OPEN QUESTIONS / ASSUMPTIONS:

Asked and answered (2026-10-12):
- Engine: offline and rule-based. No AI or API key; nothing leaves the Mac.
- Game feel: questionnaire plus a quest plan, with XP, ranks and saved progress.
- GitHub: local git only for now. The README and docs are ready for when it's pushed.

Decided without asking:
- 11 fears in 4 color families (Self-Worth, Other People, Uncertainty, Closeness); 22 weighted statements on a 5-point scale.
- "Source of the fear" = picking one of 6 origins for each of the top 3 fears, plus an optional memory. Each origin gives a root exercise quest.
- Action plan = root quest, then 5 graded exposure steps per fear (unlocking in order), then one final boss built from "what would you do if you weren't afraid?".
- Each quest asks for predicted vs. actual fear (0–10), which shows how much less scary reality was.
- Settings: focus on 1–3 fears, XP on/off, theme, data folder, retake, erase. Feedback is saved locally to Feedback.json.
- No file input, so there's no Upload, drop or paste (the file-input rule doesn't apply).
- SwiftUI on macOS 14+, built with XcodeGen; data stored as JSON in Application Support.
- Website (2026-10-13). Asked: React + Vite, hosted on GitHub Pages, quiz content copied into JS with a parity test. Decided: TypeScript; progress in localStorage; `?demo` shows sample data without saving; feedback is saved in the browser with an optional "Open as GitHub issue"; Settings via the gear button or ⌘, / Ctrl+,; deployed by a GitHub Actions workflow on every push to main.
- Friendlier UI/UX (2026-10-17). Asked: both apps, with warmer copy, softer visuals, gentler pacing and small celebrations; PR #2 merged first. Decided:
  - Look: a warm paper palette (light and dark), rounded system type instead of serif headings, rounder cards with soft shadows, and an emoji for each fear family.
  - Questionnaire: four parts with a breather and a cheer between them, and a parts map instead of one long bar.
  - Quest board: a "Your next step" card first, and a one-time "How quests work" card.
  - Celebrations: one after each finished quest (cheer, fear versus reality, XP, new rank), with no confetti when reduced motion is preferred.
  - Wording: warmer copy throughout, and gentler rank names (Just Starting, Warming Up).
  - Parts, cheers, family emoji and rank names are shared content, so the parity test covers them.
- Area-tailored steps (2026-10-13). Asked: one example line under every step. Decided: 385 hand-written examples, kept in a new Swift file (`AreaExamples.swift`) and copied to the website like the rest of the content. Root and boss quests get none. Quest ids don't change with the area, so progress carries over. UK spelling, to match the questionnaire.
- Export/import (2026-10-13). Asked: in both apps; importing replaces existing progress after a confirmation. Decided: the file is the existing Profile JSON (sorted keys, whole-second dates), named "What Do You Actually Fear Progress.json"; import from Upload buttons (Settings, sidebar or toolbar, welcome screen, File menu ⌘O/⌘E on Mac), dropping a file anywhere, or ⌘V; shows a preview first; each app is tested against fixtures produced by the other.

CHANGELOG:

- 2026-10-12 — created
- 2026-10-12 — built v1 Mac app (questionnaire, fear sources, quest plan, journal, settings, feedback), tests and docs; filled in open questions
- 2026-10-13 — created GitHub repo (public) and pushed
- 2026-10-13 — built the website (React + Vite) with content parity tests and GitHub Pages deploy
- 2026-10-13 — added Export / Import Progress to both apps (one shared file format)
- 2026-10-13 — added a phone screenshot of the website to the README, with a script to recapture it
- 2026-10-13 — added a UI test target for the Mac app (9 XCUITests against a temporary data folder); moved Erase up in Settings so it stays on screen
- 2026-10-13 — Mac unit and UI tests now run in GitHub Actions on a macOS runner
- 2026-10-13 — changes now go through branches and pull requests instead of straight to main
- 2026-10-13 — quest steps now show an example tailored to the chosen life area (both apps)
- 2026-10-17 — friendlier UI/UX in both apps: warmer look and copy, questionnaire in four parts with breathers, a next-step card, a quests intro, and celebrations
- 2026-09-15 — added meta-instruction: built-out applications include a small feedback tab
- 2026-09-15 — added meta-instruction: no "Claude" attribution in commits, PRs, or branches
- 2026-09-16 — added meta-instruction: always include a README when adding to GitHub
- 2026-09-16 — changed meta-instruction: ask clarifying questions in the question widget
- 2026-09-17 — added meta-instructions: Claude never a contributor; never commit .claude/
- 2026-09-26 — compressed the meta-instructions and every field prompt; git rules moved to the global instruction file
- 2026-09-27 — added meta-instruction: applications are built as a Mac app first, then a website
- 2026-09-28 — folded inputs, instructions, constraints, deliverables and done criteria into one free-form CONTEXT
- 2026-09-28 — changed meta-instruction: a README on GitHub always includes a visual
- 2026-09-28 — added meta-instruction: name things like a person would, never snake_case
- 2026-09-28 — changed meta-instruction: README leads with visuals; instructions live in a linked guide
- 2026-09-28 — changed meta-instruction: README is visuals and links; details in docs/INSTRUCTIONS.md and docs/FILE-STRUCTURE.md
- 2026-09-29 — changed meta-instruction: GitHub repo names have no "_" or "-"
- 2026-10-02 — added a DELIVERABLES field after CONTEXT
- 2026-10-02 — added meta-instruction: every project has a system design doc at docs/SYSTEM-DESIGN.md
- 2026-10-05 — added meta-instruction: applications include a settings button or tab
- 2026-10-08 — added meta-instruction: color-code tags by similarity (related share a hue family, each distinct)
- 2026-10-09 — added meta-instruction: apps that take files have an Upload button, drop anywhere, and paste
