// Fourth & Glory — seviyeler (tek hamle atışlar), özellikler, kozmetikler, paketler
(function(){
  // kısa takım tanımından tam forma seti
  const kit=(jersey,trim,o={})=>({ jersey, trim, number:o.number||"#ffffff", numberOutline:o.numberOutline||trim, helmet:o.helmet||jersey, stripe:o.stripe||trim,
    mask:o.mask||"#c8cdd3", pants:o.pants||jersey, pantsStripe:o.pantsStripe||trim, legs:o.legs||o.pants||jersey, socks:o.socks||"#f2f2f2",
    cleats:o.cleats||"#1b2433", gloves:o.gloves||"#1b2433", glovePalm:"#e8e8e8" });
  const T=(name,short,venue,k)=>({name,short,venue,jersey:k.jersey,trim:k.trim,kit:k});

  // Atış koordinatları atan oyuncuya göre: [x, d]  (d = ileri mesafe, yard)
  const levels=[
    { id:1, team:T("Harbor Hawks","HAW","Antrenman Kampı",kit("#0d6f73","#f4f7f8",{number:"#0d6f73",numberOutline:"#f4f7f8",pants:"#f4f7f8",pantsStripe:"#0d6f73"})), shots:[
      { type:"target", title:"İlk atış", desc:"Topu turuncu lastiğin içinden geçir.", hoops:[{x:0,d:12,y:2.2,r:1.4}] },
      { type:"pass", title:"Açık receiver", desc:"Duran receiver'a pas at.", wr:[{x:-6,d:9}], def:[] },
      { type:"fg", title:"Kısa vuruş", desc:"20 yard'dan direklerin arasından.", los:97 },
      { type:"run", title:"Boşluğu bul", desc:"Yolunu çiz, dummy'lere çarpmadan 6 yard koş.", yards:6, def:[{x:-1.5,d:3,kind:"dummy"},{x:2.5,d:4,kind:"dummy"}] }
    ]},
    { id:2, team:T("Riverside State Wolves","RSW","Homecoming",kit("#2f3a4a","#c9a46a",{pants:"#d9d2bf",pantsStripe:"#2f3a4a",helmet:"#2f3a4a",stripe:"#c9a46a"})), shots:[
      { type:"pass", title:"Hareketli hedef", desc:"Koşan receiver'ın önüne at.", wr:[{x:-12,d:10,patrol:[[-12,10],[4,10]],spd:5}], def:[] },
      { type:"target", title:"Kayan lastik", desc:"Sağa sola kayan lastiği vur.", hoops:[{x:0,d:14,y:2.4,r:1.3,amp:5,spd:1.2}] },
      { type:"tackle", title:"İlk tackle", desc:"Koşucunun önüne kaydır, dalarak durdur.", yards:8, path:[[0,-12],[2,-4],[3,6]], spd:5.2 },
      { type:"fg", title:"25 yard", desc:"Biraz daha uzak.", los:92 }
    ]},
    { id:3, team:T("Desert Scorpions","SCO","Kum Fırtınası",kit("#c9a25a","#1d1d1d",{helmet:"#1d1d1d",stripe:"#c9a25a",pants:"#1d1d1d",pantsStripe:"#c9a25a",number:"#1d1d1d",numberOutline:"#f2e2b8"})), shots:[
      { type:"pass", title:"Savunmanın üstünden", desc:"Linebacker'ın üstünden aşırt. LOB dene.", wr:[{x:3,d:14}], def:[{x:2,d:7,patrol:[[-2,7],[5,7]],spd:2.5}] },
      { type:"punt", title:"İlk punt", desc:"Topu turuncu bölgeye düşür, end zone'a sokma.", los:45, zone:[80,95] },
      { type:"dive", title:"Uçarak yakala", desc:"Top atılınca düşeceği yere kaydır, dal.", wr:{x:-8,d:12}, ball:{dx:4,dd:5}, def:[] },
      { type:"fg", title:"Hafif rüzgâr", desc:"30 yard, rüzgâra dikkat.", los:87, wind:4 }
    ]},
    { id:4, team:T("Iron Bulls","BUL","Rivalry Week",kit("#7d1d1d","#ffb347",{helmet:"#5c1414",pants:"#f1e3cf",pantsStripe:"#7d1d1d"})), shots:[
      { type:"run", title:"Linebacker'dan kaç", desc:"Kayan linebacker'ın açtığı yoldan geç.", yards:8, def:[{x:0,d:4,patrol:[[-4,4],[4,4]],spd:3.5},{x:-3,d:1,kind:"dummy"},{x:3,d:1,kind:"dummy"}] },
      { type:"pass", title:"Dar pencere", desc:"İki savunmacının arasından geçir.", wr:[{x:0,d:15}], def:[{x:-1.6,d:9},{x:1.6,d:9}] },
      { type:"tackle", title:"Cut'a dikkat", desc:"Koşucu yön değiştirecek.", yards:7, path:[[-3,-12],[-2,-5],[4,-1],[4,8]], spd:5.6 },
      { type:"target", title:"Uzak lastik", desc:"18 yard'daki lastik.", hoops:[{x:-4,d:18,y:2.6,r:1.2}] }
    ]},
    { id:5, team:T("Northern Lumberjacks","LUM","Soğuk Kuzey",kit("#1f5e3a","#e3d9c6",{helmet:"#13402a",stripe:"#c0392b",pants:"#e3d9c6",pantsStripe:"#1f5e3a"})), shots:[
      { type:"fg", title:"Kuzey rüzgârı", desc:"35 yard, sert rüzgâr.", los:82, wind:7 },
      { type:"pass", title:"Cornerback takipte", desc:"Receiver'ı önden yakala, CB arkadan geliyor.", wr:[{x:-10,d:6,patrol:[[-10,6],[-10,20]],spd:6.5,once:true}], def:[{x:-11.5,d:5,follow:0,lag:2.2}] },
      { type:"run", title:"Kalabalık", desc:"Üç savunmacının arasından 10 yard.", yards:10, def:[{x:-3,d:4,chase:4.2},{x:3,d:5,chase:4.2},{x:0,d:9,patrol:[[-5,9],[5,9]],spd:3}] },
      { type:"punt", title:"Coffin corner", desc:"Topu 15 yard çizgisinin içine düşür.", los:40, zone:[85,98] }
    ]},
    { id:6, team:T("Bay Sharks","SHK","Körfez Gecesi",kit("#1a2f5a","#3fd0d4",{helmet:"#3fd0d4",stripe:"#1a2f5a",pants:"#e9f1f5",pantsStripe:"#1a2f5a"})), shots:[
      { type:"pass", title:"Deep shot", desc:"Safety'nin üstünden 25 yard.", wr:[{x:6,d:8,patrol:[[6,8],[6,30]],spd:7,once:true}], def:[{x:3,d:24,patrol:[[0,24],[6,24]],spd:2,tall:true}] },
      { type:"dive", title:"Zor top", desc:"Top uzağa atıldı, tam zamanında dal.", wr:{x:6,d:10}, ball:{dx:-5,dd:6}, def:[{x:4,d:13}] },
      { type:"tackle", title:"Hızlı koşucu", desc:"Daha hızlı, iyi açı bul.", yards:8, path:[[6,-12],[2,-3],[-6,6]], spd:6.4 },
      { type:"target", title:"Hızlı lastik", desc:"Hızla kayan lastik.", hoops:[{x:0,d:15,y:2.4,r:1.2,amp:6,spd:2.2}] }
    ]},
    { id:7, team:T("Mountain Rams","RAM","Dağ Arenası",kit("#5a3a22","#f2c14e",{helmet:"#f2c14e",stripe:"#5a3a22",pants:"#f2e6cf",pantsStripe:"#5a3a22"})), shots:[
      { type:"pass", title:"Açık olanı seç", desc:"İki receiver var, açık olana at.", wr:[{x:-9,d:12,patrol:[[-9,12],[-2,12]],spd:4},{x:9,d:12,patrol:[[9,12],[2,12]],spd:4}], def:[{x:-8,d:13,follow:0,lag:.8},{x:7,d:16}] },
      { type:"run", title:"Red zone", desc:"End zone'a kadar yolunu çiz.", yards:10, goal:true, los:90, def:[{x:-2,d:3,chase:4.6},{x:3,d:6,chase:4.6},{x:0,d:8,patrol:[[-6,8],[6,8]],spd:4}] },
      { type:"fg", title:"40'lık vuruş", desc:"Uzun mesafe.", los:77, wind:6 },
      { type:"punt", title:"Derin punt", desc:"Topu bölgeye düşür.", los:35, zone:[78,93] }
    ]},
    { id:8, team:T("Thunder Bolts","BLT","Fırtına Gecesi",kit("#1b1b1b","#f7d417",{pants:"#f7d417",pantsStripe:"#1b1b1b",number:"#f7d417",numberOutline:"#1b1b1b"})), shots:[
      { type:"fg", title:"Fırtına vuruşu", desc:"45 yard, değişken rüzgâr.", los:72, wind:9, gust:true },
      { type:"pass", title:"Bullet pas", desc:"Dar pencereye sert pas. BULLET dene.", wr:[{x:2,d:12,patrol:[[2,12],[-6,12]],spd:5}], def:[{x:-2,d:7,patrol:[[-5,7],[3,7]],spd:3},{x:0,d:16}] },
      { type:"tackle", title:"Juke'çu koşucu", desc:"İki kez yön değiştiriyor.", yards:6, path:[[0,-12],[-4,-6],[3,-2],[-2,6]], spd:6 },
      { type:"dive", title:"Sideline", desc:"Çizgiye yakın, dışarı çıkma.", wr:{x:18,d:10}, ball:{dx:5,dd:4}, def:[] }
    ]},
    { id:9, team:T("River Pirates","PIR","Nehir Kıyısı",kit("#111418","#d63031",{helmet:"#d63031",stripe:"#111418",pants:"#c8ccd0",pantsStripe:"#111418"})), shots:[
      { type:"run", title:"Duvarı yık", desc:"Dört savunmacı, tek yol.", yards:12, def:[{x:-4,d:3,chase:4.4},{x:4,d:3,chase:4.4},{x:0,d:7,chase:4.2},{x:0,d:12,patrol:[[-8,12],[8,12]],spd:4}] },
      { type:"pass", title:"30 yard bomba", desc:"LOB ile uzun pas.", wr:[{x:-8,d:8,patrol:[[-8,8],[-3,34]],spd:7.4,once:true}], def:[{x:-9,d:7,follow:0,lag:1.6},{x:0,d:28,patrol:[[-6,28],[4,28]],spd:2.5,tall:true}] },
      { type:"target", title:"Çifte lastik", desc:"Arkadaki küçük lastiği vur.", hoops:[{x:2,d:22,y:2.8,r:1.0,amp:3,spd:1.4}] },
      { type:"fg", title:"48 yard", desc:"Rüzgâr ve mesafe.", los:69, wind:8 }
    ]},
    { id:10, team:T("Capital Kings","KNG","FİNAL · Şampiyonluk",kit("#3e1f6e","#ffd15c",{helmet:"#ffd15c",stripe:"#3e1f6e",pants:"#ffd15c",pantsStripe:"#3e1f6e"})), final:true, shots:[
      { type:"pass", title:"Two-minute drill", desc:"Saat işliyor, hızlı karar ver.", time:5, wr:[{x:-10,d:10,patrol:[[-10,10],[-4,18]],spd:6,once:true},{x:10,d:10,patrol:[[10,10],[3,16]],spd:6,once:true}], def:[{x:-9,d:11,follow:0,lag:1.7},{x:9,d:11,follow:1,lag:1.7},{x:0,d:24,tall:true}] },
      { type:"tackle", title:"4. hak", desc:"Bir yard bile verme.", yards:3, path:[[2,-10],[-3,-4],[-1,0],[2,5]], spd:6.4 },
      { type:"run", title:"Final TD", desc:"End zone'a gir!", yards:12, goal:true, los:88, def:[{x:-3,d:3,chase:4.6},{x:3,d:4,chase:4.6},{x:0,d:8,chase:4.4},{x:-6,d:10,patrol:[[-8,10],[8,10]],spd:4.4}] },
      { type:"dive", title:"Clutch catch", desc:"Kalabalık içinde topu kap.", wr:{x:-4,d:12}, ball:{dx:4,dd:5}, def:[{x:0,d:15},{x:-6,d:16}] },
      { type:"fg", title:"Şampiyonluk vuruşu", desc:"52 yard. Her şey bu vuruşta.", los:65, wind:7, gust:true }
    ]}
  ];

  const ATTR={
    throwPower:{name:"Throw Power",group:"KOL",effect:"Pasın en yüksek hızı ve menzili"},
    shortAcc:{name:"Short Accuracy",group:"KOL",effect:"20 yard altı paslarda sapma azalır"},
    deepAcc:{name:"Deep Accuracy",group:"KOL",effect:"Uzun paslarda sapma azalır"},
    kickPower:{name:"Kick Power",group:"BACAK",effect:"Field goal ve punt menzili"},
    kickAcc:{name:"Kick Accuracy",group:"BACAK",effect:"Vuruşta sapma azalır"},
    speed:{name:"Speed",group:"ATLETİK",effect:"Koşu ve dalış hızı"},
    agility:{name:"Agility",group:"ATLETİK",effect:"Savunmacılardan daha yakından sıyrılırsın"},
    catching:{name:"Catching",group:"ATLETİK",effect:"Yakalama alanı büyür"},
    tackle:{name:"Tackle",group:"SAVUNMA",effect:"Tackle menzili ve dalış mesafesi"},
    awareness:{name:"Awareness",group:"MENTAL",effect:"Nişan çizgisi uzar, saat yavaşlar"}
  };
  const POSITIONS={
    QB:{name:"Quarterback",bonus:{throwPower:10,shortAcc:8,deepAcc:4,awareness:6}},
    WR:{name:"Wide Receiver",bonus:{speed:8,catching:10,agility:6}},
    RB:{name:"Running Back",bonus:{speed:10,agility:10,catching:2}},
    K:{name:"Kicker",bonus:{kickPower:12,kickAcc:10}},
    LB:{name:"Linebacker",bonus:{tackle:12,awareness:6,speed:4}}
  };
  const SHOT_INFO={
    pass:{label:"QB",name:"Pas",how:"Topu QB'den receiver'a doğru kaydır. Kaydırma uzunluğu güç, yönü hedef. BULLET hızlı ve alçak, LOB yüksek."},
    target:{label:"QB",name:"Hedef atışı",how:"Lastiğe doğru kaydır. Yüksek hedeflerde TOUCH ya da LOB seç."},
    fg:{label:"K",name:"Field goal",how:"Topun arkasından yukarı kaydır. Eğri çizersen falso alır. Rüzgârı hesaba kat."},
    punt:{label:"P",name:"Punt",how:"Yukarı kaydır. Uzunluk mesafeyi belirler. Topu turuncu bölgeye düşür, end zone'a sokma."},
    run:{label:"RB",name:"Koşu",how:"Parmağını RB'den başlatıp koşacağı yolu tek çizgiyle çiz. Bırakınca koşar."},
    tackle:{label:"LB",name:"Tackle",how:"Koşucunun geçeceği yere doğru kaydır. LB oraya fırlar ve dalar. Zamanlama her şey."},
    dive:{label:"WR",name:"Dalış",how:"Top havadayken düşeceği yere doğru kaydır. WR oraya uçar."}
  };

  // kozmetikler (sadece görünüm, güç vermez)
  const R={C:"common",R:"rare",E:"epic",L:"legendary"};
  const I=(id,cat,name,rarity,val,o={})=>({id,cat,name,rarity,val,...o});
  const items=[
    I("hel_team","helmet","Takım Kaskı",R.C,null),
    I("hel_matte","helmet","Matte Black",R.R,"#16181c"),
    I("hel_white","helmet","Beyaz Kask",R.R,"#f2f4f6"),
    I("hel_chrome","helmet","Chrome Navy",R.E,"#2c4a7c"),
    I("hel_gold","helmet","Altın Kask",R.L,"#d4a72c"),
    I("vis_none","visor","Vizörsüz",R.C,null),
    I("vis_clear","visor","Clear",R.C,"#a9c4d6"),
    I("vis_smoke","visor","Smoke",R.R,"#2a2f36"),
    I("vis_black","visor","Black",R.E,"#0b0d10"),
    I("vis_red","visor","Red",R.E,"#b0202a"),
    I("vis_gold","visor","Gold",R.L,"#c99a2e"),
    I("glv_navy","gloves","Basic Navy",R.C,"#1b2433"),
    I("glv_white","gloves","Basic White",R.C,"#f2f2f2"),
    I("glv_red","gloves","Red Vapor",R.R,"#c0232f"),
    I("glv_orange","gloves","Orange Blaze",R.R,"#ff6a13"),
    I("glv_ice","gloves","Black Ice",R.E,"#0c0f14"),
    I("glv_college","gloves","College Edition",R.E,"#7a1f2b"),
    I("glv_champ","gloves","Şampiyonluk Eldiveni",R.L,"#d4a72c",{prestige:"Final seviyesini kazan"}),
    I("clt_team","cleats","Takım Kramponu",R.C,null),
    I("clt_white","cleats","White",R.C,"#f2f2f2"),
    I("clt_black","cleats","Black",R.R,"#0f1114"),
    I("clt_orange","cleats","Orange",R.R,"#ff6a13"),
    I("clt_chrome","cleats","Chrome",R.E,"#cfd6de"),
    I("clt_sig","cleats","Signature Gold",R.L,"#d4a72c"),
    I("slv_none","sleeve","Kolluksuz",R.C,null),
    I("slv_black","sleeve","Siyah Kolluk",R.C,"#111317"),
    I("slv_white","sleeve","Beyaz Kolluk",R.R,"#f2f2f2"),
    I("slv_team","sleeve","Takım Kolluğu",R.R,"team"),
    I("slv_both","sleeve","Çift Siyah Kolluk",R.E,"#111317",{side:"B"}),
    I("twl_none","towel","Havlusuz",R.C,null),
    I("twl_white","towel","Beyaz Havlu",R.C,"#f4f4f4"),
    I("twl_orange","towel","Turuncu Havlu",R.R,"#ff6a13"),
    I("mg_none","mouthguard","Dişliksiz",R.C,null),
    I("mg_orange","mouthguard","Turuncu Dişlik",R.C,"#ff6a13"),
    I("mg_black","mouthguard","Siyah Dişlik",R.R,"#111317"),
    I("mg_gold","mouthguard","Altın Dişlik",R.L,"#d4a72c"),
    I("eb_none","eyeBlack","Göz boyasız",R.C,null),
    I("eb_on","eyeBlack","Göz Boyası",R.R,true),
    I("tp_none","tape","Bantsız",R.C,null),
    I("tp_white","tape","Beyaz Bilek Bandı",R.C,"#f4f4f4"),
    I("tp_black","tape","Siyah Bilek Bandı",R.R,"#111317"),
    I("wb_none","wristband","Bilekliksiz",R.C,null),
    I("wb_orange","wristband","Turuncu Bileklik",R.C,"#ff6a13"),
    I("wb_black","wristband","Siyah Bileklik",R.R,"#111317"),
    I("bp_none","backplate","Sırt plakasız",R.C,null),
    I("bp_black","backplate","Siyah Sırt Plakası",R.E,"#111317"),
    I("bp_chrome","backplate","Chrome Sırt Plakası",R.L,"#cfd6de"),
    I("vis_perfect","visor","Mükemmel Sezon Vizörü",R.L,"#7fd3ff",{prestige:"Bütün seviyelerde 3 yıldız"})
  ];
  const CATS=[["helmet","Kask"],["visor","Vizör"],["gloves","Eldiven"],["cleats","Krampon"],["sleeve","Kolluk"],["towel","Havlu"],["mouthguard","Dişlik"],["eyeBlack","Göz boyası"],["tape","Bilek bandı"],["wristband","Bileklik"],["backplate","Sırt plakası"]];
  for(const [cat,name,colors]of [['jersey','Forma',['#eceeea','#192d45']],['pants','Pantolon',['#f1f0e5','#172b42']],['socks','Çorap',['#ffffff','#162435']],['facemask','Yüz koruyucu',['#ced6dc','#1b232b']],['wristCoach','QB bilek koçu',['#171f2a','#f2f0e6']]]){CATS.push([cat,name]);items.push(I(cat+'_team',cat,'Takım '+name,R.C,null));colors.forEach((color,i)=>items.push(I(cat+'_'+i,cat,name+' · '+(i?'Koyu':'Açık'),R.C,color)));}
  const SETS=[
    {id:"blackout",name:"Blackout Koleksiyonu",items:["hel_matte","vis_black","glv_ice","clt_black","slv_black"],reward:{cash:1500,pack:"elite"}},
    {id:"blaze",name:"Orange Blaze Koleksiyonu",items:["glv_orange","clt_orange","twl_orange","mg_orange","wb_orange"],reward:{cash:800,pack:"rare"}}
  ];
  const PACKS={
    common:{name:"Common Pack",color:"#9aa7b4",price:400,cards:[{dp:[10,25]},{cash:[60,160]},{item:{C:.85,R:.15}}]},
    rare:{name:"Rare Pack",color:"#3d8bff",price:1200,cards:[{dp:[30,60]},{item:{C:.5,R:.5}},{item:{R:.7,E:.25,L:.05}}]},
    elite:{name:"Elite Pack",color:"#a65cff",price:3000,cards:[{dp:[80,140]},{item:{R:.6,E:.3,L:.1}},{item:{E:.85,L:.15}}]},
    legend:{name:"Legend Pack",color:"#ffc83d",price:null,cards:[{dp:[150,250]},{item:{E:1}},{item:{L:1}}]}
  };
  const DUP={common:40,rare:100,epic:250,legendary:600};

  Object.assign(ATTR,{mediumAcc:{name:'Orta mesafe isabet',group:'Quarterback',effect:'10–25 yard pas kontrolü'},throwOnRun:{name:'Hareketli pas',group:'Quarterback',effect:'Koşarken pas sapmasını azaltır'},pocketPresence:{name:'Cep farkındalığı',group:'Quarterback',effect:'Baskının isabete etkisini azaltır'},clutch:{name:'Kritik anlar',group:'Quarterback',effect:'Red zone isabetini destekler'},releaseSpeed:{name:'Top çıkarma',group:'Quarterback',effect:'Pasın elden çıkma süresini azaltır'}});
  const BUILDS={balanced:{name:'Dengeli QB',bonus:{shortAcc:3,mediumAcc:3,awareness:3}},pocket:{name:'Pocket Passer',bonus:{shortAcc:5,pocketPresence:5,releaseSpeed:3}},arm:{name:'Strong Arm',bonus:{throwPower:6,deepAcc:5}},mobile:{name:'Mobile QB',bonus:{speed:6,agility:5,throwOnRun:4}},improviser:{name:'Improviser',bonus:{throwOnRun:6,awareness:4,clutch:4}}};
  window.FG_DATA={ version:"0.8.0", BUILDS, kit, levels, ATTR, POSITIONS, SHOT_INFO, items, CATS, SETS, PACKS, DUP,
    homeKit:kit("#0c1a33","#ff6a13",{cleats:"#0c1a33",gloves:"#0c1a33"}),
    skins:["#f1c9a0","#e0ac7e","#d9a27c","#c68b5e","#9c6a43","#7b4b2a","#5a3a22"],
    hairs:[["short","Kısa"],["fade","Fade"],["long","Uzun"],["dreads","Rasta"],["bald","Kel"]],
    hairColors:["#1a1412","#3b2a1e","#6b4a2b","#b08a4a","#d9c08a"],
    beards:[["none","Yok"],["stubble","Kirli sakal"],["full","Sakal"]] };
})();
