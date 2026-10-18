import Foundation

struct Question: Identifiable {
    let id: String
    let text: String
    /// How strongly agreeing with this statement points to each fear.
    let weights: [FearID: Double]
}

enum Questions {
    /// Answer scale: 0 (not me) ... 4 (that's me).
    static let scale = ["Not me", "Rarely", "Sometimes", "Often", "That's me"]

    static let all: [Question] = [
        Question(id: "q01", text: "I put off starting things because I might not do them well.", weights: [.failure: 1, .notEnough: 0.5]),
        Question(id: "q02", text: "When I picture trying and falling short, it feels unbearable.", weights: [.failure: 1]),
        Question(id: "q03", text: "I often feel other people are more capable than me.", weights: [.notEnough: 1, .foundOut: 0.5]),
        Question(id: "q04", text: "When something goes well, I worry people will realise I don't deserve it.", weights: [.foundOut: 1]),
        Question(id: "q05", text: "I hold back ideas because people might not like them.", weights: [.rejection: 0.7, .judgment: 0.7]),
        Question(id: "q06", text: "I replay conversations, worrying what people thought of me.", weights: [.judgment: 1]),
        Question(id: "q07", text: "I avoid asking for things because the answer might be no.", weights: [.rejection: 1]),
        Question(id: "q08", text: "I'd rather go along with something than risk an argument.", weights: [.conflict: 1]),
        Question(id: "q09", text: "Saying no to someone makes me anxious.", weights: [.conflict: 0.7, .rejection: 0.5]),
        Question(id: "q10", text: "I stay in situations I'm unhappy with because change feels risky.", weights: [.unknown: 1]),
        Question(id: "q11", text: "I need to know how things will turn out before I commit.", weights: [.unknown: 0.7, .losingControl: 0.7]),
        Question(id: "q12", text: "I research decisions for so long that I never actually decide.", weights: [.wrongChoice: 1]),
        Question(id: "q13", text: "I'm haunted by the thought of picking the wrong path.", weights: [.wrongChoice: 1, .unknown: 0.3]),
        Question(id: "q14", text: "I feel uneasy when I can't plan or manage how something goes.", weights: [.losingControl: 1]),
        Question(id: "q15", text: "I find it hard to hand things off to other people.", weights: [.losingControl: 1]),
        Question(id: "q16", text: "I keep people at arm's length so it hurts less if they leave.", weights: [.beingLeft: 1, .beingSeen: 0.5]),
        Question(id: "q17", text: "I worry that the people I care about will eventually leave.", weights: [.beingLeft: 1]),
        Question(id: "q18", text: "Letting people see my struggles feels dangerous.", weights: [.beingSeen: 1]),
        Question(id: "q19", text: "I'd rather seem fine than ask for help.", weights: [.beingSeen: 0.8, .notEnough: 0.3]),
        Question(id: "q20", text: "If I really went for what I want and got it, I'm not sure I could handle it.", weights: [.foundOut: 0.6, .unknown: 0.3]),
        Question(id: "q21", text: "Criticism, even mild, stays with me for days.", weights: [.judgment: 0.7, .notEnough: 0.5, .failure: 0.3]),
        Question(id: "q22", text: "I compare my progress to other people's and feel behind.", weights: [.notEnough: 1]),
    ]

    /// The statements come in four short parts, with a breather between them.
    static let sections: [QuestionSection] = [
        QuestionSection(title: "Trying and being seen", range: 0..<6, cheer: "Nice start. Three short parts to go."),
        QuestionSection(title: "Asking and speaking up", range: 6..<11, cheer: "Halfway there. Take a breath. You're doing great."),
        QuestionSection(title: "Change and choices", range: 11..<17, cheer: "Just one short part left."),
        QuestionSection(title: "Closeness and you", range: 17..<22, cheer: "All done. Thank you for being honest with yourself."),
    ]

    static func section(containing index: Int) -> Int {
        sections.firstIndex { $0.range.contains(index) } ?? sections.count - 1
    }
}

struct QuestionSection {
    let title: String
    let range: Range<Int>
    /// Shown on the breather screen after this part.
    let cheer: String
}
