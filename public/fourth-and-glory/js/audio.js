// Fourth & Glory — sentezlenmiş ses efektleri (harici dosya gerekmez)
(function(){
  let ac=null, master=null, noiseBuf=null;
  function enabled(){ try{ return FG_STATE.get().settings.sound!==false; }catch(e){ return true; } }
  function ctx(){
    if(!ac){
      const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return null;
      ac=new AC(); master=ac.createGain(); master.gain.value=.55; master.connect(ac.destination);
      noiseBuf=ac.createBuffer(1, ac.sampleRate*2, ac.sampleRate);
      const d=noiseBuf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
    }
    if(ac.state==="suspended") ac.resume();
    return ac;
  }
  function tone(freq,dur,{type="sine",vol=.3,slide=0,delay=0}={}){
    const a=ctx(); if(!a) return; const t=a.currentTime+delay;
    const o=a.createOscillator(), g=a.createGain(); o.type=type; o.frequency.setValueAtTime(freq,t);
    if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(30,freq+slide),t+dur);
    g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+.012); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(g).connect(master); o.start(t); o.stop(t+dur+.05);
  }
  function noise(dur,{vol=.3,freq=1200,q=.8,type="bandpass",delay=0,attack=.005}={}){
    const a=ctx(); if(!a) return; const t=a.currentTime+delay;
    const s=a.createBufferSource(); s.buffer=noiseBuf; const f=a.createBiquadFilter(); f.type=type; f.frequency.value=freq; f.Q.value=q;
    const g=a.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+attack); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    s.connect(f).connect(g).connect(master); s.start(t, Math.random()); s.stop(t+dur+.05);
  }
  const sounds={
    crowd(){noise(3.6,{vol:.035,freq:850,q:.25,attack:.6});},
    step(){noise(.07,{vol:.07,freq:180,q:.7,type:"lowpass"});},
    tap(){ tone(660,.06,{type:"triangle",vol:.12}); },
    snap(){ noise(.09,{vol:.5,freq:400,q:1.5}); tone(110,.12,{type:"sine",vol:.35,slide:-50}); },
    whistle(){ tone(2300,.32,{type:"sine",vol:.14}); tone(2380,.32,{type:"sine",vol:.1}); },
    throw(){ noise(.35,{vol:.22,freq:900,q:.6,attack:.12}); },
    catch(){ noise(.07,{vol:.45,freq:300,q:1}); tone(180,.1,{vol:.3,slide:-60}); },
    hit(){ noise(.22,{vol:.75,freq:180,q:.7,type:"lowpass"}); tone(70,.25,{vol:.55,slide:-30}); noise(.12,{vol:.3,freq:2200,q:.5,delay:.02}); },
    whoosh(){ noise(.25,{vol:.2,freq:1500,q:.7,attack:.08}); },
    cheer(){ noise(1.6,{vol:.28,freq:1100,q:.35,attack:.25}); noise(1.4,{vol:.18,freq:2600,q:.5,attack:.3,delay:.1}); [523,659,784,1046].forEach((f,i)=>tone(f,.22,{type:"square",vol:.06,delay:.05+i*.09})); },
    fail(){ tone(220,.28,{type:"sawtooth",vol:.1,slide:-80}); tone(160,.4,{type:"sawtooth",vol:.08,slide:-60,delay:.18}); noise(.8,{vol:.1,freq:500,q:.4,attack:.2}); },
    tick(){ tone(1400,.03,{type:"square",vol:.05}); },
    coin(){ tone(988,.08,{type:"square",vol:.07}); tone(1319,.18,{type:"square",vol:.07,delay:.08}); },
    // Bando fanfarı (kolej): üç notalı bakır + trampet.
    fanfare(){ [[392,0],[523,.16],[659,.32],[784,.5]].forEach(([f,d],i)=>{ tone(f,i===3?.55:.18,{type:"sawtooth",vol:.07,delay:d}); tone(f/2,i===3?.55:.18,{type:"triangle",vol:.06,delay:d}); }); for(let i=0;i<6;i++) noise(.06,{vol:.18,freq:2400,q:.9,delay:i*.09}); },
    crowdBurst(){ noise(2.2,{vol:.32,freq:900,q:.3,attack:.35}); noise(1.8,{vol:.2,freq:2200,q:.5,attack:.4,delay:.15}); },
    // Paket sinematiği katmanları
    riser(){ const a=ctx(); if(!a) return; tone(180,1.2,{type:"sawtooth",vol:.05,slide:700}); noise(1.2,{vol:.12,freq:1800,q:.6,attack:1.0}); },
    impact(){ tone(55,.6,{vol:.5,slide:-20}); noise(.35,{vol:.5,freq:160,q:.7,type:"lowpass"}); },
    shimmer(){ [1568,2093,2637,3136].forEach((f,i)=>tone(f,.5,{type:"sine",vol:.05,delay:i*.06})); }
  };
  window.FG_AUDIO={ play(name){ if(!enabled()) return; try{ sounds[name]&&sounds[name](); }catch(e){} }, unlock(){ ctx(); } };
})();
