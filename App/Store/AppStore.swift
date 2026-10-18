import Foundation
import Observation

/// App state and persistence. Owns the saved profile and the in-progress questionnaire.
@Observable
@MainActor
final class AppStore {
    enum Phase: Equatable { case welcome, area, questions, sources, reveal, main }

    enum Page: String, Hashable, CaseIterable, Identifiable {
        case board = "Quest Board", profile = "Fear Profile", journal = "Journal"
        var id: String { rawValue }
        var symbol: String {
            switch self {
            case .board: "flag.checkered"
            case .profile: "person.crop.circle.badge.questionmark"
            case .journal: "book.closed"
            }
        }
    }

    var phase: Phase
    var page: Page = .board
    private(set) var profile: Profile?
    /// The questionnaire being filled in. Copied into `profile` when finished.
    var draft = Profile()
    var questionIndex = 0
    var sourceIndex = 0
    var lastSaveError: String?
    /// Set by menu commands; the main window opens the file panel.
    var transferRequest: TransferRequest?
    /// Set right after a questionnaire part ends (index of that part); the breather screen shows until it's cleared.
    var sectionBreak: Int?
    /// Set when a quest is finished; the celebration shows until it's cleared.
    var celebration: Celebration?

    enum TransferRequest { case importFile, exportFile }

    let dataDirectory: URL
    var profileURL: URL { dataDirectory.appendingPathComponent("Profile.json") }
    var feedbackURL: URL { dataDirectory.appendingPathComponent("Feedback.json") }

    nonisolated static var defaultDirectory: URL {
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        return base.appendingPathComponent("What Do You Actually Fear", isDirectory: true)
    }

    /// UI tests launch with `-UITestDataDirectory <folder>` so they never touch real progress.
    nonisolated static var launchDirectory: URL {
        if let path = UserDefaults.standard.string(forKey: "UITestDataDirectory") {
            return URL(fileURLWithPath: path, isDirectory: true)
        }
        return defaultDirectory
    }

    init(dataDirectory: URL = AppStore.defaultDirectory) {
        self.dataDirectory = dataDirectory
        let loaded = Self.load(Profile.self, from: dataDirectory.appendingPathComponent("Profile.json"))
        profile = loaded
        phase = loaded == nil ? .welcome : .main
    }

    // MARK: Questionnaire flow

    var sourceFears: [FearID] { Engine.topFears(draft.answers) }

    func start() {
        draft = Profile(lifeArea: profile?.lifeArea ?? .career, goal: profile?.goal ?? "")
        questionIndex = 0
        sourceIndex = 0
        sectionBreak = nil
        phase = .area
    }

    func answer(_ value: Int) {
        sectionBreak = nil
        draft.answers[Questions.all[questionIndex].id] = value
        if questionIndex + 1 < Questions.all.count {
            let part = Questions.section(containing: questionIndex)
            if Questions.section(containing: questionIndex + 1) != part { sectionBreak = part }
            questionIndex += 1
        } else {
            sourceIndex = 0
            phase = .sources
        }
    }

    func back() {
        switch phase {
        case .area: phase = profile == nil ? .welcome : .main
        case .questions:
            sectionBreak = nil
            if questionIndex > 0 { questionIndex -= 1 } else { phase = .area }
        case .sources:
            if sourceIndex > 0 { sourceIndex -= 1 } else { phase = .questions }
        default: break
        }
    }

    func continueAfterBreak() {
        sectionBreak = nil
    }

    func chooseSource(_ source: SourceKind) {
        draft.sources[sourceFears[sourceIndex]] = source
    }

    func nextSource() {
        if sourceIndex + 1 < sourceFears.count {
            sourceIndex += 1
        } else {
            finishQuestionnaire()
        }
    }

    /// Saves the new answers. Journal and quest progress carry over from any earlier run.
    func finishQuestionnaire() {
        var result = draft
        if let old = profile {
            result.completions = old.completions
            result.accepted = old.accepted
        }
        result.createdAt = Date.nowWholeSeconds
        profile = result
        save()
        phase = .reveal
    }

    // MARK: Quests

    func accept(_ quest: Quest, predicted: Int) {
        guard profile != nil else { return }
        profile!.accepted[quest.id] = predicted
        save()
    }

    func complete(_ quest: Quest, actual: Int, note: String) {
        guard profile != nil else { return }
        let predicted = profile!.accepted[quest.id] ?? actual
        let rankBefore = Engine.rank(for: Engine.xp(profile!))
        profile!.completions[quest.id] = QuestCompletion(
            date: Date.nowWholeSeconds, fear: quest.fear, title: quest.title, xp: quest.xp,
            predicted: predicted, actual: actual, note: note.trimmingCharacters(in: .whitespacesAndNewlines))
        profile!.accepted[quest.id] = nil
        save()
        let rankAfter = Engine.rank(for: Engine.xp(profile!))
        celebration = Celebration(
            quest: quest, cheer: Encouragement.line(for: quest.id),
            reality: Encouragement.reality(predicted: predicted, actual: actual),
            newRank: rankAfter.title != rankBefore.title ? rankAfter.title : nil)
    }

    func undo(_ quest: Quest) {
        guard profile != nil else { return }
        profile!.completions[quest.id] = nil
        profile!.accepted[quest.id] = nil
        save()
    }

    // MARK: Import and export

    /// Reads a progress file without changing anything, so it can be confirmed first.
    func preview(_ data: Data) throws -> ImportPreview {
        ImportPreview(profile: try ProgressFile.decode(data))
    }

    /// Replaces the current answers, quests and journal with an imported profile.
    func importProfile(_ imported: Profile) {
        profile = imported
        save()
        page = .board
        phase = .main
    }

    // MARK: Data

    func eraseEverything() {
        try? FileManager.default.removeItem(at: profileURL)
        profile = nil
        draft = Profile()
        page = .board
        phase = .welcome
    }

    func save() {
        guard let profile else { return }
        do {
            try Self.write(profile, to: profileURL)
            lastSaveError = nil
        } catch {
            lastSaveError = error.localizedDescription
        }
    }

    func saveFeedback(_ entry: FeedbackEntry) throws {
        var all = Self.load([FeedbackEntry].self, from: feedbackURL) ?? []
        all.append(entry)
        try Self.write(all, to: feedbackURL)
    }

    /// Used by tests and the screenshot renderer.
    func replaceProfile(_ new: Profile?) {
        profile = new
        phase = new == nil ? .welcome : .main
    }

    private static func load<T: Decodable>(_ type: T.Type, from url: URL) -> T? {
        guard let data = try? Data(contentsOf: url) else { return nil }
        return try? ProgressFile.decoder.decode(type, from: data)
    }

    private static func write<T: Encodable>(_ value: T, to url: URL) throws {
        try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
        try ProgressFile.encoder.encode(value).write(to: url, options: .atomic)
    }
}

extension Date {
    /// Saved dates use ISO 8601 (whole seconds), so in-memory dates match what reloads.
    static var nowWholeSeconds: Date { Date(timeIntervalSince1970: Date().timeIntervalSince1970.rounded(.down)) }
}

/// What the celebration after a finished quest shows.
struct Celebration: Identifiable, Equatable {
    let id = UUID()
    let quest: Quest
    let cheer: String
    let reality: String
    /// Set when this quest moved the person up a rank.
    let newRank: String?
}
