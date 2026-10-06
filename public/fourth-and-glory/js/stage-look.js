/* Aşama görünüm tablosu: ışık, gökyüzü, sis, pozlama ve harita tonu TEK kaynaktan gelir.
   gl3d-enhanced.js (WebGL), engine.js (2D yedek) ve map.js bunu okur. */
(function(){
  const STAGES={
    camp:   {sky:["#5f93c9","#a9c9e6","#dfeaf3"], sun:{color:"#fff0d9",int:2.8,elev:55,az:-35}, amb:{sky:"#e7f3ff",ground:"#41533b",int:2.3},
             rim:{color:"#b0dbff",int:.7}, fog:null, exposure:1.15, mapTint:null, dust:0, lights:0, stars:0},
    // Kolej: altın saat. Maç ilerledikçe güneş alçalır, 3. play'den itibaren ışıklar yanar (pro gecesinin habercisi).
    college:{sky:["#4f6e9c","#e9a86c","#f8d6a4"], sun:{color:"#ffc58a",int:3.0,elev:13,az:-105}, amb:{sky:"#ffd9b0",ground:"#4a3b2a",int:1.75},
             rim:{color:"#ffe2b8",int:1.1}, fog:{color:"#e9b98c",near:115,far:320}, exposure:1.05, mapTint:"#8a5a33", dust:1, lights:0, stars:0,
             end:{sky:["#2e4470","#c9785a","#f1b27c"],sun:{color:"#ff9f68",int:2.2,elev:5},amb:{int:1.35},exposure:1.0,lights:1}},
    combine:{sky:["#8a9bb0","#c4cfdb","#e3e8ed"], sun:{color:"#f2f6ff",int:2.4,elev:60,az:-20}, amb:{sky:"#eef3f8",ground:"#4b5560",int:2.4},
             rim:{color:"#d4e4ff",int:.8}, fog:null, exposure:1.1, mapTint:"#46566a", dust:0, lights:0, stars:0},
    pro:    {sky:["#050b14","#0e1d31","#1f3654"], sun:{color:"#dbeaff",int:1.5,elev:70,az:10}, amb:{sky:"#9fb7d6",ground:"#1b2633",int:1.8},
             rim:{color:"#cfe6ff",int:1.6}, fog:{color:"#26374a",near:90,far:240}, exposure:1.0, mapTint:"#203750", dust:0, lights:1, stars:1}
  };
  const hex=c=>{ c=String(c).replace('#',''); if(c.length===3) c=[...c].map(x=>x+x).join(''); const n=parseInt(c,16); return [(n>>16)&255,(n>>8)&255,n&255]; };
  const toHex=([r,g,b])=>'#'+[r,g,b].map(v=>Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,'0')).join('');
  const mixC=(a,b,t)=>{ const A=hex(a),B=hex(b); return toHex(A.map((v,i)=>v+(B[i]-v)*t)); };
  const lerp=(a,b,t)=>a+(b-a)*t;
  function resolve(stage,progress=0){
    const s=STAGES[stage]||STAGES.camp, e=s.end; if(!e) return s;
    const t=Math.max(0,Math.min(1,progress));
    return {...s,
      sky:s.sky.map((c,i)=>mixC(c,e.sky[i],t)),
      sun:{...s.sun,color:mixC(s.sun.color,e.sun.color,t),int:lerp(s.sun.int,e.sun.int,t),elev:lerp(s.sun.elev,e.sun.elev,t)},
      amb:{...s.amb,int:lerp(s.amb.int,e.amb.int,t)}, exposure:lerp(s.exposure,e.exposure,t),
      lights:t>=.6?1:0};
  }
  // Güneş yönü: az = derece (0 = +z, kameranın arkası), elev = ufuk üstü derece.
  function sunDir(look){ const el=look.sun.elev*Math.PI/180, az=(look.sun.az||0)*Math.PI/180; return [Math.sin(az)*Math.cos(el),Math.sin(el),Math.cos(az)*Math.cos(el)]; }

  // WCAG göreli parlaklık ve kontrast oranı.
  function luminance(c){ return hex(c).map(v=>{ v/=255; return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4); }).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0); }
  function contrast(a,b){ const [x,y]=[luminance(a),luminance(b)].sort((p,q)=>q-p); return (x+.05)/(y+.05); }
  // Forma çakışma kuralı: rakip forması ev formasıyla 3:1'den az kontrastlıysa beyaz deplasman forması giyer.
  function awayKit(home,team){
    const k=team.kit||team, base={...k};
    if(contrast(home.jersey,k.jersey)>=3) return base;
    const white={...k,jersey:"#eef0ea",helmet:k.helmet||k.jersey,trim:k.jersey,number:k.jersey,numberOutline:k.trim||"#1d1d1d",pants:k.pants&&luminance(k.pants)>.5?k.pants:"#e3e4dc",away:true};
    if(contrast(home.jersey,white.jersey)>=3) return white;
    return contrast(home.jersey,k.trim||"#1d1d1d")>contrast(home.jersey,k.jersey)?{...k,jersey:k.trim,trim:k.jersey,away:true}:base;
  }
  window.FG_LOOK={STAGES,resolve,sunDir,luminance,contrast,awayKit,mix:mixC};
})();
