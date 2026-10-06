// Fourth & Glory — ekran akışı: karakter → harita → seviye → ödül/paket → gelişim
(function(){
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const GAME=FG_GAME, E=FG_ENGINE, S=FG_STATE, D=FG_DATA;
  let engineReady=false, level=null, toastT=0, pendingPacks=[];
  const RAR={common:"Common",rare:"Rare",epic:"Epic",legendary:"Legendary"};

  function toast(msg){ const t=$("#toast"); t.textContent=msg; t.classList.add("show"); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove("show"),2600); }
  const UIS=FG_UISTATE;
  function show(id){ UIS.screen(id); }
  function overlay(id,on){ on?UIS.open(id):UIS.close(id); }
  function crestEl(el,team){ el.textContent=team.short; el.style.background=team.jersey; el.style.color=team.trim; }
  const homeCrest=()=>({short:FG_CAREER.currentTeam(level?.id)?.short||"G",jersey:D.homeKit.jersey,trim:D.homeKit.trim});
  const swatch=v=>v===true?"#0b0b0b":v==="team"?D.homeKit.trim:(v||"transparent");
  const catName=c=>(D.CATS.find(x=>x[0]===c)||[c,c])[1];
  const RAR_COLOR={common:"#9aa7b4",rare:"#3d8bff",epic:"#a65cff",legendary:"#ffc83d"};

  // ================= KARAKTER OLUŞTURMA =================
  let draft=null, editing=false;
  function draftModel(){ const k={...D.homeKit}, g={};
    (draft.startGear||[]).forEach(id=>{ const it=S.item(id); if(!it) return; if(it.cat==="sleeve") g.sleeve=it.val==="team"?k.trim:it.val; else if(it.cat==="eyeBlack") g.eyeBlack=true; else g[it.cat]=it.val; });
    if(editing){ const m=S.playerModel(); Object.assign(g,m.gear); Object.assign(k,m.colors); }
    return {num:draft.number,colors:k,gear:g,lefty:draft.hand==="L",pose:"apose",helmetOff:!!draft._face,look:{skin:draft.skin,hair:draft.hair,hairColor:draft.hairColor,beard:draft.beard,height:draft.height,weight:draft.weight,face:draft.face,throwStyle:draft.throwStyle,stance:draft.stance}}; }
  function refreshCreator(){
    for(const [id,key,def]of [["crFace","face","natural"],["crThrow","throwStyle","classic"],["crStance","stance","balanced"]])$$("#"+id+" button").forEach(b=>b.classList.toggle("on",b.dataset.v===(draft[key]||def)));
    $$("#crBuild button").forEach(b=>{b.classList.toggle("on",b.dataset.build===(draft.build||"balanced"));b.disabled=editing;});
    FG_PREVIEW.show($("#creatorCanvas"),draftModel(),{shot:draft._shot||(draft._face?"face":"full"),glow:draft._glow||"#b7ff4c"});
    $("#crNum").textContent=draft.number; $("#crNumBadge").textContent=draft.number; $("#crPosBadge").textContent=draft.position;
    $("#crHeightLbl").textContent=`${(1.78+draft.height*.2).toFixed(2).replace(".",",")} m`; $("#crWeightLbl").textContent=`${Math.round(85+draft.weight*35)} kg`;
    $$("#crPos button").forEach(b=>b.classList.toggle("on",b.dataset.v===draft.position));
    $("#crPosNote").textContent=editing?"Pozisyon kariyer başında seçilir, değiştirilemez.":`${D.POSITIONS[draft.position].name}: ${Object.keys(D.POSITIONS[draft.position].bonus).map(k=>D.ATTR[k].name).join(", ")} yüksek başlar.`;
    $$("#crHand button").forEach(b=>b.classList.toggle("on",b.dataset.hand===draft.hand));
    $$("#crSkin button").forEach(b=>b.classList.toggle("on",b.dataset.v===draft.skin));
    $$("#crHair button").forEach(b=>b.classList.toggle("on",b.dataset.v===draft.hair));
    $$("#crHairColor button").forEach(b=>b.classList.toggle("on",b.dataset.v===draft.hairColor));
    $$("#crBeard button").forEach(b=>b.classList.toggle("on",b.dataset.v===draft.beard));
    $$("#crAcc button").forEach(b=>b.classList.toggle("on",(draft.startGear||[]).includes(b.dataset.v)));
    $("#helmetOn").classList.toggle("on",!draft._face); $("#helmetOff").classList.toggle("on",!!draft._face);
  }
  function openCreator(edit){
    editing=!!edit; const p=S.get().profile;
    draft=edit&&p?{...p,startGear:[]}:{name:"ROOKIE",number:12,position:"QB",hand:"R",skin:D.skins[2],hair:"short",hairColor:D.hairColors[1],beard:"stubble",height:.55,weight:.5,startGear:["slv_black"]};
    $("#crName").value=draft.name; $("#crHeight").value=Math.round(draft.height*100); $("#crWeight").value=Math.round(draft.weight*100);
    $("#creatorTitle").textContent=edit?"GÖRÜNÜMÜ DÜZENLE":"OYUNCUNU YARAT"; $("#crStart").textContent=edit?"KAYDET":"KARİYERE BAŞLA";
    $$("#crPos button").forEach(b=>b.disabled=editing); $('#crTabs [data-tab="acc"]').hidden=editing;
    show("creatorScreen"); selectTab("id"); refreshCreator();
  }
  // Sekme → kamera çekimi: Kimlik kahraman açısı, Görünüm yüz, Fizik ve Aksesuar tam boy.
  function selectTab(t){ $$("#crTabs button").forEach(b=>b.classList.toggle("on",b.dataset.tab===t)); $$(".tab-body").forEach(b=>b.hidden=b.dataset.body!==t);
    if(draft){ draft._shot={id:"hero",look:"face",body:"full",acc:"full"}[t]||"full"; draft._face=t==="look"; refreshCreator(); } }
  function buildCreator(){
    $("#crBuild").innerHTML=Object.entries(D.BUILDS).map(([k,b])=>`<button data-build="${k}">${b.name}</button>`).join("");
    $$("#crBuild button").forEach(b=>b.onclick=()=>{draft.build=b.dataset.build;refreshCreator();});
    $("#crPos").innerHTML=["QB"].map(k=>`<button data-v="${k}">${k}</button>`).join("");
    $("#crSkin").innerHTML=D.skins.map(c=>`<button data-v="${c}" style="background:${c}" aria-label="Ten rengi"></button>`).join("");
    $("#crHair").innerHTML=D.hairs.map(([k,n])=>`<button data-v="${k}">${n}</button>`).join("");
    $("#crHairColor").innerHTML=D.hairColors.map(c=>`<button data-v="${c}" style="background:${c}" aria-label="Saç rengi"></button>`).join("");
    $("#crBeard").innerHTML=D.beards.map(([k,n])=>`<button data-v="${k}">${n}</button>`).join("");
    const acc=[["slv_black","Siyah kolluk"],["wb_orange","Turuncu bileklik"],["mg_orange","Dişlik"],["eb_on","Göz boyası"],["tp_white","Bilek bandı"],["twl_white","Havlu"]];
    $("#crAcc").innerHTML=acc.map(([id,n])=>`<button data-v="${id}">${n}</button>`).join("");
    $$("#crTabs button").forEach(b=>b.onclick=()=>selectTab(b.dataset.tab));
    $$("#crPos button").forEach(b=>b.onclick=()=>{ draft.position=b.dataset.v; refreshCreator(); });
    $$("#crHand button").forEach(b=>b.onclick=()=>{ draft.hand=b.dataset.hand; draft._shot="hands"; refreshCreator(); });
    for(const [id,key]of [["crFace","face"],["crThrow","throwStyle"],["crStance","stance"]])$$("#"+id+" button").forEach(b=>b.onclick=()=>{draft[key]=b.dataset.v;draft._face=key==="face";draft._shot=key==="face"?"face":"hero";refreshCreator();});
    const face=(k)=>b=>{ b.onclick=()=>{ draft[k]=b.dataset.v; draft._face=true; draft._shot="face"; refreshCreator(); }; };
    $$("#crSkin button").forEach(face("skin")); $$("#crHair button").forEach(face("hair")); $$("#crHairColor button").forEach(face("hairColor")); $$("#crBeard button").forEach(face("beard"));
    $$("#crAcc button").forEach(b=>b.onclick=()=>{ const v=b.dataset.v, g=draft.startGear||[]; if(g.includes(v)) draft.startGear=g.filter(x=>x!==v); else { if(g.length>=2) return toast("En fazla 2 aksesuar seçebilirsin."); draft.startGear=[...g,v]; } const it=S.item(v); draft._face=false; draft._shot=it?FG_PREVIEW.shotFor(it.cat):"full"; draft._glow=it?RAR_COLOR[it.rarity]:null; refreshCreator(); });
    $$("[data-num]").forEach(b=>b.onclick=()=>{ draft.number=(draft.number+(+b.dataset.num)+100)%100; refreshCreator(); });
    $("#crHeight").oninput=e=>{ draft.height=e.target.value/100; draft._face=false; draft._shot="full"; refreshCreator(); };
    $("#crWeight").oninput=e=>{ draft.weight=e.target.value/100; draft._face=false; draft._shot="full"; refreshCreator(); };
    $("#helmetOn").onclick=()=>{ draft._face=false; draft._shot="helmet"; refreshCreator(); };
    $("#helmetOff").onclick=()=>{ draft._face=true; draft._shot="face"; refreshCreator(); };
    $("#crName").oninput=e=>{ draft.name=e.target.value.toUpperCase().slice(0,14); };
    $("#crStart").onclick=()=>{ FG_AUDIO.unlock(); const p={...draft}; delete p._face; if(!String(p.name).trim()) p.name="ROOKIE"; if(editing) delete p.startGear;
      p.position="QB"; S.setProfile(p); FG_AUDIO.play("whistle"); openMap(); if(editing) openPlayer(); else toast("Kariyerin başladı! İlk paketin Paketler'de seni bekliyor."); };
  }

  // ================= HARİTA =================
  function refreshWallet(){ const s=S.get(); $("#cashCount").textContent=s.cash.toLocaleString("tr-TR"); $("#dpCount").textContent=s.dp; $("#dockOvr").textContent=S.overall();
    const n=Object.values(s.packs).reduce((a,b)=>a+b,0); $("#packBadge").textContent=n||""; $("#packBadge").dataset.n=n; }
  function openMap(){
    FG_CAREER_UI.map();
    GAME.setRunning(false); show("mapScreen"); ["#introOverlay","#endOverlay","#pauseOverlay","#openOverlay"].forEach(o=>overlay(o,false));
    FG_MAP.build(); requestAnimationFrame(()=>FG_MAP.scrollToCurrent(false)); refreshWallet();
    $("#playBtn").textContent=`OYNA · SEVİYE ${Math.min(S.get().unlocked,D.levels.length)}`;
  }

  // ================= SEVİYE GİRİŞİ =================
  function openIntro(l){
    // B4: aynı seviyenin girişi zaten açıksa ikinci dokunuş yok sayılır
    if(level===l&&$("#introOverlay").classList.contains("show")&&$("#gameScreen").classList.contains("active")) return;
    if(!l.practice&&FG_CAREER_UI.gate(l))return; FG_CAREER.sync(l.id);
    level=l; show("gameScreen"); $("#pauseBtn").disabled=false;
    if(!engineReady){ const fx=E.init($("#stage")); GAME.attachInput(fx); engineReady=true; } else E.resize();
    GAME.startLevel(l); GAME.pause(true); GAME.setRunning(true);
    $("#introTitle").textContent=l.practice?`ANTRENMAN ${l.id}`:`${l.chapter} · ${l.id}`; // Kolej maçları seçilen okulun stadyumunda oynanır; Seviye 2 = homecoming.
    const sc=FG_CAREER.currentTeam(l.id); $("#introVenue").textContent=!l.practice&&l.stage==="college"&&sc?`${sc.name} Stadyumu${l.id===2?" · Homecoming":""}`:l.team.venue;
    crestEl($("#introAwayCrest"),l.team); crestEl($("#introHomeCrest"),{...homeCrest(),short:homeCrest().short});
    document.querySelector("#introHomeCrest + b").textContent=FG_CAREER.currentTeam(l.id)?.name||"GLORY";
    $("#introAwayName").textContent=l.team.name.toUpperCase();
    const st=S.stars(l.id); $("#introStars").innerHTML=[1,2,3].map(k=>FG_MAP.starSvg(k<=st)).join("");
    $("#introMissions").innerHTML=l.shots.map(m=>{ const p=D.SHOT_INFO[m.type]; return `<li><span class="pos-chip">${p.label}</span><div><b>${m.title}</b><small>${p.name} · ${m.desc}</small></div></li>`; }).join("");
    overlay("#introOverlay",true);
  }

  // ================= HUD =================
  GAME.hooks.hud=info=>{
    FG_CAREER_UI.controls();
    if(!info.level) return; const sh=info.shot, si=D.SHOT_INFO[sh.type];
    crestEl($("#sbHomeCrest"),homeCrest()); crestEl($("#sbAwayCrest"),{...info.level.team,short:info.level.team.short[0]});
    $("#sbShot").textContent=`${info.index+1}/${info.count}`;
    $$("#lives i").forEach((i,k)=>i.classList.toggle("lost",k>=info.lives));
    $("#gdLabel").textContent=`${info.level.id} · ${si.label}`;
    $("#passPanel").classList.toggle("hide",!((sh.type==="pass"||sh.type==="target")&&["aim","presnap"].includes(info.phase)));
    $$("#passPanel button").forEach(b=>b.classList.toggle("on",b.dataset.pass===info.passType));
  };
  GAME.hooks.shot=sh=>{
    const si=D.SHOT_INFO[sh.type];
    $("#mpKicker").textContent=sh.type==="fg"?`${117-sh.los} YARD FIELD GOAL`:`${si.label} · ${si.name.toUpperCase()}`;
    $("#mpTitle").textContent=sh.title; $("#mpDesc").textContent=sh.desc;
    const h=$("#hint"); h.textContent=sh.career?"SNAP ile başlat → receiver seç → PAS AT. Sol kontrolle QB’yi hareket ettir.":({pass:'Receiver’a dokun veya ona doğru kaydır. Nişan alırken zaman yavaşlar.',target:'Turuncu hedefe dokun veya ona doğru kaydır.',fg:'Direklerin ortasına doğru kaydır. Güç yardımı mesafeyi ayarlar.',punt:'Yukarı kaydır; hedef bölgeye göre güç yardımı devrede.',dive:'Sarı halkaya dokun veya oraya doğru kaydır.'})[sh.type]||si.how; h.style.opacity=S.get().settings.guide?1:0; clearTimeout(h._t); h._t=setTimeout(()=>{ h.style.opacity=0; },6000);
  };
  GAME.hooks.toast=toast;
  // B1: sonuç anında kaydedilir; yalnızca sunum ertelenir ve ekran değişince iptal olur.
  function commitResult(l,res){
    if(!res.success||l.practice) return {cash:0,dp:0,packs:[],prestige:[],sets:[],unlockedNew:false};
    const r=S.finishLevel(l,res.stars); FG_CAREER.record(l.id,res.stats||{},true,res.stars); return r;
  }
  GAME.hooks.levelEnd=res=>{
    const l=level, committed=commitResult(l,res);
    $("#pauseBtn").disabled=true;
    UIS.later(()=>{ $("#pauseBtn").disabled=false; if(level!==l||!$("#gameScreen").classList.contains("active")) return; GAME.pause(true); showEnd(res,committed); },450);
  };

  // ================= SEVİYE SONU =================
  function showEnd(res,r){
    const l=level; overlay("#pauseOverlay",false); $("#endKicker").textContent=`SEVİYE ${l.id} · ${l.team.name.toUpperCase()}`;
    if(res.success){
      pendingPacks=r.packs.slice();
      $("#endTitle").textContent=l.final?"ŞAMPİYON!":"SEVİYE TAMAM!";
      $("#endStars").innerHTML=[1,2,3].map(k=>FG_MAP.starSvg(k<=res.stars,"big")).join("");
      let html=`<div class="gold"><span>Cash</span><b>+${r.cash} $</b></div><div><span>Gelişim puanı</span><b>+${r.dp} DP</b></div>`;
      html+=r.packs.map(p=>`<div class="pk"><span>Paket</span><b>${D.PACKS[p].name}</b></div>`).join("");
      if(res.perfects) html+=`<div><span>Mükemmel atış</span><b>${res.perfects}</b></div>`;
      r.prestige.forEach(it=>html+=`<div class="gold"><span>Prestij eşyası</span><b>${it.name}</b></div>`);
      r.sets.forEach(st=>html+=`<div class="gold"><span>Koleksiyon tamam</span><b>${st.name}</b></div>`);
      if(r.unlockedNew) html+=`<div><span>Kilit açıldı</span><b>Seviye ${l.id+1}</b></div>`;
      $("#endRewards").innerHTML=html; FG_AUDIO.play("coin");
    } else {
      pendingPacks=[];
      $("#endTitle").textContent="CANLAR BİTTİ";
      $("#endStars").innerHTML=[1,2,3].map(()=>FG_MAP.starSvg(false,"big")).join("");
      $("#endRewards").innerHTML=`<div><span>Takıldığın atış</span><b>${res.shot.title}</b></div><div><span style="color:#cfd8de">${D.SHOT_INFO[res.shot.type].how}</span></div>`;
    }
    updateEndButtons(res.success); overlay("#endOverlay",true);
  }
  function updateEndButtons(success){
    const next=D.levels.find(x=>x.id===level.id+1), P=$("#endPrimary"), Sx=$("#endSecondary");
    if(!success){ P.textContent="TEKRAR DENE"; P.onclick=()=>{ overlay("#endOverlay",false); openIntro(level); }; Sx.textContent="Haritaya dön"; Sx.onclick=openMap; return; }
    if(pendingPacks.length){ const t=pendingPacks[0]; P.textContent=`${D.PACKS[t].name.toUpperCase()} AÇ`; P.onclick=()=>{ pendingPacks.shift(); openPack(t,()=>{ overlay("#endOverlay",true); updateEndButtons(true); }); }; }
    else if(!level.practice&&next&&S.isUnlocked(next.id)){ P.textContent="SONRAKİ SEVİYE"; P.onclick=()=>{ overlay("#endOverlay",false); openIntro(next); }; }
    else { P.textContent="HARİTAYA DÖN"; P.onclick=openMap; }
    Sx.textContent=pendingPacks.length?"Paketleri sonra aç":"Haritaya dön"; Sx.onclick=openMap;
  }

  // ================= PAKET AÇMA =================
  // Sonuç animasyondan ÖNCE belirlenir (S.openPack); sinematik yalnızca sunumdur ve "Atla" her an son duruma gider.
  // Aşamalar: 1 tünel girişi → 2 paket (dokun: yırt) → 3 nadirlik ipucu → 4 kartlar → 5 sonuç.
  const ORDER={common:0,rare:1,epic:2,legendary:3};
  const PHASES={common:[.6,.5,.4,0,0],rare:[.6,.5,.4,0,0],epic:[.8,.6,.9,.45,0],legendary:[1,.8,1.4,.9,1]}; // tünel, paket, ipucu, son kart ekstra, sarsıntı
  function openPack(type,after){
    const res=S.openPack(type); if(!res) return toast("Bu paketten yok.");
    overlay("#endOverlay",false); overlay("#packsOverlay",false);
    const ov=$("#openOverlay"), best=res.cards.reduce((m,c)=>ORDER[c.rarity]>ORDER[m.rarity]?c:m,res.cards[0]), ph=PHASES[best.rarity];
    const reduced=!!(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const T1=reduced?0:ph[0], T2=ph[1], T3=reduced?0:ph[2];
    $("#openKicker").textContent=D.PACKS[type].name.toUpperCase(); $("#openSets").textContent=""; $("#openTry").hidden=true;
    const cssVar=(k,v)=>ov.style.setProperty?ov.style.setProperty(k,v):(ov.style[k]=v); cssVar("--tease",RAR_COLOR[best.rarity]); cssVar("--pc",D.PACKS[type].color||"#8daac6");
    $("#cardRow").innerHTML=res.cards.map((c,i)=>{
      const front=c.kind==="dp"?`<div class="rar">GELİŞİM</div><div class="big">+${c.amount}</div><div class="nm">DP</div>`
        :c.kind==="cash"?`<div class="rar">CASH</div><div class="big">+${c.amount}</div><div class="nm">$</div>`
        :`<div class="rar">${RAR[c.rarity].toUpperCase()}</div><div class="sw" style="background:${swatch(c.item.val)}"></div><div class="nm">${c.item.name}</div><small class="rar">${catName(c.item.cat)}</small>${c.dup?`<div class="dup">Tekrar · +${c.dupCash} $</div>`:""}`;
      return `<div class="card r-${c.rarity} ${c.rarity==="epic"||c.rarity==="legendary"?"glow":""}" data-i="${i}" style="--i:${i}"><div class="face back">4G</div><div class="face front">${front}</div></div>`; }).join("");
    const tease=best.kind==="item"?[`${catName(best.item.cat).toUpperCase()}`,best.rarity==="legendary"||best.rarity==="epic"?best.item.name:RAR[best.rarity].toUpperCase()]:[best.kind==="dp"?"GELİŞİM":"CASH",""];
    $("#packTease").innerHTML=`<small>?</small><b></b>`;
    ov.classList.remove("revealed","p-tunnel","p-pack","p-torn","p-tease","p-cards","p-done","shake","flash");
    overlay("#openOverlay",true);
    const cards=$$("#cardRow .card");
    const flip=c=>{ if(c.classList.contains("flip")) return; c.classList.add("flip"); const r=res.cards[+c.dataset.i].rarity; FG_AUDIO.play(r==="legendary"?"impact":r==="epic"?"shimmer":"coin"); if(r==="legendary"||r==="epic") FG_AUDIO.play("cheer"); };
    cards.forEach(c=>c.onclick=()=>flip(c));
    const tl=FG_UISTATE.timeline(), at1=T1, at2=at1+T2, at3=at2+T3;
    tl.add(0,0,()=>{ ov.classList.add("p-tunnel"); FG_AUDIO.play("whoosh"); if(T3>.5) FG_AUDIO.play("riser"); })
      .add(at1,0,()=>{ ov.classList.add("p-pack"); })
      .add(at2,0,()=>{ ov.classList.add("p-torn"); FG_AUDIO.play("impact"); })
      .add(at2,Math.max(.01,T3),k=>{ ov.classList.add("p-tease"); const el=$("#packTease"); if(k>.34&&el.dataset.s!=="1"){ el.dataset.s="1"; el.querySelector("small").textContent=tease[0]; FG_AUDIO.play("shimmer"); } if(k>.67&&el.dataset.s==="1"&&tease[1]){ el.dataset.s="2"; el.querySelector("b").textContent=tease[1]; } })
      .add(at3,0,()=>{ ov.classList.add("revealed","p-cards"); $("#packTease").dataset.s=""; });
    cards.forEach((c,i)=>{ const last=i===cards.length-1, extra=last?ph[3]:0; tl.add(at3+.25+i*.26+extra,0,()=>{ flip(c); if(last&&ph[4]&&!reduced){ ov.classList.add("shake","flash"); FG_UISTATE.later(()=>ov.classList.remove("shake","flash"),600); } }); });
    tl.add(at3+.4+cards.length*.26+ph[3],0,()=>{ ov.classList.add("p-done"); const item=res.cards.find(c=>c.kind==="item"&&!c.dup); if(item){ const b=$("#openTry"); b.hidden=false; b.onclick=()=>{ tl.kill(); overlay("#openOverlay",false); refreshWallet(); lockerCat=item.item.cat; if(after) after(); else openLocker(); }; } });
    // Paket aşamasında dokunmak yırtmayı ve ipucunu hızlandırır.
    $("#packSeal").onclick=()=>{ if(!ov.classList.contains("p-torn")) tl.seek(at2); };
    tl.play();
    $("#openSkip").onclick=()=>{ tl.skip(); ov.classList.remove("shake","flash"); cards.forEach(flip); };
    if(res.sets.length) $("#openSets").textContent=res.sets.map(s=>`${s.name} tamamlandı! Ödülü eklendi.`).join(" ");
    $("#openDone").onclick=()=>{ tl.kill(); overlay("#openOverlay",false); refreshWallet(); after?after():openPacks(); };
  }

  // ================= OYUNCU / GELİŞİM =================
  function openPlayer(){
    FG_CAREER.sync();
    const s=S.get(), p=s.profile;
    $("#plName").textContent=p.name; $("#plOvr").textContent=S.overall(); $("#plPos").textContent=`${p.position} · ${D.POSITIONS[p.position].name}`; $("#plNum").textContent=`#${p.number}`; $("#plDp").textContent=`${s.dp} DP`;
    const groups={}; Object.entries(D.ATTR).forEach(([k,a])=>(groups[a.group]=groups[a.group]||[]).push(k));
    $("#attrList").innerHTML=Object.entries(groups).map(([g,ks])=>`<div class="attr-group">${g}</div>`+ks.map(k=>{ const v=S.attr(k), c=S.costFor(v);
      return `<div class="attr"><b>${D.ATTR[k].name}</b><span class="val">${v}</span><small>${D.ATTR[k].effect}</small><button class="up" data-k="${k}" ${v>=99||s.dp<c?"disabled":""}>${v>=99?"MAX":`+1 · ${c} DP`}</button><div class="bar"><i style="width:${v}%"></i></div></div>`; }).join("")).join("");
    $$("#attrList .up").forEach(b=>b.onclick=()=>{ const r=S.upgrade(b.dataset.k); if(r.ok){ FG_AUDIO.play("coin"); openPlayer(); refreshWallet(); } else if(r.need) toast(`${r.need} DP daha lazım.`); });
    FG_CAREER_UI.card();
    overlay("#playerOverlay",true);
    FG_PREVIEW.show($("#playerCanvas"),S.playerModel({pose:"apose"}),{shot:"hero",spin:true});
  }

  // ================= PAKETLER =================
  function openPacks(){
    const s=S.get();
    $("#packInv").innerHTML=Object.entries(D.PACKS).map(([k,p])=>`<div class="pack ${s.packs[k]?"":"empty"}" style="--pc:${p.color}">${s.packs[k]?`<span class="cnt">×${s.packs[k]}</span>`:""}<div class="box">4G</div><b>${p.name}</b>${s.packs[k]?`<button data-open="${k}">AÇ</button>`:`<small>Yok</small>`}</div>`).join("");
    $("#packShop").innerHTML=Object.entries(D.PACKS).filter(([k,p])=>p.price).map(([k,p])=>`<div class="pack" style="--pc:${p.color}"><div class="box">4G</div><b>${p.name}</b><small>${p.cards.length} kart</small><button class="buy" data-buy="${k}">${p.price.toLocaleString("tr-TR")} $</button></div>`).join("")+
      `<div class="pack" style="--pc:#ffc83d"><div class="box">4G</div><b>Legend Pack</b><small>Satılmaz. Final ve büyük başarılardan gelir.</small></div>`;
    $$("[data-open]").forEach(b=>b.onclick=()=>openPack(b.dataset.open));
    $$("[data-buy]").forEach(b=>b.onclick=()=>{ const r=S.buyPack(b.dataset.buy); if(r.ok){ FG_AUDIO.play("coin"); refreshWallet(); openPacks(); toast("Paket alındı."); } else toast(`${(r.need||0).toLocaleString("tr-TR")} $ daha lazım. Seviyeleri oynayarak kazan.`); });
    overlay("#packsOverlay",true); refreshWallet();
  }

  // ================= SOYUNMA ODASI =================
  let lockerCat="helmet";
  function openLocker(){
    const s=S.get();
    $("#lockerCats").innerHTML=D.CATS.map(([k,n])=>`<button data-c="${k}" class="${k===lockerCat?"on":""}">${n}</button>`).join("");
    $$("#lockerCats button").forEach(b=>b.onclick=()=>{ lockerCat=b.dataset.c; openLocker(); });
    const list=D.items.filter(i=>i.cat===lockerCat), owned=list.filter(i=>s.owned.includes(i.id)).length, eq=S.equippedId(lockerCat);
    const totalOwned=D.items.filter(i=>s.owned.includes(i.id)).length;
    $("#lockerCount").textContent=`${catName(lockerCat).toUpperCase()} ${owned}/${list.length} · TOPLAM KOLEKSİYON ${totalOwned}/${D.items.length}`;
    $("#lockerGrid").innerHTML=list.map(i=>{ const own=s.owned.includes(i.id); return `<button class="it r-${i.rarity} ${eq===i.id?"on":""} ${own?"":"locked"}" data-it="${i.id}"><div class="sw" style="background:${i.val===null?"repeating-linear-gradient(45deg,#2a3038 0 6px,#20262d 6px 12px)":swatch(i.val)}"></div><b>${i.name}</b><small>${RAR[i.rarity]}${i.prestige?" · PRESTİJ":""}</small>${own?"":`<span class="lk">🔒</span>`}</button>`; }).join("");
    $$("#lockerGrid .it").forEach(b=>b.onclick=()=>{ const it=S.item(b.dataset.it); if(!S.owns(it.id)) return toast(it.prestige?`Prestij eşyası: ${it.prestige}. Satın alınamaz.`:"Paketlerden çıkar. Seviyeleri bitirip paket kazan."); S.equip(it.id); FG_AUDIO.play("tap"); openLocker(); });
    $("#setList").innerHTML=D.SETS.map(st=>{ const n=st.items.filter(id=>s.owned.includes(id)).length, done=s.setsClaimed.includes(st.id); return `<div class="set"><b>${st.name} ${n}/${st.items.length}${done?" ✓":""}</b><div class="pips">${st.items.map(id=>`<i class="${s.owned.includes(id)?"on":""}"></i>`).join("")}</div><small>${st.items.map(id=>S.item(id).name).join(" · ")}. Ödül: ${st.reward.cash} $ + ${D.PACKS[st.reward.pack].name}</small></div>`; }).join("");
    overlay("#lockerOverlay",true);
    const eqItem=S.item(S.equippedId(lockerCat)); FG_PREVIEW.show($("#lockerCanvas"),S.playerModel({pose:"apose"}),{shot:FG_PREVIEW.shotFor(lockerCat),spin:true,glow:eqItem?RAR_COLOR[eqItem.rarity]:null});
  }

  // ================= BAĞLANTILAR =================
  function init(){
    buildCreator();
    $("#playBtn").onclick=()=>{ FG_AUDIO.unlock(); FG_AUDIO.play("tap"); const s=S.get(); openIntro(D.levels.find(l=>l.id===Math.min(s.unlocked,D.levels.length))); };
    $("#introStart").onclick=()=>{ FG_AUDIO.unlock(); FG_AUDIO.play(level&&level.stage==="college"&&!level.practice?"fanfare":"whistle"); overlay("#introOverlay",false); GAME.pause(false); };
    $("#introBack").onclick=openMap;
    $$("#passPanel button").forEach(b=>b.onclick=()=>{ GAME.setPassType(b.dataset.pass); FG_AUDIO.play("tap"); });
    $("#pauseBtn").onclick=()=>{ GAME.pause(true); overlay("#pauseOverlay",true); };
    $("#resumeBtn").onclick=()=>{ overlay("#pauseOverlay",false); GAME.pause(false); };
    $("#howBtn").onclick=()=>{ const sh=GAME.G.shot; if(sh) toast(sh.career?"SNAP → 1–4 ile receiver seç → PAS AT. Hareket kontrolüyle kaç veya topu yakalayınca koş. Bilgisayar: WASD, 1–4 ve boşluk.":D.SHOT_INFO[sh.type].how); };
    $("#restartBtn").onclick=()=>{ overlay("#pauseOverlay",false); openIntro(level); };
    $("#quitBtn").onclick=()=>{ overlay("#pauseOverlay",false); openMap(); };
    $("#playerBtn").onclick=openPlayer; $("#packsBtn").onclick=openPacks; $("#lockerBtn").onclick=openLocker;
    $("#editLookBtn").onclick=()=>{ overlay("#playerOverlay",false); openCreator(true); };
    $("#settingsBtn").onclick=()=>{ const st=S.get().settings; $("#setSound").checked=st.sound; $("#setVib").checked=st.vibration; $("#setGuide").checked=st.guide; $("#setDifficulty").value=st.difficulty||"pro"; $("#setAdaptive").checked=st.adaptive!==false; $("#setQuality").value=st.quality||"auto"; overlay("#settingsOverlay",true); };
    $("#setSound").onchange=e=>S.setting("sound",e.target.checked);
    $("#setVib").onchange=e=>S.setting("vibration",e.target.checked);
    $("#setGuide").onchange=e=>S.setting("guide",e.target.checked);
    $("#setDifficulty").onchange=e=>{ if(["rookie","pro","allpro","glory"].includes(e.target.value)) S.setting("difficulty",e.target.value); };
    $("#setAdaptive").onchange=e=>S.setting("adaptive",e.target.checked);
    $("#setQuality").onchange=e=>{ if(["auto","low","medium","high"].includes(e.target.value)) S.setting("quality",e.target.value); };
    $("#exportSaveBtn").onclick=()=>{const a=document.createElement('a'),url=URL.createObjectURL(new Blob([S.exportSave()],{type:'application/json'}));a.href=url;a.download='fourth-glory-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
    $("#importSaveFile").onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>500000)throw Error('Kayıt dosyası çok büyük.');const text=await file.text();if(!confirm('Mevcut ilerlemenin yerine bu kayıt yüklensin mi?'))return;const result=S.importSave(text);overlay('#settingsOverlay',false);if(S.hasProfile())openMap();else openCreator(false);toast(result.migrated?'Oyuncu ve gelişim aktarıldı. Bu sürümün farklı görevleri Seviye 1’den başlar.':'Kayıt yüklendi.');}catch(err){toast(err.message);}finally{e.target.value='';}};
    $("#resetBtn").onclick=e=>{ const b=e.currentTarget; if(!b.dataset.armed){ b.dataset.armed="1"; b.textContent="Emin misin? Silmek için tekrar bas"; setTimeout(()=>{ delete b.dataset.armed; b.textContent="İlerlemeyi sıfırla"; },3500); return; }
      delete b.dataset.armed; b.textContent="İlerlemeyi sıfırla"; S.reset(); overlay("#settingsOverlay",false); openCreator(false); };
    $$("[data-close]").forEach(b=>b.onclick=()=>{ overlay("#"+b.closest(".overlay").id,false); refreshWallet(); });
    // Esc: en üstteki kapatılabilir katmanı kapatır; oyunda duraklatmayı açar/kapatır.
    window.addEventListener("keydown",e=>{ if(e.key!=="Escape") return; const t=UIS.top();
      if(t){ const x=document.getElementById(t).querySelector("[data-close],#careerClose"); if(x){ x.click(); return; } if(t==="pauseOverlay"){ $("#resumeBtn").click(); return; } }
      else if($("#gameScreen").classList.contains("active")&&GAME.G.phase!=="done"&&!$("#pauseBtn").disabled) $("#pauseBtn").click(); });
    let lastW=window.innerWidth;
    window.addEventListener("resize",()=>{ if(engineReady) E.resize(); if(Math.abs(window.innerWidth-lastW)>20&&$("#mapScreen").classList.contains("active")){ lastW=window.innerWidth; FG_MAP.build(); } });
    document.addEventListener("visibilitychange",()=>{ if(document.hidden&&$("#gameScreen").classList.contains("active")&&!$("#introOverlay").classList.contains("show")&&!$("#endOverlay").classList.contains("show")){ GAME.pause(true); overlay("#pauseOverlay",true); } });
    if(S.hasProfile()) openMap(); else openCreator(false);
    if("serviceWorker" in navigator&&location.protocol.startsWith("http")) navigator.serviceWorker.register("service-worker.js").catch(()=>{});
  }
  window.FG_UI={toast,openIntro,openMap,openPack,openPlayer,openLocker,openPacks,openCreator};
  window.addEventListener("DOMContentLoaded",init);
})();
