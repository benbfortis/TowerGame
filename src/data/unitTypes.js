// unitTypes.js — per-unit-type overrides. v1 ships only 'standard';
// future types (tank, scout, bomber) add entries here with their own
// { speed, radius, damage, hp }. Logic in model/units.js reads via
// UNIT_TYPES[u.type] and falls back to state.config defaults for any
// unset field. Combat-balance-agent territory once multiple types exist.

export const UNIT_TYPES = {
  standard: {
    // v1: omitted fields fall back to state.config.* defaults.
    // Add { speed, radius, damage, hp } here when this type diverges.
  },
};
