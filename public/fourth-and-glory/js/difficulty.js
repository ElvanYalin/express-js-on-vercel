/* Zorluk tablosu ve dinamik zorluk ayarı (DDA).
   Tasarımcı sayıları buradan ayarlar; game.js yalnızca FG_DIFF.get(...) sonucunu kullanır.
   vision: topun iniş noktasını okuyabilme mesafesi (m) | hold: cep süresi (s) | dbRatio: DB hızı / WR hızı | react: topa tepki gecikmesi (s)
   intR: INT/PBU yarıçapı (m) | catchR: taban yakalama yarıçapı (m) | assist: nişan yardımı 0..1
   k: seviye zorluk çarpanı (tests/balance.cjs botlarıyla hedef eğriye ayarlandı; L1–L2 ilk kez oynayan oyuncuya göre)
   lead: takipte önden kesme oranı (0 = doğrudan kovalama, 1 = kesişme noktası) | tackleR: tackle mesafesi (m)
   clock: oyun saati (off/warn/on) | slow: snap sonrası ilk 1.4 sn zaman ölçeği | pursuit: takip hızı / taşıyıcı hızı */
(function(){
  const levels={
     1:{k:0.65,vision:5.5,hold:6.0,dbRatio:.80,react:.55,intR:.70,catchR:1.10,assist:1.00,clock:"off", slow:.55,lead:0,tackleR:0.55,pursuit:.70},
     2:{k:0.36,vision:5.9,hold:4.6,dbRatio:.86,react:.45,intR:.75,catchR:1.05,assist:.85, clock:"warn",slow:.65,lead:0.4,tackleR:0.65,pursuit:.78},
     3:{k:0.40,vision:6.3,hold:4.3,dbRatio:.90,react:.38,intR:.80,catchR:1.00,assist:.70, clock:"on",  slow:.75,lead:0.8,tackleR:0.72,pursuit:.84},
     4:{k:0.64,vision:6.8,hold:4.0,dbRatio:.94,react:.32,intR:.86,catchR:.95, assist:.60, clock:"on",  slow:.85,lead:1,tackleR:0.8,pursuit:.88},
     5:{k:0.60,vision:7.2,hold:4.0,dbRatio:.93,react:.30,intR:.86,catchR:.95, assist:.55, clock:"on",  slow:.90,lead:1,tackleR:0.8,pursuit:.88}, // nefes
     6:{k:0.62,vision:7.7,hold:3.6,dbRatio:.97,react:.25,intR:.95,catchR:.90, assist:.45, clock:"on",  slow:1,  lead:1,tackleR:0.8,pursuit:.92},
     7:{k:0.62,vision:8.2,hold:4.4,dbRatio:.90,react:.34,intR:.84,catchR:.92, assist:.40, clock:"on",  slow:1,  lead:1,tackleR:0.8,pursuit:.86}, // combine: nefes
     8:{k:0.64,vision:8.6,hold:3.5,dbRatio:.98,react:.22,intR:1.0,catchR:.88, assist:.35, clock:"on",  slow:1,  lead:1,tackleR:0.8,pursuit:.94},
     9:{k:0.63,vision:9.1,hold:3.3,dbRatio:1.0,react:.20,intR:1.05,catchR:.86,assist:.30, clock:"on",  slow:1,  lead:1,tackleR:0.8,pursuit:.96},
    10:{k:0.61,vision:9.5,hold:3.1,dbRatio:1.02,react:.18,intR:1.10,catchR:.85,assist:.25,clock:"on",  slow:1,  lead:1,tackleR:0.8,pursuit:.98}
  };
  // Seviye içi rampa: son play (red zone) her zaman biraz daha zor.
  const playRamp=[1.00,1.03,1.06,1.10];
  // Erişilebilirlik ön ayarları: tablo değerlerini ölçekler (>1 daha zor).
  const presets={rookie:.82,pro:1.00,allpro:1.12,glory:1.25};
  // Hedef: "ortalama" oyuncunun seviyeyi ilk denemede bitirme oranı (tests/balance.cjs doğrular).
  // İlk iki seviye öğretici: oyunu ilk kez oynayan biri de geçebilmeli (tests/balance.cjs "first" botu ≥%75 / ≥%55).
  const targets=[.97,.95,.88,.80,.85,.72,.78,.65,.45,.38];
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  const FG_DDA=(function(){
    const S={skill:0,fails:0};
    const BAND=.08;                                   // en fazla ±%8 etki
    function enabled(){ try{ return FG_STATE.get().settings.adaptive!==false; }catch(e){ return true; } }
    function onPlay(r){ S.skill=clamp(S.skill*.75+(r-.65)*.5,-1,1); S.fails=r?0:S.fails+1; }  // r: 1 temiz, .6 baskılı, 0 başarısız
    function factor(level){
      if(!enabled()||level?.final) return 1;          // final seviyede kapalı
      const help=Math.min(S.fails,3)*.02;             // üst üste 3 hatada +%6 yardım
      return clamp(1+S.skill*BAND-help,1-BAND,1+BAND);
    }
    function reset(){ S.skill=0; S.fails=0; }
    return {onPlay,factor,reset,_s:S};
  })();

  function get(level,play){
    const id=typeof level==="object"?level.id:level, b=levels[id]||levels[10];
    let preset="pro"; try{ preset=FG_STATE.get().settings.difficulty||"pro"; }catch(e){}
    const m=(b.k||1)*(playRamp[play]||1)*(presets[preset]||1)*FG_DDA.factor(typeof level==="object"?level:null);
    return {...b,
      hold:b.hold/m, react:b.react/m, dbRatio:b.dbRatio*Math.sqrt(m), intR:b.intR*Math.sqrt(m), vision:b.vision*Math.sqrt(m),
      catchR:b.catchR/Math.sqrt(m), assist:clamp(b.assist/m,0,1), pursuit:clamp(b.pursuit*Math.sqrt(m),.4,1.08),
      clock:preset==="rookie"&&b.clock==="on"?"warn":b.clock, m};
  }
  window.FG_DIFF={levels,playRamp,presets,targets,get};
  window.FG_DDA=FG_DDA;
})();
