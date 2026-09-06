import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';
import { parts } from './catalog.js';

export function createViewer(container,onSelect) {
 const scene=new THREE.Scene();scene.background=new THREE.Color('#eaece3');
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;container.prepend(renderer.domElement);
 const camera=new THREE.PerspectiveCamera(35,1,.1,100);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=1.6;controls.maxDistance=35;controls.maxPolarAngle=Math.PI*.49;
 const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();const env=pmrem.fromScene(room,.04);scene.environment=env.texture;room.dispose();pmrem.dispose();
 scene.environmentIntensity=.65;scene.add(new THREE.HemisphereLight(0xffffff,0xa2a28b,.9));
 const sun=new THREE.DirectionalLight(0xfff9e9,2.5);sun.position.set(-4,9,4);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-9,right:9,top:10,bottom:-9,near:.1,far:35});sun.shadow.bias=-.0002;sun.shadow.normalBias=.018;sun.shadow.radius=4;scene.add(sun);
 // A shadow catcher avoids an overexposed white floor and a visible horizon.
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({color:0x586346,opacity:.2}));floor.rotation.x=-Math.PI/2;floor.position.y=-.12;floor.receiveShadow=true;scene.add(floor);
 const grid=new THREE.GridHelper(18,36,0xbfc4b7,0xd4d8cc);grid.position.y=-.115;grid.material.transparent=true;grid.material.opacity=.38;scene.add(grid);
 const groups=new Map(),subLayers=[];let explosion=.22,targetExplosion=.22,filter=[],selection=null,xray=false,labelsOn=true,fitTimer;
 const mat=(color,metalness=0,roughness=.5)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
 const black=mat('#252b2b',.42,.39),orange=mat('#df632e',.08,.38),metal=mat('#b6c0bd',.88,.25),rubber=mat('#242723',0,.83),pcb=mat('#376953',.3,.5),gold=mat('#c5a05b',.7,.27);
 function group(id,origin,offset){const g=new THREE.Group();g.position.fromArray(origin);g.userData={id,origin:new THREE.Vector3(...origin),offset:new THREE.Vector3(...offset)};groups.set(id,g);scene.add(g);return g;}
 function add(g,geo,m,pos=[0,0,0],rot=[0,0,0]){const mesh=new THREE.Mesh(geo,m.clone());mesh.position.fromArray(pos);mesh.rotation.set(...rot);mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.partId=g.userData.id;g.add(mesh);return mesh;}
 const box=(g,w,h,d,m,p,r)=>add(g,new THREE.BoxGeometry(w,h,d),m,p,r);
 const cyl=(g,r,h,m,p,rot=[0,0,0],r2=r)=>add(g,new THREE.CylinderGeometry(r,r2,h,40),m,p,rot);
 const torus=(g,r,t,m,p,rot=[0,0,0])=>add(g,new THREE.TorusGeometry(r,t,8,60),m,p,rot);
 function layer(mesh,offset){subLayers.push({mesh,origin:mesh.position.clone(),offset:new THREE.Vector3(...offset)});return mesh;}
 function wire(g,pts,m,r=.025){const curve=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)));return add(g,new THREE.TubeGeometry(curve,40,r,8,false),m);}
 function screw(g,p,rot=[Math.PI/2,0,0]){cyl(g,.043,.034,metal,p,rot);}
 function labelTexture(text,bg='#262c2b',fg='#eceee4',size=512){const cv=document.createElement('canvas');cv.width=size;cv.height=128;const cx=cv.getContext('2d');cx.fillStyle=bg;cx.fillRect(0,0,size,128);cx.fillStyle=fg;cx.font='bold 45px Arial';cx.textAlign='center';cx.textBaseline='middle';cx.fillText(text,size/2,66);const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshStandardMaterial({map:t,roughness:.6});}
 const frame=group('frame',[0,0,0],[0,0,-.5]);
 for(const x of [-1.6,1.6]){
  box(frame,.22,.28,3.5,black,[x,.12,0]);
  for(const z of [-1.45,1.45]){box(frame,.38,.18,.48,rubber,[x,-.015,z]);box(frame,.31,.36,.25,orange,[x,.2,z]);screw(frame,[x,.21,z+.14]);}
  box(frame,.26,3.55,.24,black,[x,2.05,-.7]);box(frame,.07,3.28,.03,metal,[x,2.02,-.555]);
 }
 box(frame,3.46,.27,.27,black,[0,3.8,-.7]);box(frame,3.4,.24,.24,black,[0,.12,1.65]);box(frame,3.4,.24,.24,black,[0,.12,-1.65]);
 box(frame,1.82,.16,.012,labelTexture('ORIGINAL PRUSA i3'),[0,3.81,-.55]);
 for(const x of [-1.28,1.28]){cyl(frame,.038,3.45,metal,[x,.53,0],[Math.PI/2,0,0]);}
 for(const x of [-1.42,1.42]){cyl(frame,.042,3.5,metal,[x,2,-.38]);}
 const zMotor=group('motor-z',[0,.48,-.66],[0,.12,-.95]);
 for(const x of [-1.6,1.6]){box(zMotor,.43,.42,.43,black,[x,0,0]);box(zMotor,.45,.065,.45,metal,[x,.24,0]);cyl(zMotor,.045,3.22,metal,[x,1.9,0]);for(let y=.4;y<3.4;y+=.075)torus(zMotor,.047,.008,metal,[x,y,0],[Math.PI/2,0,0]);}
 const xMotor=group('motor-x',[-1.62,2.45,-.22],[-1.9,.45,.15]);
 box(xMotor,.6,.64,.63,orange,[0,0,0]);box(xMotor,.46,.46,.44,black,[-.04,.01,-.39]);box(xMotor,.47,.47,.07,metal,[-.04,.01,-.15]);cyl(xMotor,.08,.24,metal,[-.04,.01,.27],[Math.PI/2,0,0]);cyl(xMotor,.14,.16,black,[-.04,.01,.39],[Math.PI/2,0,0]);for(const x of [-.18,.18])for(const y of [-.18,.18])screw(xMotor,[x,y,.33]);
 const yMotor=group('motor-y',[0,.47,-1.5],[.5,.1,-1.6]);box(yMotor,.48,.48,.46,black,[0,0,0]);box(yMotor,.49,.49,.065,metal,[0,0,.26]);box(yMotor,.68,.14,.65,orange,[0,-.28,0]);cyl(yMotor,.1,.25,metal,[0,0,.36],[Math.PI/2,0,0]);
 const belts=group('belts',[0,2.45,-.2],[0,.4,.3]);
 for(const y of [-.19,.19])cyl(belts,.038,3.17,metal,[0,y,0],[0,0,Math.PI/2]);
 box(belts,3.22,.037,.095,rubber,[0,-.08,.21]);box(belts,3.22,.037,.095,rubber,[0,.1,.21]);box(belts,.36,.59,.4,orange,[1.55,0,0]);cyl(belts,.12,.19,metal,[1.55,.01,.23],[Math.PI/2,0,0]);
 // The Y transmission belongs to Y: it must not survive an X-only isolation.
 box(yMotor,.08,.045,2.78,rubber,[0,.06,1.44]);
 const extruder=group('extruder',[0,2.38,.08],[.1,1.15,.9]);
 // Open carriage, removable front cover and fasteners form separate layers.
 box(extruder,.67,.79,.12,orange,[0,.12,-.23]);
 for(const x of [-.29,.29])box(extruder,.09,.79,.4,orange,[x,.12,.02]);
 box(extruder,.67,.1,.4,orange,[0,.47,.02]);
 layer(box(extruder,.67,.34,.09,orange,[0,.15,.27]),[0,.3,.82]);
 for(const x of [-.24,.24])layer(cyl(extruder,.034,.13,metal,[x,.22,.34],[Math.PI/2,0,0]),[0,.3,1.12]);
 wire(extruder,[[.13,.48,-.28],[.38,.65,-.56],[.58,.46,-.85],[.72,.16,-1.1]],rubber,.045);
 const motorE=group('motor-e',[0,2.67,-.31],[.15,1.85,-.75]);
 box(motorE,.47,.47,.36,black,[0,0,0]);layer(box(motorE,.48,.48,.065,metal,[0,0,.21]),[0,0,.2]);cyl(motorE,.044,.27,metal,[0,0,.35],[Math.PI/2,0,0]);
 const gears=group('drive-gears',[0,2.67,.07],[.75,1.6,.6]);
 for(const x of [-.13,.13]){cyl(gears,.105,.1,gold,[x,0,0],[Math.PI/2,0,0]);cyl(gears,.035,.15,metal,[x,0,0],[Math.PI/2,0,0]);for(let i=0;i<14;i++){const a=i*Math.PI/7;box(gears,.025,.025,.1,metal,[x+Math.cos(a)*.105,Math.sin(a)*.105,0],[0,0,a]);}}
 const fan=group('fan',[-.16,2.48,.53],[-1.1,1.08,2.5]);
 // Four edge pieces leave the rotor visible; no solid panel in front of it.
 for(const x of [-.245,.245])box(fan,.06,.55,.09,black,[x,0,0]);for(const y of [-.245,.245])box(fan,.44,.06,.09,black,[0,y,0]);
 torus(fan,.215,.025,rubber,[0,0,0]);
 for(let i=0;i<7;i++){const a=i*Math.PI*2/7;box(fan,.155,.058,.025,black,[Math.cos(a)*.115,Math.sin(a)*.115,.02],[0,0,a+.6]);}cyl(fan,.062,.035,metal,[0,0,.035],[Math.PI/2,0,0]);
 for(const x of [-.235,.235])for(const y of [-.235,.235])layer(cyl(fan,.024,.1,metal,[x,y,.025],[Math.PI/2,0,0]),[0,0,.3]);
 const hotend=group('hotend',[.03,1.94,.08],[1.2,.55,1.8]);
 for(let i=0;i<6;i++)layer(cyl(hotend,.13,.033,metal,[0,-i*.045,0]),[0,.18-i*.035,0]);
 cyl(hotend,.037,.19,metal,[0,-.27,0]);layer(cyl(hotend,.07,.15,gold,[0,-.4,0],[0,0,0],.018),[0,-.7,0]);
 const heater=group('heater',[.03,1.69,.08],[2,.2,2.15]);
 box(heater,.26,.16,.21,metal,[0,0,0]);layer(cyl(heater,.035,.3,metal,[.02,-.01,.035],[0,0,Math.PI/2]),[.65,0,0]);
 const thermistor=group('thermistor',[.1,1.71,.19],[2.9,.52,2.4]);
 cyl(thermistor,.023,.12,metal,[0,0,0],[0,0,Math.PI/2]);for(const y of [-.015,.015])wire(thermistor,[[.06,y,0],[.15,y,.05],[.3,y,.12]],mat('#d0c7b3'),.009);
 const bed=group('bed',[0,.68,.25],[0,.3,1.95]);box(bed,2.8,.11,2.63,black,[0,0,0]);box(bed,2.78,.026,2.61,mat('#777e62',.6,.48),[0,.073,0]);
 for(let i=-1;i<=1;i+=.25){box(bed,.008,.003,2.46,mat('#adb19b',.25),[i*1.25,.09,0]);box(bed,2.63,.003,.008,mat('#adb19b',.25),[0,.091,i*1.2]);}
 box(bed,.78,.18,.016,labelTexture('PRUSA', '#555c48','#e1e2ce'),[0,.074,1.325]);for(const x of [-1.27,1.27])for(const z of [-1.16,1.16])screw(bed,[x,.11,z],[0,0,0]);
 const board=group('board',[-1.96,1.95,-.75],[-2.2,.4,-.1]);box(board,.13,1.45,.95,black,[-.12,0,0]);box(board,.055,1.29,.81,pcb,[0,0,0]);
 for(let i=0;i<4;i++){box(board,.095,.19,.2,black,[.065,.43-i*.24,.02]);box(board,.12,.09,.15,mat('#bfc2b7',.7),[.075,.45-i*.24,-.26]);}
 for(let i=0;i<7;i++){box(board,.13,.09,.1,mat('#dbd9ba'),[.1,-.53,i*.095-.28]);}
 for(const y of [-.61,.61])for(const z of [-.34,.34])screw(board,[.05,y,z],[0,0,Math.PI/2]);
 const fuses=group('fuses',[-1.83,2.31,-.43],[-2.7,.95,.6]);for(let i=0;i<3;i++){box(fuses,.09,.19,.1,mat(i===2?'#66aac3':'#cc945a',.15,.25),[0,-i*.25,0]);for(const z of [-.03,.03])box(fuses,.08,.075,.022,metal,[0,-i*.25-.13,z]);}
 const psu=group('psu',[1.92,1.27,-.93],[1.8,.15,-.7]);box(psu,.61,1.91,.84,black,[0,0,0]);box(psu,.015,1.68,.64,mat('#414847',.55,.4),[.316,.02,0]);
 for(let y=-.5;y<=.65;y+=.13)for(let z=-.23;z<.3;z+=.12)box(psu,.02,.048,.062,rubber,[.33,y,z]);box(psu,.22,.15,.04,orange,[0,-.75,.44]);box(psu,.38,.3,.016,labelTexture('24V'),[0,.3,.43]);
 const display=group('display',[0,.38,1.93],[.2,.03,1.5]);box(display,1.54,.51,.43,orange,[0,0,0]);box(display,.95,.3,.027,black,[-.17,.03,.23]);box(display,.81,.2,.011,labelTexture('PRUSA READY','#739d95','#163e37'),[-.17,.032,.25]);cyl(display,.14,.12,black,[.57,.01,.28],[Math.PI/2,0,0]);
 const spool=group('spool',[0,4.67,-.67],[0,1.2,-.65]);box(spool,.25,.72,.28,black,[0,-.48,0]);cyl(spool,.65,.51,mat('#d3c9aa',.05,.74),[0,0,0],[Math.PI/2,0,0]);for(const z of [-.29,.29]){cyl(spool,.75,.055,black,[0,0,z],[Math.PI/2,0,0]);cyl(spool,.18,.07,metal,[0,0,z*1.15],[Math.PI/2,0,0]);for(let i=0;i<8;i++){const a=i*Math.PI/4;cyl(spool,.14,.061,mat('#464c45'),[Math.cos(a)*.46,Math.sin(a)*.46,z*1.02],[Math.PI/2,0,0]);}}
 for(let i=-.22;i<=.22;i+=.023)torus(spool,.648,.011,mat('#b5aa88'),[0,0,i]);
 // Explode internal assemblies as well as their parent components.
 for(const mesh of bed.children)if(mesh.position.y>.06)layer(mesh,[0,.55,0]);
 for(const mesh of board.children)if(mesh.position.x>=0)layer(mesh,[.6+(mesh.position.x>.05?.18:0),0,0]);
 for(const mesh of fuses.children)layer(mesh,[0,0,-mesh.position.y*1.25]);
 for(const mesh of psu.children)if(mesh.position.x>.3)layer(mesh,[.6,0,0]);
 for(const mesh of display.children)if(mesh.position.z>.22)layer(mesh,[0,0,mesh.position.x>.4?.72:.45]);
 for(const mesh of spool.children)if(Math.abs(mesh.position.z)>.26)layer(mesh,[0,0,Math.sign(mesh.position.z)*.55]);

 const guideMaterial=new THREE.LineDashedMaterial({color:0x87917f,dashSize:.07,gapSize:.06,transparent:true,opacity:.4});const guides=[];
 for(const [id,g] of groups){const geo=new THREE.BufferGeometry().setFromPoints([g.userData.origin,g.position]);const line=new THREE.Line(geo,guideMaterial);scene.add(line);guides.push({line,g});}
 const labelLayer=document.createElement('div');labelLayer.className='model-labels';container.append(labelLayer);
 const labelSvg=document.createElementNS('http://www.w3.org/2000/svg','svg');labelSvg.classList.add('label-leaders');labelLayer.append(labelSvg);
 const overviewLabels=new Set(['motor-x','extruder','bed','board','psu','spool']);
 const labelNodes=parts.map(({id,name})=>{const el=document.createElement('button');el.className='part-label';el.textContent=name;el.onclick=()=>onSelect(id);labelLayer.append(el);const line=document.createElementNS(labelSvg.namespaceURI,'path');labelSvg.append(line);return {el,g:groups.get(id),id,line};});
 function applyMaterials(){for(const [id,g] of groups){g.visible=!filter.length||filter.includes(id);g.traverse(obj=>{if(!obj.isMesh)return;const m=obj.material;m.transparent=xray;m.opacity=xray?.28:1;m.depthWrite=!xray;m.emissive.set(selection===id?'#91401c':'#000000');m.emissiveIntensity=selection===id?.22:0;obj.castShadow=!xray;});}}
 function layoutLabels(){const w=container.clientWidth,h=container.clientHeight,columns={left:[],right:[]};
  for(const node of labelNodes){const {el,g,id,line}=node;const p=g.position.clone().project(camera);const visible=labelsOn&&g.visible&&(filter.length||overviewLabels.has(id)||selection===id)&&p.z>=-1&&p.z<=1;
   el.hidden=!visible;line.style.display=visible?'':'none';if(!visible)continue;el.classList.toggle('selected',id===selection);
   const ax=(p.x*.5+.5)*w,ay=(-p.y*.5+.5)*h;const side=['board','fuses','motor-x','motor-y','motor-z','fan'].includes(id)?'left':'right';columns[side].push({...node,ax,ay});
  }
  for(const [side,nodes] of Object.entries(columns)){nodes.sort((a,b)=>a.ay-b.ay);const gap=w<500?36:32,minY=filter.length?94:45,maxY=h-75;let previous=minY-gap;
   nodes.forEach(n=>{n.y=Math.max(previous+gap,Math.min(n.ay-12,maxY));previous=n.y;});
   if(nodes.length&&previous>maxY){nodes[nodes.length-1].y=maxY;for(let i=nodes.length-2;i>=0;i--)nodes[i].y=Math.min(nodes[i].y,nodes[i+1].y-gap);}
   for(const n of nodes){const width=n.el.offsetWidth;const desired=side==='left'?n.ax-width-65:n.ax+55;const x=THREE.MathUtils.clamp(desired,12,w-width-15);const y=Math.max(minY,n.y);n.el.style.transform=`translate(${x}px,${y}px)`;const endX=side==='left'?x+width:x,endY=y+n.el.offsetHeight/2;n.line.setAttribute('d',`M${n.ax},${n.ay} L${endX+(side==='left'?12:-12)},${endY} L${endX},${endY}`);}
  }
 }
 let pointerDown=null;const ray=new THREE.Raycaster();const mouse=new THREE.Vector2();
 renderer.domElement.addEventListener('pointerdown',e=>{pointerDown=[e.clientX,e.clientY];});
 renderer.domElement.addEventListener('pointerup',e=>{if(!pointerDown||Math.hypot(e.clientX-pointerDown[0],e.clientY-pointerDown[1])>5)return;const rect=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(mouse,camera);const hit=ray.intersectObjects([...groups.values()].filter(g=>g.visible),true)[0];if(hit)onSelect(hit.object.userData.partId);});
 let cameraGoal=null;controls.addEventListener('start',()=>{cameraGoal=null;clearTimeout(fitTimer);});
 function fit(value=targetExplosion){
  const bounds=new THREE.Box3();
  for(const g of groups.values())g.position.copy(g.userData.origin).addScaledVector(g.userData.offset,value);
  for(const l of subLayers)l.mesh.position.copy(l.origin).addScaledVector(l.offset,value);
  scene.updateMatrixWorld(true);for(const g of groups.values())if(g.visible)bounds.expandByObject(g);
  const corners=[];for(const g of groups.values())if(g.visible)g.traverse(mesh=>{if(!mesh.isMesh)return;mesh.geometry.computeBoundingBox();const b=mesh.geometry.boundingBox;for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z])corners.push(new THREE.Vector3(x,y,z).applyMatrix4(mesh.matrixWorld));});
  for(const g of groups.values())g.position.copy(g.userData.origin).addScaledVector(g.userData.offset,explosion);
  for(const l of subLayers)l.mesh.position.copy(l.origin).addScaledVector(l.offset,explosion);
  scene.updateMatrixWorld(true);if(bounds.isEmpty())return;
  const center=bounds.getCenter(new THREE.Vector3());
  const direction=camera.position.clone().sub(controls.target).normalize();const rotation=new THREE.Matrix4().lookAt(direction,new THREE.Vector3(),camera.up);const inverse=rotation.clone().invert();
  const tangent=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));let distance=2;
  for(const corner of corners){const p=corner.sub(center).applyMatrix4(inverse);distance=Math.max(distance,Math.abs(p.y)*1.24/tangent+p.z,Math.abs(p.x)*1.3/(tangent*camera.aspect)+p.z);}
  cameraGoal={target:center,position:center.clone().addScaledVector(direction,THREE.MathUtils.clamp(distance,2,34))};
 }
 function scheduleFit(){clearTimeout(fitTimer);fitTimer=setTimeout(()=>fit(),180);}
 function reset(view='iso'){cameraGoal=null;controls.target.set(0,2.45,0);camera.position.set(...(view==='front'?[0,3,12.6]:view==='top'?[0,14,.01]:[8,6.1,10]));controls.update();scheduleFit();}
 function resize(){const w=container.clientWidth,h=container.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();scheduleFit();}new ResizeObserver(resize).observe(container);reset();resize();
 let last=performance.now();
 renderer.setAnimationLoop(now=>{const dt=Math.min((now-last)/1000,.05);last=now;explosion=THREE.MathUtils.damp(explosion,targetExplosion,7,dt);for(const g of groups.values())g.position.copy(g.userData.origin).addScaledVector(g.userData.offset,explosion);
  for(const l of subLayers)l.mesh.position.copy(l.origin).addScaledVector(l.offset,explosion);
  for(const {line,g} of guides){const attr=line.geometry.attributes.position;attr.setXYZ(0,...g.userData.origin.toArray());attr.setXYZ(1,...g.position.toArray());attr.needsUpdate=true;line.computeLineDistances();line.visible=explosion>.05&&(!filter.length||filter.includes(g.userData.id));}
  if(cameraGoal){const alpha=1-Math.exp(-6*dt);camera.position.lerp(cameraGoal.position,alpha);controls.target.lerp(cameraGoal.target,alpha);if(camera.position.distanceTo(cameraGoal.position)<.005)cameraGoal=null;}
  controls.update();renderer.render(scene,camera);layoutLabels();
 });
 return {setExplosion(value){targetExplosion=value;scheduleFit();},setFilter(ids){filter=ids;applyMaterials();scheduleFit();},select(id){selection=id;applyMaterials();},setXray(value){xray=value;applyMaterials();},setLabels(value){labelsOn=value;},reset,fit,zoom(delta){cameraGoal=null;const v=camera.position.clone().sub(controls.target);v.multiplyScalar(delta);if(v.length()>1.6&&v.length()<35)camera.position.copy(controls.target).add(v);},getState:()=>({explosion:targetExplosion,filter,selection,visibleParts:[...groups].filter(([,g])=>g.visible).map(([id])=>id),meshCount:[...groups.values()].reduce((n,g)=>n+g.children.length,0),subLayerCount:subLayers.length,subLayers:subLayers.map(l=>({part:l.mesh.userData.partId,distance:l.mesh.position.distanceTo(l.origin)}))})};
}
