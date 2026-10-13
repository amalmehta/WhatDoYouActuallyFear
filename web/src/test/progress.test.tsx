// Progress file export/import, including files from the Mac app (Tests/Fixtures).
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "../App";
import { demoProfile } from "../model/demo";
import { exportProgress, parseProgress, ProgressError } from "../model/progress";
import { keys } from "../model/store";

const fixtures = join(__dirname, "..", "..", "..", "Tests", "Fixtures");
const macFile = readFileSync(join(fixtures, "Progress from Mac.json"), "utf8");
const websiteFixture = join(fixtures, "Progress from Website.json");

afterEach(() => vi.restoreAllMocks());

describe("progress file", () => {
  it("reads a file exported by the Mac app", () => {
    const profile = parseProgress(macFile);
    expect(profile.lifeArea).toBe("creativity");
    expect(profile.goal).toBe("Show my paintings");
    expect(Object.keys(profile.answers)).toHaveLength(22);
    expect(profile.completions["failure.source"].note).toBe('Wrote it, "cried" a bit, felt lighter.');
  });

  it("writes the file the Mac app's tests read back (Tests/Fixtures/Progress from Website.json)", () => {
    const text = exportProgress(parseProgress(macFile));
    if (process.env.UPDATE_FIXTURES) writeFileSync(websiteFixture, text);
    expect(text).toBe(readFileSync(websiteFixture, "utf8"));
  });

  it("round-trips and drops milliseconds from dates", () => {
    const profile = demoProfile();
    const text = exportProgress(profile);
    expect(text).not.toMatch(/\.\d{3}Z/);
    const back = parseProgress(text);
    expect(back.answers).toEqual(profile.answers);
    expect(Object.keys(back.completions)).toEqual(Object.keys(profile.completions).sort());
    expect(Math.abs(Date.parse(back.createdAt) - Date.parse(profile.createdAt))).toBeLessThan(1000);
  });

  it("rejects files that aren't progress", () => {
    const bad = (text: string, message: RegExp) => {
      expect(() => parseProgress(text)).toThrow(ProgressError);
      expect(() => parseProgress(text)).toThrow(message);
    };
    const good = JSON.parse(macFile);
    bad("not json", /isn't a What Do You Actually Fear progress file/);
    bad("[1,2]", /isn't a/);
    bad(JSON.stringify({ ...good, lifeArea: "space" }), /isn't a/);
    bad(JSON.stringify({ ...good, answers: {} }), /no answers/);
    bad(JSON.stringify({ ...good, answers: { q99: 1 } }), /doesn't know/);
    bad(JSON.stringify({ ...good, answers: { ...good.answers, q01: 7 } }), /out of range/);
    bad(JSON.stringify({ ...good, sources: { dragons: "criticism" } }), /isn't a/);
    bad(JSON.stringify({ ...good, accepted: { "failure.step1": 11 } }), /fear ratings/);
  });
});

describe("import and export in the page", () => {
  const file = (text: string, name = "What Do You Actually Fear Progress.json") => new File([text], name, { type: "application/json" });

  it("imports from the welcome screen's file picker", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /Have a progress file/ }));
    await user.upload(screen.getByTestId("import-input"), file(macFile));
    const dialog = await screen.findByRole("dialog", { name: "Import this progress?" });
    expect(dialog.textContent).toContain("1 quest done");
    await user.click(within(dialog).getByRole("button", { name: "Import" }));
    expect(screen.getByRole("heading", { name: "Quest Board" })).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(keys.profile)!).goal).toBe("Show my paintings");
  });

  it("asks before replacing existing progress, and Cancel keeps it", async () => {
    localStorage.setItem(keys.profile, JSON.stringify(demoProfile()));
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /Import progress/ }));
    await user.upload(screen.getByTestId("import-input"), file(macFile));
    const dialog = await screen.findByRole("dialog", { name: "Replace your progress?" });
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(JSON.parse(localStorage.getItem(keys.profile)!).goal).toBe("Pitch my own project at work");
  });

  it("accepts a file dropped anywhere on the page", async () => {
    render(<App />);
    const dataTransfer = { types: ["Files"], files: [file(macFile)] };
    fireEvent.dragEnter(window, { dataTransfer });
    expect(document.querySelector(".drop-overlay")).toBeTruthy();
    fireEvent.drop(window, { dataTransfer });
    expect(await screen.findByRole("dialog", { name: "Import this progress?" })).toBeTruthy();
    expect(document.querySelector(".drop-overlay")).toBeNull();
  });

  it("accepts pasted file text, but leaves pasting into text fields alone", async () => {
    const user = userEvent.setup();
    render(<App />);
    const paste = (target: EventTarget, text: string) => {
      const event = new Event("paste", { bubbles: true }) as ClipboardEvent;
      Object.defineProperty(event, "clipboardData", { value: { files: [], getData: () => text } });
      target.dispatchEvent(event);
    };
    await user.click(screen.getByRole("button", { name: "Begin" }));
    paste(screen.getByPlaceholderText(/design lead/), macFile);
    expect(screen.queryByRole("dialog")).toBeNull();
    paste(document.body, macFile);
    expect(await screen.findByRole("dialog", { name: "Import this progress?" })).toBeTruthy();
  });

  it("explains a bad file", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /Have a progress file/ }));
    await user.upload(screen.getByTestId("import-input"), file("{\"hello\": 1}"));
    const dialog = await screen.findByRole("dialog", { name: "Couldn't import" });
    expect(dialog.textContent).toContain("isn't a What Do You Actually Fear progress file");
  });

  it("exports a file from the sidebar", async () => {
    const created: Blob[] = [];
    URL.createObjectURL = vi.fn((blob: Blob) => { created.push(blob); return "blob:progress"; });
    URL.revokeObjectURL = vi.fn();
    const clicked = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const user = userEvent.setup();
    render(<App demo />);
    await user.click(screen.getByRole("button", { name: /Export progress/ }));
    expect(clicked).toHaveBeenCalled();
    await waitFor(() => expect(created).toHaveLength(1));
    const exported = parseProgress(await created[0].text());
    expect(exported.goal).toBe("Pitch my own project at work");
  });
});
