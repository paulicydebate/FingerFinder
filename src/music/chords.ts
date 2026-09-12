import { getInterval } from "./intervals";
import {
  buildChordFormula,
  chordSymbol,
  type Extension,
  type Quality,
  type Sus,
} from "./chordFormulas";
import {
  mod12,
  pitchClass,
  spellFromRoot,
  spellingToString,
  type NoteSpelling,
} from "./notes";

export interface ChordTone {
  intervalId: string;
  intervalLabel: string;
  required: boolean;
  pitchClass: number;
  noteName: string;
}

export interface Chord {
  root: NoteSpelling;
  quality: Quality;
  sus: Sus;
  extension: Extension;
  symbol: string;
  tones: ChordTone[];
}

export function buildChord(
  root: NoteSpelling,
  quality: Quality,
  sus: Sus,
  extension: Extension,
): Chord {
  const formula = buildChordFormula(quality, sus, extension);
  const rootPitchClass = pitchClass(root);

  const tones: ChordTone[] = formula.map((spec) => {
    const interval = getInterval(spec.intervalId);
    const spelled = spellFromRoot(
      root,
      interval.letterSteps,
      interval.semitones,
    );
    return {
      intervalId: spec.intervalId,
      intervalLabel: interval.id === "R" ? "R" : interval.label,
      required: spec.required,
      pitchClass: mod12(rootPitchClass + interval.semitones),
      noteName: spellingToString(spelled),
    };
  });

  return {
    root,
    quality,
    sus,
    extension,
    symbol: chordSymbol(spellingToString(root), quality, sus, extension),
    tones,
  };
}
