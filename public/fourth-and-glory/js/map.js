// Fourth & Glory — Soccer Hero tarzı seviye haritası (Amerikan futbolu sahası üzerinde)
(function(){
  const XS=[.5,.2,.44,.8,.56,.2,.42,.78,.52,.5];
  const STEP=178, TOP=300, BOTTOM=360, SAFE_L=92; // SAFE_L: sol menü (Oyuncum/Paketler/Soyunma) bandı
  const starSvg=(on,cls="")=>`<svg class="star ${cls}" viewBox="0 0 24 24"><path d="M12 2.6l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17.2l-5.9 3.2 1.3-6.5L2.5 9.4l6.6-.8z" fill="${on?"#ffd84a":"#5d6770"}" stroke="${on?"#b8860b":"#3b434a"}" stroke-width="1.2" stroke-linejoin="round"/>${on?'<path d="M12 5.5l1.8 3.8 3.9.5" fill="none" stroke="#fff6b0" stroke-width="1.2" stroke-linecap="round"/>':""}</svg>`;
  function crest(team){ return `<span class="crest" style="background:${team.jersey};color:${team.trim}">${team.short}</span>`; }
  function catmull(pts){ let d=`M${pts[0].x},${pts[0].y}`; for(let i=0;i<pts.length-1;i++){ const p0=pts[i-1]||pts[i], p1=pts[i], p2=pts[i+1], p3=pts[i+2]||p2;
    d+=` C${p1.x+(p2.x-p0.x)/6},${p1.y+(p2.y-p0.y)/6} ${p2.x-(p3.x-p1.x)/6},${p2.y-(p3.y-p1.y)/6} ${p2.x},${p2.y}`; } return d; }
  function rnd(seed){ return ()=>{ seed=(seed*16807)%2147483647; return (seed-1)/2147483646; }; }

  // dekor çizimleri
  const dummy=(x,y,s=1)=>`<g transform="translate(${x},${y}) scale(${s})"><ellipse cx="0" cy="34" rx="16" ry="6" fill="rgba(0,0,0,.25)"/><rect x="-12" y="-30" width="24" height="62" rx="12" fill="#f1c40f" stroke="#c99a06" stroke-width="2"/><rect x="-12" y="18" width="24" height="12" rx="4" fill="#1d2b3a"/><path d="M-12 -6h24" stroke="#c99a06" stroke-width="3"/></g>`;
  const cone=(x,y,s=1,r=0)=>`<g transform="translate(${x},${y}) rotate(${r}) scale(${s})"><ellipse cx="0" cy="14" rx="15" ry="5" fill="rgba(0,0,0,.25)"/><rect x="-14" y="9" width="28" height="6" rx="2" fill="#e8501c"/><path d="M-9 10 L0 -18 L9 10z" fill="#ff6a2b"/><path d="M-6 0 L6 0 L4.5 -5 L-4.5 -5z" fill="#fff"/></g>`;
  const ball=(x,y,r=0)=>`<g transform="translate(${x},${y}) rotate(${r})"><ellipse cx="2" cy="8" rx="15" ry="5" fill="rgba(0,0,0,.22)"/><ellipse rx="16" ry="10" fill="#8a4422" stroke="#5b2a12" stroke-width="1.5"/><path d="M-6 0h12M-4 -2.5v5M-1 -2.5v5M2 -2.5v5M5 -2.5v5" stroke="#fff" stroke-width="1.4"/><path d="M-12 -5q-2 5 0 10M12 -5q2 5 0 10" stroke="#fff" stroke-width="1.4" fill="none"/></g>`;
  const helmet=(x,y,c="#12304f",t="#78f065")=>`<g transform="translate(${x},${y})"><ellipse cx="2" cy="20" rx="20" ry="6" fill="rgba(0,0,0,.22)"/><path d="M-18 6 a19 19 0 0 1 36 -6 l2 14 h-14 l-2 -6 h-8 l-2 8 h-10z" fill="${c}"/><path d="M-2 -13 a19 19 0 0 1 4 0 v25 h-4z" fill="${t}"/><path d="M14 4 h10 M14 10 h10 M22 2 v12" stroke="#ccd" stroke-width="2.4" fill="none"/></g>`;
  const trophy=(x,y)=>`<g transform="translate(${x},${y})"><ellipse cx="0" cy="58" rx="40" ry="10" fill="rgba(0,0,0,.25)"/><rect x="-26" y="40" width="52" height="16" rx="3" fill="#2a2f36"/><rect x="-18" y="28" width="36" height="14" rx="2" fill="#3a414a"/><path d="M-4 28 L-6 0 L6 0 L4 28z" fill="#d9dde1"/><ellipse cx="0" cy="-16" rx="16" ry="11" fill="#e9edf0" transform="rotate(-35 0 -16)" stroke="#aab3bb" stroke-width="2"/><path d="M-8 -10 l14 -10" stroke="#aab3bb" stroke-width="2"/></g>`;

  let built=false;
  function build(){
    const field=document.getElementById("mapField"), s=FG_STATE.get(), L=FG_DATA.levels;
    const W=Math.min(560,window.innerWidth), H=TOP+(L.length-1)*STEP+BOTTOM;
    field.style.height=H+"px";
    const pos=L.map((l,i)=>({x:Math.max(SAFE_L+46,Math.min(W-52,XS[i%XS.length]*W)),y:H-BOTTOM+40-i*STEP}));
    const r=rnd(7); let svg=`<svg class="bg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">`;
    // çim şeritleri + yard çizgileri
    const band=64;
    for(let y=H,k=0;y>-band;y-=band,k++){ svg+=`<rect x="0" y="${y-band}" width="${W}" height="${band}" fill="${k%2?"#3f9446":"#47a04d"}"/>`; }
    const sl=W*.05;
    for(let y=H-210,k=1;y>200;y-=band,k++){
      svg+=`<rect x="${sl}" y="${y-1.5}" width="${W-2*sl}" height="3" fill="rgba(255,255,255,.55)"/>`;
      for(let j=1;j<5;j++){ const yy=y-j*band/5; for(const x of [sl+4,W*.38,W*.62-10,W-sl-14]) svg+=`<rect x="${x}" y="${yy-1}" width="10" height="2" fill="rgba(255,255,255,.35)"/>`; }
      if(k%2===0){ const n=((k/2-1)%9+1)*10, nn=n>50?100-n:n; svg+=`<text x="${sl+22}" y="${y}" font-family="Arial Black,Impact,Arial,Helvetica,sans-serif" font-weight="900" font-size="22" fill="rgba(255,255,255,.45)" text-anchor="middle" dominant-baseline="middle" transform="rotate(90 ${sl+22} ${y})">${nn}</text><text x="${W-sl-22}" y="${y}" font-family="Arial Black,Impact,Arial,Helvetica,sans-serif" font-weight="900" font-size="22" fill="rgba(255,255,255,.45)" text-anchor="middle" dominant-baseline="middle" transform="rotate(-90 ${W-sl-22} ${y})">${nn}</text>`; }
    }
    svg+=`<rect x="${sl-4}" y="0" width="4" height="${H}" fill="rgba(255,255,255,.8)"/><rect x="${W-sl}" y="0" width="4" height="${H}" fill="rgba(255,255,255,.8)"/>`;
    // alt end zone (bizim) + kale direği
    const ez=H-210, hc=FG_DATA.homeKit;
    svg+=`<rect x="${sl}" y="${ez}" width="${W-2*sl}" height="210" fill="${hc.jersey}" opacity=".92"/><rect x="${sl}" y="${ez-2}" width="${W-2*sl}" height="5" fill="#fff"/>`;
    svg+=`<text x="${W/2}" y="${ez+80}" font-family="Arial Black,Impact,Arial,Helvetica,sans-serif" font-weight="900" font-size="${Math.min(70,W*.15)}" fill="${hc.trim}" opacity=".75" text-anchor="middle" dominant-baseline="middle" letter-spacing="6">GLORY</text>`;
    const gx=W/2, gy=H-36;
    svg+=`<g stroke="#f2cf3a" stroke-width="7" stroke-linecap="round" fill="none"><path d="M${gx} ${gy} V${gy-50} M${gx-70} ${gy-50} H${gx+70} M${gx-70} ${gy-50} V${gy-150} M${gx+70} ${gy-50} V${gy-150}"/></g><rect x="${gx-9}" y="${gy-26}" width="18" height="30" rx="4" fill="#12304f"/>`;
    // üst: şampiyonluk end zone + kupa
    const fin=L[L.length-1].team;
    svg+=`<rect x="${sl}" y="0" width="${W-2*sl}" height="190" fill="${fin.jersey}" opacity=".9"/><rect x="${sl}" y="188" width="${W-2*sl}" height="5" fill="#fff"/>`;
    svg+=trophy(W/2,98);
    svg+=`<text x="${W/2}" y="178" font-family="Arial Black,Impact,Arial,Helvetica,sans-serif" font-weight="900" font-size="16" fill="${fin.trim}" text-anchor="middle" letter-spacing="4">ŞAMPİYONLUK</text>`;
    // Career environments behind the unchanged winding path.
    const look=k=>window.FG_LOOK?.STAGES[k]?.mapTint,chapters=[{a:0,b:0,key:'camp',c:'#355e35'},{a:1,b:5,key:'college',c:look('college')||'#8a5a33',o:.28},{a:6,b:6,key:'combine',c:look('combine')||'#46566a'},{a:7,b:9,key:'pro',c:look('pro')||'#203750'}];
    const labels=[];
    chapters.forEach(ch=>{const top=pos[ch.b].y-STEP/2,bottom=pos[ch.a].y+STEP/2;
      if(ch.key!=='camp')svg+=`<rect x="0" y="${top}" width="${W}" height="${bottom-top}" fill="${ch.c}" opacity="${ch.o||.7}"/>`;
      { const label=FG_CAREER.names[ch.key], lw=label.length*7.4+28, n=pos[ch.a], ly=n.y+6;
        const lx=n.x<W/2?Math.min(W-lw-8,n.x+52):Math.max(SAFE_L,n.x-52-lw); // bölümün ilk düğümünün yanında; yıldızlara ve sol menüye değmez
        labels.push([lx-30,ly-45,lw+60,90]);
        svg+=`<g class="chapter"><rect x="${lx}" y="${ly-13}" width="${lw}" height="26" rx="13" fill="#0b1c2ae6" stroke="${ch.c}" stroke-width="2"/><text x="${lx+lw/2}" y="${ly+4}" text-anchor="middle" fill="#f4e7b7" font-family="Arial" font-size="11" font-weight="bold" letter-spacing="1">${label}</text></g>`; }
      if(ch.key==='college'){for(let k=0;k<3;k++){const x=W-49,y=top+90+k*250;svg+=`<g transform="translate(${x},${y})"><rect width="32" height="66" fill="#8c4a35"/><path d="M-4 0L16 -15L36 0Z" fill="#3d4a52"/><path d="M7 8V52M16 8V52M25 8V52" stroke="#e8dcc0" stroke-width="5"/><path d="M16 -15V-47h27v16h-27" fill="${hc.jersey}" stroke="${hc.trim}" stroke-width="2"/></g>`;}}
      if(ch.key==='pro'){for(let k=0;k<9;k+=2){const x=W-30,y=top+65+k*42;svg+=`<rect x="${x}" y="${y}" width="30" height="60" fill="#172b3b"/><path d="M${x+8} ${y+6}v43M${x+20} ${y+6}v43" stroke="#e9c36b" stroke-width="3" stroke-dasharray="4 7"/>`;}}
    });
    // yol
    const pts=[{x:W/2,y:H-150},...pos,{x:W/2,y:205}];
    const cur=Math.min(s.unlocked,L.length), doneIdx=cur; // pts[0..cur] tamamlanan bölüm
    svg+=`<path d="${catmull(pts)}" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="7" stroke-dasharray="18 13" stroke-linecap="round"/>`;
    svg+=`<path d="${catmull(pts.slice(0,doneIdx+1))}" fill="none" stroke="#b7ff4c" stroke-width="8" stroke-linecap="round" style="filter:drop-shadow(0 0 6px rgba(183,255,76,.6))"/>`;
    // dekor (düğümlerden uzak)
    const deco=[]; const far=(x,y)=>pos.every(p=>Math.hypot(p.x-x,p.y-y)>95)&&Math.abs(x-W/2)>40||y<H-260&&pos.every(p=>Math.hypot(p.x-x,p.y-y)>95);
    for(let i=0;i<L.length*2.2;i++){ const y=H-280-r()*(H-560), x=sl+30+r()*(W-2*sl-60); if(x<SAFE_L+20||labels.some(([bx,by,bw,bh])=>x>bx&&x<bx+bw&&y>by&&y<by+bh)||!pos.every(p=>Math.hypot(p.x-x,p.y-y)>100)) continue;
      const k=r(); deco.push(k<.3?dummy(x,y,.9)+dummy(x+30,y+4,.9):k<.6?cone(x,y,1,r()*30-15)+(r()<.5?cone(x+34,y+18,.9,70):""):k<.85?ball(x,y,r()*60-30)+ball(x+24,y+18,r()*60):helmet(x,y,L[Math.floor(r()*L.length)].team.helmet,"#fff")); }
    svg+=deco.join("")+"</svg>";
    let html=svg;
    // düğümler
    L.forEach((l,i)=>{
      const p=pos[i], st=FG_STATE.stars(l.id), unlocked=FG_STATE.isUnlocked(l.id), current=l.id===s.unlocked&&!st;
      const cls=st?"done":current?"current":unlocked?"open":"locked"; // B9: açık ama oynanmamış düğüm ayrı görünür
      html+=`<button class="node ${cls}" data-level="${l.id}" style="left:${p.x}px;top:${p.y}px" aria-label="Seviye ${l.id}">
        ${st?`<div class="stars">${[1,2,3].map(k=>starSvg(k<=st)).join("")}</div>`:""}
        ${current?`<div class="flag"><i></i><b>${l.id}</b></div>`:""}
        ${l.id===2&&!st?`<span class="hc-tag">HOMECOMING</span>`:""}
        <div class="puck"><div class="num">${l.id}</div></div>
        ${!unlocked?`<span class="lock">🔒</span>`:""}
        ${crest(l.team).replace('class="crest"','class="crest"')}
      </button>`;
    });
    field.innerHTML=html;
    field.querySelectorAll(".node").forEach(b=>b.onclick=()=>{ const id=+b.dataset.level;
      if(!FG_STATE.isUnlocked(id)){ FG_UI.toast(`Önce Seviye ${id-1}'deki görevleri bitir.`); FG_AUDIO.play("fail"); return; }
      FG_AUDIO.play("tap"); FG_UI.openIntro(FG_DATA.levels.find(l=>l.id===id)); });
    built=true; return {pos,H};
  }
  function scrollToCurrent(smooth){
    const s=FG_STATE.get(), sc=document.getElementById("mapScroll"), node=document.querySelector(`.node[data-level="${s.unlocked}"]`); if(!node) return;
    const y=parseFloat(node.style.top)-sc.clientHeight*.58;
    sc.style.scrollBehavior=smooth?"smooth":"auto"; sc.scrollTop=Math.max(0,y); sc.style.scrollBehavior="";
  }
  window.FG_MAP={build,scrollToCurrent,starSvg,crest};
})();
