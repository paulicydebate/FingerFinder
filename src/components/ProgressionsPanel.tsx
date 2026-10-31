import { useState } from "react";
import ChordSelector from "./ChordSelector";
import ChordFretboardDiagram from "./ChordFretboardDiagram";
import DegreeChords from "./DegreeChords";
import { buildChord, type Chord } from "../music/chords";
import type { Extension, Quality, Sus } from "../music/chordFormulas";
import { ROOT_OPTIONS, rootOptionKey, spellingToString, type NoteSpelling } from "../music/notes";
import { diatonicChords, SCALES, type DegreeChord } from "../music/scales";
import { playShape } from "../music/playback";
import type { Tuning } from "../music/tuning";
import { findVoicings } from "../music/voicings";

interface Props {
  tuning: Tuning;
}

interface ProgressionSlot {
  id: string;
  root: NoteSpelling;
  quality: Quality;
  sus: Sus;
  extension: Extension;
}

let nextSlotId = 0;
function makeSlot(letter: NoteSpelling["letter"], accidental: number, quality: Quality): ProgressionSlot {
  return { id: `slot-${nextSlotId++}`, root: { letter, accidental }, quality, sus: "none", extension: "none" };
}

// I-vi-IV-V in C: one of the most recognizable progressions there is, so the
// tab shows something playable the moment you land on it.
const DEFAULT_SLOTS: ProgressionSlot[] = [
  makeSlot("C", 0, "major"),
  makeSlot("A", 0, "minor"),
  makeSlot("F", 0, "major"),
  makeSlot("G", 0, "major"),
];

const PROGRESSION_STEP_MS = 1300;

export default function ProgressionsPanel({ tuning }: Props) {
  const [keyRoot, setKeyRoot] = useState<NoteSpelling>(ROOT_OPTIONS[0]);
  const [keyScaleId, setKeyScaleId] = useState(SCALES[0].id);
  const [freeRoot, setFreeRoot] = useState<NoteSpelling>(ROOT_OPTIONS[0]);
  const [freeQuality, setFreeQuality] = useState<Quality>("major");
  const [freeSus, setFreeSus] = useState<Sus>("none");
  const [freeExtension, setFreeExtension] = useState<Extension>("none");
  const [slots, setSlots] = useState<ProgressionSlot[]>(DEFAULT_SLOTS);

  const keyScale = SCALES.find((s) => s.id === keyScaleId) ?? SCALES[0];
  const keyDegreeChords = diatonicChords(keyRoot, keyScale);

  function addSlot(root: NoteSpelling, quality: Quality, sus: Sus, extension: Extension) {
    setSlots((prev) => [...prev, { id: `slot-${nextSlotId++}`, root, quality, sus, extension }]);
  }

  function addFromDegreeTriad(d: DegreeChord) {
    addSlot(d.triad.root, d.triad.quality, d.triad.sus, d.triad.extension);
  }

  function addFromDegreeSeventh(d: DegreeChord) {
    addSlot(d.seventh.root, d.seventh.quality, d.seventh.sus, d.seventh.extension);
  }

  function removeSlot(id: string) {
    setSlots((prev) => prev.filter((s) => s.id !== id));
  }

  function moveSlot(index: number, dir: -1 | 1) {
    setSlots((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  const built = slots.map((slot) => {
    const chord: Chord = buildChord(slot.root, slot.quality, slot.sus, slot.extension);
    const shape = findVoicings(chord, tuning)[0] ?? null;
    return { slot, chord, shape };
  });

  function playProgression() {
    built.forEach(({ shape }, i) => {
      if (!shape) return;
      setTimeout(() => playShape(shape.frets, tuning, "strum"), i * PROGRESSION_STEP_MS);
    });
  }

  return (
    <>
      <section className="ff-panel">
        <h2>Chord Progressions</h2>
        <p className="ff-muted-text">
          Pick a key to get its diatonic chords as one-click add buttons, or add any chord freely, then play the
          sequence back.
        </p>
      </section>

      <section className="ff-panel">
        <h3>Pick a key</h3>
        <div className="ff-advanced-row">
          <label>
            Root note
            <select
              value={rootOptionKey(keyRoot)}
              onChange={(e) => {
                const next = ROOT_OPTIONS.find((r) => rootOptionKey(r) === e.target.value)!;
                setKeyRoot(next);
              }}
            >
              {ROOT_OPTIONS.map((r) => (
                <option key={rootOptionKey(r)} value={rootOptionKey(r)}>
                  {spellingToString(r)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Scale
            <select value={keyScaleId} onChange={(e) => setKeyScaleId(e.target.value)}>
              {SCALES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {keyDegreeChords ? (
          <>
            <p className="ff-muted-text">Click a triad or 7th chord below to add it to your progression.</p>
            <DegreeChords
              degreeChords={keyDegreeChords}
              onPickTriad={addFromDegreeTriad}
              onPickSeventh={addFromDegreeSeventh}
            />
          </>
        ) : (
          <p className="ff-muted-text">This scale doesn't have standard diatonic chords - add chords freely below.</p>
        )}
      </section>

      <section className="ff-panel">
        <h3>Add any chord</h3>
        <ChordSelector
          root={freeRoot}
          quality={freeQuality}
          sus={freeSus}
          extension={freeExtension}
          onChange={(next) => {
            setFreeRoot(next.root);
            setFreeQuality(next.quality);
            setFreeSus(next.sus);
            setFreeExtension(next.extension);
          }}
        />
        <button
          type="button"
          className="ff-secondary-button"
          onClick={() => addSlot(freeRoot, freeQuality, freeSus, freeExtension)}
        >
          + Add {buildChord(freeRoot, freeQuality, freeSus, freeExtension).symbol} to progression
        </button>
      </section>

      <section className="ff-panel">
        <h2>Your progression</h2>
        {built.length === 0 ? (
          <p className="ff-muted-text">Nothing added yet - pick a chord above to get started.</p>
        ) : (
          <>
            <div className="ff-playback">
              <button type="button" className="ff-primary-button" onClick={playProgression}>
                ▶ Play progression
              </button>
            </div>
            <div className="ff-progression-row">
              {built.map(({ slot, chord, shape }, i) => (
                <div className="ff-progression-slot" key={slot.id}>
                  <div className="ff-progression-slot-header">
                    <span className="ff-progression-slot-number">
                      {i + 1}. {chord.symbol}
                    </span>
                    <div className="ff-progression-slot-controls">
                      <button
                        type="button"
                        onClick={() => moveSlot(i, -1)}
                        disabled={i === 0}
                        aria-label="Move earlier"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSlot(i, 1)}
                        disabled={i === built.length - 1}
                        aria-label="Move later"
                      >
                        ↓
                      </button>
                      <button type="button" onClick={() => removeSlot(slot.id)} aria-label="Remove">
                        ✕
                      </button>
                    </div>
                  </div>
                  {shape ? (
                    <ChordFretboardDiagram chord={chord} shape={shape} tuning={tuning} maxSpan={4} />
                  ) : (
                    <p className="ff-muted-text">No playable voicing found for this chord.</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}
