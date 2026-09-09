import * as T from 'three';
// Clip each street centreline against each canal strip. The resulting span is
// the actual bridge length, including diagonal crossings; never a guessed tile.
export function buildCanalCrossings(streets,deckMaterial,metal){
 const root=new T.Group();root.name='RoadAlignedCanalBridges';const spans=[];
 const add=(geo,mat,x,y,z,a=0)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.y=a;m.castShadow=m.receiveShadow=true;root.add(m);return m;};
 for(let k=0;k<6;k++){
  const a=Math.PI-k*Math.PI/3,dx=Math.sin(a),dz=Math.cos(a),px=dz,pz=-dx;
  for(const s of streets){
   const ax=s.a.x*dx+s.a.z*dz,az=s.a.x*px+s.a.z*pz,bx=s.b.x*dx+s.b.z*dz,bz=s.b.x*px+s.b.z*pz;
   const vx=bx-ax,vz=bz-az;if(Math.abs(vz)<.05)continue;
   let lo=0,hi=1;for(const [v,d,min,max] of [[ax,vx,25.8,91],[az,vz,9.35,11.65]]){if(Math.abs(d)<1e-8){if(v<min||v>max)hi=-1;continue;}const t1=(min-v)/d,t2=(max-v)/d;lo=Math.max(lo,Math.min(t1,t2));hi=Math.min(hi,Math.max(t1,t2));}
   if(hi<=lo)continue;
   const len=s.a.distanceTo(s.b),ux=(s.b.x-s.a.x)/len,uz=(s.b.z-s.a.z)/len,angle=Math.atan2(ux,uz),length=(hi-lo)*len+.8,t=(lo+hi)/2,cx=s.a.x+(s.b.x-s.a.x)*t,cz=s.a.z+(s.b.z-s.a.z)*t;
   if(spans.some(p=>Math.hypot(p.x-cx,p.z-cz)<1.8))continue;
   spans.push({x:cx,z:cz,length,width:s.width});
   // The walking surface stays coplanar with the street union above; only the
   // structural slab, girders and supports are added below it.
   add(new T.BoxGeometry(s.width+.25,.35,length),deckMaterial,cx,-.005,cz,angle);
   for(const side of [-1,1]){
    const x=cx+uz*side*(s.width/2-.18),z=cz-ux*side*(s.width/2-.18);
    add(new T.BoxGeometry(.19,.24,length),metal,x,-.29,z,angle);
    for(const end of [-1,1]){const ex=x+ux*end*(length/2-.15),ez=z+uz*end*(length/2-.15);add(new T.BoxGeometry(.5,1.38,.6),deckMaterial,ex,-.68,ez,angle);}
    const railX=cx+uz*side*(s.width/2+.04),railZ=cz-ux*side*(s.width/2+.04);
    for(const y of [.58,1.05])add(new T.BoxGeometry(.08,.085,length),metal,railX,y,railZ,angle);
    const posts=Math.max(2,Math.ceil(length/1.35));for(let j=0;j<=posts;j++){const t=-length/2+j*length/posts;add(new T.BoxGeometry(.095,.96,.095),metal,railX+ux*t,.61,railZ+uz*t,angle);add(new T.BoxGeometry(.24,.08,.24),deckMaterial,railX+ux*t,.20,railZ+uz*t,angle);}
   }
  }
 }
 root.userData.spans=spans;return root;
}
