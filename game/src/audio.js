// Audio: one job — tiny synthesized sounds via WebAudio, no assets, no
// network. Silent when the context is suspended (headless screenshots).
export function createAudio() {
  let ctx = null;
  let muted = false;
  function context() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch {
      return null;
    }
    return ctx;
  }
  function blip(freq, dur, type, vol, slideTo) {
    if (muted) return;
    const ac = context();
    if (!ac || ac.state !== 'running') return;
    try {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ac.currentTime);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ac.currentTime + dur);
      gain.gain.setValueAtTime(vol, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + dur);
    } catch { /* sound is garnish, never fatal */ }
  }
  return {
    setMuted(value) { muted = value; },
    isMuted() { return muted; },
    resume() { const ac = context(); if (ac && ac.state === 'suspended') ac.resume().catch(() => {}); },
    chop() { blip(220, 0.07, 'square', 0.12, 110); },
    pickup() { blip(520, 0.08, 'sine', 0.1, 660); },
    place() { blip(340, 0.09, 'triangle', 0.12, 260); },
    sizzle() { blip(880, 0.25, 'sawtooth', 0.05, 440); },
    ding() { blip(1046, 0.35, 'sine', 0.14, 1568); },
    serve() { blip(660, 0.12, 'sine', 0.14, 990); setTimeout(() => blip(990, 0.2, 'sine', 0.12, 1320), 90); },
    miss() { blip(220, 0.3, 'sawtooth', 0.08, 110); },
    burn() { blip(160, 0.4, 'sawtooth', 0.1, 80); },
    rush() { blip(440, 0.15, 'square', 0.1, 660); setTimeout(() => blip(660, 0.15, 'square', 0.1, 880), 140); },
    deny() { blip(140, 0.1, 'square', 0.08, 100); },
    trash() { blip(300, 0.12, 'triangle', 0.1, 150); },
  };
}
