/* QB campaign data and durable career decisions. Existing map progress is retained. */
(function(){
 const D=FG_DATA,S=FG_STATE,baseKit={...D.homeKit};
 const team=(id,name,short,color,trim,extra={})=>({id,name,short,jersey:color,trim,kit:{...baseKit,jersey:color,helmet:color,trim},...extra});
 const schools=[team('coastal','Coastal Üniversitesi','CU','#126776','#f5cf62',{trust:65,catchBonus:0,blockBonus:.8,threshold:0,note:'Erken forma şansı · uzun cep koruması · gelişen receiver kadrosu'}),team('north','North Valley Üniversitesi','NV','#852a39','#efe2bb',{trust:45,catchBonus:.2,blockBonus:.4,threshold:35,note:'Dengeli kadro · forma rekabeti · güvenilir receiver’lar'}),team('metro','Metro State Üniversitesi','MS','#25366c','#e4b84a',{trust:30,catchBonus:.4,blockBonus:0,threshold:38,note:'Güçlü receiver kadrosu · ilk 11 için yüksek koç güveni'})];
 const pros=[team('harbor','Harbor Admirals','HA','#173454','#80d8e5',{trust:60,threshold:0,note:'Çaylak QB’ye fırsat · yeniden yapılanan takım'}),team('desert','Desert Scorpions','DS','#792b28','#f5c35b',{trust:45,threshold:45,note:'Dengeli hücum · playoff hedefi'}),team('capital','Capital Royals','CR','#472875','#e3bf66',{trust:30,threshold:70,note:'Şampiyonluk adayı · yoğun forma rekabeti'})];
 const stage=id=>id===1?'camp':id<7?'college':id===7?'combine':'pro';
 const names={camp:'BAŞLANGIÇ KAMPI',college:'ÜNİVERSİTE KARİYERİ',combine:'COMBINE & DRAFT',pro:'PROFESYONEL KARİYER'};
 const titles=['İlk kamp','Kampüse hoş geldin','Forma mücadelesi','Derbi haftası','Playoff bileti','Üniversite finali','Combine sınavı','Çaylak sezonu','Playoff mücadelesi','Glory Bowl'];
 D.practiceLevels=D.levels.map(l=>({...l,practice:true}));
 D.levels=D.levels.map((old,i)=>{const id=i+1;return {...old,stage:stage(id),chapter:titles[i],team:{...old.team,venue:stage(id)==='camp'?'Glory Antrenman Kampı':stage(id)==='combine'?'Ulusal QB Combine Merkezi':old.team.venue},shots:Array.from({length:4},(_,j)=>{
 const td=j===3,los=td?80:(j===2?45:25+j*15),yards=td?20:Math.min(14,5+i+j*2),patterns=[[[ -12,0],[-12,5],[-3,14]],[[12,0],[12,7],[20,13]],[[5,0],[5,9],[0,18]],[[-3,-3],[-8,0],[-16,6]],[[-7,0],[-7,8],[7,18]]];
 if(j===1)patterns[0]=[[-12,0],[-12,10],[-21,16]];
 if(id>=4&&j===0)patterns[2]=[[5,0],[5,12],[5,9]];
 if(id>=5&&j===1)patterns[3]=[[-3,-3],[-15,2],[-15,20]];
 if(id>=6&&j===2)patterns[4]=[[-7,0],[-7,8],[14,8]];
 if(j===2)patterns[1]=[[12,0],[12,12],[4,22]];
 return {type:'pass',career:true,title:['Açık receiver’ı bul','Savunmayı oku','Baskı altında karar','Red zone · touchdown'][j],desc:td?'20 yard ilerle ve end zone’a ulaş.':`${yards} yard kazan. Pas veya QB koşusu serbest.`,los,yards,goal:td,time:9,coverage:id===1?'man':id<4?['cover1','cover2'][j%2]:id<6?['cover2','cover3','blitz','cover1'][j]:['cover4','cover3','blitz','cover2'][j],disguise:id>=5&&j>=1,wr:patterns.slice(0,id===1?3:id<6?4:5).map((patrol,k)=>({x:patrol[0][0],d:patrol[0][1],patrol,once:true,spd:4.5+i*.08,role:['WR 1','WR 2','TE','RB','SLOT'][k],route:['Slant / Corner','Out / Post',id>=4?'Curl':'Go',id>=5?'Wheel':'Flat','Cross'][k]})),def:[]};})};});
 function get(){const s=S.get();if(!s.career||s.career.version!==1){s.career={version:1,school:null,pro:null,trust:50,scout:20,results:{},history:[],stats:{attempts:0,completions:0,yards:0,td:0,int:0,sacks:0,rushYards:0}};if(s.profile&&s.profile.position!=='QB'){s.career.previousPosition=s.profile.position;s.profile.position='QB';}S.save();}return s.career;}
 function school(){return schools.find(x=>x.id===get().school);}
 function currentTeam(id=S.get().unlocked){return stage(id)==='pro'?pros.find(x=>x.id===get().pro)||school():stage(id)==='camp'?null:school();}
 function sync(id=S.get().unlocked){const t=currentTeam(id);Object.assign(D.homeKit,t?t.kit:baseKit);return t;}
 function gate(id){const c=get();if(id>S.get().unlocked)return 'locked';if(id>=2&&!c.school)return 'college';if(id>=8&&!c.pro)return 'draft';return null;}
 function offers(kind){return (kind==='college'?schools:pros).map(t=>({...t,available:get().scout>=t.threshold}));}
 function choose(kind,id){const c=get(),list=kind==='college'?schools:pros,t=list.find(t=>t.id===id),key=kind==='college'?'school':'pro';if(!t||c[key]||S.get().unlocked<(kind==='college'?2:8)||c.scout<t.threshold)return false;c[key]=id;c.trust=t.trust;if(kind==='draft')c.draft=draftInfo();c.history.push({text:(kind==='college'?'Üniversite seçildi: ':'Draft tercihi kabul edildi: ')+t.name});sync();S.save();return true;}
 function record(id,stats,success,stars){const c=get();if(!success||c.results[id])return false;c.results[id]={stars};for(const k of Object.keys(c.stats))c.stats[k]+=Math.max(0,Math.round(Number(stats[k])||0));const rate=stats.attempts?stats.completions/stats.attempts:0;c.trust=Math.min(100,c.trust+stars*3+Math.round(rate*5));c.scout=Math.max(0,Math.min(100,c.scout+stars*4+Math.round(rate*6)+Math.min(4,Math.floor((stats.yards||0)/40))+(stats.td||0)*2-(stats.int||0)*3-(stats.sacks||0)));c.history.push({text:`${titles[id-1]} · ${stars} yıldız · ${stats.yards||0} pas yardı`});S.save();return true;}
 function rating(){const s=get().stats;if(!s.attempts)return 0;const clamp=v=>Math.max(0,Math.min(2.375,v));return Math.round((clamp((s.completions/s.attempts-.3)*5)+clamp((s.yards/s.attempts-3)*.25)+clamp(s.td/s.attempts*20)+clamp(2.375-s.int/s.attempts*25))/6*1000)/10;}
 function draftInfo(){const c=get();return {round:c.scout>=85?1:c.scout>=65?2:c.scout>=45?4:7,pick:Math.max(1,Math.round(224-(c.scout/100)*210)),contract:c.scout>=85?'4 yıl · yüksek garanti':c.scout>=65?'3 yıl · rotasyon fırsatı':'2 yıl · gelişim kontratı'};}
 function role(){const c=get();return c.trust>=65?'İlk 11 QB':c.trust>=45?'Rotasyon QB':'Gelişim kadrosu';}
 window.FG_CAREER={get,schools,pros,stage,names,titles,school,currentTeam,sync,gate,offers,choose,record,role,rating,draftInfo};
})();
