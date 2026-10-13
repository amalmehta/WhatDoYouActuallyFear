import Foundation

/// Fears are grouped into families. Related fears share a hue family in the UI.
enum FearFamily: String, Codable, CaseIterable, Identifiable {
    case selfWorth, social, uncertainty, connection

    var id: String { rawValue }

    var title: String {
        switch self {
        case .selfWorth: "Self-Worth"
        case .social: "Other People"
        case .uncertainty: "Uncertainty"
        case .connection: "Closeness"
        }
    }

    /// Base hue (0...1) for this family.
    var hue: Double {
        switch self {
        case .selfWorth: 0.76    // violet
        case .social: 0.58       // blue
        case .uncertainty: 0.05  // orange-red
        case .connection: 0.40   // green
        }
    }
}

enum FearID: String, Codable, CaseIterable, Identifiable, CodingKeyRepresentable {
    case failure, notEnough, foundOut
    case rejection, judgment, conflict
    case unknown, wrongChoice, losingControl
    case beingLeft, beingSeen

    var id: String { rawValue }
    var info: FearInfo { FearLibrary.info(for: self) }
}

struct QuestTemplate {
    let title: String
    let detail: String
}

struct FearInfo {
    let id: FearID
    let name: String
    let family: FearFamily
    /// 0, 1 or 2 — which shade of the family hue this fear uses.
    let shade: Int
    let summary: String
    let howItKeepsYouStuck: [String]
    let coreBelief: String
    let reframe: String
    /// Five exposure steps, smallest to biggest.
    let ladder: [QuestTemplate]
}

/// Where a fear most likely came from.
enum SourceKind: String, Codable, CaseIterable, Identifiable {
    case criticism, pastEvent, modelled, instability, comparison, unsure

    var id: String { rawValue }

    enum Group { case people, events, unknown }

    var group: Group {
        switch self {
        case .criticism, .modelled, .comparison: .people
        case .pastEvent, .instability: .events
        case .unsure: .unknown
        }
    }

    /// Shade within the group's hue family.
    var shade: Int {
        switch self {
        case .criticism, .pastEvent, .unsure: 0
        case .modelled, .instability: 1
        case .comparison: 2
        }
    }

    var title: String {
        switch self {
        case .criticism: "Criticism or pressure growing up"
        case .pastEvent: "A specific painful experience"
        case .modelled: "Watching someone close to me"
        case .instability: "Instability, loss or unpredictability"
        case .comparison: "Comparison and what success is \"supposed\" to look like"
        case .unsure: "I'm not sure yet"
        }
    }

    var howItFormed: String {
        switch self {
        case .criticism:
            "When approval felt conditional on getting it right, your mind learned that falling short was dangerous. The fear is an old protector still on duty."
        case .pastEvent:
            "One moment taught your brain \"never again\". It turned a single event into a rule about everything."
        case .modelled:
            "You absorbed this fear from someone you watched — a parent, sibling or partner. Part of it may not even be yours."
        case .instability:
            "When life around you was unpredictable, staying on guard kept you safe. The alarm still goes off now, even when you're safe."
        case .comparison:
            "A steady stream of other people's best moments set a bar that nobody actually meets."
        case .unsure:
            "That's fine — fears often hide where they came from. Curiosity is enough to start."
        }
    }

    var exercise: QuestTemplate {
        switch self {
        case .criticism:
            QuestTemplate(title: "Answer the old critic",
                          detail: "Write down the critical voice's exact words. Whose voice is it really? Then write the reply you'd give a child who heard those words.")
        case .pastEvent:
            QuestTemplate(title: "Rewrite the rule",
                          detail: "Describe the event in five sentences. Write the rule you took from it, then an updated rule that fits who you are now.")
        case .modelled:
            QuestTemplate(title: "Hand back what isn't yours",
                          detail: "Name who you learned this from. List how your life differs from theirs. Write which parts of the fear you're ready to hand back.")
        case .instability:
            QuestTemplate(title: "Then vs. now",
                          detail: "Make two columns: \"then\" (what was unstable) and \"now\" (what's steady in your life today). Read the \"now\" column out loud.")
        case .comparison:
            QuestTemplate(title: "Your own yardstick",
                          detail: "Write what \"enough\" would actually look like for you — in your own words, not anyone's feed.")
        case .unsure:
            QuestTemplate(title: "Fear diary",
                          detail: "For a week, jot down each time this fear shows up: what happened, what you felt, what you did. Then look for the pattern.")
        }
    }
}

enum LifeArea: String, Codable, CaseIterable, Identifiable {
    case career, relationships, friendships, health, creativity, money, purpose

    var id: String { rawValue }

    var title: String {
        switch self {
        case .career: "Career & work"
        case .relationships: "Love & relationships"
        case .friendships: "Friends & social life"
        case .health: "Health & body"
        case .creativity: "Creative work"
        case .money: "Money"
        case .purpose: "Direction & purpose"
        }
    }

    var symbol: String {
        switch self {
        case .career: "briefcase"
        case .relationships: "heart"
        case .friendships: "person.3"
        case .health: "figure.walk"
        case .creativity: "paintbrush"
        case .money: "banknote"
        case .purpose: "safari"
        }
    }
}
