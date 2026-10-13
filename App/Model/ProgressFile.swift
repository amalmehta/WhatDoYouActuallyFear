import Foundation
import SwiftUI
import UniformTypeIdentifiers

/// The progress file shared by the Mac app and the website: a Profile as JSON.
/// The same format as Profile.json, so either app can read the other's export.
enum ProgressFile {
    static let fileName = "What Do You Actually Fear Progress.json"

    struct ImportError: LocalizedError {
        let errorDescription: String?
        init(_ message: String) { errorDescription = message }
    }

    static var encoder: JSONEncoder {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        return encoder
    }

    /// Accepts ISO 8601 dates with or without fractional seconds (browsers write milliseconds).
    static var decoder: JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom { decoder in
            let text = try decoder.singleValueContainer().decode(String.self)
            let plain = ISO8601DateFormatter()
            let fractional = ISO8601DateFormatter()
            fractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let date = plain.date(from: text) ?? fractional.date(from: text) { return date }
            throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Bad date: \(text)"))
        }
        return decoder
    }

    static func encode(_ profile: Profile) throws -> Data {
        try encoder.encode(profile)
    }

    static func decode(_ data: Data) throws -> Profile {
        let profile: Profile
        do {
            profile = try decoder.decode(Profile.self, from: data)
        } catch {
            throw ImportError("This isn't a What Do You Actually Fear progress file.")
        }
        try validate(profile)
        return profile
    }

    static func validate(_ profile: Profile) throws {
        let ids = Set(Questions.all.map(\.id))
        guard !profile.answers.isEmpty else { throw ImportError("This progress file has no answers in it.") }
        guard profile.answers.keys.allSatisfy(ids.contains) else { throw ImportError("This progress file has answers to questions this app doesn't know.") }
        guard profile.answers.values.allSatisfy((0...4).contains) else { throw ImportError("This progress file has answers out of range.") }
        guard profile.accepted.values.allSatisfy((0...10).contains),
              profile.completions.values.allSatisfy({ (0...10).contains($0.predicted) && (0...10).contains($0.actual) && $0.xp >= 0 })
        else { throw ImportError("This progress file has fear ratings out of range.") }
    }
}

/// What's in a file, shown before it replaces anything.
struct ImportPreview: Identifiable {
    let id = UUID()
    let profile: Profile

    var summary: String {
        let top = Engine.topFears(profile.answers, count: 1).first.map { $0.info.name } ?? "—"
        let done = profile.completions.count
        let date = profile.createdAt.formatted(date: .abbreviated, time: .omitted)
        return "From \(date). Top fear: \(top). \(done) quest\(done == 1 ? "" : "s") done."
    }
}

struct ProgressDocument: FileDocument {
    static var readableContentTypes: [UTType] { [.json] }
    let data: Data

    init(profile: Profile) throws { data = try ProgressFile.encode(profile) }

    init(configuration: ReadConfiguration) throws {
        guard let data = configuration.file.regularFileContents else { throw CocoaError(.fileReadCorruptFile) }
        self.data = data
    }

    func fileWrapper(configuration: WriteConfiguration) throws -> FileWrapper {
        FileWrapper(regularFileWithContents: data)
    }
}
