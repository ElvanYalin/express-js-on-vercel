/* Procedural stadium: one camera and world scale for turf, stands and athletes.
   v0.8: static boxes are batched per colour into InstancedMesh (draw calls ~ colour count),
   crowd/bench animate per instance in the vertex shader and react to play events,
   college stage is a horseshoe bowl with an open end onto campus. */
(function(root){const T=root.THREE;
 const unit=()=>new T.BoxGeometry(1,1,1);
 function canvasTex(w,h,draw){const cv=document.createElement('canvas');cv.width=w;cv.height=h;const x=cv.getContext('2d');if(x&&x.fillRect)draw(x,w,h);const t=new T.CanvasTexture(cv);t.colorSpace=T.SRGBColorSpace;t.userData.ctx=x;t.userData.canvas=cv;return t;}
 function create(stage,home,extra={}){
 const g=new T.Group();g.name='stadium-'+stage;const mats=new Map(),batches=new Map(),tmp=new T.Object3D();
 const away=extra.away||{jersey:'#5d6770',trim:'#ffffff'},Q=extra.quality||'medium',college=stage==='college',pro=stage==='pro';
 const material=c=>{if(!mats.has(c))mats.set(c,new T.MeshStandardMaterial({color:c,roughness:.92}));return mats.get(c);};
 // Statik kutular: renge göre biriktirilir, flush() ile tek InstancedMesh olur.
 function box(x,y,z,w,h,d,c){(batches.get(c)||batches.set(c,[]).get(c)).push([x,y,z,w,h,d]);}
 function flush(){const geo=unit();for(const [c,list] of batches){const im=new T.InstancedMesh(geo,material(c),list.length);list.forEach(([x,y,z,w,h,d],i)=>{tmp.position.set(x,y,z);tmp.scale.set(w,h,d);tmp.rotation.set(0,0,0);tmp.updateMatrix();im.setMatrixAt(i,tmp.matrix);});im.computeBoundingSphere();im.userData.batch=c;g.add(im);}batches.clear();}
 let seed=41;const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};

 // ---------- saha dokusu ----------
 const cv=document.createElement('canvas');cv.width=1024;cv.height=2048;const ctx=cv.getContext('2d');
 ctx.fillStyle='#3d7740';ctx.fillRect(0,0,1024,2048);for(let i=0;i<24;i++){ctx.fillStyle=i%2?'#478547':'#3d7d40';ctx.fillRect(0,i*2048/24,1024,2048/24);}
 for(let i=0;i<40000;i++){ctx.fillStyle=random()>.5?'rgba(199,224,131,.09)':'rgba(8,40,13,.10)';ctx.fillRect(random()*1024,random()*2048,1,2);}
 const sy=2048/120,sx=1024/53.34;
 // Uzak end zone (rakibin savunduğu) rakip renginde, yakın end zone ev sahibi renginde: 2D yedek çiziciyle tutarlı.
 ctx.fillStyle=college?away.jersey:home.jersey;ctx.fillRect(0,0,1024,10*sy);ctx.fillStyle=home.jersey;ctx.fillRect(0,110*sy,1024,10*sy);
 ctx.strokeStyle='#edf1dc';ctx.lineWidth=4;ctx.strokeRect(3,3,1018,2042);
 for(let yard=0;yard<=100;yard+=5){const y=(yard+10)*sy;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1024,y);ctx.stroke();}
 ctx.lineWidth=2;for(let yard=1;yard<100;yard++){const y=(yard+10)*sy;for(const x of [1,20,32.3,51.3]){ctx.beginPath();ctx.moveTo(x*sx,y);ctx.lineTo((x+1)*sx,y);ctx.stroke();}}
 ctx.fillStyle='#eff2df';ctx.font='bold 62px Arial';ctx.textAlign='center';ctx.textBaseline='middle';
 for(let yard=10;yard<100;yard+=10){const n=yard<=50?yard:100-yard;for(const side of [1,-1]){ctx.save();ctx.translate(side===1?110:914,(yard+10)*sy);ctx.rotate(side*Math.PI/2);ctx.fillText(n,0,0);ctx.restore();}}
 const farText=college?String(extra.awayName||'VISITORS').toUpperCase():stage==='camp'?'GLORY CAMP':stage==='combine'?'QB COMBINE':'FOURTH & GLORY';
 const nearText=college?String(extra.homeName||'COLLEGE').toUpperCase():'ROAD TO GLORY';
 const fit=(t,max)=>{let s=78;ctx.font=`900 ${s}px Arial`;while(((ctx.measureText&&ctx.measureText(t))||{}).width>max&&s>30){s-=4;ctx.font=`900 ${s}px Arial`;}};
 fit(farText,940);ctx.fillStyle=college?away.trim:home.trim;ctx.fillText(farText,512,5*sy);fit(nearText,940);ctx.fillStyle=home.trim;ctx.fillText(nearText,512,115*sy);
 // Orta saha: kolejde seçilen okulun monogramı.
 const mono=college?String(extra.monogram||'4G'):'4G';ctx.save();ctx.globalAlpha=college?.55:.32;if(college){ctx.fillStyle=home.jersey;ctx.beginPath();ctx.arc(512,1024,128,0,Math.PI*2);ctx.fill();ctx.strokeStyle=home.trim;ctx.lineWidth=10;ctx.stroke();}
 ctx.font='900 115px Arial';ctx.fillStyle=home.trim;ctx.fillText(mono,512,1028);ctx.restore();
 const texture=new T.CanvasTexture(cv);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
 // Çim: kamera açısına bağlı biçme şeridi parlaması + yakın mesafede ince doku.
 const turf=new T.MeshStandardMaterial({map:texture,roughness:1});const turfU={uSheen:{value:college?.10:pro?.06:.08}};
 turf.onBeforeCompile=sh=>{sh.uniforms.uSheen=turfU.uSheen;sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vFgWorld;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvFgWorld=(modelMatrix*vec4(transformed,1.)).xyz;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vFgWorld;uniform float uSheen;float fgHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}')
  .replace('#include <map_fragment>',`#include <map_fragment>
   float stripe=step(.5,fract((vFgWorld.z+60.)/10.));vec3 vd=normalize(cameraPosition-vFgWorld);
   float sheen=(stripe*2.-1.)*vd.z*uSheen;float dist=length(cameraPosition-vFgWorld);
   float grain=(fgHash(floor(vFgWorld.xz*14.))-.5)*.08*(1.-smoothstep(6.,18.,dist));
   diffuseColor.rgb*=1.+sheen+grain;`);};
 turf.customProgramCacheKey=()=>'fg-turf';
 const field=new T.Mesh(new T.PlaneGeometry(53.34,120),turf);field.rotation.x=-Math.PI/2;field.position.y=.015;field.receiveShadow=true;g.add(field);g.userData.field=field;
 // Çim izleri (sack/tackle): ayrı şeffaf katman, her play'de solar.
 const marks=canvasTex(256,576,(x,w,h)=>x.clearRect(0,0,w,h));const markPlane=new T.Mesh(new T.PlaneGeometry(53.34,120),new T.MeshBasicMaterial({map:marks,transparent:true,depthWrite:false}));markPlane.rotation.x=-Math.PI/2;markPlane.position.y=.03;g.add(markPlane);
 g.userData.mark=(x,z)=>{const c=marks.userData.ctx;if(!c||!c.createRadialGradient)return;const u=(x/53.34+.5)*256,v=(z/120+.5)*576;for(let i=0;i<5;i++){const r=4+random()*5,gr=c.createRadialGradient(u+(random()-.5)*8,v+(random()-.5)*8,0,u,v,r);if(!gr)return;gr.addColorStop(0,'rgba(74,56,30,.55)');gr.addColorStop(1,'rgba(74,56,30,0)');c.fillStyle=gr;c.fillRect(u-r-5,v-r-5,2*r+10,2*r+10);}marks.needsUpdate=true;};
 g.userData.fadeMarks=()=>{const c=marks.userData.ctx;if(!c||!c.fillRect)return;c.save();c.globalCompositeOperation='destination-out';c.fillStyle='rgba(0,0,0,.35)';c.fillRect(0,0,256,576);c.restore();marks.needsUpdate=true;};

 box(0,-.12,0,160,.2,240,college?'#4c6a3f':'#456947');box(0,-.03,0,62,.05,130,college?'#cdbf9f':'#d1cfbc');
 for(const x of [-26.4,26.4])for(const z of [-50,50])box(x,.28,z,.18,.56,.18,'#ff671e');
 for(const z of [-60,60]){box(0,1.65,z,0.17,3.3,.17,'#efc23b');box(0,3.33,z,6.2,.16,.16,'#efc23b');for(const x of [-3.08,3.08])box(x,6.1,z,.14,5.6,.14,'#f6d44a');box(0,.8,z,.48,1.6,.48,home.jersey);}

 // ---------- tribünler ----------
 const rows=pro?18:college?14:4,length=pro?140:college?118:66,seatA=college?'#8f877a':'#74838d',seatB=college?'#a89f90':'#9ba9ad';
 for(const side of [-1,1]){box(side*30,1,0,.4,2,130,home.jersey);for(let r=0;r<rows;r++){const x=side*(34+r*1.05),y=1+r*.62;box(x,y,0,1.15,.5,length,r%2?seatA:seatB);}if(pro)box(side*44,15,0,27,.35,150,'#b4bec4');
  if(college){box(side*(34+rows*1.05+1.2),rows*.62/2+1,0,1.4,rows*.62+2,length+4,'#8c4a35');for(let k=0;k<12;k++)box(side*(34+rows*1.05+.45),rows*.62+1.6,-length/2+5+k*(length-10)/11,.4,.9,1.8,'#e8dcc0');}}
 // Kolej: at nalı. Kapalı uç kameranın arkasında (+z), uzak uç (−z) kampüse açık. Pro: iki uç kapalı.
 const ends=pro?[-1,1]:college?[1]:[];const endRows=college?12:rows;
 for(const side of ends)for(let r=0;r<endRows;r++)box(0,1+r*.62,side*(70+r*1.05),68+r*1.5,.5,1.15,r%2?seatA:seatB);

 // ---------- seyirci: instance başına faz + olay tepkisi (vertex shader) ----------
 const U={uTime:{value:0},uCheer:{value:0},uBallZ:{value:0},uStunt:{value:0},uStuntA:{value:new T.Color(home.jersey)},uStuntB:{value:new T.Color(home.trim)}};
 function crowdMaterial(){const m=new T.MeshLambertMaterial({color:'#ffffff'});m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float aPhase;attribute float aStudent;uniform float uTime,uCheer,uBallZ;varying float vStudent;varying float vStuntX;')
  .replace('#include <begin_vertex>',`#include <begin_vertex>
   float ph=aPhase*6.2831;vec4 ip=instanceMatrix*vec4(0.,0.,0.,1.);
   float nearBall=1.-smoothstep(10.,45.,abs(ip.z-uBallZ));
   float excite=clamp(uCheer*(.45+.55*nearBall)+aStudent*.3,0.,1.);
   float stand=step(.35,fract(aPhase*7.31))*excite;
   transformed.y+=max(0.,sin(uTime*(2.2+excite*6.)+ph))*(.025+excite*.2)+stand*.14;
   vStudent=aStudent;vStuntX=ip.z+ip.y*3.;`);
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uTime,uStunt;uniform vec3 uStuntA,uStuntB;varying float vStudent;varying float vStuntX;')
  .replace('#include <color_fragment>',`#include <color_fragment>
   float wave=step(.5,fract(vStuntX*.06-uTime*.35));diffuseColor.rgb=mix(diffuseColor.rgb,mix(uStuntA,uStuntB,wave),vStudent*uStunt);`);};
  m.customProgramCacheKey=()=>'fg-crowd';return m;}
 const density=Q==='low'?.55:1;
 const count=Math.round(rows*(pro?190:college?140:30)*density),crowd=new T.InstancedMesh(new T.BoxGeometry(.42,.64,.35),crowdMaterial(),count),color=new T.Color();
 const phase=new Float32Array(count),student=new Float32Array(count);
 for(let i=0;i<count;i++){const r=i%rows,side=i%2?1:-1;let x=side*(34+r*1.05),z=(random()-.5)*length;
  if(i%3===0&&rows>4&&ends.length){const es=ends[Math.floor(random()*ends.length)];x=(random()-.5)*(64+r);z=es*(70+Math.min(r,endRows-1)*1.05);}
  tmp.position.set(x,1.65+Math.min(r,rows-1)*.62,z);tmp.scale.set(1,1,1);tmp.updateMatrix();crowd.setMatrixAt(i,tmp.matrix);
  const isStudent=college&&side===1&&Math.abs(z)<24&&x>0;student[i]=isStudent?1:0;phase[i]=random();
  color.set(isStudent?(i%2?home.jersey:home.trim):[home.jersey,home.trim,'#d1d6d7','#314152','#765847'][i%5]);crowd.setColorAt(i,color);}
 crowd.geometry.setAttribute('aPhase',new T.InstancedBufferAttribute(phase,1));crowd.geometry.setAttribute('aStudent',new T.InstancedBufferAttribute(student,1));g.add(crowd);g.userData.crowd=crowd;

 // ---------- kampüs / tesis / skorbord ----------
 if(stage==='camp'||stage==='combine'){box(-24,4,-82,24,8,12,'#b4b6ae');box(-24,5,-75.8,21,4,.1,'#38596a');box(-24,8.3,-82,27,.5,14,'#3e4852');for(let i=0;i<9;i++){box(31,.28,-35+i*8,1.6,.56,3.2,'#e3be29');}}
 const windows=[];
 if(college){
  // Açık uçtan görünen kampüs: tuğla binalar, saat kulesi, ağaçlar. Pencereler akşam yanar.
  const brick=['#8c4a35','#7a3f2e','#94573f'];
  for(let i=0;i<7;i++){const x=-70+i*23+(random()-.5)*6,z=-112-random()*18,w=14+random()*8,h=8+random()*7,d=10;box(x,h/2,z,w,h,d,brick[i%3]);box(x,h+.4,z,w+1,.8,d+1,'#5b3a2c');
   for(let fx=0;fx<Math.floor(w/3);fx++)for(let fy=0;fy<Math.floor(h/3.2);fy++)windows.push([x-w/2+1.8+fx*3,2+fy*3.2,z+d/2+.06]);}
  box(4,14,-106,7,28,7,'#a05a40');box(4,28.6,-106,8,1.2,8,'#e8dcc0');const roof=new T.Mesh(new T.ConeGeometry(5.6,8,4),material('#3d4a52'));roof.position.set(4,33.2,-106);roof.rotation.y=Math.PI/4;g.add(roof);
  const clock=new T.Mesh(new T.CircleGeometry(2.2,24),new T.MeshStandardMaterial({color:'#f4ead2',emissive:'#ffe7b0',emissiveIntensity:.15}));clock.position.set(4,22,-102.45);g.add(clock);g.userData.clock=clock;
  for(let i=0;i<22;i++){const x=-90+random()*180,z=-96-random()*30;if(Math.abs(x-4)<8)continue;const tr=new T.Mesh(new T.ConeGeometry(2+random()*1.5,6+random()*4,7),material(i%2?'#2f4a2c':'#3a5531'));tr.position.set(x,4,z);g.add(tr);box(x,.9,z,.5,1.8,.5,'#4a3524');}
  // Bando: end zone arkasında 6×8 blok, okul renklerinde; enstrümanlar parlak.
  for(let r=0;r<6;r++)for(let c=0;c<8;c++){const x=-10.5+c*3,z=-64.5-r*1.4;box(x,.85,z,.5,.9,.36,r%2?home.jersey:home.trim);box(x,1.5,z,.28,.3,.28,'#d2ae91');box(x+.25,1.25,z-.2,.18,.18,.5,'#e9c46a');}
 }
 const winMat=new T.MeshStandardMaterial({color:'#3b2a1c',emissive:'#ffcf88',emissiveIntensity:0});
 if(windows.length){const im=new T.InstancedMesh(unit(),winMat,windows.length);windows.forEach(([x,y,z],i)=>{tmp.position.set(x,y,z);tmp.scale.set(1.2,1.6,.08);tmp.updateMatrix();im.setMatrixAt(i,tmp.matrix);});g.add(im);}
 const boardZ=college?-74:-85;
 box(0,12,boardZ,22,8,.8,'#102238');const board=canvasTex(512,192,(bc)=>{bc.fillStyle='#102238';bc.fillRect(0,0,512,192);bc.fillStyle='#edf7fb';bc.textAlign='center';bc.font='bold 34px Arial';bc.fillText(college?String(extra.homeName||'FOURTH & GLORY').toUpperCase().slice(0,22):'FOURTH & GLORY',256,68);bc.fillStyle=home.trim;bc.font='24px Arial';bc.fillText(stage==='camp'?'TRAINING CAMP':college?'HOMECOMING · GAME DAY':stage==='combine'?'QB COMBINE':'GLORY BOWL',256,120);});
 const screen=new T.Mesh(new T.PlaneGeometry(21,7),new T.MeshBasicMaterial({map:board}));screen.position.set(0,12,boardZ+.45);g.add(screen);box(-8,5,boardZ,.4,10,.4,'#747e85');box(8,5,boardZ,.4,10,.4,'#747e85');
 // Pankartlar (kolej): tribün önü duvarında, sahaya bakar.
 if(college){const texts=['HOMECOMING',String(extra.homeName||'').toUpperCase(),'WELCOME FRESHMEN',`BEAT ${String(extra.awayShort||'THEM').toUpperCase()}`];
  texts.forEach((t,i)=>{const tex=canvasTex(512,96,(x)=>{x.fillStyle=i%2?home.trim:home.jersey;x.fillRect(0,0,512,96);x.fillStyle=i%2?home.jersey:home.trim;x.font='900 54px Arial';x.textAlign='center';x.textBaseline='middle';x.fillText(t.slice(0,18),256,50);});
   const side=i<2?-1:1,b=new T.Mesh(new T.PlaneGeometry(11,2),new T.MeshStandardMaterial({map:tex,roughness:.8}));b.position.set(side*29.75,1.4,i%2?16:-16);b.rotation.y=side*Math.PI/2*-1;g.add(b);});}

 // ---------- ışık direkleri: kafa emissive, akşam/gece yanar; parlama sprite'ı ----------
 const headMat=new T.MeshStandardMaterial({color:'#e1e6e3',emissive:'#fff6e0',emissiveIntensity:0});const glareTex=canvasTex(64,64,(x)=>{const gr=x.createRadialGradient(32,32,0,32,32,32);if(!gr)return;gr.addColorStop(0,'rgba(255,248,230,1)');gr.addColorStop(.25,'rgba(255,240,210,.55)');gr.addColorStop(1,'rgba(255,240,210,0)');x.fillStyle=gr;x.fillRect(0,0,64,64);});
 const glares=[];
 for(const x of [-40,40])for(const z of [-58,58]){box(x,12,z,.35,24,.35,'#71858f');const head=new T.Mesh(unit(),headMat);head.position.set(x,24,z);head.scale.set(7,1.5,1);g.add(head);
  if(Q!=='low'){const s=new T.Sprite(new T.SpriteMaterial({map:glareTex,color:'#fff4dc',transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending,fog:false}));s.position.set(x,24,z+(z<0?.8:-.8));s.scale.set(11,6,1);g.add(s);glares.push(s);}}

 // ---------- sideline: bench, ekipman, görevliler, tünel ----------
 for(const side of [-1,1]){for(const z of [-12,0,12]){box(side*29,.6,z,.85,.15,7,'#c3cbd0');box(side*29,.27,z,.12,.6,6,'#526477');box(side*31,.5,z+3,1,1,.7,'#ef782c');}}
 // Bench oyuncuları kalabalıkla aynı shader'ı kullanır: TD/INT'de zıplar.
 const benchN=24,bench=new T.InstancedMesh(new T.BoxGeometry(.48,1.1,.34),crowdMaterial(),benchN),bp=new Float32Array(benchN),bs=new Float32Array(benchN);
 for(let i=0;i<benchN;i++){const side=i<12?-1:1,k=i%12,x=side*(28.6+(k%2)*1.5),z=-27+k*4.5;tmp.position.set(x,1.05,z);tmp.updateMatrix();bench.setMatrixAt(i,tmp.matrix);color.set(side<0?(k%4?home.jersey:'#20303c'):(k%4?away.jersey:'#20303c'));bench.setColorAt(i,color);bp[i]=random();bs[i]=0;}
 bench.geometry.setAttribute('aPhase',new T.InstancedBufferAttribute(bp,1));bench.geometry.setAttribute('aStudent',new T.InstancedBufferAttribute(bs,1));g.add(bench);
 for(const x of [-27.7,27.7]){box(x,1,36,.45,.7,.3,'#f2f2e9');for(let i=0;i<4;i++)box(x-.2+i*.13,1,36.16,.05,.7,.025,'#171d24');box(x,1.5,36,.25,.3,.24,'#b38365');box(x,.4,36,.4,.7,.28,'#19222a');}
 for(const x of [-33,33]){box(x,1.8,22,.6,.4,.5,'#14202a');for(const dx of [-.25,.25])box(x+dx,.8,22,.06,1.8,.06,'#657581');}
 box(22,2.3,-74,11,4.6,10,'#1c2935');box(22,2,-68.9,7,4,.1,'#090e14');box(22,4.7,-69,12,.4,1,home.trim);
 for(const side of [-1,1])for(let i=0;i<7;i++){box(side*30,1,-48+i*16,.15,1.15,13,i%2?home.jersey:'#17394c');box(side*29.9,1.05,-48+i*16,.02,.1,11,home.trim);}

 // ---------- zincir ekibi: LOS ve first-down çizgisini takip eder ----------
 const chain=new T.Group();const pole=new T.CylinderGeometry(.04,.04,1.9,6),poleMat=material('#ff7a1c'),crewMat=material('#1b1b1b'),stripe=material('#f2f2f2');
 const crew=[0,1,2].map(i=>{const p=new T.Group(),m=new T.Mesh(pole,poleMat);m.position.y=.95;p.add(m);const flag=new T.Mesh(unit(),poleMat);flag.scale.set(.05,.35,.5);flag.position.set(0,1.85,0);p.add(flag);
  const body=new T.Mesh(unit(),i%2?stripe:crewMat);body.scale.set(.45,.8,.3);body.position.set(-.35,.9,0);p.add(body);const head=new T.Mesh(unit(),material('#c79a7a'));head.scale.set(.24,.26,.24);head.position.set(-.35,1.45,0);p.add(head);p.position.x=-27.9;chain.add(p);return p;});
 g.add(chain);

 // ---------- parçacıklar: gece flaşları, altın saat tozu, konfeti ----------
 const pts=(n,fill,mat)=>{const geo=new T.BufferGeometry();const pos=new Float32Array(n*3),seedA=new Float32Array(n),col=new Float32Array(n*3);fill(pos,seedA,col);geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setAttribute('aSeed',new T.BufferAttribute(seedA,1));geo.setAttribute('color',new T.BufferAttribute(col,3));const p=new T.Points(geo,mat);p.frustumCulled=false;g.add(p);return p;};
 const PU={uTime:{value:0},uFlash:{value:0},uDust:{value:0},uConf:{value:-1},uConfZ:{value:0},uPx:{value:1}};
 const pointMat=(vs,fs,blend)=>new T.ShaderMaterial({uniforms:PU,vertexShader:vs,fragmentShader:fs,transparent:true,depthWrite:false,blending:blend||T.AdditiveBlending,vertexColors:true});
 if(pro&&Q!=='low')pts(360,(p,s)=>{for(let i=0;i<360;i++){const side=i%2?1:-1,r=Math.floor(random()*rows);p.set([side*(34+r*1.05),1.9+r*.62,(random()-.5)*length],i*3);s[i]=random();}},pointMat(
  'attribute float aSeed;uniform float uTime,uFlash,uPx;varying float vA;void main(){float k=floor(uTime*9.+aSeed*97.);float on=step(.985-uFlash*.03,fract(sin(k*12.9898+aSeed*78.233)*43758.5453));vA=on*uFlash;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=uPx*(6.+on*14.)*(30./-mv.z);gl_Position=projectionMatrix*mv;}',
  'varying float vA;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(1.,.98,.92,vA*(1.-d*2.));}'));
 if(college&&Q!=='low')pts(260,(p,s)=>{for(let i=0;i<260;i++){p.set([(random()-.5)*60,.5+random()*7,(random()-.5)*110],i*3);s[i]=random();}},pointMat(
  'attribute float aSeed;uniform float uTime,uDust,uPx;varying float vA;void main(){vec3 q=position;q.x+=sin(uTime*.3+aSeed*20.)*1.5;q.y+=sin(uTime*.5+aSeed*9.)*.4;q.z+=uTime*.4*(aSeed-.5);vec4 mv=modelViewMatrix*vec4(q,1.);vA=uDust*(.35+.65*fract(aSeed*13.));gl_PointSize=uPx*2.2*(30./-mv.z);gl_Position=projectionMatrix*mv;}',
  'varying float vA;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(1.,.86,.62,vA*.5*(1.-d*2.));}'));
 const confN=Q==='low'?250:Q==='high'?800:500,cHome=new T.Color(home.jersey),cTrim=new T.Color(home.trim),cGold=new T.Color('#ffd65c');
 const confetti=pts(confN,(p,s,c)=>{for(let i=0;i<confN;i++){p.set([(random()-.5)*26,(random())*7,(random()-.5)*40],i*3);s[i]=random();const k=[cHome,cTrim,cGold,new T.Color('#ffffff')][i%4];c.set([k.r,k.g,k.b],i*3);}},pointMat(
  'attribute float aSeed;uniform float uTime,uConf,uConfZ,uPx;varying vec3 vC;varying float vA;void main(){float t=uTime-uConf;vec3 q=position;q.z=position.z*.5+uConfZ;float on=step(0.,uConf)*step(0.,t)*(1.-smoothstep(9.,11.,t));q.x*=1.+t*.08;q.y=12.+position.y-.9*t-.25*min(t*t,9.);q.x+=sin(t*2.+aSeed*30.)*1.2;q.z+=cos(t*1.7+aSeed*21.)*1.2;vC=color;vA=on*smoothstep(.5,3.,q.y);vec4 mv=modelViewMatrix*vec4(q,1.);float flick=.55+.45*abs(sin(t*6.+aSeed*40.));gl_PointSize=vA>0.?uPx*min(14.,4.*(30./-mv.z))*flick:0.;gl_Position=vA>0.?projectionMatrix*mv:vec4(2.,2.,2.,1.);}',
  'varying vec3 vC;varying float vA;void main(){vec2 d=abs(gl_PointCoord-.5);if(d.y>.32)discard;gl_FragColor=vec4(vC*1.15,vA);}',T.NormalBlending));

 flush();
 // Her kare çağrılır: zaman, coşku, top konumu, aşama ilerlemesi, zincir, ışıklar.
 g.userData.update=(o={})=>{const t=o.time||0;U.uTime.value=t;PU.uTime.value=t;U.uCheer.value=Math.min(1,o.cheer||0);U.uBallZ.value=o.ballZ??0;
  U.uStunt.value+=((o.stunt?1:0)-U.uStunt.value)*.05;const lights=o.lights||0;headMat.emissiveIntensity+=(lights*2.2-headMat.emissiveIntensity)*.05;winMat.emissiveIntensity+=(lights*1.4+(college?.15:0)-winMat.emissiveIntensity)*.03;
  glares.forEach(s=>s.material.opacity=Math.min(1,headMat.emissiveIntensity/2.2)*(pro?.9:.75));PU.uFlash.value=pro?Math.min(1,.25+(o.cheer||0)):0;PU.uDust.value=o.dust||0;PU.uPx.value=o.px||1;
  if(o.confettiAt!=null)PU.uConf.value=o.confettiAt;confetti.visible=PU.uConf.value>=0&&t-PU.uConf.value<11;if(o.confettiZ!=null)PU.uConfZ.value=o.confettiZ;
  if(o.losZ!=null){crew[0].position.z=o.losZ;crew[1].position.z=o.fdZ??o.losZ-10;crew[2].position.z=o.losZ;crew[2].position.x=-28.6;chain.visible=true;}else chain.visible=false;};
 g.userData.update({});
 return g;
 }
 root.FG_STADIUM={create};
})(window);
