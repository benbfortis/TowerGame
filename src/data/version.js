// version.js — single source of truth for the project version string.
//
// BINDING PROJECT RULE (see CLAUDE.md §0 "Version display"):
//   - This value must be visible in the bottom-right of every screen in the running app.
//   - Bump on every meaningful change so a screenshot can confirm a new build landed.
//   - Every agent finishing a piece of work must also display this version at the bottom
//     of its user-facing reply.

export const VERSION = '1.25';
export const VERSION_LABEL = 'v' + VERSION;
