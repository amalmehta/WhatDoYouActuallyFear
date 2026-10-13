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
import type { Family, FearInfo, LifeArea, Question, Rules, Source } from "./types";

export const families: Family[] = ${json(c.families)};

export const fears: FearInfo[] = ${json(c.fears)};

export const sources: Source[] = ${json(c.sources)};

export const lifeAreas: LifeArea[] = ${json(c.lifeAreas)};

export const scale: string[] = ${json(c.scale)};

export const questions: Question[] = ${json(c.questions)};

export const rules: Rules = ${json(c.rules)};
`);
console.log(`Wrote ${out}: ${c.fears.length} fears, ${c.questions.length} questions, ${c.sources.length} sources`);
