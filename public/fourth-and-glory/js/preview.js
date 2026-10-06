// Karakter önizlemesi: tek oyuncuyu döndürerek gösteren küçük 3D sahne
(function(){
  const views=new Map();
  function mount(canvas){
    let v=views.get(canvas); if(v) return v;
    const R=FG_GL.create(canvas); if(!R) return null;
    v={R,canvas,yaw:0,spin:true,drag:null,player:null,zoom:1,raf:0};
    canvas.style.touchAction="none";
    canvas.addEventListener("pointerdown",e=>{ v.drag={x:e.clientX,yaw:v.yaw}; v.spin=false; canvas.setPointerCapture&&canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener("pointermove",e=>{ if(v.drag) v.yaw=v.drag.yaw+(e.clientX-v.drag.x)*.012; });
    canvas.addEventListener("pointerup",()=>{ v.drag=null; });canvas.addEventListener("pointercancel",()=>{v.drag=null;});
    views.set(canvas,v); return v;
  }
  function frame(v,t){
    if(t-(v.lastFrame||0)<1/30)return;const dt=Math.min(.05,t-(v.lastFrame||t));v.lastFrame=t;
    const r=v.canvas.getBoundingClientRect(); if(!r.width||!r.height) return;
    const dpr=Math.min(2,window.devicePixelRatio||1);
    if(v.w!==r.width||v.h!==r.height){ v.w=r.width; v.h=r.height; v.R.resize(r.width,r.height,dpr); }
    if(v.spin&&v.zoom<1.4) v.yaw+=dt*.48; else if(v.zoom>=1.4&&!v.drag) v.yaw*=.9;
    const vf=30*Math.PI/180, z=v.zoom, cam={x:0,y:z>1.4?1.9:1.1,z:z>1.4?2.6:5.4,pitch:z>1.4?.05:.02,cy:.5,f:(r.height/2)/Math.tan(vf/2)};
    const p={...v.player,x:0,z:0,yaw:Math.PI+v.yaw,anim:t*1.2,moving:0};
    v.R.render(cam,[p],null,null,null,{fog:false});
  }
  function loop(t){ views.forEach(v=>{ if(v.player&&v.canvas.offsetParent!==null) frame(v,t/1000); }); requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
  window.FG_PREVIEW={ show(canvas,player,opt={}){ const v=mount(canvas); if(!v) return false; v.player=player; if(opt.zoom!=null) v.zoom=opt.zoom; if(opt.spin!=null) v.spin=opt.spin; return true; } };
})();
