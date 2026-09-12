import type { Chord } from "./chords";
import { mod12 } from "./notes";
import type { Tuning } from "./tuning";

export interface VoicingOptions {
  maxFretSearch: number;
  maxSpan: number;
  maxFingers: number;
  minStrings: number;
}

export const DEFAULT_VOICING_OPTIONS: VoicingOptions = {
  maxFretSearch: 15,
  maxSpan: 4,
  maxFingers: 4,
  minStrings: 3,
};

export interface ChordShape {
  /** Per string (low to high), null = muted, 0 = open, >0 = fretted. */
  frets: (number | null)[];
  /** Per string, index into chord.tones for the note actually sounding. */
  toneIndices: (number | null)[];
  minFret: number; // lowest fretted (>0) fret used, or 0 if none
  maxFret: number; // highest fretted fret used, or 0 if none
  soundingStrings: number;
  fingerCount: number;
  barreFret: number | null;
  barreStrings: [number, number] | null;
  score: number;
}

interface Candidate {
  fret: number | null;
  toneIndex: number | null;
}

/**
 * Counts fretting fingers, treating same-fret notes at the lowest fret as a
 * single barre finger when nothing between them is open (a barre finger
 * physically presses every string it crosses, so an open string in the
 * middle would be impossible). Every other fretted note costs one finger.
 */
export function countFingers(frets: (number | null)[]): {
  fingerCount: number;
  barreFret: number | null;
  barreStrings: [number, number] | null;
} {
  const fretted = frets
    .map((fret, stringIndex) => ({ fret, stringIndex }))
    .filter((f): f is { fret: number; stringIndex: number } =>
      typeof f.fret === "number" && f.fret > 0,
    );

  if (fretted.length === 0) {
    return { fingerCount: 0, barreFret: null, barreStrings: null };
  }

  const minFret = Math.min(...fretted.map((f) => f.fret));
  const atMin = fretted.filter((f) => f.fret === minFret);
  const others = fretted.filter((f) => f.fret !== minFret);

  if (atMin.length < 2) {
    return {
      fingerCount: fretted.length,
      barreFret: null,
      barreStrings: null,
    };
  }

  const lo = Math.min(...atMin.map((f) => f.stringIndex));
  const hi = Math.max(...atMin.map((f) => f.stringIndex));
  let validBarre = true;
  for (let s = lo; s <= hi; s++) {
    if (frets[s] === 0) {
      validBarre = false;
      break;
    }
  }

  if (validBarre) {
    return {
      fingerCount: 1 + others.length,
      barreFret: minFret,
      barreStrings: [lo, hi],
    };
  }

  return {
    fingerCount: atMin.length + others.length,
    barreFret: null,
    barreStrings: null,
  };
}

export function findVoicings(
  chord: Chord,
  tuning: Tuning,
  options: VoicingOptions = DEFAULT_VOICING_OPTIONS,
): ChordShape[] {
  const { maxFretSearch, maxSpan, maxFingers, minStrings } = options;
  const numStrings = tuning.length;

  // Map each distinct pitch class to a chord tone, preferring required tones
  // when two tones share a pitch class (e.g. sus2 and add9 both land on the
  // 2nd/9th scale degree pitch class).
  const toneByPitchClass = new Map<number, number>();
  chord.tones.forEach((tone, idx) => {
    const existing = toneByPitchClass.get(tone.pitchClass);
    if (existing === undefined || (tone.required && !chord.tones[existing].required)) {
      toneByPitchClass.set(tone.pitchClass, idx);
    }
  });

  const requiredPitchClasses = [
    ...new Set(
      chord.tones.filter((t) => t.required).map((t) => t.pitchClass),
    ),
  ];

  const shapesBySignature = new Map<string, ChordShape>();

  function candidatesForWindow(lo: number, hi: number): Candidate[][] {
    const perString: Candidate[][] = [];
    for (let s = 0; s < numStrings; s++) {
      const options: Candidate[] = [{ fret: null, toneIndex: null }];
      const openPc = mod12(tuning[s]);
      const openTone = toneByPitchClass.get(openPc);
      if (openTone !== undefined) {
        options.push({ fret: 0, toneIndex: openTone });
      }
      const fretLo = Math.max(lo, 1);
      for (let fret = fretLo; fret <= hi && fret <= maxFretSearch; fret++) {
        const pc = mod12(tuning[s] + fret);
        const toneIndex = toneByPitchClass.get(pc);
        if (toneIndex !== undefined) {
          options.push({ fret, toneIndex });
        }
      }
      perString.push(options);
    }
    return perString;
  }

  function searchWindow(lo: number, hi: number) {
    const perString = candidatesForWindow(lo, hi);
    const chosenFrets: (number | null)[] = new Array(numStrings).fill(null);
    const chosenTones: (number | null)[] = new Array(numStrings).fill(null);

    function coveredCount(uptoString: number): number {
      const covered = new Set<number>();
      for (let s = 0; s < uptoString; s++) {
        if (chosenTones[s] !== null) {
          const pc = chord.tones[chosenTones[s] as number].pitchClass;
          if (requiredPitchClasses.includes(pc)) covered.add(pc);
        }
      }
      return covered.size;
    }

    function dfs(stringIndex: number) {
      if (stringIndex === numStrings) {
        const covered = coveredCount(numStrings);
        if (covered < requiredPitchClasses.length) return;

        const soundingStrings = chosenFrets.filter((f) => f !== null).length;
        if (soundingStrings < minStrings) return;

        const frettedFrets = chosenFrets.filter(
          (f): f is number => typeof f === "number" && f > 0,
        );
        const minFret = frettedFrets.length ? Math.min(...frettedFrets) : 0;
        const maxFret = frettedFrets.length ? Math.max(...frettedFrets) : 0;
        if (maxFret - minFret > maxSpan) return;

        const { fingerCount, barreFret, barreStrings } = countFingers(
          chosenFrets,
        );
        if (fingerCount > maxFingers) return;

        // Reject shapes that require two different fingers to fret
        // non-adjacent strings while 2+ strings ring open in between: a
        // finger can't reach across multiple untouched open strings, so
        // this isn't physically playable even though the span/finger count
        // look fine in isolation. Skipping a single open string (as in the
        // classic open-C shape) is normal and stays allowed.
        const frettedIndices = chosenFrets
          .map((f, i) => (typeof f === "number" && f > 0 ? i : -1))
          .filter((i) => i >= 0);
        for (let k = 0; k < frettedIndices.length - 1; k++) {
          const a = frettedIndices[k];
          const b = frettedIndices[k + 1];
          let openBetween = 0;
          for (let s = a + 1; s < b; s++) {
            if (chosenFrets[s] === 0) openBetween++;
          }
          if (openBetween >= 2) return;
        }

        // Prefer shapes covering all chord tones (not just required ones),
        // shapes without "holes" (a muted string between two sounding
        // strings), and root note present.
        const allPitchClasses = new Set(chosenTones
          .filter((t): t is number => t !== null)
          .map((t) => chord.tones[t].pitchClass));
        const bonusToneCoverage = allPitchClasses.size;

        let hasHole = false;
        const soundingIdx = chosenFrets
          .map((f, i) => (f !== null ? i : -1))
          .filter((i) => i >= 0);
        if (soundingIdx.length > 1) {
          const lo2 = soundingIdx[0];
          const hi2 = soundingIdx[soundingIdx.length - 1];
          for (let s = lo2; s <= hi2; s++) {
            if (chosenFrets[s] === null) hasHole = true;
          }
        }

        const rootPc = chord.tones[0].pitchClass;
        const hasRoot = chosenTones.some(
          (t) => t !== null && chord.tones[t].pitchClass === rootPc,
        );

        const score =
          soundingStrings * 10 +
          bonusToneCoverage * 3 +
          (hasRoot ? 5 : 0) +
          (hasHole ? -4 : 0) -
          fingerCount;

        const signature = chosenFrets.map((f) => (f === null ? "x" : f)).join(",");
        const existing = shapesBySignature.get(signature);
        if (!existing || existing.score < score) {
          shapesBySignature.set(signature, {
            frets: [...chosenFrets],
            toneIndices: [...chosenTones],
            minFret,
            maxFret,
            soundingStrings,
            fingerCount,
            barreFret,
            barreStrings,
            score,
          });
        }
        return;
      }

      const remainingStrings = numStrings - stringIndex;
      const coveredSoFar = coveredCount(stringIndex);
      if (requiredPitchClasses.length - coveredSoFar > remainingStrings) {
        return;
      }

      for (const candidate of perString[stringIndex]) {
        chosenFrets[stringIndex] = candidate.fret;
        chosenTones[stringIndex] = candidate.toneIndex;
        dfs(stringIndex + 1);
      }
      chosenFrets[stringIndex] = null;
      chosenTones[stringIndex] = null;
    }

    dfs(0);
  }

  const topLo = Math.max(1, maxFretSearch - maxSpan);
  for (let lo = 1; lo <= topLo; lo++) {
    searchWindow(lo, Math.min(lo + maxSpan, maxFretSearch));
  }

  const shapes = [...shapesBySignature.values()];
  shapes.sort((a, b) => a.minFret - b.minFret || b.score - a.score);

  // Keep the best few shapes per position (grouped by lowest fret used) so
  // the navigator doesn't drown in near-duplicate voicings.
  const perPositionCap = 3;
  const counts = new Map<number, number>();
  const result: ChordShape[] = [];
  for (const shape of shapes) {
    const count = counts.get(shape.minFret) ?? 0;
    if (count >= perPositionCap) continue;
    counts.set(shape.minFret, count + 1);
    result.push(shape);
  }

  return result;
}

export function positionLabel(shape: ChordShape): string {
  if (shape.minFret === 0) return "Open position";
  const suffix =
    shape.minFret % 10 === 1 && shape.minFret !== 11
      ? "st"
      : shape.minFret % 10 === 2 && shape.minFret !== 12
        ? "nd"
        : shape.minFret % 10 === 3 && shape.minFret !== 13
          ? "rd"
          : "th";
  return `${shape.minFret}${suffix} fret position`;
}
