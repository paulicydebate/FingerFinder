import type { ScaleTone } from "../music/scales";
import { mod12, midiToName } from "../music/notes";
import type { Tuning } from "../music/tuning";

interface Props {
  tones: ScaleTone[];
  tuning: Tuning;
  numFrets?: number;
}

const FRET_WIDTH = 46;
const LEFT_MARGIN = 56;
const TOP_MARGIN = 26;
const STRING_GAP = 34;
const DOT_RADIUS = 13;

export default function ScaleFretboardDiagram({ tones, tuning, numFrets = 15 }: Props) {
  const pcToTone = new Map(tones.map((t) => [t.pitchClass, t]));
  const numStrings = tuning.length;

  const width = LEFT_MARGIN + FRET_WIDTH * numFrets + 20;
  const height = TOP_MARGIN + STRING_GAP * (numStrings - 1) + 30;

  const fretX = (fret: number) => LEFT_MARGIN + fret * FRET_WIDTH;
  // low string (index 0) drawn at the bottom, high string at the top.
  const stringY = (s: number) => TOP_MARGIN + (numStrings - 1 - s) * STRING_GAP;

  const markerFrets = [3, 5, 7, 9, 12, 15];

  return (
    <div className="ff-scale-fretboard-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-label="Scale mapped across the fretboard">
        {/* fret markers */}
        {markerFrets
          .filter((f) => f <= numFrets)
          .map((f) => (
            <text
              key={`marker-${f}`}
              x={fretX(f) - FRET_WIDTH / 2}
              y={height - 6}
              fontSize={10}
              textAnchor="middle"
              opacity={0.55}
              className="ff-label"
            >
              {f}
            </text>
          ))}

        {/* nut */}
        <line x1={fretX(0)} y1={stringY(numStrings - 1)} x2={fretX(0)} y2={stringY(0)} stroke="currentColor" strokeWidth={5} />

        {/* frets */}
        {Array.from({ length: numFrets }).map((_, i) => (
          <line
            key={`f-${i}`}
            x1={fretX(i + 1)}
            y1={stringY(numStrings - 1)}
            x2={fretX(i + 1)}
            y2={stringY(0)}
            stroke="currentColor"
            strokeWidth={1}
            opacity={0.5}
          />
        ))}

        {/* strings */}
        {tuning.map((_, s) => (
          <line
            key={`s-${s}`}
            x1={fretX(0)}
            y1={stringY(s)}
            x2={fretX(numFrets)}
            y2={stringY(s)}
            stroke="currentColor"
            strokeWidth={1.25}
            opacity={0.85}
          />
        ))}

        {/* open string names */}
        {tuning.map((midi, s) => (
          <text
            key={`open-${s}`}
            x={fretX(0) - 14}
            y={stringY(s) + 4}
            fontSize={11}
            textAnchor="end"
            className="ff-label"
          >
            {midiToName(midi).replace(/[0-9-]+$/, "")}
          </text>
        ))}

        {/* dots */}
        {tuning.map((openMidi, s) =>
          Array.from({ length: numFrets + 1 }).map((_, fret) => {
            const pc = mod12(openMidi + fret);
            const tone = pcToTone.get(pc);
            if (!tone) return null;
            const cx = fret === 0 ? fretX(0) - 24 : fretX(fret) - FRET_WIDTH / 2;
            const cy = stringY(s);
            const isRoot = tone.degreeLabel === "R";
            return (
              <g key={`dot-${s}-${fret}`}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={DOT_RADIUS}
                  className={isRoot ? "ff-dot-root" : "ff-dot-scale"}
                />
                <text x={cx} y={cy + 4} fontSize={10} fontWeight={600} textAnchor="middle" className="ff-dot-text">
                  {tone.noteName}
                </text>
              </g>
            );
          }),
        )}
      </svg>
    </div>
  );
}
