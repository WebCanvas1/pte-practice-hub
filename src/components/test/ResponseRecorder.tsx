/**
 * Speaking recorder: microphone permission, preparation countdown, recording
 * indicator and upload to R2 through the Worker.
 */
import * as React from "react";
import { AlertTriangle, CheckCircle2, Loader2, Mic } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import type { RunnerTaskConfig } from "@/config/test-runner";
import { uploadResponseAudio } from "@/lib/tests-api";

interface RecorderProps {
  attemptId: string;
  attemptQuestionId: string;
  config: RunnerTaskConfig;
  /** Already uploaded on a previous visit / before a refresh. */
  uploaded: boolean;
  /** Wait for the prompt audio to finish before preparation starts. */
  armed: boolean;
  onUploaded: (audioKey: string) => void;
}

type Phase = "idle" | "preparing" | "recording" | "uploading" | "done" | "denied" | "error";

export function ResponseRecorder({
  attemptId,
  attemptQuestionId,
  config,
  uploaded,
  armed,
  onUploaded,
}: RecorderProps) {
  const [phase, setPhase] = React.useState<Phase>(uploaded ? "done" : "idle");
  const [seconds, setSeconds] = React.useState(config.preparationSeconds);
  const recorder = React.useRef<MediaRecorder | null>(null);
  const chunks = React.useRef<Blob[]>([]);

  const stop = React.useCallback(() => {
    recorder.current?.state === "recording" && recorder.current.stop();
  }, []);

  const upload = React.useCallback(
    async (blob: Blob) => {
      setPhase("uploading");
      try {
        const result = await uploadResponseAudio(attemptId, attemptQuestionId, blob);
        onUploaded(result.audioKey);
        setPhase("done");
      } catch {
        setPhase("error");
      }
    },
    [attemptId, attemptQuestionId, onUploaded],
  );

  const beginRecording = React.useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks.current = [];
      const media = new MediaRecorder(stream);
      media.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.current.push(event.data);
      };
      media.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        void upload(new Blob(chunks.current, { type: media.mimeType || "audio/webm" }));
      };
      recorder.current = media;
      media.start();
      setPhase("recording");
      setSeconds(config.recordingSeconds);
    } catch {
      setPhase("denied");
    }
  }, [config.recordingSeconds, upload]);

  // Preparation starts once the question is armed (audio finished or no audio).
  React.useEffect(() => {
    if (phase !== "idle" || uploaded || !armed) return;
    if (config.preparationSeconds === 0) {
      void beginRecording();
      return;
    }
    setPhase("preparing");
    setSeconds(config.preparationSeconds);
  }, [armed, phase, uploaded, config.preparationSeconds, beginRecording]);

  React.useEffect(() => {
    if (phase !== "preparing" && phase !== "recording") return;
    const id = setInterval(() => {
      setSeconds((value) => {
        if (value > 1) return value - 1;
        if (phase === "preparing") void beginRecording();
        else stop();
        return 0;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase, beginRecording, stop]);

  React.useEffect(() => () => stop(), [stop]);

  if (phase === "denied") {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="size-4" aria-hidden />
        <AlertTitle>Microphone blocked</AlertTitle>
        <AlertDescription>
          Allow microphone access in your browser settings, then reload this page. Your other answers
          are saved.
        </AlertDescription>
      </Alert>
    );
  }

  const total =
    phase === "recording" ? config.recordingSeconds : Math.max(config.preparationSeconds, 1);
  const value = ((total - seconds) / total) * 100;

  return (
    <div
      className="rounded-xl border bg-muted/40 p-4"
      aria-live="polite"
      aria-label="Recording status"
    >
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex size-9 items-center justify-center rounded-full ${
            phase === "recording" ? "bg-destructive text-white" : "bg-background"
          }`}
        >
          {phase === "uploading" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : phase === "done" ? (
            <CheckCircle2 className="size-4 text-primary" />
          ) : (
            <Mic className="size-4" />
          )}
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium">
            {phase === "idle" && "Waiting for the prompt to finish…"}
            {phase === "preparing" && `Get ready — recording starts in ${seconds}s`}
            {phase === "recording" && `Recording… ${seconds}s left`}
            {phase === "uploading" && "Uploading your response…"}
            {phase === "done" && "Response recorded and saved."}
            {phase === "error" && "Upload failed. It will retry when you continue."}
          </p>
          {(phase === "preparing" || phase === "recording") && (
            <Progress className="mt-2" value={value} />
          )}
        </div>
      </div>
    </div>
  );
}
