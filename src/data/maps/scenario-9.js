// scenario-9.js — "Backdoor Path". Pathfinding-only route.
// A mountain wall sits directly between P and A. Lights are BLOCKED by mountain
// unless the player picked Scout (which pathfinds). Default loadout (worker)
// must route via the long flank through n1 and n2. AI takes the same detour.

export const MAP = {
  id: 'scenario-9',
  name: 'Backdoor Path',
  description: 'The direct path is blocked. Find the way around.',
  width: 540,
  height: 960,
  nodes: [
    { id: 'P',  x: 270, y: 830, owner: 'player', rank: 'light'  },
    { id: 'n1', x: 470, y: 700, owner: null,     rank: 'light'  },
    { id: 'n2', x: 470, y: 300, owner: null,     rank: 'medium' },
    { id: 'A',  x: 270, y: 130, owner: 'ai',     rank: 'light'  },
  ],
  // Big mountain block straight between P and A — light worker must go around
  // the right edge. (Scout-loadout players can pathfind across mountain cells.)
  terrainRegions: [
    { type: 'mountain', poly: [
      [80,  350], [400, 350], [400, 620], [80,  620],
    ]},
  ],
};
