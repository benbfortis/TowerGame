// scenario-24.js — "Chess Match". Backdoor + risk-reward, 3-faction.
// Player vs AI front-and-centre; Yellow flank-spoiler. A mountain wall hides
// a long backdoor route into the AI base. Player must decide: push the short
// brick-walled front (where Yellow can hit them) or take the long backdoor
// (slow, but unwatched). Yellow patrols the contested front.

export const MAP = {
  id: 'scenario-24',
  name: 'Chess Match',
  description: 'Short front, long backdoor. Yellow watches.',
  width: 540,
  height: 960,
  nodes: [
    { id: 'P',  x: 270, y: 870, owner: 'player', rank: 'medium' },
    { id: 'n1', x: 130, y: 720, owner: null,     rank: 'light'  }, // backdoor entry
    { id: 'n2', x: 60,  y: 480, owner: null,     rank: 'light'  }, // backdoor mid
    { id: 'n3', x: 130, y: 230, owner: null,     rank: 'medium' }, // backdoor exit (close to A)
    { id: 'n4', x: 330, y: 600, owner: null,     rank: 'medium' }, // short-front gate
    { id: 'Y',  x: 460, y: 480, owner: 'yellow', rank: 'medium' },
    { id: 'A',  x: 350, y: 200, owner: 'ai',     rank: 'medium' },
  ],
  // Mountain wedge in the centre hides the backdoor route from Y and A LOS.
  // Brick band on the right narrows the short front; lights take it slowly.
  terrainRegions: [
    { type: 'mountain', poly: [
      [200, 350], [320, 350], [320, 620], [200, 620],
    ]},
    { type: 'brick', poly: [
      [380, 350], [540, 350], [540, 420], [380, 420],
    ]},
  ],
};
