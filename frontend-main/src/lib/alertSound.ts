let audioCtx: AudioContext | null = null;
let ringing = false;
let ringInterval: ReturnType<typeof setInterval> | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

/** Call on caretaker login click so the browser allows instant ringtone playback. */
export function unlockCaretakerAudio() {
  const ctx = getCtx();
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
}

function beep(freq: number, duration: number, volume = 0.35) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.value = volume;
  osc.connect(gain);
  gain.connect(ctx.destination);
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.start(now);
  osc.stop(now + duration);
}

/** Urgent caretaker ringtone — three-tone pattern */
export function playCaretakerRingtone() {
  const ctx = getCtx();
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  beep(880, 0.18);
  setTimeout(() => beep(660, 0.18), 220);
  setTimeout(() => beep(880, 0.28), 440);
}

/** Continuous ring until stopped (for critical emergencies) */
export function startCaretakerAlarmLoop() {
  if (ringing) return;
  ringing = true;
  playCaretakerRingtone();
  ringInterval = setInterval(() => playCaretakerRingtone(), 2800);
}

export function stopCaretakerAlarmLoop() {
  ringing = false;
  if (ringInterval) {
    clearInterval(ringInterval);
    ringInterval = null;
  }
}

export function isCaretakerAlarmActive() {
  return ringing;
}
