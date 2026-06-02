// scenario-14.js — "Sharpshot Alley". Ranged bottleneck.
// Yellow (sharpshooter loadout) sits on a parallel ridge with LOS down the
// main approach. Player units running the central corridor are visible to
// Yellow's sharpshooters. The clever route hugs the left wall behind a mountain
// strip that breaks Yellow's LOS to the lane.

export const MAP = {
  id: 'scenario-14',
  name: 'Sharpshot Alley',
  description: 'Yellow snipers watch the lane. Stay out of sight.',
  width: 540,
  height: 960,
  nodes: [
    { id: 'P',  x: 270, y: 850, owner: 'player', rank: 'light'  },
    { id: 'n1', x: 130, y: 620, owner: null,     rank: 'light'  },
    { id: 'n2', x: 270, y: 450, owner: null,     rank: 'medium' },
    { id: 'Y',  x: 460, y: 460, owner: 'yellow', rank: 'light'  },
    { id: 'A',  x: 270, y: 150, owner: 'ai',     rank: 'light'  },
  ],
  // Long mountain strip on the LEFT of n1 → n2 blocks LOS between Yellow and
  // the left-flank route. Player who routes left avoids the sniper kill zone.
  terrainRegions: [
    { type: 'mountain', poly: [
      [200, 420], [350, 420], [350, 720], [200, 720],
    ]},
  ],
};
