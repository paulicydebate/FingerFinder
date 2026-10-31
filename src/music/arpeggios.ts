import type { Chord } from "./chords";
import { mod12 } from "./notes";
import type { Tuning } from "./tuning";
import { countFingers, type ChordShape } from "./voicings";

export interface ArpeggioOptions {
  maxFretSearch: number;
  /** Max fret spread allowed across the whole sweep (notes are played one at
   * a time, not held simultaneously, so this can be looser than a chord's
   * stretch limit). */
  maxSpan: number;
}

export const DEFAULT_ARPEGGIO_OPTIONS: ArpeggioOptions = {
  maxFretSearch: 15,
  maxSpan: 6,
};

export interface ArpeggioShape extends ChordShape {
  /** Lowest/highest string index (0 = low string) spanned by the sweep. */
  stringLo: number;
  stringHi: number;
  /** Index into chord.tones for the tone the sweep starts on (lowest string). */
  startToneIndex: number;
}

/**
 * Chord tones ordered by pitch distance above the root within one octave
 * (R, 3, 5, 7, 9, ...), deduped by pitch class. This is the order a sweep
 * arpeggio climbs through, repeating as needed to fill more strings than
 * the chord has distinct tones.
 */
function toneCycle(chord: Chord): number[] {
  const rootPc = chord.tones[0].pitchClass;
  const seenPc = new Set<number>();
  const result: number[] = [];
  const ordered = chord.tones
    .map((tone, idx) => ({ idx, rel: mod12(tone.pitchClass - rootPc) }))
    .sort((a, b) => a.rel - b.rel);
  for (const entry of ordered) {
    if (seenPc.has(entry.rel)) continue;
    seenPc.add(entry.rel);
    result.push(entry.idx);
  }
  return result;
}

/**
 * Finds one-note-per-string sweep-picking shapes for a chord: contiguous
 * groups of `numStrings` strings, each fretted with the next tone in the
 * chord's cycle (root, 3rd, 5th, ...), strictly ascending in pitch from the
 * lowest string to the highest so it actually sounds like a climbing
 * arpeggio run. Every contiguous string window and every starting tone
 * ("inversion") is tried, so e.g. a root-position and a 3rd-position sweep
 * both show up as separate shapes.
 */
export function findSweepShapes(
  chord: Chord,
  tuning: Tuning,
  numStrings: number,
  options: ArpeggioOptions = DEFAULT_ARPEGGIO_OPTIONS,
): ArpeggioShape[] {
  const { maxFretSearch, maxSpan } = options;
  const numTuningStrings = tuning.length;
  if (numStrings < 2 || numStrings > numTuningStrings) return [];

  const cycle = toneCycle(chord);
  if (cycle.length === 0) return [];

  const results: ArpeggioShape[] = [];

  for (let lo = 0; lo + numStrings <= numTuningStrings; lo++) {
    const hi = lo + numStrings - 1;

    for (let offset = 0; offset < cycle.length; offset++) {
      const perStringCandidates: number[][] = [];
      let feasible = true;

      for (let i = 0; i < numStrings; i++) {
        const stringIndex = lo + i;
        const toneIdx = cycle[(offset + i) % cycle.length];
        const targetPc = chord.tones[toneIdx].pitchClass;
        const frets: number[] = [];
        for (let fret = 0; fret <= maxFretSearch; fret++) {
          if (mod12(tuning[stringIndex] + fret) === targetPc) frets.push(fret);
        }
        if (frets.length === 0) {
          feasible = false;
          break;
        }
        perStringCandidates.push(frets);
      }
      if (!feasible) continue;

      const chosen: number[] = new Array(numStrings).fill(-1);

      function dfs(i: number): boolean {
        if (i === numStrings) {
          const minF = Math.min(...chosen);
          const maxF = Math.max(...chosen);
          return maxF - minF <= maxSpan;
        }
        for (const fret of perStringCandidates[i]) {
          if (i > 0) {
            const prevPitch = tuning[lo + i - 1] + chosen[i - 1];
            const pitch = tuning[lo + i] + fret;
            if (pitch <= prevPitch) continue;
          }
          chosen[i] = fret;
          if (dfs(i + 1)) return true;
        }
        chosen[i] = -1;
        return false;
      }

      if (!dfs(0)) continue;

      const frets: (number | null)[] = new Array(numTuningStrings).fill(null);
      const toneIndices: (number | null)[] = new Array(numTuningStrings).fill(null);
      for (let i = 0; i < numStrings; i++) {
        frets[lo + i] = chosen[i];
        toneIndices[lo + i] = cycle[(offset + i) % cycle.length];
      }

      const frettedVals = chosen.filter((f) => f > 0);
      const minFret = frettedVals.length ? Math.min(...frettedVals) : 0;
      const maxFret = frettedVals.length ? Math.max(...frettedVals) : 0;
      const { fingerCount, barreFret, barreStrings } = countFingers(frets);

      results.push({
        frets,
        toneIndices,
        minFret,
        maxFret,
        soundingStrings: numStrings,
        fingerCount,
        barreFret,
        barreStrings,
        score: 0,
        stringLo: lo,
        stringHi: hi,
        startToneIndex: cycle[offset],
      });
    }
  }

  results.sort((a, b) => a.stringLo - b.stringLo || a.minFret - b.minFret);
  return results;
}

export function arpeggioStringRangeLabel(shape: ArpeggioShape, totalStrings: number): string {
  const lowNumber = totalStrings - shape.stringLo;
  const highNumber = totalStrings - shape.stringHi;
  return `Strings ${lowNumber}-${highNumber}`;
}
