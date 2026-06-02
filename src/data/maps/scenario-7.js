// scenario-7.js — "Outnumbered". Asymmetric start.
// Player has one light base. AI starts with TWO factories (a light and a medium).
// A central mountain forces routing — Player must capture the side neutral
// quickly to match AI throughput before the AI medium drowns them.

export const MAP = {
  id: 'scenario-7',
  name: 'Outnumbered',
  description: 'Two enemy factories vs your one. Move fast.',
  width: 540,
  height: 960,
  nodes: [
    { id: 'P',  x: 270, y: 850, owner: 'player', rank: 'light'  },
    { id: 'n1', x: 100, y: 600, owner: null,     rank: 'medium' },
    { id: 'n2', x: 440, y: 600, owner: null,     rank: 'light'  },
    { id: 'A1', x: 170, y: 170, owner: 'ai',     rank: 'medium' },
    { id: 'A2', x: 380, y: 250, owner: 'ai',     rank: 'light'  },
  ],
  // Central mountain blocks light traffic through the middle (light is
  // blocked by mountain). Forces both player and AI to the flanks.
  terrainRegions: [
    { type: 'mountain', poly: [
      [180, 380], [360, 380], [360, 540], [180, 540],
    ]},
  ],
};
