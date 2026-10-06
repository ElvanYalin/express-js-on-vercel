const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path'),root=path.resolve(__dirname,'..'),storage={};
const E={cam:{},portrait:true,setCrowdColors(){},zOf:y=>50-y,yardOf:z=>50-z,FIELD_W:26.67,size:()=>({W:390,H:844}),project:(x,y,z)=>({x:195+x*8,y:350+z*5-y*4}),toGround:(x,y)=>({x:(x-195)/8,z:(y-350)/5})};
const c={console,Math,performance:{now:()=>0},navigator:{},localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v},requestAnimationFrame(){},FG_ENGINE:E,FG_AUDIO:{play(){},unlock(){}}};c.window=c;vm.createContext(c);for(const n of ['data','state','difficulty','career','game'])vm.runInContext(fs.readFileSync(root+'/js/'+n+'.js','utf8'),c);
const S=c.FG_STATE,D=c.FG_DATA,C=c.FG_CAREER,G=c.FG_GAME;S.setProfile({name:'QA',position:'QB',number:12});
G.seed(7);
// Top taşıyıcı en yakın savunmacıdan yana kaçar (v0.8: takip açıları gerçek; yön vermeden koşu yetmez).
function steer(){const P=G.G.P;if(G.G.phase!=='carry'||!P.catcher||P.catcher===P.qb&&G.G.P.manual)return;const w=P.catcher;let n=null,dd=1e9;for(const d of P.defs.concat(P.rushers)){const k=Math.hypot(d.x-w.x,d.z-w.z);if(k<dd&&d.z<w.z+1){dd=k;n=d;}}G.moveControl(n&&dd<6?(w.x>n.x?1:-1):-w.x/40,-1);}
function sim(t){for(let i=0;i<t*120&&!G.G.pending;i++){steer();G._simulate(1/120);}G.moveControl(0,0);}
function setup(l,i){G.startLevel(l);G.G.si=i;G._restartShot();G.pause(false);G.snap();}
const failures=[],wins=[];
for(const l of D.levels)for(let i=0;i<4;i++){let won=false;outer:for(const mode of ['touch','lob','bullet'])for(const wait of [.5,1,1.5,2,2.5,3])for(let target=0;target<l.shots[i].wr.length;target++){setup(l,i);sim(wait);G.selectReceiver(target);G.setPassType(mode);G.passSelected();sim(18);if(G.G.pending?.success){won=true;wins.push([l.id,i,target,mode,wait]);break outer;}}
 if(!won)failures.push(`${l.id}/${i+1}`);
}
console.log('Winning scenarios',wins.length, 'failures',failures);assert.deepEqual(failures,[],'Every QB mission must be winnable');
setup(D.levels[0],0);assert.equal(G.G.ents.filter(e=>e.team==='home').length,11);assert.equal(G.G.ents.filter(e=>e.team==='away').length,11);const positions=G.G.P.defs.map(d=>[d.x,d.z]);sim(2);assert(G.G.P.defs.some((d,i)=>Math.hypot(d.x-positions[i][0],d.z-positions[i][1])>.3));assert(G.selectReceiver(2));assert.equal(G.G.P.selected,2);assert(!G.selectReceiver(4));
setup(D.levels[0],0);G.moveControl(1,0);sim(1);assert(G.G.P.qb.x>1);G.pause(true);const x=G.G.P.qb.x;sim(1);assert.equal(G.G.P.qb.x,x);assert.equal(G.G.P.control.x,0);G.pause(false);
setup(D.levels[0],0);G.G.P.manual=true;G.moveControl(0,-1);sim(2);assert.equal(G.G.phase,'carry');assert.equal(G.G.P.catcher,G.G.P.qb);assert(!G.passSelected());
setup(D.levels[3],0);sim(15);assert(G.G.P.sacked);assert.equal(G.G.matchStats.sacks,1);
G.startLevel(D.levels[0]);G.pause(false);const presnap=G.G.P.wrs[0].z;sim(3);assert.equal(G.G.P.wrs[0].z,presnap);assert(!G.passSelected());
assert.equal(C.gate(2),'locked');S.finishLevel(D.levels[0],3);assert.equal(C.gate(2),'college');assert(!C.choose('college','metro'));assert(C.choose('college','coastal'));assert(!C.choose('college','north'));assert.equal(C.gate(2),null);assert.equal(D.homeKit.jersey,C.schools[0].jersey);
const stats={attempts:6,completions:4,yards:70,td:1,int:1,sacks:1,rushYards:5};assert(C.record(1,stats,true,3));assert(!C.record(1,stats,true,3));assert.equal(C.get().stats.yards,70);
for(let i=1;i<7;i++){S.finishLevel(D.levels[i],3);C.record(i+1,stats,true,3);}assert.equal(C.gate(8),'draft');assert(C.choose('draft','capital'));assert.equal(C.gate(8),null);assert.equal(C.currentTeam().id,'capital');
const saved=S.exportSave();S.importSave(saved);assert.equal(C.get().school,'coastal');assert.equal(C.get().pro,'capital');assert.equal(C.get().stats.yards,490);assert.equal(C.role(),'Gelişim kadrosu');
const invalid=JSON.parse(saved);invalid.state.career.stats.attempts=-1;assert.throws(()=>S.importSave(JSON.stringify(invalid)));assert.equal(C.get().stats.yards,490);
assert.throws(()=>S.finishLevel(D.practiceLevels[0],3));assert.equal(D.practiceLevels.reduce((n,l)=>n+l.shots.length,0),41);
console.log('PASS 40 QB missions, 11v11, coverage, receiver selection, movement/pause/scramble, physical sack, presnap, college and draft gates, stats deduplication, save reload, practice isolation.');
