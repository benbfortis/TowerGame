// scenario-4.js — "Hold the Pass". Contested-line management.
// Five factories. A central neutral (n2, medium) sits between P and A —
// both will target it. Whoever holds n2 owns the bottleneck. Teaches
// contested lines and the value of capturing a medium for the +2 damage hits.

export const MAP = {
  id: 'scenario-4',
  name: 'Hold the Pass',
  description: 'A medium sits in the middle. Whoever holds it controls the game.',
  width: 540,
  height: 960,
  nodes: [
    { id: 'P',  x: 270, y: 830, owner: 'player', rank: 'light'  },
    { id: 'n1', x: 130, y: 650, owner: null,     rank: 'light'  },
    { id: 'n2', x: 270, y: 500, owner: null,     rank: 'medium' },
    { id: 'n3', x: 410, y: 350, owner: null,     rank: 'light'  },
    { id: 'A',  x: 270, y: 170, owner: 'ai',     rank: 'light'  },
  ],
  // Two organic sea blobs (scenery) frame the contested centre.
  terrainRegions: [
    { type: 'sea', poly: [
      [0, 350], [40, 340], [75, 345], [95, 365], [105, 395],
      [100, 430], [85, 455], [55, 470], [25, 465], [0, 445],
    ]},
    { type: 'sea', poly: [
      [540, 600], [510, 595], [480, 605], [465, 625], [460, 655],
      [470, 685], [495, 700], [525, 695], [540, 670],
    ]},
  ],
};
