/**
 * Generates the question-bank seed used by BOTH:
 *  - migrations/0004_question_seed.sql (Cloudflare D1)
 *  - src/data/question-seed.ts (in-memory development store)
 *
 * Run with: bun run scripts/gen-question-seed.ts
 *
 * All sample content is original material written for this platform. It is
 * NOT taken from official Pearson PTE material.
 */
import { writeFileSync } from "node:fs";

import { questionTypes, type QuestionTypeDef } from "../src/config/questions";

type Difficulty = "easy" | "intermediate" | "hard";

interface SeedOption {
  label: string;
  content: string;
  isCorrect: boolean;
  position: number;
}

interface SeedQuestion {
  id: string;
  module: string;
  type: string;
  difficulty: Difficulty;
  title: string;
  instructions: string;
  prompt: string;
  passage: string;
  correctAnswer: string;
  alternativeAnswers: string[];
  modelAnswer: string;
  explanation: string;
  scoringConfig: Record<string, unknown>;
  scoreWeight: number;
  topic: string;
  tags: string[];
  estimatedSeconds: number;
  sourceReference: string;
  adminNotes: string;
  aiConfidence: number;
  status: "draft" | "under_review" | "approved" | "published" | "archived";
  content: Record<string, unknown>;
  options: SeedOption[];
  audio: { url: string; transcript: string; durationSeconds: number } | null;
  image: { url: string; altText: string } | null;
  usage: { attempts: number; avgScore: number; correctRate: number };
}

const topics = [
  "Urban living",
  "Renewable energy",
  "Remote work",
  "Public health",
  "Marine biology",
  "Education technology",
  "Transport planning",
  "Food systems",
  "Space research",
  "Behavioural science",
  "Water management",
  "Digital privacy",
];

const passages: Record<string, string[]> = {
  default: [
    "City planners increasingly treat footpaths as infrastructure rather than decoration. When a suburb is designed so that shops, schools and transport stops sit within a fifteen-minute walk, residents drive less and local businesses trade more consistently through the week.",
    "Coastal wetlands store carbon at a rate far higher than most forests, yet they are cleared quickly because their value is easy to overlook. Restoring even a narrow strip of mangrove can protect a shoreline during storms while returning habitat to juvenile fish.",
  ],
  hard: [
    "Behavioural researchers distinguish between habits, which are triggered by context, and intentions, which depend on deliberate attention. Programmes that rely only on information campaigns tend to fade once novelty passes, whereas those that redesign the surrounding environment produce changes that persist long after the intervention ends.",
    "Grid operators once treated demand as fixed and supply as the variable to manage. As household batteries and flexible appliances spread, that assumption reverses: consumption itself becomes schedulable, and the cheapest way to firm a renewable grid may be to shift when energy is used rather than to build additional generation.",
  ],
};

const sentences = [
  "The library extension will open before the start of the second semester.",
  "Please submit your laboratory report to the coordinator by Friday afternoon.",
  "Most participants reported clearer results after the second round of testing.",
  "The conference has been moved to the lecture theatre on the ground floor.",
];

const shortQuestions = [
  { q: "What do we call the frozen form of water?", a: "Ice", alts: ["ice"] },
  { q: "Which instrument is used to measure temperature?", a: "A thermometer", alts: ["thermometer"] },
  { q: "How many minutes are there in two hours?", a: "One hundred and twenty", alts: ["120", "one hundred twenty"] },
  { q: "What is the profession of someone who designs buildings?", a: "An architect", alts: ["architect"] },
];

const essayPrompts = [
  "Some people believe universities should focus on employable skills, while others argue their purpose is broad intellectual development. Discuss both views and give your own opinion.",
  "Many cities are restricting private cars in their centres. Do the benefits of these restrictions outweigh the drawbacks? Support your position with reasons and examples.",
  "Remote work has changed how organisations build culture. To what extent is regular in-person contact still necessary for effective teams?",
  "Governments increasingly fund preventative health programmes instead of hospital treatment. Is this a positive development? Give reasons for your answer.",
];

const situations = [
  "Your study group has booked a room for tonight, but a lecturer has just asked to use it for a make-up class. Explain the situation to your group and suggest what to do.",
  "A classmate asks to borrow your notes the day before an assessment, but your notes are incomplete. Respond politely and offer a practical alternative.",
];

const discussions = [
  "Three students discuss whether their campus should replace printed handouts with tablets, weighing cost, accessibility and study habits.",
  "Two colleagues and a supervisor debate whether to shorten weekly meetings and share written updates instead.",
];

const difficultyCycle: Difficulty[] = ["easy", "intermediate", "hard"];

let counter = 0;
const idFor = (type: string, index: number) => `qst_seed_${type}_${index + 1}`;

function pick<T>(arr: T[], n: number): T {
  return arr[n % arr.length]!;
}

function optionSet(
  correctText: string,
  distractors: string[],
  multiple: boolean,
  secondCorrect?: string,
): SeedOption[] {
  const items: { content: string; isCorrect: boolean }[] = [
    { content: correctText, isCorrect: true },
    ...(multiple && secondCorrect ? [{ content: secondCorrect, isCorrect: true }] : []),
    ...distractors.map((content) => ({ content, isCorrect: false })),
  ];
  return items.map((item, index) => ({
    label: String.fromCharCode(65 + index),
    content: item.content,
    isCorrect: item.isCorrect,
    position: index + 1,
  }));
}

function buildQuestion(type: QuestionTypeDef, index: number): SeedQuestion {
  counter += 1;
  const n = counter;
  const difficulty = pick(difficultyCycle, index === 0 ? n : n + 1);
  const topic = pick(topics, n);
  const cap = type.capabilities;
  const passage =
    difficulty === "hard" ? pick(passages["hard"]!, n) : pick(passages["default"]!, n);
  const sentence = pick(sentences, n);

  const base: SeedQuestion = {
    id: idFor(type.key, index),
    module: type.module,
    type: type.key,
    difficulty,
    title: `${type.name} — ${topic} ${index + 1}`,
    instructions: type.description,
    prompt: "",
    passage: "",
    correctAnswer: "",
    alternativeAnswers: [],
    modelAnswer: "",
    explanation: `Sample item written for this platform to demonstrate the ${type.name} task format.`,
    scoringConfig: {
      criteria: Object.fromEntries(type.scoringCriteria.map((key) => [key, 1])),
      maxScore: type.scoringCriteria.length * 5,
    },
    scoreWeight: 1,
    topic,
    tags: [topic.toLowerCase().replace(/\s+/g, "-"), type.module, difficulty],
    estimatedSeconds: type.estimatedSeconds,
    sourceReference: "Original sample content authored in-house.",
    adminNotes: "Seed example. Replace with reviewed production content before launch.",
    aiConfidence: Number((0.72 + ((n % 5) * 0.05)).toFixed(2)),
    status: index === 0 ? "published" : n % 4 === 0 ? "draft" : "approved",
    content: {},
    options: [],
    audio: null,
    image: null,
    usage: {
      attempts: (n * 7) % 140,
      avgScore: Number((55 + ((n * 3) % 30)).toFixed(1)),
      correctRate: Number((0.4 + ((n % 6) * 0.08)).toFixed(2)),
    },
  };

  if (cap.audio) {
    const transcriptText = cap.shortAnswer
      ? pick(shortQuestions, n).q
      : cap.spokenResponse && type.key === "summarize_group_discussion"
        ? pick(discussions, n)
        : type.key === "respond_to_situation"
          ? pick(situations, n)
          : type.key === "retell_lecture" || type.key === "summarize_spoken_text"
            ? passage
            : sentence;
    base.audio = {
      url: `https://assets.example.com/pte-samples/${type.key}-${index + 1}.mp3`,
      transcript: transcriptText,
      durationSeconds: Math.min(90, Math.max(8, Math.round(transcriptText.length / 14))),
    };
    base.passage = cap.passage ? transcriptText : "";
  }

  if (cap.image) {
    base.image = {
      url: `https://assets.example.com/pte-samples/${type.key}-${index + 1}.png`,
      altText: `Bar chart showing ${topic.toLowerCase()} figures across four years`,
    };
    base.prompt = `Look at the chart. In 25 seconds, prepare to describe the trends in ${topic.toLowerCase()} shown between 2021 and 2024.`;
    base.modelAnswer = `The chart compares ${topic.toLowerCase()} figures across four years. The overall trend rises steadily, with the sharpest increase between the third and fourth year, before levelling off at the end of the period.`;
  }

  if (cap.passage && !base.passage) base.passage = passage;

  switch (type.key) {
    case "read_aloud":
      base.prompt = "Read the text aloud as naturally and clearly as you can.";
      base.modelAnswer = base.passage;
      base.content = { preparationSeconds: 35, recordingSeconds: 40 };
      break;
    case "repeat_sentence":
      base.prompt = "Listen to the sentence, then repeat it exactly as you heard it.";
      base.correctAnswer = sentence;
      base.modelAnswer = sentence;
      base.content = { recordingSeconds: 15 };
      break;
    case "retell_lecture":
      base.prompt = "Retell the lecture in your own words.";
      base.modelAnswer =
        "The speaker explains the main idea, gives one supporting example, and closes with the practical implication for planners.";
      base.content = { preparationSeconds: 10, recordingSeconds: 40 };
      break;
    case "answer_short_question": {
      const item = pick(shortQuestions, n);
      base.prompt = item.q;
      base.correctAnswer = item.a;
      base.alternativeAnswers = item.alts;
      base.content = { recordingSeconds: 10 };
      break;
    }
    case "respond_to_situation":
      base.prompt = pick(situations, n);
      base.modelAnswer =
        "I would explain the change politely, apologise for the short notice, and propose meeting in the library study area at the same time instead.";
      base.content = { preparationSeconds: 20, recordingSeconds: 40 };
      break;
    case "summarize_group_discussion":
      base.prompt = "Summarise the discussion in your own words.";
      base.modelAnswer =
        "The speakers weigh cost against accessibility. Two favour the change if support is provided, while the third wants a trial before any full rollout.";
      base.content = { preparationSeconds: 10, recordingSeconds: 120 };
      break;
    case "describe_image":
      base.content = { preparationSeconds: 25, recordingSeconds: 40 };
      break;

    case "reading_writing_fill_blanks":
    case "reading_fill_blanks": {
      const withBlanks = base.passage.replace(/\b(increasingly|quickly|consistently|steadily)\b/g, "[[1]]");
      base.passage = withBlanks.includes("[[1]]")
        ? withBlanks
        : `${base.passage} Researchers describe this pattern as [[1]] and broadly [[2]].`;
      const blanks = [
        { index: 1, answer: "consistent", choices: ["consistent", "reluctant", "temporary", "hidden"] },
        { index: 2, answer: "predictable", choices: ["predictable", "invisible", "hostile", "random"] },
      ].filter((b) => base.passage.includes(`[[${b.index}]]`));
      base.content = { blanks, wordBank: blanks.flatMap((b) => b.choices) };
      base.correctAnswer = blanks.map((b) => `${b.index}: ${b.answer}`).join("; ");
      base.prompt = "Select the word that best fits each blank.";
      break;
    }
    case "reading_mcq_multiple":
      base.prompt = "Which TWO statements are supported by the passage?";
      base.options = optionSet(
        "Walkable design reduces reliance on cars.",
        ["The passage recommends banning all vehicles.", "Footpaths are described as decorative only."],
        true,
        "Local businesses benefit from steady foot traffic.",
      );
      base.correctAnswer = "A, B";
      break;
    case "reading_mcq_single":
      base.prompt = "What is the writer's main point?";
      base.options = optionSet("Everyday infrastructure shapes everyday behaviour.", [
        "Planning decisions rarely affect residents.",
        "Retail trade depends mostly on advertising.",
        "Car ownership is increasing everywhere.",
      ], false);
      base.correctAnswer = "A";
      break;
    case "reorder_paragraphs": {
      const blocks = [
        "A council trial began with a single street closed to through traffic.",
        "Shopkeepers were initially concerned that deliveries would become difficult.",
        "After three months, pedestrian counts had risen and delivery windows had been agreed.",
        "The council now plans to extend the approach to two nearby streets.",
      ];
      base.content = {
        ordering: blocks.map((content, i) => ({
          key: `blk_${i + 1}`,
          content,
          correctPosition: i + 1,
        })),
      };
      base.prompt = "Arrange the text blocks in the correct order.";
      base.correctAnswer = "blk_1, blk_2, blk_3, blk_4";
      break;
    }

    case "summarize_written_text":
      base.prompt = "Summarise the passage in one sentence of 5 to 75 words.";
      base.modelAnswer =
        "The passage argues that designing suburbs around short walking distances lowers car use while supporting steadier trade for local businesses.";
      base.content = { wordLimit: { min: 5, max: 75 } };
      break;
    case "write_essay":
      base.prompt = pick(essayPrompts, n);
      base.modelAnswer =
        "A strong response states a clear position in the introduction, develops two or three supported reasons in separate paragraphs, acknowledges the opposing view, and closes with a concise restatement.";
      base.content = { wordLimit: { min: 200, max: 300 } };
      break;

    case "summarize_spoken_text":
      base.prompt = "Write a 50 to 70 word summary of the recording.";
      base.modelAnswer =
        "The speaker explains why the topic matters, gives one example, and notes the practical consequence for decision makers.";
      base.content = { wordLimit: { min: 50, max: 70 } };
      break;
    case "listening_mcq_multiple":
      base.prompt = "Which TWO points does the speaker make?";
      base.options = optionSet(
        "The effect is easier to overlook than to measure.",
        ["The speaker rejects all restoration work.", "Storms have no effect on shorelines."],
        true,
        "Small restored areas still deliver benefits.",
      );
      base.correctAnswer = "A, B";
      break;
    case "listening_mcq_single":
      base.prompt = "What is the speaker's main purpose?";
      base.options = optionSet("To explain why a small change has a large effect.", [
        "To advertise a commercial product.",
        "To describe a personal holiday.",
        "To criticise a colleague.",
      ], false);
      base.correctAnswer = "A";
      break;
    case "listening_fill_blanks": {
      base.passage = `${base.audio?.transcript ?? sentence}`.replace(/\b(\w{6,})\b/, "[[1]]");
      base.content = { blanks: [{ index: 1, answer: "extension", choices: [] }] };
      base.prompt = "Type the missing word you hear.";
      base.correctAnswer = "1: extension";
      break;
    }
    case "highlight_correct_summary":
      base.prompt = "Select the paragraph that best summarises the recording.";
      base.options = optionSet(
        "The recording explains the main idea and its practical consequence with one supporting example.",
        [
          "The recording lists unrelated statistics without a conclusion.",
          "The recording describes a personal anecdote about travel.",
          "The recording argues against all forms of measurement.",
        ],
        false,
      );
      base.correctAnswer = "A";
      break;
    case "select_missing_word":
      base.prompt = "Select the option that best completes the recording.";
      base.options = optionSet("before the semester begins.", [
        "after the building is demolished.",
        "unless the weather improves.",
        "while the results were rejected.",
      ], false);
      base.correctAnswer = "A";
      break;
    case "highlight_incorrect_words":
      base.passage = (base.audio?.transcript ?? sentence)
        .replace("library", "laboratory")
        .replace("results", "resorts");
      base.content = { incorrectWords: ["laboratory", "resorts"] };
      base.prompt = "Highlight the words in the transcript that differ from the recording.";
      base.correctAnswer = "laboratory, resorts";
      break;
    case "write_from_dictation":
      base.prompt = "Type the sentence exactly as you hear it.";
      base.correctAnswer = base.audio?.transcript ?? sentence;
      base.alternativeAnswers = [];
      base.content = {};
      break;
    default:
      break;
  }

  if (!base.prompt) base.prompt = type.description;
  return base;
}

const seed: SeedQuestion[] = questionTypes.flatMap((type) => [
  buildQuestion(type, 0),
  buildQuestion(type, 1),
]);

/* ------------------------------- TS emission ------------------------------- */

const tsFile = `/**
 * GENERATED FILE — do not edit by hand.
 * Run \`bun run scripts/gen-question-seed.ts\` to regenerate.
 *
 * Seed question bank used by the in-memory development store. The same data is
 * emitted as SQL in migrations/0004_question_seed.sql for Cloudflare D1.
 *
 * All content is original sample material written for this platform and is not
 * official Pearson PTE material.
 */
import type { QuestionContent, QuestionStatus } from "@/config/questions";
import type { DifficultyKey, ModuleKey } from "@/config/site";

export interface SeedOption {
  label: string;
  content: string;
  isCorrect: boolean;
  position: number;
}

export interface SeedQuestion {
  id: string;
  module: ModuleKey;
  type: string;
  difficulty: DifficultyKey;
  title: string;
  instructions: string;
  prompt: string;
  passage: string;
  correctAnswer: string;
  alternativeAnswers: string[];
  modelAnswer: string;
  explanation: string;
  scoringConfig: Record<string, unknown>;
  scoreWeight: number;
  topic: string;
  tags: string[];
  estimatedSeconds: number;
  sourceReference: string;
  adminNotes: string;
  aiConfidence: number;
  status: QuestionStatus;
  content: QuestionContent;
  options: SeedOption[];
  audio: { url: string; transcript: string; durationSeconds: number } | null;
  image: { url: string; altText: string } | null;
  usage: { attempts: number; avgScore: number; correctRate: number };
}

export const questionSeed: SeedQuestion[] = ${JSON.stringify(seed, null, 2)} as SeedQuestion[];
`;

writeFileSync(new URL("../src/data/question-seed.ts", import.meta.url), tsFile);

/* ------------------------------- SQL emission ------------------------------ */

const sq = (value: string | null | undefined) =>
  value === null || value === undefined ? "NULL" : `'${value.replace(/'/g, "''")}'`;
const jsonLit = (value: unknown) => sq(JSON.stringify(value));

const lines: string[] = [
  "-- 0004_question_seed.sql — GENERATED by scripts/gen-question-seed.ts",
  "-- Two original sample questions per PTE task type. Not official Pearson content.",
  "",
  "PRAGMA foreign_keys = ON;",
  "",
];

const moduleMeta: { key: string; name: string; description: string }[] = [
  { key: "speaking", name: "Speaking", description: "Spoken response tasks scored for content, fluency and pronunciation." },
  { key: "reading", name: "Reading", description: "Comprehension tasks scored for reading skills." },
  { key: "writing", name: "Writing", description: "Written response tasks scored for content, form and language." },
  { key: "listening", name: "Listening", description: "Audio comprehension and transcription tasks." },
];

moduleMeta.forEach((m, i) => {
  lines.push(
    `INSERT OR IGNORE INTO modules (key, name, description, sort_order, created_at) VALUES (${sq(m.key)}, ${sq(m.name)}, ${sq(m.description)}, ${i + 1}, datetime('now'));`,
  );
});
lines.push("");

questionTypes.forEach((type, i) => {
  lines.push(
    `INSERT OR IGNORE INTO question_types (key, module_key, name, description, capabilities, scoring_criteria, estimated_seconds, sort_order, is_active, created_at) VALUES (${sq(type.key)}, ${sq(type.module)}, ${sq(type.name)}, ${sq(type.description)}, ${jsonLit(type.capabilities)}, ${jsonLit(type.scoringCriteria)}, ${type.estimatedSeconds}, ${i + 1}, 1, datetime('now'));`,
  );
});
lines.push("");

const tagMap = new Map<string, string>();
for (const q of seed) {
  for (const tag of q.tags) {
    if (!tagMap.has(tag)) tagMap.set(tag, `qtg_${tag.replace(/[^a-z0-9]+/g, "_")}`);
  }
}
for (const [slug, id] of tagMap) {
  const name = slug.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
  lines.push(
    `INSERT OR IGNORE INTO question_tags (id, slug, name, created_at) VALUES (${sq(id)}, ${sq(slug)}, ${sq(name)}, datetime('now'));`,
  );
}
lines.push("");

seed.forEach((q, i) => {
  const createdAt = new Date(Date.UTC(2026, 0, 5 + (i % 40), 9, (i * 7) % 60)).toISOString();
  const audioId = q.audio ? `${q.id}_audio` : null;
  const imageId = q.image ? `${q.id}_image` : null;

  if (q.audio) {
    lines.push(
      `INSERT OR IGNORE INTO question_assets (id, question_id, kind, url, r2_key, mime_type, duration_seconds, alt_text, transcript, created_by, created_at) VALUES (${sq(audioId)}, NULL, 'audio', ${sq(q.audio.url)}, ${sq(`samples/${q.type}-audio-${i}.mp3`)}, 'audio/mpeg', ${q.audio.durationSeconds}, NULL, ${sq(q.audio.transcript)}, NULL, ${sq(createdAt)});`,
    );
  }
  if (q.image) {
    lines.push(
      `INSERT OR IGNORE INTO question_assets (id, question_id, kind, url, r2_key, mime_type, duration_seconds, alt_text, transcript, created_by, created_at) VALUES (${sq(imageId)}, NULL, 'image', ${sq(q.image.url)}, ${sq(`samples/${q.type}-image-${i}.png`)}, 'image/png', NULL, ${sq(q.image.altText)}, NULL, NULL, ${sq(createdAt)});`,
    );
  }

  lines.push(
    `INSERT OR IGNORE INTO questions (id, module_key, type_key, difficulty, title, instructions, prompt, passage, correct_answer, alternative_answers, model_answer, explanation, scoring_config, score_weight, topic, content_json, estimated_seconds, audio_asset_id, image_asset_id, source_reference, admin_notes, ai_confidence, status, current_version, created_by, reviewed_by, created_at, updated_at, published_at) VALUES (${sq(q.id)}, ${sq(q.module)}, ${sq(q.type)}, ${sq(q.difficulty)}, ${sq(q.title)}, ${sq(q.instructions)}, ${sq(q.prompt)}, ${sq(q.passage)}, ${sq(q.correctAnswer)}, ${jsonLit(q.alternativeAnswers)}, ${sq(q.modelAnswer)}, ${sq(q.explanation)}, ${jsonLit(q.scoringConfig)}, ${q.scoreWeight}, ${sq(q.topic)}, ${jsonLit(q.content)}, ${q.estimatedSeconds}, ${sq(audioId)}, ${sq(imageId)}, ${sq(q.sourceReference)}, ${sq(q.adminNotes)}, ${q.aiConfidence}, ${sq(q.status)}, 1, NULL, NULL, ${sq(createdAt)}, ${sq(createdAt)}, ${q.status === "published" ? sq(createdAt) : "NULL"});`,
  );

  q.options.forEach((option, oi) => {
    lines.push(
      `INSERT OR IGNORE INTO question_options (id, question_id, label, content, is_correct, position, created_at) VALUES (${sq(`${q.id}_opt_${oi + 1}`)}, ${sq(q.id)}, ${sq(option.label)}, ${sq(option.content)}, ${option.isCorrect ? 1 : 0}, ${option.position}, ${sq(createdAt)});`,
    );
  });

  for (const tag of q.tags) {
    lines.push(
      `INSERT OR IGNORE INTO question_tag_links (question_id, tag_id, created_at) VALUES (${sq(q.id)}, ${sq(tagMap.get(tag)!)}, ${sq(createdAt)});`,
    );
  }

  lines.push(
    `INSERT OR IGNORE INTO question_versions (id, question_id, version_number, snapshot, status, change_note, created_by, created_at) VALUES (${sq(`${q.id}_v1`)}, ${sq(q.id)}, 1, ${jsonLit(q)}, ${sq(q.status)}, 'Seed import', NULL, ${sq(createdAt)});`,
  );
  lines.push(
    `INSERT OR IGNORE INTO question_usage_stats (question_id, attempts, avg_score, correct_rate, avg_time_seconds, last_used_at, updated_at) VALUES (${sq(q.id)}, ${q.usage.attempts}, ${q.usage.avgScore}, ${q.usage.correctRate}, ${q.estimatedSeconds}, ${sq(createdAt)}, ${sq(createdAt)});`,
  );
  lines.push("");
});

writeFileSync(new URL("../migrations/0004_question_seed.sql", import.meta.url), lines.join("\n"));

console.log(`Generated ${seed.length} seed questions across ${questionTypes.length} task types.`);
