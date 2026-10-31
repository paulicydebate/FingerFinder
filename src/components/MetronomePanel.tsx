import { useEffect, useRef, useState } from "react";
import { getAudioContext } from "../music/audioContext";
import {
  clampBpm,
  cycleAccent,
  defaultAccents,
  DEFAULT_METRONOME_SETTINGS,
  MAX_BPM,
  MetronomeScheduler,
  MIN_BPM,
  registerTap,
  resizeAccents,
  scheduleClick,
  SUBDIVISION_OPTIONS,
  type AccentLevel,
  type MetronomeSettings,
  type Subdivision,
} from "../music/metronome";

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_S = 0.1;
const BEATS_PER_MEASURE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 12];

interface CurrentBeat {
  beatIndex: number;
  subIndex: number;
}

interface Props {
  /** Whether the Metronome tab is the one currently showing. The panel stays
   * mounted (and playing) even when another tab is active, so practicing a
   * chord or scale elsewhere can still be done against the click. */
  active: boolean;
}

export default function MetronomePanel({ active }: Props) {
  const [bpm, setBpm] = useState(DEFAULT_METRONOME_SETTINGS.bpm);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(DEFAULT_METRONOME_SETTINGS.beatsPerMeasure);
  const [subdivision, setSubdivision] = useState<Subdivision>(DEFAULT_METRONOME_SETTINGS.subdivision);
  const [accents, setAccents] = useState<AccentLevel[]>(DEFAULT_METRONOME_SETTINGS.accents);
  const [running, setRunning] = useState(false);
  const [currentBeat, setCurrentBeat] = useState<CurrentBeat | null>(null);

  const settingsRef = useRef<MetronomeSettings>({ bpm, beatsPerMeasure, subdivision, accents });
  const schedulerRef = useRef<MetronomeScheduler | null>(null);
  const intervalIdRef = useRef<number | null>(null);
  const timeoutIdsRef = useRef<number[]>([]);
  const tapsRef = useRef<number[]>([]);

  useEffect(() => {
    settingsRef.current = { bpm, beatsPerMeasure, subdivision, accents };
  }, [bpm, beatsPerMeasure, subdivision, accents]);

  function stop() {
    setRunning(false);
    if (intervalIdRef.current !== null) {
      window.clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    timeoutIdsRef.current.forEach((id) => window.clearTimeout(id));
    timeoutIdsRef.current = [];
    schedulerRef.current = null;
    setCurrentBeat(null);
  }

  function start() {
    const ac = getAudioContext();
    schedulerRef.current = new MetronomeScheduler(settingsRef.current, ac.currentTime + 0.05);
    setRunning(true);

    intervalIdRef.current = window.setInterval(() => {
      const scheduler = schedulerRef.current;
      if (!scheduler) return;
      scheduler.updateSettings(settingsRef.current);
      const events = scheduler.advanceUntil(ac.currentTime + SCHEDULE_AHEAD_S);
      for (const ev of events) {
        scheduleClick(ac, ev.time, ev.accent);
        const delayMs = Math.max(0, (ev.time - ac.currentTime) * 1000);
        const id = window.setTimeout(() => {
          setCurrentBeat({ beatIndex: ev.beatIndex, subIndex: ev.subIndex });
        }, delayMs);
        timeoutIdsRef.current.push(id);
      }
    }, LOOKAHEAD_MS);
  }

  // This panel stays mounted across tab switches (so playback survives
  // navigating elsewhere); only stop cleanly if the whole app unmounts.
  useEffect(() => stop, []);

  function handleBeatsPerMeasureChange(next: number) {
    setBeatsPerMeasure(next);
    setAccents((prev) => resizeAccents(prev, next));
  }

  function handleTap() {
    const now = performance.now();
    const { taps, bpm: tappedBpm } = registerTap(tapsRef.current, now);
    tapsRef.current = taps;
    if (tappedBpm !== null) setBpm(tappedBpm);
  }

  return (
    <>
      <section className="ff-panel" hidden={!active}>
        <h2>Metronome</h2>

        <div className="ff-metronome-bpm-row">
          <button
            type="button"
            className="ff-secondary-button"
            onClick={() => setBpm((b) => clampBpm(b - 1))}
            aria-label="Decrease tempo"
          >
            −
          </button>
          <input
            type="number"
            className="ff-metronome-bpm-input"
            min={MIN_BPM}
            max={MAX_BPM}
            value={bpm}
            onChange={(e) => setBpm(clampBpm(Number(e.target.value) || MIN_BPM))}
          />
          <span className="ff-label">BPM</span>
          <button
            type="button"
            className="ff-secondary-button"
            onClick={() => setBpm((b) => clampBpm(b + 1))}
            aria-label="Increase tempo"
          >
            +
          </button>
          <button type="button" className="ff-secondary-button" onClick={handleTap}>
            Tap tempo
          </button>
        </div>

        <input
          type="range"
          min={MIN_BPM}
          max={MAX_BPM}
          value={bpm}
          onChange={(e) => setBpm(clampBpm(Number(e.target.value)))}
          className="ff-metronome-slider"
          aria-label="Tempo slider"
        />

        <div className="ff-advanced-row">
          <label>
            Beats per measure
            <select
              value={beatsPerMeasure}
              onChange={(e) => handleBeatsPerMeasureChange(Number(e.target.value))}
            >
              {BEATS_PER_MEASURE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label>
            Subdivision
            <select
              value={subdivision}
              onChange={(e) => setSubdivision(Number(e.target.value) as Subdivision)}
            >
              {SUBDIVISION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Reset accents
            <button
              type="button"
              className="ff-secondary-button"
              onClick={() => setAccents(defaultAccents(beatsPerMeasure))}
            >
              Accent beat 1 only
            </button>
          </label>
        </div>

        <p className="ff-muted-text">Click a beat below to cycle it through accent → normal → silent.</p>

        <div className="ff-metronome-beats">
          {accents.map((accent, i) => (
            <button
              key={i}
              type="button"
              className={`ff-beat-light ff-beat-light-${accent}${
                running && currentBeat?.beatIndex === i ? " ff-beat-light-active" : ""
              }`}
              onClick={() => setAccents((prev) => prev.map((a, idx) => (idx === i ? cycleAccent(a) : a)))}
              aria-label={`Beat ${i + 1}: ${accent}`}
            >
              <span className="ff-beat-light-number">{i + 1}</span>
              <span className="ff-beat-light-subticks">
                {Array.from({ length: subdivision }).map((_, sub) => (
                  <span
                    key={sub}
                    className={`ff-beat-subtick${
                      running && currentBeat?.beatIndex === i && currentBeat.subIndex === sub
                        ? " ff-beat-subtick-active"
                        : ""
                    }`}
                  />
                ))}
              </span>
            </button>
          ))}
        </div>

        <div className="ff-metronome-transport">
          <button type="button" className="ff-primary-button" onClick={running ? stop : start}>
            {running ? "■ Stop" : "▶ Start"}
          </button>
        </div>
      </section>

      {running && !active && (
        <div className="ff-metronome-minibar">
          <span className="ff-metronome-minibar-dot" />
          <span>
            Metronome running — {bpm} BPM, beat {(currentBeat?.beatIndex ?? 0) + 1} of {beatsPerMeasure}
          </span>
          <button type="button" onClick={stop}>
            ■ Stop
          </button>
        </div>
      )}
    </>
  );
}
