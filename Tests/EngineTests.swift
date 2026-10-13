import XCTest
@testable import WhatDoYouActuallyFear

final class EngineTests: XCTestCase {
    func testEveryFearHasContentAndQuestions() {
        for fear in FearID.allCases {
            let info = fear.info
            XCTAssertEqual(info.id, fear)
            XCTAssertEqual(info.ladder.count, Engine.stepXP.count, "\(fear) ladder")
            XCTAssertGreaterThanOrEqual(Questions.all.filter { ($0.weights[fear] ?? 0) > 0 }.count, 2, "\(fear) needs 2+ questions")
        }
        XCTAssertEqual(Set(Questions.all.map(\.id)).count, Questions.all.count, "question ids are unique")
    }

    func testShadesAreUniqueWithinEachFamily() {
        for family in FearFamily.allCases {
            let shades = FearID.allCases.map(\.info).filter { $0.family == family }.map(\.shade)
            XCTAssertEqual(Set(shades).count, shades.count, "\(family) shades collide")
        }
    }

    func testAllZeroAnswersScoreZero() {
        let scores = Engine.scores([:])
        XCTAssertEqual(scores.count, FearID.allCases.count)
        XCTAssertTrue(scores.allSatisfy { $0.percent == 0 })
        XCTAssertEqual(scores.map(\.fear), FearID.allCases, "ties keep library order")
    }

    func testAllMaxAnswersScoreHundred() {
        let answers = Dictionary(uniqueKeysWithValues: Questions.all.map { ($0.id, 4) })
        XCTAssertTrue(Engine.scores(answers).allSatisfy { $0.percent == 100 })
    }

    func testAnswersPointToTheRightFear() {
        var answers: [String: Int] = [:]
        answers["q12"] = 4 // research decisions forever
        answers["q13"] = 4 // haunted by the wrong path
        XCTAssertEqual(Engine.topFears(answers, count: 1), [.wrongChoice])

        answers = ["q08": 4, "q09": 4]
        XCTAssertEqual(Engine.topFears(answers, count: 1), [.conflict])
    }

    func testOutOfRangeAnswersAreClamped() {
        let scores = Engine.scores(["q02": 99])
        XCTAssertEqual(scores.first?.fear, .failure)
        XCTAssertLessThanOrEqual(scores.first!.percent, 100)
    }

    func testPlanShapeAndFocusCount() {
        let profile = sampleProfile()
        for count in 1...3 {
            let plan = Engine.plan(for: profile, focusCount: count)
            XCTAssertEqual(plan.fears.count, count)
            for fearPlan in plan.fears {
                XCTAssertEqual(fearPlan.quests.count, 6) // root + 5 steps
                XCTAssertEqual(fearPlan.quests.first?.kind, .source)
            }
        }
        XCTAssertEqual(Engine.plan(for: profile, focusCount: 9).fears.count, 3, "clamped to max")
        XCTAssertEqual(Engine.plan(for: profile, focusCount: 0).fears.count, 1, "clamped to min")
    }

    func testSourceExerciseFollowsChosenSource() {
        var profile = sampleProfile()
        let top = Engine.topFears(profile.answers, count: 1)[0]
        profile.sources[top] = .modelled
        let quest = Engine.plan(for: profile, focusCount: 1).fears[0].quests[0]
        XCTAssertEqual(quest.title, SourceKind.modelled.exercise.title)

        profile.sources[top] = nil
        let fallback = Engine.plan(for: profile, focusCount: 1).fears[0].quests[0]
        XCTAssertEqual(fallback.title, SourceKind.unsure.exercise.title)
    }

    func testQuestsUnlockInOrderAndBossNeedsAFullLadder() {
        var profile = sampleProfile()
        let plan = Engine.plan(for: profile, focusCount: 2)
        let quests = plan.fears[0].quests
        XCTAssertEqual(Engine.status(of: quests[0], in: plan, profile: profile), .available)
        XCTAssertEqual(Engine.status(of: quests[1], in: plan, profile: profile), .locked)
        XCTAssertEqual(Engine.status(of: plan.boss!, in: plan, profile: profile), .locked)

        profile.accepted[quests[0].id] = 7
        XCTAssertEqual(Engine.status(of: quests[0], in: plan, profile: profile), .accepted(predicted: 7))

        for quest in quests { profile.completions[quest.id] = completion(for: quest) }
        XCTAssertEqual(Engine.status(of: plan.boss!, in: plan, profile: profile), .available)
    }

    func testBossUsesGoalOrFallsBack() {
        var profile = sampleProfile()
        profile.goal = "  Start the podcast  "
        XCTAssertEqual(Engine.plan(for: profile, focusCount: 1).boss?.title, "Start the podcast")
        profile.goal = " "
        XCTAssertEqual(Engine.plan(for: profile, focusCount: 1).boss?.title, "The step you've been avoiding")
    }

    func testXPRankAndRelief() {
        XCTAssertEqual(Engine.rank(for: 0).title, "Frozen")
        XCTAssertEqual(Engine.rank(for: 49).next, 50)
        XCTAssertEqual(Engine.rank(for: 150).title, "Stepping Out")
        XCTAssertNil(Engine.rank(for: 5000).next)

        var profile = sampleProfile()
        XCTAssertNil(Engine.averageRelief(profile))
        let quests = Engine.plan(for: profile, focusCount: 1).fears[0].quests
        profile.completions[quests[0].id] = completion(for: quests[0], predicted: 8, actual: 4)
        profile.completions[quests[1].id] = completion(for: quests[1], predicted: 6, actual: 4)
        XCTAssertEqual(Engine.xp(profile), quests[0].xp + quests[1].xp)
        XCTAssertEqual(Engine.averageRelief(profile), 3)
    }

    // MARK: Helpers

    private func sampleProfile() -> Profile {
        var profile = Profile()
        profile.answers = ["q01": 4, "q02": 4, "q06": 3, "q12": 2]
        return profile
    }

    private func completion(for quest: Quest, predicted: Int = 5, actual: Int = 3) -> QuestCompletion {
        QuestCompletion(date: Date(), fear: quest.fear, title: quest.title, xp: quest.xp,
                        predicted: predicted, actual: actual, note: "")
    }
}
