// Back in the 2000s: The Game — puts the story locations where they really are relative to each other.
// The old map had Chris's house and Schnucks on opposite sides of N Illinois Street, and the high school next door.
// In the real town home and Schnucks are both WEST of Illinois (you reach Illinois on N Belt West, turn left, and the store is on
// your left), and Belleville West is a long drive to the south-west. So, after everything static is built in its old place:
//   PZ  the Schnucks plaza (+ gas station) is turned 180 degrees about a point on Illinois, landing on the other side of the road
//   SZ  the whole school campus is slid out to the south-west
// Compass in game coordinates from here on: +x = north, -x = south, +z = east, -z = west.
// Everything is moved together: meshes, lights, colliders, floors, ramps, map shapes, road names and every {x, z} anchor on G.
import { THREE, G } from './engine.js';
export const PZ = { cx:200, cz:256 }, SZ = { dx:-110, dz:-770 };
export const inPZ = (x, z) => x >= -62 && x <= 262 && z >= 260.5 && z <= 484;
export const inSZ = (x, z) => x <= -114.5 && x >= -345 && ((z >= 56 && z <= 251.9) || (x <= -196 && z >= -14 && z < 56));
// story coordinates (the old map) -> world coordinates; returns [x, z, yawAdd]
export function toWorld(x, z){ return inPZ(x, z) ? [2 * PZ.cx - x, 2 * PZ.cz - z, Math.PI] : inSZ(x, z) ? [x + SZ.dx, z + SZ.dz, 0] : [x, z, 0]; }
const q180 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);

export function relocate(){ const S = G.scene, n = { pz:0, sz:0 };
  for(const o of S.children){ if(o.isDirectionalLight || o.isHemisphereLight || o.isAmbientLight || o === G.sky) continue; const p = o.position;
    if(o.isMesh && o.geometry && (o.geometry.boundingSphere || (o.geometry.computeBoundingSphere(), 1)) && o.geometry.boundingSphere.radius > 300) continue;   // the ground
    if(inPZ(p.x, p.z)){ p.set(2 * PZ.cx - p.x, p.y, 2 * PZ.cz - p.z); o.quaternion.premultiply(q180); n.pz++; }
    else if(inSZ(p.x, p.z)){ p.x += SZ.dx; p.z += SZ.dz; n.sz++; }
    if(o.isDirectionalLight === undefined && o.target && o.target.position){ /* spot lights are not used */ } }
  const seen = new Set(); const rect = r => { const cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2;
    if(inPZ(cx, cz)){ const a = 2 * PZ.cx - r.x1, b = 2 * PZ.cx - r.x0, c = 2 * PZ.cz - r.z1, d = 2 * PZ.cz - r.z0; r.x0 = a; r.x1 = b; r.z0 = c; r.z1 = d; if('ya' in r){ const t = r.ya; r.ya = r.yb; r.yb = t; } return 1; }
    if(inSZ(cx, cz)){ r.x0 += SZ.dx; r.x1 += SZ.dx; r.z0 += SZ.dz; r.z1 += SZ.dz; return 1; } return 0; };
  [G.colliders, G.platforms, G.ramps, G.mapShapes, G.roads || []].forEach(list => list.forEach(r => { rect(r); seen.add(r); }));
  (G.driveways || []).forEach(d => { const [x, z, a] = toWorld(d.x, d.z); d.x = x; d.z = z; d.ry += a; });
  // every plain {x, z} anchor hanging off G (store entrance, check lanes, corrals, classroom seats ...)
  const SKIP = new Set(['scene', 'cam', 'R', 'colliders', 'platforms', 'ramps', 'mapShapes', 'roads', 'driveways', 'ticks', 'npcs', 'inter', 'keys', 'set', 'pad', 'flags', 'T', 'Y89', 'M', 'noVC', 'townRoads', 'detail', 'markers', 'blips', 'sky', 'P', 'CAST']);
  const walk = (v, d) => { if(!v || typeof v !== 'object' || seen.has(v) || d > 5) return; seen.add(v);
    if(v.isObject3D || v.isMaterial || v.isTexture || v.isBufferGeometry || v instanceof Element) return;
    if(Array.isArray(v)){ if(v.length === 3 && v.every(k => typeof k === 'number') && v[1] >= -1 && v[1] <= 12){ const [x, z] = toWorld(v[0], v[2]); v[0] = x; v[2] = z; } else v.forEach(k => walk(k, d + 1)); return; }
    if(typeof v.x0 === 'number' && typeof v.x1 === 'number' && typeof v.z0 === 'number'){ rect(v); }
    else if(typeof v.x === 'number' && typeof v.z === 'number'){ const [x, z, a] = toWorld(v.x, v.z); v.x = x; v.z = z; if(a){ if(typeof v.ry === 'number') v.ry += a; if(typeof v.face === 'number') v.face += a; } }
    for(const k of Object.keys(v)){ if(k === 'mesh') continue; walk(v[k], d + 1); } };
  for(const k of Object.keys(G)) if(!SKIP.has(k)) walk(G[k], 0);
  G.relocated = n; return n; }
