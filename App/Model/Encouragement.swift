import Foundation

/// Words of encouragement shown when a quest is finished. Copied to the website by `npm run copy-content`.
enum Encouragement {
    static let questDone: [String] = [
        "You did the scary thing.",
        "That took real courage.",
        "Look at you, facing it head-on.",
        "One more brick in a braver you.",
        "Your future self says thank you.",
        "Fear talked. You did it anyway.",
        "Small step, real progress.",
        "That's how courage grows: one go at a time.",
    ]

    /// The same line for the same quest every time, in both apps.
    static func line(for questID: String) -> String {
        let sum = questID.unicodeScalars.reduce(0) { $0 + Int($1.value) }
        return questDone[sum % questDone.count]
    }

    /// Compares how scary a quest was expected to be with how it felt.
    static func reality(predicted: Int, actual: Int) -> String {
        let gap = predicted - actual
        if gap > 0 {
            return "You expected \(predicted)/10 and it felt like \(actual). Your fear overestimated by \(gap)."
        } else if gap == 0 {
            return "It felt about as scary as you expected (\(actual)/10), and you did it anyway."
        } else {
            return "It felt scarier than expected (\(actual)/10), and you still did it. That counts double."
        }
    }
}
