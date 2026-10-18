// Copies the quiz content from the Mac app's Swift source into src/model/content.ts.
// Run after editing App/Model/*.swift: `npm run copy-content`. The parity test fails until you do.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseSwiftContent } from "./swift-content.mjs";

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "model", "content.ts");
const c = parseSwiftContent();
const json = (v) => JSON.stringify(v, null, 2);

writeFileSync(out, `// Quiz content, copied from the Mac app's Swift source (App/Model) by \`npm run copy-content\`.
// Edit the Swift files, then re-run the script. src/test/parity.test.ts checks the two stay in sync.
import type { AreaExamples, Family, FearInfo, LifeArea, Question, QuestionSection, Rules, Source } from "./types";

export const families: Family[] = ${json(c.families)};

export const fears: FearInfo[] = ${json(c.fears)};

export const sources: Source[] = ${json(c.sources)};

export const lifeAreas: LifeArea[] = ${json(c.lifeAreas)};

export const scale: string[] = ${json(c.scale)};

export const questions: Question[] = ${json(c.questions)};

/** The statements come in four short parts, with a breather between them. \`end\` is exclusive. */
export const sections: QuestionSection[] = ${json(c.sections)};

/** Encouragement shown when a quest is finished. */
export const cheers: string[] = ${json(c.cheers)};

export const rules: Rules = ${json(c.rules)};

/** What each ladder step looks like in each life area: fear -> area -> one example per step. */
export const examples: AreaExamples = ${json(c.examples)};
`);
console.log(`Wrote ${out}: ${c.fears.length} fears, ${c.questions.length} questions, ${c.sources.length} sources`);
