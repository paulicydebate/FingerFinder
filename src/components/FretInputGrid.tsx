import { guitarStringLabel } from "../music/tuning";
import { midiToName } from "../music/notes";
import type { Tuning } from "../music/tuning";

interface Props {
  tuning: Tuning;
  frets: (number | null)[];
  onChange: (frets: (number | null)[]) => void;
  maxFret?: number;
}

const MUTED = "x";

/** Per-string fret entry: muted (X), open (0), or a fretted note. */
export default function FretInputGrid({ tuning, frets, onChange, maxFret = 15 }: Props) {
  function setFret(index: number, value: string) {
    const next = [...frets];
    next[index] = value === MUTED ? null : Number(value);
    onChange(next);
  }

  return (
    <div className="ff-fret-input-grid">
      {tuning.map((openMidi, i) => {
        const fret = frets[i];
        return (
          <div className="ff-fret-input-string" key={i}>
            <span className="ff-label">{guitarStringLabel(i, tuning.length)}</span>
            <span className="ff-fret-input-open-note">{midiToName(openMidi).replace(/[0-9-]+$/, "")}</span>
            <select
              aria-label={`${guitarStringLabel(i, tuning.length)} fret`}
              value={fret === null ? MUTED : String(fret)}
              onChange={(e) => setFret(i, e.target.value)}
            >
              <option value={MUTED}>X (muted)</option>
              <option value="0">Open</option>
              {Array.from({ length: maxFret }).map((_, f) => (
                <option key={f + 1} value={f + 1}>
                  Fret {f + 1}
                </option>
              ))}
            </select>
          </div>
        );
      })}
    </div>
  );
}
