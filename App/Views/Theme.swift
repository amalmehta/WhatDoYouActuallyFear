import AppKit
import SwiftUI

/// Colors. Related fears share a hue family; shades within a family differ
/// in hue, saturation and brightness so they stay distinct in light and dark mode.
enum Theme {
    static func color(hue: Double, shade: Int, scheme: ColorScheme, saturation: Double = 1) -> Color {
        let s = max(0, min(2, shade))
        let hueOffset = [-0.025, 0, 0.025][s]
        let light = (sat: [0.85, 0.70, 0.60][s], bri: [0.50, 0.66, 0.82][s])
        let dark = (sat: [0.45, 0.60, 0.75][s], bri: [1.00, 0.85, 0.70][s])
        let pick = scheme == .dark ? dark : light
        var h = hue + hueOffset
        if h < 0 { h += 1 }
        if h > 1 { h -= 1 }
        return Color(hue: h, saturation: pick.sat * saturation, brightness: pick.bri)
    }

    static func color(_ fear: FearID, _ scheme: ColorScheme) -> Color {
        let info = fear.info
        return color(hue: info.family.hue, shade: info.shade, scheme: scheme)
    }

    static func color(_ family: FearFamily, _ scheme: ColorScheme) -> Color {
        color(hue: family.hue, shade: 1, scheme: scheme)
    }

    static func color(_ source: SourceKind, _ scheme: ColorScheme) -> Color {
        switch source.group {
        case .people: color(hue: 0.93, shade: source.shade, scheme: scheme)   // rose
        case .events: color(hue: 0.14, shade: source.shade, scheme: scheme)   // gold
        case .unknown: color(hue: 0, shade: 1, scheme: scheme, saturation: 0) // gray
        }
    }

    static func background(_ scheme: ColorScheme) -> Color {
        scheme == .dark ? Color(white: 0.11) : Color(white: 0.965)
    }

    static func card(_ scheme: ColorScheme) -> Color {
        scheme == .dark ? Color(white: 0.16) : Color.white
    }

    static let accent = Color(hue: 0.05, saturation: 0.75, brightness: 0.85)
}

struct CardModifier: ViewModifier {
    @Environment(\.colorScheme) private var scheme
    var padding: CGFloat = 18

    func body(content: Content) -> some View {
        content
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(RoundedRectangle(cornerRadius: 14, style: .continuous).fill(Theme.card(scheme)))
            .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).strokeBorder(.primary.opacity(0.07)))
    }
}

extension View {
    func card(padding: CGFloat = 18) -> some View { modifier(CardModifier(padding: padding)) }
}

/// A colored chip naming a fear.
struct FearTag: View {
    @Environment(\.colorScheme) private var scheme
    let fear: FearID
    var large = false

    var body: some View {
        let color = Theme.color(fear, scheme)
        HStack(spacing: 6) {
            Circle().fill(color).frame(width: large ? 10 : 8, height: large ? 10 : 8)
            Text(fear.info.name)
                .font(large ? .headline : .caption.weight(.semibold))
        }
        .padding(.horizontal, large ? 12 : 9)
        .padding(.vertical, large ? 6 : 4)
        .background(Capsule().fill(color.opacity(scheme == .dark ? 0.22 : 0.16)))
        .overlay(Capsule().strokeBorder(color.opacity(0.55)))
        .help("\(fear.info.family.title) family")
    }
}

/// A colored chip naming where a fear came from.
struct SourceTag: View {
    @Environment(\.colorScheme) private var scheme
    let source: SourceKind

    var body: some View {
        let color = Theme.color(source, scheme)
        HStack(spacing: 6) {
            Image(systemName: "arrow.uturn.backward.circle.fill").foregroundStyle(color)
            Text(source.title).font(.caption.weight(.semibold))
        }
        .padding(.horizontal, 9)
        .padding(.vertical, 4)
        .background(Capsule().fill(color.opacity(scheme == .dark ? 0.22 : 0.16)))
        .overlay(Capsule().strokeBorder(color.opacity(0.55)))
    }
}

/// Horizontal bars for every fear, highest first.
struct FearBars: View {
    @Environment(\.colorScheme) private var scheme
    let scores: [FearScore]
    var highlight: Set<FearID> = []

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            ForEach(scores) { score in
                let isFocus = highlight.isEmpty || highlight.contains(score.fear)
                HStack(spacing: 10) {
                    Text(score.fear.info.name)
                        .font(.callout.weight(isFocus ? .semibold : .regular))
                        .foregroundStyle(isFocus ? .primary : .secondary)
                        .frame(width: 190, alignment: .trailing)
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(.primary.opacity(0.06))
                            Capsule()
                                .fill(Theme.color(score.fear, scheme).opacity(isFocus ? 1 : 0.45))
                                .frame(width: max(6, geo.size.width * CGFloat(score.percent) / 100))
                        }
                    }
                    .frame(height: 12)
                    Text("\(score.percent)%")
                        .font(.callout.monospacedDigit())
                        .foregroundStyle(.secondary)
                        .frame(width: 44, alignment: .trailing)
                }
                .accessibilityElement(children: .combine)
            }
        }
    }
}

/// Colored legend of fear families.
struct FamilyLegend: View {
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        HStack(spacing: 14) {
            ForEach(FearFamily.allCases) { family in
                HStack(spacing: 5) {
                    Circle().fill(Theme.color(family, scheme)).frame(width: 8, height: 8)
                    Text(family.title).font(.caption).foregroundStyle(.secondary)
                }
            }
        }
    }
}

enum Appearance: String, CaseIterable, Identifiable {
    case system = "System", light = "Light", dark = "Dark"
    var id: String { rawValue }

    @MainActor
    func apply() {
        switch self {
        case .system: NSApp.appearance = nil
        case .light: NSApp.appearance = NSAppearance(named: .aqua)
        case .dark: NSApp.appearance = NSAppearance(named: .darkAqua)
        }
    }
}

enum SettingsKey {
    static let focusCount = "focusCount"
    static let showXP = "showXP"
    static let appearance = "appearance"
}

/// A thin progress bar (drawn by hand so it also renders in README screenshots).
struct Meter: View {
    let fraction: Double

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(.primary.opacity(0.08))
                Capsule().fill(Theme.accent)
                    .frame(width: max(0, min(1, fraction)) * geo.size.width)
            }
        }
        .frame(height: 6)
        .accessibilityValue("\(Int(fraction * 100)) percent")
    }
}
