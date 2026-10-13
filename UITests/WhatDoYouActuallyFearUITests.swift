import AppKit
import XCTest

/// Drives the real Mac app. Each test launches it against a fresh temporary data folder
/// (`-UITestDataDirectory`), so your own progress is never read or changed.
final class WhatDoYouActuallyFearUITests: XCTestCase {
    private var app: XCUIApplication!
    private var folder: URL!
    private var savedClipboard: String?

    private static let fixtures = URL(fileURLWithPath: #filePath)
        .deletingLastPathComponent().deletingLastPathComponent()
        .appendingPathComponent("Tests/Fixtures")
    private static let fromWebsite = fixtures.appendingPathComponent("Progress from Website.json")

    override func setUpWithError() throws {
        continueAfterFailure = false
        folder = FileManager.default.temporaryDirectory.appendingPathComponent("WDYAF-UITests-\(UUID().uuidString)")
        try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        savedClipboard = NSPasteboard.general.string(forType: .string)
    }

    override func tearDownWithError() throws {
        app?.terminate()
        try? FileManager.default.removeItem(at: folder)
        NSPasteboard.general.clearContents()
        if let savedClipboard { NSPasteboard.general.setString(savedClipboard, forType: .string) }
    }

    // MARK: Helpers

    private func launch(seeded: Bool = false) throws {
        if seeded {
            try FileManager.default.copyItem(at: Self.fromWebsite, to: folder.appendingPathComponent("Profile.json"))
        }
        app = XCUIApplication()
        app.launchArguments = [
            "-UITestDataDirectory", folder.path,
            "-focusCount", "3", "-showXP", "YES", "-appearance", "System",
            "-ApplePersistenceIgnoreState", "YES",
        ]
        app.launch()
        app.activate()
    }

    private func element(_ id: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: id).firstMatch
    }

    private func questButton(endingWith suffix: String, label: String) -> XCUIElement {
        app.buttons.matching(NSPredicate(format: "identifier ENDSWITH %@ AND label == %@", suffix, label)).firstMatch
    }

    private func savedProfile() throws -> [String: Any] {
        let data = try Data(contentsOf: folder.appendingPathComponent("Profile.json"))
        return try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
    }

    private func waitAndClick(_ element: XCUIElement, timeout: TimeInterval = 5, file: StaticString = #filePath, line: UInt = #line) {
        XCTAssertTrue(element.waitForExistence(timeout: timeout), "Missing \(element)", file: file, line: line)
        element.click()
    }

    /// A button in an alert or confirmation sheet. Querying inside sheets skips the Touch Bar's copies.
    private func waitForDialogButton(_ title: String, timeout: TimeInterval = 5) -> XCUIElement {
        let button = app.sheets.buttons.matching(NSPredicate(format: "title == %@ OR label == %@", title, title)).firstMatch
        XCTAssertTrue(button.waitForExistence(timeout: timeout), "Missing button \(title)")
        return button
    }

    /// The system open or save panel, shown as a sheet on the main window.
    private func filePanel(_ identifier: String) -> XCUIElement {
        app.sheets.matching(identifier: identifier).firstMatch
    }

    private func text(_ element: XCUIElement) -> String {
        (element.value as? String).flatMap { $0.isEmpty ? nil : $0 } ?? element.label
    }

    /// Fills a text field by pasting: fast typing into SwiftUI fields can drop characters.
    private func enter(_ value: String, into field: XCUIElement) {
        XCTAssertTrue(field.waitForExistence(timeout: 5))
        field.click()
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(value, forType: .string)
        app.typeKey("v", modifierFlags: .command)
        let filled = NSPredicate { _, _ in (field.value as? String) == value }
        wait(for: [XCTNSPredicateExpectation(predicate: filled, object: nil)], timeout: 5)
    }

    private func openSidebarPage(_ title: String) {
        let row = app.outlines.staticTexts[title].exists ? app.outlines.staticTexts[title] : app.tables.staticTexts[title]
        waitAndClick(row)
    }

    // MARK: Tests

    func testFullQuestionnaireToFinishedQuest() throws {
        try launch()
        waitAndClick(element("begin"))
        waitAndClick(element("area-creativity"))
        enter("Show my paintings", into: element("goalField"))
        waitAndClick(element("continue"))

        // First statement by clicking, the other 21 with keys 1–5.
        XCTAssertTrue(element("statementCounter").waitForExistence(timeout: 5))
        waitAndClick(element("answer-4"))
        let counter = element("statementCounter")
        for i in 1..<22 {
            // Wait for each statement before answering, so no key lands mid-transition.
            let shown = NSPredicate { _, _ in self.text(counter) == "Statement \(i + 1) of 22" }
            wait(for: [XCTNSPredicateExpectation(predicate: shown, object: nil)], timeout: 5)
            app.typeKey("\((i % 5) + 1)", modifierFlags: [])
        }

        for _ in 0..<3 {
            waitAndClick(element("source-criticism"))
            waitAndClick(element("nextSource"))
        }
        waitAndClick(element("startQuests"))

        // Accept the first root quest, rating it scary, then finish it.
        waitAndClick(questButton(endingWith: ".source", label: "Accept"))
        let acceptSlider = element("ratingSlider")
        XCTAssertTrue(acceptSlider.waitForExistence(timeout: 5))
        acceptSlider.adjust(toNormalizedSliderPosition: 0.8)
        waitAndClick(element("questPrimary"))

        waitAndClick(questButton(endingWith: ".source", label: "I did it"))
        let finishSlider = element("ratingSlider")
        XCTAssertTrue(finishSlider.waitForExistence(timeout: 5))
        finishSlider.adjust(toNormalizedSliderPosition: 0.2)
        enter("Less scary than I thought", into: element("questNote"))
        waitAndClick(element("questPrimary"))

        XCTAssertTrue(app.buttons.matching(NSPredicate(format: "label BEGINSWITH 'feared'")).firstMatch.waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts.matching(NSPredicate(format: "value CONTAINS 'less scary than you expected' OR label CONTAINS 'less scary than you expected'")).firstMatch.exists)

        let profile = try savedProfile()
        XCTAssertEqual(profile["goal"] as? String, "Show my paintings")
        XCTAssertEqual(profile["lifeArea"] as? String, "creativity")
        XCTAssertEqual((profile["answers"] as? [String: Int])?.count, 22)
        let completion = try XCTUnwrap((profile["completions"] as? [String: [String: Any]])?.values.first)
        XCTAssertGreaterThan(completion["predicted"] as? Int ?? 0, completion["actual"] as? Int ?? 99)
        XCTAssertEqual(completion["note"] as? String, "Less scary than I thought")

        openSidebarPage("Journal")
        XCTAssertTrue(app.staticTexts["Less scary than I thought"].waitForExistence(timeout: 5))
    }

    func testSavedProgressReopensOnTheQuestBoard() throws {
        try launch(seeded: true)
        XCTAssertTrue(app.staticTexts["Show my paintings"].waitForExistence(timeout: 5), "boss quest from the saved goal")
        XCTAssertTrue(questButton(endingWith: ".step1", label: "I did it").exists, "accepted quest kept")
        XCTAssertFalse(element("begin").exists)
    }

    func testBackKeepsTheEarlierAnswer() throws {
        try launch()
        waitAndClick(element("begin"))
        waitAndClick(element("continue"))
        XCTAssertTrue(element("statementCounter").waitForExistence(timeout: 5))
        app.typeKey("3", modifierFlags: [])
        XCTAssertEqual(text(element("statementCounter")), "Statement 2 of 22")
        app.typeKey("[", modifierFlags: .command)
        XCTAssertEqual(text(element("statementCounter")), "Statement 1 of 22")
    }

    func testSettingsOpensWithCommandComma() throws {
        try launch(seeded: true)
        XCTAssertTrue(app.staticTexts["Show my paintings"].waitForExistence(timeout: 5))
        app.typeKey(",", modifierFlags: .command)
        XCTAssertTrue(app.buttons["Export Progress…"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["Import Progress…"].exists)
        XCTAssertTrue(app.buttons["Import Progress…"].exists)
    }

    func testPastingAProgressFileImportsIt() throws {
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(try String(contentsOf: Self.fromWebsite, encoding: .utf8), forType: .string)
        try launch()
        XCTAssertTrue(element("begin").waitForExistence(timeout: 5))
        app.typeKey("v", modifierFlags: .command)
        waitForDialogButton("Import").click()
        XCTAssertTrue(app.staticTexts["Show my paintings"].waitForExistence(timeout: 5))
        XCTAssertEqual(try savedProfile()["goal"] as? String, "Show my paintings")
    }

    func testPastingSomethingElseExplainsWhy() throws {
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString("{\"hello\": 1}", forType: .string)
        try launch()
        XCTAssertTrue(element("begin").waitForExistence(timeout: 5))
        app.typeKey("v", modifierFlags: .command)
        XCTAssertTrue(app.staticTexts["Couldn't import"].waitForExistence(timeout: 5))
        waitForDialogButton("OK").click()
        XCTAssertTrue(element("begin").exists)
    }

    func testImportLinkOpensTheFilePicker() throws {
        try launch()
        waitAndClick(element("importLink"))
        let panel = filePanel("open-panel")
        XCTAssertTrue(panel.waitForExistence(timeout: 5))
        waitAndClick(panel.buttons["CancelButton"])
        XCTAssertFalse(panel.waitForExistence(timeout: 2))
        XCTAssertTrue(element("begin").exists, "cancelling changes nothing")
    }

    func testExportMenuOpensASavePanel() throws {
        try launch(seeded: true)
        XCTAssertTrue(app.staticTexts["Show my paintings"].waitForExistence(timeout: 5))
        app.menuBars.menuBarItems["File"].click()
        waitAndClick(app.menuItems["Export Progress…"])
        let panel = filePanel("save-panel")
        XCTAssertTrue(panel.waitForExistence(timeout: 8))
        XCTAssertTrue(panel.buttons["OKButton"].exists)
        waitAndClick(panel.buttons["CancelButton"])
    }

    func testEraseEverythingReturnsToWelcome() throws {
        try launch(seeded: true)
        XCTAssertTrue(app.staticTexts["Show my paintings"].waitForExistence(timeout: 5))
        app.typeKey(",", modifierFlags: .command)
        let erase = app.buttons["Erase everything…"]
        XCTAssertTrue(erase.waitForExistence(timeout: 5))
        // The settings form scrolls; bring its last row into view.
        let form = app.scrollViews.containing(.button, identifier: "Erase everything…").firstMatch
        for _ in 0..<5 where !erase.isHittable { form.scroll(byDeltaX: 0, deltaY: -300) }
        erase.click()
        waitForDialogButton("Erase everything").click()
        XCTAssertTrue(element("begin").waitForExistence(timeout: 5))
        XCTAssertFalse(FileManager.default.fileExists(atPath: folder.appendingPathComponent("Profile.json").path))
    }
}
