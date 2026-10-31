import { useMemo, useState } from "react";
import FretInputGrid from "./FretInputGrid";
import ChordFretboardDiagram from "./ChordFretboardDiagram";
import { identifyChord, shapeFromFrets } from "../music/reverseLookup";
import { findVoicings, positionLabel } from "../music/voicings";
import { playShape } from "../music/playback";
import type { Tuning } from "../music/tuning";

interface Props {
  tuning: Tuning;
}

export default function ReverseLookupPanel({ tuning }: Props) {
  const [frets, setFrets] = useState<(number | null)[]>([null, 3, 2, 0, 1, 0]);
  const [matchIndex, setMatchIndex] = useState(0);
  const [altIndex, setAltIndex] = useState(0);

  const matches = useMemo(() => identifyChord(frets, tuning), [frets, tuning]);
  const clampedMatchIndex = matches.length === 0 ? 0 : Math.min(matchIndex, matches.length - 1);
  const selected = matches[clampedMatchIndex] ?? null;

  const enteredShape = useMemo(
    () => (selected ? shapeFromFrets(selected.chord, frets, tuning) : null),
    [selected, frets, tuning],
  );

  const altShapes = useMemo(
    () => (selected ? findVoicings(selected.chord, tuning) : []),
    [selected, tuning],
  );
  const clampedAltIndex = altShapes.length === 0 ? 0 : Math.min(altIndex, altShapes.length - 1);
  const currentAlt = altShapes[clampedAltIndex] ?? null;

  const soundingCount = frets.filter((f) => f !== null).length;

  return (
    <>
      <section className="ff-panel">
        <h2>What chord is this?</h2>
        <p className="ff-muted-text">
          Enter the fret you played on each string (or leave it muted/open), and we'll tell you what chord it is.
        </p>
        <FretInputGrid tuning={tuning} frets={frets} onChange={setFrets} />
      </section>

      <section className="ff-panel">
        {soundingCount < 2 ? (
          <p className="ff-muted-text">Enter at least two sounding strings to identify a chord.</p>
        ) : matches.length === 0 ? (
          <p className="ff-muted-text">
            No chord in our library matches that exact set of notes — try adjusting a string.
          </p>
        ) : (
          <>
            <div className="ff-chord-summary">
              <span className="ff-chord-symbol">{selected!.chord.symbol}</span>
              <div className="ff-tone-list">
                {selected!.chord.tones.map((t) => (
                  <span
                    key={t.intervalId}
                    className={`ff-tone-chip${t.required ? "" : " ff-tone-chip-optional"}`}
                  >
                    {t.noteName} <small>({t.intervalLabel})</small>
                  </span>
                ))}
              </div>
              {selected!.bassIsRoot && <span className="ff-muted-text">Root note in the bass.</span>}
            </div>

            {matches.length > 1 && (
              <div className="ff-scale-group">
                <h4>Could also be read as</h4>
                <div className="ff-scale-chip-row">
                  {matches.map((m, i) => (
                    <button
                      key={m.chord.symbol + i}
                      type="button"
                      className={`ff-scale-chip${i === clampedMatchIndex ? " ff-scale-chip-active" : ""}`}
                      onClick={() => {
                        setMatchIndex(i);
                        setAltIndex(0);
                      }}
                    >
                      {m.chord.symbol}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {enteredShape && (
              <div className="ff-diagram-wrap">
                <h4>What you entered</h4>
                <div className="ff-playback">
                  <button type="button" onClick={() => playShape(enteredShape.frets, tuning, "strum")}>
                    ▶ Strum
                  </button>
                  <button type="button" onClick={() => playShape(enteredShape.frets, tuning, "arpeggio")}>
                    ▶ Arpeggio
                  </button>
                </div>
                <ChordFretboardDiagram
                  chord={selected!.chord}
                  shape={enteredShape}
                  tuning={tuning}
                  maxSpan={Math.max(4, enteredShape.maxFret - enteredShape.minFret)}
                />
                <div className="ff-shape-meta">
                  <span>{enteredShape.soundingStrings} strings</span>
                  <span>
                    {enteredShape.fingerCount} finger{enteredShape.fingerCount === 1 ? "" : "s"}
                  </span>
                  {enteredShape.barreFret !== null && <span>barre at fret {enteredShape.barreFret}</span>}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {selected && altShapes.length > 0 && (
        <section className="ff-panel">
          <h2>Alternative fingerings for {selected.chord.symbol}</h2>
          <div className="ff-position-nav">
            <button
              type="button"
              onClick={() => setAltIndex(Math.max(0, clampedAltIndex - 1))}
              disabled={clampedAltIndex === 0}
            >
              ← Prev
            </button>
            <span className="ff-position-label">
              {currentAlt ? positionLabel(currentAlt) : ""} — {clampedAltIndex + 1} of {altShapes.length}
            </span>
            <button
              type="button"
              onClick={() => setAltIndex(Math.min(altShapes.length - 1, clampedAltIndex + 1))}
              disabled={clampedAltIndex === altShapes.length - 1}
            >
              Next →
            </button>
          </div>
          {currentAlt && (
            <div className="ff-diagram-wrap">
              <div className="ff-playback">
                <button type="button" onClick={() => playShape(currentAlt.frets, tuning, "strum")}>
                  ▶ Strum
                </button>
                <button type="button" onClick={() => playShape(currentAlt.frets, tuning, "arpeggio")}>
                  ▶ Arpeggio
                </button>
              </div>
              <ChordFretboardDiagram chord={selected.chord} shape={currentAlt} tuning={tuning} maxSpan={4} />
              <div className="ff-shape-meta">
                <span>{currentAlt.soundingStrings} strings</span>
                <span>
                  {currentAlt.fingerCount} finger{currentAlt.fingerCount === 1 ? "" : "s"}
                </span>
                {currentAlt.barreFret !== null && <span>barre at fret {currentAlt.barreFret}</span>}
              </div>
            </div>
          )}
        </section>
      )}
    </>
  );
}
