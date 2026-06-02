// canvas.js — canvas setup + viewport→map coordinate translation.
// Public surface:
//   setupCanvas(canvasId, mapW, mapH) — bind canvas, scale to portrait viewport, return {canvas, ctx}.
//   viewportToMap(canvas, mapW, mapH, clientX, clientY) — translate pointer coords to map space.

export function setupCanvas(canvasId, mapWidth, mapHeight) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');

  function resize() {
    const ratio = mapWidth / mapHeight; // portrait < 1
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let w, h;
    if (vw / vh > ratio) { h = vh; w = vh * ratio; }
    else                  { w = vw; h = vw / ratio; }
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.round(mapWidth * dpr);
    canvas.height = Math.round(mapHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);
  return { canvas, ctx };
}

export function viewportToMap(canvas, mapWidth, mapHeight, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * mapWidth;
  const y = ((clientY - rect.top) / rect.height) * mapHeight;
  return { x, y };
}
