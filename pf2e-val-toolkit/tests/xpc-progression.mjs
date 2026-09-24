import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

Math.clamp = (value, min, max) =>
  Math.min(max, Math.max(min, value));

const source = await readFile(
  new URL(
    "../scripts/career-xp/index.js",
    import.meta.url
  ),
  "utf8"
);

const xpc = await import(
  `data:text/javascript;base64,${
    Buffer.from(source).toString("base64")
  }`
);

assert.equal(
  xpc.XPC_FLAG_SCOPE,
  "pf2e-val-toolkit"
);
assert.equal(
  xpc.XPC_FLAG_KEY,
  "xpc"
);

assert.equal(xpc.levelForCareerXp(0), 1);
assert.equal(xpc.levelForCareerXp(299), 1);
assert.equal(xpc.levelForCareerXp(300), 2);
assert.equal(xpc.levelForCareerXp(899), 2);
assert.equal(xpc.levelForCareerXp(900), 3);
assert.equal(xpc.levelForCareerXp(2430), 3);
assert.equal(xpc.levelForCareerXp(2700), 4);

assert.deepEqual(
  xpc.derivePf2ProgressionFromXpc(2430),
  {
    xpc: 2430,
    level: 3,
    xpPF2: 850,
    floor: 900,
    next: 2700,
    progress: 1530,
    span: 1800
  }
);

assert.equal(
  xpc.derivePf2ProgressionFromXpc(3130).level,
  4
);
assert.equal(
  xpc.derivePf2ProgressionFromXpc(3130).xpPF2,
  113
);

assert.equal(
  xpc.derivePf2ProgressionFromXpc(undefined),
  null
);

assert.equal(
  xpc.derivePf2ProgressionFromXpc(356000).level,
  20
);
assert.equal(
  xpc.derivePf2ProgressionFromXpc(356000).xpPF2,
  1000
);

const yaz = {
  uuid: "Actor.q2oRahiBEqoT9aUk"
};

const resumes = [
  {
    participants: [yaz.uuid],
    sessionXp: 100,
    shortSummaryAuthor: yaz.uuid,
    shortSummaryXp: 30,
    longSummaryAuthor: "Actor.someone-else",
    longSummaryXp: 40
  },
  {
    participants: [yaz.uuid],
    sessionXp: 75,
    shortSummaryAuthor: null,
    shortSummaryXp: 20,
    longSummaryAuthor: yaz.uuid,
    longSummaryXp: 50
  },
  {
    participants: ["Actor.someone-else"],
    sessionXp: 200,
    shortSummaryAuthor: "Actor.someone-else",
    shortSummaryXp: 15,
    longSummaryAuthor: "Actor.someone-else",
    longSummaryXp: 25
  }
];

assert.equal(
  xpc.experienceFromResumes(yaz, resumes),
  255,
  "XPC = XP par PJ des participations + bonus des résumés rédigés"
);

console.log("XPC historical curve: OK");
