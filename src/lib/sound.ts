// Point-capture sound. Loud on purpose: it has to cut through engine and
// wind noise under a helmet, so it trades the old soft 800 Hz sine for a
// square-wave double chirp at 2 kHz — near the ear's most sensitive band,
// and with the harmonics that make a square read as far louder than a sine
// of the same amplitude. Kept deliberately unlike the speed-limit tones,
// which are owned separately by the NAVIGATE and ROADBOOK screens.

let audioContext: AudioContext | null = null;
let output: DynamicsCompressorNode | null = null;

const getOutput = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    // One compressor for the whole app run. It lets the bursts sit near full
    // scale without the clipping that raw gain would cause, and building one
    // per beep would pile up nodes that stay wired to the destination.
    output = audioContext.createDynamicsCompressor();
    output.threshold.setValueAtTime(-10, audioContext.currentTime);
    output.ratio.setValueAtTime(12, audioContext.currentTime);
    output.connect(audioContext.destination);
  }
  // The context is built at import time, long before any touch, so on Android
  // it can still be suspended by the autoplay policy — without this the
  // capture would be silent rather than quiet.
  if (audioContext.state === "suspended") {
    void audioContext.resume();
  }
  return { ctx: audioContext, out: output as DynamicsCompressorNode };
};

const FREQUENCY_HZ = 2000;
const BURST_S = 0.14;
const GAP_S = 0.18;
const PEAK = 1;
// exponentialRampToValueAtTime cannot reach zero, so silence is approximated.
const SILENT = 0.0001;

const burst = (ctx: AudioContext, out: AudioNode, at: number) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(out);

  osc.type = "square";
  osc.frequency.setValueAtTime(FREQUENCY_HZ, at);

  // Short attack and release instead of hard edges: a square wave that starts
  // and stops at full amplitude adds an audible click.
  gain.gain.setValueAtTime(SILENT, at);
  gain.gain.exponentialRampToValueAtTime(PEAK, at + 0.01);
  gain.gain.setValueAtTime(PEAK, at + BURST_S - 0.02);
  gain.gain.exponentialRampToValueAtTime(SILENT, at + BURST_S);

  osc.start(at);
  osc.stop(at + BURST_S);
};

export const playBeep = () => {
  // Never let audio throw out of here. The only caller is the capture branch
  // of the GPS tick handler, and the ASS auto-report is triggered a few lines
  // below it — a WebView that refuses to build or resume an AudioContext
  // would otherwise take the whole tick down with it, silently, since the
  // handler's catch only writes to debug state nothing renders.
  try {
    const { ctx, out } = getOutput();
    const now = ctx.currentTime;
    burst(ctx, out, now);
    burst(ctx, out, now + GAP_S);
  } catch (e) {
    console.error("Capture beep failed:", e);
  }
};
