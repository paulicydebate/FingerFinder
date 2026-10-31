import { useState } from "react";
import "./App.css";
import TuningEditor from "./components/TuningEditor";
import ChordFinderPanel from "./components/ChordFinderPanel";
import ReverseLookupPanel from "./components/ReverseLookupPanel";
import ArpeggioPanel from "./components/ArpeggioPanel";
import ScaleBrowserPanel from "./components/ScaleBrowserPanel";
import ProgressionsPanel from "./components/ProgressionsPanel";
import MetronomePanel from "./components/MetronomePanel";
import { STANDARD_TUNING, type Tuning } from "./music/tuning";

type Tab = "finder" | "reverse" | "arpeggio" | "scales" | "progressions" | "metronome";

const TABS: { id: Tab; label: string }[] = [
  { id: "finder", label: "Chord Finder" },
  { id: "reverse", label: "Reverse Lookup" },
  { id: "arpeggio", label: "Arpeggio Finder" },
  { id: "scales", label: "Scales" },
  { id: "progressions", label: "Progressions" },
  { id: "metronome", label: "Metronome" },
];

export default function App() {
  const [tuning, setTuning] = useState<Tuning>([...STANDARD_TUNING]);
  const [tab, setTab] = useState<Tab>("finder");

  return (
    <div className="ff-app">
      <header className="ff-header">
        <h1>FingerFinder</h1>
        <p className="ff-tagline">Build a chord, find every way to play it.</p>
      </header>

      <section className="ff-panel">
        <h2>Tuning</h2>
        <TuningEditor tuning={tuning} onChange={setTuning} />
      </section>

      <nav className="ff-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`ff-tab${tab === t.id ? " ff-tab-active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "finder" && <ChordFinderPanel tuning={tuning} />}
      {tab === "reverse" && <ReverseLookupPanel tuning={tuning} />}
      {tab === "arpeggio" && <ArpeggioPanel tuning={tuning} />}
      {tab === "scales" && <ScaleBrowserPanel tuning={tuning} />}
      {tab === "progressions" && <ProgressionsPanel tuning={tuning} />}
      {/* Stays mounted across tabs so a running click survives navigating away. */}
      <MetronomePanel active={tab === "metronome"} />
    </div>
  );
}
