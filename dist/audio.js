// The music streams from Pages. Short effects use Web Audio without loading more files.
export function createCampusAudio(button) {
  if (typeof Audio === 'undefined') {
    if (button) button.hidden = true;
    return {setDead() {}};
  }

  const music = new Audio();
  music.loop = true;
  music.preload = 'none';
  music.volume = .24;
  let enabled = true;
  try { enabled = localStorage.getItem('iist-sound') !== 'off'; } catch {}
  let activated = false, away = false, dead = false;
  let ctx;
  const notes = new Set();
  const audible = () => enabled && activated && !document.hidden && !away;

  function updateButton() {
    if (!button) return;
    button.textContent = enabled ? 'Sound on' : 'Sound off';
    button.setAttribute('aria-pressed', String(enabled));
  }
  function ensureContext() {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!ctx && Context) {
      try { ctx = new Context(); } catch { return; }
      // Music gain also works on phones that only expose hardware element volume.
      try {
        const input = ctx.createMediaElementSource(music);
        const gain = ctx.createGain();
        gain.gain.value = .24;
        input.connect(gain).connect(ctx.destination);
        music.volume = 1;
      } catch { /* The media element can still play through its default output. */ }
    }
    if (ctx) ctx.resume().catch(() => {});
  }
  function quietEffects() {
    for (const note of notes) note.stop();
  }
  function playDeathCue() {
    if (!audible() || ctx?.state !== 'running') return;
    // A short thud followed by two descending notes under the fall animation.
    for (const [delay, start, end, length, volume] of [
      [0, 150, 45, .18, .24], [.17, 370, 280, .38, .13], [.49, 280, 145, .83, .10],
    ]) {
      const t = ctx.currentTime + delay;
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(start, t);
      osc.frequency.exponentialRampToValueAtTime(end, t + length);
      gain.gain.setValueAtTime(.0001, t);
      gain.gain.exponentialRampToValueAtTime(volume, t + .018);
      gain.gain.exponentialRampToValueAtTime(.0001, t + length);
      osc.connect(gain).connect(ctx.destination);
      notes.add(osc);
      osc.onended = () => { notes.delete(osc); osc.disconnect(); gain.disconnect(); };
      osc.start(t);
      osc.stop(t + length + .01);
    }
  }
  function syncPlayback() {
    if (!audible()) {
      music.pause();
      quietEffects();
      if (ctx) ctx.suspend().catch(() => {});
      return;
    }
    ensureContext();
    if (dead) music.pause();
    else if (music.paused) {
      if (!music.getAttribute('src')) music.src = './audio/plucky-comedy.mp3';
      music.play().catch(() => {}); // A later tap can retry a browser-blocked start.
    }
  }
  function activate(event) {
    if (event.target === button || !enabled) return;
    // iOS may grant audio on pointerup or click rather than pointerdown.
    if (activated && (dead || !music.paused) && (!ctx || ctx.state === 'running')) return;
    activated = true;
    syncPlayback();
  }
  for (const type of ['click', 'pointerup', 'keydown']) document.addEventListener(type, activate, true);
  button?.addEventListener('click', () => {
    enabled = !enabled;
    activated = true;
    try { localStorage.setItem('iist-sound', enabled ? 'on' : 'off'); } catch {}
    updateButton();
    syncPlayback();
    button.blur();
  });
  document.addEventListener('visibilitychange', syncPlayback);
  window.addEventListener('pagehide', () => { away = true; syncPlayback(); });
  window.addEventListener('pageshow', () => { away = false; syncPlayback(); });
  updateButton();
  return {
    setDead(value) {
      if (dead === value) return;
      dead = value;
      quietEffects();
      syncPlayback();
      if (dead) playDeathCue();
    },
  };
}
