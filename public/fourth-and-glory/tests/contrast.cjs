// Forma okunabilirliği: her seviyede, oyuncunun olası tüm takımlarına karşı rakip forması ≥ 3:1 kontrast (WCAG göreli parlaklık).
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path'),root=path.resolve(__dirname,'..'),storage={};
const c={console,Math,localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v}};c.window=c;vm.createContext(c);
for(const n of ['data','stage-look','state','difficulty','career'])vm.runInContext(fs.readFileSync(root+'/js/'+n+'.js','utf8'),c);
const D=c.FG_DATA,C=c.FG_CAREER,L=c.FG_LOOK,base={...D.homeKit};
const homes=l=>l.stage==='camp'?[base]:l.stage==='pro'?C.pros.map(t=>t.kit):C.schools.map(t=>t.kit);
let checked=0;const swapped=[];
for(const l of D.levels)for(const h of homes(l)){const a=L.awayKit(h,l.team);const r=L.contrast(h.jersey,a.jersey);checked++;
  assert(r>=3,`Seviye ${l.id}: ev ${h.jersey} / rakip ${a.jersey} kontrastı ${r.toFixed(2)} < 3`);if(a.away)swapped.push(`${l.id}:${l.team.short}`);}
// Kolej (Level 2) görünümü: güneş alçak (altın saat), sis sıcak, 3. play'den itibaren ışıklar yanar.
const c0=L.resolve('college',0),c1=L.resolve('college',1);assert(c0.sun.elev<20&&c1.sun.elev<c0.sun.elev);assert.equal(c0.lights,0);assert.equal(L.resolve('college',.67).lights,1);
const warm=hex=>{const n=parseInt(hex.slice(1),16);return ((n>>16)&255)>(n&255);};assert(warm(c0.sun.color)&&warm(c0.fog.color),'kolej ışığı sıcak olmalı');
console.log(`PASS forma kontrastı ${checked} kombinasyonda ≥3:1 (deplasman forması: ${swapped.length}); kolej altın saat görünümü tutarlı.`);
