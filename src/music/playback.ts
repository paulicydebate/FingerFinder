import { getAudioContext } from "./audioContext";
import type { Tuning } from "./tuning";

/** Frequency in Hz of a MIDI note number (A4 = 69 = 440 Hz). */
export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * MIDI notes sounding for a shape, low string to high. Muted strings
 * (null frets) are skipped; open strings use the tuning's open note.
 */
export function shapeToMidiNotes(frets: (number | null)[], tuning: Tuning): number[] {
  const notes: number[] = [];
  frets.forEach((fret, i) => {
    if (fret === null || fret === undefined || tuning[i] === undefined) return;
    notes.push(tuning[i] + fret);
  });
  return notes;
}

export function shapeToFrequencies(frets: (number | null)[], tuning: Tuning): number[] {
  return shapeToMidiNotes(frets, tuning).map(midiToFrequency);
}

export type PlaybackMode = "strum" | "arpeggio";

export const STRUM_STAGGER_S = 0.03;
export const ARPEGGIO_STEP_S = 0.25;

/** Start offsets (seconds) for each note in the given mode. */
export function noteOffsets(count: number, mode: PlaybackMode): number[] {
  const step = mode === "strum" ? STRUM_STAGGER_S : ARPEGGIO_STEP_S;
  return Array.from({ length: count }, (_, i) => i * step);
}

function pluck(ac: AudioContext, freq: number, start: number, duration: number) {
  const osc = ac.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.value = freq;
  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(Math.min(freq * 6, 8000), start);
  filter.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.5, 200), start + duration);
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.18, start + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(filter).connect(gain).connect(ac.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

/** Play a shape in the browser. AudioContext is created lazily on first call. */
export function playShape(frets: (number | null)[], tuning: Tuning, mode: PlaybackMode): void {
  const freqs = shapeToFrequencies(frets, tuning);
  if (freqs.length === 0) return;
  const ac = getAudioContext();
  const now = ac.currentTime + 0.02;
  const offsets = noteOffsets(freqs.length, mode);
  freqs.forEach((f, i) => pluck(ac, f, now + offsets[i], mode === "strum" ? 2 : 1.2));
}
