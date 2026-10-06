// Fourth & Glory — Soccer Hero tarzı tek hamle oynanış
// Her seviye 4-5 atış · 3 can · yıldız = kalan can
(function(){
  const E=FG_ENGINE, SFX=FG_AUDIO, S=FG_STATE, D=FG_DATA;
  const rand=(a,b)=>a+Math.random()*(b-a), clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), lerp=(a,b,t)=>a+(b-a)*t;
  const hyp=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const randn=()=>{ let u=0,v=0; while(!u) u=Math.random(); while(!v) v=Math.random(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); };
  const GRAV=10.7;
  const PASS={ bullet:{el:8,label:"BULLET"}, touch:{el:20,label:"TOUCH"}, lob:{el:36,label:"LOB"} };

  const G={ level:null, si:0, shot:null, lives:3, phase:"idle", t:0, ents:[], ball:null, props:[], markers:[], P:{}, perfects:0,
    fx:[], floaters:[], banner:null, pending:null, paused:false, passType:"touch", hooks:{}, swipe:null, path:null };

  const A=k=>S.attr(k);
  const away=()=>G.level.team.kit, home=()=>D.homeKit;
  function ent(team,num,x,z,o={}){ const e={team,num,x,z,y:0,facing:team==="home"?"up":"down",pose:"stand",anim:Math.random()*6,moving:0,colors:team==="home"?home():away(),fall:0,fallDir:1,...o}; G.ents.push(e); return e; }
  function me(x,z,o={}){ const m=S.playerModel(); const p=S.get().profile; const e={team:"home",x,z,y:0,facing:"up",pose:"stand",anim:0,moving:0,fall:0,fallDir:1,ring:"#b7ff4c",label:((p&&p.name)||"SEN").toUpperCase(),...m,...o}; G.ents.push(e); return e; }
  function step(e,tx,tz,speed,dt){
    const dx=tx-e.x, dz=tz-e.z, d=Math.hypot(dx,dz), m=speed*dt;
    if(d<.02||d<=m){ e.x=tx; e.z=tz; e.moving=Math.max(0,e.moving-dt*6); return true; }
    e.x+=dx/d*m; e.z+=dz/d*m; e.moving=Math.min(1,e.moving+dt*8); e.anim+=m/.75;
    const ty=Math.atan2(-dx,-dz); let cy=e.yaw!=null?e.yaw:(e.facing==="down"?Math.PI:0); const df=((ty-cy+Math.PI*3)%(Math.PI*2))-Math.PI; e.yaw=cy+df*Math.min(1,dt*10);
    return false;
  }
  const idle=(e,dt)=>{ e.moving=Math.max(0,e.moving-dt*5); };
  function vibrate(p){ if(S.get().settings.vibration&&navigator.vibrate) navigator.vibrate(p); }
  function floater(text,x,z,color="#b7ff4c",size=26,h=2.6){ G.floaters.push({text,x,z,h,color,size,life:1.3}); }
  function burst(x,z,h,colors,n=24,power=1){ for(let i=0;i<n;i++){ const a=rand(0,Math.PI*2),sp=rand(2,7)*power; G.fx.push({x,z,h,vx:Math.cos(a)*sp*.5,vz:Math.sin(a)*sp*.5,vh:rand(3,8)*power,life:rand(.6,1.2),c:colors[i%colors.length]}); } }
  function banner(text,sub,color,dur){ G.banner={text,sub,color:color||"#fff",t:0,dur:dur||0}; }
  function info(){ return {level:G.level,shot:G.shot,index:G.si,count:G.level?G.level.shots.length:0,lives:G.lives,phase:G.phase,passType:G.passType,clock:G.P.clock,wind:G.P.wind}; }
  function hud(){ G.hooks.hud&&G.hooks.hud(info()); }
  const at=(x,d)=>({x,z:G.P.z0-d});

  // ---------- akış ----------
  function startLevel(level){ G.level=level; E.hfovP=level.shots[0]?.career?70:50; if(E.resize)E.resize(); if(window.FG_CAREER)FG_CAREER.sync(level.id); G.matchStats={attempts:0,completions:0,yards:0,td:0,int:0,sacks:0,rushYards:0}; G.si=0; G.lives=3; G.perfects=0; G.scores=[]; E.setCrowdColors(home(),level.team.kit); startShot(true); }
  function startShot(first){
    G.shotId=(G.shotId||0)+1; G.shot=G.level.shots[G.si]; G.ents=[]; G.ball=null; G.props=[]; G.markers=[]; G.fx=[]; G.floaters=[]; G.pending=null; G.t=0; G.P={}; G.swipe=null; G.path=null; G.drawing=false; E.cheer=0;
    G.phase="aim";
    ({pass:setupPass,target:setupTarget,fg:setupFG,punt:setupPunt,run:setupRun,tackle:setupTackle,dive:setupDive})[G.shot.type](G.shot);
    snapCamera();
    banner(first?`ATIŞ ${G.si+1}/${G.level.shots.length}`:"TEKRAR",G.shot.title,first?"#b7ff4c":"#fff",1.4);
    hud(); G.hooks.shot&&G.hooks.shot(G.shot,G.si);
  }
  function endShot(success,score,title,msg){
    if(G.phase==="result"||G.phase==="done") return;
    if(G.shot.career)recordPlay(title); G.phase="result"; score=Math.round(clamp(score,0,100));
    G.pending={success,score,timer:success?1.7:1.6};
    if(success){ SFX.play("cheer"); vibrate([40,30,60]); E.cheer=1; banner(title,msg,"#b7ff4c"); if(score>=95) G.perfects++; G.scores.push(score); }
    else { SFX.play("fail"); vibrate([90]); G.lives--; banner(title,msg,"#ff7443"); }
    hud();
  }
  function resolve(){
    const p=G.pending; G.pending=null;
    if(p.success){ G.si++; if(G.si<G.level.shots.length){ startShot(true); return; }
      G.phase="done"; G.hooks.levelEnd&&G.hooks.levelEnd({success:true,stars:G.lives,perfects:G.perfects,scores:G.scores,stats:G.matchStats}); return; }
    if(G.lives<=0){ G.phase="done"; G.hooks.levelEnd&&G.hooks.levelEnd({success:false,shot:G.shot,stats:G.matchStats}); return; }
    startShot(false);
  }

  // ---------- kamera ----------
  function camCfg(){
    const P=E.portrait, t=G.shot.type;
    if(G.shot.career&&G.phase==='carry')return P?{y:7,back:11,pitch:.32,cy:.58}:{y:7,back:13,pitch:.3,cy:.56};
    if(G.shot.career)return P?{y:10,back:18,pitch:.34,cy:.60}:{y:9,back:18,pitch:.30,cy:.56};
    if(t==="fg"||t==="punt") return P?{y:4.4,back:6,pitch:.2,cy:.58}:{y:3.4,back:7.5,pitch:.08,cy:.6};
    if(t==="run") return P?{y:11,back:5,pitch:.78,cy:.55}:{y:8.5,back:8,pitch:.5,cy:.55};
    if(t==="tackle") return P?{y:9,back:6.5,pitch:.56,cy:.56}:{y:6.5,back:10,pitch:.3,cy:.55};
    if(t==="dive") return P?{y:8,back:7,pitch:.5,cy:.56}:{y:6,back:9,pitch:.27,cy:.55};
    return P?{y:7.8,back:6,pitch:.44,cy:.6}:{y:5.4,back:8.5,pitch:.2,cy:.55};
  }
  function camTarget(){
    const c=camCfg(), P=G.P, b=G.ball; let fx=0,fz=P.z0;
    const t=G.shot.type;
    if(t==="pass"||t==="target"){ fx=P.qb.x*.5; fz=P.qb.z; if(b&&b.vz&&!b.done){ fz=lerp(P.qb.z,Math.max(b.z,P.qb.z-40),.55); fx=b.x*.4; return {x:fx,y:Math.max(c.y,b.h*.7+2),z:fz+c.back,pitch:Math.min(c.pitch,.3),cy:c.cy}; } if(P.catcher){ fz=P.catcher.z; fx=P.catcher.x*.8; } }
    else if(t==="fg"||t==="punt"){ fz=P.kicker.z; if(b&&b.vz){ fz=Math.min(P.kicker.z-c.back,Math.max(b.z+2,-46)); fx=b.x*.5; return {x:fx,y:Math.max(c.y,b.h*.75+1.5),z:fz+c.back+4,pitch:.12,cy:c.cy}; } }
    else if(t==="run"){ fx=P.rb.x*.6; fz=P.running?P.rb.z:P.rb.z-2; }
    else if(t==="tackle"){ fx=P.me.x*.5; fz=P.me.z; }
    else if(t==="dive"){ fx=P.me.x*.6; fz=P.me.z; }
    return {x:fx,y:c.y,z:fz+c.back,pitch:c.pitch,cy:c.cy};
  }
  function snapCamera(){ Object.assign(E.cam,camTarget()); }
  function updateCamera(dt){ const t=camTarget(), k=Math.min(1,dt*3.2); E.cam.x+=(t.x-E.cam.x)*k; E.cam.z+=(t.z-E.cam.z)*k; E.cam.y+=(t.y-E.cam.y)*k; E.cam.pitch+=(t.pitch-E.cam.pitch)*k; E.cam.cy=t.cy; E.cam.shake=Math.max(0,(E.cam.shake||0)-dt*40); }

  // ---------- kaydırma → fırlatma ----------
  function swipeLaunch(path,origin,elevDeg,vmin,vmax,sigma){
    const a=path[0], b=path[path.length-1], dx=b.x-a.x, dy=b.y-a.y, L=Math.hypot(dx,dy), {W,H}=E.size();
    if(dy>-25||L<35) return null;
    // yön: kaydırmanın ilk ~100 pikseli (zemine izdüşümü) — uzun kaydırma ufku geçse bile yön doğru kalır
    let dp=b, acc=0; for(let i=1;i<path.length;i++){ acc+=Math.hypot(path[i].x-path[i-1].x,path[i].y-path[i-1].y); if(acc>=Math.min(100,L*.6)){ dp=path[i]; break; } }
    const g0=E.toGround(a.x,a.y), g1=E.toGround(dp.x,dp.y);
    let yaw;
    if(g0&&g1&&Math.hypot(g1.x-g0.x,g1.z-g0.z)>.3&&g1.z<g0.z) yaw=Math.atan2(g1.x-g0.x,-(g1.z-g0.z));
    else yaw=Math.atan2(dp.x-a.x,-(dp.y-a.y))*.6;
    yaw=clamp(yaw,-1.1,1.1);
    let dev=0; path.forEach(p=>{ const c=((p.x-a.x)*dy-(p.y-a.y)*dx)/L; if(Math.abs(c)>Math.abs(dev)) dev=c; });
    const power=clamp(L/(H*.5),.12,1);
    let v=vmin+power*(vmax-vmin);
    if(sigma){ yaw+=randn()*sigma; v*=1+randn()*sigma*.6; }
    const el=elevDeg*Math.PI/180;
    return {vx:v*Math.cos(el)*Math.sin(yaw), vz:-v*Math.cos(el)*Math.cos(yaw), vh:v*Math.sin(el), curve:clamp(-dev/W,-.3,.3)*16, power, yaw};
  }
  function ballStep(b,dt,wind){
    const ft=G.t-(b.t0||0);
    b.vx+=((b.curve||0)*Math.max(0,1-ft/2.2)+(wind||0)*.075)*dt; b.vh-=GRAV*dt;
    b.px=b.x; b.pz=b.z; b.ph=b.h;
    b.x+=b.vx*dt; b.z+=b.vz*dt; b.h+=b.vh*dt; b.rot+=dt*14; b.yaw=-Math.atan2(b.vx,-b.vz);
  }
  const accSigma=dist=>{ const acc=dist<20?A("shortAcc"):A("deepAcc"); return .045*clamp(1-(acc-50)/52,.04,1); };
  const passVmax=()=>21+(A("throwPower")-50)*.2;
  const kickVmax=()=>29+(A("kickPower")-50)*.13;
  const kickSigma=()=>.035*clamp(1-(A("kickAcc")-50)/52,.04,1);
  function predict(l,from,steps=60,wind=0){ const pts=[]; let x=from.x,z=from.z,h=from.h,vx=l.vx,vz=l.vz,vh=l.vh,t=0; for(let i=0;i<steps&&h>0;i++){ const dt=.05; vx+=((l.curve||0)*Math.max(0,1-t/2.2)+wind*.075)*dt; vh-=GRAV*dt; x+=vx*dt; z+=vz*dt; h+=vh*dt; t+=dt; pts.push([x,Math.max(0,h),z]); } return pts; }

  // Accessible aiming: tap a receiver or release a swipe near its screen marker.
  function assistLevel(){return G.level.id<=2?1:G.level.id<=5?.8:.6;}
  function futureActor(e,seconds){let x=e.x,z=e.z,seg=e.seg||1,pts=e.pts,remaining=seconds*(e.def?.spd||4);if(!pts)return {x,z};for(let i=0;i<40&&remaining>0;i++){const q=pts[seg],d=Math.hypot(q.x-x,q.z-z);if(d>remaining)return {x:x+(q.x-x)*remaining/d,z:z+(q.z-z)*remaining/d};remaining-=d;x=q.x;z=q.z;if(e.def?.once&&seg===pts.length-1)return {x,z};seg=(seg+1)%pts.length;}return {x,z};}
  function chosenTarget(path){const end=path.at(-1),start=path[0],targets=G.P.wrs?.length?G.P.wrs:G.P.hoops||[];let best=null,score=Infinity;for(const target of targets){const q=E.project(target.x,target.y||1.4,target.z);if(!q)continue;const distance=Math.hypot(q.x-end.x,q.y-end.y),limit=G.level.id<=2?110:80;if(distance<limit&&distance<score){score=distance;best=target;}}return best;}
  function assistedPass(path){const target=G.shot.career?G.P.wrs[G.P.selected||0]:chosenTarget(path);if(!target)return null;const from={x:G.P.qb.x+.3,z:G.P.qb.z-.2,h:2.1};let time=.8,dest;for(let i=0;i<5;i++){dest=target.kind==='hoop'?{x:target.bx+Math.sin((G.t+time)*target.spd)*target.amp,z:target.z}:futureActor(target,time+(G.shot.career?Math.max(.07,.27-(A('releaseSpeed')-50)*.003):0));time=clamp(Math.hypot(dest.x-from.x,dest.z-from.z)/(passVmax()*(G.P.power||1)*({bullet:.98,touch:.78,lob:.60}[G.passType])),.4,3.1);}if(G.shot.career&&G.P.lead){dest.x+=G.P.lead.x;dest.z+=G.P.lead.z;}const h=target.kind==='hoop'?target.y:1.45;return {vx:(dest.x-from.x)/time,vz:(dest.z-from.z)/time,vh:(h-from.h+.5*GRAV*time*time)/time,curve:0,power:1,yaw:Math.atan2(dest.x-from.x,from.z-dest.z),assisted:true};}
  function assistedKick(path){const a=path[0],b=path.at(-1),{W,H}=E.size(),tap=Math.hypot(a.x-b.x,a.y-b.y)<20;if(!tap&&b.y>a.y-20)return null;const punt=G.shot.type==='punt',from=G.ball,targetZ=punt?(G.P.zoneZ[0]+G.P.zoneZ[1])/2:-60;
    const lateral=tap?(b.x-W/2)/W*7:(b.x-a.x)/W*18;
    const dist=from.z-targetZ,el=(punt?52:36)*Math.PI/180,targetH=punt?0:5.3,den=2*(dist*Math.tan(el)-(targetH-from.h));if(den<=0)return null;const horizontal=Math.sqrt(GRAV*dist*dist/den),time=dist/horizontal;
    const strength=tap?1:clamp(Math.hypot(b.x-a.x,b.y-a.y)/(H*.3),.8,1.12),blend=assistLevel(),factor=1+(strength-1)*(1-blend)*.5;
    return {vx:lateral/time-(G.P.wind||0)*.075*time*.5*blend,vz:-horizontal*factor,vh:horizontal*Math.tan(el)*factor,curve:0,power:strength,yaw:0,assisted:true};}
  function updatePocket(dt){const P=G.P;if(!P.line||G.phase!=='aim')return;P.pocketTime=(P.pocketTime||0)+dt;
    for(let i=0;i<P.rushers.length;i++){const d=P.rushers[i],o=P.line[Math.min(P.line.length-1,i+1)],hold=(G.level.id<=2?6.5:4.8-G.level.id*.18)+i*.28;
      if(P.pocketTime<hold){step(o,d.x,o.homeZ-.5,1.5,dt);step(d,o.x,o.z-1.05,1.9,dt);o.pose=d.pose='block';}
      else{const flank=i%2?1:-1;if(P.pocketTime<hold+.9&&Math.abs(d.x-o.x)<1.8&&d.z<o.z+1)step(d,o.x+flank*2.2,o.z+.8,3.4,dt);else step(d,P.qb.x,P.qb.z,3.5+G.level.id*.09,dt);d.pose='tackle';step(o,d.x,d.z+.8,1.2,dt);if(hyp(d,P.qb)<.72){P.sacked=true;d.pose='tackle';endShot(false,0,'SACK!','Savunma QB’ye ulaştı. Açık receiver’a daha erken pas ver.');return;}}}
  }
  // ======================= PAS =======================
  function offenseLine(z0,n=5){ const xs=n===5?[-4,-2,0,2,4]:[-6,-4,-2,0,2,4,6]; G.P.line=xs.map((x,i)=>ent("home",[74,66,52,61,77,88,85][i],x,z0+.85,{pose:"block",homeZ:z0+.85})); G.P.rushers=xs.slice(1,-1).map((x,i)=>ent("away",[91,97,94,99,90][i],x+(i%2?.4:-.4),z0-.85,{pose:"block"})); }
  function actors(list,kind){ return list.map((d,i)=>{ const p=at(d.x,d.d), e=kind==="wr"?ent("home",[84,11,17][i],p.x,p.z,{label:"WR"}):ent("away",[24,21,33,52,26][i],p.x,p.z,{}); e.def=d; e.seg=1; e.pts=d.patrol?d.patrol.map(q=>at(q[0],q[1])):null; e.reach=d.tall?3.0:d.follow!=null?2.3:2.55; e.rad=d.follow!=null?.62:.75; return e; }); }
  function setupPass(sh){
    const los=sh.los||30; G.P.z0=E.zOf(los);
    offenseLine(G.P.z0);
    G.P.qb=me(0,G.P.z0+5);
    G.P.wrs=actors(sh.wr,"wr"); G.P.defs=actors(sh.def||[],"def");
    G.P.clockMax=G.P.clock=(sh.time||7)+(A("awareness")-60)*.03;
    if(sh.career)setupQB();
  }
  function moveActors(list,dt){
    list.forEach(e=>{ const d=e.def;
      if(d.follow!=null){ const w=G.P.wrs[d.follow]; const dir=w._dir||{x:0,z:-1}; step(e,w.x-dir.x*d.lag+(w.x>0?-.6:.6),w.z-dir.z*d.lag,9,dt); return; }
      const px=e.x, pz=e.z;
      if(e.pts){ const tg=e.pts[e.seg]; if(step(e,tg.x,tg.z,d.spd||4,dt)){ if(d.once){ if(e.seg<e.pts.length-1)e.seg++;else {e.pts=null; e.done=true;} } else e.seg=(e.seg+1)%e.pts.length; } }
      else if(e.done&&e._dir&&!G.shot.career){ step(e,e.x+e._dir.x,e.z+e._dir.z,(d.spd||4)*.4,dt); }
      else idle(e,dt);
      const dd=Math.hypot(e.x-px,e.z-pz); if(dd>1e-4) e._dir={x:(e.x-px)/dd,z:(e.z-pz)/dd};
    });
  }
  function updatePass(dt){
    if(G.shot.career)return updateQB(dt);
    const P=G.P, b=G.ball;
    if(!P.catcher) moveActors(P.wrs,dt);
    if(!b||!b.held) moveActors(P.defs,dt);
    if(G.phase==="aim"){ P.clock=Math.max(0,P.clock-dt);updatePocket(dt); }
    if(P.sacked){ P.qb.fall=Math.min(1,P.qb.fall+dt*4); P.qb.fallDir=-1; }
    P.qb.pose=P.thrown?(G.t-P.thrownAt<.35?"release":"stand"):(G.swipe?"throw":"stand");
    if(!b||b.done){ if(b&&b.held){ b.x=b.held.x; b.z=b.held.z; b.h=1.3; } if(b&&b.dead){ b.h=Math.max(0,b.h-dt*4); } if(P.catcher&&G.pending&&G.pending.success){ step(P.catcher,P.catcher.x,P.catcher.z-6,6,dt); P.catcher.pose="carry"; } return; }
    ballStep(b,dt,0);
    for(const d of P.defs){ if(b.h<d.reach&&Math.hypot(d.x-b.x,d.z-b.z)<(d.rad||.75)){ b.done=true; d.pose="catch";
      if(b.h<2.1){ b.held=d; SFX.play("catch"); floater("INT",d.x,d.z,"#ff7443"); endShot(false,0,"INTERCEPTION",`#${d.num} topu kaptı.`); }
      else { b.dead=true; SFX.play("tap"); floater("PBU",d.x,d.z,"#ff7443"); endShot(false,0,"PAS SAVUŞTURULDU","Topu savunmacının üstünden geçir."); } return; } }
    const cr=1.0+(A("catching")-50)*.008;
    for(const w of P.wrs){ const dd=Math.hypot(w.x-b.x,w.z-b.z); if(b.h>.4&&b.h<2.75&&dd<cr){
      b.done=true; b.held=w; P.catcher=w; w.pose="catch"; SFX.play("catch"); burst(w.x,w.z,2,["#fff","#b7ff4c"],14,.6);
      const q=dd/cr; if(q<.35) floater("PERFECT!",w.x,w.z,"#b7ff4c",30);
      endShot(true,100-q*35,"TAMAMLANDI!",`${Math.round(P.z0-w.z)} yard'lık pas.`); return; } }
    if(b.h<=0||Math.abs(b.x)>28){ b.done=true; b.dead=true; SFX.play("tap"); endShot(false,0,"INCOMPLETE","Receiver'ın gideceği yere, doğru güçte at."); }
  }
  function throwBall(path){
    const P=G.P, qb=P.qb, pt=PASS[G.passType];
    if(G.shot.career&&(G.phase!=="aim"||G.paused||qb.z<P.z0))return false;
    const targets=(P.wrs&&P.wrs.length?P.wrs:[{z:qb.z-12}]).concat(P.hoops||[]);
    const est=Math.min(40,Math.max(5,...targets.map(w=>qb.z-w.z)));
    const l=assistedPass(path)||swipeLaunch(path,qb,pt.el,7,passVmax(),accSigma(est)*(1-assistLevel())*.2); if(!l){ G.hooks.toast&&G.hooks.toast("Topu ileri doğru kaydır."); return false; }
    if(G.shot.career){const distance=Math.hypot(l.vx,l.vz),nearest=Math.min(...P.rushers.concat(P.defs).map(d=>hyp(d,qb))),pressure=clamp((4-nearest)/4,0,1),accuracy=A(est<10?'shortAcc':est<25?'mediumAcc':'deepAcc'),moving=qb.moving||0;
      const error=(100-accuracy)/100*.18+pressure*(100-A('pocketPresence'))/100*.65+moving*(100-A('throwOnRun'))/100*.5;
      const reduction=G.level.id===1?.15:G.shot.goal?1-(A('clutch')-50)*.007:1;const direction=P.selected%2?1:-1;l.vx+=error*direction*reduction;
      P.read=pressure>.5?'BASKI ALTINDA':Math.min(...P.defs.map(d=>hyp(d,P.wrs[P.selected])))<2?'RİSKLİ PAS':'İYİ OKUMA';floater(P.read,qb.x,qb.z,pressure>.5?'#ff9d67':'#b7ff4c',18);l.releaseAt=G.t+Math.max(.07,.27-(A('releaseSpeed')-50)*.003);}
    G.ball={x:qb.x+.3,z:qb.z-.2,h:2.1,rot:0,...l,t0:G.t}; P.thrown=true; P.thrownAt=G.t; G.phase="live"; SFX.play("throw"); return true;
  }
  function setupQB(){
    const P=G.P;G.phase='presnap';P.selected=0;P.control={x:0,z:0};P.goalZ=G.shot.goal?-50:P.z0-G.shot.yards;
    P.wrs.forEach((w,i)=>{w.num=[84,11,87,22,17][i];w.label=G.shot.wr[i].role;w.role=w.label;w.ring=i===0?'#ffd65c':null;});
    for(let i=P.wrs.length;i<5;i++)ent('home',32+i,(i-3)*2,P.z0+3,{pose:'stance'}); // 11 on offense
    P.rushers.push(ent('away',99,6,P.z0-.85,{pose:'stance'}));
    P.defs=P.wrs.map((w,i)=>ent('away',[24,21,33,52,26][i],w.x+(i%2?1:-1),w.z-(G.level.id===1?6:3),{assignment:i,label:i<2?'CB':i===2?'S':'LB',reach:2.4,rad:.65}));
    for(const [x,d,role]of [[-8,19,'S'],[8,22,'S'],[0,6,'LB'],[-17,8,'LB']].slice(0,7-P.wrs.length))P.defs.push(ent('away',40+P.defs.length,x,P.z0-d,{zone:true,label:role,reach:2.6,rad:.75,homeX:x,homeZ:P.z0-d}));
    P.defs.forEach((d,i)=>{d.homeX=d.x;d.homeZ=d.z;d.star=G.level.id>=6&&i===0;if(d.star)d.rad=.82;});
    P.scheme=G.shot.coverage;P.defs.forEach((d,i)=>{if(G.shot.disguise&&i>=P.wrs.length){d.x=i%2?-8:8;d.z=P.z0-14;}});P.wrs[0].ring='#ffd65c';P.wrs.forEach(w=>w.label='');P.defs.forEach(d=>d.label=d.star?'★':'');G.ball={x:P.qb.x+.22,z:P.qb.z,h:1.3,rot:0,done:true,held:P.qb};
  }
  function snap(){if(!G.shot?.career||G.paused||G.phase!=='presnap')return false;G.phase='aim';G.t=0;G.banner=null;SFX.play('snap');hud();return true;}
  function selectReceiver(i){if(!G.shot?.career||!['aim','presnap'].includes(G.phase)||!G.P.wrs[i])return false;G.P.selected=i;G.P.wrs.forEach((w,k)=>w.ring=k===i?'#ffd65c':null);hud();return true;}
  function passSelected(charge=0){if(!G.shot?.career)return false;G.P.power=1+clamp(charge,0,1)*.18;G.P.lead={x:0,z:0};return throwBall([{x:0,y:100},{x:0,y:0}]);}
  function moveControl(x,z){if(G.P)G.P.control={x:clamp(x,-1,1),z:clamp(z,-1,1)};}
  function recordPlay(title){const P=G.P;if(P.recorded)return;P.recorded=true;const st=G.matchStats;if(P.thrown)st.attempts++;if(P.catcher&&P.catcher!==P.qb){st.completions++;st.yards+=Math.max(0,Math.round(P.z0-Math.max(-50,P.catcher.z)));if(P.catcher.z<=-50)st.td++;}else if(P.catcher)st.rushYards+=Math.max(0,Math.round(P.z0-Math.max(-50,P.qb.z)));if(title==='INTERCEPTION')st.int++;if(P.sacked)st.sacks++;}
  function finishCarry(reason){const P=G.P,w=P.catcher,gain=Math.round(P.z0-w.z),ok=w.z<=P.goalZ,td=w.z<=-50;endShot(ok,ok?Math.min(100,80+gain):0,td?'TOUCHDOWN!':ok?'FIRST DOWN!':reason,`${Math.max(0,gain)} yard · hedef ${G.shot.yards} yard`);}
  function updateQB(dt){
    const P=G.P,b=G.ball,id=G.level.id;
    if(G.phase==='result'){if(P.sacked)P.qb.fall=Math.min(1,P.qb.fall+dt*3);return;}
    if(G.phase==='carry'){
      const w=P.catcher,c=P.control||{x:0,z:0},len=Math.hypot(c.x,c.z),speed=6.1+(A('speed')-50)*.035;
      step(w,w.x+c.x,w.z+(len>.1?c.z:-1),speed,dt);w.pose='carry';b.x=w.x+.2;b.z=w.z;b.h=1.25;
      for(const d of [...P.defs,...P.rushers]){step(d,w.x,w.z,(id===1?3.2:4.1+id*.12),dt);d.pose=hyp(d,w)<2?'tackle':'stand';if(hyp(d,w)<.8&&G.t-P.catchAt>.35){w.fall=.6;SFX.play('hit');finishCarry('TACKLE');return;}}
      if(w.z<=-50){finishCarry('TOUCHDOWN!');return;}if(!G.shot.goal&&w.z<=P.goalZ&&G.t-P.catchAt>1.4){finishCarry('FIRST DOWN!');return;}if(Math.abs(w.x)>=26.4){finishCarry('SAHA DIŞI');return;}if(w.z>P.z0+18||G.t-P.catchAt>14){finishCarry('OYUN BİTTİ');return;}
      return;
    }
    moveActors(P.wrs,dt);
    const c=P.control||{x:0,z:0};
    if(G.phase==='aim'){
      if(Math.hypot(c.x,c.z)>.05)step(P.qb,P.qb.x+c.x,P.qb.z+c.z,4.6+(A('agility')-50)*.025,dt);else idle(P.qb,dt);
      P.qb.x=clamp(P.qb.x,-26.4,26.4);P.qb.z=Math.min(P.z0+15,P.qb.z);P.qb.pose=G.swipe?'throw':'stand';
      if(P.qb.z<P.z0){P.catcher=P.qb;P.catchAt=G.t;G.ball={x:P.qb.x,z:P.qb.z,h:1.2,done:true,held:P.qb,rot:0};G.phase='carry';hud();return;}
      P.clock=Math.max(0,P.clock-dt);P.pocketTime=(P.pocketTime||0)+dt;
      const bonus=window.FG_CAREER?.school()?.blockBonus||0;
      P.rushers.forEach((d,i)=>{const o=P.line[Math.min(i+1,4)],hold=(id===1?6.8:4.5-id*.12)+bonus+i*.25;
        if(P.pocketTime<hold){step(d,o.x,o.z-1,1.6,dt);step(o,d.x,o.homeZ,1.4,dt);o.pose=d.pose='block';}
        else{const flank=i%2?1:-1;if(d.z<o.z+.3&&Math.abs(d.x-o.x)<1.7)step(d,o.x+flank*2.2,o.z+.8,4,dt);else step(d,P.qb.x,P.qb.z,3.7+id*.1,dt);d.pose='tackle';step(o,d.x,d.z+.8,1.5,dt);if(hyp(d,P.qb)<.8&&!P.sacked){P.sacked=true;endShot(false,0,'SACK!','Baskı geldi. Açık receiver’ı seç veya cepten çık.');}}});
      if(P.sacked)return;
    }else P.qb.pose=G.t-P.thrownAt<.4?'release':'stand';
    P.defs.forEach((d,i)=>{
      let tx=d.homeX,tz=d.homeZ;
      if(b&&!b.done&&G.t-P.thrownAt>(id===1?.65:.3)){const ahead=Math.max(0,Math.min(.35,b.h/8));tx=b.x+b.vx*ahead;tz=b.z+b.vz*ahead;}
      else if(!d.zone&&['man','cover1'].includes(P.scheme)){const w=P.wrs[d.assignment];tx=w.x+(i%2?1.1:-1.1);tz=w.z-(id===1?3.2:1.8);}
      else if(P.scheme==='blitz'&&i===P.defs.length-1&&G.t>(G.shot.disguise?1.2:.25)){tx=P.qb.x;tz=P.qb.z;if(G.phase==='aim'&&hyp(d,P.qb)<.85){P.sacked=true;endShot(false,0,'SACK!','Blitz geldi. Kısa pas seçeneğini erken kullan.');}}
      else{const deep=P.scheme==='cover4'?[0,1,4,5]:P.scheme==='cover3'?[0,1,4]:P.scheme==='cover1'?[4]:[4,5];const di=deep.indexOf(i);
        if(di>=0){d.homeX=(di-(deep.length-1)/2)*(46/deep.length);d.homeZ=P.z0-(P.scheme==='cover4'?23:19);if(G.t>.8&&G.level.id>=5)d.homeX+=clamp(P.qb.x*.12,-1.5,1.5);}
        tx=d.homeX;tz=d.homeZ;
        const near=P.wrs.reduce((a,w)=>hyp(w,{x:d.homeX,z:d.homeZ})<hyp(a,{x:d.homeX,z:d.homeZ})?w:a,P.wrs[0]);if(hyp(near,{x:d.homeX,z:d.homeZ})<10){tx=near.x;tz=near.z-1.2;}}
      step(d,clamp(tx,-25,25),tz,id===1?2.5:3.8+(d.star?.5:0)+(P.scheme==='blitz'&&i===P.defs.length-1?.5:0),dt);d.pose='stand';
    });
    if(P.sacked)return;if(b?.done&&b.held===P.qb){b.x=P.qb.x+.22;b.z=P.qb.z;b.h=1.3;}if(!b||b.done)return;if(G.t<(b.releaseAt||0)){b.x=P.qb.x+.3;b.z=P.qb.z-.2;return;}ballStep(b,dt,0);
    for(const d of P.defs){if(b.h>.3&&b.h<d.reach&&hyp(d,b)<d.rad){b.done=true;d.pose='catch';if(b.h>2.05){b.dead=true;endShot(false,0,'PAS SAVUŞTURULDU','Savunmacı topa uzandı. Farklı pas açısı dene.');}else{b.held=d;endShot(false,0,'INTERCEPTION',`#${d.num} pas arasına girdi.`)};return;}}
    const cr=1.1+(A('catching')-50)*.008+(window.FG_CAREER?.school()?.catchBonus||0);
    for(const w of P.wrs){if(b.h>.35&&b.h<2.7&&hyp(w,b)<cr){b.done=true;b.held=w;P.catcher=w;P.catchAt=G.t;w.pose='carry';G.phase='carry';SFX.play('catch');floater('YAKALADI!',w.x,w.z);hud();if(w.z<=-50)finishCarry('TOUCHDOWN!');return;}}
    if(b.h<=0||Math.abs(b.x)>26.67||b.z<-60){b.done=true;b.dead=true;endShot(false,0,'INCOMPLETE','Receiver’ın açılmasını bekle veya farklı pas türü seç.');}
  }
  function overlayQB(){const P=G.P;
    if(G.phase==='presnap'&&S.get().settings.guide)P.wrs.forEach((w,i)=>{if(w.pts)dash3(w.pts.map(p=>[p.x,.09,p.z]),i===P.selected?'#ffd65c':'rgba(220,240,255,.65)',i===P.selected?3:2);});
    if(['aim','presnap'].includes(G.phase))P.wrs.forEach((w,i)=>{const q=E.project(w.x,2.5,w.z);if(q){const open=Math.min(...P.defs.map(d=>hyp(d,w)))>2.8;label(`${i+1} · ${w.role}${open?' · AÇIK':''}`,q.x,q.y-12,i===P.selected?'#ffd65c':open?'#b7ff4c':'#fff',11);}});
    if(G.phase==='aim')aimPreview({x:P.qb.x+.3,z:P.qb.z-.2,h:2.1},PASS[G.passType].el,7,passVmax(),0);
    if(G.phase==='carry'){const w=P.catcher,q=E.project(w.x,2.7,w.z);if(q)label(`${Math.max(0,Math.round(P.z0-w.z))} / ${G.shot.yards} YD`,q.x,q.y-15,'#ffd65c',14);}
  }

  // ======================= HEDEF =======================
  function setupTarget(sh){
    G.P.z0=E.zOf(sh.los||30);
    G.P.qb=me(0,G.P.z0+5); G.P.wrs=[]; G.P.defs=[];
    G.P.hoops=sh.hoops.map(h=>{ const p=at(h.x,h.d); const o={kind:"hoop",x:p.x,z:p.z,y:h.y,r:h.r,bx:p.x,amp:h.amp||0,spd:h.spd||0}; G.props.push(o); return o; });
    [-3,3].forEach(x=>G.props.push({kind:"cone",x,z:G.P.z0+.5}));
  }
  function updateTarget(dt){
    const P=G.P, b=G.ball;
    P.hoops.forEach(h=>{ if(h.amp&&!h.hit) h.x=h.bx+Math.sin(G.t*h.spd)*h.amp; });
    P.qb.pose=P.thrown?(G.t-P.thrownAt<.35?"release":"stand"):(G.swipe?"throw":"stand");
    if(!b) return;
    if(b.done){ if(b.h>0){ ballStep(b,dt,0); if(b.h<0) b.h=0; } return; }
    ballStep(b,dt,0);
    for(const h of P.hoops){ if(b.pz>h.z&&b.z<=h.z){ const t=(b.pz-h.z)/(b.pz-b.z), hx=lerp(b.px,b.x,t), hh=lerp(b.ph,b.h,t), d=Math.hypot(hx-h.x,hh-h.y);
      if(d<h.r*.95){ h.hit=true; b.done=true; burst(h.x,h.z,h.y,["#78f065","#fff","#ffd60a"],30,1); const q=d/h.r; if(q<.3) floater("TAM ORTA!",h.x,h.z,"#b7ff4c",30,h.y+1); SFX.play("catch");
        endShot(true,100-q*35,"İSABET!","Lastiğin içinden geçti."); return; }
      else if(d<h.r*1.3){ SFX.play("hit"); floater("DOINK!",h.x,h.z,"#ffd60a",26,h.y+1); b.vz*=-.3; b.vx*=.5; } } }
    if(b.h<=0||b.z<P.z0-60){ b.done=true; b.h=0; endShot(false,0,"ISKA","Lastiğe doğru, daha doğru güçte kaydır."); }
  }
  // ======================= FIELD GOAL & PUNT =======================
  function kickSetup(sh,holder){
    const spotY=sh.los-(holder?7:12), zs=E.zOf(spotY), z0=E.zOf(sh.los);
    offenseLine(z0,7);
    if(holder) ent("home",4,.6,zs+.2,{pose:"kneel"});
    const kicker=me(holder?-1.2:0,zs+(holder?2.4:0));
    G.ball={x:holder?0:.3,z:zs,h:holder?.3:1.1,rot:holder?Math.PI/2:0};
    Object.assign(G.P,{zs,z0,kicker,dist:117-sh.los,wind:sh.wind?(Math.random()<.5?-1:1)*sh.wind*rand(.8,1.1):0,gust:!!sh.gust,kicked:false});
  }
  function setupFG(sh){ kickSetup(sh,true); }
  function setupPunt(sh){ kickSetup(sh,false); G.P.zone=sh.zone; G.P.wind=0; G.P.zoneZ=[E.zOf(sh.zone[1]),E.zOf(sh.zone[0])]; }
  function kick(path){
    const P=G.P; if(P.kicked) return false;
    const punt=G.shot.type==="punt";
    const l=assistedKick(path)||swipeLaunch(path,P.kicker,punt?52:36,punt?10:12,kickVmax()-(punt?3:0),0); if(!l){ G.hooks.toast&&G.hooks.toast("Topun arkasından yukarı doğru kaydır."); return false; }
    P.kicked=true; P.kickAt=G.t; P.launch=l; P.kickAnim=0; P.kicker.pose=punt?"punt":"kick"; G.phase="live"; return true;
  }
  function updateKick(dt){
    const P=G.P, b=G.ball, punt=G.shot.type==="punt";
    if(P.gust) P.wind+=Math.sin(performance.now()/650)*dt*1.4;
    if(!P.kicked) return;
    P.kickAnim=Math.min(1,P.kickAnim+dt*4); P.kicker.kickT=P.kickAnim;
    if(!punt&&P.kickAnim<.5){ step(P.kicker,-.3,P.zs+.6,6,dt); return; }
    if(b.vz==null){ Object.assign(b,P.launch,{t0:G.t}); SFX.play("snap"); }
    if(b.done){ if(b.bounce){ b.vh-=GRAV*dt; b.h=Math.max(0,b.h+b.vh*dt); b.x+=b.vx*dt; b.z+=b.vz*dt; b.vx*=.98; b.vz*=.98; } return; }
    ballStep(b,dt,P.wind);
    if(b.pz>P.z0&&b.z<=P.z0&&b.h<2.6){ b.done=true; b.bounce=true; b.vz=2; b.vh=3; SFX.play("hit"); floater("BLOK!",b.x,b.z,"#ff7443"); endShot(false,0,"BLOKLANDI","Çok alçak. Daha uzun kaydır."); return; }
    if(!punt){
      if(b.pz>-60&&b.z<=-60){ const ax=Math.abs(b.x);
        if(b.h>3.33&&ax<3.0){ b.done=true; const q=ax/3.08; if(q<.2) floater("TAM ORTA!",b.x,-60,"#b7ff4c",30,b.h); burst(b.x,-60,b.h,["#78f065","#fff","#ffd60a"],30,1); endShot(true,100-q*35,"IT'S GOOD!",`${P.dist} yard'lık field goal!`); }
        else if(b.h>3.33&&ax<3.25){ SFX.play("hit"); floater("DOINK!",b.x,-60,"#ffd60a",30,b.h); const ok=b.x*b.vx<0; b.vx=-b.vx*.5; if(ok) endShot(true,62,"DOINK… GOOD!","Direkten sekip içeri!"); else { b.done=true; b.bounce=true; b.vz*=-.3; endShot(false,0,"DOINK!","Direğe çarptı. Biraz daha ortaya."); } }
        else { b.done=true; b.bounce=true; const why=b.h<=3.33?"KISA KALDI":b.x<0?"WIDE LEFT":"WIDE RIGHT"; endShot(false,0,why,b.h<=3.33?"Daha uzun kaydır.":`Top ${b.x<0?"sola":"sağa"} kaçtı.${P.wind?" Rüzgârı hesaba kat.":""}`); }
        return; }
      if(b.h<=0){ b.done=true; b.bounce=true; b.vh=3; b.vz*=.3; endShot(false,0,"KISA KALDI","Daha uzun kaydır."); }
    } else if(b.h<=0){
      b.done=true; b.bounce=true; b.h=0; b.vh=Math.abs(b.vh)*.3; b.vz*=.4; b.vx*=.4;
      const y=E.yardOf(b.z), [lo,hi]=P.zone;
      if(Math.abs(b.x)>E.FIELD_W) endShot(false,0,"SAHA DIŞI","Top kenardan çıktı.");
      else if(y>=100) endShot(false,0,"TOUCHBACK","End zone'a girdi. Biraz daha kısa.");
      else if(y>=lo&&y<=hi){ const q=(hi-y)/(hi-lo); if(y>=hi-3) floater("COFFIN!",b.x,b.z,"#b7ff4c",30); endShot(true,100-q*30,"MÜKEMMEL PUNT!",`Rakip ${100-Math.round(y)} yard çizgisinden başlayacak.`); }
      else endShot(false,0,"KISA KALDI",`Top ${100-Math.round(y)} yard çizgisine düştü. Bölgeye ulaşmalı.`);
    }
  }
  // ======================= KOŞU (yol çiz) =======================
  function setupRun(sh){
    const los=sh.los||35; G.P.z0=E.zOf(los);
    offenseLine(G.P.z0);
    G.P.rb=me(0,G.P.z0+4,{pose:"stance"});
    ent("home",12,0,G.P.z0+1.6,{pose:"carry"});
    G.P.defs=(sh.def||[]).map((d,i)=>{ const p=at(d.x,d.d);
      if(d.kind==="dummy"){ const o={kind:"dummy",x:p.x,z:p.z,r:.75}; G.props.push(o); return o; }
      const e=ent("away",[50,54,58,33,31][i%5],p.x,p.z,{}); e.def=d; e.seg=1; e.pts=d.patrol?d.patrol.map(q=>at(q[0],q[1])):null; e.r=.95-(A("agility")-50)*.005; return e; });
    G.P.goalZ=sh.goal?-50:G.P.z0-sh.yards; G.P.spd=6.2+(A("speed")-50)*.05;
  }
  function updateRun(dt){
    const P=G.P, rb=P.rb;
    if(!P.running) return;
    if(rb.down){ rb.fall=Math.min(1,rb.fall+dt*4); return; }
    if(G.phase!=="live"){ if(G.pending&&G.pending.success){ step(rb,rb.x,rb.z-5,6,dt); rb.pose="celebrate"; } return; }
    const path=P.route; let tg=path[P.pi]; while(tg&&Math.hypot(tg.x-rb.x,tg.z-rb.z)<.4){ P.pi++; tg=path[P.pi]; }
    if(!tg){ const dir=P.lastDir||{x:0,z:-1}; tg={x:rb.x+dir.x*3,z:rb.z+dir.z*3}; }
    const px=rb.x,pz=rb.z; step(rb,tg.x,tg.z,P.spd,dt); const dd=Math.hypot(rb.x-px,rb.z-pz); if(dd>1e-4) P.lastDir={x:(rb.x-px)/dd,z:(rb.z-pz)/dd};
    rb.pose="carry"; if(G.ball){ G.ball.x=rb.x+.25; G.ball.z=rb.z; G.ball.h=1.25; }
    P.defs.forEach(d=>{
      if(d.kind==="dummy"){ if(Math.hypot(d.x-rb.x,d.z-rb.z)<d.r+.35) tackled(d); return; }
      if(d.def.chase){ if(G.t>.5){ const lead=Math.min(1,hyp(d,rb)/6), ld=P.lastDir||{x:0,z:-1}; step(d,rb.x+ld.x*lead*3,rb.z+ld.z*lead*3,d.def.chase,dt); } d.pose=hyp(d,rb)<3?"tackle":"stand"; }
      else if(d.pts){ const t2=d.pts[d.seg]; if(step(d,t2.x,t2.z,d.def.spd||3,dt)) d.seg=(d.seg+1)%d.pts.length; }
      if(hyp(d,rb)<d.r) tackled(d);
    });
    if(G.phase!=="live") return;
    if(Math.abs(rb.x)>E.FIELD_W){ endShot(false,0,"SAHA DIŞI","Yolun sahanın içinde kalmalı."); return; }
    if(rb.z<=P.goalZ){ burst(rb.x,rb.z,1,["#78f065","#fff","#ff6a13"],36,1.2); const minD=P.minD==null?9:P.minD; endShot(true,clamp(70+minD*12,70,100),G.shot.goal?"TOUCHDOWN!":"FIRST DOWN!",G.shot.goal?"End zone'dasın!":`${G.shot.yards}+ yard koştun.`); }
    P.defs.forEach(d=>{ const dd2=Math.hypot(d.x-rb.x,d.z-rb.z)-(d.r||.8); P.minD=P.minD==null?dd2:Math.min(P.minD,dd2); });
  }
  function tackled(d){ const P=G.P, rb=P.rb; if(rb.down||G.phase!=="live") return; rb.down=true; rb.fallDir=d.x<rb.x?1:-1; if(d.pose!=null) d.pose="tackle"; SFX.play("hit"); E.cam.shake=12; vibrate([60]);
    burst(rb.x,rb.z,.3,["#c9b48a","#8fae7a"],16,.5); endShot(false,0,d.kind==="dummy"?"ÇARPTIN!":"TACKLE!","Yolunu savunmacılardan uzak çiz."); }
  function startRun(pts){
    const P=G.P; if(pts.length<2) return false; let L=0; for(let i=1;i<pts.length;i++) L+=Math.hypot(pts[i].x-pts[i-1].x,pts[i].z-pts[i-1].z);
    if(L<2.5){ G.hooks.toast&&G.hooks.toast("RB'den başlayıp ileri doğru bir yol çiz."); return false; }
    P.route=pts; P.pi=0; P.running=true; G.phase="live"; G.t=0; G.ball={x:P.rb.x,z:P.rb.z,h:1.2,rot:0}; SFX.play("snap");
    G.ents.forEach(e=>{ if(e.pose==="stance") e.pose="stand"; }); return true;
  }
  // ======================= TACKLE (dalış) =======================
  function setupTackle(sh){
    const zl=E.zOf(40); G.P.zl=zl; G.P.z0=zl;
    const losZ=zl-6;
    [-4,-2,0,2,4].forEach((x,i)=>ent("away",[74,66,52,61,77][i],x,losZ-.85,{pose:"block"}));
    [-3,-1,1,3].forEach((x,i)=>ent("home",[91,97,94,99][i],x,losZ+.85,{pose:"block"}));
    G.P.me=me(0,zl,{pose:"tackle"});
    const pts=sh.path.map(([x,d])=>({x,z:zl+d}));
    const c=ent("away",[22,26,32,20][G.level.id%4],pts[0].x,pts[0].z,{label:"TOP"}); G.P.carrier=c; c.seg=1; c.pts=pts;
    ent("away",9,0,losZ-4,{});
    G.ball={x:c.x,z:c.z,h:1.25,rot:0};
    Object.assign(G.P,{losZ,failZ:losZ+sh.yards,spd:sh.spd,reach:5.5+(A("tackle")-50)*.06+(A("speed")-50)*.03,tR:1.0+(A("tackle")-50)*.008});
  }
  function updateTackle(dt){
    const P=G.P, c=P.carrier, m=P.me;
    if(P.tackled){ c.fall=Math.min(1,c.fall+dt*4); m.fall=Math.min(.7,m.fall+dt*3); return; }
    if(G.t>.9&&G.phase!=="result"){ const tg=c.pts[c.seg]; if(tg){ if(step(c,tg.x,tg.z,P.spd,dt)&&c.seg<c.pts.length-1) c.seg++; } c.pose="carry"; }
    G.ball.x=c.x+.25; G.ball.z=c.z; G.ball.h=1.25;
    if(P.dash){ const d=P.dash; d.t+=dt;
      if(!d.diving){ if(step(m,d.tx,d.tz,d.spd,dt)||d.t>d.max){ d.diving=true; d.dt=0; d.fx=m.x; d.fz=m.z; m.pose="dive"; } }
      else { d.dt+=dt; const k=Math.min(1,d.dt/.3), yw=m.yaw||0, dir={x:-Math.sin(yw),z:-Math.cos(yw)}; m.x=d.fx+dir.x*1.4*k; m.z=d.fz+dir.z*1.4*k; m.pitch=k*1.25; m.y=Math.sin(k*Math.PI)*.25;
        if(k>=1){ m.y=0; P.missed=true; } }
      if(hyp(m,c)<P.tR+(d.diving?.3:0)&&G.phase!=="result"){ P.tackled=true; c.fallDir=m.x<c.x?1:-1; m.fallDir=-c.fallDir; m.pitch=0; m.pose="tackle";
        SFX.play("hit"); E.cam.shake=14; vibrate([70]); burst(c.x,c.z,.4,["#c9b48a","#8fae7a","#e8dcc0"],18,.6);
        const g=c.z-P.losZ; if(g<1) floater("BIG HIT!",c.x,c.z,"#b7ff4c",30);
        endShot(true,100-Math.max(0,g)*8,g<0?"TACKLE FOR LOSS!":"STOP!",g<.5?"Hiç yard vermedin!":`${Math.round(g)} yard verdin.`); return; }
    }
    if(G.phase==="aim"||G.phase==="live"){ if(c.z>=P.failZ) endShot(false,0,"FIRST DOWN","Koşucu sarı çizgiyi geçti. Önüne doğru kaydır."); else if(P.missed) endShot(false,0,"ISKA","Koşucunun gideceği yere dal, olduğu yere değil."); }
  }
  function dashTo(path){
    const P=G.P, m=P.me; if(P.dash) return false;
    const end=path[path.length-1];let g=E.toGround(end.x,end.y);if(!g)return false;
    const q=E.project(P.carrier.x,1.4,P.carrier.z);if(q&&Math.hypot(end.x-q.x,end.y-q.y)<90){const delay=clamp(hyp(m,P.carrier)/(8+P.spd),.15,.65);g=futureActor({...P.carrier,def:{spd:P.spd,once:true}},delay);if(Math.hypot(g.x-m.x,g.z-m.z)>P.reach+1){G.hooks.toast&&G.hooks.toast('Koşucu biraz yaklaşınca tekrar dokun.');return false;}}
    const dx=g.x-m.x, dz=g.z-m.z, d=Math.hypot(dx,dz); if(d<.5) return false;
    const k=Math.min(1,(P.reach+assistLevel()*.8)/d);
    P.dash={tx:m.x+dx*k,tz:m.z+dz*k,t:0,spd:7.6+(A("speed")-50)*.05,max:1.2}; m.pose="tackle"; SFX.play("whoosh"); G.phase="live"; return true;
  }
  // ======================= DALIŞ (WR) =======================
  function setupDive(sh){
    const los=sh.los||30; G.P.z0=E.zOf(los);
    offenseLine(G.P.z0);
    G.P.qb=ent("home",12,0,G.P.z0+5,{});
    const p=at(sh.wr.x,sh.wr.d); G.P.me=me(p.x,p.z);
    G.P.defs=(sh.def||[]).map((d,i)=>{ const q=at(d.x,d.d); return ent("away",[24,21,33][i],q.x,q.z,{}); });
    Object.assign(G.P,{throwAt:.8,thrown:false,off:sh.ball,cr:1.15+(A("catching")-50)*.008,reach:20});
  }
  function updateDive(dt){
    const P=G.P, m=P.me, b=G.ball;
    if(!P.thrown&&G.t>=P.throwAt){ P.thrown=true; P.qb.pose="release"; SFX.play("throw");
      // koşan WR'nin önüne, kısa bir yayla
      let T=1.4, tx=0, tz=0; for(let i=0;i<5;i++){ tx=clamp(m.x+P.off.dx,-26.5,26.5); tz=m.z-6*T-P.off.dd; T=Math.hypot(tx-P.qb.x,tz-P.qb.z)/19+.45; }
      G.ball={x:P.qb.x,z:P.qb.z,h:2.1,rot:0,t0:G.t,vx:(tx-P.qb.x)/T,vz:(tz-P.qb.z)/T,vh:(1.0-2.1+.5*GRAV*T*T)/T,tx,tz};
      if(S.get().settings.guide) G.markers=[{x:tx,z:tz,r:P.cr,stroke:"#ffd60a",fill:"rgba(255,214,10,.15)",lw:3}]; }
    if(!P.dive&&!m.caught){ step(m,m.x,m.z-3,6,dt); m.pose=P.thrown?"reach":"stand"; }
    if(P.dive&&!m.caught){ const d=P.dive; d.t+=dt;
      if(!d.air){
        const arrived=step(m,d.tx,d.tz,d.spd,dt); m.pose="reach";
        // top yere inmeden ~0.35 sn önce, ulaşılabilecek mesafedeyse dal
        if(b&&!b.done){ const tl=(b.vh+Math.sqrt(Math.max(0,b.vh*b.vh+2*GRAV*(b.h-.8))))/GRAV, gx=b.x+b.vx*tl, gz=b.z+b.vz*tl, dg=Math.hypot(gx-m.x,gz-m.z);
          if(tl<.38&&dg<2.6&&dg>.35){ d.air=true; d.at=0; d.fx=m.x; d.fz=m.z; d.gx=gx; d.gz=gz; d.len=Math.min(2.2,dg); m.yaw=Math.atan2(-(gx-m.x),-(gz-m.z)); } }
        if(arrived&&!d.air) idle(m,dt);
      } else { d.at+=dt; const k=Math.min(1,d.at/.3), L=Math.max(.01,Math.hypot(d.gx-d.fx,d.gz-d.fz)); m.x=d.fx+(d.gx-d.fx)/L*d.len*k; m.z=d.fz+(d.gz-d.fz)/L*d.len*k; m.pose="dive"; m.pitch=k*1.25; m.y=Math.sin(k*Math.PI)*.45; } }
    P.defs.forEach(d=>{ if(b&&b.tx!=null&&G.t-P.throwAt>.35) step(d,b.tx,b.tz,4.6+G.level.id*.08,dt); });
    if(!b) return;
    if(b.done){ if(b.held){ b.x=m.x; b.z=m.z; b.h=.9+m.y; } return; }
    ballStep(b,dt,0);
    const air=P.dive&&P.dive.air, dd=Math.hypot(m.x-b.x,m.z-b.z);
    if(b.h<(air?2.0:2.6)&&b.h>.15&&dd<P.cr*(air?1.25:1)){
      const dc=Math.min(99,...P.defs.map(d=>Math.hypot(d.x-b.x,d.z-b.z)));
      if(dc<dd-.2&&dc<.9){ b.done=true; b.dead=true; SFX.play("tap"); endShot(false,0,"SAVUNMA KAZANDI","Savunmacı topa senden önce uzandı."); return; }
      b.done=true; b.held=m; m.caught=true; G.markers=[]; SFX.play("catch"); burst(m.x,m.z,1,["#fff","#b7ff4c"],18,.7);
      if(Math.abs(m.x)>E.FIELD_W){ endShot(false,0,"SAHA DIŞI","Yakaladın ama çizginin dışındaydın."); return; }
      const q=dd/P.cr; if(air) floater("UÇTU!",m.x,m.z,"#b7ff4c",30); endShot(true,100-q*30,"YAKALADIN!",air?"Muhteşem dalış!":"Topu kaptın."); return; }
    for(const d of P.defs){ if(b.h<2.5&&Math.hypot(d.x-b.x,d.z-b.z)<.8){ b.done=true; b.dead=true; d.pose="catch"; SFX.play("tap"); endShot(false,0,"SAVUNMA KAZANDI","Savunmacı topa senden önce uzandı."); return; } }
    if(b.h<=0){ b.done=true; b.dead=true; b.h=0; G.markers=[]; endShot(false,0,"TOP DÜŞTÜ","Sarı halkaya doğru zamanında kaydır."); }
  }
  function diveTo(path){
    const P=G.P, m=P.me; if(P.dive) return false;
    const end=path[path.length-1], g=E.toGround(end.x,end.y); if(!g) return false;
    const dx=g.x-m.x, dz=g.z-m.z, d=Math.hypot(dx,dz), k=Math.min(1,P.reach/Math.max(d,.01));
    P.dive={tx:m.x+dx*k,tz:m.z+dz*k,t:0,spd:8.2+(A("speed")-50)*.05}; SFX.play("whoosh"); G.phase="live"; return true;
  }

  // ---------- çizim yardımcıları ----------
  function dash3(pts,color,w=2.5){ const ctx=E.ctx(); ctx.setLineDash([6,7]); ctx.strokeStyle=color; ctx.lineWidth=w; ctx.beginPath(); let st=false;
    pts.forEach(p=>{ const q=E.project(p[0],p[1],p[2]); if(!q){ st=false; return; } st?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y); st=true; }); ctx.stroke(); ctx.setLineDash([]); }
  function label(t,x,y,c="#fff",s=13){ const ctx=E.ctx(); ctx.save(); ctx.font=`900 ${s}px system-ui`; ctx.textAlign="center"; ctx.lineWidth=4; ctx.strokeStyle="rgba(0,0,0,.6)"; ctx.strokeText(t,x,y); ctx.fillStyle=c; ctx.fillText(t,x,y); ctx.restore(); }
  function timerBar(f,text,color){ const ctx=E.ctx(), {W,H}=E.size(), w=Math.min(240,W*.6), x=(W-w)/2, y=E.portrait?H-96:H-110;
    ctx.font="900 10px system-ui"; const tw=ctx.measureText(text).width+12, bw=w-tw;
    ctx.fillStyle="rgba(6,17,26,.78)"; ctx.beginPath(); ctx.roundRect(x-8,y-7,w+16,26,13); ctx.fill();
    ctx.fillStyle="rgba(255,255,255,.14)"; ctx.beginPath(); ctx.roundRect(x+tw,y+2,bw,8,4); ctx.fill();
    ctx.fillStyle=color; ctx.beginPath(); ctx.roundRect(x+tw,y+2,Math.max(0,bw*f),8,4); ctx.fill();
    ctx.textAlign="left"; ctx.fillStyle="#fff"; ctx.fillText(text,x,y+10); }
  function swipeTrail(){ const sw=G.swipe; if(!sw||sw.pts.length<2) return; const ctx=E.ctx(); ctx.strokeStyle="rgba(255,255,255,.8)"; ctx.lineWidth=6; ctx.lineCap="round"; ctx.lineJoin="round"; ctx.beginPath(); sw.pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)); ctx.stroke(); }
  function swipeHint(x,y){ const ctx=E.ctx(), k=(performance.now()/1000)%1.5/1.5; ctx.globalAlpha=(1-k)*.9; ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(x,y-k*130,14,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=(1-k)*.4; ctx.fillRect(x-3,y-k*130,6,k*130); ctx.globalAlpha=1; }
  // nişan önizlemesi: Awareness yükseldikçe yörüngenin daha uzun kısmı görünür
  function aimPreview(origin,elev,vmin,vmax,wind){
    const sw=G.swipe; if(!sw||sw.pts.length<3||!S.get().settings.guide) return;
    const l=(G.shot.type==="pass"||G.shot.type==="target"?assistedPass(sw.pts):assistedKick(sw.pts))||swipeLaunch(sw.pts,origin,elev,vmin,vmax,0); if(!l) return;
    const frac=G.level.id<=3?1:clamp(.6+(A("awareness")-55)*.02,.6,1), pts=predict(l,origin,70,wind); dash3(pts.slice(0,Math.max(3,Math.floor(pts.length*frac))),"rgba(255,255,255,.85)");
  }
  function overlay(){
    if(G.shot.career){overlayQB();return;}
    const t=G.shot.type, P=G.P, {W,H}=E.size();
    if(t==="pass"||t==="target"){
      if(G.phase==="aim"){ if(S.get().settings.guide){for(const target of (P.wrs||[]).concat(P.hoops||[])){const q=E.project(target.x,target.y||1.4,target.z);if(q){E.ring(target.x,target.z,1.2,"#b7ff4c","rgba(183,255,76,.12)",2);label("DOKUN / BURAYA KAYDIR",q.x,q.y-24,"#b7ff4c",10);}}} aimPreview({x:P.qb.x+.3,z:P.qb.z-.2,h:2.1},PASS[G.passType].el,7,passVmax(),0);
        if(t==="pass") timerBar(clamp(P.clock/P.clockMax,0,1),"SAAT",P.clock<2?"#ff5b67":"#b7ff4c");
        if(!G.swipe&&G.t>.3){ const q=E.project(P.qb.x,0,P.qb.z); if(q) swipeHint(q.x,q.y+30); } }
    }
    if(t==="fg"||t==="punt"){
      if(!P.kicked){ aimPreview({x:G.ball.x,z:G.ball.z,h:G.ball.h},t==="punt"?52:36,t==="punt"?10:12,kickVmax()-(t==="punt"?3:0),P.wind);
        const g=E.project(0,0,P.zs); if(g){ label(t==="fg"?`${P.dist} YD`:"PUNT",g.x,g.y+38,"#fff",14); if(!G.swipe) swipeHint(g.x+6,g.y+60); } }
      if(P.wind){ const ctx=E.ctx(), x=W-74,y=E.portrait?150:80; ctx.fillStyle="rgba(6,17,26,.82)"; ctx.beginPath(); ctx.roundRect(x-52,y-26,112,52,14); ctx.fill();
        ctx.fillStyle="#fff"; ctx.font="900 10px system-ui"; ctx.textAlign="center"; ctx.fillText("RÜZGÂR",x+4,y-10); ctx.font="900 15px system-ui"; ctx.fillText(`${Math.abs(P.wind).toFixed(0)} mph`,x+18,y+14);
        ctx.save(); ctx.translate(x-26,y+9); ctx.scale(P.wind>0?1:-1,1); ctx.fillStyle="#7fd3ff"; ctx.beginPath(); ctx.moveTo(-12,-4); ctx.lineTo(4,-4); ctx.lineTo(4,-10); ctx.lineTo(14,0); ctx.lineTo(4,10); ctx.lineTo(4,4); ctx.lineTo(-12,4); ctx.closePath(); ctx.fill(); ctx.restore(); }
    }
    if(t==="run"){
      const pts=P.running?P.route.slice(P.pi):(G.path||[]); if(pts.length){ dash3([{x:P.rb.x,z:P.rb.z},...pts].map(p=>[p.x,.05,p.z]),"#ffd60a",4); }
      if(!P.running&&!G.path){ const q=E.project(P.rb.x,0,P.rb.z); if(q) swipeHint(q.x,q.y-10); }
      if(!P.running) P.defs.forEach(d=>{ if(d.kind!=="dummy"&&d.def&&(d.def.chase||d.pts)){ const q=E.project(d.x,2.6,d.z); if(q) label(d.def.chase?"TAKİP":"↔",q.x,q.y-6,"#ff9f6e",11); } });
    }
    const ringAt=(m,reach)=>{ const e=G.swipe.pts[G.swipe.pts.length-1], g=E.toGround(e.x,e.y); if(g){ const dx=g.x-m.x, dz=g.z-m.z, d=Math.hypot(dx,dz), k=Math.min(1,reach/Math.max(d,.01)); E.ring(m.x+dx*k,m.z+dz*k,.9,"#b7ff4c","rgba(183,255,76,.15)",3); } };
    if(t==="tackle"&&!P.dash&&G.phase==="aim"){ if(!G.swipe){ const q=E.project(P.me.x,0,P.me.z); if(q) swipeHint(q.x,q.y+20); } else if(G.swipe.pts.length>1) ringAt(P.me,P.reach); }
    if(t==="dive"&&!P.dive&&P.thrown&&G.swipe&&G.swipe.pts.length>1) ringAt(P.me,P.reach);
    if(t!=="run") swipeTrail();
  }
  function drawFx(){ const ctx=E.ctx();
    G.fx.forEach(p=>{ const q=E.project(p.x,p.h,p.z); if(!q) return; ctx.globalAlpha=clamp(p.life,0,1); ctx.fillStyle=p.c; const s=Math.max(2,q.s*.12); ctx.fillRect(q.x,q.y,s,s*1.6); }); ctx.globalAlpha=1;
    G.floaters.forEach(f=>{ const q=E.project(f.x,f.h,f.z); if(!q) return; ctx.globalAlpha=clamp(f.life*1.5,0,1); label(f.text,q.x,q.y,f.color,f.size); }); ctx.globalAlpha=1; }
  function drawBanner(){ const b=G.banner; if(!b) return; const ctx=E.ctx(), {W,H}=E.size(), k=Math.min(1,b.t*5), s=.7+.3*(1-Math.pow(1-k,3)); const fade=b.dur?clamp((b.dur-b.t)*3,0,1):1; const y=H*(E.portrait?.34:.36);
    ctx.save(); ctx.globalAlpha=k*fade; const g=ctx.createLinearGradient(0,0,W,0); g.addColorStop(0,"rgba(4,12,18,0)"); g.addColorStop(.2,"rgba(4,12,18,.72)"); g.addColorStop(.8,"rgba(4,12,18,.72)"); g.addColorStop(1,"rgba(4,12,18,0)");
    ctx.fillStyle=g; ctx.fillRect(0,y-52,W,104); ctx.translate(W/2,y); ctx.scale(s,s);
    ctx.font=`900 ${Math.round(clamp(W*.085,28,58))}px "Arial Black",Impact,system-ui`; ctx.textAlign="center"; ctx.lineWidth=7; ctx.strokeStyle="rgba(0,0,0,.55)"; ctx.strokeText(b.text,0,8); ctx.fillStyle=b.color; ctx.fillText(b.text,0,8);
    if(b.sub){ ctx.font="700 14px system-ui"; ctx.fillStyle="rgba(255,255,255,.92)"; ctx.fillText(b.sub.length>60?b.sub.slice(0,58)+"…":b.sub,0,38); } ctx.restore(); }

  // ---------- döngü ----------
  let last=performance.now(), running=false;
  const UPD={pass:updatePass,target:updateTarget,fg:updateKick,punt:updateKick,run:updateRun,tackle:updateTackle,dive:updateDive};
  function simulate(dt){
    if(!G.shot) return;
    if(G.hooks.tick) G.hooks.tick(dt);
    if(G.paused) return;
    if(G.phase==="aim"&&(G.swipe||G.drawing))dt*=.22;
    if(G.phase==="aim"&&G.t<1.4)dt*=.55;
    G.t+=dt;if(G.shot.career&&['aim','live','carry'].includes(G.phase)){G.P.audioAt=(G.P.audioAt||0)-dt;if(G.P.audioAt<=0){SFX.play('crowd');G.P.audioAt=3.4;}if(G.phase==='carry'&&Math.floor(G.t*3)!==Math.floor((G.t-dt)*3))SFX.play('step');}
    if(G.phase!=="done"&&G.phase!=="presnap") UPD[G.shot.type](dt);
    if(G.phase!==G._hudPhase){ G._hudPhase=G.phase; hud(); } // B5: faz değişimi anında arayüze yansır
    G.ents.forEach(e=>{ if(!e.moving) e.anim+=dt*.6; });
    if(G.pending){ G.pending.timer-=dt; if(G.pending.timer<=0) resolve(); }
    G.fx.forEach(p=>{ p.life-=dt; p.x+=p.vx*dt; p.z+=p.vz*dt; p.h+=p.vh*dt; p.vh-=12*dt; }); G.fx=G.fx.filter(p=>p.life>0&&p.h>-.5);
    G.floaters.forEach(f=>{ f.life-=dt; f.h+=1.4*dt; }); G.floaters=G.floaters.filter(f=>f.life>0);
    if(G.banner){ G.banner.t+=dt; if(G.banner.dur&&G.banner.t>G.banner.dur) G.banner=null; }
    E.cheer=Math.max(0,(E.cheer||0)-dt*.4);
    updateCamera(dt);
  }
  function quadZ(z1,z2,color){ E.poly([[-E.FIELD_W,0,z1],[E.FIELD_W,0,z1],[E.FIELD_W,0,z2],[-E.FIELD_W,0,z2]],color); }
  function frame(now){
    const dt=Math.min(.04,(now-last)/1000); last=now;
    if(running&&G.shot){ try{
      const steps=window.__simSteps||1, sdt=steps>1?1/30:dt; for(let i=0;i<steps;i++) simulate(sdt);
      if(!window.__noRender){ const sh=G.shot, P=G.P;
        const los=sh.type==="tackle"?null:(sh.los||(sh.type==="run"?35:30));
        const fd=(sh.career||sh.type==="run")&&!sh.goal?los+sh.yards:null;
        E.render({ents:G.ents,ball:G.ball,props:G.props,home:home(),away:away(),awayName:G.level.team.name,stage:G.level.stage||"camp",los,fd,markers:G.markers,
          underlay:()=>{ if(sh.type==="punt"&&P.zoneZ) quadZ(P.zoneZ[0],P.zoneZ[1],"rgba(255,106,19,.38)"); if(sh.type==="tackle"){ quadZ(P.failZ-.12,P.failZ+.12,"rgba(255,214,0,.95)"); quadZ(P.losZ-.12,P.losZ+.12,"rgba(60,140,255,.95)"); } }},
          now/1000,()=>{ overlay(); drawFx(); drawBanner(); });
        if(Math.floor(now/250)!==Math.floor((now-dt*1000)/250)) hud(); }
    }catch(err){ console.error("Fourth & Glory döngü hatası:",err); } }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ---------- giriş ----------
  function addPathPoint(p){ const g=E.toGround(p.x,p.y); if(!g) return; const P=G.P, path=G.path; const lastP=path.length?path[path.length-1]:{x:P.rb.x,z:P.rb.z};
    if(Math.hypot(g.x-lastP.x,g.z-lastP.z)>.5) path.push({x:clamp(g.x,-27,27),z:g.z}); }
  function attachInput(canvas){
    const pos=e=>{ const r=canvas.getBoundingClientRect(); return {x:e.clientX-r.left,y:e.clientY-r.top}; };
    canvas.addEventListener("pointerdown",e=>{
      if(!G.shot||G.paused||!["aim","presnap"].includes(G.phase)) return; e.preventDefault(); SFX.unlock(); canvas.setPointerCapture&&canvas.setPointerCapture(e.pointerId);
      const p=pos(e);
      if(G.shot.type==="run"){ if(G.P.running) return; G.path=[{x:G.P.rb.x,z:G.P.rb.z}]; G.drawing=true; addPathPoint(p); return; }
      if(G.shot.type==="dive"&&!G.P.thrown) return;
      G.swipe={pts:[{...p,t:performance.now()}]};
    });
    canvas.addEventListener("pointermove",e=>{ const p=pos(e); if(G.drawing){ addPathPoint(p); return; } if(G.swipe) G.swipe.pts.push({...p,t:performance.now()}); });
    const up=e=>{
      if(G.swipe&&e)G.swipe.pts.push({...pos(e),t:performance.now()});
      if(G.drawing){ G.drawing=false; if(!startRun(G.path||[])) G.path=null; return; }
      if(!G.swipe) return; const pts=G.swipe.pts; G.swipe=null; if(pts.length<2) return;
      if(G.shot.career){const target=chosenTarget(pts);if(target){selectReceiver(G.P.wrs.indexOf(target));}if(Math.hypot(pts.at(-1).x-pts[0].x,pts.at(-1).y-pts[0].y)>35&&G.phase==="aim"){G.P.lead={x:clamp((pts.at(-1).x-pts[0].x)/E.size().W*3,-2,2),z:clamp((pts.at(-1).y-pts[0].y)/E.size().H*2,-1,1)};throwBall(pts);}return;}
      if(G.phase!=="aim")return;
      const t=G.shot.type;
      if(t==="pass"||t==="target") throwBall(pts); else if(t==="fg"||t==="punt") kick(pts); else if(t==="tackle") dashTo(pts); else if(t==="dive") diveTo(pts);
    };
    canvas.addEventListener("pointerup",up); canvas.addEventListener("pointercancel",()=>{G.swipe=null;G.path=null;G.drawing=false;});
  }

  window.FG_GAME={ snap,selectReceiver,passSelected,moveControl, startLevel, attachInput, G, setRunning:v=>{ running=v; }, pause:v=>{ G.paused=v;if(v){G.swipe=null;G.path=null;G.drawing=false;moveControl(0,0);} },
    setPassType:t=>{ G.passType=t; hud(); }, hooks:G.hooks, _simulate:simulate, _throw:throwBall, _kick:kick, _run:startRun, _dash:dashTo, _dive:diveTo, _restartShot:()=>startShot(true), PASS, swipeLaunch, predict };
})();
