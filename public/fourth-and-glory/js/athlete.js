// Fourth & Glory — prosedürel oyuncu çizimi (3/4 üstten görünüm)
// Her oyuncu: gölge, krampon, çorap, pantolon, forma + numara, omuzluk, kollar/eldiven, kask + yüz maskesi.
(function(){
  if(!CanvasRenderingContext2D.prototype.roundRect){ CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h,r){ r=Math.min(r,w/2,h/2); this.moveTo(x+r,y); this.arcTo(x+w,y,x+w,y+h,r); this.arcTo(x+w,y+h,x,y+h,r); this.arcTo(x,y+h,x,y,r); this.arcTo(x,y,x+w,y,r); this.closePath(); return this; }; }
  const SKINS=["#5a3a22","#7b4b2a","#9c6a43","#c68b5e","#e0ac7e","#f1c9a0"];
  function shade(hex,amt){
    const n=parseInt(hex.slice(1),16); let r=(n>>16)&255,g=(n>>8)&255,b=n&255;
    const f=amt<0?0:255, p=Math.abs(amt);
    r=Math.round((f-r)*p+r); g=Math.round((f-g)*p+g); b=Math.round((f-b)*p+b);
    return "#"+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
  }
  function skinFor(num){ return SKINS[(num*7+3)%SKINS.length]; }
  function seg(c,x1,y1,x2,y2,w,color){ c.strokeStyle=color; c.lineWidth=w; c.lineCap="round"; c.beginPath(); c.moveTo(x1,y1); c.lineTo(x2,y2); c.stroke(); }
  function ell(c,x,y,rx,ry,fill){ c.beginPath(); c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,Math.PI*2); c.fillStyle=fill; c.fill(); }

  // Kol: omuz → dirsek → el. Üst kol forma renginde, ön kol ten, el eldiven.
  function arm(c,sx,sy,hx,hy,u,col,skin,glove,bend){
    const mx=(sx+hx)/2+bend*u, my=(sy+hy)/2+Math.abs(bend)*.4*u;
    seg(c,sx,sy,mx,my,6.6*u,shade(col.jersey,-.08));
    seg(c,mx,my,hx,hy,5*u,skin);
    seg(c,sx+(mx-sx)*.62,sy+(my-sy)*.62,sx+(mx-sx)*.74,sy+(my-sy)*.74,6.8*u,col.trim); // kol bandı
    ell(c,hx,hy,3.2*u,3.2*u,glove);
  }

  function drawBody(c,a,u){
    const col=a.colors, front=a.facing==="down", skin=a.skin||skinFor(a.num||0);
    const glove=a.glove||"#1d232a";
    const ph=a.anim||0, mv=Math.min(1,a.moving||0), sw=Math.sin(ph)*mv;
    const bob=-Math.abs(Math.cos(ph))*mv*2.2*u + (a.pose==="stance"?6*u:a.pose==="kneel"?11*u:0);
    const crouch=a.pose==="stance"?1:0;

    // BACAKLAR — arkadaki önce
    const legs=[-1,1].map(i=>{ const s=sw*i; return {i,s,lift:Math.max(0,s)*6*u}; }).sort((p,q)=>q.lift-p.lift);
    legs.forEach(({i,s,lift})=>{
      const hx=i*4.6*u, hy=-20*u+bob;
      let fx=i*(5.4+crouch*3)*u + s*.6*u, fy=-1.2*u-lift;
      let kx=(hx+fx)/2+i*(1+crouch*2)*u, ky=(hy+fy)/2-lift*.35-crouch*2*u;
      if(a.pose==="kick"&&i===1){ const k=a.kickT||0; fx=(3+k*3)*u; fy=-2*u-k*20*u; kx=(hx+fx)/2+2*u; ky=(hy+fy)/2+(1-k)*3*u; }
      if(a.pose==="kneel"){ fx=i*7*u; fy=-1.2*u; kx=i*8*u; ky=-5*u; }
      seg(c,hx,hy,kx,ky,8*u,col.pants);
      seg(c,kx,ky,fx,fy-1.5*u,6*u,a.sock||shade(col.jersey,-.25));
      ell(c,fx+(front?0:0),fy,4.4*u,2.6*u,"#14181d");
      ell(c,fx-1*u,fy-.8*u,1.8*u,1*u,"rgba(255,255,255,.25)");
    });

    // PANTOLON & KEMER
    c.fillStyle=col.pants; c.beginPath(); c.roundRect(-10.5*u,-27*u+bob,21*u,10*u,4*u); c.fill();
    c.fillStyle=shade(col.pants,-.25); c.fillRect(-10.5*u,-26.5*u+bob,21*u,2*u);
    c.fillStyle=col.trim; c.fillRect(-10.5*u,-24*u+bob,2*u,7*u); c.fillRect(8.5*u,-24*u+bob,2*u,7*u);

    // KOL POZLARI
    const sL={x:-14*u,y:-41*u+bob}, sR={x:14*u,y:-41*u+bob};
    let hL,hR,bL=-3,bR=3, armsBehind=false;
    switch(a.pose){
      case "throw":   hL={x:-7*u,y:-34*u+bob}; hR={x:17*u,y:-60*u+bob}; bR=5; break;
      case "release": hL={x:-15*u,y:-28*u+bob}; hR={x:6*u,y:-62*u+bob}; bR=-2; break;
      case "catch":   hL={x:-7*u,y:-66*u+bob}; hR={x:7*u,y:-66*u+bob}; bL=-4; bR=4; break;
      case "reach":   hL={x:-10*u,y:-58*u+bob}; hR={x:10*u,y:-58*u+bob}; bL=-5; bR=5; break;
      case "tackle":  hL={x:-11*u,y:-50*u+bob}; hR={x:11*u,y:-50*u+bob}; bL=-6; bR=6; break;
      case "block":   hL={x:-8*u,y:-44*u+bob}; hR={x:8*u,y:-44*u+bob}; bL=-6; bR=6; break;
      case "carry":   hL={x:-4*u,y:-33*u+bob}; hR={x:15*u,y:-25*u+bob+(-sw)*5*u}; bL=-2; break;
      case "stance":  hL={x:-11*u,y:-12*u+bob}; hR={x:11*u,y:-12*u+bob}; break;
      case "kick":    hL={x:-19*u,y:-46*u+bob}; hR={x:17*u,y:-30*u+bob}; bL=-5; break;
      case "kneel":   hL={x:-4*u,y:-14*u+bob}; hR={x:5*u,y:-12*u+bob}; break;
      default:        hL={x:-15*u,y:-26*u+bob+sw*5*u}; hR={x:15*u,y:-26*u+bob-sw*5*u};
    }
    if(!front && (a.pose==="catch"||a.pose==="reach")) armsBehind=false;

    // GÖVDE (forma)
    const top=-45*u+bob, waist=-24*u+bob;
    const g=c.createLinearGradient(-17*u,0,17*u,0);
    g.addColorStop(0,shade(col.jersey,.12)); g.addColorStop(.55,col.jersey); g.addColorStop(1,shade(col.jersey,-.22));
    c.fillStyle=g; c.beginPath();
    c.moveTo(-17*u,top+6*u); c.quadraticCurveTo(-17.5*u,top,-10*u,top-.5*u); c.lineTo(10*u,top-.5*u);
    c.quadraticCurveTo(17.5*u,top,17*u,top+6*u); c.lineTo(10.5*u,waist); c.lineTo(-10.5*u,waist); c.closePath(); c.fill();
    // omuzluk kapakları + çizgiler
    [-1,1].forEach(i=>{
      ell(c,i*13*u,top+4*u,7*u,4.6*u,shade(col.jersey,i<0?.18:-.05));
      c.strokeStyle=col.trim; c.lineWidth=1.6*u; c.beginPath(); c.ellipse(i*13*u,top+4.5*u,5.2*u,3.2*u,0,Math.PI*1.1,Math.PI*1.9); c.stroke();
    });
    // yaka
    c.fillStyle=front?shade(col.jersey,-.35):shade(col.jersey,-.2);
    c.beginPath(); c.ellipse(0,top+.5*u,5*u,2.4*u,0,0,Math.PI*2); c.fill();
    // numara
    if(a.num!=null){
      const fs=Math.round((front?9:11.5)*u);
      c.font=`900 ${fs}px "Arial Black", Impact, system-ui`; c.textAlign="center"; c.textBaseline="middle";
      c.lineWidth=2.4*u; c.strokeStyle=shade(col.jersey,-.45); c.strokeText(String(a.num),0,-32*u+bob);
      c.fillStyle=col.trim; c.fillText(String(a.num),0,-32*u+bob);
      c.textBaseline="alphabetic";
    }

    // KOLLAR
    arm(c,sL.x,sL.y,hL.x,hL.y,u,col,skin,glove,bL);
    arm(c,sR.x,sR.y,hR.x,hR.y,u,col,skin,glove,bR);
    a._hand={x:hR.x,y:hR.y}; a._hands={x:(hL.x+hR.x)/2,y:(hL.y+hR.y)/2};

    // BOYUN
    c.fillStyle=shade(skin,-.15); c.fillRect(-3.6*u,top-6*u,7.2*u,6*u);

    // KASK
    const hy=top-11.5*u, r=10.8*u;
    const hg=c.createRadialGradient(-3.5*u,hy-4*u,1*u,0,hy,r*1.1);
    hg.addColorStop(0,shade(col.helmet,.45)); hg.addColorStop(.35,col.helmet); hg.addColorStop(1,shade(col.helmet,-.35));
    c.fillStyle=hg; c.beginPath(); c.arc(0,hy,r,0,Math.PI*2); c.fill();
    // orta şerit
    c.save(); c.beginPath(); c.arc(0,hy,r,0,Math.PI*2); c.clip();
    c.fillStyle=col.stripe||col.trim; c.fillRect(-1.7*u,hy-r,3.4*u,front?r*.9:r*2);
    c.restore();
    if(front){
      // yüz açıklığı
      ell(c,0,hy+3.6*u,6.6*u,5.4*u,shade(skin,-.2));
      if(a.visor){
        c.fillStyle="rgba(12,18,26,.92)"; c.beginPath(); c.roundRect(-6.6*u,hy+.4*u,13.2*u,4*u,1.6*u); c.fill();
        c.fillStyle="rgba(140,200,255,.35)"; c.fillRect(-4.5*u,hy+1*u,4*u,1*u);
      } else {
        ell(c,-2.4*u,hy+2.2*u,1.1*u,1.1*u,"#111"); ell(c,2.4*u,hy+2.2*u,1.1*u,1.1*u,"#111");
      }
      // yüz maskesi (kafes)
      c.strokeStyle="#c9d1d8"; c.lineWidth=1.3*u; c.lineCap="round";
      c.beginPath(); c.moveTo(-7.2*u,hy+5*u); c.lineTo(7.2*u,hy+5*u); c.moveTo(-6.4*u,hy+7.6*u); c.lineTo(6.4*u,hy+7.6*u);
      c.moveTo(0,hy+4.6*u); c.lineTo(0,hy+8.4*u); c.moveTo(-7.4*u,hy+1.2*u); c.lineTo(-6.4*u,hy+7.6*u); c.moveTo(7.4*u,hy+1.2*u); c.lineTo(6.4*u,hy+7.6*u); c.stroke();
    } else {
      // kaskın arka kenarı
      c.strokeStyle=shade(col.helmet,-.45); c.lineWidth=1.6*u; c.beginPath(); c.arc(0,hy,r-.8*u,Math.PI*.2,Math.PI*.8); c.stroke();
    }
    // parlama
    ell(c,-4*u,hy-5*u,3*u,1.6*u,"rgba(255,255,255,.35)");
  }

  // a = {x,y,facing:'up'|'down',pose,anim,moving,num,colors,skin,glove,visor,scale,lean,fall,fallDir,ring,label,alpha}
  function drawAthlete(c,a){
    const u=a.scale||1;
    c.save(); c.globalAlpha=a.alpha==null?1:a.alpha;
    // gölge
    const fall=a.fall||0;
    c.fillStyle="rgba(0,0,0,.30)";
    c.beginPath(); c.ellipse(a.x+3*u+fall*a.fallDir*22*u, a.y+1*u, (15+fall*20)*u, (5+fall*2)*u, 0, 0, Math.PI*2); c.fill();
    // kontrol edilen oyuncu halkası
    if(a.ring){
      const pulse=.5+.5*Math.sin(performance.now()/180);
      c.strokeStyle=a.ring; c.lineWidth=2.4*u; c.globalAlpha*=.55+.45*pulse;
      c.beginPath(); c.ellipse(a.x,a.y,19*u,7*u,0,0,Math.PI*2); c.stroke();
      c.globalAlpha=a.alpha==null?1:a.alpha;
    }
    c.translate(a.x,a.y);
    const rot=(a.lean||0)+fall*(a.fallDir||1)*Math.PI*.48;
    if(rot) c.rotate(rot);
    drawBody(c,a,u);
    c.restore();
    if(a.label && !fall){
      const ly=a.y-78*u; c.save();
      c.font=`900 ${Math.max(9,Math.round(9.5*u))}px system-ui`; c.textAlign="center";
      const w=c.measureText(a.label).width+12;
      c.fillStyle="rgba(6,17,26,.82)"; c.beginPath(); c.roundRect(a.x-w/2,ly-11,w,16,8); c.fill();
      c.fillStyle=a.ring||"#fff"; c.fillText(a.label,a.x,ly+1); c.restore();
    }
  }

  // top: h = yerden yükseklik (px)
  function drawBall(c,x,y,h,rot,u){
    u=u||1;
    if(h>0){ const s=Math.max(.35,1-h/220); c.fillStyle=`rgba(0,0,0,${.28*s})`; c.beginPath(); c.ellipse(x+h*.15,y,9*u*s,3.5*u*s,0,0,Math.PI*2); c.fill(); }
    c.save(); c.translate(x,y-h); c.rotate(rot||0);
    const g=c.createLinearGradient(0,-6*u,0,6*u); g.addColorStop(0,"#b8683a"); g.addColorStop(1,"#6e3416");
    c.fillStyle=g; c.beginPath(); c.ellipse(0,0,9.5*u,5.8*u,0,0,Math.PI*2); c.fill();
    c.strokeStyle="#f4ece0"; c.lineWidth=1.1*u;
    c.beginPath(); c.moveTo(-3.5*u,0); c.lineTo(3.5*u,0); for(let i=-2;i<=2;i++){ c.moveTo(i*1.6*u,-1.4*u); c.lineTo(i*1.6*u,1.4*u); } c.stroke();
    c.beginPath(); c.arc(-7*u,0,2.6*u,-.9,.9); c.stroke(); c.beginPath(); c.arc(7*u,0,2.6*u,Math.PI-.9,Math.PI+.9); c.stroke();
    c.restore();
  }

  window.FG_ART={drawAthlete,drawBall,shade,skinFor};
})();
