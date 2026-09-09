import * as T from 'three';

const cross=(a,b,p)=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
function clip(poly,a,b,inside){
 const out=[];if(!poly.length)return out;
 for(let i=0;i<poly.length;i++){
  const p=poly[i],q=poly[(i+1)%poly.length],dp=cross(a,b,p),dq=cross(a,b,q),ip=inside?dp>=-1e-8:dp<=1e-8,iq=inside?dq>=-1e-8:dq<=1e-8;
  if(ip)out.push(p);
  if(ip!==iq){const t=dp/(dp-dq);out.push([p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])]);}
 }return out;
}
function subtract(poly,rect){
 const out=[];let rest=poly;
 for(let i=0;i<4&&rest.length>=3;i++){const a=rect[i],b=rect[(i+1)%4],piece=clip(rest,a,b,false);if(piece.length>=3)out.push(piece);rest=clip(rest,a,b,true);}
 return out;
}
function contains(rect,p){return rect.every((a,i)=>cross(a,rect[(i+1)%4],p)>=-1e-7);}

// Exact polygon subtraction gives the union a single surface. Intersections
// have neither overlapping faces nor differently oriented texture islands.
export function buildStreetSurface(segments,material,curbMaterial){
 const rects=segments.map(({a,b,width})=>{const dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz),nx=-dz/l*width/2,nz=dx/l*width/2;return [[a.x+nx,a.z+nz],[a.x-nx,a.z-nz],[b.x-nx,b.z-nz],[b.x+nx,b.z+nz]];});
 const pos=[],uv=[];
 const triangle=(a,b,c)=>{for(const p of [c,b,a]){pos.push(p[0],.19,p[1]);uv.push(p[0]/4,p[1]/4);}};
 for(let i=0;i<rects.length;i++){
  let pieces=[rects[i]];
  for(let j=0;j<i&&pieces.length;j++)pieces=pieces.flatMap(p=>subtract(p,rects[j]));
  for(const p of pieces)for(let k=1;k<p.length-1;k++)if(Math.abs(cross(p[0],p[k],p[k+1]))>1e-7)triangle(p[0],p[k],p[k+1]);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();
 const root=new T.Group();root.name='ContinuousStreetNetwork';const surface=new T.Mesh(g,material);surface.receiveShadow=true;root.add(surface);
 // Exposed boundary only. Cutting every edge against all other rectangles
 // leaves open junction mouths instead of kerbs crossing the carriageway.
 const blocks=[],matrix=new T.Matrix4(),q=new T.Quaternion(),scale=new T.Vector3(),center=new T.Vector3();
 rects.forEach((r,i)=>r.forEach((a,k)=>{
  const b=r[(k+1)%4],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),cuts=[0,1];
  // The outside of this edge is the side away from the rectangle's centre —
  // never a fixed hand, since extended and court rectangles wind either way.
  const ccx=(r[0][0]+r[2][0])/2,ccz=(r[0][1]+r[2][1])/2,ex=(a[0]+b[0])/2-ccx,ez=(a[1]+b[1])/2-ccz;
  const out=(dz*ex-dx*ez)>0?1:-1,ox=out*dz/len*.04,oz=-out*dx/len*.04;
  rects.forEach((s,j)=>{if(i===j)return;s.forEach((c,n)=>{const d=s[(n+1)%4],ex=d[0]-c[0],ez=d[1]-c[1],den=dx*ez-dz*ex;if(Math.abs(den)<1e-8)return;const t=((c[0]-a[0])*ez-(c[1]-a[1])*ex)/den,u=((c[0]-a[0])*dz-(c[1]-a[1])*dx)/den;if(t>0&&t<1&&u>=0&&u<=1)cuts.push(t);});});
  cuts.sort((a,b)=>a-b);
  for(let n=0;n<cuts.length-1;n++){
   const lo=cuts[n],hi=cuts[n+1],mid=(lo+hi)/2,p=[a[0]+dx*mid+ox,a[1]+dz*mid+oz];
   // Slivers under 1.5 units only appear where several streets meet at an
   // angle; a kerb that short reads as debris, so the mouth stays open instead.
   if((hi-lo)*len<1.5||rects.some((r,j)=>j!==i&&contains(r,p)))continue;
   const count=Math.max(1,Math.ceil((hi-lo)*len/1.1));
   for(let k=0;k<count;k++){const t=lo+(hi-lo)*(k+.5)/count;center.set(a[0]+dx*t-ox*3.25,.22,a[1]+dz*t-oz*3.25);q.setFromAxisAngle(new T.Vector3(0,1,0),Math.atan2(dx,dz));scale.set(.24,.19,(hi-lo)*len/count-.025);matrix.compose(center,q,scale);blocks.push(matrix.clone());}
  }
 }));
 const curbs=new T.InstancedMesh(new T.BoxGeometry(1,1,1),curbMaterial,blocks.length);blocks.forEach((m,i)=>curbs.setMatrixAt(i,m));curbs.castShadow=curbs.receiveShadow=true;root.add(curbs);
 root.userData={segments:segments.length,triangles:pos.length/9,curbs:blocks.length};return root;
}
