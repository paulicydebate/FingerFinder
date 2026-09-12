import { describe, expect, it } from "vitest";
import { buildChord } from "../chords";
import { findScalesForChord, scaleTones, SCALES } from "../scales";

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
