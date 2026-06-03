// render.js — pure renderer. Reads state. NEVER mutates it.
// v1.3: terrain polygons; per-rank factory/unit visuals; full 4-state drag taxonomy
// (free/penalised/blocked/empty) with pre-drag reachability tints; denied-flash;
// source-factory drag pulse; honours prefers-reduced-motion.
//
// Public surface:
//   render(ctx, state, viewState) — paint one frame.

import { getFactory, isContested, popTier } from '../model/state.js';
import { pathReachability, getPathWaypoints } from '../model/reachability.js';
import { TERRAIN_RENDER, UNITS, VFX } from '../data/store.js';

const COLOR = {
  bg: '#0d1117',
  grid: 'rgba(255,255,255,0.025)',
  neutral: '#5b6470',
  player: '#3aa6ff',
  ai: '#ff5b5b',
  yellow: '#ffd166',
  green:  '#8fd99a',
  hpBg: '#222a36',
  hp: '#9be07e',

  invasionPlayer: 'rgba(58,166,255,0.62)',
  invasionAi:     'rgba(255,91,91,0.62)',
  invasionYellow: 'rgba(255,209,102,0.62)',
  invasionGreen:  'rgba(143,217,154,0.62)',

  preview:         'rgba(255,255,255,0.85)',  // state A — empty
  previewFree:     'rgba(126,200,255,0.95)',  // state B — free snap
  previewPenalty:  'rgba(255,184,77,0.95)',   // state C — penalised
  previewBlocked:  'rgba(255,91,91,0.95)',    // state D — blocked

  ringFree:        'rgba(126,200,255,0.85)',
  ringPenalty:     'rgba(255,184,77,0.9)',
  ringBlocked:     'rgba(255,91,91,0.95)',

  tintFree:        'rgba(126,200,255,0.45)',
  tintPenalty:     'rgba(255,184,77,0.55)',
  tintBlocked:     'rgba(255,91,91,0.6)',

  text: '#dbe2ea',
  outline: '#06080c',
};

const reducedMotion = (typeof window !== 'undefined' && window.matchMedia)
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
  : false;

export function render(ctx, state, viewState) {
  const W = state.mapWidth, H = state.mapHeight;
  ctx.fillStyle = COLOR.bg;
  ctx.fillRect(0, 0, W, H);

  // 1. Terrain polygons (drawn first — under everything).
  renderTerrain(ctx, state);

  // 2. Invasion arrows. v1.11: each arrow follows the A* waypoint polyline
  //    for the source's rank (so light arrows route around mountains, etc.).
  //    Contested pairs (A→B AND B→A) still draw a half/half straight line.
  const renderedContested = new Set();
  for (const f of state.factories) {
    if (!f.outgoingTargetIds || f.outgoingTargetIds.length === 0) continue;
    for (const tid of f.outgoingTargetIds) {
      const dst = getFactory(state, tid);
      if (!dst) continue;
      if (isContested(state, f.id, tid)) {
        const key = [f.id, tid].sort().join('|');
        if (renderedContested.has(key)) continue;
        renderedContested.add(key);
        drawContestedLine(ctx, f, dst, state);
      } else {
        const stroke = ownerInvasionColor(f.owner);
        ctx.fillStyle = stroke;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = VFX.invasionArrowWidth;
        const wp = getPathWaypoints(state, f.id, tid, f.rank);
        drawPolylineArrow(ctx, wp, dst, state.config.factoryRadius);
      }
    }
  }

  // 3. Pre-drag reachability tints (on every non-source factory) — invade mode only.
  const drag = viewState.drag;
  if (drag && drag.active && drag.mode === 'invade' && drag.srcId) {
    drawPreDragTints(ctx, state, drag);
  }

  // 4. Drag preview line — invade mode draws line to pointer/snap; slash mode draws a faint pointer dot.
  if (drag && drag.active && drag.mode === 'invade') {
    drawDragPreview(ctx, state, drag);
  } else if (drag && drag.active && drag.mode === 'slash') {
    drawSlashPointer(ctx, drag);
  }

  // 5. Units — v1.11: unit.x/y is now authoritative (movement computes it
  // from the waypoint polyline). Renderer no longer interpolates by t.
  for (const u of state.units) {
    drawUnit(ctx, u, u.x ?? 0, u.y ?? 0);
  }

  // 5b. v1.12: ranged-fire shot flashes. Painted between units and factories.
  if (state.shots && state.shots.length > 0) {
    for (const s of state.shots) {
      const remaining = s.until - state.elapsed;
      if (remaining <= 0) continue;
      const alpha = Math.min(1, remaining / VFX.shotFlashSec) * 0.95;
      const base = ownerBodyColor(s.owner);
      // Convert hex → rgba with current alpha.
      const r = parseInt(base.slice(1,3), 16);
      const g = parseInt(base.slice(3,5), 16);
      const b = parseInt(base.slice(5,7), 16);
      const color = `rgba(${r},${g},${b},${alpha})`;
      ctx.strokeStyle = color;
      ctx.lineWidth = VFX.shotLineWidth;
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
      ctx.stroke();
      // Impact dot at target.
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(s.x2, s.y2, VFX.shotImpactRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 6. Factories.
  const nowMs = (typeof performance !== 'undefined') ? performance.now() : Date.now();
  for (const f of state.factories) drawFactory(ctx, f, state, drag, nowMs);

  // 7. Snap ring (on top of factories) — invade mode only.
  if (drag && drag.active && drag.mode === 'invade' && drag.snappedTargetId) {
    drawSnapRing(ctx, state, drag, nowMs);
  }

  // 8. Denied flash (one-shot fade). Pure read; controller/tick.js clears it when expired.
  if (state.deniedFlash) {
    const remaining = state.deniedFlash.until - nowMs;
    if (remaining > 0) {
      const alpha = Math.min(1, remaining / VFX.deniedFlashMs) * 0.9;
      const f = getFactory(state, state.deniedFlash.factoryId);
      if (f) {
        ctx.strokeStyle = `rgba(255,91,91,${alpha})`;
        ctx.lineWidth = VFX.deniedFlashLineWidth;
        ctx.beginPath();
        ctx.arc(f.x, f.y, state.config.factoryRadius + VFX.deniedFlashRingOffsetPx, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }
}

// ─── terrain ─────────────────────────────────────────────────────────────

// v1.10: chunky tile-rasterised terrain rendering (Advance Wars feel).
// Each polygon is rasterised to a TILE_SIZE grid; any tile whose center falls
// inside the polygon is drawn as a filled chunk with a subtle separator.
// Gives organic shapes a pixel-art / tactical-grid look while keeping
// the polygon storage format unchanged.
function renderTerrain(ctx, state) {
  const TILE_SIZE = VFX.terrainTileSize;
  const arr = state.terrainRegions || [];
  for (const r of arr) {
    const palette = TERRAIN_RENDER[r.type];
    if (!palette) continue;
    const p = r.poly;
    if (!p || p.length < 3) continue;
    // Bounding box.
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const v of p) {
      if (v[0] < minX) minX = v[0];
      if (v[0] > maxX) maxX = v[0];
      if (v[1] < minY) minY = v[1];
      if (v[1] > maxY) maxY = v[1];
    }
    const x0 = Math.floor(minX / TILE_SIZE) * TILE_SIZE;
    const y0 = Math.floor(minY / TILE_SIZE) * TILE_SIZE;
    const x1 = Math.ceil(maxX / TILE_SIZE) * TILE_SIZE;
    const y1 = Math.ceil(maxY / TILE_SIZE) * TILE_SIZE;
    ctx.fillStyle = palette.fill;
    for (let ty = y0; ty < y1; ty += TILE_SIZE) {
      for (let tx = x0; tx < x1; tx += TILE_SIZE) {
        const cx = tx + TILE_SIZE / 2;
        const cy = ty + TILE_SIZE / 2;
        if (pointInPoly(cx, cy, p)) {
          ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
        }
      }
    }
    // Outline pass — only stroke the polygon's silhouette so adjacent tiles
    // don't get internal grid lines (cleaner read).
    ctx.strokeStyle = palette.stroke;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]);
    ctx.closePath();
    ctx.stroke();
  }
}

function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi + 1e-12) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// ─── factory ─────────────────────────────────────────────────────────────

function drawFactory(ctx, f, state, drag, nowMs) {
  const r = state.config.factoryRadius;
  const color = ownerBodyColor(f.owner);

  // Source factory: subtle outward pulse during invade drag (skip if reduced-motion).
  if (drag && drag.active && drag.mode === 'invade' && drag.srcId === f.id && !reducedMotion) {
    const phase = (nowMs / 1000) * 2 * Math.PI * VFX.sourceHaloPulseHz;
    const halo = r + VFX.sourceHaloOffsetPx + Math.sin(phase) * VFX.sourceHaloAmplitudePx;
    ctx.strokeStyle = 'rgba(126,200,255,0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(f.x, f.y, halo, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Body — shape varies by rank (visual rank read).
  ctx.fillStyle = color;
  ctx.strokeStyle = COLOR.outline;
  ctx.lineWidth = 2;
  drawRankedBody(ctx, f.x, f.y, r, f.rank);
  ctx.fill();
  ctx.stroke();

  // v1.7: pop IS the vitality readout (HP bar removed). Colour by danger level.
  // Neutrals also show their pop — they have a defensive value too (5 to capture).
  const pop = Math.max(0, f.population);
  const tier = popTier(f, state.config);
  const popColor = popDangerColor(pop);
  ctx.fillStyle = popColor;
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(pop), f.x, f.y - 2);
  {
    // Combined rate boost label: pop-tier + inflow. Shown whenever EITHER is active.
    const tierBonusPct = tier * (state.config.popTierRateBonus || 0.5) * 100;
    const inflowBonusPct = (f.inflowBoost || 0) * (state.config.inflowBoostFactor || 0.5) * 100;
    const totalPct = Math.round(tierBonusPct + inflowBonusPct);
    if (totalPct > 0) {
      ctx.font = 'bold 9px system-ui, sans-serif';
      // Cyan when inflow boost is the dominant contributor — signals "being fed."
      ctx.fillStyle = inflowBonusPct > tierBonusPct ? '#a8e1ff' : '#ffe599';
      ctx.fillText(`+${totalPct}%`, f.x, f.y + 14);
    }
  }

  // Id + rank initial — directly under the body (no HP bar between).
  ctx.fillStyle = COLOR.text;
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`${f.id} · ${rankShort(f.rank)}`, f.x, f.y + r + 14);
}

// v1.7: pop number colour signals vitality danger at a glance.
//   0      → red    (one hit captures)
//   1      → orange (vulnerable)
//   2–4    → yellow (low)
//   ≥ 5    → white  (healthy)
function popDangerColor(pop) {
  if (pop <= 0) return '#ff6d6d';
  if (pop === 1) return '#ffa033';
  if (pop <= 4) return '#ffd166';
  return '#ffffff';
}

function drawRankedBody(ctx, x, y, r, rank) {
  ctx.beginPath();
  if (rank === 'light') {
    // Circle — fast, lean
    ctx.arc(x, y, r, 0, Math.PI * 2);
  } else if (rank === 'medium') {
    // Rounded square
    const s = r * 0.95;
    roundRect(ctx, x - s, y - s, s * 2, s * 2, 8);
  } else {
    // Hexagon — heavy, blocky
    const sides = 6;
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
}

function rankShort(rank) {
  return rank === 'light' ? 'L' : rank === 'medium' ? 'M' : rank === 'heavy' ? 'H' : '?';
}

// ─── unit ────────────────────────────────────────────────────────────────

function drawUnit(ctx, u, x, y) {
  const def = UNITS[u.type];
  const color = def?.color || ownerBodyColor(u.owner);
  const radius = u.radius || 6;
  // Body
  ctx.fillStyle = color;
  ctx.strokeStyle = COLOR.outline;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Glyph for medium/heavy (light is too small for a readable letter)
  if (radius >= 7 && u.glyph) {
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.round(radius * 1.2)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(u.glyph, x, y + 0.5);
  }
}

// ─── drag preview + reachability tints + snap ring ──────────────────────

// Slash mode: just a small ring at the pointer so the player sees their finger is tracked.
// Lines that get crossed simply vanish — that's the cancel feedback.
function drawSlashPointer(ctx, drag) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 2;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.arc(drag.x, drag.y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawDragPreview(ctx, state, drag) {
  const src = getFactory(state, drag.srcId);
  if (!src) return;
  let ex = drag.x, ey = drag.y;
  const snapped = drag.snappedTargetId ? getFactory(state, drag.snappedTargetId) : null;
  if (snapped) { ex = snapped.x; ey = snapped.y; }

  let color, width, dash, glow;
  if (!snapped) {
    color = COLOR.preview; width = 3; dash = [8, 6]; glow = 0;
  } else if (drag.reachability === 'free') {
    color = COLOR.previewFree; width = 4; dash = []; glow = 6;
  } else if (drag.reachability === 'penalised') {
    color = COLOR.previewPenalty; width = 3.5; dash = []; glow = 8;
  } else { // blocked
    color = COLOR.previewBlocked; width = 3.5; dash = [10, 5]; glow = 8;
  }
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  if (glow > 0) { ctx.shadowColor = color; ctx.shadowBlur = glow; }
  ctx.beginPath();
  ctx.moveTo(src.x, src.y);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  ctx.restore();
}

function drawPreDragTints(ctx, state, drag) {
  for (const f of state.factories) {
    if (f.id === drag.srcId) continue;
    const reach = pathReachability(state, drag.srcId, f.id);
    let color, dash = [];
    if (reach === 'free')        { color = COLOR.tintFree; }
    else if (reach === 'penalised') { color = COLOR.tintPenalty; dash = [5, 4]; }
    else                          { color = COLOR.tintBlocked; }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.arc(f.x, f.y, state.config.factoryRadius + 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    if (reach === 'blocked') {
      drawDenyGlyph(ctx, f.x + state.config.factoryRadius - 2, f.y - state.config.factoryRadius + 2, 7, color);
    }
  }
}

function drawSnapRing(ctx, state, drag, nowMs) {
  const t = getFactory(state, drag.snappedTargetId);
  if (!t) return;
  let color, dash, pulse;
  if (drag.reachability === 'free') {
    color = COLOR.ringFree; dash = []; pulse = true;
  } else if (drag.reachability === 'penalised') {
    color = COLOR.ringPenalty; dash = [6, 4]; pulse = true;
  } else {
    color = COLOR.ringBlocked; dash = []; pulse = false;
  }
  let radius = state.config.factoryRadius + VFX.snapRingOffsetPx;
  if (pulse && !reducedMotion) {
    const phase = (nowMs / 1000) * 2 * Math.PI * VFX.snapRingPulseHz;
    radius += Math.sin(phase) * VFX.snapRingAmplitudePx;
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.arc(t.x, t.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  if (drag.reachability === 'blocked') {
    // ⊘ overlay across the ring (colorblind-safe denial cue).
    drawDenyGlyph(ctx, t.x, t.y, state.config.factoryRadius + 6, color);
  }
}

function drawDenyGlyph(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  // 45° diagonal slash
  const off = r * 0.72;
  ctx.moveTo(cx - off, cy - off);
  ctx.lineTo(cx + off, cy + off);
  ctx.stroke();
  ctx.restore();
}

// ─── arrow + contested line ─────────────────────────────────────────────

function ownerInvasionColor(owner) {
  switch (owner) {
    case 'player': return COLOR.invasionPlayer;
    case 'ai':     return COLOR.invasionAi;
    case 'yellow': return COLOR.invasionYellow;
    case 'green':  return COLOR.invasionGreen;
    default:       return 'rgba(255,255,255,0.5)';
  }
}

function ownerBodyColor(owner) {
  switch (owner) {
    case 'player': return COLOR.player;
    case 'ai':     return COLOR.ai;
    case 'yellow': return COLOR.yellow;
    case 'green':  return COLOR.green;
    default:       return COLOR.neutral;
  }
}

// Contested line: A→B AND B→A both exist. One line, split at the midpoint,
// each half in its endpoint owner's invasion colour. Arrowheads at both ends.
function drawContestedLine(ctx, a, b, state) {
  const r = state.config.factoryRadius;
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len <= r * 2) return;
  const ux = dx / len, uy = dy / len;
  const ax = a.x + ux * r, ay = a.y + uy * r;
  const bx = b.x - ux * r, by = b.y - uy * r;
  const mx = (ax + bx) / 2, my = (ay + by) / 2;
  const colorA = ownerInvasionColor(a.owner);
  const colorB = ownerInvasionColor(b.owner);

  ctx.lineWidth = 4;
  ctx.strokeStyle = colorA;
  ctx.beginPath();
  ctx.moveTo(ax, ay); ctx.lineTo(mx, my); ctx.stroke();
  ctx.strokeStyle = colorB;
  ctx.beginPath();
  ctx.moveTo(mx, my); ctx.lineTo(bx, by); ctx.stroke();

  // Arrowhead at B end → A's units fly that way (A's colour).
  ctx.fillStyle = colorA;
  drawArrowhead(ctx, bx, by, ux, uy, 12);
  // Arrowhead at A end → B's units fly that way (B's colour).
  ctx.fillStyle = colorB;
  drawArrowhead(ctx, ax, ay, -ux, -uy, 12);
}

function drawArrowhead(ctx, tipX, tipY, ux, uy, size) {
  const baseX = tipX - ux * size, baseY = tipY - uy * size;
  const px = -uy, py = ux;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(baseX + px * size * 0.55, baseY + py * size * 0.55);
  ctx.lineTo(baseX - px * size * 0.55, baseY - py * size * 0.55);
  ctx.closePath();
  ctx.fill();
}

// v1.11: draw an invasion arrow as a polyline following A* waypoints, with
// the final arrowhead at the dst factory's edge. Falls back to straight line
// if no waypoints (shouldn't happen — arrow only renders if path exists).
function drawPolylineArrow(ctx, wp, dst, srcR) {
  if (!wp || wp.length < 2) return;
  // Trim the first segment so the line starts at the src factory's edge.
  const first = wp[0];
  const second = wp[1];
  const fdx = second.x - first.x, fdy = second.y - first.y;
  const flen = Math.hypot(fdx, fdy);
  if (flen <= 0) return;
  const fux = fdx / flen, fuy = fdy / flen;
  const startX = first.x + fux * srcR;
  const startY = first.y + fuy * srcR;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  for (let i = 1; i < wp.length - 1; i++) {
    ctx.lineTo(wp[i].x, wp[i].y);
  }
  // Trim final segment to stop just shy of dst body.
  const penult = wp[wp.length - 2];
  const last = wp[wp.length - 1];
  const ldx = last.x - penult.x, ldy = last.y - penult.y;
  const llen = Math.hypot(ldx, ldy);
  if (llen <= 0) { ctx.stroke(); return; }
  const lux = ldx / llen, luy = ldy / llen;
  const endX = last.x - lux * (srcR + 4);
  const endY = last.y - luy * (srcR + 4);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  // Arrowhead at end, oriented along the final segment.
  const ah = 12;
  const ax = endX - lux * ah, ay = endY - luy * ah;
  const px = -luy, py = lux;
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(ax + px * ah * 0.55, ay + py * ah * 0.55);
  ctx.lineTo(ax - px * ah * 0.55, ay - py * ah * 0.55);
  ctx.closePath();
  ctx.fill();
}

function drawArrow(ctx, x1, y1, x2, y2, srcR) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len <= srcR * 2) return;
  const ux = dx / len, uy = dy / len;
  const sx = x1 + ux * srcR;
  const sy = y1 + uy * srcR;
  const ex = x2 - ux * (srcR + 4);
  const ey = y2 - uy * (srcR + 4);
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  const ah = 12;
  const ax = ex - ux * ah, ay = ey - uy * ah;
  const px = -uy, py = ux;
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(ax + px * ah * 0.55, ay + py * ah * 0.55);
  ctx.lineTo(ax - px * ah * 0.55, ay - py * ah * 0.55);
  ctx.closePath();
  ctx.fill();
}
