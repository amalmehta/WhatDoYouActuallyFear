import SwiftUI

struct RootView: View {
    @Environment(AppStore.self) private var store
    @AppStorage(SettingsKey.appearance) private var appearance = Appearance.system.rawValue
    @State private var showImporter = false
    @State private var showExporter = false

    var body: some View {
        Group {
            if store.phase == .main, store.profile != nil {
                MainView()
            } else {
                OnboardingView()
            }
        }
        .frame(minWidth: 920, minHeight: 660)
        .onAppear { (Appearance(rawValue: appearance) ?? .system).apply() }
        .onChange(of: appearance) { _, new in (Appearance(rawValue: new) ?? .system).apply() }
        .modifier(ProgressTransfer(showImporter: $showImporter, showExporter: $showExporter, acceptsDropAndPaste: true))
        .onChange(of: store.transferRequest) { _, request in
            switch request {
            case .importFile: showImporter = true
            case .exportFile: showExporter = store.profile != nil
            case nil: break
            }
            store.transferRequest = nil
        }
    }
}

struct MainView: View {
    @Environment(AppStore.self) private var store
    @State private var showFeedback = false

    var body: some View {
        @Bindable var store = store
        NavigationSplitView {
            List(AppStore.Page.allCases, selection: Binding(get: { store.page }, set: { if let p = $0 { store.page = p } })) { page in
                Label(page.rawValue, systemImage: page.symbol).tag(page)
            }
            .navigationSplitViewColumnWidth(min: 180, ideal: 200)
            .safeAreaInset(edge: .bottom) {
                Button { showFeedback = true } label: {
                    Label("Feedback", systemImage: "bubble.left")
                        .font(.callout)
                        .foregroundStyle(.secondary)
                }
                .buttonStyle(.plain)
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .help("Send feedback about the app")
            }
        } detail: {
            switch store.page {
            case .board: QuestBoardView()
            case .profile: FearProfileView()
            case .journal: JournalView()
            }
        }
        .navigationTitle(store.page.rawValue)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Menu {
                    Button("Export Progress…") { store.transferRequest = .exportFile }
                    Button("Import Progress…") { store.transferRequest = .importFile }
                } label: {
                    Label("Progress File", systemImage: "arrow.up.arrow.down.square")
                }
                .help("Export or import your progress (also works by dropping or pasting a file)")
            }
            ToolbarItem(placement: .primaryAction) {
                SettingsLink { Label("Settings", systemImage: "gearshape") }
                    .help("Settings (⌘,)")
            }
        }
        .sheet(isPresented: $showFeedback) { FeedbackView() }
    }
}

// MARK: Quest Board

struct QuestBoardView: View {
    @Environment(AppStore.self) private var store
    @Environment(\.colorScheme) private var scheme
    @AppStorage(SettingsKey.focusCount) private var focusCount = 3
    @AppStorage(SettingsKey.showXP) private var showXP = true
    @State private var selected: Quest?

    var body: some View {
        ScrollView {
            if let profile = store.profile {
                QuestBoardContent(profile: profile, focusCount: focusCount, showXP: showXP) { selected = $0 }
                    .padding(28)
                    .frame(maxWidth: 900)
                    .frame(maxWidth: .infinity)
            }
        }
        .background(Theme.background(scheme))
        .sheet(item: $selected) { QuestSheet(quest: $0) }
    }
}

struct QuestBoardContent: View {
    let profile: Profile
    let focusCount: Int
    let showXP: Bool
    var onSelect: (Quest) -> Void = { _ in }

    var body: some View {
        let plan = Engine.plan(for: profile, focusCount: focusCount)
        VStack(alignment: .leading, spacing: 20) {
            ProgressHeader(profile: profile, showXP: showXP)
            ForEach(plan.fears) { fearPlan in
                VStack(alignment: .leading, spacing: 12) {
                    HStack(spacing: 10) {
                        FearTag(fear: fearPlan.fear, large: true)
                        Text("\(fearPlan.score.percent)%").font(.headline.monospacedDigit()).foregroundStyle(.secondary)
                        Spacer()
                        let done = fearPlan.quests.filter { profile.completions[$0.id] != nil }.count
                        Text("\(done) of \(fearPlan.quests.count) faced").font(.callout).foregroundStyle(.secondary)
                    }
                    Text(fearPlan.fear.info.reframe)
                        .font(.callout)
                        .foregroundStyle(.secondary)
                    VStack(spacing: 0) {
                        ForEach(fearPlan.quests) { quest in
                            QuestRow(quest: quest, status: Engine.status(of: quest, in: plan, profile: profile),
                                     showXP: showXP, onSelect: onSelect)
                            if quest.id != fearPlan.quests.last?.id { Divider().padding(.leading, 44) }
                        }
                    }
                }
                .card()
            }
            if let boss = plan.boss {
                BossCard(quest: boss, status: Engine.status(of: boss, in: plan, profile: profile),
                         showXP: showXP, onSelect: onSelect)
            }
        }
    }
}

struct ProgressHeader: View {
    let profile: Profile
    let showXP: Bool

    var body: some View {
        let xp = Engine.xp(profile)
        let rank = Engine.rank(for: xp)
        HStack(alignment: .center, spacing: 24) {
            if showXP {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Rank").font(.caption).foregroundStyle(.secondary)
                    Text(rank.title).font(.system(size: 26, weight: .bold, design: .serif))
                    if let next = rank.next {
                        Meter(fraction: Double(xp - rank.floor) / Double(next - rank.floor))
                            .frame(width: 220)
                        Text("\(xp) XP · \(next - xp) to next rank").font(.caption).foregroundStyle(.secondary)
                    } else {
                        Text("\(xp) XP · top rank").font(.caption).foregroundStyle(.secondary)
                    }
                }
                Divider().frame(height: 70)
            }
            VStack(alignment: .leading, spacing: 6) {
                Text("Fear vs. reality").font(.caption).foregroundStyle(.secondary)
                    .accessibilityIdentifier("reliefTitle")
                if let relief = Engine.averageRelief(profile) {
                    Text(relief > 0
                         ? "Reality has been \(String(format: "%.1f", relief)) points less scary than you expected."
                         : "You're facing it head-on. Keep logging how it really felt.")
                        .font(.title3.weight(.medium))
                        .fixedSize(horizontal: false, vertical: true)
                } else {
                    Text("Accept a quest, rate how scary it feels, then do it. You'll see how your fear compares to what really happens.")
                        .font(.callout)
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            Spacer(minLength: 0)
        }
        .card()
    }
}

struct QuestRow: View {
    @Environment(\.colorScheme) private var scheme
    let quest: Quest
    let status: QuestStatus
    let showXP: Bool
    let onSelect: (Quest) -> Void

    var body: some View {
        let color = Theme.color(quest.fear, scheme)
        HStack(alignment: .top, spacing: 12) {
            statusIcon(color: color).frame(width: 32)
            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 8) {
                    if quest.kind == .source {
                        Text("ROOT").font(.caption2.weight(.bold)).foregroundStyle(.secondary)
                    } else if case .step(let n) = quest.kind {
                        Text("STEP \(n)").font(.caption2.weight(.bold)).foregroundStyle(.secondary)
                    }
                    Text(quest.title).font(.body.weight(.semibold))
                }
                Text(quest.detail)
                    .font(.callout)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .opacity(status == .locked ? 0.5 : 1)
            Spacer(minLength: 8)
            VStack(alignment: .trailing, spacing: 6) {
                if showXP {
                    Text("+\(quest.xp) XP").font(.caption.weight(.semibold).monospacedDigit()).foregroundStyle(.secondary)
                }
                action
            }
        }
        .padding(.vertical, 10)
    }

    @ViewBuilder private func statusIcon(color: Color) -> some View {
        switch status {
        case .done: Image(systemName: "checkmark.circle.fill").font(.title2).foregroundStyle(color)
        case .accepted: Image(systemName: "flame.fill").font(.title2).foregroundStyle(color)
        case .available: Image(systemName: "circle").font(.title2).foregroundStyle(color)
        case .locked: Image(systemName: "lock.fill").font(.title3).foregroundStyle(.tertiary)
        }
    }

    @ViewBuilder private var action: some View {
        switch status {
        case .available:
            Button("Accept") { onSelect(quest) }.controlSize(.small)
                .accessibilityIdentifier("questAction-\(quest.id)")
        case .accepted:
            Button("I did it") { onSelect(quest) }.controlSize(.small).buttonStyle(.borderedProminent).tint(Theme.accent)
                .accessibilityIdentifier("questAction-\(quest.id)")
        case .done(let c):
            Button { onSelect(quest) } label: {
                Text("feared \(c.predicted) → felt \(c.actual)").font(.caption.monospacedDigit())
            }
            .buttonStyle(.plain)
            .foregroundStyle(.secondary)
            .accessibilityIdentifier("questAction-\(quest.id)")
            .help("Expected \(c.predicted)/10, actually \(c.actual)/10")
        case .locked:
            EmptyView()
        }
    }
}

struct BossCard: View {
    @Environment(\.colorScheme) private var scheme
    let quest: Quest
    let status: QuestStatus
    let showXP: Bool
    let onSelect: (Quest) -> Void

    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            Image(systemName: status == .locked ? "lock.shield" : "crown.fill")
                .font(.system(size: 34))
                .foregroundStyle(status == .locked ? AnyShapeStyle(.tertiary) : AnyShapeStyle(Theme.accent))
            VStack(alignment: .leading, spacing: 6) {
                Text("FINAL BOSS").font(.caption.weight(.bold)).foregroundStyle(.secondary)
                Text(quest.title).font(.system(size: 22, weight: .bold, design: .serif))
                Text(quest.detail).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
                if status == .locked {
                    Text("Unlocks when you've finished every quest for one fear.")
                        .font(.caption).foregroundStyle(.tertiary)
                }
            }
            Spacer()
            QuestRow(quest: quest, status: status, showXP: showXP, onSelect: onSelect).hiddenRowActions
        }
        .card(padding: 22)
        .overlay(RoundedRectangle(cornerRadius: 14).strokeBorder(Theme.accent.opacity(status == .locked ? 0.15 : 0.6), lineWidth: 1.5))
    }
}

private extension QuestRow {
    /// Only the trailing XP + action column, for the boss card.
    var hiddenRowActions: some View {
        VStack(alignment: .trailing, spacing: 6) {
            if showXP {
                Text("+\(quest.xp) XP").font(.caption.weight(.semibold).monospacedDigit()).foregroundStyle(.secondary)
            }
            action
        }
    }
}

/// Accept a quest (rate how scary it feels) or log that you did it (rate how it really felt).
struct QuestSheet: View {
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    let quest: Quest
    @State private var rating = 5.0
    @State private var note = ""

    var body: some View {
        let status: QuestStatus = store.profile.map { profile in
            Engine.status(of: quest, in: Engine.plan(for: profile, focusCount: Engine.maxFocus), profile: profile)
        } ?? .locked
        VStack(alignment: .leading, spacing: 16) {
            FearTag(fear: quest.fear)
            Text(quest.title).font(.system(size: 24, weight: .bold, design: .serif))
            Text(quest.detail).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
            Divider()
            switch status {
            case .available:
                ratingSlider("How scary does this feel right now?")
                buttons(primary: "Accept quest") { store.accept(quest, predicted: Int(rating)) }
            case .accepted(let predicted):
                Text("You expected this to be \(predicted)/10 scary.").foregroundStyle(.secondary)
                ratingSlider("How scary was it actually?")
                TextField("What happened? What did you learn? (optional)", text: $note, axis: .vertical)
                    .textFieldStyle(.roundedBorder)
                    .accessibilityIdentifier("questNote")
                    .lineLimit(3...6)
                buttons(primary: "I did it", secondary: ("Give up this quest", { store.undo(quest) })) {
                    store.complete(quest, actual: Int(rating), note: note)
                }
            case .done(let c):
                Text("Done \(c.date.formatted(date: .abbreviated, time: .omitted)). Feared \(c.predicted)/10, felt \(c.actual)/10.")
                if !c.note.isEmpty { Text(c.note).italic() }
                buttons(primary: "Close", secondary: ("Mark as not done", { store.undo(quest) })) {}
            case .locked:
                Text("Finish the quest before this one to unlock it.").foregroundStyle(.secondary)
                buttons(primary: "Close") {}
            }
        }
        .padding(26)
        .frame(width: 480)
    }

    private func ratingSlider(_ label: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(label).font(.headline)
                Spacer()
                Text("\(Int(rating))/10").font(.headline.monospacedDigit())
            }
            Slider(value: $rating, in: 0...10, step: 1) {
                EmptyView()
            } minimumValueLabel: {
                Text("calm").font(.caption)
            } maximumValueLabel: {
                Text("terrified").font(.caption)
            }
            .accessibilityIdentifier("ratingSlider")
        }
    }

    private func buttons(primary: String, secondary: (String, () -> Void)? = nil, action: @escaping () -> Void) -> some View {
        HStack {
            if let secondary {
                Button(secondary.0, role: .destructive) { secondary.1(); dismiss() }
            }
            Spacer()
            Button("Cancel") { dismiss() }.keyboardShortcut(.cancelAction)
            Button(primary) { action(); dismiss() }
                .accessibilityIdentifier("questPrimary")
                .buttonStyle(.borderedProminent)
                .tint(Theme.accent)
                .keyboardShortcut(.defaultAction)
        }
    }
}

// MARK: Fear Profile

struct FearProfileView: View {
    @Environment(AppStore.self) private var store
    @Environment(\.colorScheme) private var scheme
    @AppStorage(SettingsKey.focusCount) private var focusCount = 3

    var body: some View {
        ScrollView {
            if let profile = store.profile {
                FearProfileContent(profile: profile, focusCount: focusCount)
                    .padding(28)
                    .frame(maxWidth: 900)
                    .frame(maxWidth: .infinity)
            }
        }
        .background(Theme.background(scheme))
        .toolbar {
            ToolbarItem {
                Button { store.start() } label: { Label("Retake the questionnaire", systemImage: "arrow.counterclockwise") }
                    .help("Retake the questionnaire (your journal is kept)")
            }
        }
    }
}

struct FearProfileContent: View {
    let profile: Profile
    let focusCount: Int

    var body: some View {
        let plan = Engine.plan(for: profile, focusCount: focusCount)
        VStack(alignment: .leading, spacing: 20) {
            ForEach(plan.fears) { fearPlan in
                let info = fearPlan.fear.info
                VStack(alignment: .leading, spacing: 14) {
                    HStack {
                        FearTag(fear: fearPlan.fear, large: true)
                        Spacer()
                        Text("\(fearPlan.score.percent)%").font(.title3.weight(.semibold).monospacedDigit())
                    }
                    Text(info.summary).font(.title3)
                    section("How it keeps you stuck") {
                        ForEach(info.howItKeepsYouStuck, id: \.self) { Text("•  \($0)") }
                    }
                    section("The belief underneath") { Text("“\(info.coreBelief)”").italic() }
                    section("Try this instead") { Text(info.reframe) }
                    section("Where it likely started") {
                        SourceTag(source: fearPlan.source)
                        Text(fearPlan.source.howItFormed).foregroundStyle(.secondary)
                        if let note = profile.sourceNotes[fearPlan.fear], !note.isEmpty {
                            Text("Your memory: \(note)").italic().foregroundStyle(.secondary)
                        }
                    }
                }
                .card()
            }
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Text("All fears").font(.headline)
                    Spacer()
                    FamilyLegend()
                }
                FearBars(scores: Engine.scores(profile.answers), highlight: Set(plan.fears.map(\.fear)))
            }
            .card()
        }
    }

    private func section<Content: View>(_ title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(title.uppercased()).font(.caption.weight(.bold)).foregroundStyle(.secondary)
            content().fixedSize(horizontal: false, vertical: true)
        }
    }
}

// MARK: Journal

struct JournalView: View {
    @Environment(AppStore.self) private var store
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        let entries = (store.profile?.completions.values.sorted { $0.date > $1.date }) ?? []
        Group {
            if entries.isEmpty {
                ContentUnavailableView("No quests faced yet", systemImage: "book.closed",
                                       description: Text("Finished quests and what you learned from them show up here."))
            } else {
                ScrollView {
                    VStack(alignment: .leading, spacing: 12) {
                        ForEach(Array(entries.enumerated()), id: \.offset) { _, entry in
                            VStack(alignment: .leading, spacing: 8) {
                                HStack {
                                    FearTag(fear: entry.fear)
                                    Text(entry.title).font(.headline)
                                    Spacer()
                                    Text(entry.date.formatted(date: .abbreviated, time: .omitted))
                                        .font(.callout).foregroundStyle(.secondary)
                                }
                                HStack(spacing: 16) {
                                    Label("Feared \(entry.predicted)/10", systemImage: "cloud.bolt")
                                    Label("Felt \(entry.actual)/10", systemImage: "sun.max")
                                }
                                .font(.callout)
                                .foregroundStyle(.secondary)
                                if !entry.note.isEmpty { Text(entry.note) }
                            }
                            .card(padding: 14)
                        }
                    }
                    .padding(28)
                    .frame(maxWidth: 900)
                    .frame(maxWidth: .infinity)
                }
            }
        }
        .background(Theme.background(scheme))
    }
}
