// scenario-8.js — "Quick Strike". Race-to-Centre.
// A heavy neutral sits dead centre, equidistant from P and A. Whoever lands
// the first medium-or-heavier on it captures it. A brick wall on each side
// forces both routes through the open centre lane.

export const MAP = {
  id: 'scenario-8',
  name: 'Quick Strike',
  description: 'A heavy prize in the centre. First to land wins it.',
  width: 540,
  height: 960,
  nodes: [
    { id: 'P',  x: 270, y: 860, owner: 'player', rank: 'medium' },
    { id: 'n1', x: 270, y: 500, owner: null,     rank: 'heavy'  },
    { id: 'A',  x: 270, y: 140, owner: 'ai',     rank: 'medium' },
  ],
  // Two brick walls hug the side edges to make the centre lane the only
  // sensible route — and to block light LOS round the flanks.
  terrainRegions: [
    { type: 'brick', poly: [
      [0,   320], [160, 320], [160, 680], [0,   680],
    ]},
    { type: 'brick', poly: [
      [380, 320], [540, 320], [540, 680], [380, 680],
    ]},
  ],
};
