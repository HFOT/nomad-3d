import * as T from 'three';
export function buildStreetFurniture(streets,houses,landmarks,M){
 const root=new T.Group();root.name='PublicGardensAndWaterworks';const batches=new Map(),dummy=new T.Object3D();
 const mats={stone:M.stone,metal:M.brass,dark:M.dark,wood:M.wood,soil:new T.MeshStandardMaterial({color:0x393b27,roughness:1}),leaf:new T.MeshStandardMaterial({color:0x526345,roughness:.95})};
 const geometries={box:new T.BoxGeometry(1,1,1),leaf:new T.IcosahedronGeometry(1,1),ring:new T.TorusGeometry(.32,.05,6,20),rod:new T.CylinderGeometry(1,1,1,10)};
 function instance(type,mat,x,y,z,sx,sy,sz,ry=0,rx=0){const key=type+mat;if(!batches.has(key))batches.set(key,{geo:geometries[type],mat:mats[mat],items:[]});dummy.position.set(x,y,z);dummy.rotation.set(rx,ry,0);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();batches.get(key).items.push(dummy.matrix.clone());}
 const distance=(s,x,z)=>{const dx=s.b.x-s.a.x,dz=s.b.z-s.a.z,l2=dx*dx+dz*dz,t=T.MathUtils.clamp(((x-s.a.x)*dx+(z-s.a.z)*dz)/l2,0,1);return Math.hypot(x-s.a.x-dx*t,z-s.a.z-dz*t)-s.width/2;};
 let gardens=0;
 for(let iz=-9;iz<=9&&gardens<24;iz++)for(let ix=-9;ix<=9&&gardens<24;ix++){
  const x=ix*10+Math.sin(iz)*1.8,z=iz*10,r=Math.hypot(x,z);if(r<36||r>105)continue;
  if(houses.some(b=>Math.hypot(x-b.x,z-b.z)<b.r+5))continue;
  if(landmarks.some(b=>x>b.min.x-5&&x<b.max.x+5&&z>b.min.z-5&&z<b.max.z+5))continue;
  const nearest=streets.reduce((a,b)=>distance(a,x,z)<distance(b,x,z)?a:b),d=distance(nearest,x,z);if(d<4.5||d>7.5)continue;
  let water=false;for(let k=0;k<6;k++){const a=Math.PI-k*Math.PI/3,along=x*Math.sin(a)+z*Math.cos(a),across=x*Math.cos(a)-z*Math.sin(a);if(along>25&&along<94&&Math.abs(across-10.5)<4)water=true;}if(water)continue;
  gardens++;const angle=Math.atan2(nearest.b.x-nearest.a.x,nearest.b.z-nearest.a.z),c=Math.cos(angle),s=Math.sin(angle);
  const at=(lx,lz)=>[x+c*lx+s*lz,z-s*lx+c*lz];
  for(const side of [-1,1]){let [xx,zz]=at(side*2.15,0);instance('box','stone',xx,.33,zz,.28,.5,2.9,angle);[xx,zz]=at(0,side*1.35);instance('box','stone',xx,.33,zz,4.4,.5,.28,angle);}
  instance('box','soil',x,.45,z,4.0,.15,2.4,angle);
  for(let i=0;i<8;i++){const [xx,zz]=at((i%4-1.5)*.88,(i<4?-.55:.55));instance('leaf','leaf',xx,.8+Math.sin(i)*.09,zz,.6,.55,.52,i);}
  const [bx,bz]=at(0,2.3);instance('box','wood',bx,.75,bz,3.4,.13,.7,angle);for(const off of [-1.2,1.2]){const [xx,zz]=at(off,2.3);instance('box','metal',xx,.4,zz,.12,.7,.5,angle);}
 }
 // Six working sluice assemblies at the canal heads: rack, hand wheel,
 // gate, masonry anchorage and inspection platform.
 for(let k=0;k<6;k++){
  const a=Math.PI-k*Math.PI/3,dx=Math.sin(a),dz=Math.cos(a),px=dz,pz=-dx,cx=dx*91+px*10.5,cz=dz*91+pz*10.5;
  for(const side of [-1,1]){const x=cx+px*side*1.55,z=cz+pz*side*1.55;instance('box','stone',x,.28,z,.65,.55,1.1,a);instance('rod','metal',x,1.04,z,.065,1.6,.065);}
  instance('box','metal',cx,1.83,cz,3.3,.18,.2,a);instance('box','dark',cx,-.52,cz,2.3,1.15,.12,a);
  instance('rod','metal',cx,.6,cz,.05,2.25,.05);instance('ring','metal',cx,1.77,cz,1,1,1,a,Math.PI/2);
  for(let j=0;j<4;j++)instance('box','metal',cx,1.77,cz,.035,.035,.6,a+j*Math.PI/4);
 }
 for(const {geo,mat,items} of batches.values()){const mesh=new T.InstancedMesh(geo,mat,items.length);items.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);}root.userData.gardens=gardens;return root;
}
