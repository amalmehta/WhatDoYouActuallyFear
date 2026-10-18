// The website's content must match the Mac app's Swift source exactly.
// If this fails after editing App/Model/*.swift, run `npm run copy-content`.
import { describe, expect, it } from "vitest";
import { parseSwiftContent } from "../../scripts/swift-content.mjs";
import * as web from "../model/content";

const swift = parseSwiftContent();

describe("content parity with the Mac app", () => {
  it("parsed a complete Swift library", () => {
    expect(swift.fears).toHaveLength(11);
    expect(swift.questions).toHaveLength(22);
    expect(swift.sources).toHaveLength(6);
    expect(swift.lifeAreas).toHaveLength(7);
    for (const fear of swift.fears) {
      expect(fear.ladder).toHaveLength(5);
      expect(fear.howItKeepsYouStuck.length).toBeGreaterThan(0);
    }
    for (const source of swift.sources) expect(source.exercise?.title).toBeTruthy();
    expect(swift.sections).toHaveLength(4);
    expect(swift.sections.at(-1)?.end).toBe(22);
    expect(swift.cheers.length).toBeGreaterThan(3);
    for (const family of swift.families) expect(family.emoji).toBeTruthy();
    for (const fear of swift.fears) {
      for (const area of swift.lifeAreas) expect((swift.examples as Record<string, Record<string, string[]>>)[fear.id]?.[area.id]).toHaveLength(5);
    }
  });

  it("families match", () => expect(web.families).toEqual(swift.families));
  it("fears match", () => expect(web.fears).toEqual(swift.fears));
  it("sources match", () => expect(web.sources).toEqual(swift.sources));
  it("life areas match", () => expect(web.lifeAreas).toEqual(swift.lifeAreas));
  it("answer scale matches", () => expect(web.scale).toEqual(swift.scale));
  it("questions and weights match", () => expect(web.questions).toEqual(swift.questions));
  it("XP and ranks match", () => expect(web.rules).toEqual(swift.rules));
  it("area examples match", () => expect(web.examples).toEqual(swift.examples));
  it("questionnaire parts match", () => expect(web.sections).toEqual(swift.sections));
  it("encouragement matches", () => expect(web.cheers).toEqual(swift.cheers));
});
