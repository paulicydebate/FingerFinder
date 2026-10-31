import { describe, expect, it } from "vitest";
import {
  clampBpm,
  cycleAccent,
  defaultAccents,
  MetronomeScheduler,
  registerTap,
  resizeAccents,
  type MetronomeSettings,
} from "../metronome";

function settings(overrides: Partial<MetronomeSettings> = {}): MetronomeSettings {
  return {
    bpm: 120,
    beatsPerMeasure: 4,
    subdivision: 1,
    accents: defaultAccents(4),
    ...overrides,
  };
}

describe("MetronomeScheduler", () => {
  it("spaces quarter-note clicks 60/bpm seconds apart and cycles beats", () => {
    const s = new MetronomeScheduler(settings({ bpm: 120 }), 0);
    const events = s.advanceUntil(2.0);
    expect(events.map((e) => e.time)).toEqual([0, 0.5, 1.0, 1.5]);
    expect(events.map((e) => e.beatIndex)).toEqual([0, 1, 2, 3]);
    expect(events.every((e) => e.isBeat)).toBe(true);
    expect(events.map((e) => e.accent)).toEqual(["accent", "normal", "normal", "normal"]);
  });

  it("subdivides each beat evenly and marks only the downbeat of each as isBeat", () => {
    const s = new MetronomeScheduler(settings({ bpm: 60, subdivision: 2 }), 0);
    const events = s.advanceUntil(2.0);
    expect(events.map((e) => e.time)).toEqual([0, 0.5, 1.0, 1.5]);
    expect(events.map((e) => e.isBeat)).toEqual([true, false, true, false]);
    // beat 0 is accented on its downbeat, but the subdivision tick within it is just a normal tick
    expect(events[0].accent).toBe("accent");
    expect(events[1].accent).toBe("normal");
  });

  it("spaces triplet subdivisions a third of a beat apart", () => {
    const s = new MetronomeScheduler(settings({ bpm: 60, subdivision: 3 }), 0);
    const events = s.advanceUntil(1.0);
    expect(events).toHaveLength(3);
    expect(events[1].time).toBeCloseTo(1 / 3, 10);
    expect(events[2].time).toBeCloseTo(2 / 3, 10);
  });

  it("silences every subdivision within a beat marked silent", () => {
    const s = new MetronomeScheduler(
      settings({ bpm: 60, subdivision: 2, accents: ["accent", "silent", "normal", "normal"] }),
      0,
    );
    const events = s.advanceUntil(2.0);
    const beat1Events = events.filter((e) => e.beatIndex === 1);
    expect(beat1Events).toHaveLength(2);
    expect(beat1Events.every((e) => e.accent === "silent")).toBe(true);
  });

  it("produces the same events whether advanced in one call or several", () => {
    const a = new MetronomeScheduler(settings({ bpm: 90, subdivision: 2 }), 0);
    const onePass = a.advanceUntil(3.0);

    const b = new MetronomeScheduler(settings({ bpm: 90, subdivision: 2 }), 0);
    const twoPass = [...b.advanceUntil(1.2), ...b.advanceUntil(3.0)];

    expect(twoPass).toEqual(onePass);
  });

  it("applies a tempo change smoothly from the current position onward", () => {
    const s = new MetronomeScheduler(settings({ bpm: 120 }), 0);
    const before = s.advanceUntil(1.1); // clicks at 0, 0.5, 1.0
    expect(before.map((e) => e.time)).toEqual([0, 0.5, 1.0]);

    s.updateSettings(settings({ bpm: 60 })); // spacing becomes 1.0s from here on
    const after = s.advanceUntil(3.0);
    expect(after.map((e) => e.time)).toEqual([1.5, 2.5]);
  });
});

describe("accent helpers", () => {
  it("cycles accent -> normal -> silent -> accent", () => {
    expect(cycleAccent("accent")).toBe("normal");
    expect(cycleAccent("normal")).toBe("silent");
    expect(cycleAccent("silent")).toBe("accent");
  });

  it("resizes an accent pattern, preserving existing choices", () => {
    const grown = resizeAccents(["accent", "silent", "normal"], 5);
    expect(grown).toEqual(["accent", "silent", "normal", "normal", "normal"]);

    const shrunk = resizeAccents(["accent", "silent", "normal", "normal"], 2);
    expect(shrunk).toEqual(["accent", "silent"]);
  });
});

describe("clampBpm", () => {
  it("clamps to the supported range and rounds", () => {
    expect(clampBpm(5)).toBe(20);
    expect(clampBpm(1000)).toBe(300);
    expect(clampBpm(100.6)).toBe(101);
  });
});

describe("registerTap", () => {
  it("computes bpm from the average interval between recent taps", () => {
    let state = registerTap([], 0);
    expect(state.bpm).toBeNull();
    state = registerTap(state.taps, 500);
    expect(state.bpm).toBe(120);
    state = registerTap(state.taps, 1000);
    expect(state.bpm).toBe(120);
  });

  it("resets the sequence after a long gap", () => {
    let state = registerTap([], 0);
    state = registerTap(state.taps, 400); // 150 bpm-ish pace established
    expect(state.taps).toHaveLength(2);
    state = registerTap(state.taps, 5000); // long pause
    expect(state.taps).toEqual([5000]);
    expect(state.bpm).toBeNull();
  });

  it("only keeps the most recent maxTaps taps", () => {
    let state = { taps: [] as number[], bpm: null as number | null };
    for (let i = 0; i < 10; i++) {
      state = registerTap(state.taps, i * 500, 8);
    }
    expect(state.taps).toHaveLength(8);
  });
});
