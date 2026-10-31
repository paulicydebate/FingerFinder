import { useMemo, useState } from "react";
import ChordSelector from "./ChordSelector";
import ChordFretboardDiagram from "./ChordFretboardDiagram";
import { buildChord } from "../music/chords";
import type { Extension, Quality, Sus } from "../music/chordFormulas";
import { ROOT_OPTIONS, type NoteSpelling } from "../music/notes";
import type { Tuning } from "../music/tuning";
import { playShape } from "../music/playback";
import { arpeggioStringRangeLabel, findSweepShapes } from "../music/arpeggios";

interface Props {
  tuning: Tuning;
}

const STRING_COUNT_OPTIONS = [3, 4, 5, 6];

export default function ArpeggioPanel({ tuning }: Props) {
  const [root, setRoot] = useState<NoteSpelling>(ROOT_OPTIONS[0]);
  const [quality, setQuality] = useState<Quality>("major");
  const [sus, setSus] = useState<Sus>("none");
  const [extension, setExtension] = useState<Extension>("none");
  const [numStrings, setNumStrings] = useState(3);
  const [maxSpan, setMaxSpan] = useState(6);
  const [shapeIndex, setShapeIndex] = useState(0);

  const chord = useMemo(() => buildChord(root, quality, sus, extension), [root, quality, sus, extension]);

  const shapes = useMemo(
    () => findSweepShapes(chord, tuning, numStrings, { maxFretSearch: 15, maxSpan }),
    [chord, tuning, numStrings, maxSpan],
  );

  const clampedIndex = shapes.length === 0 ? 0 : Math.min(shapeIndex, shapes.length - 1);
  const currentShape = shapes[clampedIndex] ?? null;

  return (
    <>
      <section className="ff-panel">
        <h2>Chord to sweep</h2>
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
        </div>
      </section>

      <section className="ff-panel">
        <div className="ff-advanced-row">
          <label>
            Strings to sweep
            <select value={numStrings} onChange={(e) => setNumStrings(Number(e.target.value))}>
              {STRING_COUNT_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} strings
                </option>
              ))}
            </select>
          </label>
          <label>
            Max fret spread
            <select value={maxSpan} onChange={(e) => setMaxSpan(Number(e.target.value))}>
              {[3, 4, 5, 6, 7, 8, 9].map((n) => (
                <option key={n} value={n}>
                  {n} frets
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="ff-panel">
        <h2>Sweep shapes</h2>
        {shapes.length === 0 ? (
          <p className="ff-muted-text">
            No {numStrings}-string sweep shape found for {chord.symbol} within that fret spread. Try widening the
            max fret spread above.
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
                {currentShape ? arpeggioStringRangeLabel(currentShape, tuning.length) : ""} — {clampedIndex + 1} of{" "}
                {shapes.length}
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
              <>
                <p className="ff-muted-text ff-centered-text">
                  Starts on the {chord.tones[currentShape.startToneIndex].intervalLabel} (low string), frets{" "}
                  {currentShape.minFret}-{currentShape.maxFret}. Play low to high for ascending, reverse for
                  descending.
                </p>
                <div className="ff-playback">
                  <button type="button" onClick={() => playShape(currentShape.frets, tuning, "arpeggio")}>
                    ▶ Play ascending
                  </button>
                </div>
                <div className="ff-diagram-wrap">
                  <ChordFretboardDiagram chord={chord} shape={currentShape} tuning={tuning} maxSpan={maxSpan} />
                  <div className="ff-shape-meta">
                    <span>{currentShape.soundingStrings} strings</span>
                    {currentShape.barreFret !== null && <span>roll finger at fret {currentShape.barreFret}</span>}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </section>
    </>
  );
}
