import type { Chord } from "../music/chords";
import type { ChordShape } from "../music/voicings";
import type { Tuning } from "../music/tuning";
import { midiToName } from "../music/notes";

interface Props {
  chord: Chord;
  shape: ChordShape;
  tuning: Tuning;
  maxSpan: number;
}

const STRING_GAP = 38;
const LEFT_MARGIN = 46;
const TOP_MARGIN = 46;
const FRET_HEIGHT = 46;
const DOT_RADIUS = 15;

export default function ChordFretboardDiagram({ chord, shape, tuning, maxSpan }: Props) {
  const numStrings = tuning.length;
  const numFretsShown = Math.max(maxSpan + 1, 5);
  const startFret = shape.minFret > 0 ? shape.minFret : 1;
  const showNut = startFret === 1;

  const width = LEFT_MARGIN + STRING_GAP * (numStrings - 1) + 40;
  const height = TOP_MARGIN + FRET_HEIGHT * numFretsShown + 20;

  const stringX = (s: number) => LEFT_MARGIN + s * STRING_GAP;
  const fretY = (fretRow: number) => TOP_MARGIN + fretRow * FRET_HEIGHT;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label={`Fretboard diagram for ${chord.symbol}`}
    >
      {/* position label when not at the nut */}
      {!showNut && (
        <text
          x={LEFT_MARGIN - 14}
          y={fretY(0) + FRET_HEIGHT / 2}
          fontSize={13}
          textAnchor="end"
          dominantBaseline="middle"
          className="ff-label"
        >
          {startFret}fr
        </text>
      )}

      {/* nut or top fret line */}
      <line
        x1={stringX(0)}
        y1={fretY(0)}
        x2={stringX(numStrings - 1)}
        y2={fretY(0)}
        stroke="currentColor"
        strokeWidth={showNut ? 6 : 2}
      />

      {/* fret lines */}
      {Array.from({ length: numFretsShown }).map((_, i) => (
        <line
          key={`fretline-${i}`}
          x1={stringX(0)}
          y1={fretY(i + 1)}
          x2={stringX(numStrings - 1)}
          y2={fretY(i + 1)}
          stroke="currentColor"
          strokeWidth={1}
          opacity={0.6}
        />
      ))}

      {/* strings */}
      {Array.from({ length: numStrings }).map((_, s) => (
        <line
          key={`string-${s}`}
          x1={stringX(s)}
          y1={fretY(0)}
          x2={stringX(s)}
          y2={fretY(numFretsShown)}
          stroke="currentColor"
          strokeWidth={1.5}
          opacity={0.85}
        />
      ))}

      {/* barre bar */}
      {shape.barreFret !== null && shape.barreStrings && (
        <line
          x1={stringX(shape.barreStrings[0])}
          y1={fretY(shape.barreFret - startFret + 1) - FRET_HEIGHT / 2}
          x2={stringX(shape.barreStrings[1])}
          y2={fretY(shape.barreFret - startFret + 1) - FRET_HEIGHT / 2}
          stroke="var(--ff-accent)"
          strokeWidth={DOT_RADIUS * 1.6}
          strokeLinecap="round"
          opacity={0.35}
        />
      )}

      {/* open / muted indicators above the diagram */}
      {tuning.map((_openMidi, s) => {
        const fret = shape.frets[s];
        const label = fret === null ? "X" : fret === 0 ? "O" : null;
        if (label === null) return null;
        return (
          <text
            key={`indicator-${s}`}
            x={stringX(s)}
            y={fretY(0) - 16}
            fontSize={15}
            fontWeight={600}
            textAnchor="middle"
            className={fret === null ? "ff-muted" : "ff-open"}
          >
            {label}
          </text>
        );
      })}

      {/* string open-note labels at very top */}
      {tuning.map((openMidi, s) => (
        <text
          key={`tuning-${s}`}
          x={stringX(s)}
          y={fretY(0) - 32}
          fontSize={10}
          textAnchor="middle"
          opacity={0.6}
          className="ff-label"
        >
          {midiToName(openMidi).replace(/[0-9-]+$/, "")}
        </text>
      ))}

      {/* fretted note dots */}
      {shape.frets.map((fret, s) => {
        if (fret === null || fret === 0) return null;
        const toneIdx = shape.toneIndices[s];
        const tone = toneIdx !== null ? chord.tones[toneIdx] : null;
        const row = fret - startFret + 1;
        const cx = stringX(s);
        const cy = fretY(row) - FRET_HEIGHT / 2;
        const isRoot = tone?.intervalId === "R";
        return (
          <g key={`dot-${s}`}>
            <circle
              cx={cx}
              cy={cy}
              r={DOT_RADIUS}
              className={isRoot ? "ff-dot-root" : tone?.required ? "ff-dot-required" : "ff-dot-optional"}
            />
            <text
              x={cx}
              y={cy - 3}
              fontSize={11}
              fontWeight={700}
              textAnchor="middle"
              className="ff-dot-text"
            >
              {tone?.noteName ?? "?"}
            </text>
            <text
              x={cx}
              y={cy + 9}
              fontSize={8.5}
              textAnchor="middle"
              className="ff-dot-subtext"
            >
              {tone?.intervalLabel ?? ""}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
