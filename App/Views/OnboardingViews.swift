import SwiftUI

/// Welcome → stuck area & goal → 22 statements → where each top fear came from → reveal.
struct OnboardingView: View {
    @Environment(AppStore.self) private var store
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        ZStack {
            Theme.background(scheme).ignoresSafeArea()
            Group {
                switch store.phase {
                case .welcome: WelcomeView()
                case .area: AreaGoalView()
                case .questions: QuestionView()
                case .sources: SourceQuestionView()
                case .reveal: RevealView()
                case .main: EmptyView()
                }
            }
            .transition(.opacity)
        }
        .animation(.easeInOut(duration: 0.25), value: store.phase)
    }
}

struct WelcomeView: View {
    @Environment(AppStore.self) private var store

    var body: some View {
        VStack(spacing: 22) {
            Image(systemName: "flame")
                .font(.system(size: 54, weight: .light))
                .foregroundStyle(Theme.accent)
            Text("What do you actually fear?")
                .font(.system(size: 40, weight: .bold, design: .serif))
            Text("Answer \(Questions.all.count) quick statements. Find the fears keeping you stuck, where they came from, and a quest plan to face them — one small brave step at a time.")
                .font(.title3)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .frame(maxWidth: 560)
            Button("Begin") { store.start() }
                .accessibilityIdentifier("begin")
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
                .tint(Theme.accent)
                .keyboardShortcut(.defaultAction)
            Label("Everything stays on this Mac.", systemImage: "lock")
                .font(.callout)
                .foregroundStyle(.secondary)
            Button("Have a progress file? Import it…") { store.transferRequest = .importFile }
                .accessibilityIdentifier("importLink")
                .buttonStyle(.link)
                .font(.callout)
        }
        .padding(40)
    }
}

struct AreaGoalView: View {
    @Environment(AppStore.self) private var store

    var body: some View {
        @Bindable var store = store
        VStack(alignment: .leading, spacing: 22) {
            BackButton()
            Text("Where do you feel most stuck?")
                .font(.system(size: 30, weight: .bold, design: .serif))
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 4), spacing: 10) {
                ForEach(LifeArea.allCases) { area in
                    let selected = store.draft.lifeArea == area
                    Button {
                        store.draft.lifeArea = area
                    } label: {
                        VStack(spacing: 8) {
                            Image(systemName: area.symbol).font(.title2)
                            Text(area.title).font(.callout.weight(.medium))
                        }
                        .frame(maxWidth: .infinity, minHeight: 74)
                        .background(RoundedRectangle(cornerRadius: 12).fill(selected ? Theme.accent.opacity(0.18) : Color.primary.opacity(0.04)))
                        .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(selected ? Theme.accent : .clear, lineWidth: 2))
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityIdentifier("area-\(area.rawValue)")
                }
            }
            VStack(alignment: .leading, spacing: 8) {
                Text("If you weren't afraid, what would you do?")
                    .font(.title3.weight(.semibold))
                Text("This becomes your final boss quest. Leave it blank if you're not sure yet.")
                    .foregroundStyle(.secondary)
                TextField("e.g. Apply for the design lead role", text: $store.draft.goal)
                    .textFieldStyle(.roundedBorder)
                    .font(.title3)
                    .accessibilityIdentifier("goalField")
                    .onSubmit { store.phase = .questions }
            }
            HStack {
                Spacer()
                Button("Continue") { store.phase = .questions }
                    .accessibilityIdentifier("continue")
                    .buttonStyle(.borderedProminent)
                    .tint(Theme.accent)
                    .controlSize(.large)
                    .keyboardShortcut(.defaultAction)
            }
        }
        .frame(maxWidth: 720)
        .padding(40)
    }
}

struct QuestionView: View {
    @Environment(AppStore.self) private var store

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            BackButton()
            QuestionCard(index: store.questionIndex,
                         selected: store.draft.answers[Questions.all[store.questionIndex].id]) { store.answer($0) }
        }
        .frame(maxWidth: 760)
        .padding(40)
    }
}

/// One statement with its five-point answer scale. Keys 1–5 answer.
struct QuestionCard: View {
    let index: Int
    let selected: Int?
    let onAnswer: (Int) -> Void

    var body: some View {
        let question = Questions.all[index]
        VStack(alignment: .leading, spacing: 26) {
            VStack(alignment: .leading, spacing: 8) {
                Text("Statement \(index + 1) of \(Questions.all.count)")
                    .accessibilityIdentifier("statementCounter")
                    .font(.callout.weight(.medium))
                    .foregroundStyle(.secondary)
                Meter(fraction: Double(index) / Double(Questions.all.count))
            }
            Text(question.text)
                .font(.system(size: 30, weight: .semibold, design: .serif))
                .fixedSize(horizontal: false, vertical: true)
                .frame(minHeight: 110, alignment: .topLeading)
            Text("How true is this for you?")
                .foregroundStyle(.secondary)
            HStack(spacing: 10) {
                ForEach(Array(Questions.scale.enumerated()), id: \.offset) { value, label in
                    Button { onAnswer(value) } label: {
                        VStack(spacing: 6) {
                            Text("\(value + 1)")
                                .font(.caption.monospacedDigit())
                                .foregroundStyle(.secondary)
                            Text(label).font(.body.weight(.medium))
                        }
                        .frame(maxWidth: .infinity, minHeight: 62)
                        .background(RoundedRectangle(cornerRadius: 12)
                            .fill(selected == value ? Theme.accent.opacity(0.2) : Color.primary.opacity(0.05)))
                        .overlay(RoundedRectangle(cornerRadius: 12)
                            .strokeBorder(selected == value ? Theme.accent : .clear, lineWidth: 2))
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .keyboardShortcut(KeyEquivalent(Character("\(value + 1)")), modifiers: [])
                    .accessibilityIdentifier("answer-\(value)")
                }
            }
            Text("Tip: press 1–5 to answer.")
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
    }
}

struct SourceQuestionView: View {
    @Environment(AppStore.self) private var store
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        @Bindable var store = store
        let fears = store.sourceFears
        let fear = fears[min(store.sourceIndex, fears.count - 1)]
        let chosen = store.draft.sources[fear]
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                BackButton()
                Text("Fear \(store.sourceIndex + 1) of \(fears.count)")
                    .font(.callout.weight(.medium))
                    .foregroundStyle(.secondary)
                FearTag(fear: fear, large: true)
                Text("\(fear.info.summary) Where do you think it started?")
                    .font(.system(size: 26, weight: .semibold, design: .serif))
                    .fixedSize(horizontal: false, vertical: true)
                VStack(spacing: 8) {
                    ForEach(SourceKind.allCases) { source in
                        let isOn = chosen == source
                        Button { store.chooseSource(source) } label: {
                            HStack(alignment: .top, spacing: 12) {
                                Image(systemName: isOn ? "largecircle.fill.circle" : "circle")
                                    .foregroundStyle(isOn ? Theme.color(source, scheme) : .secondary)
                                    .font(.title3)
                                VStack(alignment: .leading, spacing: 3) {
                                    Text(source.title).font(.body.weight(.semibold))
                                    if isOn {
                                        Text(source.howItFormed).foregroundStyle(.secondary)
                                            .fixedSize(horizontal: false, vertical: true)
                                    }
                                }
                                Spacer(minLength: 0)
                            }
                            .padding(12)
                            .background(RoundedRectangle(cornerRadius: 10)
                                .fill(isOn ? Theme.color(source, scheme).opacity(0.14) : Color.primary.opacity(0.04)))
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        .accessibilityIdentifier("source-\(source.rawValue)")
                    }
                }
                TextField("Earliest memory of this fear (optional)", text: Binding(
                    get: { store.draft.sourceNotes[fear] ?? "" },
                    set: { store.draft.sourceNotes[fear] = $0 }), axis: .vertical)
                    .textFieldStyle(.roundedBorder)
                    .lineLimit(2...4)
                HStack {
                    Spacer()
                    Button(store.sourceIndex + 1 < fears.count ? "Next fear" : "Show me my fears") { store.nextSource() }
                        .buttonStyle(.borderedProminent)
                        .tint(Theme.accent)
                        .controlSize(.large)
                        .disabled(chosen == nil)
                        .accessibilityIdentifier("nextSource")
                        .keyboardShortcut(.defaultAction)
                }
            }
            .frame(maxWidth: 720)
            .padding(40)
            .frame(maxWidth: .infinity)
        }
    }
}

struct RevealView: View {
    @Environment(AppStore.self) private var store
    @AppStorage(SettingsKey.focusCount) private var focusCount = 3

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                if let profile = store.profile {
                    RevealContent(profile: profile, focusCount: focusCount)
                }
                Button("Start my quests") {
                    store.page = .board
                    store.phase = .main
                }
                .buttonStyle(.borderedProminent)
                .tint(Theme.accent)
                .controlSize(.large)
                .keyboardShortcut(.defaultAction)
                .accessibilityIdentifier("startQuests")
            }
            .frame(maxWidth: 820)
            .padding(40)
            .frame(maxWidth: .infinity)
        }
    }
}

/// The results screen: top fears, their beliefs, and every fear's score.
struct RevealContent: View {
    let profile: Profile
    let focusCount: Int

    var body: some View {
        let scores = Engine.scores(profile.answers)
        let plan = Engine.plan(for: profile, focusCount: focusCount)
        VStack(alignment: .leading, spacing: 22) {
            VStack(alignment: .leading, spacing: 6) {
                Text("Here's what's actually holding you back")
                    .font(.system(size: 32, weight: .bold, design: .serif))
                Text("Stuck in \(profile.lifeArea.title.lowercased()). These are the fears doing the most work behind the scenes.")
                    .font(.title3)
                    .foregroundStyle(.secondary)
            }
            ForEach(Array(plan.fears.enumerated()), id: \.element.id) { rank, fearPlan in
                let info = fearPlan.fear.info
                VStack(alignment: .leading, spacing: 10) {
                    HStack {
                        Text("#\(rank + 1)").font(.title2.weight(.bold)).foregroundStyle(.secondary)
                        FearTag(fear: fearPlan.fear, large: true)
                        Spacer()
                        Text("\(fearPlan.score.percent)%").font(.title2.weight(.semibold).monospacedDigit())
                    }
                    Text(info.summary).font(.title3)
                    HStack(alignment: .top, spacing: 8) {
                        Text("The belief underneath:").foregroundStyle(.secondary)
                        Text("“\(info.coreBelief)”").italic()
                    }
                    HStack(spacing: 8) {
                        Text("Likely started with:").foregroundStyle(.secondary)
                        SourceTag(source: fearPlan.source)
                    }
                }
                .card()
            }
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Text("All \(FearID.allCases.count) fears").font(.headline)
                    Spacer()
                    FamilyLegend()
                }
                FearBars(scores: scores, highlight: Set(plan.fears.map(\.fear)))
            }
            .card()
        }
    }
}

struct BackButton: View {
    @Environment(AppStore.self) private var store

    var body: some View {
        Button { store.back() } label: {
            Label("Back", systemImage: "chevron.left")
        }
        .buttonStyle(.borderless)
        .keyboardShortcut("[", modifiers: .command)
    }
}
