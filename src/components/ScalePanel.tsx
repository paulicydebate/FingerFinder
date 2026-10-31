import { useState } from "react";
import type { Chord } from "../music/chords";
import { diatonicChords, findScalesForChord, scaleTones, type ScaleMatch } from "../music/scales";
import { spellingToString } from "../music/notes";
import type { Tuning } from "../music/tuning";
import ScaleFretboardDiagram from "./ScaleFretboardDiagram";

interface Props {
  chord: Chord;
  tuning: Tuning;
}

function ScaleButton({ match, active, onClick }: { match: ScaleMatch; active: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`ff-scale-chip${active ? " ff-scale-chip-active" : ""}`} onClick={onClick}>
      {match.displayName}
    </button>
  );
}

export default function ScalePanel({ chord, tuning }: Props) {
  const matches = findScalesForChord(chord);
  const [selected, setSelected] = useState<ScaleMatch | null>(null);
  const degreeChords = selected ? diatonicChords(selected.root, selected.scale) : null;

  function key(m: ScaleMatch) {
    return `${spellingToString(m.root)}-${m.scale.id}`;
  }

  return (
    <div className="ff-scale-panel">
      <h3>Scales containing {chord.symbol}</h3>
      {matches.sameRoot.length === 0 && matches.otherRoots.length === 0 && (
        <p className="ff-muted-text">No scale in the library contains every tone of this chord.</p>
      )}

      {matches.sameRoot.length > 0 && (
        <div className="ff-scale-group">
          <h4>Same root ({chord.symbol.match(/^[A-G][#b]?/)?.[0]})</h4>
          <div className="ff-scale-chip-row">
            {matches.sameRoot.map((m) => (
              <ScaleButton
                key={key(m)}
                match={m}
                active={selected !== null && key(selected) === key(m)}
                onClick={() => setSelected(selected && key(selected) === key(m) ? null : m)}
              />
            ))}
          </div>
        </div>
      )}

      {matches.otherRoots.length > 0 && (
        <div className="ff-scale-group">
          <h4>Also found in (different root)</h4>
          <div className="ff-scale-chip-row">
            {matches.otherRoots.map((m) => (
              <ScaleButton
                key={key(m)}
                match={m}
                active={selected !== null && key(selected) === key(m)}
                onClick={() => setSelected(selected && key(selected) === key(m) ? null : m)}
              />
            ))}
          </div>
        </div>
      )}

      {selected && (
        <div className="ff-scale-view">
          <h4>{selected.displayName} across the fretboard</h4>
          <ScaleFretboardDiagram tones={scaleTones(selected.root, selected.scale)} tuning={tuning} />

          {degreeChords && (
            <div className="ff-degree-chords">
              <h4>Chords on each degree</h4>
              <div className="ff-degree-chord-row">
                {degreeChords.map((d) => (
                  <div className="ff-degree-chord" key={d.degree}>
                    <span className="ff-degree-chord-numeral">{d.numeral}</span>
                    <span className="ff-degree-chord-symbol">{d.triad.symbol}</span>
                    <span className="ff-degree-chord-seventh">{d.seventh.symbol}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
