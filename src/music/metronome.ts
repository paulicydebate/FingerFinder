import { getAudioContext } from "./audioContext";

export type AccentLevel = "accent" | "normal" | "silent";

/** Clicks per beat: quarter, eighth, triplet, sixteenth notes. */
export type Subdivision = 1 | 2 | 3 | 4;

export const SUBDIVISION_OPTIONS: { value: Subdivision; label: string }[] = [
  { value: 1, label: "Quarter notes" },
  { value: 2, label: "Eighth notes" },
  { value: 3, label: "Triplets" },
  { value: 4, label: "Sixteenth notes" },
];

export const MIN_BPM = 20;
export const MAX_BPM = 300;

export function clampBpm(bpm: number): number {
  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm)));
}

export interface MetronomeSettings {
  bpm: number;
  beatsPerMeasure: number;
  subdivision: Subdivision;
  /** One entry per beat; length should match beatsPerMeasure. */
  accents: AccentLevel[];
}

export function defaultAccents(beatsPerMeasure: number): AccentLevel[] {
  return Array.from({ length: beatsPerMeasure }, (_, i) => (i === 0 ? "accent" : "normal"));
}

/** Resize an accent pattern to a new beat count, preserving existing choices. */
export function resizeAccents(accents: AccentLevel[], beatsPerMeasure: number): AccentLevel[] {
  if (accents.length === beatsPerMeasure) return accents;
  if (accents.length > beatsPerMeasure) return accents.slice(0, beatsPerMeasure);
  const extra = Array.from({ length: beatsPerMeasure - accents.length }, () => "normal" as const);
  return [...accents, ...extra];
}

export const DEFAULT_METRONOME_SETTINGS: MetronomeSettings = {
  bpm: 120,
  beatsPerMeasure: 4,
  subdivision: 1,
  accents: defaultAccents(4),
};

export function cycleAccent(level: AccentLevel): AccentLevel {
  if (level === "accent") return "normal";
  if (level === "normal") return "silent";
  return "accent";
}

export interface ClickEvent {
  /** AudioContext time (seconds) this click should sound at. */
  time: number;
  beatIndex: number;
  subIndex: number;
  isBeat: boolean;
  accent: AccentLevel;
}

/**
 * Generates click events on demand as playback time advances. Timing math
 * is pure (no audio/timer APIs touched here) so it's directly testable;
 * the live scheduling loop (setInterval + AudioContext) lives in the React
 * component and just calls `advanceUntil` repeatedly, a bit ahead of the
 * audio clock, to decide what to schedule next (the standard WebAudio
 * "lookahead scheduler" pattern - this avoids the drift and jitter a plain
 * setInterval click would have).
 */
export class MetronomeScheduler {
  private settings: MetronomeSettings;
  private nextClickTime: number;
  private beatIndex = 0;
  private subIndex = 0;

  constructor(settings: MetronomeSettings, startTime: number) {
    this.settings = settings;
    this.nextClickTime = startTime;
  }

  updateSettings(settings: MetronomeSettings): void {
    this.settings = settings;
  }

  /** Returns every click event up to (but not including) `targetTime`, advancing internal state. */
  advanceUntil(targetTime: number): ClickEvent[] {
    const events: ClickEvent[] = [];
    const { bpm, subdivision, beatsPerMeasure, accents } = this.settings;
    const subDuration = 60 / bpm / subdivision;

    // Guard against a pathological settings change leaving us with nothing
    // to advance by, which would otherwise spin forever.
    if (!(subDuration > 0) || beatsPerMeasure < 1) return events;

    while (this.nextClickTime < targetTime) {
      const isBeat = this.subIndex === 0;
      const beatAccent = accents[this.beatIndex] ?? "normal";
      const accent: AccentLevel = beatAccent === "silent" ? "silent" : isBeat ? beatAccent : "normal";

      events.push({
        time: this.nextClickTime,
        beatIndex: this.beatIndex,
        subIndex: this.subIndex,
        isBeat,
        accent,
      });

      this.nextClickTime += subDuration;
      this.subIndex++;
      if (this.subIndex >= subdivision) {
        this.subIndex = 0;
        this.beatIndex = (this.beatIndex + 1) % beatsPerMeasure;
      }
    }

    return events;
  }
}

/** Short percussive click, pitched by accent level. Silent clicks make no sound. */
export function scheduleClick(ac: AudioContext, time: number, accent: AccentLevel): void {
  if (accent === "silent") return;

  const freq = accent === "accent" ? 1760 : 1100;
  const peakGain = accent === "accent" ? 0.35 : 0.2;
  const duration = 0.035;

  const osc = ac.createOscillator();
  osc.type = "square";
  osc.frequency.value = freq;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(peakGain, time + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(time);
  osc.stop(time + duration + 0.01);
}

export function playTestClick(accent: AccentLevel = "accent"): void {
  const ac = getAudioContext();
  scheduleClick(ac, ac.currentTime + 0.02, accent);
}

/**
 * Tap-tempo: feed in the running list of tap timestamps (ms) and the new
 * tap time, get back the trimmed list and the BPM implied by the recent
 * taps' average interval. The sequence resets if the gap since the last
 * tap is too long (the user paused and is starting a new tempo).
 */
export function registerTap(
  existingTaps: number[],
  now: number,
  maxTaps = 8,
  resetGapMs = 2000,
): { taps: number[]; bpm: number | null } {
  const last = existingTaps[existingTaps.length - 1];
  const taps = last !== undefined && now - last > resetGapMs ? [now] : [...existingTaps, now];
  const trimmed = taps.slice(-maxTaps);

  if (trimmed.length < 2) return { taps: trimmed, bpm: null };

  const intervals: number[] = [];
  for (let i = 1; i < trimmed.length; i++) intervals.push(trimmed[i] - trimmed[i - 1]);
  const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const bpm = clampBpm(60000 / avgMs);

  return { taps: trimmed, bpm };
}
