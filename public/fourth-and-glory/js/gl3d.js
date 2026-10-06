// Fourth & Glory — kütüphanesiz WebGL çizici + gerçekçi oranlı eklemli 3D oyuncu
// FG_GL.create(canvas) → bağımsız çizici (oyun sahnesi ve karakter önizlemesi ayrı ayrı kullanır)
(function(){
  // ---------- mat4 (sütun öncelikli) ----------
  const I=()=>new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
  function mul(a,b){ const o=new Float32Array(16); for(let c=0;c<4;c++) for(let r=0;r<4;r++){ o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3]; } return o; }
  const T=(x,y,z)=>{ const m=I(); m[12]=x; m[13]=y; m[14]=z; return m; };
  const S=(x,y,z)=>{ const m=I(); m[0]=x; m[5]=y; m[10]=z; return m; };
  const RX=a=>{ const c=Math.cos(a),s=Math.sin(a),m=I(); m[5]=c; m[6]=s; m[9]=-s; m[10]=c; return m; };
  const RY=a=>{ const c=Math.cos(a),s=Math.sin(a),m=I(); m[0]=c; m[2]=-s; m[8]=s; m[10]=c; return m; };
  const RZ=a=>{ const c=Math.cos(a),s=Math.sin(a),m=I(); m[0]=c; m[1]=s; m[4]=-s; m[5]=c; return m; };
  const chain=(...ms)=>ms.reduce((a,b)=>mul(a,b));
  function normalMat(m){
    const a=m[0],b=m[1],c=m[2],d=m[4],e=m[5],f=m[6],g=m[8],h=m[9],i=m[10];
    const A=e*i-f*h, B=-(d*i-f*g), C=d*h-e*g, det=a*A+b*B+c*C||1e-6;
    return new Float32Array([A/det,B/det,C/det, -(b*i-c*h)/det,(a*i-c*g)/det,-(a*h-b*g)/det, (b*f-c*e)/det,-(a*f-c*d)/det,(a*e-b*d)/det]);
  }
  const hexCache=new Map();
  function rgb(c){ if(Array.isArray(c)) return c; let v=hexCache.get(c); if(!v){ let h=c.slice(1); if(h.length===3) h=h.split("").map(x=>x+x).join(""); const n=parseInt(h,16); v=[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255]; hexCache.set(c,v); } return v; }
  function shade(c,a){ const [r,g,b]=rgb(c); const f=a<0?0:1, p=Math.abs(a); return [(f-r)*p+r,(f-g)*p+g,(f-b)*p+b]; }

  const VS=`attribute vec3 p; attribute vec3 n; attribute vec2 uv;
  uniform mat4 M; uniform mat3 NM; uniform vec3 cp; uniform vec4 cam; uniform vec4 proj;
  varying vec3 vn; varying vec2 vuv; varying float vd; varying float vy;
  void main(){ vec4 w=M*vec4(p,1.); vec3 d=w.xyz-cp; float s=cam.x, c=cam.y;
    float h=d.x, v=d.y*c-d.z*s, dd=-d.y*s-d.z*c;
    vn=normalize(NM*n); vuv=uv; vd=dd; vy=w.y;
    gl_Position=vec4(proj.x*h+proj.z*dd, proj.y*v+proj.w*dd, ((cam.z+cam.w)*dd-2.*cam.z*cam.w)/(cam.w-cam.z), dd); }`;
  const FS=`precision mediump float; varying vec3 vn; varying vec2 vuv; varying float vd; varying float vy;
  uniform vec3 col; uniform float useTex; uniform sampler2D tex; uniform float gloss; uniform vec3 viewDir; uniform float fogOn;
  void main(){ vec4 base=vec4(col,1.); if(useTex>.5){ base=texture2D(tex,vuv); if(base.a<.45) discard; }
    vec3 n=normalize(vn); vec3 L=normalize(vec3(-.45,.85,.45));
    float dif=max(dot(n,L),0.);
    vec3 hemi=mix(vec3(.30,.33,.30),vec3(.62,.68,.78),n.y*.5+.5);
    float rim=pow(1.-abs(dot(n,viewDir)),3.)*.32;
    vec3 H=normalize(L+viewDir); float spec=pow(max(dot(n,H),0.),32.)*gloss;
    float ao=clamp(.58+vy*.3,.58,1.);
    vec3 c=base.rgb*(hemi*.75+vec3(1.,.97,.9)*dif*.75)*ao+spec*vec3(1.)+rim*vec3(.75,.85,1.);
    float fog=fogOn*clamp((vd-60.)/140.,0.,.35); c=mix(c,vec3(.78,.85,.9),fog);
    gl_FragColor=vec4(c,1.); }`;

  function create(canvas){
    const gl=canvas.getContext("webgl",{antialias:true,alpha:true,premultipliedAlpha:false,preserveDrawingBuffer:true});
    if(!gl) return null;
    let W=0,H=0;
    function sh(type,src){ const s=gl.createShader(type); gl.shaderSource(s,src); gl.compileShader(s); if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
    const prog=gl.createProgram(); gl.attachShader(prog,sh(gl.VERTEX_SHADER,VS)); gl.attachShader(prog,sh(gl.FRAGMENT_SHADER,FS)); gl.linkProgram(prog); gl.useProgram(prog);
    const U={}, A={}; ["M","NM","cp","cam","proj","col","useTex","tex","gloss","viewDir","fogOn"].forEach(k=>U[k]=gl.getUniformLocation(prog,k)); ["p","n","uv"].forEach(k=>A[k]=gl.getAttribLocation(prog,k));
    function build(pos,nrm,uv,idx){
      const vb=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,vb); const data=[]; for(let i=0;i<pos.length/3;i++) data.push(pos[i*3],pos[i*3+1],pos[i*3+2],nrm[i*3],nrm[i*3+1],nrm[i*3+2],uv[i*2]||0,uv[i*2+1]||0);
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);
      const ib=gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(idx),gl.STATIC_DRAW);
      return {vb,ib,n:idx.length};
    }
    function boxGeo(){ const P=[],N=[],Uv=[],X=[]; [[0,0,1],[0,0,-1],[1,0,0],[-1,0,0],[0,1,0],[0,-1,0]].forEach(([nx,ny,nz])=>{ const u=[ny,nz,nx], v=[nz,nx,ny], b0=P.length/3;
      [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([a,b])=>{ P.push(.5*(nx+a*u[0]+b*v[0]),.5*(ny+a*u[1]+b*v[1]),.5*(nz+a*u[2]+b*v[2])); N.push(nx,ny,nz); Uv.push((a+1)/2,(1-b)/2); }); X.push(b0,b0+1,b0+2,b0,b0+2,b0+3); }); return build(P,N,Uv,X); }
    function sphereGeo(seg=20,ring=14){ const P=[],N=[],Uv=[],X=[]; for(let r=0;r<=ring;r++){ const th=r/ring*Math.PI; for(let s=0;s<=seg;s++){ const ph=s/seg*Math.PI*2, x=Math.sin(th)*Math.cos(ph), y=Math.cos(th), z=Math.sin(th)*Math.sin(ph); P.push(x*.5,y*.5,z*.5); N.push(x,y,z); Uv.push(s/seg,r/ring); } }
      for(let r=0;r<ring;r++) for(let s=0;s<seg;s++){ const a=r*(seg+1)+s, b=a+seg+1; X.push(a,b,a+1,b,b+1,a+1); } return build(P,N,Uv,X); }
    function cylGeo(seg=16){ const P=[],N=[],Uv=[],X=[]; for(let s=0;s<=seg;s++){ const ph=s/seg*Math.PI*2, x=Math.cos(ph), z=Math.sin(ph); P.push(x*.5,.5,z*.5, x*.5,-.5,z*.5); N.push(x,0,z,x,0,z); Uv.push(s/seg,0,s/seg,1); }
      for(let s=0;s<seg;s++){ const a=s*2; X.push(a,a+1,a+2,a+1,a+3,a+2); }
      for(const cy of [.5,-.5]){ const c=P.length/3; P.push(0,cy,0); N.push(0,Math.sign(cy),0); Uv.push(.5,.5); for(let s=0;s<=seg;s++){ const ph=s/seg*Math.PI*2; P.push(Math.cos(ph)*.5,cy,Math.sin(ph)*.5); N.push(0,Math.sign(cy),0); Uv.push(0,0); } for(let s=0;s<seg;s++) X.push(c,c+1+s,c+2+s); }
      return build(P,N,Uv,X); }
    function torusGeo(seg=24,tube=8,r=.4,t=.1){ const P=[],N=[],Uv=[],X=[]; for(let i=0;i<=seg;i++){ const a=i/seg*Math.PI*2; for(let j=0;j<=tube;j++){ const b=j/tube*Math.PI*2, cx=Math.cos(a), cz=Math.sin(a);
      P.push((r+t*Math.cos(b))*cx,t*Math.sin(b),(r+t*Math.cos(b))*cz); N.push(Math.cos(b)*cx,Math.sin(b),Math.cos(b)*cz); Uv.push(0,0); } }
      for(let i=0;i<seg;i++) for(let j=0;j<tube;j++){ const a=i*(tube+1)+j, b=a+tube+1; X.push(a,b,a+1,b,b+1,a+1); } return build(P,N,Uv,X); }
    const quad=build([-.5,-.5,0,.5,-.5,0,.5,.5,0,-.5,.5,0],[0,0,1,0,0,1,0,0,1,0,0,1],[0,1,1,1,1,0,0,0],[0,1,2,0,2,3]);
    const meshes={box:boxGeo(),sph:sphereGeo(),cyl:cylGeo(),quad,tor:torusGeo()};
    gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
    const texCache=new Map();
    let cur=null;
    function draw(mesh,M,color,o={}){
      if(cur!==mesh){ gl.bindBuffer(gl.ARRAY_BUFFER,mesh.vb); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesh.ib);
        gl.enableVertexAttribArray(A.p); gl.vertexAttribPointer(A.p,3,gl.FLOAT,false,32,0);
        gl.enableVertexAttribArray(A.n); gl.vertexAttribPointer(A.n,3,gl.FLOAT,false,32,12);
        if(A.uv>=0){ gl.enableVertexAttribArray(A.uv); gl.vertexAttribPointer(A.uv,2,gl.FLOAT,false,32,24); } cur=mesh; }
      gl.uniformMatrix4fv(U.M,false,M); gl.uniformMatrix3fv(U.NM,false,normalMat(M));
      gl.uniform3fv(U.col,rgb(color)); gl.uniform1f(U.gloss,o.gloss||0);
      if(o.tex){ gl.uniform1f(U.useTex,1); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,o.tex); gl.uniform1i(U.tex,0); } else gl.uniform1f(U.useTex,0);
      gl.drawElements(gl.TRIANGLES,mesh.n,gl.UNSIGNED_SHORT,0);
    }
    function numTex(num,fg,outline){
      const key=num+"|"+fg+"|"+outline; let t=texCache.get(key); if(t) return t;
      const c=document.createElement("canvas"); c.width=c.height=128; const x=c.getContext("2d");
      x.font='900 88px "Arial Black",Impact,system-ui'; x.textAlign="center"; x.textBaseline="middle"; x.lineJoin="round";
      x.lineWidth=16; x.strokeStyle=outline; x.strokeText(String(num),64,70); x.fillStyle=fg; x.fillText(String(num),64,70);
      t=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,t); gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      texCache.set(key,t); return t;
    }

    // ---------- iskelet / pozlar ----------
    function rig(e){
      const ph=e.anim||0, mv=Math.min(1,e.moving||0), sw=Math.sin(ph)*mv;
      const r={crouch:0, lean:.1*mv, hipL:sw*.8, hipR:-sw*.8, kneeL:.12+Math.max(0,Math.sin(ph+1.4))*1.15*mv, kneeR:.12+Math.max(0,Math.sin(ph+1.4+Math.PI))*1.15*mv,
        shL:-sw*.75, shR:sw*.75, elL:.25+.9*mv, elR:.25+.9*mv, abL:.12, abR:.12, bob:Math.abs(Math.cos(ph))*.05*mv, head:0};
      switch(e.pose){
        case "apose": r.abL=r.abR=.42; r.elL=r.elR=.12; r.shL=r.shR=.05; break;
        case "stance": r.crouch=.34; r.lean=.78; r.hipL=r.hipR=.95; r.kneeL=r.kneeR=1.35; r.shL=r.shR=1.45; r.elL=r.elR=.1; break;
        case "block": r.crouch=.18; r.lean=.45; r.hipL=.6+sw*.3; r.hipR=.6-sw*.3; r.kneeL=r.kneeR=.9; r.shL=r.shR=1.25; r.elL=r.elR=1.3; break;
        case "throw": r.shR=3.4; r.elR=1.5; r.abR=.35; r.shL=1.1; r.elL=.9; r.crouch=.04; break;
        case "release": r.shR=2.1; r.elR=.15; r.shL=.2; r.elL=.6; r.lean=.3; break;
        case "catch": r.shL=r.shR=2.95; r.elL=r.elR=.2; r.abL=r.abR=.18; break;
        case "reach": r.shL=r.shR=2.4; r.elL=r.elR=.3; break;
        case "tackle": r.lean=Math.max(r.lean,.6); r.shL=r.shR=1.45; r.elL=r.elR=.35; r.abL=r.abR=.3; break;
        case "dive": r.lean=1.3; r.shL=r.shR=2.9; r.elL=r.elR=.1; r.hipL=-.4; r.hipR=-.2; r.kneeL=r.kneeR=.4; break;
        case "carry": r.shR=.55; r.elR=1.9; r.abR=.05; break;
        case "kick": { const k=e.kickT||0; r.hipR=-.9+k*2.7; r.kneeR=(1-k)*1.3+.05; r.hipL=-.2; r.kneeL=.25; r.shL=.6; r.abL=1.1; r.shR=-.3; r.abR=.5; r.lean=-.05; break; }
        case "punt": { const k=e.kickT||0; r.hipR=-.6+k*3.0; r.kneeR=(1-k)*1.0+.02; r.shL=1.0+k*.5; r.shR=.9; r.abL=.6; r.lean=-.12*k; break; }
        case "kneel": r.crouch=.52; r.hipL=1.5; r.kneeL=1.55; r.hipR=-.1; r.kneeR=2.2; r.lean=.15; r.shL=r.shR=.9; r.elL=r.elR=.9; break;
        case "celebrate": r.shL=r.shR=3.0+Math.sin(ph*2)*.15; r.elL=r.elR=.2; r.abL=r.abR=.25; break;
      }
      if(e.lefty&&(e.pose==="throw"||e.pose==="release")){ [r.shL,r.shR]=[r.shR,r.shL]; [r.elL,r.elR]=[r.elR,r.elL]; [r.abL,r.abR]=[r.abR,r.abL]; }
      return r;
    }

    // e.look: {skin, hair, hairColor, beard, height(0..1), weight(0..1)}  e.helmetOff
    // e.colors: {jersey, trim, number, numberOutline, helmet, stripe, mask, pants, pantsStripe, legs, socks, cleats, sole, gloves, glovePalm}
    // e.gear: {visor, sleeve, sleeveSide, towel, eyeBlack, tape, mouthguard, backplate, wristband}
    function drawPlayer(e){
      const c=e.colors, L=e.look||{}, G=e.gear||{}, r=rig(e);
      const hs=.96+(L.height==null?.5:L.height)*.1, ws=.92+(L.weight==null?.5:L.weight)*.2;
      const skin=L.skin||"#c68b5e", jersey=rgb(c.jersey), jerseyL=shade(c.jersey,.08), trim=c.trim, pants=c.pants;
      const legs=c.legs||c.pants, socks=c.socks||"#f2f2f2", cleats=c.cleats||"#1b2433", sole=c.sole||"#f4f4f4";
      const gloves=c.gloves||"#1b2433", palm=c.glovePalm||"#e8e8e8";
      const yaw=e.yaw!=null?e.yaw:(e.facing==="down"?Math.PI:0);
      let root=chain(T(e.x,(e.y||0),e.z),RY(yaw),S(hs,hs,hs));
      if(e.fall) root=chain(root,RZ((e.fallDir||1)*e.fall*1.45));
      if(e.roll) root=chain(root,RZ(-e.roll));
      if(e.pitch) root=chain(root,T(0,.5,0),RX(-e.pitch),T(0,-.5,0));
      const hipY=1.02-r.crouch+r.bob;
      const pelvis=chain(root,T(0,hipY,0));
      const torso=chain(pelvis,RX(-r.lean));
      // ---- bacaklar ----
      [[-1,r.hipL,r.kneeL],[1,r.hipR,r.kneeR]].forEach(([s,hp,kn])=>{
        const hip=chain(pelvis,T(s*.115*ws,-.02,0),RX(hp));
        draw(meshes.sph,chain(hip,T(0,-.22,.005),S(.215*ws,.55,.235*ws)),pants);
        draw(meshes.sph,chain(hip,T(s*.088*ws,-.22,.005),S(.05,.53,.07)),c.pantsStripe||trim);
        draw(meshes.sph,chain(hip,T(0,-.46,-.015),S(.15,.15,.155)),pants);
        const knee=chain(hip,T(0,-.47,0),RX(-kn));
        draw(meshes.sph,chain(knee,T(0,-.15,.025),S(.145*ws,.34,.16*ws)),legs);
        draw(meshes.cyl,chain(knee,T(0,-.33,.005),S(.105,.18,.105)),legs);
        draw(meshes.cyl,chain(knee,T(0,-.405,0),S(.112,.075,.112)),socks);
        draw(meshes.box,chain(knee,T(0,-.47,-.045),S(.125,.085,.285)),cleats,{gloss:.5});
        draw(meshes.box,chain(knee,T(0,-.515,-.045),S(.13,.02,.29)),sole);
        draw(meshes.box,chain(knee,T(s*.064,-.465,-.06),S(.006,.03,.16)),sole);
      });
      // ---- kalça / kemer ----
      draw(meshes.sph,chain(torso,T(0,.0,.01),S(.42*ws,.28,.29*ws)),pants);
      draw(meshes.cyl,chain(torso,T(0,.11,0),S(.39*ws,.045,.27*ws)),"#121418",{gloss:.3});
      draw(meshes.box,chain(torso,T(0,.11,-.135*ws),S(.06,.035,.01)),"#c9ccd0",{gloss:.8});
      if(G.towel) draw(meshes.box,chain(torso,T(-.09,.02,-.142*ws),RX(.1),S(.08,.18,.012)),G.towel);
      // ---- gövde ----
      draw(meshes.cyl,chain(torso,T(0,.25,0),S(.37*ws,.26,.25*ws)),jersey);
      draw(meshes.sph,chain(torso,T(0,.45,.0),S(.52*ws,.48,.33*ws)),jersey);
      draw(meshes.sph,chain(torso,T(0,.64,0),S(.74*ws,.2,.4)),jerseyL,{gloss:.12});
      const tex=numTex(e.num==null?"":e.num,c.number||"#fff",c.numberOutline||trim);
      [-1,1].forEach(s=>{
        draw(meshes.sph,chain(torso,T(s*.29*ws,.625,0),S(.27,.21,.38)),jerseyL,{gloss:.12});
        draw(meshes.sph,chain(torso,T(s*.205*ws,.42,0),S(.13*ws,.4,.27*ws)),trim);
        draw(meshes.quad,chain(torso,T(s*.432*ws,.62,0),RY(s*Math.PI/2),S(.13,.13,1)),jersey,{tex});
      });
      draw(meshes.tor,chain(torso,T(0,.745,0),S(.34,.32,.28)),trim);
      if(G.backplate) draw(meshes.box,chain(torso,T(0,.5,.19*ws),RX(-.15),S(.2,.1,.02)),G.backplate,{gloss:.6});
      draw(meshes.quad,chain(torso,T(0,.42,.168*ws),S(.36,.36,1)),jersey,{tex});
      draw(meshes.quad,chain(torso,T(0,.44,-.168*ws),RY(Math.PI),S(.3,.3,1)),jersey,{tex});
      // ---- kollar ----
      const sleeveSide=G.sleeveSide||"R";
      [[-1,r.shL,r.elL,r.abL],[1,r.shR,r.elR,r.abR]].forEach(([s,sp,el,ab])=>{
        const sh=chain(torso,T(s*.355*ws,.585,0),RZ(s*ab),RX(sp));
        const sleeved=G.sleeve&&(sleeveSide==="B"||(sleeveSide==="R")===(s>0));
        const arm=sleeved?G.sleeve:skin;
        draw(meshes.sph,chain(sh,T(0,-.15,0),S(.155*ws,.33,.155*ws)),arm);
        draw(meshes.cyl,chain(sh,T(0,-.05,0),S(.2*ws,.14,.2*ws)),jersey);
        draw(meshes.cyl,chain(sh,T(0,-.115,0),S(.202*ws,.025,.202*ws)),trim);
        const elb=chain(sh,T(0,-.3,0),RX(el));
        draw(meshes.sph,chain(elb,T(0,-.13,0),S(.125*ws,.3,.125*ws)),arm);
        if(G.tape) draw(meshes.cyl,chain(elb,T(0,-.235,0),S(.116,.05,.116)),G.tape);
        if(G.wristband&&s>0) draw(meshes.cyl,chain(elb,T(0,-.205,0),S(.122,.06,.122)),G.wristband);
        draw(meshes.sph,chain(elb,T(0,-.3,0),S(.13,.15,.105)),gloves,{gloss:.3});
        draw(meshes.box,chain(elb,T(0,-.38,0),S(.1,.07,.065)),gloves,{gloss:.3});
        draw(meshes.box,chain(elb,T(-s*.05,-.33,0),S(.01,.12,.085)),palm);
      });
      // ---- boyun & kafa ----
      draw(meshes.cyl,chain(torso,T(0,.79,0),S(.15,.12,.15)),shade(skin,-.08));
      const head=chain(torso,T(0,.95,-.015),RX(r.lean*.45+(r.head||0)));
      const face=chain(head,T(0,-.02,-.03));
      draw(meshes.sph,chain(face,S(.22,.26,.24)),skin);
      draw(meshes.sph,chain(face,T(0,-.01,-.112),S(.028,.045,.032)),shade(skin,-.05));
      [-1,1].forEach(s=>{ draw(meshes.sph,chain(face,T(s*.05,.035,-.1),S(.032,.022,.02)),"#1a1412"); draw(meshes.box,chain(face,T(s*.052,.07,-.105),RZ(s*-.12),S(.05,.012,.01)),L.hairColor||"#2a1d16");
        if(G.eyeBlack) draw(meshes.box,chain(face,T(s*.055,.0,-.112),S(.045,.016,.006)),"#0b0b0b"); });
      draw(meshes.box,chain(face,T(0,-.068,-.108),S(.06,.01,.01)),shade(skin,-.35));
      if(L.beard&&L.beard!=="none") draw(meshes.sph,chain(face,T(0,-.06,-.03),S(L.beard==="full"?.228:.224,L.beard==="full"?.15:.12,L.beard==="full"?.236:.231)),L.beard==="stubble"?shade(L.hairColor||"#2a1d16",.25):(L.hairColor||"#2a1d16"));
      if(e.helmetOff){
        [-1,1].forEach(s=>draw(meshes.sph,chain(face,T(s*.112,.0,.01),S(.04,.07,.05)),shade(skin,-.06)));
        const hc=L.hairColor||"#2a1d16", hair=L.hair||"short";
        if(hair==="short") draw(meshes.sph,chain(face,T(0,.06,.015),S(.235,.2,.255)),hc);
        if(hair==="fade") draw(meshes.sph,chain(face,T(0,.085,.02),S(.225,.15,.245)),hc);
        if(hair==="long"){ draw(meshes.sph,chain(face,T(0,.06,.03),S(.25,.22,.27)),hc); draw(meshes.sph,chain(face,T(0,-.06,.09),S(.22,.24,.12)),hc); }
        if(hair==="dreads"){ draw(meshes.sph,chain(face,T(0,.065,.02),S(.24,.2,.26)),hc); for(let i=0;i<9;i++){ const a=(i/8-.5)*2.4; draw(meshes.cyl,chain(face,T(Math.sin(a)*.11,-.04,Math.cos(a)*.1+.02),RX(.15),S(.03,.2,.03)),hc); } }
        if(G.mouthguard) draw(meshes.box,chain(face,T(0,-.07,-.115),S(.05,.02,.02)),G.mouthguard);
      } else {
        const hel=c.helmet;
        draw(meshes.sph,chain(head,T(0,.015,.015),S(.36,.355,.4)),hel,{gloss:1.1});
        draw(meshes.sph,chain(head,T(0,.015,.015),S(.07,.362,.405)),c.stripe||trim,{gloss:.8});
        draw(meshes.sph,chain(head,T(0,.015,.015),S(.024,.365,.408)),"#ffffff",{gloss:.8});
        [-1,1].forEach(s=>{ draw(meshes.sph,chain(head,T(s*.165,-.02,0),S(.05,.09,.1)),shade(hel,-.25),{gloss:.5}); draw(meshes.cyl,chain(head,T(s*.176,-.02,0),RZ(Math.PI/2),S(.035,.02,.035)),"#c9ccd0",{gloss:.9}); });
        const mask=c.mask||"#c8cdd3";
        [-.05,-.1].forEach(y=>draw(meshes.cyl,chain(head,T(0,y,-.2),RZ(Math.PI/2),S(.021,.25,.021)),mask,{gloss:1.2}));
        draw(meshes.cyl,chain(head,T(0,.0,-.195),RZ(Math.PI/2),S(.019,.27,.019)),mask,{gloss:1.2});
        draw(meshes.cyl,chain(head,T(0,-.075,-.21),S(.02,.08,.02)),mask,{gloss:1.2});
        [-1,1].forEach(s=>draw(meshes.cyl,chain(head,T(s*.125,-.045,-.155),RX(.45),RZ(s*.15),S(.02,.16,.02)),mask,{gloss:1.2}));
        draw(meshes.box,chain(head,T(0,-.15,-.12),S(.13,.03,.05)),"#e9ecef");
        if(G.visor) draw(meshes.box,chain(head,T(0,.04,-.188),RX(-.15),S(.25,.075,.01)),G.visor,{gloss:1.5});
        if(G.mouthguard) draw(meshes.box,chain(face,T(0,-.07,-.12),S(.05,.02,.02)),G.mouthguard);
      }
    }
    function drawBall(b){
      const M=chain(T(b.x,b.h,b.z),RY(b.yaw||0),RX(b.rot||0));
      draw(meshes.sph,chain(M,S(.18,.18,.31)),"#8a4422",{gloss:.6});
      draw(meshes.box,chain(M,T(0,.088,0),S(.018,.01,.1)),"#f4ece0");
      [-.03,0,.03].forEach(z=>draw(meshes.box,chain(M,T(0,.088,z),S(.05,.012,.012)),"#f4ece0"));
      [-1,1].forEach(s=>draw(meshes.cyl,chain(M,T(0,0,s*.105),RX(Math.PI/2),S(.17,.012,.17)),"#f4ece0"));
    }
    function drawHoop(h){
      const M=chain(T(h.x,h.y,h.z),RX(Math.PI/2),S(h.r*2.2,h.r*2.2,h.r*2.2));
      draw(meshes.tor,chain(M,S(1,1.2,1)),h.hit?"#78f065":(h.color||"#ff6a2b"),{gloss:.4});
      if(h.post!==false) draw(meshes.cyl,chain(T(h.x,(h.y-h.r)/2,h.z),S(.08,Math.max(.05,h.y-h.r),.08)),"#2b3442");
    }
    function drawCone(o){ draw(meshes.cyl,chain(T(o.x,.3,o.z),S(.3,.6,.3)),"#ff6a2b"); draw(meshes.cyl,chain(T(o.x,.03,o.z),S(.45,.06,.45)),"#e8501c"); }
    function drawDummy(o){ draw(meshes.cyl,chain(T(o.x,.95,o.z),S(.55,1.7,.55)),"#f1c40f",{gloss:.2}); draw(meshes.cyl,chain(T(o.x,.12,o.z),S(.7,.24,.7)),"#1d2b3a"); }

    return {
      ok:true,
      resize(w,h,d){ W=w; H=h; canvas.width=Math.round(w*d); canvas.height=Math.round(h*d); gl.viewport(0,0,canvas.width,canvas.height); },
      render(cam,ents,ball,shake,props,opt={}){
        gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT); cur=null;
        gl.uniform3f(U.cp,cam.x,cam.y,cam.z); gl.uniform4f(U.cam,Math.sin(cam.pitch),Math.cos(cam.pitch),.25,400);
        const sx=shake?shake.x:0, sy=shake?shake.y:0;
        gl.uniform4f(U.proj,2*cam.f/W,2*cam.f/H,2*sx/W,(1-2*cam.cy)-2*sy/H);
        gl.uniform3f(U.viewDir,0,Math.sin(cam.pitch),Math.cos(cam.pitch)); gl.uniform1f(U.fogOn,opt.fog===false?0:1);
        (props||[]).forEach(o=>{ if(o.kind==="hoop") drawHoop(o); else if(o.kind==="cone") drawCone(o); else if(o.kind==="dummy") drawDummy(o); });
        ents.forEach(e=>drawPlayer(e));
        if(ball&&!ball.hidden) drawBall(ball);
      }
    };
  }
  window.FG_GL={create};
})();
