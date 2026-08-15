export interface MetricRow {
  label: string;
  score: number;
  attempts?: number;
  averageSeconds?: number;
}
export interface ResultAnalysis {
  testName: string;
  completionDate: string;
  module: string;
  difficulty: string;
  estimatedScore: number;
  percentage: number;
  timeTakenSeconds: number;
  attempted: number;
  correct: number;
  partial: number;
  incorrect: number;
  aiStatus: string;
  byQuestionType: MetricRow[];
  byDifficulty: MetricRow[];
  bySkill: MetricRow[];
  strongestType: string;
  weakestType: string;
  commonMistakes: string[];
  timeIssues: string[];
  improvement: number | null;
  nextModule: string;
  nextDifficulty: string;
  priorities: string[];
}
export interface ReviewQuestion {
  attemptQuestionId: string;
  position: number;
  title: string;
  type: string;
  studentAnswer: unknown;
  correctAnswer: unknown;
  explanation: string;
  modelResponse: string;
  earned: number;
  maximum: number;
  aiFeedback: Record<string, unknown>;
  improvement: string;
}
export interface ProgressData {
  trend: MetricRow[];
  modules: MetricRow[];
  questionTypes: MetricRow[];
  difficulties: MetricRow[];
  averageCompletionSeconds: number;
  completedTests: number;
  streak: number;
  firstScore: number;
  latestScore: number;
  recent: Array<{ id: string; name: string; date: string; score: number }>;
  weakTrends: MetricRow[];
}
export interface RecommendationData {
  strengths: string[];
  weaknesses: string[];
  priorityTypes: string[];
  nextTest: string;
  frequency: string;
  plan: Array<{ day: number; focus: string; activity: string }>;
  narrative: string;
  history: Array<{ id: string; narrative: string; createdAt: string }>;
}
export interface AdminAnalytics {
  activeStudents: number;
  registeredStudents: number;
  testsPurchased: number;
  testsCompleted: number;
  completionRate: number;
  averageScore: number;
  aiFailures: number;
  revenue: number;
  currency: string;
  modules: MetricRow[];
  difficulties: MetricRow[];
  weakestTypes: MetricRow[];
}
