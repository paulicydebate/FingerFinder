import { CHROMATIC_SHARP, mod12 } from "../music/notes";
import { STANDARD_TUNING, TUNING_PRESETS, type Tuning } from "../music/tuning";

interface Props {
  tuning: Tuning;
  onChange: (tuning: Tuning) => void;
}

const OCTAVE_MIN = 1;
const OCTAVE_MAX = 6;

// Guitarists number strings 1 (high e) to 6 (low E); our tuning array is
// stored low-to-high, so string index 0 is "6th string".
function stringLabel(index: number, total: number): string {
  const guitarNumber = total - index;
  return `${guitarNumber}${ordinal(guitarNumber)} string`;
}

function ordinal(n: number): string {
  if (n % 10 === 1 && n !== 11) return "st";
  if (n % 10 === 2 && n !== 12) return "nd";
  if (n % 10 === 3 && n !== 13) return "rd";
  return "th";
}

export default function TuningEditor({ tuning, onChange }: Props) {
  function setStringMidi(index: number, midi: number) {
    const next = [...tuning];
    next[index] = midi;
    onChange(next);
  }

  return (
    <div className="ff-tuning-editor">
      <div className="ff-field">
        <label htmlFor="tuning-preset">Preset</label>
        <select
          id="tuning-preset"
          onChange={(e) => {
            const preset = TUNING_PRESETS.find((p) => p.name === e.target.value);
            if (preset) onChange([...preset.tuning]);
          }}
          value={TUNING_PRESETS.find((p) => p.tuning.join(",") === tuning.join(","))?.name ?? "Custom"}
        >
          {TUNING_PRESETS.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name}
            </option>
          ))}
          <option value="Custom" disabled>
            Custom
          </option>
        </select>
        <button
          type="button"
          className="ff-secondary-button"
          onClick={() => onChange([...STANDARD_TUNING])}
        >
          Reset to standard
        </button>
      </div>

      <div className="ff-tuning-strings">
        {tuning.map((midi, i) => {
          const pc = mod12(midi);
          const octave = Math.floor(midi / 12) - 1;
          return (
            <div className="ff-tuning-string" key={i}>
              <span className="ff-label">{stringLabel(i, tuning.length)}</span>
              <select
                aria-label={`${stringLabel(i, tuning.length)} pitch class`}
                value={pc}
                onChange={(e) => setStringMidi(i, octave * 12 + 12 + Number(e.target.value))}
              >
                {CHROMATIC_SHARP.map((name, idx) => (
                  <option key={name} value={idx}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                aria-label={`${stringLabel(i, tuning.length)} octave`}
                value={octave}
                onChange={(e) => setStringMidi(i, Number(e.target.value) * 12 + 12 + pc)}
              >
                {Array.from({ length: OCTAVE_MAX - OCTAVE_MIN + 1 }).map((_, k) => {
                  const oct = OCTAVE_MIN + k;
                  return (
                    <option key={oct} value={oct}>
                      {oct}
                    </option>
                  );
                })}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}
