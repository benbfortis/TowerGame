// game.js — top-level frame loop. No simulation here.
// Public surface:
//   startLoop(tick, onFrame) — kicks off requestAnimationFrame; controller-driven.

export function startLoop(tick, onFrame) {
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    tick(dt);
    onFrame();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
