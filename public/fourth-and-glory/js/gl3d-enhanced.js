/* Continuous skinned athlete adapter. Retains the original renderer as fallback. */
(function(root){'use strict';const T=root.THREE,legacy=root.FG_GL;
function create(canvas){if(!T||!root.FGAthlete)return legacy.create(canvas);let renderer;try{renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});}catch{return legacy.create(canvas);}
 renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(45,1,.25,400);const ambient=new T.HemisphereLight(0xe7f3ff,0x41533b,2.3);scene.add(ambient);const sun=new T.DirectionalLight(0xfff0d9,2.8);sun.position.set(-20,35,20);scene.add(sun);const rim=new T.DirectionalLight(0xb0dbff,.7);rim.position.set(15,18,-30);scene.add(rim);
 const models=[],propsGroup=new T.Group();scene.add(propsGroup);let W=1,H=1,propsKey='';const ball=new T.Mesh(new T.SphereGeometry(1,14,10),new T.MeshStandardMaterial({color:0x8a4422,roughness:.7}));ball.scale.set(.10,.10,.18);scene.add(ball);
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
 applyLook(m,e);scene.add(m);return m;}
 function applyLook(m,e){root.FGAthlete.update(m,e);const d=m.userData,p=d.cosmetics,g=e.gear||{},l=e.look||{};
 d.head.scale.x=l.face==='broad'?1.06:l.face==='angular'?.95:1;d.materials[7].color.set(e.colors.facemask||'#81929d');d.sockMaterials.forEach(mat=>mat.color.set(e.colors.socks||'#e9e6da'));p.wristCoach.visible=!!g.wristCoach;p.wristCoach.material.color.set(g.wristCoach||'#1b2431');
 for(const name of ['visor','towel','backplate','mouthguard']){p[name].visible=!!g[name];if(g[name])p[name].material.color.set(g[name]);}
 for(let i=0;i<2;i++){p['eyeBlack'+i].visible=!!g.eyeBlack;p['wrist'+i].visible=!!(g.wristband||g.tape);p['wrist'+i].material.color.set(g.wristband||g.tape||'#fff');p['sleeve'+i].visible=!!g.sleeve&&(g.sleeveSide==='L'?i===0:i===1);p['sleeve'+i].material.color.set(g.sleeve||'#fff');}
 d.baseHair.forEach(({o,y})=>{o.visible=!['shaved','bald'].includes(l.hair);o.scale.y=l.hair==='fade'?y*.65:y;o.material.color.set(l.hairColor||'#211b16');});
 p.longHair.visible=l.hair==='long';p.longHair.material.color.set(l.hairColor||'#211b16');for(let i=0;i<7;i++){p['dread'+i].visible=l.hair==='dreads';p['dread'+i].material.color.set(l.hairColor||'#211b16');}
 p.beard.visible=!!l.beard&&l.beard!=='none';p.beard.scale.y=l.beard==='full'?.047:.03;p.beard.material.color.set(l.hairColor||'#241b16');
 }
 let stadium=null,stadiumKey='';const nightColor=new T.Color('#132638'),nightFog=new T.Fog('#26374a',90,240);const groundShadows=new T.InstancedMesh(new T.CircleGeometry(.62,16),new T.MeshBasicMaterial({color:0x132416,transparent:true,opacity:.26,depthWrite:false}),40);groundShadows.rotation.x=-Math.PI/2;scene.add(groundShadows);const shadowTransform=new T.Object3D();
 function pose(m,e){const d=m.userData;root.FGAthlete.pose(m,{speed:e.moving>0.1?5:0,number:e.num,action:({block:'block',stance:'ready',throw:'ready',release:'throw',catch:'catch',reach:'catch',celebrate:'celebrate',tackle:'block'})[e.pose]||'idle',carry:e.pose==='carry'},(e.anim||0)/9,'live');
 m.position.set(e.x,(e.y||0),e.z);m.rotation.set(0,(e.yaw??(e.facing==='down'?Math.PI:0))+Math.PI,0);d.helmet.visible=!e.helmetOff;d.ball.visible=false;
 if(e.look?.stance==='wide')d.legs.forEach((leg,i)=>leg.rotation.z+=(i?1:-1)*.08);if(e.pose==='release'&&e.look?.throwStyle){const arm=d.arms[e.lefty?0:1];if(e.look.throwStyle==='compact'){arm.rotation.x=-1.6;arm.userData.elbow.rotation.x=-.9;}else if(e.look.throwStyle==='overhand')arm.rotation.x=-2.45;}
 if(e.pose==='kick'||e.pose==='punt'){const k=Math.sin(Math.min(1,e.kickT||0)*Math.PI);d.legs[e.lefty?0:1].rotation.x=-1.3*k;d.legs[e.lefty?0:1].userData.knee.rotation.x=.08;d.arms.forEach(a=>a.rotation.z*=4);}
 if(e.pose==='kneel'){d.pelvis.position.y=.70;d.legs[0].rotation.x=-1.1;d.legs[0].userData.knee.rotation.x=1.6;d.legs[1].userData.knee.rotation.x=1.5;}
 if(e.pitch){d.body.rotation.x=e.pitch;d.body.position.y+=.35;}
 if(e.fall){d.body.rotation.z=(e.fallDir||1)*e.fall*1.45;d.body.position.y-=e.fall*.15;}
 }
 return {ok:true,enhanced:true,stadium:true,resize(w,h,d){W=w;H=h;renderer.setPixelRatio(Math.min(d,1.5));renderer.setSize(w,h,false);},render(cam,ents,b,shake,props,opt={}){
 const sk=opt.stadium?JSON.stringify([opt.stage,opt.home]):'';
 if(sk&&sk!==stadiumKey){if(stadium)release(stadium);stadium=root.FG_STADIUM.create(opt.stage||'camp',opt.home);scene.add(stadium);stadiumKey=sk;}
 if(stadium){stadium.visible=!!sk;if(stadium.userData.crowd)stadium.userData.crowd.position.y=Math.sin((opt.time||0)*3)*.035;}
 const night=sk&&opt.stage==='pro',sunset=sk&&opt.stage==='college';ambient.intensity=night?1.8:2.3;sun.intensity=night?1.5:2.8;sun.color.set(sunset?0xffd5a8:night?0xdbeaff:0xfff0d9);rim.intensity=night?1.6:.7;scene.background=night?nightColor:null;scene.fog=night?nightFog:null;groundShadows.visible=!!sk;groundShadows.count=Math.min(40,ents.length);for(let i=0;i<groundShadows.count;i++){shadowTransform.position.set(ents[i].x+.18,-ents[i].z,.03);shadowTransform.scale.set(1.4,.75,1);shadowTransform.updateMatrix();groundShadows.setMatrixAt(i,shadowTransform.matrix);}groundShadows.instanceMatrix.needsUpdate=true;
 camera.position.set(cam.x,cam.y,cam.z);camera.rotation.set(-cam.pitch,0,0);camera.fov=2*Math.atan(H/(2*cam.f))*180/Math.PI;camera.aspect=W/H;camera.updateProjectionMatrix();camera.projectionMatrix.elements[8]=-2*(shake?.x||0)/W;camera.projectionMatrix.elements[9]=2*cam.cy-1+2*(shake?.y||0)/H;camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
 for(let i=0;i<ents.length;i++){const e=ents[i],key=JSON.stringify([e.num,e.colors,e.gear,e.look,e.lefty]);if(!models[i])models[i]={key,m:build(e)};else if(models[i].key!==key){applyLook(models[i].m,e);models[i].key=key;}pose(models[i].m,e);models[i].m.visible=true;}
 for(let i=ents.length;i<models.length;i++)models[i].m.visible=false;
 const key=JSON.stringify((props||[]).map(o=>[o.kind,o.r,o.y]));if(key!==propsKey){for(const o of [...propsGroup.children]){propsGroup.remove(o);release(o);}for(const p of props||[]){let mesh;if(p.kind==='hoop'){mesh=addon(propsGroup,new T.TorusGeometry(p.r,.10,8,24),'#ff732d',0,0,0);}else if(p.kind==='dummy')mesh=addon(propsGroup,new T.CylinderGeometry(.3,.3,1.7,12),'#efc924',0,0,0);else mesh=addon(propsGroup,new T.ConeGeometry(.25,.6,10),'#f57821',0,0,0);mesh.userData.kind=p.kind;}propsKey=key;}
 (props||[]).forEach((p,i)=>{const o=propsGroup.children[i];if(o){o.position.set(p.x,p.kind==='hoop'?p.y:p.kind==='dummy'?.85:.3,p.z);if(p.kind==='hoop')o.material.color.set(p.hit?'#78f065':'#ff732d');}});
 ball.visible=!!b&&!b.hidden;if(ball.visible){ball.position.set(b.x,b.h,b.z);ball.rotation.set(b.rot||0,b.yaw||0,0);}renderer.render(scene,camera);
 },dispose(){models.forEach(o=>release(o.m));release(propsGroup);release(ball);release(groundShadows);if(stadium)release(stadium);renderer.dispose();}};
}
root.FG_GL={create};})(window);
