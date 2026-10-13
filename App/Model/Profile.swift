import Foundation

/// Everything the person has told the app, plus their quest progress.
/// Saved as JSON in Application Support.
struct Profile: Codable, Equatable {
    var lifeArea: LifeArea = .career
    /// "If you weren't afraid, what would you do?" — becomes the boss quest.
    var goal: String = ""
    /// Question id -> answer 0...4.
    var answers: [String: Int] = [:]
    var sources: [FearID: SourceKind] = [:]
    var sourceNotes: [FearID: String] = [:]
    /// Quest id -> how scary the person expected it to be (0...10), set when they accept it.
    var accepted: [String: Int] = [:]
    /// Quest id -> completion record.
    var completions: [String: QuestCompletion] = [:]
    var createdAt: Date = Date()
}

struct QuestCompletion: Codable, Equatable {
    var date: Date
    var fear: FearID
    var title: String
    var xp: Int
    /// How scary it felt beforehand (0...10).
    var predicted: Int
    /// How scary it actually was (0...10).
    var actual: Int
    var note: String
}

struct FeedbackEntry: Codable, Equatable {
    enum Kind: String, Codable, CaseIterable, Identifiable {
        case idea = "Idea", bug = "Something's broken", content = "A question or quest", other = "Something else"
        var id: String { rawValue }
    }
    var date: Date
    var kind: Kind
    var text: String
}
