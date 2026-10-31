// Lazily-created AudioContext shared by every feature that makes sound
// (chord playback, the metronome), so the browser's limited pool of audio
// contexts isn't spent creating a new one per feature.

let ctx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}
