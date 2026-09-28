"use strict";
// Ridge Press · renderer.js
// The fingerprint renderer: noise layers, ridge pattern (loop / whorl / arch), ink model (thick, heavy, grease, dry, specks) and fade.

// ---------------------------------------------------------------- renderer
function ss(e0,e1,x){ let t=(x-e0)/(e1-e0); t=t<0?0:t>1?1:t; return t*t*(3-2*t); }
function cubicW(t){ const a=-0.5; t=Math.abs(t); if(t<1) return (a+2)*t*t*t-(a+3)*t*t+1; if(t<2) return a*t*t*t-5*a*t*t+8*a*t-4*a; return 0; }
function noise(rng, P, W, H, SS, cell){
  // a coarse random grid (one value per `cell` units), smoothly upsampled: fpgen's noise
  const gw=Math.floor(P.w/cell)+3, gh=Math.floor(P.h/cell)+3;
  const g=new Float32Array(gw*gh);
  for(let i=0;i<g.length;i++) g[i]=Math.floor(rng()*255)/255;
  const cs=cell*SS;
  const ix=new Int32Array(W*4), wx=new Float32Array(W*4);
  for(let x=0;x<W;x++){ const u=(x+0.5)/cs-0.5, f=Math.floor(u); for(let k=0;k<4;k++){ const j=f-1+k; ix[x*4+k]=j<0?0:j>=gw?gw-1:j; wx[x*4+k]=cubicW(u-j);} }
  const tmp=new Float32Array(gh*W);
  for(let r=0;r<gh;r++){ const o=r*gw; for(let x=0;x<W;x++){ const b=x*4; tmp[r*W+x]=g[o+ix[b]]*wx[b]+g[o+ix[b+1]]*wx[b+1]+g[o+ix[b+2]]*wx[b+2]+g[o+ix[b+3]]*wx[b+3]; } }
  const out=new Float32Array(W*H);
  for(let y=0;y<H;y++){ const v=(y+0.5)/cs-0.5, f=Math.floor(v); const r=[],w=[];
    for(let k=0;k<4;k++){ const j=f-1+k; r.push((j<0?0:j>=gh?gh-1:j)*W); w.push(cubicW(v-j)); }
    const o=y*W; for(let x=0;x<W;x++) out[o+x]=tmp[r[0]+x]*w[0]+tmp[r[1]+x]*w[1]+tmp[r[2]+x]*w[2]+tmp[r[3]+x]*w[3];
  }
  return out;
}
function boxBlur(src,W,H,r){
  if(r<1) return src; const a=new Float32Array(W*H), b=new Float32Array(W*H); a.set(src);
  for(let pass=0;pass<3;pass++){
    for(let y=0;y<H;y++){ let acc=0; const o=y*W; for(let x=-r;x<=r;x++) acc+=a[o+Math.min(W-1,Math.max(0,x))];
      for(let x=0;x<W;x++){ b[o+x]=acc/(2*r+1); acc+=a[o+Math.min(W-1,x+r+1)]-a[o+Math.max(0,x-r)]; } }
    for(let x=0;x<W;x++){ let acc=0; for(let y=-r;y<=r;y++) acc+=b[Math.min(H-1,Math.max(0,y))*W+x];
      for(let y=0;y<H;y++){ a[y*W+x]=acc/(2*r+1); acc+=b[Math.min(H-1,y+r+1)*W+x]-b[Math.max(0,y-r)*W+x]; } }
  }
  return a;
}
function dilate(bin,W,H,r){
  const t=new Uint8Array(W*H), o=new Uint8Array(W*H);
  for(let y=0;y<H;y++){ let c=0; const b=y*W; for(let x=0;x<=r&&x<W;x++) c+=bin[b+x];
    for(let x=0;x<W;x++){ t[b+x]=c>0?1:0; if(x+r+1<W) c+=bin[b+x+r+1]; if(x-r>=0) c-=bin[b+x-r]; } }
  for(let x=0;x<W;x++){ let c=0; for(let y=0;y<=r&&y<H;y++) c+=t[y*W+x];
    for(let y=0;y<H;y++){ o[y*W+x]=c>0?1:0; if(y+r+1<H) c+=t[(y+r+1)*W+x]; if(y-r>=0) c-=t[(y-r)*W+x]; } }
  return o;
}
function shapeMask(P,W,H,SS){
  const c=document.createElement("canvas"); c.width=W; c.height=H; const x=c.getContext("2d");
  x.setTransform(SS,0,0,SS,0,0); x.fillStyle="#000";
  if(P.shape==="custom"){ const pl=customPlacement(P); if(customImg&&pl) x.drawImage(customImg,pl.x,pl.y,pl.w,pl.h); }
  else x.fill(new Path2D(shapePath(P)));
  const d=x.getImageData(0,0,W,H).data, m=new Uint8Array(W*H);
  for(let i=0;i<m.length;i++) m[i]=d[i*4+3];
  return m;
}
function render(P, SS){
  const W=Math.max(1,Math.round(P.w*SS)), H=Math.max(1,Math.round(P.h*SS)), N=W*H;
  const rng=makeRng(P.seed);
  const raw=shapeMask(P,W,H,SS);
  const mf=new Float32Array(N); for(let i=0;i<N;i++) mf[i]=raw[i]/255;
  const m=boxBlur(mf,W,H,Math.max(1,Math.round(1.2*SS*0.9)));
  const edge=noise(rng,P,W,H,SS,5);
  // fade coordinate fx: 0 on the heavy side, 1 on the far side
  const fx=new Float32Array(N); let lo=Infinity, hi=-Infinity;
  if(P.fmode==="radial"){ for(let y=0;y<H;y++) for(let x=0;x<W;x++){ const i=y*W+x, d=Math.hypot(x/SS-P.fcenter[0], y/SS-P.fcenter[1]); fx[i]=d; if(m[i]>0.5&&d>hi) hi=d; } lo=0; }
  else { const [dx,dy]=P.fdir; for(let y=0;y<H;y++) for(let x=0;x<W;x++){ const i=y*W+x, pr=(x/SS)*dx+(y/SS)*dy; fx[i]=pr; if(m[i]>0.5){ if(pr<lo) lo=pr; if(pr>hi) hi=pr; } } }
  if(!isFinite(lo)||hi<=lo){ lo=0; hi=1; }
  for(let i=0;i<N;i++){ let f=(fx[i]-lo)/(hi-lo); if(P.fmode==="edges") f=1-Math.abs(2*f-1); fx[i]=f; }
  const wx=noise(rng,P,W,H,SS,14), wy=noise(rng,P,W,H,SS,14);
  const hf=noise(rng,P,W,H,SS,0.7), pores=noise(rng,P,W,H,SS,0.45), n35=noise(rng,P,W,H,SS,3.5);
  const gr=noise(rng,P,W,H,SS,P.grease_cell), hv=noise(rng,P,W,H,SS,40), dr=noise(rng,P,W,H,SS,20);
  const fn=noise(rng,P,W,H,SS,10), sp=noise(rng,P,W,H,SS,0.45);
  const bin=new Uint8Array(N); for(let i=0;i<N;i++) bin[i]=m[i]>0.3?1:0;
  const dil=dilate(bin,W,H,Math.floor((Math.floor(10*SS)|1)/2));
  const c=Math.cos(P.rot*Math.PI/180), s=Math.sin(P.rot*Math.PI/180), TAU=2*Math.PI, lam=P.lam, [cx,cy]=P.core;
  const ink=new Uint8Array(N);
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    const i=y*W+x;
    if(!(m[i]+(edge[i]-0.5)*0.55>0.5)){ if(dil[i]&&hf[i]>0.35){ /* specks can land just outside */ } else continue; }
    const X=x/SS+(wx[i]-0.5)*5, Y=y/SS+(wy[i]-0.5)*5;
    const rx=((X-cx)*c+(Y-cy)*s)/P.ax, ry=(-(X-cx)*s+(Y-cy)*c)/P.ay;
    let phi;
    if(P.kind==="whorl") phi=Math.hypot(rx,ry)+P.spiral*lam*Math.atan2(ry,rx)/TAU;
    else if(P.kind==="arch") phi=ry+26*Math.exp(-((rx/60)**2))*ss(90,-20,ry);
    else { const dist=ry<0?Math.hypot(rx,ry):Math.abs(rx), w=ss(40,100,ry); phi=dist*(1-w)+(ry*0.6+18)*w; }
    const v=Math.cos(TAU*phi/lam), f=fx[i];
    let t=0.06-P.thick+(hf[i]-0.5)*0.8+(pores[i]-0.5)*0.6+0.55*ss(0.62,0.8,n35[i]);
    t-=P.grease*ss(0.58,0.8,gr[i])*(1.2-f);
    t-=P.heavy*ss(0.3,0.6,hv[i])*(1-f);
    t+=P.dry*ss(0.62,0.85,dr[i]);
    const ff=f+(fn[i]-0.5)*0.22;
    t+=1.35*ss(P.fade[0],P.fade[1],ff);
    const inside=m[i]+(edge[i]-0.5)*0.55>0.5;
    let on=inside&&v>t;
    if(!on&&dil[i]&&hf[i]>0.35){ const pp=P.speck*Math.exp(-(((ff-0.78)/0.22)**2)); if(sp[i]>1-pp*0.9) on=true; }
    if(on) ink[i]=1;
  }
  return {ink, W, H, SS, raw};
}
