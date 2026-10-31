export type Quality = "major" | "minor" | "augmented" | "diminished";
export type Sus = "none" | "sus2" | "sus4";
export type Extension =
  | "none"
  | "6"
  | "6/9"
  | "7"
  | "maj7"
  | "9"
  | "maj9"
  | "11"
  | "maj11"
  | "13"
  | "maj13"
  | "add9"
  | "add11"
  | "add13"
  | "dim7";

export const QUALITY_OPTIONS: { value: Quality; label: string }[] = [
  { value: "major", label: "Major" },
  { value: "minor", label: "Minor" },
  { value: "augmented", label: "Augmented" },
  { value: "diminished", label: "Diminished" },
];

export const SUS_OPTIONS: { value: Sus; label: string }[] = [
  { value: "none", label: "None" },
  { value: "sus2", label: "sus2" },
  { value: "sus4", label: "sus4" },
];

export const EXTENSION_OPTIONS: { value: Extension; label: string }[] = [
  { value: "none", label: "None" },
  { value: "6", label: "6" },
  { value: "6/9", label: "6/9" },
  { value: "7", label: "7" },
  { value: "maj7", label: "Major 7" },
  { value: "9", label: "9" },
  { value: "maj9", label: "Major 9" },
  { value: "11", label: "11" },
  { value: "maj11", label: "Major 11" },
  { value: "13", label: "13" },
  { value: "maj13", label: "Major 13" },
  { value: "add9", label: "add9" },
  { value: "add11", label: "add11" },
  { value: "add13", label: "add13" },
  { value: "dim7", label: "dim7 (fully diminished)" },
];

/** Extension options that only make musical sense on a diminished triad. */
export const DIMINISHED_ONLY_EXTENSIONS: Extension[] = ["dim7"];

export interface ChordToneSpec {
  intervalId: string;
  required: boolean;
}

/**
 * Build the interval formula (which tones a chord contains, and which are
 * "required" vs. droppable filler when a voicing can't fit everything) from
 * the four independent selections a user makes.
 */
export function buildChordFormula(
  quality: Quality,
  sus: Sus,
  extension: Extension,
): ChordToneSpec[] {
  const tones: ChordToneSpec[] = [{ intervalId: "R", required: true }];

  const thirdId =
    sus === "sus2"
      ? "2"
      : sus === "sus4"
        ? "4"
        : quality === "minor" || quality === "diminished"
          ? "b3"
          : "3";
  tones.push({ intervalId: thirdId, required: true });

  const fifthId =
    quality === "augmented" ? "#5" : quality === "diminished" ? "b5" : "5";
  const fifthRequired = quality === "augmented" || quality === "diminished";
  tones.push({ intervalId: fifthId, required: fifthRequired });

  switch (extension) {
    case "none":
      break;
    case "6":
      tones.push({ intervalId: "6", required: true });
      break;
    case "6/9":
      tones.push({ intervalId: "6", required: true });
      tones.push({ intervalId: "9", required: true });
      break;
    case "7":
      tones.push({ intervalId: "b7", required: true });
      break;
    case "maj7":
      tones.push({ intervalId: "7", required: true });
      break;
    case "9":
      tones.push({ intervalId: "b7", required: true });
      tones.push({ intervalId: "9", required: true });
      break;
    case "maj9":
      tones.push({ intervalId: "7", required: true });
      tones.push({ intervalId: "9", required: true });
      break;
    case "11":
      tones.push({ intervalId: "b7", required: true });
      tones.push({ intervalId: "9", required: false });
      tones.push({ intervalId: "11", required: true });
      break;
    case "maj11":
      tones.push({ intervalId: "7", required: true });
      tones.push({ intervalId: "9", required: false });
      tones.push({ intervalId: "11", required: true });
      break;
    case "13":
      tones.push({ intervalId: "b7", required: true });
      tones.push({ intervalId: "9", required: false });
      tones.push({ intervalId: "11", required: false });
      tones.push({ intervalId: "13", required: true });
      break;
    case "maj13":
      tones.push({ intervalId: "7", required: true });
      tones.push({ intervalId: "9", required: false });
      tones.push({ intervalId: "11", required: false });
      tones.push({ intervalId: "13", required: true });
      break;
    case "add9":
      tones.push({ intervalId: "9", required: true });
      break;
    case "add11":
      tones.push({ intervalId: "11", required: true });
      break;
    case "add13":
      tones.push({ intervalId: "13", required: true });
      break;
    case "dim7":
      tones.push({ intervalId: "bb7", required: true });
      break;
  }

  return tones;
}

/** Human-readable chord symbol, e.g. "C", "Am7", "F#dim7", "Bb9sus4". */
export function chordSymbol(
  rootName: string,
  quality: Quality,
  sus: Sus,
  extension: Extension,
): string {
  let qualitySuffix = "";
  switch (quality) {
    case "major":
      qualitySuffix = "";
      break;
    case "minor":
      qualitySuffix = "m";
      break;
    case "augmented":
      qualitySuffix = "aug";
      break;
    case "diminished":
      qualitySuffix = extension === "7" ? "m7b5" : extension === "dim7" ? "dim7" : "dim";
      break;
  }

  let extensionSuffix = "";
  switch (extension) {
    case "none":
      extensionSuffix = "";
      break;
    case "6":
      extensionSuffix = "6";
      break;
    case "6/9":
      extensionSuffix = "6/9";
      break;
    case "7":
      extensionSuffix = quality === "diminished" ? "" : "7";
      break;
    case "maj7":
      extensionSuffix = "maj7";
      break;
    case "9":
      extensionSuffix = "9";
      break;
    case "maj9":
      extensionSuffix = "maj9";
      break;
    case "11":
      extensionSuffix = "11";
      break;
    case "maj11":
      extensionSuffix = "maj11";
      break;
    case "13":
      extensionSuffix = "13";
      break;
    case "maj13":
      extensionSuffix = "maj13";
      break;
    case "add9":
      extensionSuffix = "add9";
      break;
    case "add11":
      extensionSuffix = "add11";
      break;
    case "add13":
      extensionSuffix = "add13";
      break;
    case "dim7":
      extensionSuffix = "dim7";
      break;
  }

  const susSuffix =
    sus !== "none" && quality !== "diminished" && extension !== "dim7"
      ? sus
      : "";

  // dim / dim7 / m7b5 already encode the quality+7 combo above.
  if (quality === "diminished" && (extension === "dim7" || extension === "7")) {
    return `${rootName}${qualitySuffix}`;
  }

  return `${rootName}${qualitySuffix}${extensionSuffix}${susSuffix}`;
}
