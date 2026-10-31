import { describe, expect, it } from "vitest";
import { buildChord } from "../chords";
import { identifyChord, shapeFromFrets } from "../reverseLookup";
import { STANDARD_TUNING } from "../tuning";

describe("identifyChord", () => {
  it("identifies a plain open C major triad", () => {
    const matches = identifyChord([null, 3, 2, 0, 1, 0], STANDARD_TUNING);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].chord.symbol).toBe("C");
    expect(matches[0].bassIsRoot).toBe(true);
  });

  it("prefers Am7 when the bass note is A", () => {
    // A(open,R) - E(D+2,5) - G(open,b7) - C(B+1,b3) - E(open,5)
    const matches = identifyChord([null, 0, 2, 0, 1, 0], STANDARD_TUNING);
    expect(matches[0].chord.symbol).toBe("Am7");
    expect(matches[0].bassIsRoot).toBe(true);
    expect(matches[0].exact).toBe(true);
  });

  it("prefers C6 over Am7 for the same tone family when the bass note is C", () => {
    // C(A+3,R) - E(D+2,3) - A(G+2,6) - C(B+1,R) - E(open,3)
    const matches = identifyChord([null, 3, 2, 2, 1, 0], STANDARD_TUNING);
    expect(matches[0].chord.symbol).toBe("C6");
    expect(matches[0].bassIsRoot).toBe(true);
  });

  it("returns nothing for a shape with fewer than 2 distinct pitch classes", () => {
    expect(identifyChord([null, null, null, null, null, null], STANDARD_TUNING)).toEqual([]);
    expect(identifyChord([0, null, null, null, null, 0], STANDARD_TUNING)).toEqual([]);
  });

  it("never returns a match with foreign notes outside the chord", () => {
    const matches = identifyChord([3, 5, 5, 4, 3, 3], STANDARD_TUNING); // G7 shape
    for (const m of matches) {
      const tonePcs = new Set(m.chord.tones.map((t) => t.pitchClass));
      const played = new Set([3, 5, 5, 4, 3, 3].map((f, i) => (STANDARD_TUNING[i] + f) % 12));
      for (const pc of played) expect(tonePcs.has(pc)).toBe(true);
    }
  });

  it("doesn't pad a clean triad match with contrived alternate root readings", () => {
    // X32010 (open C major) is unambiguous - every other theoretically
    // possible reading requires an unplayed tone and should score far
    // enough below "C" to be filtered out rather than listed as an alternate.
    const matches = identifyChord([null, 3, 2, 0, 1, 0], STANDARD_TUNING);
    expect(matches[0].chord.symbol).toBe("C");
    expect(matches.length).toBeLessThanOrEqual(2);
  });

  it("respects maxResults", () => {
    const matches = identifyChord([null, 3, 2, 0, 1, 0], STANDARD_TUNING, { maxResults: 2 });
    expect(matches.length).toBeLessThanOrEqual(2);
  });
});

describe("shapeFromFrets", () => {
  it("maps each fretted string to the correct chord tone", () => {
    const chord = buildChord({ letter: "A", accidental: 0 }, "minor", "none", "7");
    const frets = [null, 0, 2, 0, 1, 0];
    const shape = shapeFromFrets(chord, frets, STANDARD_TUNING);

    expect(shape.toneIndices[0]).toBeNull();
    expect(chord.tones[shape.toneIndices[1]!].intervalLabel).toBe("R");
    expect(chord.tones[shape.toneIndices[3]!].intervalLabel).toBe("b7");
    expect(chord.tones[shape.toneIndices[4]!].intervalLabel).toBe("b3");
    expect(shape.soundingStrings).toBe(5);
  });
});
