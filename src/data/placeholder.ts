/**
 * Placeholder data so the dashboards can be reviewed before the
 * Cloudflare D1 backend exists. Replace with API reads later.
 */
import { pricingConfig, testModules } from "@/config/site";

export const studentStats = {
  testsCompleted: 14,
  averageScore: 72,
  targetScore: 79,
  credits: 3,
  streakDays: 6,
};

export const scoreTrend = [
  { label: "Wk 1", score: 58 },
  { label: "Wk 2", score: 61 },
  { label: "Wk 3", score: 65 },
  { label: "Wk 4", score: 64 },
  { label: "Wk 5", score: 70 },
  { label: "Wk 6", score: 72 },
];

export const moduleScores = [
  { label: "Speaking", score: 68 },
  { label: "Reading", score: 74 },
  { label: "Writing", score: 70 },
  { label: "Listening", score: 76 },
];

export interface CatalogueTest {
  id: string;
  title: string;
  module: string;
  difficulty: "Easy" | "Intermediate" | "Hard";
  tasks: number;
  minutes: number;
  price: number;
}

export const testCatalogue: CatalogueTest[] = testModules.flatMap((m) =>
  (["Easy", "Intermediate", "Hard"] as const).map((difficulty, i) => ({
    id: `${m.key}-${difficulty.toLowerCase()}`,
    title: `${m.name} Practice ${i + 1}`,
    module: m.name,
    difficulty,
    tasks: m.taskCount,
    minutes: m.minutes,
    price: pricingConfig.modulePrice,
  })),
);

export const myTests = [
  { id: "T-2041", title: "Speaking Practice 2", module: "Speaking", status: "In progress", progress: 40 },
  { id: "T-2038", title: "Full Mock Test 3", module: "All modules", status: "Not started", progress: 0 },
  { id: "T-2033", title: "Writing Practice 1", module: "Writing", status: "In progress", progress: 65 },
];

export const testHistory = [
  { id: "A-9921", title: "Listening Practice 3", module: "Listening", date: "2 Aug 2026", score: 76, status: "Scored" },
  { id: "A-9908", title: "Reading Practice 2", module: "Reading", date: "29 Jul 2026", score: 74, status: "Scored" },
  { id: "A-9877", title: "Full Mock Test 2", module: "All modules", date: "22 Jul 2026", score: 71, status: "Scored" },
  { id: "A-9860", title: "Speaking Practice 1", module: "Speaking", date: "18 Jul 2026", score: 66, status: "Scored" },
];

export const recommendations = [
  {
    id: "R-1",
    module: "Speaking",
    title: "Work on fluency in Describe Image",
    detail: "Your pauses average 1.8s. Practise 3 timed Describe Image tasks with a 25 second plan.",
    priority: "High",
  },
  {
    id: "R-2",
    module: "Writing",
    title: "Tighten essay structure",
    detail: "Add a clearer thesis sentence — content scores lift fastest with an explicit position.",
    priority: "Medium",
  },
  {
    id: "R-3",
    module: "Reading",
    title: "Re-order paragraphs drills",
    detail: "Accuracy is 62% on re-order tasks. Try five Hard level sets this week.",
    priority: "Medium",
  },
];

export const purchases = [
  { id: "INV-3391", item: "Full mock test", date: "2 Aug 2026", amount: pricingConfig.fullMockPrice, status: "Paid" },
  { id: "INV-3374", item: "Listening module test", date: "29 Jul 2026", amount: pricingConfig.modulePrice, status: "Paid" },
  { id: "INV-3350", item: "Reading module test", date: "22 Jul 2026", amount: pricingConfig.modulePrice, status: "Paid" },
];

/* ---------------------------------- Admin data ---------------------------------- */

export const adminStats = {
  students: 1284,
  attemptsToday: 96,
  revenueMonth: 4820,
  pendingEvaluations: 7,
};

export const adminStudents = [
  { id: "S-1042", name: "Aisha Khan", email: "aisha@example.com", tests: 12, avg: 74, joined: "12 Jun 2026" },
  { id: "S-1041", name: "Ravi Patel", email: "ravi@example.com", tests: 8, avg: 68, joined: "2 Jul 2026" },
  { id: "S-1040", name: "Mai Nguyen", email: "mai@example.com", tests: 21, avg: 81, joined: "18 May 2026" },
];

export const adminQuestions = [
  { id: "Q-8801", module: "Speaking", type: "Read Aloud", difficulty: "Easy", status: "Published" },
  { id: "Q-8802", module: "Writing", type: "Essay", difficulty: "Hard", status: "Draft" },
  { id: "Q-8803", module: "Reading", type: "Re-order Paragraphs", difficulty: "Intermediate", status: "Published" },
  { id: "Q-8804", module: "Listening", type: "Dictation", difficulty: "Hard", status: "In review" },
];

export const adminAttempts = [
  { id: "A-9921", student: "Aisha Khan", test: "Listening Practice 3", submitted: "2 Aug 2026", score: 76, status: "Scored" },
  { id: "A-9920", student: "Ravi Patel", test: "Speaking Practice 2", submitted: "2 Aug 2026", score: null, status: "Awaiting AI" },
  { id: "A-9919", student: "Mai Nguyen", test: "Full Mock Test 4", submitted: "1 Aug 2026", score: 82, status: "Scored" },
];

export const adminPayments = [
  { id: "INV-3391", student: "Aisha Khan", item: "Full mock test", amount: pricingConfig.fullMockPrice, status: "Paid" },
  { id: "INV-3390", student: "Ravi Patel", item: "Speaking module test", amount: pricingConfig.modulePrice, status: "Paid" },
  { id: "INV-3389", student: "Mai Nguyen", item: "Writing module test", amount: pricingConfig.modulePrice, status: "Refunded" },
];

export const adminEvaluations = [
  { id: "E-551", attempt: "A-9920", module: "Speaking", model: "pending configuration", state: "Queued", latency: "—" },
  { id: "E-550", attempt: "A-9919", module: "Writing", model: "pending configuration", state: "Complete", latency: "4.1s" },
];

export const auditLogs = [
  { id: "L-7781", actor: "admin@platform", action: "Published question Q-8803", when: "2 Aug 2026 14:02" },
  { id: "L-7780", actor: "admin@platform", action: "Updated pricing labels", when: "1 Aug 2026 09:40" },
  { id: "L-7779", actor: "system", action: "Nightly report generated", when: "1 Aug 2026 02:00" },
];

export const revenueByWeek = [
  { label: "Wk 1", score: 720 },
  { label: "Wk 2", score: 940 },
  { label: "Wk 3", score: 1180 },
  { label: "Wk 4", score: 1360 },
];
