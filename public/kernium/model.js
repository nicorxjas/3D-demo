import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import { parts } from './catalog.js';

export function createViewer(container,onSelect) {
 const scene=new THREE.Scene();scene.background=new THREE.Color('#e9eae3');
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
 const groups=new Map(),subLayers=[];let explosion=0,targetExplosion=0,filter=[],selection=null,xray=false,labelsOn=true,fitTimer;
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
 const yellow=mat('#e5ac18',.3,.35),dark=mat('#30383b',.55,.4),steel=mat('#889594',.8,.3),red=mat('#b64630',.2,.45),blue=mat('#5d8495',.5,.38);
 const structure=new THREE.Group();structure.userData.id='structure';scene.add(structure);
 // Structural context remains assembled; only complete service assemblies explode.
 box(structure,1.68,.25,2.55,dark,[0,.46,-.12]);
 box(structure,1.76,.74,.63,yellow,[0,.99,-1.12]);
 box(structure,1.65,.46,.16,dark,[0,.68,-1.47]);
 for(const x of [-.82,.82]){
  box(structure,.13,.65,1.85,yellow,[x,.95,-.12]);
  box(structure,.28,.15,.64,dark,[x,.51,.55]);
  for(const z of [-1,.72])box(structure,.095,2.28,.105,dark,[x,2.05,z],[z>.5?-.07:0,0,0]);
 }
 for(const x of [-.83,.83])box(structure,.12,.14,2.08,dark,[x,3.22,-.11]);
 for(const z of [-1.08,.91])box(structure,1.8,.14,.1,dark,[0,3.22,z]);
 for(let z=-.85;z<.9;z+=.27)box(structure,1.64,.065,.065,dark,[0,3.25,z]);
 cyl(structure,.075,.15,mat('#ec9b24',.1,.2),[.64,3.39,-.85]);
 box(structure,1.28,.22,.017,labelTexture('KERNIUM  /  EFG 216','#e5ac18','#252c2e'),[0,1.08,-1.444],[0,Math.PI,0]);
 const mast=group('mast',[0,1.85,1.24],[0,.3,1.5]);
 for(const x of [-.62,.62]){
  box(mast,.15,3.15,.22,dark,[x,0,0]);
  box(mast,.085,2.94,.11,steel,[x*.79,.04,.17]);
  for(let y=-1.27;y<1.37;y+=.075){box(mast,.045,.05,.025,steel,[x*.65,y,.22]);}
  cyl(mast,.095,.1,steel,[x*.66,1.4,.2],[Math.PI/2,0,0]);
 }
 for(const y of [-1.46,1.5])box(mast,1.39,.16,.22,dark,[0,y,0]);
 box(mast,1.62,.17,.19,steel,[0,-1.13,.35]);box(mast,1.62,.14,.18,dark,[0,-.59,.35]);
 for(let x=-.7;x<=.7;x+=.175)box(mast,.045,.94,.06,dark,[x,-.7,.35]);
 for(const x of [-.46,.46]){
  box(mast,.13,.73,.11,dark,[x,-1.03,.49]);
  box(mast,.13,.085,1.53,steel,[x,-1.42,1.21]);
 }
 const cylinders=group('cylinders',[0,1.61,1.14],[1.8,.55,1.65]);
 for(const x of [-.42,.42]){cyl(cylinders,.092,1.4,dark,[x,-.39,0]);cyl(cylinders,.048,1.47,metal,[x,.38,0]);cyl(cylinders,.12,.07,steel,[x,.31,0]);wire(cylinders,[[x,-1.05,0],[x+.1,-1.2,-.08],[x+.15,-1.17,-.22]],rubber,.025);}
 const battery=group('battery',[0,1.12,-.38],[-2.1,.55,-.3]);
 box(battery,1.38,.77,1.08,dark,[0,0,0]);
 for(const x of [-.48,-.16,.16,.48])for(const z of [-.35,0,.35]){
  box(battery,.28,.09,.3,mat('#767e71',.2,.55),[x,.43,z]);
  cyl(battery,.037,.04,red,[x,.49,z]);
 }
 wire(battery,[[-.57,.48,.43],[-.6,.63,.51],[-.35,.66,.56],[-.25,.48,.58]],red,.035);
 box(battery,.28,.12,.1,red,[-.25,.49,.57]);box(battery,.65,.2,.012,labelTexture('48 V  /  Pb'),[0,.08,.55]);
 const drive=group('drive',[0,.51,.7],[-1.65,.13,1.1]);
 for(const x of [-.45,.45]){cyl(drive,.23,.47,dark,[x,0,0],[0,0,Math.PI/2]);cyl(drive,.25,.08,steel,[x+Math.sign(x)*.23,0,0],[0,0,Math.PI/2]);for(let z=-.15;z<=.15;z+=.075)box(drive,.41,.035,.022,steel,[x,.21,z]);}
 const pump=group('pump',[.39,.85,-.93],[1.75,.12,-1.05]);
 cyl(pump,.2,.49,dark,[0,.15,0]);cyl(pump,.21,.07,metal,[0,.43,0]);box(pump,.36,.24,.31,blue,[0,-.2,0]);
 for(let a=0;a<12;a++){const t=a*Math.PI/6;box(pump,.028,.43,.028,steel,[Math.cos(t)*.2,.15,Math.sin(t)*.2]);}
 const valves=group('valves',[.64,1.32,.32],[2,.65,.55]);
 box(valves,.23,.27,.51,steel,[0,0,0]);
 for(const z of [-.17,0,.17]){cyl(valves,.061,.17,dark,[0,.21,z]);box(valves,.105,.08,.11,dark,[.015,.32,z]);wire(valves,[[.12,0,z],[.24,.02,z],[.3,-.23,z+.05]],rubber,.019);}
 const reservoir=group('reservoir',[-.5,.91,-.98],[-1.6,.1,-1.5]);
 box(reservoir,.45,.64,.53,mat('#8c9490',.5,.4),[0,0,0]);cyl(reservoir,.08,.09,dark,[0,.37,0]);
 cyl(reservoir,.1,.26,blue,[.32,.08,0]);wire(reservoir,[[.21,.13,0],[.3,.25,0],[.32,.22,0]],rubber,.02);
 box(reservoir,.055,.35,.012,mat('#bbc9a4',.1,.2),[-.1,0,.273]);
 const controlsGroup=group('controls',[0,1.82,-.17],[.2,1.65,-.4]);
 box(controlsGroup,.78,.18,.68,rubber,[0,0,-.29]);box(controlsGroup,.76,.66,.14,rubber,[0,.36,-.6],[.13,0,0]);
 for(const x of [-.47,.47])box(controlsGroup,.14,.1,.55,dark,[x,.23,-.22]);
 box(controlsGroup,.25,.16,.43,dark,[.51,.21,.21]);cyl(controlsGroup,.035,.27,steel,[.51,.41,.21],[0,0,-.12]);box(controlsGroup,.11,.17,.13,rubber,[.53,.56,.21]);cyl(controlsGroup,.022,.013,red,[.54,.65,.21]);
 cyl(controlsGroup,.045,.5,dark,[-.24,-.16,.62],[-.3,0,0]);torus(controlsGroup,.21,.025,rubber,[-.24,.1,.7],[Math.PI/2-.3,0,0]);
 for(const a of [0,2.09,4.19])box(controlsGroup,.021,.025,.2,dark,[-.24+Math.sin(a)*.1,.1,.7+Math.cos(a)*.1],[0,a,0]);
 box(controlsGroup,.38,.23,.1,dark,[-.2,.18,.98]);box(controlsGroup,.31,.16,.012,labelTexture('READY  48V','#98aea2','#213d37'),[-.2,.18,.92],[0,Math.PI,0]);
 const controller=group('controller',[0,.86,-1.15],[.2,1.15,-2]);
 box(controller,.65,.31,.21,steel,[0,0,0]);for(let x=-.28;x<=.29;x+=.055)box(controller,.022,.24,.08,metal,[x,0,-.14]);
 for(const x of [-.23,0,.23])box(controller,.13,.08,.11,dark,[x,-.19,0]);
 const wheels=group('wheels',[0,.47,0],[0,-.04,-.25]);
 function wheel(x,z,r,w){
  cyl(wheels,r,w,rubber,[x,0,z],[0,0,Math.PI/2]);
  for(const side of [-1,1]){
   cyl(wheels,r*.52,.025,steel,[x+side*(w/2+.012),0,z],[0,0,Math.PI/2]);
   cyl(wheels,r*.22,.035,dark,[x+side*(w/2+.03),0,z],[0,0,Math.PI/2]);
   for(let i=0;i<6;i++){const a=i*Math.PI/3;cyl(wheels,.028,.038,metal,[x+side*(w/2+.03),Math.sin(a)*r*.36,z+Math.cos(a)*r*.36],[0,0,Math.PI/2]);}
  }
  for(let i=0;i<28;i++){const a=i*Math.PI/14;box(wheels,w*.9,.025,.05,mat('#393d38',0,.9),[x,Math.cos(a)*r, z+Math.sin(a)*r],[a,0,.12]);}
 }
 wheel(-.91,.74,.47,.28);wheel(.91,.74,.47,.28);wheel(-.15,-1.02,.35,.22);wheel(.15,-1.02,.35,.22);

 const guideMaterial=new THREE.LineDashedMaterial({color:0x87917f,dashSize:.07,gapSize:.06,transparent:true,opacity:.4});const guides=[];
 for(const [id,g] of groups){const geo=new THREE.BufferGeometry().setFromPoints([g.userData.origin,g.position]);const line=new THREE.Line(geo,guideMaterial);scene.add(line);guides.push({line,g});}
 const labelLayer=document.createElement('div');labelLayer.className='model-labels';container.append(labelLayer);
 const labelSvg=document.createElementNS('http://www.w3.org/2000/svg','svg');labelSvg.classList.add('label-leaders');labelLayer.append(labelSvg);
 const overviewLabels=new Set(['mast','battery','pump','controls','wheels']);
 const labelNodes=parts.map(({id,name})=>{const el=document.createElement('button');el.className='part-label';el.textContent=name;el.onclick=()=>onSelect(id);labelLayer.append(el);const line=document.createElementNS(labelSvg.namespaceURI,'path');labelSvg.append(line);return {el,g:groups.get(id),id,line};});
 function applyMaterials(){structure.visible=!filter.length;structure.traverse(o=>{if(o.isMesh){o.material.transparent=xray;o.material.opacity=xray?.18:1;o.material.depthWrite=!xray;}});for(const [id,g] of groups){g.visible=!filter.length||filter.includes(id);g.traverse(obj=>{if(!obj.isMesh)return;const m=obj.material;m.transparent=xray;m.opacity=xray?.28:1;m.depthWrite=!xray;m.emissive.set(selection===id?'#a9770b':'#000000');m.emissiveIntensity=selection===id?.22:0;obj.castShadow=!xray;});}}
 function layoutLabels(){const w=container.clientWidth,h=container.clientHeight,columns={left:[],right:[]};
  for(const node of labelNodes){const {el,g,id,line}=node;const p=g.position.clone().project(camera);const visible=labelsOn&&g.visible&&(!(w<500&&!filter.length&&['pump','wheels'].includes(id)))&&(filter.length||overviewLabels.has(id)||selection===id)&&p.z>=-1&&p.z<=1;
   el.hidden=!visible;line.style.display=visible?'':'none';if(!visible)continue;el.classList.toggle('selected',id===selection);
   const ax=(p.x*.5+.5)*w,ay=(-p.y*.5+.5)*h;const side=['battery','drive','controller','wheels','reservoir'].includes(id)?'left':'right';columns[side].push({...node,ax,ay});
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
 return {setExplosion(value){targetExplosion=value;scheduleFit();},setFilter(ids){filter=ids;applyMaterials();scheduleFit();},select(id){selection=id;applyMaterials();},setXray(value){xray=value;applyMaterials();},setLabels(value){labelsOn=value;},reset,fit,zoom(delta){cameraGoal=null;const v=camera.position.clone().sub(controls.target);v.multiplyScalar(delta);if(v.length()>1.6&&v.length()<35)camera.position.copy(controls.target).add(v);},getState:()=>({explosion:targetExplosion,filter,selection,visibleParts:[...groups].filter(([,g])=>g.visible).map(([id])=>id),meshCount:[...groups.values()].reduce((n,g)=>n+g.children.length,0),subsystemCount:5,structuralContextVisible:structure.visible,subLayerCount:subLayers.length,subLayers:subLayers.map(l=>({part:l.mesh.userData.partId,distance:l.mesh.position.distanceTo(l.origin)}))})};
}
