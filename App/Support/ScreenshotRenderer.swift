import AppKit
import SwiftUI

/// Renders the main screens with sample data to PNGs for the README.
/// Run: `"What Do You Actually Fear.app/Contents/MacOS/What Do You Actually Fear" --screenshots docs/images`
@MainActor
enum ScreenshotRenderer {
    static func sampleProfile() -> Profile {
        var profile = Profile()
        profile.lifeArea = .career
        profile.goal = "Pitch my own project at work"
        let high = ["q01": 4, "q02": 4, "q05": 3, "q06": 4, "q12": 4, "q13": 3, "q21": 3, "q22": 2, "q03": 2, "q11": 2]
        for question in Questions.all { profile.answers[question.id] = high[question.id] ?? 1 }
        let top = Engine.topFears(profile.answers)
        profile.sources[top[0]] = .criticism
        if top.count > 1 { profile.sources[top[1]] = .comparison }
        if top.count > 2 { profile.sources[top[2]] = .pastEvent }
        let plan = Engine.plan(for: profile, focusCount: 3)
        let first = plan.fears[0].quests
        let day: TimeInterval = 86_400
        for (i, quest) in first.prefix(3).enumerated() {
            profile.completions[quest.id] = QuestCompletion(
                date: Date().addingTimeInterval(-Double(5 - i) * day), fear: quest.fear, title: quest.title, xp: quest.xp,
                predicted: [6, 7, 8][i], actual: [3, 4, 4][i],
                note: ["The critic sounded a lot like my old maths teacher.", "Awkward for five minutes, then fun.", "They had one useful note and liked the rest."][i])
        }
        profile.accepted[first[3].id] = 8
        profile.completions[plan.fears[1].quests[0].id] = QuestCompletion(
            date: Date().addingTimeInterval(-day), fear: plan.fears[1].fear, title: plan.fears[1].quests[0].title,
            xp: plan.fears[1].quests[0].xp, predicted: 5, actual: 2, note: "")
        return profile
    }

    static func renderAll(to folder: URL) {
        try? FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        let profile = sampleProfile()
        let store = AppStore(dataDirectory: FileManager.default.temporaryDirectory.appendingPathComponent("WDYAF-screenshots"))
        store.replaceProfile(profile)

        for scheme in [ColorScheme.light, .dark] {
            let suffix = scheme == .dark ? "dark" : "light"
            render(QuestBoardContent(profile: profile, focusCount: 3, showXP: true), scheme: scheme, store: store,
                   width: 900, to: folder.appendingPathComponent("quest-board-\(suffix).png"))
            render(RevealContent(profile: profile, focusCount: 3), scheme: scheme, store: store,
                   width: 900, to: folder.appendingPathComponent("results-\(suffix).png"))
            render(QuestionCard(index: 5, selected: 3) { _ in }, scheme: scheme, store: store,
                   width: 820, to: folder.appendingPathComponent("question-\(suffix).png"))
            render(FearProfileContent(profile: profile, focusCount: 1), scheme: scheme, store: store,
                   width: 900, to: folder.appendingPathComponent("fear-profile-\(suffix).png"))
        }
    }

    private static func render<V: View>(_ view: V, scheme: ColorScheme, store: AppStore, width: CGFloat, to url: URL) {
        let content = view
            .padding(32)
            .frame(width: width)
            .background(Theme.background(scheme))
            .environment(store)
            .environment(\.colorScheme, scheme)
        NSApp.appearance = NSAppearance(named: scheme == .dark ? .darkAqua : .aqua)
        let renderer = ImageRenderer(content: content)
        renderer.scale = 2
        guard let image = renderer.nsImage,
              let tiff = image.tiffRepresentation,
              let rep = NSBitmapImageRep(data: tiff),
              let png = rep.representation(using: .png, properties: [:]) else {
            print("Could not render \(url.lastPathComponent)")
            return
        }
        try? png.write(to: url)
        print("Wrote \(url.path)")
    }
}
