import { describe, expect, it } from "vitest";
import { buildChord } from "../chords";
import { arpeggioStringRangeLabel, findSweepShapes } from "../arpeggios";
import { STANDARD_TUNING } from "../tuning";

function midiAt(tuning: number[], stringIndex: number, fret: number): number {
  return tuning[stringIndex] + fret;
}

describe("findSweepShapes", () => {
  it("finds strictly ascending 3-string sweep shapes for a C major triad", () => {
    const chord = buildChord({ letter: "C", accidental: 0 }, "major", "none", "none");
    const shapes = findSweepShapes(chord, STANDARD_TUNING, 3);
    expect(shapes.length).toBeGreaterThan(0);

    for (const shape of shapes) {
      const window = Array.from({ length: 3 }, (_, i) => shape.stringLo + i);
      expect(shape.stringHi - shape.stringLo).toBe(2);
      expect(shape.soundingStrings).toBe(3);

      let prevPitch = -Infinity;
      for (const s of window) {
        const fret = shape.frets[s];
        expect(fret).not.toBeNull();
        const pitch = midiAt(STANDARD_TUNING, s, fret as number);
        expect(pitch).toBeGreaterThan(prevPitch);
        prevPitch = pitch;

        const toneIdx = shape.toneIndices[s]!;
        expect(chord.tones[toneIdx].pitchClass).toBe(pitch % 12);
      }

      // strings outside the window are untouched (muted)
      for (let s = 0; s < STANDARD_TUNING.length; s++) {
        if (!window.includes(s)) expect(shape.frets[s]).toBeNull();
      }

      expect(shape.maxFret - shape.minFret).toBeLessThanOrEqual(6);
    }
  });

  it("repeats the tone cycle across a 6-string sweep of a triad", () => {
    const chord = buildChord({ letter: "C", accidental: 0 }, "major", "none", "none");
    const shapes = findSweepShapes(chord, STANDARD_TUNING, 6);
    expect(shapes.length).toBeGreaterThan(0);
    for (const shape of shapes) {
      expect(shape.stringLo).toBe(0);
      expect(shape.stringHi).toBe(5);
      for (let i = 0; i < 3; i++) {
        const tone1 = chord.tones[shape.toneIndices[i]!].pitchClass;
        const tone2 = chord.tones[shape.toneIndices[i + 3]!].pitchClass;
        expect(tone1).toBe(tone2);
      }
    }
  });

  it("respects a tighter maxSpan", () => {
    const chord = buildChord({ letter: "G", accidental: 0 }, "major", "none", "7");
    const shapes = findSweepShapes(chord, STANDARD_TUNING, 4, {
      maxFretSearch: 15,
      maxSpan: 3,
    });
    for (const shape of shapes) {
      expect(shape.maxFret - shape.minFret).toBeLessThanOrEqual(3);
    }
  });

  it("returns nothing for an out-of-range string count", () => {
    const chord = buildChord({ letter: "C", accidental: 0 }, "major", "none", "none");
    expect(findSweepShapes(chord, STANDARD_TUNING, 1)).toEqual([]);
    expect(findSweepShapes(chord, STANDARD_TUNING, 7)).toEqual([]);
  });

  it("finds shapes starting on each chord tone (inversions)", () => {
    const chord = buildChord({ letter: "C", accidental: 0 }, "major", "none", "none");
    const shapes = findSweepShapes(chord, STANDARD_TUNING, 3);
    const startingPcs = new Set(
      shapes.map((s) => chord.tones[s.startToneIndex].pitchClass),
    );
    // root, 3rd, and 5th should each appear as a valid starting tone somewhere
    expect(startingPcs.size).toBe(3);
  });
});

describe("arpeggioStringRangeLabel", () => {
  it("labels the low 3 strings using guitarist string numbers", () => {
    const chord = buildChord({ letter: "C", accidental: 0 }, "major", "none", "none");
    const shapes = findSweepShapes(chord, STANDARD_TUNING, 3);
    const lowWindow = shapes.find((s) => s.stringLo === 0)!;
    expect(arpeggioStringRangeLabel(lowWindow, 6)).toBe("Strings 6-4");
  });
});
