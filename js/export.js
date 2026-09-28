"use strict";
// Ridge Press · export.js
// Builds the SVG file and saves it; starts the app.

// ---------------------------------------------------------------- export
function buildSVG(){
  const q=+$("quality").value; const res=render(S,q); const {d,count}=traceSVG(res.ink,res.W,res.H,q);
  if(S.inkNone&&S.groundNone) return {svg:null,count:0};
  const sheetD=`M0 0 L${S.w} 0 L${S.w} ${S.h} L0 ${S.h} Z`;
  const groundD=S.shape==="sheet"?sheetD:(S.shape==="custom"?null:shapePath(S));
  let body="";
  if(S.groundNone){
    body=`<path id="ridges" fill="${S.ink}" fill-rule="evenodd" d="${d}"/>`;
  } else if(!S.inkNone){
    const g=groundD?`<path id="ground" d="${groundD}" fill="${S.ground}"/>`:customGround();
    body=g+`<path id="ridges" fill="${S.ink}" fill-rule="evenodd" d="${d}"/>`;
  } else if(groundD){
    // ridges cut out of the ground: one compound path (ground outline + ridge outlines, even-odd)
    body=`<path id="ground-cut" fill="${S.ground}" fill-rule="evenodd" d="${groundD} ${d}"/>`;
  } else {
    body=`<mask id="cut" maskUnits="userSpaceOnUse" x="0" y="0" width="${S.w}" height="${S.h}"><rect width="${S.w}" height="${S.h}" fill="#fff"/><path fill="#000" fill-rule="evenodd" d="${d}"/></mask><g mask="url(#cut)">${customGround()}</g>`;
  }
  const desc=JSON.stringify(recipe()).replace(/&/g,"&amp;").replace(/</g,"&lt;");
  const svg=`<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ${S.w} ${S.h}" width="${S.w}" height="${S.h}"><desc>Ridge Press recipe: ${desc}</desc>${body}</svg>`;
  return {svg,count};
}
function customGround(){ if(!customSvgText) return ""; const pl=customPlacement(S);
  // your own shape, recoloured to the ground colour
  const t=customSvgText.replace(/(fill|stroke)="(?!none)[^"]*"/g,`$1="${S.ground}"`).replace(/^<svg/,`<svg id="ground" fill="${S.ground}" x="${pl.x.toFixed(2)}" y="${pl.y.toFixed(2)}" width="${pl.w.toFixed(2)}" height="${pl.h.toFixed(2)}"`);
  return t; }
function fileName(){ const w=Object.keys(WEIGHTS).find(k=>Object.entries(WEIGHTS[k]).every(([a,b])=>Math.abs(S[a]-b)<1e-9))||"custom";
  const f=Object.keys(FADES).find(k=>{const x=FADES[k]; return S.fmode===x.fmode&&(x.fmode!=="dir"||(S.fdir[0]===x.fdir[0]&&S.fdir[1]===x.fdir[1]))&&(k==="none")===(S.fade[0]>=1.5);})||"fade";
  return `fp_${S.shape}_${S.kind}_${w}_${f}_seed${S.seed}.svg`; }
let downloads=null;
if(window.claude&&window.claude.use){ window.claude.use("downloads").then(d=>{ downloads=d; }).catch(()=>{}); }
$("dl").addEventListener("click",async()=>{
  const btn=$("dl"); btn.disabled=true; toast("Tracing ridges…");
  await new Promise(r=>setTimeout(r,30));
  const {svg,count}=buildSVG(); btn.disabled=false;
  if(!svg){ toast("Nothing to export: ridges and ground are both set to none."); return; }
  if(!downloads){
    // standalone copy (GitHub Pages or a local file): save through a normal browser download
    const url=URL.createObjectURL(new Blob([svg],{type:"image/svg+xml"})), a=document.createElement("a");
    a.href=url; a.download=fileName(); document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),4000);
    toast(`Saved ${fileName()} (${count.toLocaleString()} shapes, ${(svg.length/1048576).toFixed(1)} MB).`); return; }
  try{ await downloads.save({filename:fileName(), data:svg}); toast(`Saved ${fileName()} (${count.toLocaleString()} shapes, ${(svg.length/1048576).toFixed(1)} MB).`); }
  catch(e){ toast(e&&e.code==="declined"?"Download cancelled.":"The download didn’t go through. Use Copy SVG code instead."); }
});
$("copySvg").addEventListener("click",async()=>{
  toast("Tracing ridges…"); await new Promise(r=>setTimeout(r,30));
  const {svg,count}=buildSVG();
  if(!svg){ toast("Nothing to export: ridges and ground are both set to none."); return; }
  const box=$("svgOut"); box.value=svg;
  copyText(svg,`SVG code copied (${count.toLocaleString()} shapes). Paste into a text file saved as .svg, or straight into Illustrator.`, box, true);
});

buildRows(); drawPresets(); showRecipe(); layout(); doRender(liveSS()); setTimeout(()=>{ layout(); doRender(fineSS()); },60);
