/* Additive UI: existing navigation, map nodes and screen structure stay intact. */
(function(){
 const C=FG_CAREER,S=FG_STATE,G=FG_GAME,$=id=>document.getElementById(id);
 let next=null;
 function close(){ FG_UISTATE.close('careerOverlay'); }
 function gate(level){const reason=C.gate(level.id);if(!reason)return false;if(reason==='locked'){FG_UI.toast('Önce önceki seviyeyi tamamla.');return true;}
 // B2: kapı her zaman harita ekranında açılır; kapatınca oyuncu donmuş sahada kalmaz.
 if(!document.getElementById('mapScreen').classList.contains('active'))FG_UI.openMap();
 next=level;const college=reason==='college';$('careerTitle').textContent=college?'ÜNİVERSİTE TEKLİFLERİ':'DRAFT · TAKIM TERCİHİ';$('careerText').textContent=college?'Kamp performansın dikkat çekti. Kariyerini hangi okulda sürdüreceksin?':`Tahmin: ${C.draftInfo().round}. tur, ${C.draftInfo().pick}. sıra. ${C.draftInfo().contract}. Uygun tekliflerden tercihini yap.`;
 $('careerOptions').innerHTML=C.offers(reason).map(t=>`<button class="career-offer" data-choice="${t.id}" ${t.available?'':'disabled'}><span class="crest" style="background:${t.jersey};color:${t.trim}">${t.short}</span><b>${t.name}</b><small>${t.note}</small><em>${t.available?'TEKLİF VAR':`Scout ${t.threshold} gerekli`} · güven ${t.trust}</em></button>`).join('');
 $('careerOptions').querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{if(C.choose(reason,b.dataset.choice)){close();FG_UI.openIntro(next);}});FG_UISTATE.open('careerOverlay');return true;
 }
 function map(){C.sync();const stage=C.stage(S.get().unlocked);document.body.dataset.careerStage=stage;document.querySelector('.map-title small').textContent=C.names[stage];}
 function card(){const c=C.get(),t=C.currentTeam(),st=c.stats,rate=st.attempts?Math.round(st.completions/st.attempts*100):0;
 $('plPos').textContent='QB · Quarterback';$('careerTeam').textContent=t?t.name:'Glory Antrenman Kampı';$('careerRole').textContent=C.role()+(c.draft?` · Draft ${c.draft.round}. tur / ${c.draft.pick}. sıra`:'');
 $('qbStats').innerHTML=[['PAS YARDI',st.yards],['TD PASI',st.td],['PAS İSABETİ',rate+'%'],['INTERCEPTION',st.int],['KOÇ GÜVENİ',c.trust+'/100'],['SCOUT İLGİSİ',c.scout+'/100'],['QB RATING',C.rating()],['KOŞU YARDI',st.rushYards],['TAMAMLANAN PAS',st.completions+'/'+st.attempts]].map(([k,v])=>`<div><small>${k}</small><b>${v}</b></div>`).join('');
 season();$('careerHistory').innerHTML=c.history.length?c.history.map(h=>{const li=document.createElement('li');li.textContent=h.text;return li.outerHTML;}).join(''):'<li>İlk kamp maçını tamamlayarak kariyerine başla.</li>';
 }
 function season(){const target=$('seasonSchedule');target.innerHTML=FG_DATA.levels.map(l=>`<li>${S.stars(l.id)?'✓':S.isUnlocked(l.id)?'→':'·'} ${l.id}. ${l.chapter} — ${l.team.name}</li>`).join('');}
 function controls(){const g=G.G,p=g.P,active=!!g.shot?.career;const root=$('qbControls');if(!root)return;root.hidden=!active||!['presnap','aim','live','carry'].includes(g.phase);document.getElementById('gameScreen').classList.toggle('qb-game',active);if(!active)return;
 $('snapAction').hidden=g.phase!=='presnap';$('throwAwayAction').hidden=g.phase!=='aim'||!!g.taUsed?.[g.si];$('passAction').hidden=g.phase!=='aim';$('carryNote').hidden=g.phase!=='carry';$('receiverChoices').hidden=!['presnap','aim'].includes(g.phase);$('movePad').hidden=!['aim','carry'].includes(g.phase);
 [...$('receiverChoices').children].forEach((b,i)=>{b.classList.toggle('selected',i===p.selected);b.textContent=p.wrs?.[i]?.role||'';b.hidden=!p.wrs?.[i];});
 }
 function practice(){ $('careerTitle').textContent='SERBEST ANTRENMAN';$('careerText').textContent='Pas, koşu, tackle ve vuruş görevlerini çalış. Kariyer ilerlemesi ve istatistikleri etkilenmez.';
 $('careerOptions').innerHTML=FG_DATA.practiceLevels.map(l=>`<button class="career-offer" data-practice="${l.id}"><b>Antrenman ${l.id}</b><small>${l.shots.map(x=>FG_DATA.SHOT_INFO[x.type].label).join(' · ')}</small></button>`).join('');$('careerOptions').querySelectorAll('[data-practice]').forEach(b=>b.onclick=()=>{close();FG_UI.openIntro(FG_DATA.practiceLevels[+b.dataset.practice-1]);});FG_UISTATE.open('careerOverlay');
 }
 window.FG_CAREER_UI={gate,map,card,controls};
 window.addEventListener('DOMContentLoaded',()=>{
 $('careerClose').onclick=close;$('trainingBtn').onclick=()=>{FG_UISTATE.close('playerOverlay');practice();};
 $('snapAction').onclick=()=>G.snap();$('throwAwayAction').onclick=()=>{G.throwAway();controls();};let chargeAt=0;const pass=$('passAction');pass.onpointerdown=e=>{e.preventDefault();chargeAt=performance.now();pass.setPointerCapture(e.pointerId);pass.textContent='GÜÇ HAZIRLANIYOR';};pass.onpointerup=e=>{e.preventDefault();G.passSelected(Math.min(1,(performance.now()-chargeAt)/900));pass.textContent='PAS AT';controls();};pass.onpointercancel=()=>{chargeAt=0;pass.textContent='PAS AT';};pass.onclick=e=>{if(e.detail===0){G.passSelected();controls();}};
 for(let i=0;i<5;i++){const b=document.createElement('button');b.onclick=()=>G.selectReceiver(i);$('receiverChoices').appendChild(b);}
 const pad=$('movePad'),knob=$('moveKnob');let pointer=null;
 function release(){pointer=null;G.moveControl(0,0);knob.style.transform='translate(0,0)';}
 function move(e){const r=pad.getBoundingClientRect(),x=(e.clientX-r.left-r.width/2)/(r.width*.35),z=(e.clientY-r.top-r.height/2)/(r.height*.35),len=Math.max(1,Math.hypot(x,z));G.moveControl(x/len,z/len);knob.style.transform=`translate(${x/len*26}px,${z/len*26}px)`;}
 pad.onpointerdown=e=>{e.preventDefault();pointer=e.pointerId;pad.setPointerCapture(pointer);move(e);};pad.onpointermove=e=>{if(pointer===e.pointerId)move(e);};pad.onpointerup=release;pad.onpointercancel=release;pad.onlostpointercapture=release;window.addEventListener('blur',release);
 const keys=new Set();window.addEventListener('keydown',e=>{if(!document.getElementById('gameScreen').classList.contains('active')||G.G.paused||!G.G.shot?.career)return;const k=e.key.toLowerCase();if('wasd'.includes(k)||k.startsWith('arrow')){e.preventDefault();keys.add(k);}else if(k===' '){e.preventDefault();G.G.phase==='presnap'?G.snap():G.passSelected();}else if(/^[1-5]$/.test(k))G.selectReceiver(+k-1);G.moveControl((keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0));});
 window.addEventListener('keyup',e=>{keys.delete(e.key.toLowerCase());G.moveControl((keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0));});window.addEventListener('blur',()=>keys.clear());controls();
 });
})();
