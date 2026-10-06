const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');const dir=path.resolve(__dirname,'..'),storage={};let now=0;
const E={cam:{},portrait:true,setCrowdColors(){},zOf:y=>50-y,yardOf:z=>50-z,FIELD_W:26.67,size:()=>({W:390,H:844}),project:(x,y,z)=>({x:195+x*8,y:350+z*5-y*4}),toGround:(x,y)=>({x:(x-195)/8,z:(y-350)/5})};
const c={console,Math,performance:{now:()=>now},navigator:{},localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v},requestAnimationFrame(){},FG_ENGINE:E,FG_AUDIO:{play(){},unlock(){}}};c.window=c;vm.createContext(c);for(const n of ['data','state','game'])vm.runInContext(fs.readFileSync(path.join(dir,'js',n+'.js'),'utf8'),c);
const S=c.FG_STATE,D=c.FG_DATA,G=c.FG_GAME;S.setProfile({name:'QA',position:'QB',number:12});const base=JSON.parse(S.exportSave());
function sim(t){for(let i=0;i<t*120&&!G.G.pending;i++)G._simulate(1/120);}
function setup(l,i){G.startLevel(l);G.G.si=i;G._restartShot();G.pause(false);}
const failures=[];
for(const l of D.levels)for(let i=0;i<l.shots.length;i++){const sh=l.shots[i];if(!['pass','target','fg','punt'].includes(sh.type))continue;let success=false;
 for(const mode of ['touch','lob','bullet'])for(const wait of [0,.4,.8,1.2,1.8,2.2,2.8]){if(success)break;setup(l,i);sim(wait);G.setPassType(mode);const P=G.G.P;
 if(sh.type==='pass'||sh.type==='target'){const targets=P.wrs.length?P.wrs:P.hoops;for(let k=0;k<targets.length&&!success;k++){setup(l,i);sim(wait);const t=(G.G.P.wrs.length?G.G.P.wrs:G.G.P.hoops)[k],p=E.project(t.x,t.y||1.4,t.z);G._throw([p,p]);sim(5);success=!!G.G.pending?.success;}}
 else{G._kick([{x:195,y:700},{x:195,y:430}]);sim(8);success=!!G.G.pending?.success;}}
 if(!success)failures.push(`${l.id}/${i+1} ${sh.type}`);
}
assert.deepEqual(failures,[],'Guided shots must be winnable with base attributes');
for(const l of D.levels)for(let i=0;i<l.shots.length;i++){const sh=l.shots[i];if(!['run','tackle','dive'].includes(sh.type))continue;let won=false;
 if(sh.type==='run'){for(const x of [-12,-8,-5,0,5,8,12]){setup(l,i);const P=G.G.P;G._run([{x:P.rb.x,z:P.rb.z},{x,z:P.z0+2},{x,z:P.goalZ-2}]);sim(20);if(G.G.pending?.success){won=true;break;}}}
 else for(const wait of [.8,1,1.2,1.5,1.8,2,2.3,2.6]){setup(l,i);sim(wait);const P=G.G.P;if(sh.type==='tackle'){const q=E.project(P.carrier.x,1.4,P.carrier.z);G._dash([q,q]);}else{const b=G.G.ball;if(!b)continue;const q=E.project(b.tx,0,b.tz);G._dive([q,q]);}sim(8);if(G.G.pending?.success){won=true;break;}}
 assert(won,`No winning run/tackle/dive candidate for ${l.id}/${i+1}`);
}
setup(D.levels[0],1);const start=G.G.P.rushers.map(e=>({x:e.x,z:e.z}));sim(20);assert(G.G.P.sacked);assert(G.G.P.rushers.some((e,i)=>Math.hypot(e.x-start[i].x,e.z-start[i].z)>2));assert(G.G.P.rushers.some(e=>Math.hypot(e.x-G.G.P.qb.x,e.z-G.G.P.qb.z)<.8));
S.importSave(JSON.stringify(base));S.finishLevel(D.levels[0],3);const before=S.get().dp;const r=S.finishLevel(D.levels[0],3);assert.equal(r.dp,0);assert.equal(r.packs.length,0);assert.equal(S.get().dp,before);const save=S.exportSave();S.importSave(save);assert.equal(S.get().unlocked,2);assert.throws(()=>S.importSave('{"cash":-1}'));assert.throws(()=>S.finishLevel(D.levels[9],3));
const listeners={},cv={getBoundingClientRect:()=>({left:0,top:0}),addEventListener:(k,f)=>listeners[k]=f,setPointerCapture(){}};G.attachInput(cv);setup(D.levels[0],0);listeners.pointerdown({clientX:195,clientY:650,pointerId:1,preventDefault(){}});listeners.pointermove({clientX:195,clientY:400});listeners.pointercancel({});assert.equal(G.G.swipe,null);assert.equal(G.G.ball,null);
console.log('PASS all 41 missions including run/tackle/dive; physical sack; repeat rewards; save round-trip; invalid save; pointer cancellation.');
