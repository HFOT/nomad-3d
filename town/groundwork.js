import * as T from 'three';

export function stoneSurface(kind='ground'){
 const size=1024,c=document.createElement('canvas'),h=document.createElement('canvas'),rough=document.createElement('canvas');c.width=c.height=h.width=h.height=rough.width=rough.height=size;
 const ctx=c.getContext('2d'),hc=h.getContext('2d'),rc=rough.getContext('2d');
 ctx.fillStyle='#615e53';ctx.fillRect(0,0,size,size);hc.fillStyle='#555';hc.fillRect(0,0,size,size);rc.fillStyle='#eee';rc.fillRect(0,0,size,size);
 let seed=2159;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const bw=kind==='wall'?128:64,bh=kind==='wall'?64:48;
 for(let row=0;row*bh<size;row++)for(let x=-bw;x<size;x+=bw){const xx=x+(row%2?bw/2:0),yy=row*bh,v=115+rand()*30;
  ctx.fillStyle=`rgb(${v+13},${v+10},${v})`;ctx.fillRect(xx+1,yy+1,bw-2,bh-2);
  hc.fillStyle=`rgb(${175+row%4*8},${175+row%4*8},${175+row%4*8})`;hc.fillRect(xx+2,yy+2,bw-4,bh-4);
  ctx.strokeStyle='#e9e3ca35';ctx.strokeRect(xx+2.5,yy+2.5,bw-5,bh-5);ctx.fillStyle='#302d2729';ctx.fillRect(xx+3,yy+bh-4,bw-5,2);
  if(rand()<.19){ctx.strokeStyle='#373e333a';ctx.beginPath();ctx.moveTo(xx+rand()*bw,yy);ctx.lineTo(xx+bw*.5,yy+bh*.55);ctx.lineTo(xx+bw*.65,yy+bh);ctx.stroke();}
 }
 const pixels=ctx.getImageData(0,0,size,size);for(let i=0;i<pixels.data.length;i+=4){const n=(rand()-.5)*16;pixels.data[i]+=n;pixels.data[i+1]+=n;pixels.data[i+2]+=n;}ctx.putImageData(pixels,0,0);
 for(let i=0;i<8000;i++){rc.fillStyle=`rgba(20,25,20,${rand()*.15})`;rc.fillRect(rand()*size,rand()*size,rand()*15+1,rand()*12+1);}
 const texture=(canvas,srgb=false)=>{const t=new T.CanvasTexture(canvas);if(srgb)t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;return t;};
 return new T.MeshStandardMaterial({color:kind==='ground'?0xbac2b8:0xe1ded0,map:texture(c,true),bumpMap:texture(h),bumpScale:kind==='wall'?.13:.055,roughnessMap:texture(rough),roughness:.93,metalness:.02});
}
const circle=(r,n=96)=>Array.from({length:n},(_,i)=>[Math.cos(i*Math.PI*2/n)*r,Math.sin(i*Math.PI*2/n)*r]);
const hex=r=>Array.from({length:6},(_,i)=>[Math.cos(Math.PI/2+i*Math.PI/3)*r,Math.sin(Math.PI/2+i*Math.PI/3)*r]);
const cross=(a,b,p)=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
function clip(poly,a,b,inside){const out=[];for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],v=cross(a,b,p),w=cross(a,b,q),ip=inside?v>=-1e-7:v<=1e-7,iq=inside?w>=-1e-7:w<=1e-7;if(ip)out.push(p);if(ip!==iq){const t=v/(v-w);out.push([p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])]);}}return out;}
function subtract(poly,hole){const out=[];let rest=poly;for(let i=0;i<hole.length&&rest.length>=3;i++){const a=hole[i],b=hole[(i+1)%hole.length],part=clip(rest,a,b,false);if(part.length>=3)out.push(part);rest=clip(rest,a,b,true);}return out;}
function horizontal(polys,mat,y,name){const p=[],uv=[];for(const poly of polys)for(let i=1;i<poly.length-1;i++){if(Math.abs(cross(poly[0],poly[i],poly[i+1]))<1e-7)continue;for(const v of [poly[i+1],poly[i],poly[0]]){p.push(v[0],y,v[1]);uv.push(v[0]/8,v[1]/8);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();const m=new T.Mesh(g,mat);m.name=name;m.receiveShadow=true;return m;}

export function buildGroundwork(streets){
 const root=new T.Group();root.name='ExcavatedCityGround';const ground=stoneSurface(),wall=stoneSurface('wall');
 let land=subtract(hex(118),circle(28.4));
 const branches=[];
 for(let k=0;k<6;k++){const a=Math.PI-k*Math.PI/3,dx=Math.sin(a),dz=Math.cos(a),px=dz,pz=-dx;
  const pt=(r,w)=>[dx*r+px*w,dz*r+pz*w];
  const hole=[pt(25.8,9.35),pt(25.8,11.65),pt(91,11.65),pt(91,9.35)];
  // Order the cut anticlockwise before clipping the land surface.
  if(cross(hole[0],hole[1],hole[2])<0)hole.reverse();branches.push(hole);
  land=land.flatMap(poly=>subtract(poly,hole));
 }
 root.add(horizontal(land,ground,.075,'LandOutsideCanals'));
 root.add(horizontal([circle(23.2)],ground,.075,'ConstitutionIsland'));
 root.add(horizontal(subtract(hex(131.5),hex(124)),ground,.075,'OuterQuay'));
 const foundation=new T.Mesh(new T.CylinderGeometry(131.5,133,2.4,6),wall);foundation.position.y=-2.6;root.add(foundation);
 // Continuous vertical masonry banks descend well below the water line.
 const positions=[],uv=[];
 const vertical=(a,b)=>{const len=Math.hypot(b[0]-a[0],b[1]-a[1]);const vs=[[a[0],-.0,a[1]],[b[0],0,b[1]],[b[0],-1.45,b[1]],[a[0],-1.45,a[1]]];for(const i of [0,1,2,0,2,3]){positions.push(...vs[i]);uv.push(i===0||i===3?0:len/8,i<2?.18:0);}};
 const submerged=(x,z)=>{const r=Math.hypot(x,z);if(r>23.2&&r<28.4)return true;let hr=0;for(let k=0;k<6;k++){const a=Math.PI-(k+.5)*Math.PI/3;hr=Math.max(hr,(x*Math.sin(a)+z*Math.cos(a))/Math.cos(Math.PI/6));}if(hr>118&&hr<124)return true;return branches.some(b=>b.every((a,i)=>cross(a,b[(i+1)%b.length],[x,z])>=0));};
 for(const loop of [circle(23.2),circle(28.4),hex(118),hex(124),...branches])for(let i=0;i<loop.length;i++){
  const a=loop[i],b=loop[(i+1)%loop.length],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),steps=Math.ceil(len/.38);
  for(let j=0;j<steps;j++){const t=(j+.5)/steps,x=a[0]+dx*t,z=a[1]+dz*t,nx=dz/len*.08,nz=-dx/len*.08;
   if(submerged(x+nx,z+nz)===submerged(x-nx,z-nz))continue;
   vertical([a[0]+dx*j/steps,a[1]+dz*j/steps],[a[0]+dx*(j+1)/steps,a[1]+dz*(j+1)/steps]);
  }
 }
 const bg=new T.BufferGeometry();bg.setAttribute('position',new T.Float32BufferAttribute(positions,3));bg.setAttribute('uv',new T.Float32BufferAttribute(uv,2));bg.computeVertexNormals();const bankMat=wall.clone();bankMat.side=T.DoubleSide;const banks=new T.Mesh(bg,bankMat);banks.name='CanalRetainingWalls';banks.castShadow=banks.receiveShadow=true;root.add(banks);
 // Generous pedestrian promenade beside the outer moat, tied into every gate.
 const promenade=horizontal(subtract(hex(116.7),hex(112.5)),stoneSurface('promenade'),.12,'WallPromenade');root.add(promenade);
 // Drainage gratings, mooring rings and expansion joints are physical details
 // positioned by road edges rather than randomly scattered decorations.
 const dark=new T.MeshStandardMaterial({color:0x28312f,metalness:.7,roughness:.52}),bronze=new T.MeshStandardMaterial({color:0x80623d,metalness:.8,roughness:.4});
 const matrix=new T.Matrix4(),dummy=new T.Object3D(),slots=[],anchors=[];
 for(const s of streets){const dx=s.b.x-s.a.x,dz=s.b.z-s.a.z,len=Math.hypot(dx,dz),nx=dz/len,nz=-dx/len;if(len<10)continue;for(let t=6;t<len-2;t+=15){const x=s.a.x+dx*t/len+nx*(s.width/2-.35),z=s.a.z+dz*t/len+nz*(s.width/2-.35);for(let j=0;j<7;j++){dummy.position.set(x+dx/len*(j-3)*.075,.203,z+dz/len*(j-3)*.075);dummy.rotation.set(0,Math.atan2(dx,dz),0);dummy.scale.set(.45,.018,.027);dummy.updateMatrix();slots.push(dummy.matrix.clone());}}}
 const grates=new T.InstancedMesh(new T.BoxGeometry(1,1,1),dark,slots.length);slots.forEach((m,i)=>grates.setMatrixAt(i,m));root.add(grates);
 for(let i=0;i<36;i++){const a=i*Math.PI/18;dummy.position.set(Math.cos(a)*29.25,.22,Math.sin(a)*29.25);dummy.rotation.set(Math.PI/2,0,a);dummy.scale.setScalar(1);dummy.updateMatrix();anchors.push(dummy.matrix.clone());}
 const rings=new T.InstancedMesh(new T.TorusGeometry(.17,.035,6,16),bronze,anchors.length);anchors.forEach((m,i)=>rings.setMatrixAt(i,m));root.add(rings);
 root.userData={canalDepth:1.45,waterLevel:-.65,grates:slots.length/7};
 return {root,ground,walkables:root.children.filter(o=>o.name==='LandOutsideCanals'||o.name==='ConstitutionIsland'||o.name==='OuterQuay'||o.name==='WallPromenade')};
}

export function buildEntranceConnections(models,streets){
 const root=new T.Group();root.name='LandmarkEntranceAprons';const mat=stoneSurface('street');mat.color.setHex(0xded1b9);
 const polygons=[];
 for(const model of models){
  const e=model.root.userData.entry;if(!e)continue;const [x,,z]=e.position,dx=Math.sin(e.angle),dz=Math.cos(e.angle),cx=x+dx*1.2,cz=z+dz*1.2,width=Math.max(3,e.width);
  const rect=(ax,az,bx,bz,w)=>{const vx=bx-ax,vz=bz-az,len=Math.hypot(vx,vz);if(len<.01)return;const px=-vz/len*w/2,pz=vx/len*w/2;polygons.push([[ax+px,az+pz],[ax-px,az-pz],[bx-px,bz-pz],[bx+px,bz+pz]]);};
  rect(x-dx*.5,z-dz*.5,x+dx*3,z+dz*3,width);
  let target=null,best=Infinity;
  for(const s of streets){const vx=s.b.x-s.a.x,vz=s.b.z-s.a.z,t=T.MathUtils.clamp(((cx-s.a.x)*vx+(cz-s.a.z)*vz)/(vx*vx+vz*vz),0,1),px=s.a.x+vx*t,pz=s.a.z+vz*t,d=Math.hypot(px-cx,pz-cz);if(d<best){best=d;target=[px,pz];}}
  if(target&&best>.5)rect(cx,cz,target[0],target[1],Math.min(width,5));
 }
 root.add(horizontal(polygons,mat,.165,'GroundedEntranceConnections'));root.userData.entrances=models.length;return root;
}
