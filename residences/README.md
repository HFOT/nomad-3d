# CARAKURI residential architecture — CORN

Four independent, animated stone residences and a rebuildable aerial flame network.
Open `http://127.0.0.1:8846/residences/` after `npm start`.

The small, standard, large and whale houses use different architectural compositions.
Stone walls contain real arch openings, rear and side elevations, closed roof decks,
service piers and lanterns. The whale house has two-storey arcades. The stone surface
comes directly from `stoneMaterial()` in `vault/materials.js`: the same texture,
`#b6aa92` tint, roughness and bump surface as the Grand Flame Treasury. Individual
courses have small tonal variations. Holder thresholds remain deliberately unset.

## Portable assets

`world/residence-kit/CORN-residence-{small,standard,large,whale}.glb` contains a
complete local-origin house, embedded stone texture and a 24-second `Clockwork`
animation. The 20/12-tooth gear pair shares an involute profile module and turns at
opposite, tooth-count-proportional speeds. Creator metadata is CORN.

`CORN-aerial-network.glb` is the separate example network. `connections.json`
records its positions and directed graph; `validation.json` records asset checks.

These residences are the town's housing stock: `town/residence-quarter.js` finds
their lots against the real street network, canals and landmark grounds, then runs
the same planner to the town's Treasury Vault. This page stays the construction and
reuse viewer for the kit itself.

## Connection contract

- Metres, Y up, front toward local +Z. Place house roots without rescaling.
- Each named `PORT_FLAME_n` node is a connection centre with local +Y outward axis.
- Shared type `flame-DN440`, outer model radius 0.22 m; the main radius is 0.36 m.
  These are fictional world dimensions, not real heating specifications.
- The first three houses have one port; the whale house has three. Preserve these
  nodes and the root `footprint`, `maxHeight` and `portStandard` extras on import.
- After any addition, translation, rotation or removal, regenerate the network.
  A GLB by itself does not execute automatic routing.

```js
import {buildResidence} from './model.js';
import {planNetwork, buildNetwork} from './network.js';
const house = buildResidence(1);
house.root.position.set(20, 0, 12);
house.root.rotation.y = Math.PI / 2;
const plan = planNetwork([house], [9.4, 7.8, -32.7]);
const network = buildNetwork(plan);
scene.add(house.root, network.root);
// In the frame loop: house.tick(seconds); network.tick(seconds);
```

For an imported GLB, use its root extras and collect `PORT_FLAME_*` children to form
`{root, ports, maxHeight}` for `planNetwork`. Play its `Clockwork` clip with a mixer.

The planner builds a directed tree to a real sink coordinate. World-space ports
are recalculated after transforms. A common overhead plane clears all supplied
house bounds; square-grid routing supports branches and elbows. `spineZ` optionally
reserves a common street corridor (8 m in the example); omit it for nearby joins.
`obstacles` accepts world `{min:[x,y,z], max:[x,y,z]}` boxes for taller structures.
`buildNetwork` takes an optional `{supportOk(x,z)}` predicate: return false where a
ground pier may not stand (a canal, a carriageway) and that node carries no support.
Intersecting lots, blocked outlets and unrouteable mains throw errors and the viewer
restores the previous house placement. Lots are compared as the rotated rectangles
they are, so a terrace along a diagonal street is not a false overlap. Do not overlap
homes, scale them, or silently omit real world obstacles. The search has a bounded 16-cell margin; an unreachable placement needs
a different service corridor or a larger planning region. Stone piers and arch
bracing are visual game structures, not engineering load calculations.

## Verification and regeneration

`node tests/residence-kit.mjs` exercises rotations, relocation, addition, overlap
rejection and blocked routes, then regenerates and validates the five GLBs.
`npm run check` checks shipped modules; `npm run build` includes the viewer and assets.
The Node-only raster adapter writes the same deterministic stone texture into GLBs.
GLB retains the base-color stone texture and PBR roughness; Three.js bump mapping is
viewer-specific because glTF does not store its bump-map field.
