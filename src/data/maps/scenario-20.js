// scenario-20.js — "Cross Hairs". Yellow spoiler.
// Player at bottom centre. AI top-left, Yellow on the right flank. Yellow is
// designed to wildcard — they have LOS to both A and P. The player who threatens
// to win first attracts Yellow's attention. Smart play uses Yellow as a swing.

export const MAP = {
  id: 'scenario-20',
  name: 'Cross Hairs',
  description: 'Yellow flips on the leader. Play second.',
  width: 540,
  height: 960,
  nodes: [
    { id: 'P',  x: 270, y: 860, owner: 'player', rank: 'medium' },
    { id: 'n1', x: 140, y: 660, owner: null,     rank: 'light'  },
    { id: 'n2', x: 270, y: 500, owner: null,     rank: 'medium' },
    { id: 'A',  x: 140, y: 200, owner: 'ai',     rank: 'medium' },
    { id: 'Y',  x: 450, y: 500, owner: 'yellow', rank: 'medium' },
  ],
  // Mountain wall between A and Y so they don't auto-shoot each other —
  // Yellow's targets are P and the central contested n2. Mountain LOS-blocks
  // a direct Y→A line, forcing them onto whichever player is weaker.
  terrainRegions: [
    { type: 'mountain', poly: [
      [250, 250], [380, 250], [380, 450], [250, 450],
    ]},
  ],
};
