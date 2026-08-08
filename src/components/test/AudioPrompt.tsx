/**
 * Controlled audio player for listening and speaking prompts.
 *
 * PTE rules: the recording plays a fixed number of times and cannot be
 * scrubbed or restarted once the allowance is used.
 */
import * as React from "react";
import { Loader2, Pause, Play, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface AudioPromptProps {
  src: string;
  maxPlays: number;
  /** Fires the first time playback finishes (used to start speaking prep). */
  onFinished?: (() => void) | undefined;
  autoPlay?: boolean | undefined;
}

export function AudioPrompt({ src, maxPlays, onFinished, autoPlay }: AudioPromptProps) {
  const ref = React.useRef<HTMLAudioElement | null>(null);
  const [plays, setPlays] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [error, setError] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const playsLeft = Math.max(0, maxPlays - plays);

  const start = React.useCallback(() => {
    const element = ref.current;
    if (!element || playsLeft === 0) return;
    setPlays((value) => value + 1);
    void element.play().catch(() => setError(true));
  }, [playsLeft]);

  React.useEffect(() => {
    if (autoPlay && !loading && plays === 0 && !error) start();
  }, [autoPlay, loading, plays, error, start]);

  return (
    <div className="rounded-xl border bg-muted/40 p-4">
      <audio
        ref={ref}
        src={src}
        preload="auto"
        onLoadedMetadata={(event) => {
          setDuration(event.currentTarget.duration || 0);
          setLoading(false);
        }}
        onTimeUpdate={(event) => {
          const element = event.currentTarget;
          setProgress(element.duration ? (element.currentTime / element.duration) * 100 : 0);
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setProgress(100);
          onFinished?.();
        }}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
      />
      <div className="flex items-center gap-3">
        <Button
          type="button"
          size="icon"
          variant="secondary"
          onClick={() => (playing ? ref.current?.pause() : start())}
          disabled={error || loading || (playsLeft === 0 && !playing)}
          aria-label={playing ? "Pause the recording" : "Play the recording"}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : playing ? (
            <Pause className="size-4" />
          ) : (
            <Play className="size-4" />
          )}
        </Button>
        <div className="flex-1">
          <Progress value={progress} aria-label="Recording playback progress" />
          <p className="mt-1 text-xs text-muted-foreground">
            {error
              ? "The audio could not be loaded. Tell your supervisor and continue."
              : playsLeft === 0
                ? "Playback finished — this recording cannot be replayed."
                : `Plays remaining: ${playsLeft}${duration ? ` · ${Math.round(duration)}s` : ""}`}
          </p>
        </div>
        <Volume2 className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </div>
    </div>
  );
}
