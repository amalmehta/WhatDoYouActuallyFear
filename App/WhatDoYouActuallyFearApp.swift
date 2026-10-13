import AppKit
import SwiftUI

@main
struct WhatDoYouActuallyFearApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) private var delegate
    @State private var store = AppStore()

    var body: some Scene {
        Window("What Do You Actually Fear", id: "main") {
            RootView()
                .environment(store)
        }
        .defaultSize(width: 1040, height: 760)
        .commands {
            CommandGroup(replacing: .newItem) {}
            CommandGroup(after: .appSettings) {
                Button("Retake the Questionnaire") { store.start() }
                    .disabled(store.profile == nil)
            }
        }

        Settings {
            SettingsView()
                .environment(store)
        }
    }
}

final class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        // `--screenshots <folder>` renders README images and quits.
        let args = CommandLine.arguments
        if let index = args.firstIndex(of: "--screenshots"), index + 1 < args.count {
            let folder = URL(fileURLWithPath: args[index + 1], isDirectory: true)
            Task { @MainActor in
                ScreenshotRenderer.renderAll(to: folder)
                NSApp.terminate(nil)
            }
        }
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }
}
