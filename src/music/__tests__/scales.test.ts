import { describe, expect, it } from "vitest";
import { buildChord } from "../chords";
import { diatonicChords, findScalesForChord, scaleTones, SCALES } from "../scales";

describe("scales", () => {
  it("spells C major scale tones correctly", () => {
    const majorScale = SCALES.find((s) => s.id === "major")!;
    const tones = scaleTones({ letter: "C", accidental: 0 }, majorScale);
    expect(tones.map((t) => t.noteName)).toEqual([
      "C",
      "D",
      "E",
      "F",
      "G",
      "A",
      "B",
    ]);
  });

  it("finds C major and C lydian for a Cmaj7 chord (same root)", () => {
    const chord = buildChord({ letter: "C", accidental: 0 }, "major", "none", "maj7");
    const matches = findScalesForChord(chord);
    const sameRootIds = matches.sameRoot.map((m) => m.scale.id);
    expect(sameRootIds).toContain("major");
    expect(sameRootIds).toContain("lydian");
    expect(sameRootIds).not.toContain("natural_minor");
  });

  it("finds mixolydian (not major) for a dominant 7 chord", () => {
    const chord = buildChord({ letter: "G", accidental: 0 }, "major", "none", "7");
    const matches = findScalesForChord(chord);
    const sameRootIds = matches.sameRoot.map((m) => m.scale.id);
    expect(sameRootIds).toContain("mixolydian");
    expect(sameRootIds).not.toContain("major");
  });

  it("finds an Am7 chord fitting inside C major at a different root", () => {
    const chord = buildChord({ letter: "A", accidental: 0 }, "minor", "none", "7");
    const matches = findScalesForChord(chord);
    const otherMatch = matches.otherRoots.find(
      (m) => m.scale.id === "major" && m.root.letter === "C" && m.root.accidental === 0,
    );
    expect(otherMatch).toBeDefined();
  });
});

describe("diatonicChords", () => {
  it("builds the 7 standard diatonic triads and 7th chords of C major", () => {
    const majorScale = SCALES.find((s) => s.id === "major")!;
    const chords = diatonicChords({ letter: "C", accidental: 0 }, majorScale)!;
    expect(chords).not.toBeNull();

    expect(chords.map((c) => c.numeral)).toEqual(["I", "ii", "iii", "IV", "V", "vi", "vii°"]);
    expect(chords.map((c) => c.triad.symbol)).toEqual(["C", "Dm", "Em", "F", "G", "Am", "Bdim"]);
    expect(chords.map((c) => c.seventh.symbol)).toEqual([
      "Cmaj7",
      "Dm7",
      "Em7",
      "Fmaj7",
      "G7",
      "Am7",
      "Bm7b5",
    ]);
  });

  it("builds A natural minor's diatonic triads", () => {
    const minorScale = SCALES.find((s) => s.id === "natural_minor")!;
    const chords = diatonicChords({ letter: "A", accidental: 0 }, minorScale)!;
    expect(chords.map((c) => c.triad.symbol)).toEqual(["Am", "Bdim", "C", "Dm", "Em", "F", "G"]);
  });

  it("gives A harmonic minor its hallmark augmented III and major V (dominant)", () => {
    const harmonicMinor = SCALES.find((s) => s.id === "harmonic_minor")!;
    const chords = diatonicChords({ letter: "A", accidental: 0 }, harmonicMinor)!;

    const third = chords.find((c) => c.degree === 3)!;
    expect(third.triad.symbol).toBe("Caug");
    expect(third.numeral).toBe("III+");

    const fifth = chords.find((c) => c.degree === 5)!;
    expect(fifth.triad.quality).toBe("major");
    expect(fifth.seventh.symbol).toBe("E7"); // the usable dominant harmonic minor is prized for

    const seventh = chords.find((c) => c.degree === 7)!;
    expect(seventh.seventh.symbol).toBe("G#dim7"); // fully-diminished 7th chord
  });

  it("returns null for scales that aren't 7 notes", () => {
    const pentatonic = SCALES.find((s) => s.id === "major_pentatonic")!;
    const blues = SCALES.find((s) => s.id === "blues")!;
    const dim = SCALES.find((s) => s.id === "dim_whole_half")!;
    const root = { letter: "C", accidental: 0 } as const;
    expect(diatonicChords(root, pentatonic)).toBeNull();
    expect(diatonicChords(root, blues)).toBeNull();
    expect(diatonicChords(root, dim)).toBeNull();
  });
});
