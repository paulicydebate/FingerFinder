// String indices run low pitch -> high pitch (index 0 = thickest/lowest
// string, index 5 = thinnest/highest), matching how voicings are described
// (e.g. "X32010" reads low string first).

export type Tuning = number[]; // open MIDI note per string, low to high

export interface TuningPreset {
  name: string;
  tuning: Tuning;
}

const E2 = 40;
const A2 = 45;
const D3 = 50;
const G3 = 55;
const B3 = 59;
const E4 = 64;

export const STANDARD_TUNING: Tuning = [E2, A2, D3, G3, B3, E4];

export const TUNING_PRESETS: TuningPreset[] = [
  { name: "Standard (E A D G B E)", tuning: STANDARD_TUNING },
  { name: "Drop D (D A D G B E)", tuning: [E2 - 2, A2, D3, G3, B3, E4] },
  {
    name: "Half-step down (Eb Ab Db Gb Bb Eb)",
    tuning: STANDARD_TUNING.map((n) => n - 1),
  },
  {
    name: "Full-step down (D G C F A D)",
    tuning: STANDARD_TUNING.map((n) => n - 2),
  },
  { name: "DADGAD", tuning: [E2 - 2, A2, D3, G3, A2 + 12, E4 - 2] },
  { name: "Open G (D G D G B D)", tuning: [E2 - 2, A2, D3, G3, B3, E4 - 2] },
  { name: "Open D (D A D F# A D)", tuning: [E2 - 2, A2, D3, G3 - 1, A2 + 12, E4 - 2] },
];

export function transposeTuning(tuning: Tuning, semitones: number): Tuning {
  return tuning.map((n) => n + semitones);
}
