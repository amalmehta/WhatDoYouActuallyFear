import AppKit
import SwiftUI

/// All preferences in one place (⌘,).
struct SettingsView: View {
    @Environment(AppStore.self) private var store
    @AppStorage(SettingsKey.focusCount) private var focusCount = 3
    @AppStorage(SettingsKey.showXP) private var showXP = true
    @AppStorage(SettingsKey.appearance) private var appearance = Appearance.system.rawValue
    @State private var confirmErase = false

    var body: some View {
        Form {
            Section("Your plan") {
                Picker("Fears to focus on", selection: $focusCount) {
                    Text("Just the top one").tag(1)
                    Text("Top two").tag(2)
                    Text("Top three").tag(3)
                }
                Toggle("Show XP and ranks", isOn: $showXP)
            }
            Section("Appearance") {
                Picker("Theme", selection: $appearance) {
                    ForEach(Appearance.allCases) { Text($0.rawValue).tag($0.rawValue) }
                }
                .pickerStyle(.segmented)
            }
            Section("Your data") {
                LabeledContent("Saved in") {
                    Text(store.dataDirectory.path(percentEncoded: false))
                        .font(.caption)
                        .textSelection(.enabled)
                        .lineLimit(2)
                }
                HStack {
                    Button("Show in Finder") {
                        try? FileManager.default.createDirectory(at: store.dataDirectory, withIntermediateDirectories: true)
                        NSWorkspace.shared.open(store.dataDirectory)
                    }
                    Button("Retake the questionnaire") { store.start() }
                        .disabled(store.profile == nil)
                    Spacer()
                }
                TransferButtons()
                Text("A progress file works in both this app and the website. You can also drop one on the main window or paste it with ⌘V.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                HStack {
                    Spacer()
                    Button("Erase everything…", role: .destructive) { confirmErase = true }
                }
                if let error = store.lastSaveError {
                    Text("Couldn't save: \(error)").foregroundStyle(.red).font(.caption)
                }
            }
        }
        .formStyle(.grouped)
        .frame(width: 520)
        .fixedSize(horizontal: false, vertical: true)
        .confirmationDialog("Erase your answers, quests and journal?", isPresented: $confirmErase) {
            Button("Erase everything", role: .destructive) { store.eraseEverything() }
        } message: {
            Text("This can't be undone. Feedback you've written is kept.")
        }
    }
}

/// Small feedback form. Entries are saved to Feedback.json in the data folder.
struct FeedbackView: View {
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    @State private var kind: FeedbackEntry.Kind = .idea
    @State private var text = ""
    @State private var error: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Feedback").font(.title2.weight(.bold))
            Picker("About", selection: $kind) {
                ForEach(FeedbackEntry.Kind.allCases) { Text($0.rawValue).tag($0) }
            }
            TextEditor(text: $text)
                .font(.body)
                .frame(height: 140)
                .overlay(RoundedRectangle(cornerRadius: 6).strokeBorder(.primary.opacity(0.15)))
            Text("Saved on this Mac, in the app's data folder (Settings → Show in Finder).")
                .font(.caption).foregroundStyle(.secondary)
            if let error { Text(error).font(.caption).foregroundStyle(.red) }
            HStack {
                Button("Copy") {
                    NSPasteboard.general.clearContents()
                    NSPasteboard.general.setString("[\(kind.rawValue)] \(text)", forType: .string)
                }
                .disabled(text.isEmpty)
                Spacer()
                Button("Cancel") { dismiss() }.keyboardShortcut(.cancelAction)
                Button("Save") {
                    do {
                        try store.saveFeedback(FeedbackEntry(date: Date(), kind: kind, text: text))
                        dismiss()
                    } catch {
                        self.error = error.localizedDescription
                    }
                }
                .buttonStyle(.borderedProminent)
                .tint(Theme.accent)
                .disabled(text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                .keyboardShortcut(.defaultAction)
            }
        }
        .padding(22)
        .frame(width: 440)
    }
}
