// Fourth & Glory — kütüphanesiz 2.5D perspektif motoru (Canvas 2D)
// Dünya birimi: yard. x = yan, y = yukarı, z = saha boyu (rakip end zone -z yönünde).
// Saha yard'ı Y (0 = bizim kale çizgisi, 100 = rakip kale çizgisi) → z = 50 - Y
(function(){
  const E={}, ART=window.FG_ART;
  let canvas,ctx,W=0,H=0,dpr=1, bgC,glC,fxC,bgCtx,fxCtx,useGL=false,glR=null;
  const cam={x:0,y:9,z:20,pitch:.38,f:500,near:.4,cy:.5,shake:0};
  const FIELD_W=26.67, GOAL_Z=50, END_Z=60;
  E.cam=cam; E.FIELD_W=FIELD_W;
  E.zOf=Y=>50-Y; E.yardOf=z=>50-z;

  // katmanlar: bg (stadyum, 2D) → gl (3D oyuncular) → fx (yazı, efekt, dokunma)
  function init(container){
    container.innerHTML="";
    const mk=()=>{ const c=document.createElement("canvas"); c.style.cssText="position:absolute;inset:0;width:100%;height:100%;display:block"; container.appendChild(c); return c; };
    bgC=mk(); glC=mk(); fxC=mk(); fxC.style.touchAction="none";
    bgCtx=bgC.getContext("2d"); fxCtx=fxC.getContext("2d"); ctx=bgCtx; canvas=fxC;
    try{ glR=window.FG_GL&&FG_GL.create(glC); useGL=!!glR; }catch(err){ console.warn("WebGL yok, 2D'ye dönülüyor",err); useGL=false; }
    resize(); buildCrowd(); return fxC;
  }
  function resize(){
    const r=fxC.getBoundingClientRect(); if(!r.width) return;
    dpr=Math.min(2,window.devicePixelRatio||1);
    for(const c of [bgC,fxC]){ c.width=Math.round(r.width*dpr); c.height=Math.round(r.height*dpr); }
    W=r.width; H=r.height; if(useGL) glR.resize(W,H,dpr);
    E.portrait=H>W*1.15;
    const hf=(E.portrait?(E.hfovP||50):66)*Math.PI/180, vf=48*Math.PI/180;
    cam.f=Math.min((W/2)/Math.tan(hf/2),(H/2)/Math.tan(vf/2));
  }
  E.init=init; E.resize=resize; E.size=()=>({W,H}); E.ctx=()=>fxCtx; E.isGL=()=>useGL;

  // ---------- projeksiyon ----------
  let sx0=0, sy0=0;
  function toCam(x,y,z){ const dx=x-cam.x, dy=y-cam.y, dz=z-cam.z, s=Math.sin(cam.pitch), c=Math.cos(cam.pitch); return {h:dx, v:dy*c-dz*s, d:-dy*s-dz*c}; }
  function pc(p){ return {x:W/2+cam.f*p.h/p.d+sx0, y:H*cam.cy-cam.f*p.v/p.d+sy0, d:p.d, s:cam.f/p.d}; }
  function project(x,y,z){ const p=toCam(x,y,z); return p.d<cam.near?null:pc(p); }
  E.project=project;
  // ekran → zemin (y=0)
  E.toGround=function(sx,sy,gy=0){
    const h=(sx-W/2)/cam.f, v=(H*cam.cy-sy)/cam.f, s=Math.sin(cam.pitch), c=Math.cos(cam.pitch);
    const dir={x:h, y:-s+v*c, z:-c-v*s}; if(dir.y>=-1e-4) return null;
    const t=(gy-cam.y)/dir.y; return {x:cam.x+dir.x*t, z:cam.z+dir.z*t};
  };
  function clip(pts){ // yakın düzleme göre çokgen kırpma (kamera uzayında)
    const out=[], n=cam.near;
    for(let i=0;i<pts.length;i++){
      const a=pts[i], b=pts[(i+1)%pts.length], ai=a.d>=n, bi=b.d>=n;
      if(ai) out.push(a);
      if(ai!==bi){ const t=(n-a.d)/(b.d-a.d); out.push({h:a.h+(b.h-a.h)*t, v:a.v+(b.v-a.v)*t, d:n}); }
    }
    return out;
  }
  function poly(pts3,fill,stroke,lw){
    const cp=clip(pts3.map(p=>toCam(p[0],p[1],p[2]))); if(cp.length<3) return;
    ctx.beginPath(); cp.forEach((p,i)=>{ const q=pc(p); i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y); }); ctx.closePath();
    if(fill){ ctx.fillStyle=fill; ctx.fill(); } if(stroke){ ctx.strokeStyle=stroke; ctx.lineWidth=lw||1; ctx.stroke(); }
  }
  E.poly=poly;
  function quadXZ(x1,z1,x2,z2,fill,y=0){ poly([[x1,y,z1],[x2,y,z1],[x2,y,z2],[x1,y,z2]],fill); }
  function seg3(a,b,wYd,color){
    let A=toCam(...a), B=toCam(...b); const n=cam.near;
    if(A.d<n&&B.d<n) return; if(A.d<n){ const t=(n-A.d)/(B.d-A.d); A={h:A.h+(B.h-A.h)*t,v:A.v+(B.v-A.v)*t,d:n}; } if(B.d<n){ const t=(n-B.d)/(A.d-B.d); B={h:B.h+(A.h-B.h)*t,v:B.v+(A.v-B.v)*t,d:n}; }
    const p=pc(A), q=pc(B); ctx.strokeStyle=color; ctx.lineCap="round"; ctx.lineWidth=Math.max(1,wYd*(p.s+q.s)/2); ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y); ctx.stroke();
  }
  E.seg3=seg3;
  // yerdeki / duvardaki yazı (yerel afin dönüşüm)
  function planeText(text,o,right,down,size,color,font,alpha=1){
    const P0=project(...o); if(!P0) return;
    const Pr=project(o[0]+right[0],o[1]+right[1],o[2]+right[2]), Pd=project(o[0]+down[0],o[1]+down[1],o[2]+down[2]); if(!Pr||!Pd) return;
    const k=size/100;
    ctx.save(); ctx.setTransform(dpr*(Pr.x-P0.x)*k,dpr*(Pr.y-P0.y)*k,dpr*(Pd.x-P0.x)*k,dpr*(Pd.y-P0.y)*k,dpr*P0.x,dpr*P0.y);
    ctx.globalAlpha=alpha; ctx.font=font||'900 100px "Arial Black",Impact,system-ui'; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillStyle=color; ctx.fillText(text,0,0); ctx.restore();
  }
  E.planeText=planeText;
  function ring(x,z,r,stroke,fill,lw=2,y=0){
    const pts=[]; for(let i=0;i<28;i++){ const a=i/28*Math.PI*2; pts.push([x+Math.cos(a)*r,y,z+Math.sin(a)*r]); }
    poly(pts,fill,stroke,lw);
  }
  E.ring=ring;

  // ---------- seyirci ----------
  let crowd=[]; let crowdPalette=["#12304f","#78f065","#f4f4f4","#e74c3c","#2d6cdf","#f1c40f","#7f8c8d","#ffffff","#1b1b1b","#c0392b"];
  function seeded(seed){ return ()=>{ seed=(seed*16807)%2147483647; return (seed-1)/2147483646; }; }
  function buildCrowd(){
    crowd=[]; const r=seeded(42);
    for(const sg of [-1,1]) for(let k=0;k<9;k++){ const x=sg*(35+k*2.2+1.1), y=k*1.5+.9;
      for(let z=-92;z<40;z+=1.15){ if(r()<.12) continue; crowd.push({x:x+(r()-.5)*.6,y,z:z+(r()-.5)*.4,c:Math.floor(r()*10),s:.85+r()*.3,p:r()*6}); } }
    for(let k=0;k<9;k++){ const z=-(73+k*2.2+1.1), y=k*1.5+.9;
      for(let x=-44;x<44;x+=1.15){ if(r()<.12) continue; crowd.push({x:x+(r()-.5)*.4,y,z:z+(r()-.5)*.6,c:Math.floor(r()*10),s:.85+r()*.3,p:r()*6}); } }
  }
  E.setCrowdColors=(home,away)=>{ crowdPalette=[home.jersey,home.trim,away.jersey,away.trim,"#f4f4f4","#f4f4f4",home.jersey,"#1b1b1b",away.jersey,"#c9c9c9"]; };

  // ---------- stadyum ----------
  function drawSky(){
    const hz=project(cam.x,0,cam.z-2000), hy=hz?hz.y:H*.3;
    const g=ctx.createLinearGradient(0,0,0,Math.max(10,hy)); g.addColorStop(0,"#5d8fc4"); g.addColorStop(1,"#d9e7f2");
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    // uzak tepeler
    ctx.fillStyle="#7f9aa8"; ctx.fillRect(0,hy-6,W,8);
  }
  function drawStands(t){
    // dış zemin (pist + çevre)
    quadXZ(-60,-140,60,40,"#2d5f37");
    quadXZ(-33,-66,33,40,"#9a4a3a"); // pist
    quadXZ(-31,-64,31,40,"#2f6a3b");
    // uzak tribün (rakip end zone arkası)
    for(let k=8;k>=0;k--){ const z=-(73+k*2.2), y=k*1.5;
      poly([[-46,y,z],[46,y,z],[46,y+1.5,z],[-46,y+1.5,z]],k%2?"#2b3442":"#323d4d");
      poly([[-46,y+1.5,z],[46,y+1.5,z],[46,y+1.5,z-2.2],[-46,y+1.5,z-2.2]],k%2?"#4a5568":"#3f4a5c"); }
    poly([[-46,14,-93],[46,14,-93],[46,19,-93],[-46,19,-93]],"#1c2430");
    // skorbord
    poly([[-13,17,-95],[13,17,-95],[13,26,-95],[-13,26,-95]],"#0d1a26","#2a3a4a",2);
    poly([[-1,0,-95],[1,0,-95],[1,17,-95],[-1,17,-95]],"#3a4656");
    planeText("FOURTH & GLORY",[0,21.5,-94.8],[1,0,0],[0,-1,0],3.6,"#e8f0a0");
    // yan tribünler
    for(const sg of [-1,1]) for(let k=8;k>=0;k--){ const x=sg*(35+k*2.2), y=k*1.5;
      poly([[x,y,-95],[x,y,40],[x,y+1.5,40],[x,y+1.5,-95]],k%2?"#2b3442":"#323d4d");
      poly([[x,y+1.5,-95],[x,y+1.5,40],[x+sg*2.2,y+1.5,40],[x+sg*2.2,y+1.5,-95]],k%2?"#4a5568":"#3f4a5c"); }
    // seyirciler (uzaktan yakına)
    const list=[]; for(const p of crowd){ const q=project(p.x,p.y,p.z); if(!q||q.x<-20||q.x>W+20||q.y<-20||q.y>H+20) continue; list.push([q,p]); }
    list.sort((a,b)=>b[0].d-a[0].d);
    for(const [q,p] of list){ const s=q.s*p.s, bob=Math.max(0,Math.sin(t*6+p.p))*(E.cheer||0)*.35*s;
      ctx.fillStyle=crowdPalette[p.c]; ctx.fillRect(q.x-.32*s,q.y-1.05*s-bob,.64*s,.75*s);
      ctx.fillStyle="#d9a77a"; ctx.beginPath(); ctx.arc(q.x,q.y-1.25*s-bob,Math.max(.6,.2*s),0,Math.PI*2); ctx.fill(); }
    // reklam panoları
    for(const sg of [-1,1]){ const x=sg*31; poly([[x,0,-64],[x,0,40],[x,1.1,40],[x,1.1,-64]],"#152238");
      for(let z=-60;z<36;z+=12){ poly([[x,.15,z],[x,.15,z+5.5],[x,.95,z+5.5],[x,.95,z]],"#e0337a"); poly([[x,.15,z+6],[x,.15,z+11.5],[x,.95,z+11.5],[x,.95,z+6]],"#2b5fd9"); } }
    poly([[-31,0,-64],[31,0,-64],[31,1.2,-64],[-31,1.2,-64]],"#152238");
    for(let x=-30;x<30;x+=15){ poly([[x,.15,-63.9],[x+14,.15,-63.9],[x+14,1.05,-63.9],[x,1.05,-63.9]],x/15%2?"#2b5fd9":"#e0337a");
      planeText("FOURTH & GLORY",[x+7,.6,-63.8],[1,0,0],[0,-1,0],.7,"#fff"); }
    // ışık direkleri
    for(const [x,z] of [[-40,-80],[40,-80],[-40,45],[40,45]]){ seg3([x,0,z],[x,30,z],.6,"#9aa7b4"); poly([[x-4,28,z],[x+4,28,z],[x+4,33,z],[x-4,33,z]],"#e9eef3","#7d8a97",1); }
  }
  function drawField(sc){
    const away=sc.away, home=sc.home;
    // çim şeritleri
    for(let Y=0;Y<100;Y+=5){ quadXZ(-FIELD_W,50-Y,FIELD_W,45-Y,(Y/5)%2?"#3f8f45":"#46994b"); }
    quadXZ(-FIELD_W,-50,FIELD_W,-60,away.jersey); quadXZ(-FIELD_W,60,FIELD_W,50,home.jersey);
    planeText(sc.awayName.toUpperCase(),[0,0,-55],[1,0,0],[0,0,1],5.2,away.trim,null,.9);
    planeText("GLORY",[0,0,55],[-1,0,0],[0,0,-1],5.2,home.trim,null,.9);
    const L="rgba(255,255,255,.92)";
    // çizgiler
    for(let Y=0;Y<=100;Y+=5){ const z=50-Y, w=(Y%100===0)?.22:.11; quadXZ(-FIELD_W,z-w,FIELD_W,z+w,L); }
    quadXZ(-FIELD_W-.2,-60,-FIELD_W,60,L); quadXZ(FIELD_W,-60,FIELD_W+.2,60,L);
    quadXZ(-FIELD_W,-60.15,FIELD_W,-59.85,L);
    for(let Y=1;Y<100;Y++){ if(Y%5===0) continue; const z=50-Y;
      for(const x of [-3.08,3.08]) quadXZ(x-.33,z-.05,x+.33,z+.05,L);
      for(const x of [-FIELD_W+.35,FIELD_W-.35]) quadXZ(x-.33,z-.05,x+.33,z+.05,L); }
    // numaralar
    for(let Y=10;Y<100;Y+=10){ const n=String(Y>50?100-Y:Y), z=50-Y;
      planeText(n,[-16.7,0,z],[0,0,1],[-1,0,0],2.1,"rgba(255,255,255,.9)");
      planeText(n,[16.7,0,z],[0,0,-1],[1,0,0],2.1,"rgba(255,255,255,.9)"); }
    // orta logo
    ring(0,0,2.2,null,"rgba(18,48,79,.55)"); planeText("4G",[0,0,0],[1,0,0],[0,0,1],1.7,"rgba(120,240,101,.8)");
    // scrimmage & first down
    if(sc.los!=null){ const z=50-sc.los; quadXZ(-FIELD_W,z-.12,FIELD_W,z+.12,"rgba(60,140,255,.95)"); }
    if(sc.fd!=null&&sc.fd<100){ const z=50-sc.fd; quadXZ(-FIELD_W,z-.12,FIELD_W,z+.12,"rgba(255,214,0,.95)"); }
    (sc.markers||[]).forEach(m=>ring(m.x,m.z,m.r,m.stroke,m.fill,m.lw||2));
  }
  function drawGoalpost(z){
    const Yc="#f2cf3a";
    seg3([0,0,z-1.5],[0,3.33,z-1.5],.22,Yc); seg3([0,3.33,z-1.5],[0,3.33,z],.2,Yc);
    seg3([-3.08,3.33,z],[3.08,3.33,z],.18,Yc); seg3([-3.08,3.33,z],[-3.08,11.67,z],.14,Yc); seg3([3.08,3.33,z],[3.08,11.67,z],.14,Yc);
    poly([[-.35,0,z-1.85],[.35,0,z-1.85],[.35,1.8,z-1.85],[-.35,1.8,z-1.85]],"#12304f");
  }

  // ---------- varlıklar ----------
  const FIG_H=66; // athlete.js figür yüksekliği (u birimi)
  function drawEnt(e){
    const g=project(e.x,0,e.z); if(!g) return;
    const b=e.y?project(e.x,e.y,e.z):g; if(!b) return;
    const u=g.s*2.05/FIG_H;
    if(u<.05) return;
    ART.drawAthlete(ctx,{...e,x:b.x,y:b.y,scale:u});
  }
  function drawBallObj(bl){
    const g=project(bl.x,0,bl.z), b=project(bl.x,bl.h,bl.z); if(!g||!b) return;
    const u=Math.max(.35,g.s*.34/19*1.5);
    ART.drawBall(ctx,b.x,g.y,Math.max(0,g.y-b.y),bl.rot||0,u);
  }
  E.render=function(sc,t,overlay){
    if(!W) return;
    sx0=cam.shake?(Math.random()-.5)*cam.shake:0; sy0=cam.shake?(Math.random()-.5)*cam.shake:0;
    ctx=bgCtx; ctx.setTransform(dpr,0,0,dpr,0,0);
    drawSky(); if(!useGL||!glR.stadium){drawStands(t); drawField(sc); drawGoalpost(-END_Z);}
    if(sc.underlay) sc.underlay();
    const ents=sc.ents||[];
    if(useGL){
      // zemin gölgeleri + kontrol halkası (2D), oyuncular (3D)
      ents.forEach(e=>{ const f=e.fall||0; shadow(e.x+(f?(e.fallDir||1)*.9*f:0),e.z,.55+f*.6,.42); if(e.ring){ const k=.55+.45*Math.sin(t*6); ring(e.x,e.z,.85,`rgba(183,255,76,${k})`,null,3); } });
      if(sc.ball&&!sc.ball.hidden&&sc.ball.h>.2) shadow(sc.ball.x,sc.ball.z,.25,.3*Math.max(.3,1-sc.ball.h/12));
      (sc.props||[]).forEach(o=>{ if(o.kind==="hoop") shadow(o.x,o.z,.3,.25); else shadow(o.x,o.z,.5,.3); });
      glR.render(cam,ents,sc.ball,{x:sx0,y:sy0},sc.props,{stadium:true,stage:sc.stage,home:sc.home,time:t});
    } else {
      const items=[]; ents.forEach(e=>{ const p=toCam(e.x,0,e.z); if(p.d>cam.near) items.push({d:p.d,f:()=>drawEnt(e)}); });
      if(sc.ball&&!sc.ball.hidden){ const p=toCam(sc.ball.x,0,sc.ball.z); if(p.d>cam.near) items.push({d:p.d-.3,f:()=>drawBallObj(sc.ball)}); }
      items.sort((a,b)=>b.d-a.d).forEach(i=>i.f());
    }
    ctx=fxCtx; ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,W,H);
    if(useGL&&glR.stadium){if(sc.underlay)sc.underlay();if(sc.los!=null)seg3([-FIELD_W,.06,E.zOf(sc.los)],[FIELD_W,.06,E.zOf(sc.los)],.10,'#55b9ff');if(sc.fd!=null)seg3([-FIELD_W,.06,E.zOf(sc.fd)],[FIELD_W,.06,E.zOf(sc.fd)],.12,'#ffd65c');ents.forEach(e=>{if(e.ring)ring(e.x,e.z,.8,e.ring,null,2);});}
    if(useGL) ents.forEach(e=>{ if(!e.label||e.fall) return; const q=project(e.x,2.5,e.z); if(!q) return; tag(e.label,q.x,q.y,e.ring?"#b7ff4c":"#fff"); });
    if(overlay) overlay();
  };
  function shadow(x,z,r,a){ const pts=[]; for(let i=0;i<16;i++){ const an=i/16*Math.PI*2; pts.push([x+Math.cos(an)*r*1.2+.15,0,z+Math.sin(an)*r]); } poly(pts,`rgba(0,0,0,${a})`); }
  function tag(t,x,y,c){ ctx.save(); ctx.font="900 10px system-ui"; ctx.textAlign="center"; const w=ctx.measureText(t).width+12;
    ctx.fillStyle="rgba(6,17,26,.82)"; ctx.beginPath(); ctx.roundRect(x-w/2,y-12,w,17,8.5); ctx.fill(); ctx.fillStyle=c; ctx.fillText(t,x,y+1); ctx.restore(); }
  E.drawEntDirect=drawEnt;
  window.FG_ENGINE=E;
})();
