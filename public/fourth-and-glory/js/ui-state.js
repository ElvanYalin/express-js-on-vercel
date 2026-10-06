/* UI durum makinesi: tek aktif ekran + açık katman yığını + ekrana bağlı zamanlayıcılar.
   Ekran değişince bekleyen tüm UI zamanlayıcıları ve zaman çizelgeleri iptal edilir. */
(function(){
  const SCREENS=["creatorScreen","mapScreen","gameScreen"];
  // Hangi ekranda hangi katman açılabilir? Geçersiz kombinasyon uyarı üretir.
  const ALLOWED={
    creatorScreen:["settingsOverlay"],
    mapScreen:["careerOverlay","packsOverlay","playerOverlay","lockerOverlay","settingsOverlay","openOverlay"],
    gameScreen:["introOverlay","pauseOverlay","endOverlay","openOverlay"]
  };
  const st={screen:null,stack:[],timers:new Set(),timelines:new Set()};
  const el=id=>document.getElementById(id.replace(/^#/,""));

  function later(fn,ms){ const t=setTimeout(()=>{ st.timers.delete(t); fn(); },ms); st.timers.add(t); return t; }
  function cancel(t){ clearTimeout(t); st.timers.delete(t); }
  function cancelAll(){ st.timers.forEach(clearTimeout); st.timers.clear(); st.timelines.forEach(tl=>tl.kill()); st.timelines.clear(); }

  function screen(id){
    if(st.screen!==id){ cancelAll(); st.stack.slice().forEach(close); }
    for(const s of SCREENS){ const e=el(s); if(!e) continue; const on=s===id; e.classList.toggle("active",on); e.inert=!on; }
    st.screen=id;
  }
  function restack(){
    st.stack.forEach((id,i)=>{ const e=el(id); e.style.zIndex=String(50+i); e.inert=i!==st.stack.length-1; });
  }
  function open(id){
    id=id.replace(/^#/,""); const e=el(id); if(!e) return false;
    if(st.screen&&!ALLOWED[st.screen].includes(id)) console.warn(`[ui] ${id} katmanı ${st.screen} ekranında beklenmiyor`);
    st.stack=st.stack.filter(x=>x!==id); st.stack.push(id);
    e.classList.add("show"); restack(); return true;
  }
  function close(id){
    id=id.replace(/^#/,""); const e=el(id); if(!e) return;
    st.stack=st.stack.filter(x=>x!==id); e.classList.remove("show"); e.inert=true; e.style.zIndex=""; restack();
  }
  // Dışarıdan doğrudan classList ile kapatılan katmanları yığından düşür.
  function sync(){ st.stack=st.stack.filter(id=>el(id)?.classList.contains("show")); restack(); }
  const top=()=>{ sync(); return st.stack.at(-1)||null; };

  // requestAnimationFrame tabanlı zaman çizelgesi: add(at,dur,fn(t)), seek(end) = "Atla".
  function timeline(){
    const items=[]; let start=null, done=false, raf=0, onEnd=null;
    const tl={
      add(at,dur,fn){ items.push({at,dur,fn,fired:false}); return tl; },
      get length(){ return items.reduce((m,i)=>Math.max(m,i.at+i.dur),0); },
      play(end){ onEnd=end||null; start=null; done=false; st.timelines.add(tl); raf=requestAnimationFrame(step); return tl; },
      seek(t){ if(done) return; for(const i of items){ const k=i.dur?Math.min(1,Math.max(0,(t-i.at)/i.dur)):(t>=i.at?1:0); if(t>=i.at&&(!i.fired||i.dur)){ i.fired=k>=1; i.fn(k); } } if(t>=tl.length) finish(); },
      skip(){ tl.seek(tl.length+1); },
      kill(){ done=true; if(window.cancelAnimationFrame) window.cancelAnimationFrame(raf); st.timelines.delete(tl); }
    };
    function finish(){ if(done) return; done=true; st.timelines.delete(tl); onEnd&&onEnd(); }
    function step(now){ if(done) return; if(start===null) start=now; tl.seek((now-start)/1000); if(!done) raf=requestAnimationFrame(step); }
    return tl;
  }

  window.FG_UISTATE={screen,open,close,sync,top,later,cancel,cancelAll,timeline,get:()=>({screen:st.screen,stack:[...st.stack]})};
})();
