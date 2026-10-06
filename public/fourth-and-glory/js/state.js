// Fourth & Glory — kayıt ve ilerleme
// Kural: Para (cash) = görünüş ve hızlandırma · Başarı = prestij · Skill = maç kazanma
(function(){
  const KEY="fourth_glory_career_v2";
  const D=FG_DATA;
  const defaults=()=>({ profile:null, attrs:null, dp:0, cash:300, unlocked:1, levels:{}, packs:{common:1,rare:0,elite:0,legend:0},
    owned:D.items.filter(i=>i.val===null).map(i=>i.id).concat(["glv_navy"]), equipped:{}, setsClaimed:[], stats:{packsOpened:0}, settings:{sound:true,vibration:true,guide:true} });
  const clone=o=>JSON.parse(JSON.stringify(o));
  function legacy(r){if(r?.version!==1||!r.player||!r.stats)return null;const n=defaults(),p=r.player,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));n.profile={name:String(p.name||'ROOKIE').slice(0,24),position:D.POSITIONS[p.position]?p.position:'QB',number:clamp(Math.round(p.number||12),0,99),hand:p.hand==='left'?'L':'R',skin:({light:'#ddb493',medium:'#b67f5a',dark:'#795438'})[p.skin]||D.skins[2],hair:p.hair||'short',hairColor:'#211b16',beard:p.beard||'none',height:clamp(((p.height||191)/100-1.78)/.2,0,1),weight:clamp(((p.weight||97)-85)/35,0,1)};n.attrs={};const map={throwPower:'power',shortAcc:'accuracy',deepAcc:'accuracy',speed:'speed',agility:'agility',catching:'catching',awareness:'awareness'};for(const k of Object.keys(D.ATTR))n.attrs[k]=clamp(Number(r.stats[map[k]])||58,50,99);n.cash=Number(r.cash)||0;n.dp=Number(r.dp)||0;n.migratedFrom='fourth-glory-v1';return n;}
  function validate(r){if(!r||typeof r!=='object'||!Array.isArray(r.owned)||!r.levels||!r.settings)throw Error('Geçersiz kayıt.');const d=defaults(),n={...d,...r,settings:{...d.settings,...r.settings},packs:{...d.packs,...r.packs},equipped:{...r.equipped},levels:{...r.levels}};
    for(const k of ['cash','dp'])if(!Number.isFinite(n[k])||n[k]<0||n[k]>1e9)throw Error('Geçersiz bakiye.');
    if(!Number.isInteger(n.unlocked)||n.unlocked<1||n.unlocked>D.levels.length)throw Error('Geçersiz seviye.');
    for(let i=1;i<n.unlocked;i++)if(!(n.levels[i]?.stars>=1))throw Error('Seviye sırası geçersiz.');
    for(const [id,v]of Object.entries(n.levels))if(!D.levels.some(l=>l.id===+id)||!Number.isInteger(v.stars)||v.stars<1||v.stars>3)throw Error('Geçersiz yıldız.');
    if(n.profile){if(typeof n.profile.name!=='string'||!D.POSITIONS[n.profile.position]||!Number.isInteger(n.profile.number)||n.profile.number<0||n.profile.number>99)throw Error('Geçersiz oyuncu.');n.profile.name=n.profile.name.slice(0,24);if(!n.attrs)throw Error('Eksik özellikler.');for(const k of ['mediumAcc','throwOnRun','pocketPresence','clutch','releaseSpeed'])if(n.attrs[k]===undefined)n.attrs[k]=58;for(const k of Object.keys(D.ATTR))if(!Number.isFinite(n.attrs[k])||n.attrs[k]<50||n.attrs[k]>99)throw Error('Geçersiz özellik.');}
    if(!Array.isArray(n.setsClaimed)||n.owned.some(id=>!D.items.some(i=>i.id===id)))throw Error('Geçersiz ekipman.');for(const [cat,id]of Object.entries(n.equipped))if(!n.owned.includes(id)||!D.items.some(i=>i.id===id&&i.cat===cat))throw Error('Geçersiz ekipman seçimi.');
    for(const k of Object.keys(D.PACKS))if(!Number.isInteger(n.packs[k])||n.packs[k]<0||n.packs[k]>100000)throw Error('Geçersiz paket.');
    if(n.career){const c=n.career;if(c.version!==1||!Array.isArray(c.history)||!c.stats||!c.results)throw Error('Geçersiz kariyer.');for(const k of ['trust','scout'])if(!Number.isFinite(c[k])||c[k]<0||c[k]>100)throw Error('Geçersiz kariyer puanı.');for(const k of ['attempts','completions','yards','td','int','sacks','rushYards'])if(!Number.isInteger(c.stats[k])||c.stats[k]<0||c.stats[k]>1e8)throw Error('Geçersiz istatistik.');if(c.school&&!['coastal','north','metro'].includes(c.school)||c.pro&&!['harbor','desert','capital'].includes(c.pro))throw Error('Geçersiz takım.');c.history=c.history.slice(-100).map(h=>({text:String(h.text||'').slice(0,160)}));}
    D.items.filter(i=>i.val===null).forEach(i=>{if(!n.owned.includes(i.id))n.owned.push(i.id);});return n;}
  function load(){try{const r=JSON.parse(localStorage.getItem(KEY)||'null');if(r)return validate(r);const old=JSON.parse(localStorage.getItem('fourth-glory-v1')||'null');return old?validate(legacy(old)||defaults()):defaults();}catch(e){try{const raw=localStorage.getItem(KEY);if(raw)localStorage.setItem(KEY+'_recovery',raw);}catch{}return defaults();}}
  let s=load();
  function save(){ try{ localStorage.setItem(KEY,JSON.stringify(s)); }catch(e){} }
  const item=id=>D.items.find(i=>i.id===id);
  const rnd=(a,b)=>Math.round(a+Math.random()*(b-a));

  // gelişim puanı maliyeti: 65→10, 75→30, 85→80, 90→180 … (log-doğrusal ara değer)
  const KNOTS=[[50,6],[65,10],[75,30],[85,80],[90,180],[99,600]];
  function costFor(v){ for(let i=1;i<KNOTS.length;i++){ const [a,ca]=KNOTS[i-1],[b,cb]=KNOTS[i]; if(v<=b){ const t=(v-a)/(b-a); return Math.round(Math.exp(Math.log(ca)+(Math.log(cb)-Math.log(ca))*t)); } } return 600; }

  function rollItem(odds){
    let x=Math.random(), rar="C"; for(const [k,p] of Object.entries(odds)){ if(x<p){ rar=k; break; } x-=p; }
    const map={C:"common",R:"rare",E:"epic",L:"legendary"}, pool=D.items.filter(i=>i.rarity===map[rar]&&i.val!==null&&!i.prestige);
    return pool[Math.floor(Math.random()*pool.length)];
  }
  function grantItem(it){ if(s.owned.includes(it.id)){ const c=D.DUP[it.rarity]; s.cash+=c; return {dup:true,dupCash:c}; } s.owned.push(it.id); return {dup:false}; }
  function checkSets(){ const done=[]; D.SETS.forEach(set=>{ if(s.setsClaimed.includes(set.id)) return; if(set.items.every(id=>s.owned.includes(id))){ s.setsClaimed.push(set.id); s.cash+=set.reward.cash||0; if(set.reward.pack) s.packs[set.reward.pack]++; done.push(set); } }); return done; }

  const api={
    get:()=>s, save, exportSave:()=>JSON.stringify({format:'fourth-glory-v3',state:s},null,2), importSave(raw){const obj=JSON.parse(raw);const migrated=legacy(obj);s=validate(migrated||(obj.format==='fourth-glory-v3'?obj.state:obj));save();return {migrated:!!migrated};}, reset(){ s=defaults(); save(); }, setting(k,v){ s.settings[k]=v; save(); },
    hasProfile:()=>!!s.profile,
    setProfile(p){
      const first=!s.profile; s.profile={...(s.profile||{}),...p};
      if(first||!s.attrs){ s.attrs={}; Object.keys(D.ATTR).forEach(k=>s.attrs[k]=58); const b=D.POSITIONS[p.position||"QB"].bonus; Object.entries(b).forEach(([k,v])=>s.attrs[k]+=v);
        const build=D.BUILDS[p.build||'balanced'];if(build)Object.entries(build.bonus).forEach(([k,v])=>s.attrs[k]+=v);
        (p.startGear||[]).forEach(id=>{ if(!s.owned.includes(id)) s.owned.push(id); const it=item(id); if(it) s.equipped[it.cat]=id; }); }
      save();
    },
    attr:k=>(s.attrs&&s.attrs[k])||58,
    overall(){ if(!s.attrs) return 0; const v=["throwPower","shortAcc","mediumAcc","deepAcc","awareness","throwOnRun","pocketPresence","clutch","releaseSpeed","speed","agility"].map(k=>s.attrs[k]); return Math.round(v.reduce((a,b)=>a+b,0)/v.length); },
    costFor,
    upgrade(k){ const v=s.attrs[k]; if(v>=99) return {ok:false,max:true}; const c=costFor(v); if(s.dp<c) return {ok:false,need:c-s.dp}; s.dp-=c; s.attrs[k]=v+1; save(); return {ok:true,cost:c}; },
    stars:id=>(s.levels[id]&&s.levels[id].stars)||0,
    isUnlocked:id=>id<=s.unlocked,
    // seviye sonu ödülleri
    finishLevel(level,stars){
      if(!D.levels.includes(level)||!api.isUnlocked(level.id)||!Number.isInteger(stars)||stars<1||stars>3)throw Error('Geçersiz seviye sonucu.');
      const prev=s.levels[level.id]||{stars:0}, first=!prev.stars, out={cash:0,dp:0,packs:[],prestige:[],sets:[],first,unlockedNew:false,stars};
      const improved=Math.max(0,stars-(prev.stars||0));out.cash=first?100+level.id*30+stars*40:improved?improved*20:10;
      out.dp=first?25+level.id*6+stars*8:improved*4;
      if(first)out.packs.push(stars>=3?"rare":stars===2?(first?"rare":"common"):"common");
      if(first&&level.id%3===0) out.packs.push("elite");
      if(first&&level.final) out.packs.push("legend");
      s.levels[level.id]={stars:Math.max(prev.stars||0,stars)};
      s.cash+=out.cash; s.dp+=out.dp; out.packs.forEach(p=>s.packs[p]++);
      if(first&&level.id===s.unlocked&&level.id<D.levels.length){ s.unlocked=level.id+1; out.unlockedNew=true; }
      // prestij eşyaları — mağazada satılmaz
      const give=id=>{ if(!s.owned.includes(id)){ s.owned.push(id); out.prestige.push(item(id)); } };
      if(level.final) give("glv_champ");
      if(D.levels.every(l=>(s.levels[l.id]||{}).stars===3)) give("vis_perfect");
      out.sets=checkSets(); save(); return out;
    },
    buyPack(type){ const p=D.PACKS[type]; if(!p.price) return {ok:false}; if(s.cash<p.price) return {ok:false,need:p.price-s.cash}; s.cash-=p.price; s.packs[type]++; save(); return {ok:true}; },
    openPack(type){
      if(!s.packs[type]) return null; s.packs[type]--; s.stats.packsOpened++;
      const cards=D.PACKS[type].cards.map(c=>{
        if(c.dp){ const n=rnd(...c.dp); s.dp+=n; return {kind:"dp",amount:n,rarity:"common"}; }
        if(c.cash){ const n=rnd(...c.cash); s.cash+=n; return {kind:"cash",amount:n,rarity:"common"}; }
        const it=rollItem(c.item), g=grantItem(it); return {kind:"item",item:it,rarity:it.rarity,...g};
      });
      const order={common:0,rare:1,epic:2,legendary:3}; cards.sort((a,b)=>order[a.rarity]-order[b.rarity]);
      const sets=checkSets(); save(); return {cards,sets};
    },
    owns:id=>s.owned.includes(id),
    equip(id){ const it=item(id); if(!it||!s.owned.includes(id)) return false; s.equipped[it.cat]=id; save(); return true; },
    equippedId(cat){ return s.equipped[cat]||(D.items.find(i=>i.cat===cat&&i.val===null)||D.items.find(i=>i.cat===cat)).id; },
    item,
    // bizim oyuncunun 3D görünümü (kozmetikler uygulanmış)
    playerModel(o={}){
      const p=s.profile||{}, k={...D.homeKit}, g={}, eq=c=>item(api.equippedId(c));
      const v=c=>eq(c)&&eq(c).val;
      for(const cat of ["jersey","pants","socks","facemask"])if(v(cat))k[cat]=v(cat);if(v("wristCoach"))g.wristCoach=v("wristCoach");
      if(v("helmet")) k.helmet=v("helmet");
      if(v("gloves")) k.gloves=v("gloves");
      if(v("cleats")) k.cleats=v("cleats");
      if(v("visor")) g.visor=v("visor");
      if(v("sleeve")){ g.sleeve=v("sleeve")==="team"?k.trim:v("sleeve"); g.sleeveSide=eq("sleeve").side||(p.hand==="L"?"L":"R"); }
      if(v("towel")) g.towel=v("towel"); if(v("mouthguard")) g.mouthguard=v("mouthguard"); if(v("eyeBlack")) g.eyeBlack=true;
      if(v("tape")) g.tape=v("tape"); if(v("wristband")) g.wristband=v("wristband"); if(v("backplate")) g.backplate=v("backplate");
      return { num:p.number==null?12:p.number, colors:k, gear:g, lefty:p.hand==="L",
        look:{skin:p.skin,hair:p.hair,hairColor:p.hairColor,beard:p.beard,height:p.height,weight:p.weight,face:p.face,throwStyle:p.throwStyle,stance:p.stance}, ...o };
    }
  };
  window.FG_STATE=api;
})();
