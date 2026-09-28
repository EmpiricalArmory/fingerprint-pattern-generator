"use strict";
// Ridge Press · shapes.js
// Built-in silhouettes (schilt, sheet, rounded square, circle) and placement of an uploaded SVG.

// ---------------------------------------------------------------- shapes (in canvas units)
function schiltPath(P){
  // your photo's schilt (blade width = 1): flat guard end, straight flaring sides, square shoulders,
  // a concave fillet into a straight parallel blade.
  const gw=1.3, sw=1.8, L=2.8, fr=0.45, bw=0.5, Lb=P.blade;
  const half=[[0,gw],[L,sw],[L,bw+fr]];
  for(let a=180;a<=270;a+=10){const r=a*Math.PI/180; half.push([L+fr+fr*Math.cos(r), bw+fr+fr*Math.sin(r)]);}
  half.push([L+Lb,bw]);
  const pts=[...half.map(([u,v])=>[u,-v]), ...half.slice().reverse().map(([u,v])=>[u,v])];
  const total=L+Lb, m=P.margin;
  const s=Math.min((P.h-2*m)/total,(P.w-2*m)/(2*sw));
  const t=P.tilt*Math.PI/180, cx=P.w/2, cy=P.h/2, uc=total/2;
  return "M"+pts.map(([u,v])=>{ const x=v*s, y=-(u-uc)*s; return [(cx+x*Math.cos(t)-y*Math.sin(t)).toFixed(2),(cy+x*Math.sin(t)+y*Math.cos(t)).toFixed(2)].join(" "); }).join(" L")+" Z";
}
function shapePath(P){
  const m=P.margin, W=P.w, H=P.h;
  if(P.shape==="sheet") return `M-30 -30 L${W+30} -30 L${W+30} ${H+30} L-30 ${H+30} Z`;
  if(P.shape==="schilt") return schiltPath(P);
  if(P.shape==="circle"){const r=Math.min(W,H)/2-m, cx=W/2, cy=H/2; return `M${cx-r} ${cy} A${r} ${r} 0 1 0 ${cx+r} ${cy} A${r} ${r} 0 1 0 ${cx-r} ${cy} Z`;}
  if(P.shape==="square"){const x0=m,y0=m,x1=W-m,y1=H-m,r=Math.min(W,H)*0.12; return `M${x0+r} ${y0} L${x1-r} ${y0} Q${x1} ${y0} ${x1} ${y0+r} L${x1} ${y1-r} Q${x1} ${y1} ${x1-r} ${y1} L${x0+r} ${y1} Q${x0} ${y1} ${x0} ${y1-r} L${x0} ${y0+r} Q${x0} ${y0} ${x0+r} ${y0} Z`;}
  return null;
}
let customImg=null, customSvgText=null, customBox=null;   // custom silhouette, rasterised through an <img>
function customPlacement(P){
  if(!customBox) return null;
  const m=P.margin, s=Math.min((P.w-2*m)/customBox.w,(P.h-2*m)/customBox.h);
  const w=customBox.w*s, h=customBox.h*s; return {x:(P.w-w)/2, y:(P.h-h)/2, w, h};
}
