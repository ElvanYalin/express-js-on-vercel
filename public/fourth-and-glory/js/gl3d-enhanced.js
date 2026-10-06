/* Continuous skinned athlete adapter. Retains the original renderer as fallback. */
(function(root){'use strict';const T=root.THREE,legacy=root.FG_GL;
function create(canvas,opts={}){if(!T||!root.FGAthlete)return legacy.create(canvas);let renderer;const studio=!!opts.studio;let lost=false;try{renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});}catch{return legacy.create(canvas);}
 renderer.setClearColor(0,0);
 // B7: bağlam kaybı işlenir; three.js geri yüklemede kaynakları yeniden yükler.
 if(canvas.addEventListener){canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;if(!studio&&root.FG_GAME)root.FG_GAME.pause(true);});canvas.addEventListener('webglcontextrestored',()=>{lost=false;root.FG_UI?.toast?.('Grafikler yeniden yüklendi.');});}renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(45,1,.25,400);const ambient=new T.HemisphereLight(0xe7f3ff,0x41533b,2.3);scene.add(ambient);const sun=new T.DirectionalLight(0xfff0d9,2.8);sun.position.set(-20,35,20);scene.add(sun);const rim=new T.DirectionalLight(0xb0dbff,.7);rim.position.set(15,18,-30);scene.add(rim);
 const models=[],propsGroup=new T.Group();scene.add(propsGroup);let W=1,H=1,propsKey='';const ball=new T.Mesh(new T.SphereGeometry(1,14,10),new T.MeshStandardMaterial({color:0x8a4422,roughness:.7}));ball.scale.set(.10,.10,.18);scene.add(ball);
 const rig=studio?buildStudio():null;
 function buildStudio(){const g=new T.Group();scene.add(g);
  // Soyunma odası fonu: düşük çözünürlüklü tuvale çizilip büyütülür → doğal bulanıklık (sahte alan derinliği).
  const cv=document.createElement('canvas');cv.width=256;cv.height=128;const x=cv.getContext('2d');const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;
  function paint(team){const gr=x&&x.createLinearGradient&&x.createLinearGradient(0,0,0,128);if(!gr)return;gr.addColorStop(0,'#07090c');gr.addColorStop(.55,'#141a21');gr.addColorStop(1,'#0b0e12');x.fillStyle=gr;x.fillRect(0,0,256,128);
   for(let i=0;i<16;i++){const lx=i*16+1;x.fillStyle=i%2?'#1c242d':'#19212a';x.fillRect(lx,30,14,70);x.fillStyle='rgba(255,255,255,.05)';for(let k=0;k<4;k++)x.fillRect(lx+3,36+k*3,8,1);x.fillStyle=team||'#18324f';x.globalAlpha=.55;x.fillRect(lx,30,14,4);x.globalAlpha=1;}
   const sp=x.createRadialGradient(128,40,4,128,60,120);sp.addColorStop(0,'rgba(255,236,205,.20)');sp.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=sp;x.fillRect(0,0,256,128);tex.needsUpdate=true;}
  paint();
  const back=new T.Mesh(new T.CylinderGeometry(10,10,9,48,1,true),new T.MeshBasicMaterial({map:tex,side:T.BackSide,fog:false}));back.position.y=3.6;g.add(back);
  // Kauçuk zemin: ortada spot ışık lekesi, kenarda koyulaşma.
  const fc=document.createElement('canvas');fc.width=fc.height=256;const fx=fc.getContext('2d'),fg=fx&&fx.createRadialGradient&&fx.createRadialGradient(128,128,8,128,128,128);if(fg){fg.addColorStop(0,'#3a4048');fg.addColorStop(.45,'#1f242a');fg.addColorStop(1,'#0a0c0f');fx.fillStyle=fg;fx.fillRect(0,0,256,256);fx.strokeStyle='rgba(255,255,255,.05)';fx.lineWidth=2;fx.beginPath();fx.arc(128,128,46,0,Math.PI*2);fx.stroke();}
  const ft=new T.CanvasTexture(fc);ft.colorSpace=T.SRGBColorSpace;const floor=new T.Mesh(new T.CircleGeometry(10,48),new T.MeshStandardMaterial({map:ft,roughness:.82,metalness:0}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;g.add(floor);
  // Üç nokta ışık: key (gölgeli spot, 5600K), fill (ambiyans), rim (takım rengi).
  const key=new T.SpotLight(0xfff1df,60,30,.55,.6,1.6);key.position.set(-2.6,6.2,4.2);key.target.position.set(0,1,0);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.near=2;key.shadow.camera.far=14;key.shadow.bias=-.0004;key.shadow.radius=4;g.add(key,key.target);
  const rimL=new T.DirectionalLight(0x9fd0ff,1.6);rimL.position.set(3,4,-5);g.add(rimL);const rimR=new T.DirectionalLight(0xffffff,1.0);rimR.position.set(-3.5,3,-4);g.add(rimR);
  if(renderer.shadowMap){renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;}
  // Prosedürel ortam haritası (IBL): koyu oda + tavanda üç sıcak şerit + takım renginde panel. Harici HDR gerekmez.
  try{const pm=new T.PMREMGenerator(renderer),env=new T.Scene();const room=new T.Mesh(new T.BoxGeometry(12,6,12),new T.MeshBasicMaterial({color:0x0d1015,side:T.BackSide}));env.add(room);
   for(const z of [-3,0,3]){const strip=new T.Mesh(new T.PlaneGeometry(7,.6),new T.MeshBasicMaterial({color:0xfff0dc}));strip.material.color.multiplyScalar(6);strip.position.set(0,2.95,z);strip.rotation.x=Math.PI/2;env.add(strip);}
   const panel=new T.Mesh(new T.PlaneGeometry(4,3),new T.MeshBasicMaterial({color:0x2a5f9e}));panel.position.set(5.9,0,0);panel.rotation.y=-Math.PI/2;env.add(panel);g.userData.envPanel=panel;
   scene.environment=pm.fromScene(env,.04).texture;scene.environmentIntensity=.55;pm.dispose();}catch(err){}
  return {g,key,rimL,rimR,paint,team:''};}
 function release(object){object.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.dispose();if(o.geometry&&!o.geometry.userData.sharedAthlete)o.geometry.dispose();for(const m of [o.material].flat())if(m){for(const v of Object.values(m))if(v?.isTexture&&!v.userData.sharedAthlete)v.dispose();m.dispose();}});scene.remove(object);}
 function addon(parent,geo,color,x,y,z){const o=new T.Mesh(geo,new T.MeshStandardMaterial({color,roughness:.65}));o.position.set(x,y,z);parent.add(o);return o;}
 function build(e){const c=e.colors,m=root.FGAthlete.create(e.team==='away'?'defense':'offense',e.num??12,{jersey:c.jersey,helmet:c.helmet,gloves:c.gloves,cleats:c.cleats}),d=m.userData;
 const parts={};const part=(name,parent,geo,color,x,y,z)=>parts[name]=addon(parent,geo,color,x,y,z);
 part('visor',d.helmet,new T.BoxGeometry(.17,.055,.008),'#141d27',0,.008,.135);
 part('towel',d.pelvis,new T.BoxGeometry(.075,.24,.015),'#fff',-.10,-.12,.13);
 part('backplate',d.torso,new T.BoxGeometry(.18,.10,.015),'#fff',0,.02,-.15);
 part('mouthguard',d.head,new T.BoxGeometry(.042,.016,.012),'#fff',0,-.067,.083);
 for(const [i,x]of [-.046,.046].entries())part('eyeBlack'+i,d.head,new T.BoxGeometry(.028,.008,.005),'#171717',x,-.012,.080);
 d.arms.forEach((a,i)=>{part('wrist'+i,a.userData.elbow,new T.CylinderGeometry(.044,.044,.04,10),'#fff',0,-.24,.004);part('sleeve'+i,a.userData.elbow,new T.CylinderGeometry(.052,.042,.23,12),'#fff',0,-.12,0);});
 part('longHair',d.head,new T.SphereGeometry(1,12,8),'#211b16',0,.015,-.06).scale.set(.09,.10,.065);
 for(let i=0;i<7;i++){const o=part('dread'+i,d.head,new T.CylinderGeometry(.008,.006,.15,6),'#211b16',(i-3)*.024,-.03,-.07);o.rotation.z=(i-3)*.05;}
 part('wristCoach',d.arms[0].userData.elbow,new T.BoxGeometry(.105,.105,.02),'#1b2431',0,-.19,.055);
 part('beard',d.head,new T.SphereGeometry(1,12,8),'#241b16',0,-.07,.035).scale.set(.073,.03,.055);
 d.sockMaterials=[];d.legs.forEach(a=>a.userData.knee.traverse(o=>{if(o.isMesh&&o.material===d.materials[6]&&o.geometry?.type==='BufferGeometry'){o.material=o.material.clone();d.sockMaterials.push(o.material);}}));d.cosmetics=parts;d.baseHair=[];d.head.traverse(o=>{if(o.isMesh&&o.material===d.materials[9])d.baseHair.push({o,y:o.scale.y});});
 applyLook(m,e);if(studio)studioize(m);else if(shadowsOn)m.traverse(x=>{if(x.isMesh)x.castShadow=true;});scene.add(m);return m;}
 // Equip parıltısı: kenar (fresnel) ışıması; nadirlik rengiyle 0→1→0 atım.
 function studioize(m){const u={uGlow:{value:0},uGlowColor:{value:new T.Color('#b7ff4c')}};m.userData.glowU=u;const seen=new Set();
  m.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;for(const mat of [o.material].flat()){if(!mat||seen.has(mat)||!mat.isMeshStandardMaterial)continue;seen.add(mat);
   mat.onBeforeCompile=sh=>{sh.uniforms.uGlow=u.uGlow;sh.uniforms.uGlowColor=u.uGlowColor;sh.fragmentShader='uniform float uGlow;\nuniform vec3 uGlowColor;\n'+sh.fragmentShader.replace('#include <dithering_fragment>','#include <dithering_fragment>\n float fr=pow(1.-abs(dot(normalize(vViewPosition),normal)),2.5);\n gl_FragColor.rgb+=uGlowColor*fr*uGlow*1.6;');};
   mat.customProgramCacheKey=()=>'fg-glow';mat.needsUpdate=true;}});}
 function applyLook(m,e){root.FGAthlete.update(m,e);const d=m.userData,p=d.cosmetics,g=e.gear||{},l=e.look||{};
 d.head.scale.x=l.face==='broad'?1.06:l.face==='angular'?.95:1;d.materials[7].color.set(e.colors.facemask||'#81929d');d.sockMaterials.forEach(mat=>mat.color.set(e.colors.socks||'#e9e6da'));p.wristCoach.visible=!!g.wristCoach;p.wristCoach.material.color.set(g.wristCoach||'#1b2431');
 for(const name of ['visor','towel','backplate','mouthguard']){p[name].visible=!!g[name];if(g[name])p[name].material.color.set(g[name]);}
 for(let i=0;i<2;i++){p['eyeBlack'+i].visible=!!g.eyeBlack;p['wrist'+i].visible=!!(g.wristband||g.tape);p['wrist'+i].material.color.set(g.wristband||g.tape||'#fff');p['sleeve'+i].visible=!!g.sleeve&&(g.sleeveSide==='L'?i===0:i===1);p['sleeve'+i].material.color.set(g.sleeve||'#fff');}
 d.baseHair.forEach(({o,y})=>{o.visible=!['shaved','bald'].includes(l.hair);o.scale.y=l.hair==='fade'?y*.65:y;o.material.color.set(l.hairColor||'#211b16');});
 p.longHair.visible=l.hair==='long';p.longHair.material.color.set(l.hairColor||'#211b16');for(let i=0;i<7;i++){p['dread'+i].visible=l.hair==='dreads';p['dread'+i].material.color.set(l.hairColor||'#211b16');}
 p.beard.visible=!!l.beard&&l.beard!=='none';p.beard.scale.y=l.beard==='full'?.047:.03;p.beard.material.color.set(l.hairColor||'#241b16');
 }
 // Gökyüzü kubbesi: degrade + güneş diski/halesi + ince bulut + gece yıldızları (2D gökyüzünün yerine).
 const skyU={uTop:{value:new T.Color()},uMid:{value:new T.Color()},uHorizon:{value:new T.Color()},uSunDir:{value:new T.Vector3(0,1,0)},uSunColor:{value:new T.Color()},uStars:{value:0}};
 const sky=new T.Mesh(new T.SphereGeometry(360,32,16),new T.ShaderMaterial({uniforms:skyU,side:T.BackSide,depthWrite:false,fog:false,toneMapped:false,
  vertexShader:'varying vec3 vDir;void main(){vDir=position;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}',
  fragmentShader:`uniform vec3 uTop,uMid,uHorizon,uSunDir,uSunColor;uniform float uStars;varying vec3 vDir;
  float h21(vec2 p){return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5453);}
  float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
  void main(){vec3 d=normalize(vDir);float h=d.y;
   vec3 c=mix(uHorizon,uMid,smoothstep(-.02,.16,h));c=mix(c,uTop,smoothstep(.16,.62,h));
   float s=max(dot(d,normalize(uSunDir)),0.);c+=uSunColor*(pow(s,900.)*3.+pow(s,10.)*.3*(1.-uStars));
   vec2 uv=d.xz/(h+.15)*1.6;float cl=vn(uv*1.5)*.6+vn(uv*3.7)*.4;cl=smoothstep(.55,.9,cl)*smoothstep(.02,.25,h)*(1.-uStars*.85);
   c=mix(c,mix(uHorizon,vec3(1.),.45),cl*.35);
   if(uStars>0.){float st=step(.9975,h21(floor(d.xz/(h+.3)*180.)))*smoothstep(.1,.4,h);c+=vec3(st)*uStars*.8;}
   c=mix(uHorizon*.55,c,smoothstep(-.12,0.,h));gl_FragColor=vec4(c,1.);
   #include <colorspace_fragment>
  }`}));
 sky.renderOrder=-1;sky.frustumCulled=false;sky.visible=false;scene.add(sky);scene.add(sun.target);
 const fogObj=new T.Fog('#26374a',90,240),shadowDir=new T.Vector2(.18,0);let shadowsOn=false,lastTime=0,confettiAt=-1,confettiZ=0;
 // Kalite: ayar ya da otomatik (ilk 120 karenin süresine göre düşürülür).
 let autoQ='medium',frames=0,acc=0,lastT=0;
 function pickQuality(){const now=root.performance?performance.now():0;if(lastT){const dt=now-lastT;if(dt<200&&frames<120){frames++;acc+=dt;if(frames===120&&acc/120>28)autoQ='low';}}lastT=now;
  let q='auto';try{q=root.FG_STATE.get().settings.quality||'auto';}catch(e){}return q==='auto'?autoQ:q;}
 function setShadows(on){shadowsOn=on;if(renderer.shadowMap){renderer.shadowMap.enabled=on||!!rig;renderer.shadowMap.type=T.PCFSoftShadowMap;}sun.castShadow=on;if(on){sun.shadow.mapSize.set(2048,2048);const c=sun.shadow.camera;c.left=-30;c.right=30;c.top=30;c.bottom=-30;c.near=1;c.far=180;c.updateProjectionMatrix();sun.shadow.bias=-.0005;}
  models.forEach(o=>o.m.traverse(x=>{if(x.isMesh)x.castShadow=on||!!rig;}));scene.traverse(x=>{if(x.material&&!Array.isArray(x.material))x.material.needsUpdate=true;});}
 let stadium=null,stadiumKey='';const nightColor=new T.Color('#132638'),nightFog=new T.Fog('#26374a',90,240);const groundShadows=new T.InstancedMesh(new T.CircleGeometry(.62,16),new T.MeshBasicMaterial({color:0x132416,transparent:true,opacity:.26,depthWrite:false}),40);groundShadows.rotation.x=-Math.PI/2;scene.add(groundShadows);const shadowTransform=new T.Object3D();
 function pose(m,e){const d=m.userData;root.FGAthlete.pose(m,{speed:e.moving>0.1?5:0,number:e.num,action:({block:'block',stance:'ready',throw:'ready',release:'throw',catch:'catch',reach:'catch',celebrate:'celebrate',tackle:'block'})[e.pose]||'idle',carry:e.pose==='carry'},(e.anim||0)/9,'live');
 m.position.set(e.x,(e.y||0),e.z);m.rotation.set(0,(e.yaw??(e.facing==='down'?Math.PI:0))+Math.PI,0);d.helmet.visible=!e.helmetOff;d.ball.visible=false;
 if(e.look?.stance==='wide')d.legs.forEach((leg,i)=>leg.rotation.z+=(i?1:-1)*.08);if(e.pose==='release'&&e.look?.throwStyle){const arm=d.arms[e.lefty?0:1];if(e.look.throwStyle==='compact'){arm.rotation.x=-1.6;arm.userData.elbow.rotation.x=-.9;}else if(e.look.throwStyle==='overhand')arm.rotation.x=-2.45;}
 if(e.pose==='kick'||e.pose==='punt'){const k=Math.sin(Math.min(1,e.kickT||0)*Math.PI);d.legs[e.lefty?0:1].rotation.x=-1.3*k;d.legs[e.lefty?0:1].userData.knee.rotation.x=.08;d.arms.forEach(a=>a.rotation.z*=4);}
 if(e.pose==='kneel'){d.pelvis.position.y=.70;d.legs[0].rotation.x=-1.1;d.legs[0].userData.knee.rotation.x=1.6;d.legs[1].userData.knee.rotation.x=1.5;}
 if(e.pitch){d.body.rotation.x=e.pitch;d.body.position.y+=.35;}
 if(e.fall){d.body.rotation.z=(e.fallDir||1)*e.fall*1.45;d.body.position.y-=e.fall*.15;}
 if(e.studio){const s=e.studio,k=Math.min(1,(s.gestureT||0)/.6),wave=Math.sin(Math.PI*k);
  d.torso.scale.set(1+Math.sin(s.time*1.7)*.008,1+Math.sin(s.time*1.7)*.014,1);   // nefes
  d.head.rotation.y=Math.max(-.45,Math.min(.45,(s.look?.x||0)*.45));d.head.rotation.x=Math.max(-.2,Math.min(.25,(s.look?.y||0)*.22));  // bakış
  if(s.gesture==='hands'){const a=d.arms[e.lefty?0:1];a.rotation.x=-.4-1.1*wave;a.userData.elbow.rotation.x=-1.2*wave;}
  else if(s.gesture==='feet'){m.position.y+=.07*Math.abs(Math.sin(Math.PI*2*k));}
  else if(s.gesture==='helmet'){d.head.rotation.x+=.22*wave;}
  if(m.userData.glowU){m.userData.glowU.uGlow.value=s.glow||0;m.userData.glowU.uGlowColor.value.set(s.glowColor||'#b7ff4c');}}
 }
 return {ok:true,enhanced:true,stadium:true,debug:()=>({scene,camera,renderer}),mark(x,z){stadium?.userData.mark?.(x,z);},fadeMarks(){stadium?.userData.fadeMarks?.();},confetti(){confettiAt=lastTime;confettiZ=camera.position.z-16;},resize(w,h,d){W=w;H=h;const q=studio?'high':pickQuality();renderer.setPixelRatio(Math.min(d,q==='low'?1:q==='high'?1.5:1.25));renderer.setSize(w,h,false);},render(cam,ents,b,shake,props,opt={}){if(lost)return;
 const quality=pickQuality();
 const sk=opt.stadium?JSON.stringify([opt.stage,opt.home,opt.away,opt.names,quality]):'';
 if(sk&&sk!==stadiumKey){if(stadium)release(stadium);const n=opt.names||{};stadium=root.FG_STADIUM.create(opt.stage||'camp',opt.home,{away:opt.away,homeName:n.home,awayName:n.away,awayShort:n.awayShort,monogram:n.mono,quality});scene.add(stadium);stadiumKey=sk;setShadows(quality==='high');}
 const L=sk&&root.FG_LOOK?root.FG_LOOK.resolve(opt.stage,opt.progress||0):null;lastTime=opt.time||0;
 if(stadium){stadium.visible=!!sk;stadium.userData.update&&stadium.userData.update({time:opt.time,cheer:opt.cheer,ballZ:opt.ballZ,lights:L?L.lights:0,dust:L?L.dust:0,stunt:opt.stunt,losZ:opt.losZ,fdZ:opt.fdZ,confettiAt,confettiZ,px:renderer.getPixelRatio?renderer.getPixelRatio():1});}
 sky.visible=!!L;
 if(L){ // Aşama görünümü: güneş yönü, gökyüzü kubbesi ve gölge yönü aynı vektörden gelir.
  const d=root.FG_LOOK.sunDir(L);ambient.color.set(L.amb.sky);ambient.groundColor.set(L.amb.ground);ambient.intensity=L.amb.int;
  sun.color.set(L.sun.color);sun.intensity=L.sun.int;sun.target.position.set(cam.x,0,cam.z-22);sun.position.set(cam.x+d[0]*70,d[1]*70,cam.z-22+d[2]*70);
  rim.color.set(L.rim.color);rim.intensity=L.rim.int;renderer.toneMappingExposure=L.exposure;
  if(L.fog){fogObj.color.set(L.fog.color);fogObj.near=L.fog.near;fogObj.far=L.fog.far;scene.fog=fogObj;}else scene.fog=null;scene.background=null;
  skyU.uTop.value.set(L.sky[0]);skyU.uMid.value.set(L.sky[1]);skyU.uHorizon.value.set(L.sky[2]);skyU.uSunDir.value.set(d[0],d[1],d[2]);skyU.uSunColor.value.set(L.sun.color);skyU.uStars.value=L.stars;
  shadowDir.set(-d[0],-d[2]).multiplyScalar(Math.min(3.2,.35/Math.max(.08,Math.tan(L.sun.elev*Math.PI/180))));
 }else if(!rig){ambient.intensity=2.3;sun.intensity=2.8;rim.intensity=.7;scene.background=null;scene.fog=null;shadowDir.set(.18,0);}
 groundShadows.visible=!!sk&&!shadowsOn;groundShadows.count=Math.min(40,ents.length);for(let i=0;i<groundShadows.count;i++){shadowTransform.position.set(ents[i].x+shadowDir.x*.55,-(ents[i].z+shadowDir.y*.55),.03);shadowTransform.rotation.z=Math.atan2(-shadowDir.y,shadowDir.x);shadowTransform.scale.set(1+shadowDir.length()*.6,.75,1);shadowTransform.updateMatrix();groundShadows.setMatrixAt(i,shadowTransform.matrix);}groundShadows.instanceMatrix.needsUpdate=true;
 if(rig){ambient.intensity=.35;sun.intensity=0;rim.intensity=0;scene.background=null;scene.fog=null;groundShadows.visible=false;const team=opt.home?.jersey||'';if(team!==rig.team){rig.team=team;rig.paint(team);rig.rimL.color.set(opt.home?.trim||'#9fd0ff');}}
 camera.position.set(cam.x,cam.y,cam.z);camera.rotation.set(-cam.pitch,0,0);sky.position.copy(camera.position);camera.fov=2*Math.atan(H/(2*cam.f))*180/Math.PI;camera.aspect=W/H;camera.updateProjectionMatrix();camera.projectionMatrix.elements[8]=-2*(shake?.x||0)/W;camera.projectionMatrix.elements[9]=2*cam.cy-1+2*(shake?.y||0)/H;camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
 for(let i=0;i<ents.length;i++){const e=ents[i],key=JSON.stringify([e.num,e.colors,e.gear,e.look,e.lefty]);if(!models[i])models[i]={key,m:build(e)};else if(models[i].key!==key){applyLook(models[i].m,e);models[i].key=key;}pose(models[i].m,e);models[i].m.visible=true;}
 for(let i=ents.length;i<models.length;i++)models[i].m.visible=false;
 const key=JSON.stringify((props||[]).map(o=>[o.kind,o.r,o.y]));if(key!==propsKey){for(const o of [...propsGroup.children]){propsGroup.remove(o);release(o);}for(const p of props||[]){let mesh;if(p.kind==='hoop'){mesh=addon(propsGroup,new T.TorusGeometry(p.r,.10,8,24),'#ff732d',0,0,0);}else if(p.kind==='dummy')mesh=addon(propsGroup,new T.CylinderGeometry(.3,.3,1.7,12),'#efc924',0,0,0);else mesh=addon(propsGroup,new T.ConeGeometry(.25,.6,10),'#f57821',0,0,0);mesh.userData.kind=p.kind;}propsKey=key;}
 (props||[]).forEach((p,i)=>{const o=propsGroup.children[i];if(o){o.position.set(p.x,p.kind==='hoop'?p.y:p.kind==='dummy'?.85:.3,p.z);if(p.kind==='hoop')o.material.color.set(p.hit?'#78f065':'#ff732d');}});
 ball.visible=!!b&&!b.hidden;if(ball.visible){ball.position.set(b.x,b.h,b.z);ball.rotation.set(b.rot||0,b.yaw||0,0);}renderer.render(scene,camera);
 },dispose(){models.forEach(o=>release(o.m));release(propsGroup);release(ball);release(groundShadows);if(stadium)release(stadium);renderer.dispose();}};
}
root.FG_GL={create};})(window);
