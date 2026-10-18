import XCTest
@testable import WhatDoYouActuallyFear

@MainActor
final class StoreTests: XCTestCase {
    private var folder: URL!

    override func setUp() async throws {
        folder = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
    }

    override func tearDown() async throws {
        try? FileManager.default.removeItem(at: folder)
    }

    private func runQuestionnaire(_ store: AppStore, answer: Int = 3) {
        store.start()
        store.phase = .questions
        for _ in Questions.all { store.answer(answer) }
        XCTAssertEqual(store.phase, .sources)
        for _ in store.sourceFears {
            store.chooseSource(.criticism)
            store.nextSource()
        }
    }

    func testFreshStoreStartsAtWelcome() {
        let store = AppStore(dataDirectory: folder)
        XCTAssertNil(store.profile)
        XCTAssertEqual(store.phase, .welcome)
    }

    func testQuestionnaireSavesAndReloads() {
        let store = AppStore(dataDirectory: folder)
        runQuestionnaire(store)
        XCTAssertEqual(store.phase, .reveal)
        XCTAssertEqual(store.profile?.answers.count, Questions.all.count)
        XCTAssertEqual(store.profile?.sources.count, Engine.maxFocus)

        let reloaded = AppStore(dataDirectory: folder)
        XCTAssertEqual(reloaded.profile, store.profile)
        XCTAssertEqual(reloaded.phase, .main)
    }

    func testBreathersBetweenParts() {
        let store = AppStore(dataDirectory: folder)
        store.start()
        store.phase = .questions
        for _ in 0..<5 { store.answer(2) }
        XCTAssertNil(store.sectionBreak)
        store.answer(2) // last statement of part 1
        XCTAssertEqual(store.sectionBreak, 0)
        XCTAssertEqual(store.questionIndex, 6)
        store.continueAfterBreak()
        XCTAssertNil(store.sectionBreak)
        store.answer(2)
        store.back()
        XCTAssertEqual(store.questionIndex, 6)
        XCTAssertEqual(Questions.sections.map(\.range.count).reduce(0, +), Questions.all.count, "parts cover every statement")
    }

    func testFinishingAQuestCelebrates() {
        let store = AppStore(dataDirectory: folder)
        runQuestionnaire(store)
        let quest = Engine.plan(for: store.profile!, focusCount: 1).fears[0].quests[0]
        store.accept(quest, predicted: 8)
        store.complete(quest, actual: 3, note: "")
        let celebration = try? XCTUnwrap(store.celebration)
        XCTAssertEqual(celebration?.quest.id, quest.id)
        XCTAssertEqual(celebration?.cheer, Encouragement.line(for: quest.id))
        XCTAssertTrue(celebration?.reality.contains("overestimated by 5") ?? false)
        XCTAssertEqual(celebration?.newRank, nil, "30 XP stays in the first rank")
    }

    func testBackStepsThroughTheFlow() {
        let store = AppStore(dataDirectory: folder)
        store.start()
        store.phase = .questions
        store.answer(2)
        XCTAssertEqual(store.questionIndex, 1)
        store.back()
        XCTAssertEqual(store.questionIndex, 0)
        store.back()
        XCTAssertEqual(store.phase, .area)
        store.back()
        XCTAssertEqual(store.phase, .welcome)
    }

    func testAcceptCompleteUndoPersist() throws {
        let store = AppStore(dataDirectory: folder)
        runQuestionnaire(store)
        let quest = Engine.plan(for: store.profile!, focusCount: 1).fears[0].quests[0]

        store.accept(quest, predicted: 8)
        store.complete(quest, actual: 3, note: "  fine actually ")
        let saved = try XCTUnwrap(AppStore(dataDirectory: folder).profile?.completions[quest.id])
        XCTAssertEqual(saved.predicted, 8)
        XCTAssertEqual(saved.actual, 3)
        XCTAssertEqual(saved.note, "fine actually")
        XCTAssertNil(store.profile?.accepted[quest.id])

        store.undo(quest)
        XCTAssertNil(AppStore(dataDirectory: folder).profile?.completions[quest.id])
    }

    func testRetakeKeepsJournal() {
        let store = AppStore(dataDirectory: folder)
        runQuestionnaire(store)
        let quest = Engine.plan(for: store.profile!, focusCount: 1).fears[0].quests[0]
        store.accept(quest, predicted: 6)
        store.complete(quest, actual: 2, note: "")

        runQuestionnaire(store, answer: 1)
        XCTAssertNotNil(store.profile?.completions[quest.id])
    }

    func testEraseAndFeedback() throws {
        let store = AppStore(dataDirectory: folder)
        runQuestionnaire(store)
        try store.saveFeedback(FeedbackEntry(date: Date(), kind: .idea, text: "More quests"))
        try store.saveFeedback(FeedbackEntry(date: Date(), kind: .bug, text: "Typo"))
        store.eraseEverything()
        XCTAssertNil(store.profile)
        XCTAssertEqual(store.phase, .welcome)
        XCTAssertNil(AppStore(dataDirectory: folder).profile)
        let data = try Data(contentsOf: store.feedbackURL)
        XCTAssertTrue(String(decoding: data, as: UTF8.self).contains("More quests"))
    }
}
