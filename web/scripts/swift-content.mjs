// Reads the quiz content out of the Mac app's Swift source.
// Used by `npm run copy-content` (writes src/model/content.ts) and by the parity test.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const swiftModelDir = join(here, "..", "..", "App", "Model");

const STR = String.raw`"((?:[^"\\]|\\.)*)"`;
const unescape = (s) => s.replace(/\\(.)/g, "$1");
const strings = (text) => [...text.matchAll(new RegExp(STR, "g"))].map((m) => unescape(m[1]));
const between = (text, start, end) => {
  const a = text.indexOf(start);
  if (a < 0) throw new Error(`Not found in Swift source: ${start}`);
  const b = end ? text.indexOf(end, a + start.length) : text.length;
  if (b < 0) throw new Error(`Not found in Swift source: ${end}`);
  return text.slice(a + start.length, b);
};
const read = (name) => readFileSync(join(swiftModelDir, name), "utf8");

export function parseSwiftContent() {
  const fear = read("Fear.swift");
  const library = read("FearLibrary.swift");
  const questions = read("Questions.swift");
  const engine = read("Engine.swift");
  const examplesFile = read("AreaExamples.swift");

  // Families
  const familyEnum = between(fear, "enum FearFamily", "enum FearID");
  const familyIds = between(familyEnum, "case ", "\n").split(",").map((s) => s.trim());
  const familyTitles = Object.fromEntries(
    [...between(familyEnum, "var title", "var hue").matchAll(new RegExp(String.raw`case \.(\w+): ${STR}`, "g"))].map((m) => [m[1], unescape(m[2])]));
  const familyEmoji = Object.fromEntries(
    [...between(familyEnum, "var emoji", "var hue").matchAll(new RegExp(String.raw`case \.(\w+): ${STR}`, "g"))].map((m) => [m[1], unescape(m[2])]));
  const familyHues = Object.fromEntries(
    [...between(familyEnum, "var hue").matchAll(/case \.(\w+): ([\d.]+)/g)].map((m) => [m[1], Number(m[2])]));
  const families = familyIds.map((id) => ({ id, title: familyTitles[id], emoji: familyEmoji[id], hue: familyHues[id] }));

  // Fear ids, in declaration order
  const fearEnum = between(fear, "enum FearID", "var id");
  const fearIds = [...fearEnum.matchAll(/^\s*case ([\w, ]+)$/gm)].flatMap((m) => m[1].split(",").map((s) => s.trim()));

  // Fear content
  const fears = fearIds.map((id) => {
    const block = between(library, `.${id}: FearInfo(`, "]),");
    const one = (label) => unescape(block.match(new RegExp(`${label}: ${STR}`))[1]);
    const ladderText = between(block, "ladder: [");
    const ladder = [...ladderText.matchAll(new RegExp(String.raw`q\(${STR}, ${STR}\)`, "g"))]
      .map((m) => ({ title: unescape(m[1]), detail: unescape(m[2]) }));
    return {
      id,
      name: one("name"),
      family: block.match(/family: \.(\w+)/)[1],
      shade: Number(block.match(/shade: (\d)/)[1]),
      summary: one("summary"),
      howItKeepsYouStuck: strings(between(block, "howItKeepsYouStuck: [", "],")),
      coreBelief: one("coreBelief"),
      reframe: one("reframe"),
      ladder,
    };
  });

  // Sources
  const sourceEnum = between(fear, "enum SourceKind", "enum LifeArea");
  const sourceIds = between(sourceEnum, "case ", "\n").split(",").map((s) => s.trim());
  const groupOf = {};
  for (const m of between(sourceEnum, "var group: Group", "var shade").matchAll(/case ([.\w, ]+): \.(\w+)/g)) {
    for (const id of m[1].split(",")) groupOf[id.trim().slice(1)] = m[2];
  }
  const shadeOf = {};
  for (const m of between(sourceEnum, "var shade: Int", "var title").matchAll(/case ([.\w, ]+): (\d)/g)) {
    for (const id of m[1].split(",")) shadeOf[id.trim().slice(1)] = Number(m[2]);
  }
  const titleOf = Object.fromEntries(
    [...between(sourceEnum, "var title", "var howItFormed").matchAll(new RegExp(String.raw`case \.(\w+): ${STR}`, "g"))].map((m) => [m[1], unescape(m[2])]));
  const formedOf = Object.fromEntries(
    [...between(sourceEnum, "var howItFormed", "var exercise").matchAll(new RegExp(String.raw`case \.(\w+):\s+${STR}`, "g"))].map((m) => [m[1], unescape(m[2])]));
  const exerciseOf = Object.fromEntries(
    [...between(sourceEnum, "var exercise").matchAll(new RegExp(String.raw`case \.(\w+):\s+QuestTemplate\(title: ${STR},\s+detail: ${STR}\)`, "g"))]
      .map((m) => [m[1], { title: unescape(m[2]), detail: unescape(m[3]) }]));
  const sources = sourceIds.map((id) => ({
    id, group: groupOf[id], shade: shadeOf[id], title: titleOf[id], howItFormed: formedOf[id], exercise: exerciseOf[id],
  }));

  // Life areas
  const areaEnum = between(fear, "enum LifeArea");
  const areaIds = between(areaEnum, "case ", "\n").split(",").map((s) => s.trim());
  const areaTitles = Object.fromEntries(
    [...between(areaEnum, "var title", "var symbol").matchAll(new RegExp(String.raw`case \.(\w+): ${STR}`, "g"))].map((m) => [m[1], unescape(m[2])]));
  const lifeAreas = areaIds.map((id) => ({ id, title: areaTitles[id] }));

  // Questions
  const scale = strings(between(questions, "static let scale = [", "]"));
  const questionList = [...questions.matchAll(new RegExp(String.raw`Question\(id: ${STR}, text: ${STR}, weights: \[([^\]]*)\]\)`, "g"))]
    .map((m) => ({
      id: unescape(m[1]),
      text: unescape(m[2]),
      weights: Object.fromEntries([...m[3].matchAll(/\.(\w+): ([\d.]+)/g)].map((w) => [w[1], Number(w[2])])),
    }));

  // Questionnaire parts
  const sections = [...questions.matchAll(new RegExp(String.raw`QuestionSection\(title: ${STR}, range: (\d+)\.\.<(\d+), cheer: ${STR}\)`, "g"))]
    .map((m) => ({ title: unescape(m[1]), start: Number(m[2]), end: Number(m[3]), cheer: unescape(m[4]) }));

  // Encouragement after a finished quest
  const cheers = strings(between(read("Encouragement.swift"), "static let questDone: [String] = [", "]"));

  // Game constants
  const numbers = (label) => between(engine, label, "]").match(/\d+/g).map(Number);
  const rules = {
    stepXP: numbers("static let stepXP = ["),
    sourceXP: Number(engine.match(/static let sourceXP = (\d+)/)[1]),
    bossXP: Number(engine.match(/static let bossXP = (\d+)/)[1]),
    maxFocus: Number(engine.match(/static let maxFocus = (\d+)/)[1]),
    ranks: [...between(engine, "static let ranks", "]\n").matchAll(new RegExp(String.raw`\((\d+), ${STR}\)`, "g"))]
      .map((m) => ({ floor: Number(m[1]), title: unescape(m[2]) })),
  };

  // Area examples: fear -> area -> five strings (one per ladder step)
  const examples = {};
  const fearBlocks = examplesFile.split(/^ {8}\.(\w+): \[$/m).slice(1);
  for (let i = 0; i < fearBlocks.length; i += 2) {
    const areaBlocks = fearBlocks[i + 1].split(/^ {12}\.(\w+): \[$/m).slice(1);
    examples[fearBlocks[i]] = {};
    for (let j = 0; j < areaBlocks.length; j += 2) {
      examples[fearBlocks[i]][areaBlocks[j]] = strings(areaBlocks[j + 1].split(/^ {12}\],$/m)[0]);
    }
  }

  return { families, fears, sources, lifeAreas, scale, questions: questionList, sections, cheers, rules, examples };
}
