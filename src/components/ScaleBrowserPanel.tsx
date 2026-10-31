import { useState } from "react";
import { ROOT_OPTIONS, rootOptionKey, spellingToString, type NoteSpelling } from "../music/notes";
import { SCALES } from "../music/scales";
import type { Tuning } from "../music/tuning";
import ScaleDetail from "./ScaleDetail";

interface Props {
  tuning: Tuning;
}

export default function ScaleBrowserPanel({ tuning }: Props) {
  const [root, setRoot] = useState<NoteSpelling>(ROOT_OPTIONS[0]);
  const [scaleId, setScaleId] = useState(SCALES[0].id);

  const scale = SCALES.find((s) => s.id === scaleId) ?? SCALES[0];
  const displayName = `${spellingToString(root)} ${scale.name}`;

  return (
    <section className="ff-panel">
      <h2>Scales</h2>
      <p className="ff-muted-text">
        Browse any scale on its own - see it across the whole neck, hear it, and see the chords it's built from.
      </p>

      <div className="ff-advanced-row">
        <label>
          Root note
          <select
            value={rootOptionKey(root)}
            onChange={(e) => {
              const next = ROOT_OPTIONS.find((r) => rootOptionKey(r) === e.target.value)!;
              setRoot(next);
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
          <select value={scaleId} onChange={(e) => setScaleId(e.target.value)}>
            {SCALES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ScaleDetail root={root} scale={scale} displayName={displayName} tuning={tuning} />
    </section>
  );
}
