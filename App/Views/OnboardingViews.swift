import SwiftUI

/// Welcome → stuck area & goal → 22 statements in four parts (with breathers) → where each top fear came from → reveal.
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
                case .questions:
                    if let part = store.sectionBreak { BreatherView(part: part) } else { QuestionView() }
                case .sources: SourceQuestionView()
                case .reveal: RevealView()
                case .main: EmptyView()
                }
            }
            .transition(.opacity)
        }
        .animation(.easeInOut(duration: 0.25), value: store.phase)
        .animation(.easeInOut(duration: 0.25), value: store.sectionBreak)
    }
}

struct WelcomeView: View {
    @Environment(AppStore.self) private var store

    var body: some View {
        VStack(spacing: 22) {
            Text("🌱").font(.system(size: 64))
                .accessibilityHidden(true)
            Text("What do you actually fear?")
                .font(.system(size: 40, weight: .bold, design: .rounded))
                .multilineTextAlignment(.center)
            Text("Let's find out together. You'll answer \(Questions.all.count) quick statements (about 5 minutes, and there are no wrong answers). Then you'll get a gentle, step-by-step plan for facing what's been holding you back.")
                .font(.title3)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .frame(maxWidth: 580)
            HStack(spacing: 10) {
                Pill(text: "🔍 Find your fears")
                Pill(text: "🌿 See where they started")
                Pill(text: "🗺️ Get small, doable steps")
            }
            Button("Let's begin") { store.start() }
                .accessibilityIdentifier("begin")
                .buttonStyle(.borderedProminent)
                .controlSize(.extraLarge)
                .tint(Theme.accent)
                .keyboardShortcut(.defaultAction)
            Label("Private: everything stays on this Mac.", systemImage: "lock.fill")
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

/// A small rounded label.
struct Pill: View {
    @Environment(\.colorScheme) private var scheme
    let text: String

    var body: some View {
        Text(text)
            .font(.callout.weight(.medium))
            .padding(.horizontal, 14)
            .padding(.vertical, 8)
            .background(Capsule().fill(Theme.card(scheme)))
            .overlay(Capsule().strokeBorder(.primary.opacity(0.08)))
    }
}

struct AreaGoalView: View {
    @Environment(AppStore.self) private var store

    var body: some View {
        @Bindable var store = store
        VStack(alignment: .leading, spacing: 22) {
            BackButton()
            VStack(alignment: .leading, spacing: 6) {
                Text("First, where do you feel most stuck?")
                    .font(.system(size: 30, weight: .bold, design: .rounded))
                Text("Pick the one that matters most right now. Your quests will include examples for it.")
                    .foregroundStyle(.secondary)
            }
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 12), count: 4), spacing: 12) {
                ForEach(LifeArea.allCases) { area in
                    let selected = store.draft.lifeArea == area
                    Button {
                        store.draft.lifeArea = area
                    } label: {
                        VStack(spacing: 8) {
                            Image(systemName: area.symbol).font(.title2)
                            Text(area.title).font(.callout.weight(.medium))
                        }
                        .frame(maxWidth: .infinity, minHeight: 80)
                        .background(RoundedRectangle(cornerRadius: 16).fill(selected ? Theme.accent.opacity(0.18) : Color.primary.opacity(0.04)))
                        .overlay(RoundedRectangle(cornerRadius: 16).strokeBorder(selected ? Theme.accent : .clear, lineWidth: 2))
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityIdentifier("area-\(area.rawValue)")
                }
            }
            VStack(alignment: .leading, spacing: 8) {
                Text("If you weren't afraid, what would you do?")
                    .font(.title3.weight(.semibold))
                Text("Optional. Whatever you write becomes your final quest, the one everything builds up to.")
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
        .frame(maxWidth: 740)
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
        let partIndex = Questions.section(containing: index)
        let part = Questions.sections[partIndex]
        VStack(alignment: .leading, spacing: 24) {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("Part \(partIndex + 1) of \(Questions.sections.count) · \(part.title)")
                        .font(.callout.weight(.semibold))
                    Spacer()
                    Text("Statement \(index + 1) of \(Questions.all.count)")
                        .accessibilityIdentifier("statementCounter")
                        .font(.callout)
                        .foregroundStyle(.secondary)
                }
                PartsMap(questionIndex: index)
            }
            Text(question.text)
                .font(.system(size: 30, weight: .semibold, design: .rounded))
                .fixedSize(horizontal: false, vertical: true)
                .frame(minHeight: 110, alignment: .topLeading)
            Text("How true is this for you? Go with your first instinct.")
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
                        .frame(maxWidth: .infinity, minHeight: 66)
                        .background(RoundedRectangle(cornerRadius: 16)
                            .fill(selected == value ? Theme.accent.opacity(0.2) : Color.primary.opacity(0.05)))
                        .overlay(RoundedRectangle(cornerRadius: 16)
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

/// A short pause between questionnaire parts.
struct BreatherView: View {
    @Environment(AppStore.self) private var store
    let part: Int

    var body: some View {
        let emoji = ["🌱", "🌿", "🌳"][min(part, 2)]
        VStack(spacing: 20) {
            HStack { BackButton(); Spacer() }
            Spacer()
            Text(emoji).font(.system(size: 64)).accessibilityHidden(true)
            Text("Part \(part + 1) done")
                .font(.system(size: 32, weight: .bold, design: .rounded))
            Text(Questions.sections[part].cheer)
                .font(.title3)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            PartsMap(questionIndex: store.questionIndex)
                .frame(maxWidth: 360)
            Button("Keep going") { store.continueAfterBreak() }
                .accessibilityIdentifier("continueSection")
                .buttonStyle(.borderedProminent)
                .tint(Theme.accent)
                .controlSize(.large)
                .keyboardShortcut(.defaultAction)
            Spacer()
        }
        .frame(maxWidth: 620)
        .padding(40)
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
                if store.sourceIndex == 0 {
                    Text("🎉 " + (Questions.sections.last?.cheer ?? ""))
                        .font(.callout.weight(.medium))
                        .padding(.horizontal, 14)
                        .padding(.vertical, 10)
                        .background(RoundedRectangle(cornerRadius: 12).fill(Theme.accentSoft(scheme)))
                }
                Text("Fear \(store.sourceIndex + 1) of \(fears.count)")
                    .font(.callout.weight(.medium))
                    .foregroundStyle(.secondary)
                FearTag(fear: fear, large: true)
                VStack(alignment: .leading, spacing: 6) {
                    Text("Where might this one have started?")
                        .font(.system(size: 28, weight: .bold, design: .rounded))
                    Text("\(fear.info.summary) There's no wrong answer. Go with what feels closest.")
                        .font(.title3)
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
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
                            .padding(14)
                            .background(RoundedRectangle(cornerRadius: 14)
                                .fill(isOn ? Theme.color(source, scheme).opacity(0.14) : Color.primary.opacity(0.04)))
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        .accessibilityIdentifier("source-\(source.rawValue)")
                    }
                }
                TextField("Earliest memory of this fear (optional, just for you)", text: Binding(
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
                Button("Show me my quests") {
                    store.page = .board
                    store.phase = .main
                }
                .buttonStyle(.borderedProminent)
                .tint(Theme.accent)
                .controlSize(.extraLarge)
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
    @Environment(\.colorScheme) private var scheme
    let profile: Profile
    let focusCount: Int

    var body: some View {
        let scores = Engine.scores(profile.answers)
        let plan = Engine.plan(for: profile, focusCount: focusCount)
        VStack(alignment: .leading, spacing: 22) {
            VStack(alignment: .leading, spacing: 6) {
                Text("Here's what's been holding you back")
                    .font(.system(size: 32, weight: .bold, design: .rounded))
                Text("Stuck in \(profile.lifeArea.title.lowercased()). These are the fears doing the most work behind the scenes.")
                    .font(.title3)
                    .foregroundStyle(.secondary)
            }
            HStack(alignment: .top, spacing: 12) {
                Text("💛").font(.title2).accessibilityHidden(true)
                Text("This isn't a verdict on who you are. Fears are old protectors doing their job a little too well. Next, you'll get small, doable quests that show them you're safe.")
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(RoundedRectangle(cornerRadius: 16).fill(Theme.accentSoft(scheme)))
            ForEach(Array(plan.fears.enumerated()), id: \.element.id) { rank, fearPlan in
                let info = fearPlan.fear.info
                VStack(alignment: .leading, spacing: 10) {
                    HStack {
                        Text(info.family.emoji).font(.title2).accessibilityHidden(true)
                        FearTag(fear: fearPlan.fear, large: true)
                        Spacer()
                        Text("#\(rank + 1)").font(.title3.weight(.bold)).foregroundStyle(.secondary)
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
