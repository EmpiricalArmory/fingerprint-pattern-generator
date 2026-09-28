"use strict";
// Ridge Press · tracer.js
// Turns the rendered pixels into vector outlines (smoothed paths) for the SVG export.

// ---------------------------------------------------------------- vector tracing
function traceSVG(ink,W,H,SS){
  // follow the pixel boundaries (ink kept on the right), simplify, then smooth with quadratic curves
  const VW=W+1, out=new Int8Array(VW*(H+1)*2).fill(-1), used=new Uint8Array(VW*(H+1)*2);
  const at=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&ink[y*W+x];
  const add=(x,y,d)=>{ const v=(y*VW+x)*2; if(out[v]<0) out[v]=d; else out[v+1]=d; };
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){ if(!ink[y*W+x]) continue;
    if(!at(x,y-1)) add(x,y,0); if(!at(x+1,y)) add(x+1,y,1); if(!at(x,y+1)) add(x+1,y+1,2); if(!at(x-1,y)) add(x,y+1,3); }
  const DX=[1,0,-1,0], DY=[0,1,0,-1], paths=[];
  const take=(vx,vy,din)=>{ const v=(vy*VW+vx)*2;
    for(const d of (din<0?[out[v],out[v+1]]:[(din+1)%4,din,(din+3)%4])){ if(d<0) continue;
      for(let k=0;k<2;k++) if(out[v+k]===d&&!used[v+k]){ used[v+k]=1; return d; } }
    return -1; };
  for(let vy=0;vy<=H;vy++) for(let vx=0;vx<=W;vx++){
    for(let k=0;k<2;k++){ const v=(vy*VW+vx)*2+k; if(out[v]<0||used[v]) continue;
      used[v]=1; let d=out[v], x=vx, y=vy; const pts=[[x,y]]; let prev=d;
      while(true){ x+=DX[d]; y+=DY[d]; const nd=take(x,y,d); if(nd<0) break; if(nd!==prev) pts.push([x,y]); prev=nd; d=nd; }
      if(pts.length<3) continue;
      let area=0; for(let i=0;i<pts.length;i++){ const a=pts[i], b=pts[(i+1)%pts.length]; area+=a[0]*b[1]-b[0]*a[1]; }
      if(Math.abs(area)/2<3) continue;                                        // drop tiny specks, like potrace -t 3
      paths.push(pts);
    }
  }
  const eps=0.75;
  function rdp(p){ if(p.length<4) return p; const keep=new Uint8Array(p.length); keep[0]=keep[p.length-1]=1; const st=[[0,p.length-1]];
    while(st.length){ const [a,b]=st.pop(); let md=0, mi=-1; const [ax,ay]=p[a],[bx,by]=p[b], L=Math.hypot(bx-ax,by-ay)||1;
      for(let i=a+1;i<b;i++){ const d=Math.abs((bx-ax)*(ay-p[i][1])-(ax-p[i][0])*(by-ay))/L; if(d>md){md=d;mi=i;} }
      if(md>eps){ keep[mi]=1; st.push([a,mi],[mi,b]); } }
    return p.filter((_,i)=>keep[i]); }
  const f=(n)=>{ const r=Math.round(n/SS*100)/100; return (Math.abs(r%1)<1e-9?r.toFixed(0):r.toString()); };
  let d="";
  for(const raw of paths){
    let p=rdp([...raw, raw[0]]); p.pop(); if(p.length<3) p=raw;
    const n=p.length, mid=(i)=>{ const a=p[i%n], b=p[(i+1)%n]; return [(a[0]+b[0])/2,(a[1]+b[1])/2]; };
    const m0=mid(n-1); d+="M"+f(m0[0])+" "+f(m0[1]);
    for(let i=0;i<n;i++){ const q=p[i], mm=mid(i); d+="Q"+f(q[0])+" "+f(q[1])+" "+f(mm[0])+" "+f(mm[1]); }
    d+="Z";
  }
  return {d, count:paths.length};
}
