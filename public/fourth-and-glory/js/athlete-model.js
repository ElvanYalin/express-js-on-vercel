/* Original procedural athlete. Units: metres; front: +Z. */
(function(root){
'use strict';
const T=root.THREE, pi=Math.PI;let lowDetail=false;
const mat=(color,roughness=.7,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
function group(parent,x=0,y=0,z=0){const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g;}
function mesh(parent,geo,material,pos=[0,0,0],scale=[1,1,1]){const m=new T.Mesh(geo,material);m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function ell(parent,material,pos,scale){return mesh(parent,new T.SphereGeometry(1,lowDetail?12:32,lowDetail?8:20),material,pos,scale);}
function tube(parent,pts,r,material){return mesh(parent,new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p))),Math.max(8,pts.length*(lowDetail?3:8)),r,lowDetail?5:8,false),material);}
// Smooth elliptic cross sections, built as a continuous surface with closed ends.
function loft(parent,rings,material,segments=32){
 if(lowDetail)segments=Math.min(segments,14);
 const curves=[0,1,2,3].map(k=>rings.map(r=>r[k]||0));
 function at(k,t){const p=t*(rings.length-1),i=Math.min(rings.length-2,Math.floor(p)),f=p-i,a=curves[k][Math.max(0,i-1)],b=curves[k][i],c=curves[k][i+1],d=curves[k][Math.min(rings.length-1,i+2)];return .5*((2*b)+(-a+c)*f+(2*a-5*b+4*c-d)*f*f+(-a+3*b-3*c+d)*f*f*f);}
 const n=(rings.length-1)*(lowDetail?3:6),vertices=[],uv=[],indices=[];
 for(let j=0;j<=n;j++){const t=j/n,y=at(0,t),rx=at(1,t),rz=at(2,t),cz=at(3,t);for(let i=0;i<=segments;i++){const a=i/segments*2*pi;vertices.push(Math.sin(a)*rx,y,Math.cos(a)*rz+cz);uv.push(i/segments,t);}}
 for(let j=0;j<n;j++)for(let i=0;i<segments;i++){const a=j*(segments+1)+i,b=a+segments+1;indices.push(a,a+1,b,b,a+1,b+1);}
 // Winding reversed when the longitudinal sections descend.
 if(rings.at(-1)[0]<rings[0][0])for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];
 for(const j of [0,n]){const start=vertices.length/3;vertices.push(0,at(0,j/n),at(3,j/n));uv.push(.5,.5);for(let i=0;i<segments;i++){const a=j*(segments+1)+i;const flip=(j===0)===(rings.at(-1)[0]>rings[0][0]);indices.push(start,flip?a+1:a,flip?a:a+1);}}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();return mesh(parent,geo,material);
}
function weave(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle='#8c8c8c';x.fillRect(0,0,128,128);for(let i=0;i<128;i+=4)for(let j=0;j<128;j+=4){x.fillStyle=(i+j)%8?'#b4b4b4':'#666';x.fillRect(i,j,2,3);}const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(9,9);return t;}
function decal(parent,text,pos,size,color='#f5f2e8',rotate=0){const c=document.createElement('canvas');c.width=512;c.height=512;const x=c.getContext('2d');x.textAlign='center';x.textBaseline='middle';x.font='900 360px Arial';x.lineJoin='round';x.strokeStyle='#e5692a';x.lineWidth=22;x.strokeText(text,256,267,450);x.fillStyle=color;x.fillText(text,256,267,450);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const m=mesh(parent,new T.PlaneGeometry(...size),new T.MeshStandardMaterial({map:tex,transparent:true,roughness:.9,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}),pos);m.rotation.y=rotate;return m;}

// Continuous garment surface, smoothly bound across chest and shoulder joints.
function garment(torso,arms,material){
 const smooth=(a,b,k)=>{const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25;};
 const ellD=(x,y,z,cx,cy,rx,ry,rz)=>{const q=Math.sqrt(((x-cx)/rx)**2+((y-cy)/ry)**2+(z/rz)**2);return (q-1)*Math.min(rx,ry,rz);};
 function field(x,y,z){
  const levels=[[-.025,.159,.111],[.075,.169,.119],[.21,.214,.143],[.34,.246,.145],[.408,.214,.125],[.447,.143,.085]];
  let rx=levels[0][1],rz=levels[0][2];for(let i=0;i<levels.length-1;i++){if(y>=levels[i][0]){const f=T.MathUtils.clamp((y-levels[i][0])/(levels[i+1][0]-levels[i][0]),0,1);rx=T.MathUtils.lerp(levels[i][1],levels[i+1][1],f);rz=T.MathUtils.lerp(levels[i][2],levels[i+1][2],f);}}
  // Broad folds pressed by the pads, and short diagonal wrinkles at the waist.
  const a=Math.atan2(x,z),lower=Math.exp(-(((y-.066)/.063)**2)),side=Math.abs(Math.sin(a));
  const fold=.0034*Math.sin(y*114+a*2.7)*lower+.0021*Math.sin(y*72-a*4)*side*Math.exp(-(((y-.22)/.2)**2));
  let d=Math.max((Math.sqrt((x/rx)**2+(z/rz)**2)-1)*.11-fold,y-.447,-.018-y);
  for(const sign of [-1,1]){
   const cap=ellD(x,y,z,sign*.236,.365,.100,.092,.121);
   const sleeve=Math.max((Math.sqrt(((x-sign*.265)/.077)**2+(z/.087)**2)-1)*.077,y-.37,.166-y);
   d=smooth(d,smooth(cap,sleeve,.04),.06);
  }
  // Collar opening.
  return Math.max(d,Math.min(.406-y,.061-Math.sqrt(x*x+z*z)));
 }
 const lo=[-.377,-.026,-.178],hi=[.377,.472,.178],step=lowDetail?.021:.0105,n=lo.map((x,i)=>Math.ceil((hi[i]-x)/step)+1),pos=[],uv=[],index=[],values=new Float32Array(n[0]*n[1]*n[2]),vertices=new Map();
 const id=(x,y,z)=>(x*n[1]+y)*n[2]+z;
 for(let x=0;x<n[0];x++)for(let y=0;y<n[1];y++)for(let z=0;z<n[2];z++)values[id(x,y,z)]=field(lo[0]+x*step,lo[1]+y*step,lo[2]+z*step);
 const offsets=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]],tets=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]];
 function vertex(a,b,va,vb){const f=va/(va-vb),p=a.map((v,i)=>v+(b[i]-v)*f),key=p.map(x=>Math.round(x*1e6)).join(',');if(vertices.has(key))return vertices.get(key);const i=pos.length/3;pos.push(...p);uv.push(.5+Math.atan2(p[0],p[2])/(2*pi),p[1]/.48);vertices.set(key,i);return i;}
 function tri(a,b,c){const pa=new T.Vector3().fromArray(pos,a*3),pb=new T.Vector3().fromArray(pos,b*3),pc=new T.Vector3().fromArray(pos,c*3),normal=pb.clone().sub(pa).cross(pc.clone().sub(pa)),center=pa.clone().add(pb).add(pc).multiplyScalar(1/3),e=.0005;const grad=new T.Vector3(field(center.x+e,center.y,center.z)-field(center.x-e,center.y,center.z),field(center.x,center.y+e,center.z)-field(center.x,center.y-e,center.z),field(center.x,center.y,center.z+e)-field(center.x,center.y,center.z-e));index.push(a,normal.dot(grad)>0?b:c,normal.dot(grad)>0?c:b);}
 for(let x=0;x<n[0]-1;x++)for(let y=0;y<n[1]-1;y++)for(let z=0;z<n[2]-1;z++){
  const v=offsets.map(o=>values[id(x+o[0],y+o[1],z+o[2])]);if(v.every(x=>x>0)||v.every(x=>x<=0))continue;
  const p=offsets.map(o=>[lo[0]+(x+o[0])*step,lo[1]+(y+o[1])*step,lo[2]+(z+o[2])*step]);
  for(const tet of tets){const inside=tet.filter(i=>v[i]<=0),outside=tet.filter(i=>v[i]>0);if(!inside.length||!outside.length)continue;const edge=(a,b)=>vertex(p[a],p[b],v[a],v[b]);if(inside.length===1){tri(...outside.map(j=>edge(inside[0],j)));}else if(inside.length===3){tri(...inside.map(j=>edge(outside[0],j)));}else{const a=edge(inside[0],outside[0]),b=edge(inside[0],outside[1]),c=edge(inside[1],outside[0]),d=edge(inside[1],outside[1]);tri(a,b,c);tri(b,d,c);}}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();
 const si=[],sw=[];for(let i=0;i<pos.length;i+=3){const x=pos[i],y=pos[i+1],w=T.MathUtils.smoothstep(Math.abs(x),.155,.287)*T.MathUtils.smoothstep(y,.1,.24);si.push(0,x<0?1:2,0,0);sw.push(1-w,w,0,0);}
 g.setAttribute('skinIndex',new T.Uint16BufferAttribute(si,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(sw,4));const m=new T.SkinnedMesh(g,material);m.castShadow=m.receiveShadow=true;torso.add(m);torso.parent.parent.updateMatrixWorld(true);m.bind(new T.Skeleton([torso,...arms]));return m;
}
function skinLoft(parent,rings,material,bones,start,end){
 const tmp=loft(parent,rings,material,48),g=tmp.geometry;parent.remove(tmp);const a=g.attributes.position,si=[],sw=[];
 for(let i=0;i<a.count;i++){const w=T.MathUtils.smoothstep(-a.getY(i),start,end);si.push(0,1,0,0);sw.push(1-w,w,0,0);}
 g.setAttribute('skinIndex',new T.Uint16BufferAttribute(si,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(sw,4));const m=new T.SkinnedMesh(g,material);parent.add(m);m.castShadow=m.receiveShadow=true;let r=parent;while(r.parent)r=r.parent;r.updateMatrixWorld(true);m.bind(new T.Skeleton(bones));return m;
}
function clothMap(){const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');x.fillStyle='#eeeeee';x.fillRect(0,0,512,512);for(let y=0;y<512;y+=4)for(let a=0;a<512;a+=4){x.fillStyle=((a*17+y*31)%23)<5?'#b9b9b9':'#dedede';x.fillRect(a,y,1,2);}const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(2,2);return t;}
function create(options={}){
 lowDetail=!!options.lowDetail;
 const model=new T.Group(),pelvis=group(model,0,.99,0),torso=group(pelvis,0,.10,0);
 const navy=mat(0x152841,.85),pants=mat(0x1d3049,.9),seam=mat(0x33465b),skin=mat(0xb67f5a,.64),dark=mat(0x12171e),orange=mat(0xe86b2b,.65),white=mat(0xe9e6da,.6),chrome=mat(0x81929d,.3,.65),shell=mat(0x14253a,.32,.10),black=mat(0x15120e,.8),eye=mat(0x201c17);
 const fabric=clothMap();navy.map=fabric;pants.map=fabric;const woven=weave();navy.bumpMap=woven;navy.bumpScale=.00065;pants.bumpMap=woven;pants.bumpScale=.00045;
 loft(pelvis,[[.10,.155,.107,0],[.035,.184,.118,0],[-.065,.187,.125,-.006],[-.14,.155,.115,-.006]],pants);

 // Small cloth folds wrap the waist instead of separate spherical muscles.

 const collar=tube(torso,[[-.078,.45,.059],[-.055,.426,.10],[0,.388,.144],[.055,.426,.10],[.078,.45,.059]],.012,orange);
 loft(torso,[[.43,.064,.062,0],[.51,.058,.059,0],[.56,.061,.057,0]],skin);
 const head=group(torso,0,.607,0);
 loft(head,[[-.102,.047,.055,.024],[-.077,.073,.066,.018],[-.028,.086,.079,.006],[.04,.087,.083,0],[.09,.074,.072,0],[.115,.04,.035,0]],skin);
 // Shaped face: jaw, cheek, eye sockets, brow, nose and lips.

 for(const s of [-1,1]){ell(head,dark,[s*.034,.022,.076],[.022,.004,.003]);ell(head,white,[s*.034,.010,.076],[.013,.004,.003]);ell(head,eye,[s*.034,.01,.081],[.004,.0035,.002]);ell(head,skin,[s*.082,-.012,0],[.015,.028,.015]);}
 ell(head,skin,[0,-.004,.085],[.011,.023,.010]);ell(head,skin,[0,-.022,.088],[.013,.009,.009]);tube(head,[[-.027,-.054,.080],[0,-.057,.087],[.027,-.054,.080]],.0018,mat(0x794b37));
 ell(head,black,[0,.079,-.017],[.080,.044,.076]);
 const helmet=group(head,0,.017,-.007);
 // Open-front helmet shell with a higher cut over the forehead and low back.
 const verts=[],idx=[],N=64,M=24;
 for(let j=0;j<=M;j++)for(let i=0;i<=N;i++){const a=i/N*2*pi,front=T.MathUtils.smoothstep(Math.cos(a),.05,.6),end=2.04-front*.76,t=.015+(end-.015)*j/M;verts.push(.116*Math.sin(t)*Math.sin(a),.132*Math.cos(t)+.023,.119*Math.sin(t)*Math.cos(a));}
 for(let j=0;j<M;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i,b=a+N+1;idx.push(a,b,a+1,b,b+1,a+1);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setIndex(idx);geo.computeVertexNormals();shell.side=T.DoubleSide;mesh(helmet,geo,shell);
 const stripePts=[];for(let i=0;i<=24;i++){const t=-1.6+i/24*2.65;stripePts.push([0,.023+.133*Math.cos(t),.120*Math.sin(t)]);}tube(helmet,stripePts,.009,orange);
 for(const s of [-1,1]){
  ell(helmet,shell,[s*.106,-.040,-.008],[.021,.052,.074]);ell(helmet,dark,[s*.124,-.040,.003],[.003,.017,.013]);
  for(let k=0;k<3;k++){const vent=ell(helmet,dark,[s*(.049+k*.016),.119-k*.012,.051],[.006,.018,.004]);vent.rotation.z=s*-.35;}
  tube(helmet,[[s*.098,.028,.076],[s*.121,-.025,.115],[s*.101,-.107,.13],[s*.045,-.126,.139]],.005,chrome);
  tube(helmet,[[s*.108,-.016,.063],[s*.12,-.085,.041],[s*.04,-.137,.097]],.005,white);
  ell(helmet,chrome,[s*.105,.025,.078],[.010,.011,.009]);
 }
 for(const y of [-.041,-.088])tube(helmet,[[-.12,y,.108],[-.087,y-.008,.151],[0,y-.011,.168],[.087,y-.008,.151],[.12,y,.108]],.0045,chrome);
 for(const s of [-1,1])tube(helmet,[[s*.071,.027,.098],[s*.069,-.035,.157],[s*.059,-.10,.157]],.004,chrome);
 ell(helmet,white,[0,-.12,.116],[.03,.017,.011]);
 decal(torso,'12',[0,.245,.152],[.245,.255]);decal(torso,'12',[0,.258,-.15],[.255,.26],'#f5f2e8',pi);
 const belt=loft(pelvis,[[.07,.183,.117,0],[.036,.185,.12,0]],dark);mesh(pelvis,new T.BoxGeometry(.041,.029,.012),chrome,[0,.052,.125]);
 const arms=[],legs=[];
 for(const s of [-1,1]){
  const shoulder=group(torso,s*.247,.383,0);arms.push(shoulder);

  tube(shoulder,[[s*-.06,.035,.084],[0,.055,.12],[s*.060,.001,.099]],.0045,orange);
  tube(shoulder,[[-.056,-.205,.053],[0,-.216,.076],[.057,-.205,.052]],.003,orange);

  const elbow=group(shoulder,0,-.285,0);shoulder.userData.elbow=elbow;
  skinLoft(shoulder,[[-.17,.069,.074,0],[-.205,.067,.069,0],[-.266,.052,.056,.002],[-.297,.051,.054,.004],[-.33,.062,.058,.001],[-.41,.054,.052,0],[-.52,.035,.037,0]],skin,[shoulder,elbow],.23,.34);
  loft(elbow,[[-.22,.038,.039,0],[-.255,.038,.039,0]],white);
  const hand=group(elbow,0,-.28,.006);shoulder.userData.hand=hand;
  ell(hand,dark,[0,-.025,0],[.041,.051,.021]);
  for(let f=0;f<4;f++){const x=(f-1.5)*.019,len=[.051,.065,.069,.057][f];tube(hand,[[x,-.052,0],[x,-.074,.006],[x,-.052-len,.016]],.0085,dark);tube(hand,[[x,-.046,.020],[x,-.067,.025]],.002,white);}
  tube(hand,[[s*-.032,-.003,.005],[s*-.052,-.025,.018],[s*-.06,-.046,.020]],.011,dark);
  mesh(hand,new T.BoxGeometry(.026,.027,.002),white,[0,-.026,.022]);
  const hip=group(pelvis,s*.098,-.082,0);legs.push(hip);

  tube(hip,[[-.049,-.065,.099],[-.065,-.16,.089],[-.045,-.239,.079],[.045,-.239,.079],[.065,-.16,.089],[.049,-.065,.099]],.0015,seam);
  tube(hip,[[s*.089,.025,.007],[s*.107,-.065,.005],[s*.087,-.21,.006],[s*.061,-.335,.008]],.009,orange);
  const knee=group(hip,0,-.382,.01);hip.userData.knee=knee;

  skinLoft(hip,[[.075,.093,.101,-.004],[-.025,.107,.112,.004],[-.16,.092,.107,.006],[-.29,.07,.078,.014],[-.38,.058,.064,.017],[-.45,.061,.070,-.004],[-.53,.053,.063,-.009],[-.672,.031,.036,.005],[-.74,.028,.032,.01]],pants,[hip,knee],.32,.445);
  loft(knee,[[-.285,.033,.037,0],[-.36,.032,.034,0]],white);
  const foot=group(knee,0,-.377,.022);hip.userData.foot=foot;
  ell(foot,dark,[0,.007,.022],[.05,.04,.102]);ell(foot,dark,[0,-.018,.024],[.052,.013,.103]);
  for(const xx of [-.032,.032])for(const z of [-.036,.015,.072])mesh(foot,new T.CylinderGeometry(.007,.004,.012,8),chrome,[xx,-.033,z]);
  for(let k=0;k<5;k++)tube(foot,[[-.018,.031,.008+k*.012],[.018,.031,.014+k*.012]],.0024,white);
  tube(foot,[[s*.047,.004,-.02],[s*.050,.006,.028],[s*.036,.005,.078]],.004,orange);
 }
 const shirt=garment(torso,arms,navy);
 const ball=group(model),leather=mat(0x774324,.92);ell(ball,leather,[0,0,0],[.086,.085,.153]);for(let k=-2;k<=2;k++)tube(ball,[[-.022,.083,k*.018],[.022,.083,k*.018]],.0025,white);tube(ball,[[0,.078,-.065],[0,.087,0],[0,.078,.065]],.0025,white);
 model.userData={pelvis,torso,head,helmet,arms,legs,shirt,ball,navy,pants,orange,shell,skin,materials:[navy,pants,seam,skin,dark,orange,white,chrome,shell,black,eye]};
 pose(model,0,'idle');return model;
}
function pose(m,t,mode){const d=m.userData,{pelvis,torso,arms,legs,head,ball}=d;
 pelvis.position.set(0,.99,0);pelvis.rotation.set(0,0,0);torso.rotation.set(0,0,0);head.rotation.set(0,0,0);
 arms.forEach((a,i)=>{a.rotation.set(.05,0,i===0?-.12:.12);a.userData.elbow.rotation.set(-.10,0,0);});legs.forEach(a=>{a.rotation.set(0,0,0);a.userData.knee.rotation.x=.03;a.userData.foot.rotation.x=-.03;});ball.visible=false;
 if(mode==='idle'){torso.scale.y=1+Math.sin(t*1.8)*.004;pelvis.position.x=.023;pelvis.rotation.z=-.025;torso.rotation.z=.038;torso.rotation.y=-.065;head.rotation.y=.085+Math.sin(t*.45)*.035;arms[0].rotation.x=-.10;arms[0].userData.elbow.rotation.x=-.16;arms[1].rotation.x=.085;arms[1].userData.elbow.rotation.x=-.22;legs[0].rotation.z=-.015;legs[1].rotation.z=-.06;legs[1].rotation.x=-.05;legs[1].userData.knee.rotation.x=.10;}
 else torso.scale.y=1;
 if(mode==='apose'){arms[0].rotation.z=-.58;arms[1].rotation.z=.58;}
 if(mode==='run'){
  const p=t*9.3;pelvis.position.y=.99+Math.abs(Math.sin(p))*.035;torso.rotation.x=.13;pelvis.rotation.y=Math.sin(p)*.085;torso.rotation.y=-Math.sin(p)*.11;torso.rotation.z=Math.sin(p)*.025;head.rotation.y=-torso.rotation.y*.5;
  legs.forEach((l,i)=>{const q=p+i*pi;l.rotation.x=Math.sin(q)*.68;l.userData.knee.rotation.x=.20+Math.max(0,-Math.cos(q))*.99;l.userData.foot.rotation.x=-.20;});
  arms.forEach((a,i)=>{a.rotation.x=-Math.sin(p+i*pi)*.65-.2;a.userData.elbow.rotation.x=-1.28;});
 }
 if(mode==='throw'){
  const p=t%3.4,wind=T.MathUtils.smoothstep(p,.35,1.1),release=T.MathUtils.smoothstep(p,1.1,1.45),recover=T.MathUtils.smoothstep(p,2.4,3.4),strength=1-recover;
  torso.rotation.y=(-.7*wind+1.1*release)*strength;torso.rotation.x=.09*release*strength;
  arms[1].rotation.set((-1.05-1.25*wind+1.15*release)*strength,(-.35*wind)*strength,(.3+1.05*wind-.8*release)*strength);
  arms[1].userData.elbow.rotation.x=(-1.45-.40*wind+1.65*release)*strength;
  arms[0].rotation.x=(-.9+.65*release)*strength;arms[0].userData.elbow.rotation.x=-1.2*strength;
  legs[0].rotation.x=-.22*strength;legs[1].rotation.x=.25*strength;legs[0].userData.knee.rotation.x=.15;legs[1].userData.knee.rotation.x=.32;
  head.rotation.y=-torso.rotation.y*.7;
  m.updateMatrixWorld(true);ball.visible=p<2.25;
  const hand=arms[1].userData.hand,point=new T.Vector3(0,-.06,.036);hand.localToWorld(point);m.worldToLocal(point);ball.position.copy(point);ball.rotation.set(.25,0,pi/2);
  if(p>1.38){const f=(p-1.38)*3.3;ball.position.set(.18-f*.18,1.71+f*.42-f*f*.095,.24+f*1.8);ball.rotation.z=t*18;}
 }
}
root.AthleteLab={create,pose};
})(typeof window==='undefined'?globalThis:window);
