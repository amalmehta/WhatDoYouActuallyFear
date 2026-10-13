import XCTest
@testable import WhatDoYouActuallyFear

/// The progress file must move between the Mac app and the website both ways.
/// Fixtures: "Progress from Mac.json" is this app's encoder output; "Progress from Website.json"
/// is the website's export of the same profile (written by web/src/test/progress.test.tsx).
@MainActor
final class ProgressFileTests: XCTestCase {
    private let fixtures = URL(fileURLWithPath: #filePath).deletingLastPathComponent().appendingPathComponent("Fixtures")
    private func fixture(_ name: String) throws -> Data { try Data(contentsOf: fixtures.appendingPathComponent(name)) }

    func testMacFixtureIsExactlyWhatThisAppWrites() throws {
        let data = try fixture("Progress from Mac.json")
        let profile = try ProgressFile.decode(data)
        XCTAssertEqual(try ProgressFile.encode(profile), data)
    }

    func testReadsTheWebsitesExport() throws {
        let fromWeb = try ProgressFile.decode(try fixture("Progress from Website.json"))
        let fromMac = try ProgressFile.decode(try fixture("Progress from Mac.json"))
        XCTAssertEqual(fromWeb, fromMac)
    }

    func testAcceptsMillisecondDatesFromBrowsers() throws {
        var json = String(decoding: try fixture("Progress from Mac.json"), as: UTF8.self)
        json = json.replacingOccurrences(of: "Z\"", with: ".123Z\"")
        let profile = try ProgressFile.decode(Data(json.utf8))
        XCTAssertEqual(profile.createdAt.timeIntervalSince1970, 1_791_700_000.123, accuracy: 0.001)
    }

    func testRejectsFilesThatArentProgress() throws {
        let good = try JSONSerialization.jsonObject(with: try fixture("Progress from Mac.json")) as! [String: Any]
        func reject(_ object: Any, _ message: String, file: StaticString = #filePath, line: UInt = #line) {
            let data = (try? JSONSerialization.data(withJSONObject: object)) ?? Data()
            XCTAssertThrowsError(try ProgressFile.decode(data), file: file, line: line) { error in
                XCTAssertTrue(error.localizedDescription.contains(message), error.localizedDescription, file: file, line: line)
            }
        }
        XCTAssertThrowsError(try ProgressFile.decode(Data("not json".utf8)))
        reject(["hello": 1], "isn't a What Do You Actually Fear progress file")
        reject(good.merging(["lifeArea": "space"]) { $1 }, "isn't a")
        reject(good.merging(["answers": [String: Int]()]) { $1 }, "no answers")
        reject(good.merging(["answers": ["q99": 1]]) { $1 }, "doesn't know")
        reject(good.merging(["answers": ["q01": 7]]) { $1 }, "out of range")
        reject(good.merging(["accepted": ["failure.step1": 11]]) { $1 }, "fear ratings")
    }

    func testImportReplacesAndPersists() throws {
        let folder = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        defer { try? FileManager.default.removeItem(at: folder) }
        let store = AppStore(dataDirectory: folder)
        let preview = try store.preview(try fixture("Progress from Website.json"))
        XCTAssertTrue(preview.summary.contains("1 quest done"), preview.summary)
        XCTAssertNil(store.profile, "preview changes nothing")

        store.importProfile(preview.profile)
        XCTAssertEqual(store.phase, .main)
        XCTAssertEqual(AppStore(dataDirectory: folder).profile?.goal, "Show my paintings")
    }
}
