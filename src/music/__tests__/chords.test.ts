import { describe, expect, it } from "vitest";
import { buildChord } from "../chords";

function toneMap(tones: ReturnType<typeof buildChord>["tones"]) {
  return Object.fromEntries(tones.map((t) => [t.intervalLabel, t.noteName]));
}

describe("buildChord", () => {
  it("builds a C major triad", () => {
    const chord = buildChord({ letter: "C", accidental: 0 }, "major", "none", "none");
    expect(chord.symbol).toBe("C");
    const tones = toneMap(chord.tones);
    expect(tones["R"]).toBe("C");
    expect(tones["3"]).toBe("E");
    expect(tones["5"]).toBe("G");
  });

  it("builds an A minor triad with correct symbol", () => {
    const chord = buildChord({ letter: "A", accidental: 0 }, "minor", "none", "none");
    expect(chord.symbol).toBe("Am");
    const tones = toneMap(chord.tones);
    expect(tones["b3"]).toBe("C");
    expect(tones["5"]).toBe("E");
  });

  it("builds a C dominant 7 chord with b7 required", () => {
    const chord = buildChord({ letter: "C", accidental: 0 }, "major", "none", "7");
    expect(chord.symbol).toBe("C7");
    const seventh = chord.tones.find((t) => t.intervalLabel === "b7");
    expect(seventh?.noteName).toBe("Bb");
    expect(seventh?.required).toBe(true);
  });

  it("builds a Cmaj9 chord with 7 and 9 required, 5 optional", () => {
    const chord = buildChord({ letter: "C", accidental: 0 }, "major", "none", "maj9");
    expect(chord.symbol).toBe("Cmaj9");
    const fifth = chord.tones.find((t) => t.intervalLabel === "5");
    expect(fifth?.required).toBe(false);
    const ninth = chord.tones.find((t) => t.intervalLabel === "9");
    expect(ninth?.required).toBe(true);
    expect(ninth?.noteName).toBe("D");
  });

  it("builds a C13 chord with 9 and 11 optional but 13 and b7 required", () => {
    const chord = buildChord({ letter: "C", accidental: 0 }, "major", "none", "13");
    const byLabel = Object.fromEntries(chord.tones.map((t) => [t.intervalLabel, t.required]));
    expect(byLabel["b7"]).toBe(true);
    expect(byLabel["9"]).toBe(false);
    expect(byLabel["11"]).toBe(false);
    expect(byLabel["13"]).toBe(true);
  });

  it("builds Csus4 replacing the third", () => {
    const chord = buildChord({ letter: "C", accidental: 0 }, "major", "sus4", "none");
    expect(chord.symbol).toBe("Csus4");
    const tones = toneMap(chord.tones);
    expect(tones["4"]).toBe("F");
    expect(tones["3"]).toBeUndefined();
  });

  it("builds a diminished triad with required flat 5", () => {
    const chord = buildChord({ letter: "B", accidental: 0 }, "diminished", "none", "none");
    expect(chord.symbol).toBe("Bdim");
    const fifth = chord.tones.find((t) => t.intervalLabel === "b5");
    expect(fifth?.required).toBe(true);
    expect(fifth?.noteName).toBe("F");
  });

  it("builds a fully diminished 7th chord (bb7)", () => {
    const chord = buildChord({ letter: "B", accidental: 0 }, "diminished", "none", "dim7");
    expect(chord.symbol).toBe("Bdim");
    const seventh = chord.tones.find((t) => t.intervalLabel === "bb7");
    expect(seventh?.noteName).toBe("Ab");
  });

  it("builds a half-diminished chord (m7b5)", () => {
    const chord = buildChord({ letter: "B", accidental: 0 }, "diminished", "none", "7");
    expect(chord.symbol).toBe("Bm7b5");
  });

  it("builds an augmented triad with required sharp 5", () => {
    const chord = buildChord({ letter: "C", accidental: 0 }, "augmented", "none", "none");
    expect(chord.symbol).toBe("Caug");
    const fifth = chord.tones.find((t) => t.intervalLabel === "#5");
    expect(fifth?.required).toBe(true);
    expect(fifth?.noteName).toBe("G#");
  });
});
