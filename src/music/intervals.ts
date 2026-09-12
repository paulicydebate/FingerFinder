// Catalog of intervals we can build chords/scales from. `letterSteps` is the
// number of letter-names above the root (mod 7), used for correct spelling.
// `semitones` is the actual pitch distance above the root, which may exceed
// 12 for compound intervals (9th/11th/13th) — callers reduce mod 12 when they
// only need a pitch class.

export interface IntervalDef {
  id: string;
  label: string; // short display label, e.g. "b3", "5", "9"
  letterSteps: number;
  semitones: number;
}

export const INTERVALS: Record<string, IntervalDef> = {
  R: { id: "R", label: "R", letterSteps: 0, semitones: 0 },
  b2: { id: "b2", label: "b9", letterSteps: 1, semitones: 1 },
  "2": { id: "2", label: "2", letterSteps: 1, semitones: 2 },
  b3: { id: "b3", label: "b3", letterSteps: 2, semitones: 3 },
  "3": { id: "3", label: "3", letterSteps: 2, semitones: 4 },
  "4": { id: "4", label: "4", letterSteps: 3, semitones: 5 },
  "#4": { id: "#4", label: "#11", letterSteps: 3, semitones: 6 },
  b5: { id: "b5", label: "b5", letterSteps: 4, semitones: 6 },
  "5": { id: "5", label: "5", letterSteps: 4, semitones: 7 },
  "#5": { id: "#5", label: "#5", letterSteps: 4, semitones: 8 },
  "6": { id: "6", label: "6", letterSteps: 5, semitones: 9 },
  bb7: { id: "bb7", label: "bb7", letterSteps: 6, semitones: 9 },
  b7: { id: "b7", label: "b7", letterSteps: 6, semitones: 10 },
  "7": { id: "7", label: "7", letterSteps: 6, semitones: 11 },
  b9: { id: "b9", label: "b9", letterSteps: 1, semitones: 13 },
  "9": { id: "9", label: "9", letterSteps: 1, semitones: 14 },
  "#9": { id: "#9", label: "#9", letterSteps: 1, semitones: 15 },
  "11": { id: "11", label: "11", letterSteps: 3, semitones: 17 },
  "#11": { id: "#11", label: "#11", letterSteps: 3, semitones: 18 },
  b13: { id: "b13", label: "b13", letterSteps: 5, semitones: 20 },
  "13": { id: "13", label: "13", letterSteps: 5, semitones: 21 },
};

export function getInterval(id: string): IntervalDef {
  const def = INTERVALS[id];
  if (!def) throw new Error(`Unknown interval id: ${id}`);
  return def;
}
