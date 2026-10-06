// Karakter önizlemesi: tüm önizleme tuvalleri TEK bir WebGL bağlamını paylaşır (B7).
// Stüdyo sahnesi ekran dışı bir tuvale çizilir, sonuç görünür 2D tuvale kopyalanır.
// Kamera çekimleri kritik sönümlü yaylarla geçiş yapar; kesme yoktur.
(function(){
  const views=new Map();
  let R=null, offscreen=null;
  // Kategori → çekim. y/z metre, pitch radyan, fov derece, yaw: oyuncunun kameraya göre dönüşü.
  const SHOTS={
    full:  {x:0,   y:1.12,z:5.2,pitch:.03,fov:30,yaw:0},
    face:  {x:0,   y:1.86,z:1.75,pitch:.03,fov:24,yaw:0},
    helmet:{x:.12, y:1.86,z:2.2,pitch:.05,fov:26,yaw:-.55},
    hands: {x:.28, y:1.08,z:2.7,pitch:.08,fov:27,yaw:.55},
    feet:  {x:0,   y:.5,  z:2.5,pitch:.12,fov:28,yaw:.35},
    back:  {x:0,   y:1.42,z:3.3,pitch:.03,fov:30,yaw:Math.PI},
    hero:  {x:0,   y:.95, z:4.7,pitch:-.05,fov:32,yaw:-.25}
  };
  const CAT_SHOT={helmet:"helmet",facemask:"helmet",visor:"helmet",mouthguard:"face",eyeBlack:"face",gloves:"hands",wristband:"hands",tape:"hands",sleeve:"hands",wristCoach:"hands",cleats:"feet",socks:"feet",jersey:"back",backplate:"back",towel:"full",pants:"full"};
  const GESTURE={hands:"hands",feet:"feet",helmet:"helmet",face:"helmet"};
  const KEYS=["x","y","z","pitch","fov","yaw"];

  // Kare hızından bağımsız kritik sönümlü yay (Game Programming Gems 4).
  function spring(cur,vel,target,omega,dt){ const x=omega*dt, e=1/(1+x+.48*x*x+.235*x*x*x), ch=cur-target, tmp=(vel+omega*ch)*dt; return [target+(ch+tmp)*e,(vel-omega*tmp)*e]; }

  function renderer(){
    if(R) return R;
    offscreen=document.createElement("canvas");
    R=FG_GL.create(offscreen,{studio:true}); return R;
  }
  function mount(canvas){
    let v=views.get(canvas); if(v) return v;
    if(!renderer()) return null;
    v={canvas,ctx:canvas.getContext("2d"),baseYaw:0,spin:true,drag:null,player:null,shot:"full",cam:{...SHOTS.full},vel:{},look:{x:0,y:0},lookT:{x:0,y:0},glow:0,glowColor:"#ffffff",gesture:null,gestureT:9,key:""};
    KEYS.forEach(k=>v.vel[k]=0);
    canvas.style.touchAction="none";
    canvas.addEventListener("pointerdown",e=>{ v.drag={x:e.clientX,yaw:v.baseYaw}; v.spin=false; canvas.setPointerCapture&&canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener("pointermove",e=>{ const r=canvas.getBoundingClientRect(); if(r.width){ v.lookT.x=((e.clientX-r.left)/r.width-.5)*2; v.lookT.y=((e.clientY-r.top)/r.height-.4)*2; } if(v.drag) v.baseYaw=v.drag.yaw+(e.clientX-v.drag.x)*.012; });
    canvas.addEventListener("pointerup",()=>{ v.drag=null; }); canvas.addEventListener("pointercancel",()=>{ v.drag=null; });
    canvas.addEventListener("pointerleave",()=>{ v.lookT.x=0; v.lookT.y=0; });
    views.set(canvas,v); return v;
  }
  // Gizli ekran/katman içindeki tuvallere çizim yapılmaz.
  function visible(c){ if(c.offsetParent===null) return false; return !c.closest||!c.closest(".screen:not(.active),.overlay:not(.show)"); }
  function frame(v,t,dt){
    const r=v.canvas.getBoundingClientRect(); if(!r.width||!r.height) return;
    const dpr=Math.min(2,window.devicePixelRatio||1), W=Math.round(r.width*dpr), H=Math.round(r.height*dpr);
    if(v.canvas.width!==W||v.canvas.height!==H){ v.canvas.width=W; v.canvas.height=H; }
    R.resize(r.width,r.height,dpr);
    const target=SHOTS[v.shot]||SHOTS.full;
    if(v.spin&&(v.shot==="full"||v.shot==="hero")&&!v.drag) v.baseYaw+=dt*.42; else if(v.shot!=="full"&&v.shot!=="hero"&&!v.drag) v.baseYaw*=Math.pow(.02,dt);
    for(const k of KEYS){ [v.cam[k],v.vel[k]]=spring(v.cam[k],v.vel[k],target[k],9,dt); }
    v.look.x+=(v.lookT.x-v.look.x)*Math.min(1,dt*6); v.look.y+=(v.lookT.y-v.look.y)*Math.min(1,dt*6);
    v.glow=Math.max(0,v.glow-dt*2.2); v.gestureT+=dt;
    const c=v.cam, cam={x:c.x,y:c.y,z:c.z,pitch:c.pitch,cy:.5,f:(r.height/2)/Math.tan(c.fov*Math.PI/360)};
    const p={...v.player,x:0,z:0,yaw:Math.PI+v.baseYaw+c.yaw,anim:t*1.2,moving:0,studio:{time:t,glow:v.glow,glowColor:v.glowColor,look:v.look,gesture:v.gestureT<.6?v.gesture:null,gestureT:v.gestureT}};
    R.render(cam,[p],null,null,null,{studio:true,home:v.player.colors});
    v.ctx.clearRect(0,0,W,H); v.ctx.drawImage(offscreen,0,0,offscreen.width,offscreen.height,0,0,W,H);
  }
  let last=0;
  function loop(now){ const t=now/1000, dt=Math.min(.05,last?t-last:.016); last=t; views.forEach(v=>{ if(v.player&&visible(v.canvas)) frame(v,t,dt); }); requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
  window.FG_PREVIEW={
    SHOTS,CAT_SHOT,
    show(canvas,player,opt={}){ const v=mount(canvas); if(!v) return false;
      const key=JSON.stringify([player.colors,player.gear,player.look,player.num,player.lefty]);
      if(v.key&&key!==v.key){ v.glow=1; v.glowColor=opt.glow||"#b7ff4c"; v.gesture=GESTURE[opt.shot]||null; v.gestureT=0; }
      v.key=key; v.player=player;
      if(opt.shot) v.shot=SHOTS[opt.shot]?opt.shot:"full"; else if(opt.zoom!=null) v.shot=opt.zoom>=1.4?"face":"full";
      if(opt.spin!=null) v.spin=opt.spin; return true; },
    shotFor:cat=>CAT_SHOT[cat]||"full"
  };
})();
