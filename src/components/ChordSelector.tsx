import {
  DIMINISHED_ONLY_EXTENSIONS,
  EXTENSION_OPTIONS,
  QUALITY_OPTIONS,
  SUS_OPTIONS,
  type Extension,
  type Quality,
  type Sus,
} from "../music/chordFormulas";
import { ROOT_OPTIONS, rootOptionKey, spellingToString, type NoteSpelling } from "../music/notes";

interface Props {
  root: NoteSpelling;
  quality: Quality;
  sus: Sus;
  extension: Extension;
  onChange: (next: { root: NoteSpelling; quality: Quality; sus: Sus; extension: Extension }) => void;
}

export default function ChordSelector({ root, quality, sus, extension, onChange }: Props) {
  const availableExtensions = EXTENSION_OPTIONS.filter(
    (opt) => quality === "diminished" || !DIMINISHED_ONLY_EXTENSIONS.includes(opt.value),
  );

  return (
    <div className="ff-chord-selector">
      <div className="ff-field">
        <label htmlFor="root-select">Root note</label>
        <select
          id="root-select"
          value={rootOptionKey(root)}
          onChange={(e) => {
            const next = ROOT_OPTIONS.find((r) => rootOptionKey(r) === e.target.value)!;
            onChange({ root: next, quality, sus, extension });
          }}
        >
          {ROOT_OPTIONS.map((r) => (
            <option key={rootOptionKey(r)} value={rootOptionKey(r)}>
              {spellingToString(r)}
            </option>
          ))}
        </select>
      </div>

      <div className="ff-field">
        <label htmlFor="quality-select">Quality</label>
        <select
          id="quality-select"
          value={quality}
          onChange={(e) => {
            const nextQuality = e.target.value as Quality;
            const nextExtension =
              nextQuality !== "diminished" && DIMINISHED_ONLY_EXTENSIONS.includes(extension)
                ? "none"
                : extension;
            onChange({ root, quality: nextQuality, sus, extension: nextExtension });
          }}
        >
          {QUALITY_OPTIONS.map((q) => (
            <option key={q.value} value={q.value}>
              {q.label}
            </option>
          ))}
        </select>
      </div>

      <div className="ff-field">
        <label htmlFor="sus-select">Suspension</label>
        <select
          id="sus-select"
          value={sus}
          onChange={(e) => onChange({ root, quality, sus: e.target.value as Sus, extension })}
        >
          {SUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="ff-field">
        <label htmlFor="extension-select">7th / added tone</label>
        <select
          id="extension-select"
          value={extension}
          onChange={(e) => onChange({ root, quality, sus, extension: e.target.value as Extension })}
        >
          {availableExtensions.map((ext) => (
            <option key={ext.value} value={ext.value}>
              {ext.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
