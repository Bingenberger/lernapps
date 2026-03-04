let audioCtx = null;

function getAudioContext() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    return null;
  }
  if (!audioCtx) {
    audioCtx = new AudioCtx();
  }
  return audioCtx;
}

function playTone(freq, type, duration, volume) {
  const ctx = getAudioContext();
  if (!ctx) {
    return;
  }

  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);

  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export function playSound(enabled, soundType) {
  if (!enabled) {
    return;
  }

  if (soundType === "tap") {
    playTone(600, "sine", 0.09, 0.04);
    return;
  }

  if (soundType === "success") {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, index) => {
      setTimeout(() => playTone(freq, "sine", 0.25, 0.07), index * 70);
    });
    return;
  }

  if (soundType === "error") {
    [220, 196].forEach((freq, index) => {
      setTimeout(() => playTone(freq, "triangle", 0.16, 0.06), index * 90);
    });
    return;
  }

  if (soundType === "roundDone") {
    [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((freq, index) => {
      setTimeout(() => playTone(freq, "triangle", 0.3, 0.08), index * 90);
    });
  }
}
