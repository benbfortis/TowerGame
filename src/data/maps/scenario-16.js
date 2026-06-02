// scenario-16.js — "Sieve Run". Mass sieve through serial chokes.
// Three brick walls in series create three narrow gates. Yellow sits on a
// flank with sharpshooter loadout (0 factoryDamage but high unit damage)
// chipping units in transit. Heavy loadout (high HP) is the answer.

export const MAP = {
  id: 'scenario-16',
  name: 'Sieve Run',
  description: 'Three gates, snipers on the flank. Bring heavies.',
  width: 540,
  height: 960,
  nodes: [
    { id: 'P',  x: 270, y: 870, owner: 'player', rank: 'heavy'  },
    { id: 'n1', x: 270, y: 700, owner: null,     rank: 'light'  },
    { id: 'n2', x: 270, y: 500, owner: null,     rank: 'medium' },
    { id: 'n3', x: 270, y: 300, owner: null,     rank: 'light'  },
    { id: 'Y',  x: 470, y: 500, owner: 'yellow', rank: 'light'  },
    { id: 'A',  x: 270, y: 110, owner: 'ai',     rank: 'medium' },
  ],
  // Three brick gates in series along the central column. They slow lights
  // but heavies fly through them at 1.1×. Yellow has LOS to the centre lane
  // between gates 2 and 3 — units exposed there get sniped.
  terrainRegions: [
    { type: 'brick', poly: [ [0,   590], [220, 590], [220, 620], [0,   620] ]},
    { type: 'brick', poly: [ [320, 590], [540, 590], [540, 620], [320, 620] ]},
    { type: 'brick', poly: [ [0,   390], [220, 390], [220, 420], [0,   420] ]},
    { type: 'brick', poly: [ [320, 390], [540, 390], [540, 420], [320, 420] ]},
    { type: 'brick', poly: [ [0,   190], [220, 190], [220, 220], [0,   220] ]},
    { type: 'brick', poly: [ [320, 190], [540, 190], [540, 220], [320, 220] ]},
  ],
};
