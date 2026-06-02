// loadouts.js — default L/M/H unit assignment per owner.
// Player loadout is mutated by the pre-combat selection screen (ui/loadout.js).
// AI loadout is fixed for v1.3 (a slot to expose to a difficulty/profile menu later).

// v1.21: four factions. 'player' is always the human; 'ai', 'yellow', 'green'
// are AI-controlled. Scenarios may use any subset.
export const DEFAULT_LOADOUTS = {
  player: {
    light:  'worker',
    medium: 'bulldozer',
    heavy:  'demolitionBall',
  },
  ai: {
    light:  'scout',
    medium: 'sapper',
    heavy:  'siegeTank',
  },
  yellow: {
    light:  'sharpshooter',
    medium: 'mortar',
    heavy:  'artillery',
  },
  green: {
    light:  'worker',
    medium: 'bulldozer',
    heavy:  'demolitionBall',
  },
};

// Factions other than 'player' are AI-controlled. tickAi processes them all.
export const AI_FACTIONS = ['ai', 'yellow', 'green'];
