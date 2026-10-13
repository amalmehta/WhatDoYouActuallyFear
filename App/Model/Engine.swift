import Foundation

struct FearScore: Identifiable, Equatable {
    let fear: FearID
    /// 0...100
    let percent: Int
    var id: FearID { fear }
}

struct Quest: Identifiable, Equatable {
    enum Kind: Equatable { case source, step(Int), boss }
    let id: String
    let fear: FearID
    let kind: Kind
    let title: String
    let detail: String
    let xp: Int
}

enum QuestStatus: Equatable {
    case locked, available, accepted(predicted: Int), done(QuestCompletion)
}

struct FearPlan: Identifiable, Equatable {
    let score: FearScore
    let source: SourceKind
    let quests: [Quest]
    var id: FearID { score.fear }
    var fear: FearID { score.fear }
}

struct GamePlan: Equatable {
    let fears: [FearPlan]
    let boss: Quest?
}

struct Rank: Equatable {
    let title: String
    let floor: Int
    /// XP needed for the next rank, nil at the top.
    let next: Int?
}

/// Pure logic: scoring, plan building, quest unlocking and XP. No UI, no disk.
enum Engine {
    static let stepXP = [10, 20, 40, 70, 110]
    static let sourceXP = 30
    static let bossXP = 200
    static let maxFocus = 3

    static let ranks: [(Int, String)] = [
        (0, "Frozen"), (50, "Stirring"), (150, "Stepping Out"),
        (300, "Brave"), (600, "Bold"), (1000, "Fear Facer"),
    ]

    // MARK: Scoring

    /// Each fear's score is the weighted share of the maximum possible agreement.
    /// Sorted highest first; ties keep the library order.
    static func scores(_ answers: [String: Int]) -> [FearScore] {
        var got: [FearID: Double] = [:]
        var max: [FearID: Double] = [:]
        for question in Questions.all {
            let answer = Double(min(4, Swift.max(0, answers[question.id] ?? 0)))
            for (fear, weight) in question.weights {
                got[fear, default: 0] += answer * weight
                max[fear, default: 0] += 4 * weight
            }
        }
        let scored = FearID.allCases.map { fear -> FearScore in
            let total = max[fear] ?? 0
            let percent = total > 0 ? Int(((got[fear] ?? 0) / total * 100).rounded()) : 0
            return FearScore(fear: fear, percent: percent)
        }
        return scored.enumerated()
            .sorted { $0.element.percent != $1.element.percent ? $0.element.percent > $1.element.percent : $0.offset < $1.offset }
            .map(\.element)
    }

    static func topFears(_ answers: [String: Int], count: Int = maxFocus) -> [FearID] {
        scores(answers).prefix(count).map(\.fear)
    }

    // MARK: Plan

    static func plan(for profile: Profile, focusCount: Int) -> GamePlan {
        let focus = Swift.max(1, Swift.min(maxFocus, focusCount))
        let top = scores(profile.answers).prefix(focus)
        let fears = top.map { score -> FearPlan in
            let info = score.fear.info
            let source = profile.sources[score.fear] ?? .unsure
            var quests = [Quest(id: "\(score.fear.rawValue).source", fear: score.fear, kind: .source,
                                title: source.exercise.title, detail: source.exercise.detail, xp: sourceXP)]
            for (index, step) in info.ladder.enumerated() {
                quests.append(Quest(id: "\(score.fear.rawValue).step\(index + 1)", fear: score.fear, kind: .step(index + 1),
                                    title: step.title, detail: step.detail, xp: stepXP[index]))
            }
            return FearPlan(score: score, source: source, quests: quests)
        }
        return GamePlan(fears: fears, boss: bossQuest(for: profile, top: fears.first?.fear))
    }

    static func bossQuest(for profile: Profile, top: FearID?) -> Quest? {
        guard let top else { return nil }
        let goal = profile.goal.trimmingCharacters(in: .whitespacesAndNewlines)
        if goal.isEmpty {
            return Quest(id: "boss", fear: top, kind: .boss,
                         title: "The step you've been avoiding",
                         detail: "Take the one step in \(profile.lifeArea.title.lowercased()) that fear has kept you from. You've built the courage — now use it.",
                         xp: bossXP)
        }
        return Quest(id: "boss", fear: top, kind: .boss,
                     title: goal,
                     detail: "This is what you said you'd do if you weren't afraid. Do it, or the first real piece of it.",
                     xp: bossXP)
    }

    // MARK: Progress

    /// Quests in a fear's plan unlock one at a time. The boss unlocks once any one plan is fully done.
    static func status(of quest: Quest, in plan: GamePlan, profile: Profile) -> QuestStatus {
        if let done = profile.completions[quest.id] { return .done(done) }
        if let predicted = profile.accepted[quest.id] { return .accepted(predicted: predicted) }
        if quest.kind == .boss {
            let anyPlanDone = plan.fears.contains { fp in fp.quests.allSatisfy { profile.completions[$0.id] != nil } }
            return anyPlanDone ? .available : .locked
        }
        guard let fearPlan = plan.fears.first(where: { $0.fear == quest.fear }),
              let index = fearPlan.quests.firstIndex(where: { $0.id == quest.id }) else { return .locked }
        if index == 0 { return .available }
        return profile.completions[fearPlan.quests[index - 1].id] != nil ? .available : .locked
    }

    static func xp(_ profile: Profile) -> Int {
        profile.completions.values.reduce(0) { $0 + $1.xp }
    }

    static func rank(for xp: Int) -> Rank {
        let index = ranks.lastIndex { xp >= $0.0 } ?? 0
        let next = index + 1 < ranks.count ? ranks[index + 1].0 : nil
        return Rank(title: ranks[index].1, floor: ranks[index].0, next: next)
    }

    /// Average of (predicted - actual) across completed quests: how much less scary reality was.
    static func averageRelief(_ profile: Profile) -> Double? {
        let all = profile.completions.values
        guard !all.isEmpty else { return nil }
        return Double(all.reduce(0) { $0 + ($1.predicted - $1.actual) }) / Double(all.count)
    }
}
