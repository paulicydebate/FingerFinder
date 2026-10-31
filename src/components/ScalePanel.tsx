import { useState } from "react";
import type { Chord } from "../music/chords";
import { findScalesForChord, type ScaleMatch } from "../music/scales";
import { spellingToString } from "../music/notes";
import type { Tuning } from "../music/tuning";
import ScaleDetail from "./ScaleDetail";

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
        <ScaleDetail root={selected.root} scale={selected.scale} displayName={selected.displayName} tuning={tuning} />
      )}
    </div>
  );
}
