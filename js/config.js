"use strict";
// Ridge Press · config.js
// Presets, defaults and the current settings (S). Edit WEIGHTS / FADES / MODES / DEFAULT to change the built-in options.

// ---------------------------------------------------------------- state
const WEIGHTS = {
  standard:{thick:0.1, heavy:1.5, grease:1.3, dry:0.5},
  crisp:{thick:-0.28, heavy:0, grease:0, dry:0.9},
  light:{thick:0.1, heavy:0.3, grease:0.35, dry:1.2},
  heavy:{thick:0.3, heavy:2.3, grease:1.9, dry:0.5},
};
const FADES = {
  none:{fmode:"dir", fdir:[1,0], fade:[1.6,2.2]},
  right:{fmode:"dir", fdir:[1,0], fade:[0.25,0.95]},
  left:{fmode:"dir", fdir:[-1,0], fade:[0.25,0.95]},
  up:{fmode:"dir", fdir:[0,-1], fade:[0.25,0.95]},
  down:{fmode:"dir", fdir:[0,1], fade:[0.25,0.95]},
  radial:{fmode:"radial", fdir:[1,0], fade:[0.2,0.95]},
  edges:{fmode:"edges", fdir:[1,0], fade:[0.1,0.7]},
};
const FADE_LABEL = {none:"None", right:"→ Right", left:"← Left", up:"↑ Up", down:"↓ Down", radial:"◎ Radial", edges:"↔ Edges"};
const MODES = {
  negative:{label:"Negative", ink:"#ece5d6", ground:"#1a1715", inkNone:false, groundNone:false},
  positive:{label:"Positive", ink:"#1a1715", ground:"#1a1715", inkNone:false, groundNone:true},
  white:{label:"White ridges", ink:"#efe9dc", ground:"#1a1715", inkNone:false, groundNone:false},
  cutout:{label:"Cut-out", ink:"#ece5d6", ground:"#1a1715", inkNone:true, groundNone:false},
};
const DEFAULT = {
  v:1, w:420, h:420, shape:"schilt", blade:5, tilt:0, margin:24, custom:null,
  kind:"loop", rot:-10, core:[210,300], spiral:0.5, lam:2.9, ax:1.0, ay:1.12,
  thick:0.1, heavy:1.5, grease:1.3, grease_cell:22, dry:0.5, speck:0.18, seed:1,
  fmode:"dir", fdir:[1,0], fade:[0.25,0.95], fcenter:[210,300],
  mode:"negative", ink:"#ece5d6", ground:"#1a1715", paper:"#efe9dc", inkNone:false, groundNone:false, paperNone:false,
};
let S = JSON.parse(JSON.stringify(DEFAULT));
try { const saved = JSON.parse(localStorage.getItem("ridgepress.last") || "null"); if (saved && saved.v === 1) S = {...S, ...saved}; } catch (e) {}
