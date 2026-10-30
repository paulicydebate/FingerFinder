import { describe, expect, it } from "vitest";
import { midiToFrequency, noteOffsets, shapeToFrequencies, shapeToMidiNotes } from "../playback";
import { STANDARD_TUNING } from "../tuning";

describe("playback math", () => {
  it("converts MIDI to Hz", () => {
    expect(midiToFrequency(69)).toBeCloseTo(440);
    expect(midiToFrequency(40)).toBeCloseTo(82.41, 1); // low E2
  });

  it("maps an open C shape (x32010) with correct octaves, skipping muted", () => {
    expect(shapeToMidiNotes([null, 3, 2, 0, 1, 0], STANDARD_TUNING)).toEqual([48, 52, 55, 60, 64]);
    expect(shapeToFrequencies([null, 3, 2, 0, 1, 0], STANDARD_TUNING)[0]).toBeCloseTo(130.81, 1);
  });

  it("respects custom tunings", () => {
    const dropD = [38, 45, 50, 55, 59, 64];
    expect(shapeToMidiNotes([0, 0, 0, 2, 3, 2], dropD)).toEqual([38, 45, 50, 57, 62, 66]);
  });

  it("staggers strum and arpeggio offsets", () => {
    expect(noteOffsets(3, "strum")).toEqual([0, 0.03, 0.06]);
    expect(noteOffsets(3, "arpeggio")).toEqual([0, 0.25, 0.5]);
  });
});
