// Bot tabanlı denge testi: üç oyuncu profili her kariyer seviyesini N kez ilk denemede oynar.
// node tests/balance.cjs [N] [--report]   → seviye bazlı ilk deneme geçme oranları
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path'),root=path.resolve(__dirname,'..'),storage={};
const N=+process.argv.find(a=>/^\d+$/.test(a))||50, REPORT=process.argv.includes('--report');
const E={cam:{},portrait:true,setCrowdColors(){},zOf:y=>50-y,yardOf:z=>50-z,FIELD_W:26.67,size:()=>({W:390,H:844}),project:(x,y,z)=>({x:195+x*8,y:350+z*5-y*4}),toGround:(x,y)=>({x:(x-195)/8,z:(y-350)/5})};
let rs=12345;const M=Object.create(Math);M.random=()=>{rs=(rs*16807)%2147483647;return (rs-1)/2147483646;};
const c={console,Math:M,performance:{now:()=>0},navigator:{},localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v},requestAnimationFrame(){},FG_ENGINE:E,FG_AUDIO:{play(){},unlock(){}}};c.window=c;vm.createContext(c);
for(const n of ['data','state','difficulty','career','game'])if(fs.existsSync(root+'/js/'+n+'.js'))vm.runInContext(fs.readFileSync(root+'/js/'+n+'.js','utf8'),c);
const S=c.FG_STATE,D=c.FG_DATA,G=c.FG_GAME;S.setProfile({name:'BOT',position:'QB',number:12});G.seed(99);S.setting('adaptive',false);
const hyp=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const openness=(w,P)=>Math.min(...P.defs.map(d=>hyp(d,w)));
const step=()=>G._simulate(1/60);

// Top taşıyıcı kontrolü: en yakın savunmacıdan yana kaç, ileri koş.
function carry(skill){const P=G.G.P,w=P.catcher;if(!w)return;let near=null,dist=1e9;for(const d of P.defs.concat(P.rushers)){const k=hyp(d,w);if(k<dist&&d.z<w.z+1){dist=k;near=d;}}
 let x=0;if(near&&dist<6*skill)x=(w.x>near.x?1:-1)*Math.min(1,skill);x+=-w.x/40;G.moveControl(Math.max(-1,Math.min(1,x)),-1);}
// Bot = K aday hamleyi "zihinde" dener (ayrı bir simülasyon), en iyisini gerçek denemede oynar.
// Oyun rastgelelik içeriyorsa zihinsel deneme ile gerçek sonuç farklılaşır: insan belirsizliğinin modeli.
// novice K=1 (rastgele), average K=3, expert K=8. Öğrenen botlar başarısız hamleyi aynı play'de tekrar seçmez.
const BOTS={novice:{k:1,carry:0,learn:false},average:{k:3,carry:.6,learn:true},expert:{k:8,carry:1,learn:true}};
const TYPES=['bullet','touch','lob'];
function candidate(P){return {i:Math.floor(Math.random()*P.wrs.length),type:TYPES[Math.floor(Math.random()*3)],wait:.4+Math.random()*2.2};}
function run(level,si,action,skill,dt=1/60){
  G.startLevel(level);G.G.si=si;if(action.variant!=null)G.G.variantOverride=action.variant;G._restartShot();G.G.variantOverride=null;G.pause(false);G.snap();
  let thrown=false;
  for(let i=0;i<25/dt&&!G.G.pending;i++){
    if(G.G.phase==='aim'&&!thrown&&G.G.t>=action.wait){G.selectReceiver(action.i);G.setPassType(action.type);thrown=G.passSelected();}
    if(G.G.phase==='carry')carry(skill); else G.moveControl(0,0);
    G._simulate(dt);
  }
  G.moveControl(0,0);const p=G.G.pending;return {ok:!!p?.success,score:p?.success?p.score:(G.G.P.catcher?20:0),variant:G.G.variant};
}
function playShot(level,si,bot,exclude=new Set(),retry=0){
  // Oyuncunun gördüğü play (varyant) sabittir; adaylar o play üzerinde zihinde denenir.
  const variant=G.variantFor?G.variantFor(level.id,si,retry):null;run(level,si,{i:0,type:'touch',wait:99,variant},0,1/30);
  let best=null;
  for(let k=0;k<bot.k;k++){let c;for(let t=0;t<6;t++){c=candidate(G.G.P);if(!exclude.has(c.i+c.type))break;}c.variant=variant;
    if(bot.k>1){const r=run(level,si,c,bot.carry,1/30);c.est=r.score;}else c.est=0;if(!best||c.est>best.est)best=c;}
  const real=run(level,si,best,bot.carry);return {...real,pick:best};
}
// Seviyeyi ilk denemede bitirme: 4 play, 3 can.
function playLevel(level,bot){let lives=3;for(let si=0;si<level.shots.length;si++){const ex=new Set();let done=false,retry=0;while(!done){const r=playShot(level,si,bot,ex,retry);if(r.ok)done=true;else{retry++;if(bot.learn&&r.pick)ex.add(r.pick.i+r.pick.type);if(--lives<=0)return {ok:false,lives:0};}}}return {ok:true,lives};}

const out={};
for(const [name,bot] of Object.entries(BOTS)){out[name]=D.levels.map(l=>{let ok=0,play=0;for(let k=0;k<N;k++){if(playLevel(l,bot).ok)ok++;if(playShot(l,k%4,bot).ok)play++;}return {level:l.id,clear:ok/N,play:play/N};});}
const pct=v=>String(Math.round(v*100)).padStart(3)+'%';
console.log('Seviye   '+D.levels.map(l=>String(l.id).padStart(5)).join(''));
for(const [name,rows] of Object.entries(out)){console.log(name.padEnd(8)+' '+rows.map(r=>pct(r.clear).padStart(5)).join('')+'   (seviye ilk deneme)');console.log(''.padEnd(9)+rows.map(r=>pct(r.play).padStart(5)).join('')+'   (tek play)');}
if(REPORT)process.exit(0);

// Hedef eğri (ortalama oyuncu, seviye ilk deneme). Bkz. docs IYILESTIRME_PLANI.md §2.2
const TARGET=c.FG_DIFF?c.FG_DIFF.targets:null;
assert(TARGET,'FG_DIFF.targets tanımlı olmalı');
const avg=out.average;
avg.forEach((r,i)=>assert(Math.abs(r.clear-TARGET[i])<=.15,`Seviye ${r.level}: ortalama bot ${pct(r.clear)}, hedef ${pct(TARGET[i])} (±15)`));
const mean=rows=>rows.reduce((a,r)=>a+r.clear,0)/rows.length;
assert(mean(out.expert)>mean(out.average)&&mean(out.average)>mean(out.novice),'beceri sıralaması korunmalı: expert > average > novice');
assert(out.average[9].clear<out.average[0].clear-.3,'Glory Bowl, kamptan belirgin şekilde zor olmalı');
console.log(`PASS denge: ortalama bot hedef eğrinin ±15 puan içinde; beceri sıralaması korunuyor (N=${N}).`);
