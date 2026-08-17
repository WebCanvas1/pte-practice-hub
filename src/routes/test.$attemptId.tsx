/**
 * Distraction-free student test runner: system check, question delivery,
 * autosave, timer, review screen and submission.
 */
import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Flag,
  Loader2,
  Maximize,
  Wifi,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";

import { AudioPrompt } from "@/components/test/AudioPrompt";
import { ResponseRecorder } from "@/components/test/ResponseRecorder";
import { PassageBlock, QuestionRenderer } from "@/components/test/renderers";
import { useAutosave } from "@/components/test/useAutosave";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { questionTypeMap } from "@/config/questions";
import {
  emptyAnswer,
  isAnswered,
  type AnswerPayload,
  type RunnerSession,
} from "@/config/test-runner";
import { siteConfig } from "@/config/site";
import { fetchRunnerSession, submitTest } from "@/lib/tests-api";

export const Route = createFileRoute("/test/$attemptId")({
  head: () => ({
    meta: [
      { title: `Practice test in progress — ${siteConfig.name}` },
      {
        name: "description",
        content:
          "Distraction-free PTE practice test runner with timed tasks, autosaving answers and a submission review screen.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: `Practice test in progress — ${siteConfig.name}` },
      {
        property: "og:description",
        content: "Timed PTE practice tasks with autosave and instant submission review.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TestRunnerPage,
});

const formatClock = (seconds: number) => {
  const safe = Math.max(0, seconds);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

function TestRunnerPage() {
  const { attemptId } = Route.useParams();
  const navigate = useNavigate();
  const [checked, setChecked] = React.useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["runner-session", attemptId],
    queryFn: () => fetchRunnerSession(attemptId),
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="mx-auto grid min-h-screen max-w-lg place-items-center p-6">
        <Alert variant="destructive">
          <AlertTriangle className="size-4" aria-hidden />
          <AlertTitle>Test unavailable</AlertTitle>
          <AlertDescription>
            We could not load this test. Return to{" "}
            <button className="underline" onClick={() => navigate({ to: "/student/my-tests" })}>
              My Tests
            </button>{" "}
            and try again.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  const session = data.session;

  if (session.attempt.submittedAt || session.attempt.status === "submitted") {
    return <SubmittedScreen />;
  }

  if (!checked) return <SystemCheck session={session} onReady={() => setChecked(true)} />;

  return <Runner session={session} />;
}

/* ------------------------------- system check ------------------------------ */

function SystemCheck({ session, onReady }: { session: RunnerSession; onReady: () => void }) {
  const needsMic = session.questions.some(
    (question) => questionTypeMap[question.typeKey]?.capabilities.spokenResponse,
  );
  const [mic, setMic] = React.useState<"unknown" | "ok" | "denied">("unknown");
  const [audio, setAudio] = React.useState(false);

  const browserOk = typeof window !== "undefined" && typeof window.MediaRecorder !== "undefined";

  const rows = [
    { label: "Browser support", ok: browserOk, hint: "Chrome, Edge, Firefox or Safari" },
    { label: "Connection", ok: navigator.onLine, hint: "A stable connection keeps answers saved" },
    {
      label: "Speaker / headphones",
      ok: audio,
      hint: "Play the test tone to confirm you can hear it",
    },
    ...(needsMic
      ? [{ label: "Microphone", ok: mic === "ok", hint: "Required for speaking tasks" }]
      : []),
  ];

  return (
    <main className="mx-auto grid min-h-screen max-w-2xl content-center gap-6 p-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">System check</h1>
        <p className="mt-2 text-muted-foreground">
          {session.attempt.templateName} · {session.attempt.questionCount} questions ·{" "}
          {session.attempt.timeLimitMinutes} minutes
        </p>
      </div>

      <ul className="grid gap-3">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center gap-3 rounded-xl border p-4">
            {row.ok ? (
              <CheckCircle2 className="size-5 text-primary" aria-hidden />
            ) : (
              <Circle className="size-5 text-muted-foreground" aria-hidden />
            )}
            <span className="flex-1">
              <span className="font-medium">{row.label}</span>
              <span className="block text-sm text-muted-foreground">{row.hint}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            const context = new AudioContext();
            const oscillator = context.createOscillator();
            oscillator.connect(context.destination);
            oscillator.frequency.value = 440;
            oscillator.start();
            setTimeout(() => {
              oscillator.stop();
              void context.close();
            }, 600);
            setAudio(true);
          }}
        >
          Play test tone
        </Button>
        {needsMic && (
          <Button
            type="button"
            variant="secondary"
            onClick={async () => {
              try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach((track) => track.stop());
                setMic("ok");
              } catch {
                setMic("denied");
              }
            }}
          >
            Test microphone
          </Button>
        )}
      </div>

      {mic === "denied" && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" aria-hidden />
          <AlertTitle>Microphone blocked</AlertTitle>
          <AlertDescription>
            Speaking tasks need microphone access. You can continue, but spoken answers will not be
            recorded.
          </AlertDescription>
        </Alert>
      )}

      {session.attempt.instructions && (
        <p className="rounded-xl border bg-muted/40 p-4 text-sm">{session.attempt.instructions}</p>
      )}

      <Button size="lg" onClick={onReady}>
        Start test
      </Button>
    </main>
  );
}

function SubmittedScreen() {
  const navigate = useNavigate();
  return (
    <main className="mx-auto grid min-h-screen max-w-lg content-center gap-4 p-6 text-center">
      <CheckCircle2 className="mx-auto size-10 text-primary" aria-hidden />
      <h1 className="text-3xl font-semibold tracking-tight">Test submitted</h1>
      <p className="text-muted-foreground">
        Your answers are locked and queued for scoring. Results appear in your test history once
        scoring finishes.
      </p>
      <Button onClick={() => navigate({ to: "/student/my-tests" })}>Back to my tests</Button>
    </main>
  );
}

/* --------------------------------- runner --------------------------------- */

function Runner({ session }: { session: RunnerSession }) {
  const navigate = useNavigate();
  const attempt = session.attempt;
  const questions = session.questions;

  const [answers, setAnswers] = React.useState<Record<string, AnswerPayload>>(() => {
    const base: Record<string, AnswerPayload> = {};
    for (const question of questions) base[question.attemptQuestionId] = emptyAnswer();
    for (const saved of session.answers) base[saved.attemptQuestionId] = { ...saved };
    return base;
  });

  const [index, setIndex] = React.useState(() =>
    Math.min(Math.max(attempt.currentQuestion - 1, 0), questions.length - 1),
  );
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [submissionMessage, setSubmissionMessage] = React.useState("Submitting your test…");
  const [audioDone, setAudioDone] = React.useState<Record<string, boolean>>({});
  const [fullscreen, setFullscreen] = React.useState(true);

  const question = questions[index]!;
  const answer = answers[question.attemptQuestionId] ?? emptyAnswer();
  const autosave = useAutosave(attempt.id, true);

  const secondsLeft = useCountdown(attempt.deadline);

  React.useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement) || true);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const pushSave = React.useCallback(
    (payload: AnswerPayload, immediate: boolean, position: number) => {
      autosave.save(
        {
          attemptQuestionId: question.attemptQuestionId,
          text: payload.text,
          data: {
            selections: payload.selections,
            blanks: payload.blanks,
            ordering: payload.ordering,
            highlighted: payload.highlighted,
            flagged: payload.flagged,
          },
          timeSpentSeconds: payload.timeSpentSeconds,
          currentQuestion: position,
        },
        immediate,
      );
    },
    [autosave, question.attemptQuestionId],
  );

  const update = (patch: Partial<AnswerPayload>, immediate = false) => {
    setAnswers((current) => {
      const next = { ...(current[question.attemptQuestionId] ?? emptyAnswer()), ...patch };
      pushSave(next, immediate, index + 1);
      return { ...current, [question.attemptQuestionId]: next };
    });
  };

  const goTo = async (nextIndex: number) => {
    pushSave(answer, true, nextIndex + 1);
    setIndex(nextIndex);
  };

  const doSubmit = React.useCallback(
    async (reason: "manual" | "time_expired") => {
      setSubmitting(true);
      setSubmissionMessage("Submitting your test…");
      try {
        await autosave.flush();
        setSubmissionMessage("Calculating your results…");
        await submitTest(attempt.id, reason);
        toast.success(reason === "manual" ? "Test submitted." : "Time expired — test submitted.");
        await navigate({ to: "/student/results/$attemptId", params: { attemptId: attempt.id } });
      } catch {
        toast.error("We could not submit the test. Check your connection and try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [attempt.id, autosave, navigate],
  );

  // Automatic submission the moment the countdown reaches zero.
  React.useEffect(() => {
    if (secondsLeft !== null && secondsLeft <= 0 && !submitting) void doSubmit("time_expired");
  }, [secondsLeft, submitting, doSubmit]);

  const answeredCount = questions.filter((entry) =>
    isAnswered(entry.typeKey, answers[entry.attemptQuestionId] ?? emptyAnswer()),
  ).length;
  const caps = questionTypeMap[question.typeKey]?.capabilities ?? {};
  const armed = !question.audio || audioDone[question.attemptQuestionId] === true;

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 p-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{attempt.templateName}</p>
            <p className="text-xs text-muted-foreground">
              {question.typeName} · Question {index + 1} of {questions.length}
            </p>
          </div>
          <Badge variant="secondary" aria-live="polite">
            {secondsLeft === null ? "No time limit" : formatClock(secondsLeft)}
          </Badge>
          <span
            className="inline-flex items-center gap-1 text-xs text-muted-foreground"
            aria-live="polite"
          >
            {autosave.online ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
            {autosave.state === "saving"
              ? "Saving…"
              : autosave.state === "queued"
                ? "Offline — changes queued"
                : autosave.state === "error"
                  ? "Retrying save"
                  : autosave.lastSavedAt
                    ? `Saved ${new Date(autosave.lastSavedAt).toLocaleTimeString()}`
                    : "Not saved yet"}
          </span>
          <Button size="sm" variant="secondary" onClick={() => setReviewOpen(true)}>
            Review &amp; submit
          </Button>
        </div>
        <Progress
          value={(answeredCount / Math.max(questions.length, 1)) * 100}
          aria-label="Overall progress"
        />
      </header>

      {!fullscreen && (
        <Alert className="mx-auto mt-4 max-w-5xl">
          <Maximize className="size-4" aria-hidden />
          <AlertTitle>Full-screen recommended</AlertTitle>
          <AlertDescription>
            Use full-screen mode to avoid distractions during the test.
          </AlertDescription>
        </Alert>
      )}

      <section className="mx-auto grid max-w-5xl gap-5 p-4 pb-28">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{question.title}</h1>
          <p className="mt-1 text-muted-foreground">{question.instructions}</p>
        </div>

        {question.audio && (
          <AudioPrompt
            src={question.audio.url}
            maxPlays={question.config.audioPlays}
            autoPlay
            onFinished={() =>
              setAudioDone((current) => ({ ...current, [question.attemptQuestionId]: true }))
            }
          />
        )}

        {question.image && (
          <img
            src={question.image.url}
            alt={question.image.altText ?? "Question image"}
            className="max-h-80 w-full rounded-xl border object-contain"
            loading="lazy"
          />
        )}

        {question.prompt && <p className="text-base leading-relaxed">{question.prompt}</p>}
        {question.passage && !caps.blanks && !caps.highlightWords && (
          <PassageBlock text={question.passage} />
        )}

        <QuestionRenderer
          question={question}
          answer={answer}
          onChange={update}
          disabled={submitting}
        />

        {caps.spokenResponse && (
          <ResponseRecorder
            attemptId={attempt.id}
            attemptQuestionId={question.attemptQuestionId}
            config={question.config}
            uploaded={Boolean(answer.audioKey)}
            armed={armed}
            onUploaded={(audioKey) =>
              setAnswers((current) => ({
                ...current,
                [question.attemptQuestionId]: {
                  ...(current[question.attemptQuestionId] ?? emptyAnswer()),
                  audioKey,
                },
              }))
            }
          />
        )}
      </section>

      <footer className="fixed inset-x-0 bottom-0 border-t bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 p-4">
          <Button
            variant="outline"
            disabled={index === 0 || !question.config.allowPrevious}
            onClick={() => void goTo(index - 1)}
          >
            Previous
          </Button>
          <Button
            variant={answer.flagged ? "secondary" : "ghost"}
            onClick={() => update({ flagged: !answer.flagged }, true)}
            aria-pressed={answer.flagged}
          >
            <Flag className="mr-2 size-4" aria-hidden />
            {answer.flagged ? "Flagged" : "Flag for review"}
          </Button>
          <span className="flex-1" />
          {index === questions.length - 1 ? (
            <Button onClick={() => setReviewOpen(true)}>Review answers</Button>
          ) : (
            <Button onClick={() => void goTo(index + 1)}>Next</Button>
          )}
        </div>
      </footer>

      <AlertDialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Review your answers</AlertDialogTitle>
            <AlertDialogDescription>
              {answeredCount} answered · {questions.length - answeredCount} unanswered ·{" "}
              {questions.filter((entry) => answers[entry.attemptQuestionId]?.flagged).length}{" "}
              flagged
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ul className="max-h-64 overflow-y-auto rounded-xl border">
            {questions.map((entry, position) => {
              const entryAnswer = answers[entry.attemptQuestionId] ?? emptyAnswer();
              return (
                <li
                  key={entry.attemptQuestionId}
                  className="flex items-center gap-2 border-b p-2 text-sm last:border-b-0"
                >
                  <span className="w-8 text-muted-foreground">{position + 1}</span>
                  <span className="flex-1 truncate">{entry.typeName}</span>
                  {entryAnswer.flagged && <Flag className="size-3.5 text-amber-600" aria-hidden />}
                  <Badge variant={isAnswered(entry.typeKey, entryAnswer) ? "success" : "secondary"}>
                    {isAnswered(entry.typeKey, entryAnswer) ? "Answered" : "Empty"}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setReviewOpen(false);
                      void goTo(position);
                    }}
                  >
                    Go
                  </Button>
                </li>
              );
            })}
          </ul>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep working</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                setReviewOpen(false);
                setConfirmOpen(true);
              }}
            >
              Submit test
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {submitting && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <div className="rounded-xl border bg-card p-6 text-center shadow-lg">
            <Loader2 className="mx-auto mb-3 size-6 animate-spin text-primary" aria-hidden />
            <p className="font-medium">{submissionMessage}</p>
          </div>
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit this test?</AlertDialogTitle>
            <AlertDialogDescription>
              Once submitted you cannot change your answers. {questions.length - answeredCount}{" "}
              question(s) are still empty.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={submitting} onClick={() => void doSubmit("manual")}>
              {submitting ? "Submitting…" : "Submit now"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

/** Countdown driven by the server-provided deadline. */
function useCountdown(deadline: string | null) {
  const [left, setLeft] = React.useState<number | null>(() =>
    deadline ? Math.round((new Date(deadline).getTime() - Date.now()) / 1000) : null,
  );
  React.useEffect(() => {
    if (!deadline) return;
    const tick = () => setLeft(Math.round((new Date(deadline).getTime() - Date.now()) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);
  return left;
}
