// Drives the real UI: questionnaire → results → quests → settings → feedback.
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "../App";
import { questions } from "../model/content";
import { keys } from "../model/store";

async function finishQuestionnaire(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Let's begin" }));
  await user.click(screen.getByRole("radio", { name: /Creative work/ }));
  await user.type(screen.getByPlaceholderText(/design lead/), "Show my paintings");
  await user.click(screen.getByRole("button", { name: "Continue" }));
  // First answer by clicking, the rest with keys 1–5.
  await user.click(screen.getByRole("button", { name: /That's me/ }));
  for (let i = 1; i < questions.length; i++) {
    // A breather screen sits between the four parts.
    const breather = screen.queryByRole("button", { name: "Keep going" });
    if (breather) await user.click(breather);
    await user.keyboard(String((i % 5) + 1));
  }
  for (let i = 0; i < 3; i++) {
    await user.click(screen.getByRole("radio", { name: /Criticism or pressure/ }));
    await user.click(screen.getByRole("button", { name: i < 2 ? "Next fear" : "Show me my fears" }));
  }
}

describe("website flow", () => {
  it("pauses between the four parts of the questionnaire", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Let's begin" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText(/Part 1 of 4/)).toBeTruthy();
    for (let i = 0; i < 6; i++) await user.keyboard("3");
    expect(screen.getByRole("heading", { name: "Part 1 done" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Keep going" }));
    expect(screen.getByText(/Part 2 of 4/)).toBeTruthy();
    expect(screen.getByText(`Statement 7 of ${questions.length}`)).toBeTruthy();
  });

  it("puts the next step first and explains quests once", async () => {
    const user = userEvent.setup();
    render(<App />);
    await finishQuestionnaire(user);
    await user.click(screen.getByRole("button", { name: "Show me my quests" }));
    const next = screen.getByRole("region", { name: "Your next step" });
    expect(within(next).getByRole("button", { name: "Accept quest" })).toBeTruthy();
    const intro = screen.getByRole("region", { name: "How quests work" });
    await user.click(within(intro).getByRole("button", { name: "Got it" }));
    expect(screen.queryByRole("region", { name: "How quests work" })).toBeNull();
    expect(JSON.parse(localStorage.getItem(keys.settings)!).seenQuestIntro).toBe(true);
  });

  it("goes from the questionnaire to a saved quest plan", async () => {
    const user = userEvent.setup();
    render(<App />);
    await finishQuestionnaire(user);

    expect(screen.getByRole("heading", { name: /been holding you back/ })).toBeTruthy();
    expect(screen.getByRole("list", { name: "Every fear's score" }).children).toHaveLength(11);
    const saved = JSON.parse(localStorage.getItem(keys.profile)!);
    expect(Object.keys(saved.answers)).toHaveLength(questions.length);
    expect(saved.lifeArea).toBe("creativity");

    await user.click(screen.getByRole("button", { name: "Show me my quests" }));
    expect(screen.getByRole("heading", { name: "Quest Board" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Final boss" }).textContent).toContain("Show my paintings");
    // Steps show an example for the chosen area (Creative work).
    expect(screen.getAllByRole("img", { name: "Creative work" }).length).toBeGreaterThanOrEqual(5);

    // Accept the first quest, then finish it.
    await user.click(screen.getAllByRole("button", { name: "Accept" })[0]);
    const accept = screen.getByRole("dialog");
    await user.click(within(accept).getByRole("button", { name: "Accept quest" }));
    await user.click(screen.getAllByRole("button", { name: "I did it" })[0]);
    const finish = screen.getByRole("dialog");
    await user.type(within(finish).getByRole("textbox"), "Less scary than I thought");
    await user.click(within(finish).getByRole("button", { name: "I did it" }));

    // Finishing celebrates, then gets out of the way.
    const party = screen.getByRole("dialog", { name: "Quest complete!" });
    expect(party.textContent).toContain("+30 XP");
    await user.click(within(party).getByRole("button", { name: "Keep going" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText(/points less scary than you expected|facing it head-on/)).toBeTruthy();
    expect(screen.getByText(/feared 5 → felt 5/)).toBeTruthy();

    const completions = JSON.parse(localStorage.getItem(keys.profile)!).completions;
    expect(Object.values(completions)).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: /Journal/ }));
    expect(screen.getByText("Less scary than I thought")).toBeTruthy();
  });

  it("restores saved progress on reload", async () => {
    const user = userEvent.setup();
    const first = render(<App />);
    await finishQuestionnaire(user);
    await user.click(screen.getByRole("button", { name: "Show me my quests" }));
    first.unmount();
    render(<App />);
    expect(screen.getByRole("heading", { name: "Quest Board" })).toBeTruthy();
  });

  it("back steps through the questionnaire", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Let's begin" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.keyboard("3");
    expect(screen.getByText(`Statement 2 of ${questions.length}`)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Back/ }));
    expect(screen.getByText(`Statement 1 of ${questions.length}`)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Sometimes/ }).getAttribute("aria-pressed")).toBe("true");
  });

  it("opens settings with Ctrl+, and applies focus count, XP and theme", async () => {
    const user = userEvent.setup();
    render(<App demo />);
    expect(screen.getAllByRole("region", { name: /quests$/ })).toHaveLength(3);
    await user.keyboard("{Control>},{/Control}");
    const dialog = screen.getByRole("dialog", { name: "Settings" });
    await user.selectOptions(within(dialog).getByRole("combobox"), "1");
    await user.click(within(dialog).getByRole("switch"));
    await user.click(within(dialog).getByRole("radio", { name: "Dark" }));
    await user.click(within(dialog).getByRole("button", { name: "Done" }));
    expect(screen.getAllByRole("region", { name: /quests$/ })).toHaveLength(1);
    expect(screen.queryByText(/XP$/)).toBeNull();
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(localStorage.getItem(keys.profile)).toBeNull(); // demo never saves answers
  });

  it("erases everything after confirming", async () => {
    const user = userEvent.setup();
    render(<App />);
    await finishQuestionnaire(user);
    await user.click(screen.getByRole("button", { name: "Settings" }));
    await user.click(screen.getByRole("button", { name: "Erase everything…" }));
    await user.click(screen.getByRole("button", { name: "Erase everything" }));
    expect(screen.getByRole("button", { name: "Let's begin" })).toBeTruthy();
    expect(localStorage.getItem(keys.profile)).toBeNull();
  });

  it("saves feedback in the browser", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Feedback" }));
    const dialog = screen.getByRole("dialog", { name: "Feedback" });
    expect(within(dialog).getByRole("button", { name: "Save" }).hasAttribute("disabled")).toBe(true);
    await user.type(within(dialog).getByRole("textbox"), "More quests please");
    expect(within(dialog).getByRole("link", { name: "Open as GitHub issue" }).getAttribute("href")).toContain("More+quests+please");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(JSON.parse(localStorage.getItem(keys.feedback)!)[0].text).toBe("More quests please");
  });
});
