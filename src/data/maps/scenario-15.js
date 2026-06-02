// scenario-15.js — "Two Fronts". 3-faction kingmaker.
// Player in centre-bottom. AI on top-left, Yellow on top-right. The AIs CAN
// reach each other (no wall between them) — they will skirmish if the player
// stays patient. Player wins by letting them weaken each other, then sweeping.

export const MAP = {
  id: 'scenario-15',
  name: 'Two Fronts',
  description: 'Let them fight each other. Then strike.',
  width: 540,
  height: 960,
  nodes: [
    { id: 'P',  x: 270, y: 860, owner: 'player', rank: 'medium' },
    { id: 'n1', x: 120, y: 640, owner: null,     rank: 'light'  },
    { id: 'n2', x: 420, y: 640, owner: null,     rank: 'light'  },
    { id: 'n3', x: 270, y: 470, owner: null,     rank: 'medium' },
    { id: 'A',  x: 130, y: 180, owner: 'ai',     rank: 'medium' },
    { id: 'Y',  x: 410, y: 180, owner: 'yellow', rank: 'medium' },
  ],
  // Brick wall below the AI–Y line forces both factions to skirmish each other
  // before they can effectively reach P. The wall blocks A/Y LOS to P directly,
  // funnelling them into n3 (and each other) first.
  terrainRegions: [
    { type: 'brick', poly: [
      [110, 290], [430, 290], [430, 360], [110, 360],
    ]},
  ],
};
