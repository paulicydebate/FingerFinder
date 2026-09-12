import { useMemo, useState } from "react";
import "./App.css";
import ChordSelector from "./components/ChordSelector";
import TuningEditor from "./components/TuningEditor";
import ChordFretboardDiagram from "./components/ChordFretboardDiagram";
import ScalePanel from "./components/ScalePanel";
import { buildChord } from "./music/chords";
import type { Extension, Quality, Sus } from "./music/chordFormulas";
import { ROOT_OPTIONS, type NoteSpelling } from "./music/notes";
import { STANDARD_TUNING, type Tuning } from "./music/tuning";
import { DEFAULT_VOICING_OPTIONS, findVoicings, positionLabel, type VoicingOptions } from "./music/voicings";

export default function App() {
  const [root, setRoot] = useState<NoteSpelling>(ROOT_OPTIONS[0]);
  const [quality, setQuality] = useState<Quality>("major");
  const [sus, setSus] = useState<Sus>("none");
  const [extension, setExtension] = useState<Extension>("none");
  const [tuning, setTuning] = useState<Tuning>([...STANDARD_TUNING]);
  const [shapeIndex, setShapeIndex] = useState(0);
  const [maxFingers, setMaxFingers] = useState(DEFAULT_VOICING_OPTIONS.maxFingers);
  const [maxSpan, setMaxSpan] = useState(DEFAULT_VOICING_OPTIONS.maxSpan);

  const chord = useMemo(() => buildChord(root, quality, sus, extension), [root, quality, sus, extension]);

  const voicingOptions: VoicingOptions = useMemo(
    () => ({ ...DEFAULT_VOICING_OPTIONS, maxFingers, maxSpan }),
    [maxFingers, maxSpan],
  );

  const shapes = useMemo(
    () => findVoicings(chord, tuning, voicingOptions),
    [chord, tuning, voicingOptions],
  );

  // Clamp instead of resetting via effect: whenever the chord/tuning/limits
  // change and shrink the shape list, fall back to the last valid index
  // without an extra render pass.
  const clampedIndex = shapes.length === 0 ? 0 : Math.min(shapeIndex, shapes.length - 1);
  const currentShape = shapes[clampedIndex] ?? null;

  return (
    <div className="ff-app">
      <header className="ff-header">
        <h1>FingerFinder</h1>
        <p className="ff-tagline">Build a chord, find every way to play it.</p>
      </header>

      <section className="ff-panel">
        <h2>Chord</h2>
        <ChordSelector
          root={root}
          quality={quality}
          sus={sus}
          extension={extension}
          onChange={(next) => {
            setRoot(next.root);
            setQuality(next.quality);
            setSus(next.sus);
            setExtension(next.extension);
          }}
        />
        <div className="ff-chord-summary">
          <span className="ff-chord-symbol">{chord.symbol}</span>
          <div className="ff-tone-list">
            {chord.tones.map((t) => (
              <span key={t.intervalId} className={`ff-tone-chip${t.required ? "" : " ff-tone-chip-optional"}`}>
                {t.noteName} <small>({t.intervalLabel})</small>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="ff-panel">
        <h2>Tuning</h2>
        <TuningEditor tuning={tuning} onChange={setTuning} />
      </section>

      <section className="ff-panel">
        <div className="ff-advanced-row">
          <label>
            Max fret stretch
            <select value={maxSpan} onChange={(e) => setMaxSpan(Number(e.target.value))}>
              {[2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} frets
                </option>
              ))}
            </select>
          </label>
          <label>
            Max fingers
            <select value={maxFingers} onChange={(e) => setMaxFingers(Number(e.target.value))}>
              {[2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="ff-panel">
        <h2>Positions on the fretboard</h2>
        {shapes.length === 0 ? (
          <p className="ff-muted-text">
            No playable voicing found within the current stretch/finger limits. Try loosening the constraints above.
          </p>
        ) : (
          <>
            <div className="ff-position-nav">
              <button
                type="button"
                onClick={() => setShapeIndex(Math.max(0, clampedIndex - 1))}
                disabled={clampedIndex === 0}
              >
                ← Prev
              </button>
              <span className="ff-position-label">
                {currentShape ? positionLabel(currentShape) : ""} — {clampedIndex + 1} of {shapes.length}
              </span>
              <button
                type="button"
                onClick={() => setShapeIndex(Math.min(shapes.length - 1, clampedIndex + 1))}
                disabled={clampedIndex === shapes.length - 1}
              >
                Next →
              </button>
            </div>
            {currentShape && (
              <div className="ff-diagram-wrap">
                <ChordFretboardDiagram chord={chord} shape={currentShape} tuning={tuning} maxSpan={maxSpan} />
                <div className="ff-shape-meta">
                  <span>{currentShape.soundingStrings} strings</span>
                  <span>{currentShape.fingerCount} finger{currentShape.fingerCount === 1 ? "" : "s"}</span>
                  {currentShape.barreFret !== null && <span>barre at fret {currentShape.barreFret}</span>}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <section className="ff-panel">
        <ScalePanel chord={chord} tuning={tuning} />
      </section>
    </div>
  );
}
