// terrain.js — terrain types + per-rank effect matrix + render palette.
// Sourced from .architecture-audit/balance-proposal-v1.3.md (combat-balance-agent).
// Combat-balance work edits the effects matrix here. Logic stays in model/.

export const TERRAIN_TYPES = ['brick', 'mountain', 'sea', 'sand', 'chasm', 'swamp', 'lava'];

// Per-(terrain, rank) effect. Either { blocked: true } or { speedMul: <number> }.
// speedMul may be > 1.0 (e.g. heavy on brick = 1.1 demolition speed-up). DO NOT clamp.
export const TERRAIN_EFFECTS = {
  brick: {
    light:  { blocked: true },        // bricks are walls; couriers bounce off
    medium: { speedMul: 0.6 },        // bulldozer chunks through, slowly
    heavy:  { speedMul: 1.1 },        // wrecking-ball DEMOLISHES — the gimmick cell
  },
  mountain: {
    light:  { blocked: true },
    medium: { speedMul: 0.55 },
    heavy:  { speedMul: 0.7 },        // momentum carries the ball
  },
  sea: {                              // v1.3: universal block (level-designer hazard, see audit doc §7)
    light:  { blocked: true },
    medium: { blocked: true },
    heavy:  { blocked: true },
  },
  sand: {
    light:  { speedMul: 0.85 },
    medium: { speedMul: 0.75 },
    heavy:  { speedMul: 0.55 },       // wheels/ball sink
  },
  chasm: {
    light:  { blocked: true },
    medium: { blocked: true },
    heavy:  { speedMul: 0.5 },        // drops in, momentum carries it across
  },
  swamp: {
    light:  { speedMul: 0.6 },        // universal slow
    medium: { speedMul: 0.55 },
    heavy:  { speedMul: 0.5 },
  },
  lava: {
    light:  { blocked: true },        // incinerated
    medium: { speedMul: 0.4 },
    heavy:  { speedMul: 0.65 },       // armoured mass
  },
};

// Render palette: fill / stroke / label per terrain.
export const TERRAIN_RENDER = {
  brick:    { fill: 'rgba(165,90,55,0.55)',  stroke: 'rgba(120,60,30,0.85)',  label: 'Brick'    },
  mountain: { fill: 'rgba(110,108,120,0.55)', stroke: 'rgba(70,68,82,0.85)',   label: 'Mountain' },
  sea:      { fill: 'rgba(40,108,180,0.60)',  stroke: 'rgba(20,70,140,0.85)',  label: 'Sea'      },
  sand:     { fill: 'rgba(212,178,90,0.55)',  stroke: 'rgba(170,135,60,0.85)', label: 'Sand'     },
  chasm:    { fill: 'rgba(15,18,28,0.85)',    stroke: 'rgba(60,65,80,0.95)',   label: 'Chasm'    },
  swamp:    { fill: 'rgba(68,110,72,0.55)',   stroke: 'rgba(40,72,46,0.85)',   label: 'Swamp'    },
  lava:     { fill: 'rgba(210,75,40,0.55)',   stroke: 'rgba(160,40,15,0.9)',   label: 'Lava'     },
};

// v1.6: line-of-sight rule. Tall terrain (walls, mountains) blocks LOS — units
// cannot be routed through them REGARDLESS of rank. Sea / sand / swamp / chasm /
// lava are ground-level or below; they don't block sight.
// (Factory bodies also block LOS — handled separately in reachability.js.)
export const TERRAIN_LOS_BLOCKS = {
  brick:    true,
  mountain: true,
  sea:      false,
  sand:     false,
  chasm:    false,
  swamp:    false,
  lava:     false,
};
