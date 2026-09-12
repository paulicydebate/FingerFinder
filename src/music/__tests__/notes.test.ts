import { describe, expect, it } from "vitest";
import { pitchClass, spellFromRoot, spellingToString } from "../notes";

describe("notes", () => {
  it("computes pitch classes for naturals and accidentals", () => {
    expect(pitchClass({ letter: "C", accidental: 0 })).toBe(0);
    expect(pitchClass({ letter: "C", accidental: 1 })).toBe(1);
    expect(pitchClass({ letter: "D", accidental: -1 })).toBe(1);
    expect(pitchClass({ letter: "B", accidental: 0 })).toBe(11);
    expect(pitchClass({ letter: "B", accidental: 1 })).toBe(0);
  });

  it("spells a minor 3rd above C as Eb, not D#", () => {
    const spelled = spellFromRoot({ letter: "C", accidental: 0 }, 2, 3);
    expect(spellingToString(spelled)).toBe("Eb");
  });

  it("spells a major 3rd above C as E", () => {
    const spelled = spellFromRoot({ letter: "C", accidental: 0 }, 2, 4);
    expect(spellingToString(spelled)).toBe("E");
  });

  it("spells a major 3rd above F# as A#, not Bb", () => {
    const spelled = spellFromRoot({ letter: "F", accidental: 1 }, 2, 4);
    expect(spellingToString(spelled)).toBe("A#");
  });

  it("spells a perfect 5th above F as C", () => {
    const spelled = spellFromRoot({ letter: "F", accidental: 0 }, 4, 7);
    expect(spellingToString(spelled)).toBe("C");
  });

  it("spells a flat 5th above C as Gb", () => {
    const spelled = spellFromRoot({ letter: "C", accidental: 0 }, 4, 6);
    expect(spellingToString(spelled)).toBe("Gb");
  });

  it("spells a diminished 7th (bb7) above C as Bbb", () => {
    const spelled = spellFromRoot({ letter: "C", accidental: 0 }, 6, 9);
    expect(spellingToString(spelled)).toBe("Bbb");
  });
});
