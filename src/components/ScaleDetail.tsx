import { diatonicChords, scaleTones, type ScaleDef } from "../music/scales";
import { pitchClass, type NoteSpelling } from "../music/notes";
import { playScale } from "../music/playback";
import type { Tuning } from "../music/tuning";
import ScaleFretboardDiagram from "./ScaleFretboardDiagram";
import DegreeChords from "./DegreeChords";

interface Props {
  root: NoteSpelling;
  scale: ScaleDef;
  displayName: string;
  tuning: Tuning;
}

/** A scale's notes mapped across the fretboard, an audible reference run, and its diatonic chords. */
export default function ScaleDetail({ root, scale, displayName, tuning }: Props) {
  const tones = scaleTones(root, scale);
  const degreeChords = diatonicChords(root, scale);

  return (
    <div className="ff-scale-view">
      <h4>{displayName} across the fretboard</h4>
      <div className="ff-playback">
        <button type="button" onClick={() => playScale(pitchClass(root), scale.semitones)}>
          ▶ Play scale
        </button>
      </div>
      <ScaleFretboardDiagram tones={tones} tuning={tuning} />
      <DegreeChords degreeChords={degreeChords} />
    </div>
  );
}
