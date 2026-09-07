import * as T from 'three';
export function buildNox(){
 const root=new T.Group();root.name='NOX';root.userData={author:'CORN',concept:'Hovering masked proof bearer. Fictional simulation.'};let serial=0;const rig={};
 const night=new T.MeshStandardMaterial({color:0x232842,roughness:.9,side:T.DoubleSide});
 const porcelain=new T.MeshStandardMaterial({color:0xe8e2d5,metalness:.1,roughness:.4});
 const brass=new T.MeshStandardMaterial({color:0xa7864b,metalness:.8,roughness:.3});
 const dark=new T.MeshStandardMaterial({color:0x10121e,metalness:.5,roughness:.55});
 const voidMat=new T.MeshBasicMaterial({color:0x04050c});
 const glow=new T.MeshStandardMaterial({color:0xd7dbff,emissive:0x939bf0,emissiveIntensity:2.2});
 const eyeMat=new T.MeshStandardMaterial({color:0x6b74d8,emissive:0x939bf0,emissiveIntensity:1.5});
 const amber=new T.MeshStandardMaterial({color:0xffdb8d,emissive:0xffa324,emissiveIntensity:2.0});
 function g(p,name,x=0,y=0,z=0){const o=new T.Group();o.name=name;o.position.set(x,y,z);p.add(o);return o;}
 function m(p,geo,mat,x=0,y=0,z=0){const o=new T.Mesh(geo,mat);o.name='NoxPart'+serial++;o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o;}
 function ball(p,mat,x,y,z,a,b=a,c=a){const o=m(p,new T.SphereGeometry(1,40,28),mat,x,y,z);o.scale.set(a,b,c);return o;}
 function cyl(p,mat,x,y,z,r1,r2,h){return m(p,new T.CylinderGeometry(r1,r2,h,32),mat,x,y,z);}
 function ring(p,mat,x,y,z,r,t,axis='z'){const o=m(p,new T.TorusGeometry(r,t,10,40),mat,x,y,z);if(axis==='y')o.rotation.x=Math.PI/2;if(axis==='x')o.rotation.y=Math.PI/2;return o;}

 // The whole figure hovers: there are no legs, and the cloak closes into the air below.
 const body=rig.body=g(root,'NoxBody',0,.66,0);

 // Cloak: a lathe from the sealed hem up to the shoulders. Vertices are waved every frame in tick().
 // Tall and narrow on purpose: the figure should read as a wraith, not a gnome.
 const profile=[[.001,-.62],[.08,-.60],[.16,-.52],[.215,-.40],[.255,-.22],[.27,-.02],[.265,.14],[.235,.26],[.18,.34],[.115,.40],[.08,.42]];
 const cloakGeo=new T.LatheGeometry(profile.map(p=>new T.Vector2(p[0],p[1])),64);
 const cloak=m(body,cloakGeo,night);cloak.name='NoxCloak';
 const cloakBase=cloakGeo.attributes.position.array.slice();
 const hemY=-.62,topY=.42;
 function waveCloak(t,power){
  const pos=cloakGeo.attributes.position;
  for(let i=0;i<pos.count;i++){
   const x=cloakBase[i*3],y=cloakBase[i*3+1],z=cloakBase[i*3+2];
   const f=Math.pow(1-(y-hemY)/(topY-hemY),2);// strongest at the hem, still at the shoulders
   const a=Math.atan2(x,z);
   pos.setXYZ(i,
    x+Math.sin(3*a+t*2.4)*.028*f*(.4+power),
    y+Math.sin(2*a-t*1.7)*.012*f*(.3+power),
    z-f*f*.15*power+Math.cos(2*a-t*1.9)*.02*f*(.4+power));
  }
  pos.needsUpdate=true;cloakGeo.computeVertexNormals();
 }
 waveCloak(0,0);

 // Hood: an open shell over a pocket of darkness. Only the mask inside catches light.
 const head=rig.head=g(body,'NoxHead',0,.52,.01);
 const hoodGeo=new T.SphereGeometry(.205,48,32,Math.PI*.28,Math.PI*1.44);
 const hood=m(head,hoodGeo,night);hood.rotation.y=Math.PI/2;hood.scale.set(1.05,1.18,1.08);hood.rotation.x=-.12;
 const peak=m(head,new T.ConeGeometry(.07,.18,24),night,0,.20,-.13);peak.rotation.x=1.25;// the hood folds back into a soft point
 ball(head,voidMat,0,-.005,.0,.15,.17,.12);// darkness inside the hood
 // Mask: featureless porcelain, noh proportions. Two narrow slits of light are the only face.
 const mask=g(head,'NoxMask',0,.005,.09);mask.rotation.x=-.10;
 ball(mask,porcelain,0,0,0,.088,.12,.038);
 for(const s of [-1,1]){
  const slit=m(mask,new T.BoxGeometry(.042,.0042,.008),eyeMat,s*.040,.012,.035);
  slit.rotation.z=s*.10;slit.rotation.y=s*.30;slit.castShadow=false;
 }

 // Sleeves end in small porcelain hands; the right hand carries the lantern.
 for(const s of [-1,1]){
  const arm=rig['arm'+s]=g(body,'NoxArm'+s,s*.23,.26,.07);
  // The hand lives at the sleeve tip inside one tilted group, so they can never drift apart.
  const sleeve=g(arm,'NoxSleeve'+s,0,0,0);sleeve.rotation.z=s*.42;sleeve.rotation.x=-.60;
  cyl(sleeve,night,0,-.18,0,.05,.095,.36);
  ball(sleeve,porcelain,0,-.37,0,.034,.040,.030);
 }
 // Shuttered lantern: vertical slats with narrow gaps. It never opens; light only leaks.
 const lantern=rig.lantern=g(body,'NoxLantern',.36,-.10,.25);
 cyl(lantern,brass,0,.08,0,.012,.012,.14);// hanger stem up to the right hand
 ring(lantern,brass,0,.045,0,.030,.006);
 cyl(lantern,brass,0,0,0,.075,.082,.025);
 for(let j=0;j<7;j++){
  const a=j/7*Math.PI*2;
  const slat=m(lantern,new T.BoxGeometry(.052,.170,.012),dark,Math.sin(a)*.066,-.098,Math.cos(a)*.066);
  slat.rotation.y=a;
 }
 const flame=ball(lantern,amber,0,-.098,0,.047);flame.castShadow=false;
 const lampLight=new T.PointLight(0xffa324,.5,1.6);lampLight.position.set(0,-.098,0);lantern.add(lampLight);
 cyl(lantern,brass,0,-.196,0,.082,.070,.025);
 ball(lantern,brass,0,-.222,0,.016,.020,.016);

 // Night motes: a few slow embers that orbit the figure. Pure atmosphere.
 const motes=[];
 for(let j=0;j<5;j++){
  const mote=ball(root,glow,0,0,0,.0075);mote.castShadow=false;
  motes.push({mote,r:.48+j*.075,h:.32+j*.14,phase:j*2.4,speed:.25+j*.06});
 }

 // Clips are sampled from pose() exactly like the other characters.
 const nodes=Object.values(rig),clips=[];
 function pose(mode,t){
  if(mode==='Idle'){
   const w=t*Math.PI/2;// one full cycle over the 4s loop
   body.position.set(0,.58+.045*Math.sin(w),0);body.rotation.set(.01*Math.sin(w+.7),0,.025*Math.sin(w+1.3));
   head.rotation.set(0,.07*Math.sin(w+2.1),.015*Math.sin(w));
   for(const s of [-1,1])rig['arm'+s].rotation.set(.04*Math.sin(w+s),0,0);
   lantern.rotation.set(.02*Math.sin(w),0,.06*Math.sin(w+.9));lantern.position.set(.36,-.10+.008*Math.sin(w+.4),.25);
  }else{// Drift: pitched into the glide, everything trailing
   const w=t*Math.PI*2/3;// one full cycle over the 3s loop
   body.position.set(0,.58+.03*Math.sin(2*w),0);body.rotation.set(.17+.015*Math.sin(2*w),0,.02*Math.sin(w));
   head.rotation.set(-.10,.04*Math.sin(w),0);
   for(const s of [-1,1])rig['arm'+s].rotation.set(-.22+.03*Math.sin(w+s),0,s*.06);
   lantern.rotation.set(-.18+.03*Math.sin(2*w),0,.04*Math.sin(w));lantern.position.set(.36,-.08,.21);
  }
 }
 for(const [name,duration] of [['Idle',4],['Drift',3]]){
  const times=[],data=nodes.map(()=>({p:[],q:[]}));
  for(let i=0;i<=duration*30;i++){const t=i/30;pose(name,t);times.push(t);nodes.forEach((o,j)=>{data[j].p.push(...o.position.toArray());data[j].q.push(...o.quaternion.toArray());});}
  const tracks=[];nodes.forEach((o,j)=>{tracks.push(new T.VectorKeyframeTrack(o.name+'.position',times,data[j].p),new T.QuaternionKeyframeTrack(o.name+'.quaternion',times,data[j].q));});
  clips.push(new T.AnimationClip(name,duration,tracks));
 }
 pose('Idle',0);

 let boost=0;
 return{root,rig,clips,tick(t,motion='Idle',proof=0){
  boost=T.MathUtils.lerp(boost,motion==='Drift'?1:.18,.08);
  waveCloak(t,boost);
  lampLight.intensity=.45+.15*Math.sin(t*11)+.08*Math.sin(t*23)+proof*.9;
  amber.emissiveIntensity=1.8+.5*Math.sin(t*13)+proof*1.6;
  glow.emissiveIntensity=2.0+.5*Math.sin(t*1.7)+proof*1.2;
  eyeMat.emissiveIntensity=1.4+.35*Math.sin(t*1.7)+proof*1.0;
  for(const {mote,r,h,phase,speed} of motes){
   const a=t*speed+phase;
   mote.position.set(Math.sin(a)*r,h+.12*Math.sin(a*1.7),Math.cos(a)*r);
   mote.scale.setScalar(.0075*(1+.4*Math.sin(a*3.1)));
  }
 }};
}
