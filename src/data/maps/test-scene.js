// test-scene.js — the v1.6 6-factory column-layout test scene.
// Used during development to exercise the LOS rule (P↔A blocked by intervening
// factories), population mechanic, contested lines, and forwarding. v1.10:
// added an organic-shape sea region on the left edge so the renderer's sea
// blob style can be eyeballed without launching a scenario.
//
// See ARCHITECTURE / data/map.js for the schema.

export const MAP = {
  id: 'test',
  name: 'Test Scene',
  description: 'Sandbox — 6-factory column for rules verification (LOS, pop, chains, contested lines).',
  width: 540,
  height: 960,

  nodes: [
    { id: 'P',  x: 270, y: 850, owner: 'player', rank: 'light'  },
    { id: 'n1', x: 150, y: 700, owner: null,     rank: 'light'  },
    { id: 'n2', x: 390, y: 700, owner: null,     rank: 'light'  },
    { id: 'n3', x: 270, y: 480, owner: null,     rank: 'heavy'  },
    { id: 'n4', x: 270, y: 270, owner: null,     rank: 'medium' },
    { id: 'A',  x: 270, y: 110, owner: 'ai',     rank: 'light'  },
  ],

  // v1.10: organic-shape sea (~19 vertices, blob-style) along the left edge.
  // Doesn't bisect any LOS path between factories; pure scenery for now.
  terrainRegions: [
    { type: 'sea', poly: [
      [0, 380], [38, 365], [78, 358], [114, 360], [142, 372],
      [168, 392], [188, 418], [200, 448], [202, 480], [194, 514],
      [178, 544], [156, 564], [128, 572], [96, 568], [66, 556],
      [40, 538], [18, 514], [4, 480], [0, 440],
    ]},
  ],
};
