import type { DegreeChord } from "../music/scales";

interface Props {
  degreeChords: DegreeChord[] | null;
  /** When provided, the triad/7th symbols become clickable "add to progression" buttons. */
  onPickTriad?: (d: DegreeChord) => void;
  onPickSeventh?: (d: DegreeChord) => void;
}

/**
 * The chord built on each degree of a scale (I, ii, iii, ...). Shared by the
 * read-only scale views (Chord Finder / Reverse Lookup / Scale Browser) and
 * the Progressions tab, where the symbols double as "add this chord" buttons.
 */
export default function DegreeChords({ degreeChords, onPickTriad, onPickSeventh }: Props) {
  if (!degreeChords) return null;

  return (
    <div className="ff-degree-chords">
      <h4>Chords on each degree</h4>
      <div className="ff-degree-chord-row">
        {degreeChords.map((d) => (
          <div className="ff-degree-chord" key={d.degree}>
            <span className="ff-degree-chord-numeral">{d.numeral}</span>
            {onPickTriad ? (
              <button type="button" className="ff-degree-chord-pick" onClick={() => onPickTriad(d)}>
                {d.triad.symbol}
              </button>
            ) : (
              <span className="ff-degree-chord-symbol">{d.triad.symbol}</span>
            )}
            {onPickSeventh ? (
              <button
                type="button"
                className="ff-degree-chord-pick ff-degree-chord-pick-seventh"
                onClick={() => onPickSeventh(d)}
              >
                {d.seventh.symbol}
              </button>
            ) : (
              <span className="ff-degree-chord-seventh">{d.seventh.symbol}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
