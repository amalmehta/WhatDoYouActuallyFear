import AppKit
import SwiftUI
import UniformTypeIdentifiers

/// Export and import of the progress file: file panels, the replace confirmation,
/// and (in the main window) dropping a file anywhere or pasting it with ⌘V.
struct ProgressTransfer: ViewModifier {
    @Environment(AppStore.self) private var store
    @Binding var showImporter: Bool
    @Binding var showExporter: Bool
    var acceptsDropAndPaste = false

    @State private var pending: ImportPreview?
    @State private var errorMessage: String?
    @State private var dropTargeted = false

    func body(content: Content) -> some View {
        content
            .fileImporter(isPresented: $showImporter, allowedContentTypes: [.json]) { result in
                switch result {
                case .success(let url): load(url)
                case .failure(let error): errorMessage = error.localizedDescription
                }
            }
            .fileExporter(isPresented: $showExporter, document: exportDocument, contentType: .json,
                          defaultFilename: ProgressFile.fileName) { result in
                if case .failure(let error) = result { errorMessage = error.localizedDescription }
            }
            .alert(store.profile == nil ? "Import this progress?" : "Replace your progress?",
                   isPresented: Binding(get: { pending != nil }, set: { if !$0 { pending = nil } }),
                   presenting: pending) { preview in
                Button(store.profile == nil ? "Import" : "Replace", role: store.profile == nil ? nil : .destructive) {
                    store.importProfile(preview.profile)
                }
                Button("Cancel", role: .cancel) {}
            } message: { preview in
                Text(store.profile == nil
                     ? preview.summary
                     : "\(preview.summary)\n\nThis replaces your current answers, quests and journal.")
            }
            .alert("Couldn't import", isPresented: Binding(get: { errorMessage != nil }, set: { if !$0 { errorMessage = nil } })) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(errorMessage ?? "")
            }
            .modifier(DropAndPaste(enabled: acceptsDropAndPaste, targeted: $dropTargeted,
                                   onFile: load, onData: { read($0) }))
    }

    private var exportDocument: ProgressDocument? {
        store.profile.flatMap { try? ProgressDocument(profile: $0) }
    }

    private func load(_ url: URL) {
        let scoped = url.startAccessingSecurityScopedResource()
        defer { if scoped { url.stopAccessingSecurityScopedResource() } }
        do {
            read(try Data(contentsOf: url))
        } catch {
            errorMessage = "Couldn't open \(url.lastPathComponent)."
        }
    }

    private func read(_ data: Data) {
        do {
            pending = try store.preview(data)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

/// Accepts a progress file dropped anywhere on the window, or pasted with ⌘V when no text field is being edited.
private struct DropAndPaste: ViewModifier {
    let enabled: Bool
    @Binding var targeted: Bool
    let onFile: (URL) -> Void
    let onData: (Data) -> Void
    @State private var monitor: Any?

    func body(content: Content) -> some View {
        if enabled {
            content
                .dropDestination(for: URL.self) { urls, _ in
                    guard let url = urls.first(where: \.isFileURL) else { return false }
                    onFile(url)
                    return true
                } isTargeted: { targeted = $0 }
                .overlay {
                    if targeted {
                        RoundedRectangle(cornerRadius: 16)
                            .strokeBorder(Theme.accent, style: StrokeStyle(lineWidth: 3, dash: [10, 6]))
                            .background(RoundedRectangle(cornerRadius: 16).fill(Theme.accent.opacity(0.08)))
                            .overlay(Label("Drop to import your progress", systemImage: "square.and.arrow.down")
                                .font(.title2.weight(.semibold))
                                .padding(16)
                                .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12)))
                            .padding(10)
                            .allowsHitTesting(false)
                    }
                }
                .onAppear(perform: installPasteMonitor)
                .onDisappear(perform: removePasteMonitor)
        } else {
            content
        }
    }

    private func installPasteMonitor() {
        guard monitor == nil else { return }
        monitor = NSEvent.addLocalMonitorForEvents(matching: .keyDown) { event in
            guard event.modifierFlags.intersection(.deviceIndependentFlagsMask) == .command,
                  event.charactersIgnoringModifiers == "v",
                  !(event.window?.firstResponder is NSText) else { return event }
            let pasteboard = NSPasteboard.general
            if let url = (pasteboard.readObjects(forClasses: [NSURL.self], options: [.urlReadingFileURLsOnly: true]) as? [URL])?.first,
               url.pathExtension.lowercased() == "json" {
                onFile(url)
                return nil
            }
            if let text = pasteboard.string(forType: .string)?.trimmingCharacters(in: .whitespacesAndNewlines),
               text.hasPrefix("{"), let data = text.data(using: .utf8) {
                onData(data)
                return nil
            }
            return event
        }
    }

    private func removePasteMonitor() {
        if let monitor { NSEvent.removeMonitor(monitor) }
        monitor = nil
    }
}

/// Export and Import buttons, used in Settings.
struct TransferButtons: View {
    @Environment(AppStore.self) private var store
    @State private var showImporter = false
    @State private var showExporter = false

    var body: some View {
        HStack {
            Button("Export Progress…") { showExporter = true }
                .disabled(store.profile == nil)
                .help("Save your answers, quests and journal to a file")
            Button("Import Progress…") { showImporter = true }
                .help("Load a progress file from this app or the website")
        }
        .modifier(ProgressTransfer(showImporter: $showImporter, showExporter: $showExporter))
    }
}
