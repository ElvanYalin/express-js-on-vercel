/* Procedural stadium: one camera and world scale for turf, stands and athletes. */
(function(root){const T=root.THREE;
 function create(stage,home){const g=new T.Group();g.name='stadium-'+stage;const mats=new Map();
 const material=c=>{if(!mats.has(c))mats.set(c,new T.MeshStandardMaterial({color:c,roughness:.92}));return mats.get(c);};
 function box(x,y,z,w,h,d,c){const m=new T.Mesh(new T.BoxGeometry(w,h,d),material(c));m.position.set(x,y,z);g.add(m);return m;}
 const cv=document.createElement('canvas');cv.width=1024;cv.height=2048;const ctx=cv.getContext('2d');
 ctx.fillStyle='#3d7740';ctx.fillRect(0,0,1024,2048);for(let i=0;i<24;i++){ctx.fillStyle=i%2?'#478547':'#3d7d40';ctx.fillRect(0,i*2048/24,1024,2048/24);}
 let seed=41;const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
 for(let i=0;i<40000;i++){ctx.fillStyle=random()>.5?'rgba(199,224,131,.09)':'rgba(8,40,13,.10)';ctx.fillRect(random()*1024,random()*2048,1,2);}
 const sy=2048/120,sx=1024/53.34;ctx.fillStyle=home.jersey;ctx.fillRect(0,0,1024,10*sy);ctx.fillRect(0,110*sy,1024,10*sy);
 ctx.strokeStyle='#edf1dc';ctx.lineWidth=4;ctx.strokeRect(3,3,1018,2042);
 for(let yard=0;yard<=100;yard+=5){const y=(yard+10)*sy;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1024,y);ctx.stroke();}
 ctx.lineWidth=2;for(let yard=1;yard<100;yard++){const y=(yard+10)*sy;for(const x of [1,20,32.3,51.3]){ctx.beginPath();ctx.moveTo(x*sx,y);ctx.lineTo((x+1)*sx,y);ctx.stroke();}}
 ctx.fillStyle='#eff2df';ctx.font='bold 62px Arial';ctx.textAlign='center';ctx.textBaseline='middle';
 for(let yard=10;yard<100;yard+=10){const n=yard<=50?yard:100-yard;for(const side of [1,-1]){ctx.save();ctx.translate(side===1?110:914,(yard+10)*sy);ctx.rotate(side*Math.PI/2);ctx.fillText(n,0,0);ctx.restore();}}
 ctx.font='900 78px Arial';ctx.fillStyle=home.trim;ctx.fillText(stage==='camp'?'GLORY CAMP':stage==='college'?'COLLEGE FOOTBALL':stage==='combine'?'QB COMBINE':'FOURTH & GLORY',512,5*sy);ctx.fillText('ROAD TO GLORY',512,115*sy);
 ctx.font='900 115px Arial';ctx.globalAlpha=.32;ctx.fillStyle=home.trim;ctx.fillText('4G',512,1024);ctx.globalAlpha=1;
 const texture=new T.CanvasTexture(cv);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
 const field=new T.Mesh(new T.PlaneGeometry(53.34,120),new T.MeshStandardMaterial({map:texture,roughness:1}));field.rotation.x=-Math.PI/2;field.position.y=.015;g.add(field);
 box(0,-.12,0,160,.2,240,'#456947');box(0,-.03,0,62,.05,130,'#d1cfbc');
 for(const x of [-26.4,26.4])for(const z of [-50,50])box(x,.28,z,.18,.56,.18,'#ff671e');
 for(const z of [-60,60]){box(0,1.65,z,0.17,3.3,.17,'#efc23b');box(0,3.33,z,6.2,.16,.16,'#efc23b');for(const x of [-3.08,3.08])box(x,6.1,z,.14,5.6,.14,'#f6d44a');box(0,.8,z,.48,1.6,.48,home.jersey);}
 const rows=stage==='pro'?18:stage==='college'?10:4,length=stage==='pro'?140:stage==='college'?112:66;
 for(const side of [-1,1]){box(side*30,1,0,.4,2,130,home.jersey);for(let r=0;r<rows;r++){const x=side*(34+r*1.05),y=1+r*.62;box(x,y,0,1.15,.5,length,r%2?'#74838d':'#9ba9ad');}if(stage==='pro')box(side*44,15,0,27,.35,150,'#b4bec4');}
 if(stage==='college'||stage==='pro')for(const side of [-1,1])for(let r=0;r<rows;r++)box(0,1+r*.62,side*(70+r*1.05),68+r*1.5,.5,1.15,r%2?'#697c87':'#8e9ea5');
 // Crowd shares a single geometry and material via instancing.
 const count=rows*(stage==='pro'?190:stage==='college'?125:30),crowd=new T.InstancedMesh(new T.BoxGeometry(.42,.64,.35),new T.MeshLambertMaterial({color:'#ffffff'}),count),dummy=new T.Object3D(),color=new T.Color();
 for(let i=0;i<count;i++){const r=i%rows,side=i%2?1:-1;let x=side*(34+r*1.05),z=(random()-.5)*length;if(i%3===0&&rows>4){x=(random()-.5)*(64+r);z=side*(70+r*1.05);}dummy.position.set(x,1.65+r*.62,z);dummy.updateMatrix();crowd.setMatrixAt(i,dummy.matrix);color.set([home.jersey,home.trim,'#d1d6d7','#314152','#765847'][i%5]);crowd.setColorAt(i,color);}g.add(crowd);g.userData.crowd=crowd;
 // Campus / practice facility behind the far end; scoreboard above the goal.
 if(stage==='camp'||stage==='combine'){box(-24,4,-82,24,8,12,'#b4b6ae');box(-24,5,-75.8,21,4,.1,'#38596a');box(-24,8.3,-82,27,.5,14,'#3e4852');for(let i=0;i<9;i++){box(31,.28,-35+i*8,1.6,.56,3.2,'#e3be29');}}
 box(0,12,-85,22,8,.8,'#102238');const board=document.createElement('canvas');board.width=512;board.height=192;const bc=board.getContext('2d');bc.fillStyle='#102238';bc.fillRect(0,0,512,192);bc.fillStyle='#edf7fb';bc.textAlign='center';bc.font='bold 34px Arial';bc.fillText('FOURTH & GLORY',256,68);bc.fillStyle=home.trim;bc.font='24px Arial';bc.fillText(stage==='camp'?'TRAINING CAMP':stage==='college'?'COLLEGE GAME DAY':stage==='combine'?'QB COMBINE':'GLORY BOWL',256,120);const bt=new T.CanvasTexture(board);bt.colorSpace=T.SRGBColorSpace;const screen=new T.Mesh(new T.PlaneGeometry(21,7),new T.MeshBasicMaterial({map:bt}));screen.position.set(0,12,-84.5);g.add(screen);box(-8,5,-85,.4,10,.4,'#747e85');box(8,5,-85,.4,10,.4,'#747e85');
 for(const x of [-40,40])for(const z of [-58,58]){box(x,12,z,.35,24,.35,'#71858f');box(x,24,z,7,1.5,1,'#e1e6e3');}
 // Benches, equipment, tunnel, staff and broadcast positions sit outside the playing area.
 for(const side of [-1,1]){for(const z of [-12,0,12]){box(side*29,.6,z,.85,.15,7,'#c3cbd0');box(side*29,.27,z,.12,.6,6,'#526477');box(side*31,.5,z+3,1,1,.7,'#ef782c');}for(let i=0;i<12;i++){const x=side*(28.6+(i%2)*1.5),z=-27+i*4.5;box(x,.9,z,.48,.75,.34,i%4?home.jersey:'#20303c');box(x,1.5,z,.26,.3,.26,i%3?'#aa785d':'#d2ae91');for(const dx of [-.12,.12])box(x+dx,.32,z,.17,.64,.2,'#c9d0cc');}}
 for(const x of [-27.7,27.7]){box(x,1,36,.45,.7,.3,'#f2f2e9');for(let i=0;i<4;i++)box(x-.2+i*.13,1,36.16,.05,.7,.025,'#171d24');box(x,1.5,36,.25,.3,.24,'#b38365');box(x,.4,36,.4,.7,.28,'#19222a');}
 for(const x of [-33,33]){box(x,1.8,22,.6,.4,.5,'#14202a');for(const dx of [-.25,.25])box(x+dx,.8,22,.06,1.8,.06,'#657581');}
 box(22,2.3,-74,11,4.6,10,'#1c2935');box(22,2,-68.9,7,4,.1,'#090e14');box(22,4.7,-69,12,.4,1,home.trim);
 for(const side of [-1,1])for(let i=0;i<7;i++){box(side*30,1,-48+i*16,.15,1.15,13,i%2?home.jersey:'#17394c');box(side*29.9,1.05,-48+i*16,.02,.1,11,home.trim);}
 return g;
 }
 root.FG_STADIUM={create};
})(window);
