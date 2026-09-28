"use strict";
// Ridge Press · ui.js
// Controls, preview, zoom, drag-to-move, presets, colour and reset buttons.

// ---------------------------------------------------------------- UI
const $=(id)=>document.getElementById(id);
const view=$("view"), vctx=view.getContext("2d");
function chipGroup(el, items, isOn, onPick){
  el.innerHTML=""; for(const [key,label] of items){ const b=document.createElement("button"); b.type="button"; b.className="chip"; b.textContent=label;
    b.setAttribute("aria-pressed", isOn(key)?"true":"false"); b.addEventListener("click",()=>onPick(key)); el.appendChild(b); }
}
function sliderRow(parent, key, label, min, max, step, get, set, def){
  const row=document.createElement("div"); row.className="row";
  const id="r_"+key; row.innerHTML=`<label for="${id}n">${label}</label><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" aria-label="${label}"><input type="number" id="${id}n" min="${min}" max="${max}" step="${step}"><button class="rst" type="button" title="Reset ${label}" aria-label="Reset ${label}">↺</button>`;
  parent.appendChild(row);
  const r=row.children[1], n=row.children[2];
  row.children[3].addEventListener("click",()=>{ set(def()); sync(); changed(); });
  const sync=()=>{ r.value=get(); n.value=+(+get()).toFixed(3); };
  r.addEventListener("input",()=>{ set(+r.value); n.value=r.value; changed(); });
  n.addEventListener("change",()=>{ if(n.value==="") return; set(+n.value); r.value=n.value; changed(); });
  syncers.push(sync);
}
const syncers=[];
function buildRows(){
  syncers.length=0;
  const pr=$("patternRows"); pr.innerHTML="";
  sliderRow(pr,"rot","rotation °",-180,180,1,()=>S.rot,v=>S.rot=v,()=>DEFAULT.rot);
  sliderRow(pr,"lam","ridge spacing",1.2,12,0.1,()=>S.lam,v=>S.lam=v,()=>DEFAULT.lam);
  sliderRow(pr,"cx","centre x",-200,S.w+200,1,()=>S.core[0],v=>S.core[0]=v,()=>DEFAULT.core[0]);
  sliderRow(pr,"cy","centre y",-200,S.h+200,1,()=>S.core[1],v=>S.core[1]=v,()=>DEFAULT.core[1]);
  if(S.kind==="whorl") sliderRow(pr,"spiral","spiral",0,3,0.05,()=>S.spiral,v=>S.spiral=v,()=>DEFAULT.spiral);
  sliderRow(pr,"ax","stretch across",0.5,2.5,0.01,()=>S.ax,v=>S.ax=v,()=>DEFAULT.ax);
  sliderRow(pr,"ay","stretch along",0.5,2.5,0.01,()=>S.ay,v=>S.ay=v,()=>DEFAULT.ay);
  const ir=$("inkRows"); ir.innerHTML="";
  sliderRow(ir,"thick","thick",-0.8,0.8,0.01,()=>S.thick,v=>S.thick=v,()=>DEFAULT.thick);
  sliderRow(ir,"heavy","heavy",0,3.5,0.05,()=>S.heavy,v=>S.heavy=v,()=>DEFAULT.heavy);
  sliderRow(ir,"grease","grease",0,3,0.05,()=>S.grease,v=>S.grease=v,()=>DEFAULT.grease);
  sliderRow(ir,"gcell","grease size",6,80,1,()=>S.grease_cell,v=>S.grease_cell=v,()=>DEFAULT.grease_cell);
  sliderRow(ir,"dry","dry",0,2.5,0.05,()=>S.dry,v=>S.dry=v,()=>DEFAULT.dry);
  sliderRow(ir,"speck","specks",0,1,0.01,()=>S.speck,v=>S.speck=v,()=>DEFAULT.speck);
  const fr=$("fadeRows"); fr.innerHTML="";
  sliderRow(fr,"f0","fade start",0,1.6,0.01,()=>S.fade[0],v=>S.fade[0]=v,()=>fadeDefault()[0]);
  sliderRow(fr,"f1","fade end",0.05,2.2,0.01,()=>S.fade[1],v=>S.fade[1]=v,()=>fadeDefault()[1]);
  if(S.fmode==="radial"){ sliderRow(fr,"fcx","fade centre x",0,S.w,1,()=>S.fcenter[0],v=>S.fcenter[0]=v,()=>DEFAULT.fcenter[0]); sliderRow(fr,"fcy","fade centre y",0,S.h,1,()=>S.fcenter[1],v=>S.fcenter[1]=v,()=>DEFAULT.fcenter[1]); }
  const se=$("shapeExtra"); se.innerHTML="";
  const num=(key,label,min,max,step,get,set)=>{ const f=document.createElement("div"); f.className="field"; f.innerHTML=`<label for="s_${key}">${label} <button class="rst" type="button" aria-label="Reset ${label}">↺</button></label><input class="txt" type="number" id="s_${key}" min="${min}" max="${max}" step="${step}">`;
    const i=f.querySelector("input"); i.value=get(); i.addEventListener("change",()=>{ set(+i.value); changed(); });
    f.querySelector(".rst").addEventListener("click",(e)=>{ e.preventDefault(); set(DEFAULT[key]); i.value=get(); changed(); }); se.appendChild(f); };
  if(S.shape==="schilt"){ num("blade","blade length (× width)",1,30,0.5,()=>S.blade,v=>S.blade=v); num("tilt","tilt °",-90,90,1,()=>S.tilt,v=>S.tilt=v); }
  if(S.shape!=="sheet") num("margin","margin",0,200,1,()=>S.margin,v=>S.margin=v);
  syncAll();
}
function fadeDefault(){ const k=Object.keys(FADES).find(k=>{const f=FADES[k]; return k!=="none"&&S.fmode===f.fmode&&(f.fmode!=="dir"||(S.fdir[0]===f.fdir[0]&&S.fdir[1]===f.fdir[1]));}); return [...(FADES[k||"right"].fade)]; }
function syncAll(){
  for(const f of syncers) f();
  $("cw").value=S.w; $("ch").value=S.h; $("seed").value=S.seed; $("seedRange").value=Math.min(999,S.seed);
  chipGroup($("shapeChips"),[["schilt","Schilt"],["sheet","Sheet"],["square","Rounded square"],["circle","Circle"],["custom","My shape"]],k=>S.shape===k,k=>{S.shape=k; $("customBox").hidden=k!=="custom"; buildRows(); changed();});
  $("customBox").hidden=S.shape!=="custom";
  chipGroup($("kindChips"),[["loop","Loop"],["whorl","Whorl"],["arch","Arch"]],k=>S.kind===k,k=>{S.kind=k; buildRows(); changed();});
  const wOn=k=>Object.entries(WEIGHTS[k]).every(([a,b])=>Math.abs(S[a]-b)<1e-9);
  chipGroup($("weightChips"),Object.keys(WEIGHTS).map(k=>[k,k[0].toUpperCase()+k.slice(1)]),wOn,k=>{Object.assign(S,WEIGHTS[k]); syncAll(); changed();});
  const fOn=k=>{const f=FADES[k]; return S.fmode===f.fmode&&(f.fmode!=="dir"||(S.fdir[0]===f.fdir[0]&&S.fdir[1]===f.fdir[1]))&&(k==="none"?S.fade[0]>=1.5:(k!=="none"&&S.fade[0]<1.5)); };
  chipGroup($("fadeChips"),Object.keys(FADES).map(k=>[k,FADE_LABEL[k]]),fOn,k=>{const f=FADES[k]; S.fmode=f.fmode; S.fdir=[...f.fdir]; S.fade=[...f.fade]; buildRows(); changed();});
  chipGroup($("modeChips"),[...Object.entries(MODES).map(([k,v])=>[k,v.label]),["custom","Custom"]],k=>S.mode===k,k=>{S.mode=k; if(MODES[k]){ const m=MODES[k]; S.ink=m.ink; S.ground=m.ground; S.inkNone=m.inkNone; S.groundNone=m.groundNone; } syncAll(); showRecipe(); paint();});
  for(const k of ["ink","ground","paper"]){ $(k+"Col").value=S[k]; $(k+"None").checked=!!S[k+"None"]; $(k+"Col").disabled=!!S[k+"None"]; }
}
function recipe(){ const r={...S}; delete r.custom; return r; }
function showRecipe(){ $("recipe").value=JSON.stringify(recipe()); try{ localStorage.setItem("ridgepress.last", JSON.stringify(recipe())); }catch(e){} }

// ---------------------------------------------------------------- rendering loop
let last=null, timer=null, pending=false;
let zoom=null;                               // null = fit to the stage; otherwise screen px per unit
function fitScale(){ const st=$("stage"); return Math.max(0.05, Math.min((st.clientWidth-36)/S.w, (st.clientHeight-36)/S.h)); }
function scale(){ return zoom||fitScale(); }
function layout(){
  const k=scale(), wr=$("wrap"); wr.style.width=(S.w*k)+"px"; wr.style.height=(S.h*k)+"px";
  $("zVal").textContent=zoom?Math.round(k*100)+"%":"fit "+Math.round(k*100)+"%"; placeDots();
}
function liveSS(){ return Math.min(2, Math.sqrt(260000/(S.w*S.h))); }
function fineSS(){ const want=scale()*(window.devicePixelRatio||1); return Math.max(0.5, Math.min(4, want, Math.sqrt(4200000/(S.w*S.h)))); }
function doRender(SSv){ const t0=performance.now(); last=render(S,SSv); last.ms=performance.now()-t0; paint(); }
function zoomTo(k, cx, cy){
  const st=$("stage"), old=scale(); const r=st.getBoundingClientRect();
  const px=(cx??r.width/2), py=(cy??r.height/2);
  const ux=(st.scrollLeft+px-18)/old, uy=(st.scrollTop+py-18)/old;
  zoom=k===null?null:Math.max(0.1,Math.min(40,k)); layout();
  if(zoom){ st.scrollLeft=ux*zoom+18-px; st.scrollTop=uy*zoom+18-py; }
  clearTimeout(timer); timer=setTimeout(()=>doRender(fineSS()),250);
}
$("zIn").addEventListener("click",()=>zoomTo(scale()*1.5));
$("zOut").addEventListener("click",()=>zoomTo(scale()/1.5));
$("zFit").addEventListener("click",()=>zoomTo(null));
$("z100").addEventListener("click",()=>zoomTo(1));
$("stage").addEventListener("wheel",e=>{ if(!(e.ctrlKey||e.metaKey)) return; e.preventDefault(); const r=$("stage").getBoundingClientRect(); zoomTo(scale()*Math.exp(-e.deltaY*0.0022), e.clientX-r.left, e.clientY-r.top); },{passive:false});
new ResizeObserver(()=>{ layout(); }).observe($("stage"));
function changed(){
  showRecipe();
  if(!pending){ pending=true; requestAnimationFrame(()=>{ pending=false; doRender(liveSS()); }); }
  clearTimeout(timer); timer=setTimeout(()=>doRender(fineSS()),350);
}
function hex(h){ const n=parseInt(h.slice(1),16); return [n>>16&255,n>>8&255,n&255]; }
function paint(){
  if(!last) return; const {ink,W,H,raw}=last;
  if(view.width!==W||view.height!==H){ view.width=W; view.height=H; }
  const img=vctx.createImageData(W,H), d=img.data;
  const pc=[...hex(S.paper),S.paperNone?0:255], ic=[...hex(S.ink),255], gc=[...hex(S.ground),255];
  for(let i=0;i<W*H;i++){ let c=pc; if(!S.groundNone&&raw[i]>127) c=gc; if(ink[i]) c=S.inkNone?(S.groundNone?c:pc):ic; d[i*4]=c[0]; d[i*4+1]=c[1]; d[i*4+2]=c[2]; d[i*4+3]=c[3]; }
  vctx.putImageData(img,0,0); layout();
  $("status").textContent=`${S.w}×${S.h} pt · ${S.kind} · seed ${S.seed} · ${last.ms.toFixed(0)} ms`;
  placeDots();
}
function placeDots(){
  const k=scale();
  const cd=$("coreDot"); cd.hidden=false; cd.style.left=(S.core[0]*k)+"px"; cd.style.top=(S.core[1]*k)+"px";
  const fd=$("fadeDot"); fd.hidden=S.fmode!=="radial"; fd.style.left=(S.fcenter[0]*k)+"px"; fd.style.top=(S.fcenter[1]*k)+"px";
}
let dragging=null;
view.addEventListener("pointerdown",e=>{ dragging=e.shiftKey?"fade":"core"; view.setPointerCapture(e.pointerId); moveTo(e); });
view.addEventListener("pointermove",e=>{ if(dragging) moveTo(e); });
view.addEventListener("pointerup",()=>{ dragging=null; });
function moveTo(e){ const r=view.getBoundingClientRect(), x=(e.clientX-r.left)/r.width*S.w, y=(e.clientY-r.top)/r.height*S.h;
  if(dragging==="fade"){ S.fcenter=[Math.round(x),Math.round(y)]; if(S.fmode!=="radial"){ const f=FADES.radial; S.fmode="radial"; S.fade=[...f.fade]; buildRows(); } }
  else S.core=[Math.round(x),Math.round(y)];
  syncAll(); changed(); }

// ---------------------------------------------------------------- controls
$("cw").addEventListener("change",()=>{ S.w=Math.max(60,Math.min(1600,+$("cw").value||420)); buildRows(); changed(); });
$("ch").addEventListener("change",()=>{ S.h=Math.max(60,Math.min(1600,+$("ch").value||420)); buildRows(); changed(); });
$("seed").addEventListener("change",()=>{ S.seed=Math.max(0,Math.round(+$("seed").value||0)); syncAll(); changed(); });
$("seedRange").addEventListener("input",()=>{ S.seed=+$("seedRange").value; $("seed").value=S.seed; changed(); });
$("dice").addEventListener("click",()=>{ S.seed=1+Math.floor(Math.random()*9999); syncAll(); changed(); });
for(const key of ["ink","ground","paper"]){
  $(key+"Col").addEventListener("input",()=>{ S[key]=$(key+"Col").value; if(key!=="paper") S.mode="custom"; syncAll(); showRecipe(); paint(); });
  $(key+"None").addEventListener("change",()=>{ S[key+"None"]=$(key+"None").checked; if(key!=="paper") S.mode="custom"; syncAll(); showRecipe(); paint(); });
}
document.querySelectorAll("[data-col]").forEach(b=>b.addEventListener("click",()=>{ const k=b.dataset.col; const m=MODES[S.mode]||MODES[DEFAULT.mode];
  if(k==="paper"){ S.paper=DEFAULT.paper; S.paperNone=false; } else { S[k]=m[k]; S[k+"None"]=m[k+"None"]; }
  syncAll(); showRecipe(); paint(); }));
document.querySelectorAll("[data-one]").forEach(b=>b.addEventListener("click",(e)=>{ e.preventDefault(); const k=b.dataset.one; S[k]=DEFAULT[k]; buildRows(); changed(); }));
$("seedReset").addEventListener("click",()=>{ S.seed=DEFAULT.seed; syncAll(); changed(); });
const SECTIONS={
  shape:["shape","w","h","blade","tilt","margin"],
  pattern:["kind","rot","core","spiral","lam","ax","ay"],
  ink:["thick","heavy","grease","grease_cell","dry","speck","seed"],
  fade:["fmode","fdir","fade","fcenter"],
  colour:["mode","ink","ground","paper","inkNone","groundNone","paperNone"],
};
document.querySelectorAll("[data-reset]").forEach(b=>b.addEventListener("click",()=>{ for(const k of SECTIONS[b.dataset.reset]) S[k]=JSON.parse(JSON.stringify(DEFAULT[k])); buildRows(); changed(); toast("Reset "+b.dataset.reset+"."); }));

function toast(t){ $("toast").textContent=t; clearTimeout(toast.t); toast.t=setTimeout(()=>$("toast").textContent="",4000); }
function copyText(text, okMsg, fallbackEl, reveal){
  const done=()=>{ toast(okMsg); if(reveal&&fallbackEl) fallbackEl.hidden=true; };
  if(reveal&&fallbackEl) fallbackEl.hidden=false;
  try{ navigator.clipboard.writeText(text).then(done,()=>{ if(fallbackEl){ fallbackEl.focus(); fallbackEl.select(); toast("Copy was blocked here. The text is selected: press ⌘C / Ctrl+C."); } }); }
  catch(e){ if(fallbackEl){ fallbackEl.focus(); fallbackEl.select(); } toast("Copy was blocked here. The text is selected: press ⌘C / Ctrl+C."); }
}
$("copyRecipe").addEventListener("click",()=>copyText($("recipe").value,"Recipe copied.",$("recipe")));
$("applyRecipe").addEventListener("click",()=>{ try{ const r=JSON.parse($("recipe").value); S={...DEFAULT,...r}; if(S.shape==="custom"&&!customImg) toast("Recipe applied. Load your shape again to see it."); else toast("Recipe applied."); buildRows(); changed(); }catch(e){ toast("That isn’t a valid recipe. Paste the whole text copied from “Copy recipe”."); } });

// presets (this browser only)
function loadPresets(){ try{ return JSON.parse(localStorage.getItem("ridgepress.presets")||"{}"); }catch(e){ return {}; } }
function savePresets(p){ try{ localStorage.setItem("ridgepress.presets",JSON.stringify(p)); }catch(e){ toast("This browser won’t store presets. Copy the recipe instead."); } }
function drawPresets(){ const p=loadPresets(), el=$("presetList"); el.innerHTML="";
  for(const name of Object.keys(p)){ const w=document.createElement("span"); w.className="preset";
    const b=document.createElement("button"); b.type="button"; b.textContent=name; b.addEventListener("click",()=>{ S={...DEFAULT,...p[name]}; buildRows(); changed(); toast(`Loaded “${name}”.`); });
    const x=document.createElement("button"); x.type="button"; x.className="x"; x.textContent="×"; x.setAttribute("aria-label","Delete "+name); x.addEventListener("click",()=>{ const q=loadPresets(); delete q[name]; savePresets(q); drawPresets(); });
    w.append(b,x); el.appendChild(w); } }
$("savePreset").addEventListener("click",()=>{ const name=$("presetName").value.trim()||`${S.kind} ${S.thick}/${S.heavy}/${S.grease}/${S.dry} #${S.seed}`; const p=loadPresets(); p[name]=recipe(); savePresets(p); $("presetName").value=""; drawPresets(); toast(`Saved “${name}”.`); });

// custom shape
function useSvgText(txt){
  let svgText=txt.trim();
  if(!svgText.startsWith("<")) svgText=`<svg xmlns="http://www.w3.org/2000/svg"><path d="${svgText.replace(/"/g,"")}" fill="#000"/></svg>`;
  const doc=new DOMParser().parseFromString(svgText,"image/svg+xml"), root=doc.documentElement;
  if(root.nodeName!=="svg"){ $("customMsg").textContent="That doesn’t look like SVG. Paste the whole file, or just a path’s d attribute."; return; }
  if(!root.getAttribute("xmlns")) root.setAttribute("xmlns","http://www.w3.org/2000/svg");
  // measure the artwork so it can be fitted to the canvas
  const probe=document.createElementNS("http://www.w3.org/2000/svg","svg"); probe.setAttribute("style","position:absolute;left:-9999px;top:0;width:10px;height:10px;overflow:visible");
  const g=document.createElementNS("http://www.w3.org/2000/svg","g"); for(const n of Array.from(root.childNodes)) g.appendChild(document.importNode(n,true)); probe.appendChild(g); document.body.appendChild(probe);
  let bb; try{ bb=g.getBBox(); }catch(e){ bb=null; } document.body.removeChild(probe);
  if(!bb||bb.width<=0||bb.height<=0){ $("customMsg").textContent="Couldn’t find any filled shapes in that SVG."; return; }
  root.setAttribute("viewBox",`${bb.x} ${bb.y} ${bb.width} ${bb.height}`); root.setAttribute("width",bb.width); root.setAttribute("height",bb.height);
  const out=new XMLSerializer().serializeToString(root);
  const img=new Image(); img.onload=()=>{ customImg=img; customSvgText=out; customBox={w:bb.width,h:bb.height}; S.shape="custom"; $("customMsg").textContent=`Using your shape (${Math.round(bb.width)}×${Math.round(bb.height)}).`; buildRows(); changed(); };
  img.onerror=()=>{ $("customMsg").textContent="The browser couldn’t draw that SVG. Try saving it from Illustrator as SVG 1.1 with outlines."; };
  img.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(out);
}
$("svgFile").addEventListener("change",e=>{ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>useSvgText(String(r.result)); r.readAsText(f); });
$("svgApply").addEventListener("click",()=>{ if($("svgPaste").value.trim()) useSvgText($("svgPaste").value); });
