import { describe, expect, it } from "vitest";
import { buildChord } from "../chords";
import { STANDARD_TUNING } from "../tuning";
import { countFingers, findVoicings } from "../voicings";

describe("countFingers", () => {
  it("counts a full barre (F major shape) as 4 fingers", () => {
    const { fingerCount, barreFret, barreStrings } = countFingers([
      1, 3, 3, 2, 1, 1,
    ]);
    expect(fingerCount).toBe(4);
    expect(barreFret).toBe(1);
    expect(barreStrings).toEqual([0, 5]);
  });

  it("counts an open C shape as 3 fingers with no barre", () => {
    const { fingerCount, barreFret } = countFingers([null, 3, 2, 0, 1, 0]);
    expect(fingerCount).toBe(3);
    expect(barreFret).toBeNull();
  });

  it("does not allow a barre across an open string", () => {
    const { fingerCount, barreFret } = countFingers([2, 0, 2, null, null, null]);
    expect(barreFret).toBeNull();
    expect(fingerCount).toBe(2);
  });

  it("returns 0 fingers for an all-open/muted shape", () => {
    const { fingerCount } = countFingers([0, null, 0, null, 0, null]);
    expect(fingerCount).toBe(0);
  });
});

describe("findVoicings", () => {
  it("finds an open-position C major shape (3-2-0-1-0 on the top 5 strings)", () => {
    const chord = buildChord({ letter: "C", accidental: 0 }, "major", "none", "none");
    const shapes = findVoicings(chord, STANDARD_TUNING);
    // The low E string may either be muted (the textbook X32010 shape) or
    // left ringing (E is the chord's 3rd, so it's also a valid voicing) -
    // accept either since both are genuinely playable.
    const hasOpenC = shapes.some(
      (s) =>
        JSON.stringify(s.frets.slice(1)) === JSON.stringify([3, 2, 0, 1, 0]) &&
        (s.frets[0] === null || s.frets[0] === 0),
    );
    expect(hasOpenC).toBe(true);
  });

  it("finds the standard open E major shape", () => {
    const chord = buildChord({ letter: "E", accidental: 0 }, "major", "none", "none");
    const shapes = findVoicings(chord, STANDARD_TUNING);
    const hasOpenE = shapes.some(
      (s) => JSON.stringify(s.frets) === JSON.stringify([0, 2, 2, 1, 0, 0]),
    );
    expect(hasOpenE).toBe(true);
  });

  it("every returned shape is actually playable", () => {
    const chord = buildChord({ letter: "G", accidental: 0 }, "major", "none", "7");
    const shapes = findVoicings(chord, STANDARD_TUNING);
    expect(shapes.length).toBeGreaterThan(0);
    const requiredPcs = new Set(
      chord.tones.filter((t) => t.required).map((t) => t.pitchClass),
    );
    for (const shape of shapes) {
      expect(shape.maxFret - shape.minFret).toBeLessThanOrEqual(4);
      expect(shape.fingerCount).toBeLessThanOrEqual(4);
      expect(shape.soundingStrings).toBeGreaterThanOrEqual(3);
      const soundedPcs = new Set(
        shape.toneIndices
          .filter((t): t is number => t !== null)
          .map((t) => chord.tones[t].pitchClass),
      );
      for (const pc of requiredPcs) {
        expect(soundedPcs.has(pc)).toBe(true);
      }
    }
  });

  it("never requires reaching over 2+ ringing open strings between fretted notes", () => {
    // Regression test: a G7 voicing with F on strings 1 and 6 (fret 1) while
    // strings 2-5 ring open is not physically reachable by two fingers.
    const chord = buildChord({ letter: "G", accidental: 0 }, "major", "none", "7");
    const shapes = findVoicings(chord, STANDARD_TUNING);
    for (const shape of shapes) {
      const frettedIndices = shape.frets
        .map((f, i) => (typeof f === "number" && f > 0 ? i : -1))
        .filter((i) => i >= 0);
      for (let k = 0; k < frettedIndices.length - 1; k++) {
        let openBetween = 0;
        for (let s = frettedIndices[k] + 1; s < frettedIndices[k + 1]; s++) {
          if (shape.frets[s] === 0) openBetween++;
        }
        expect(openBetween).toBeLessThan(2);
      }
    }
  });

  it("respects a tighter maxFingers constraint", () => {
    const chord = buildChord({ letter: "B", accidental: 0 }, "major", "none", "7");
    const shapes = findVoicings(chord, STANDARD_TUNING, {
      maxFretSearch: 15,
      maxSpan: 4,
      maxFingers: 2,
      minStrings: 3,
    });
    for (const shape of shapes) {
      expect(shape.fingerCount).toBeLessThanOrEqual(2);
    }
  });

  it("changes shapes when tuning changes (drop D)", () => {
    const chord = buildChord({ letter: "D", accidental: 0 }, "major", "none", "none");
    const standardShapes = findVoicings(chord, STANDARD_TUNING);
    const dropD = [38, 45, 50, 55, 59, 64];
    const dropDShapes = findVoicings(chord, dropD);
    // Drop D tuning should allow an open low D root not available in standard tuning.
    const dropDHasOpenRoot = dropDShapes.some((s) => s.frets[0] === 0);
    expect(dropDHasOpenRoot).toBe(true);
    expect(standardShapes.length).toBeGreaterThan(0);
    expect(dropDShapes.length).toBeGreaterThan(0);
  });
});
