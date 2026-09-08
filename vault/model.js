import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {materials} from './materials.js';
export function buildVault(){
 const root=new T.Group(),shell=new T.Group(),staticParts=new T.Group();root.name='CARAKURI_Treasury_Citadel';root.userData={author:'CORN',description:'World flame treasury — architectural concept'};root.add(staticParts,shell);
 const M=materials();M.stone.color.setHex(0xb6aa92);M.brass.roughness=.38;
 const gold=new T.MeshStandardMaterial({color:0xd4a34d,metalness:.85,roughness:.28}),glass=new T.MeshPhysicalMaterial({color:0xe4d6b5,transparent:true,opacity:.13,roughness:.12,metalness:.1,side:T.DoubleSide,depthWrite:false}),banner=new T.MeshStandardMaterial({color:0x172e4c,roughness:.95,side:T.DoubleSide});
 const fires=[],gears=[],locks=[],lights=[];let open=1,target=1,energy=1;const shutters=[],steam=[];
 function mesh(g,m,x=0,y=0,z=0,p=staticParts){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o;}
 function box(m,x,y,z,w,h,d,p=staticParts){return mesh(new RoundedBoxGeometry(w,h,d,1,Math.min(.035,w*.08,h*.08,d*.08)),m,x,y,z,p);}
 function cylinder(m,x,y,z,r,h,p=staticParts,r2=r){return mesh(new T.CylinderGeometry(r2,r,h,32),m,x,y,z,p);}
 function torus(m,x,y,z,r,t=.04,p=staticParts){return mesh(new T.TorusGeometry(r,t,8,96),m,x,y,z,p);}
 function rod(m,a,b,r=.035,p=staticParts){const av=new T.Vector3(...a),v=new T.Vector3(...b).sub(av),o=cylinder(m,0,0,0,r,v.length(),p);o.position.copy(av).addScaledVector(v,.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;}
 function pipe(points,r=.1,p=staticParts,m=M.brass){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v))),48,r,10,false),m,0,0,0,p);}
 function arch(x,y,z,r,thick,depth,p=staticParts){const s=new T.Shape();s.absarc(0,0,r+thick,0,Math.PI,false);s.absarc(0,0,r,Math.PI,0,true);s.closePath();mesh(new T.ExtrudeGeometry(s,{depth,bevelEnabled:false}),M.stone,x,y,z,p);for(let i=0;i<25;i++){const a=(i+.5)/25*Math.PI,o=box(M.stone,x+Math.cos(a)*(r+thick*.5),y+Math.sin(a)*(r+thick*.5),z+depth+.018,(r+thick)*Math.PI/25*.96,thick*.88,.12,p);o.rotation.z=a-Math.PI/2;}}
 function masonry(x,y,z,w,h,d,p=staticParts){box(M.mortar,x,y+h/2,z,w,h,d,p);for(let row=0;row<Math.floor(h/.34);row++){for(let j=0;j<Math.ceil(w/.64);j++){let left=-w/2+j*.64,ww=Math.min(.625,w/2-left);if(ww<.03)continue;for(const side of [-1,1])box(M.stone,x+left+ww/2,y+.17+row*.34,z+side*d/2,ww,.323,.10,p);}}for(const yy of [y+.10,y+h-.1])box(M.stone,x,yy,z,w+.16,.18,d+.16,p);}
 function flame(x,y,z,r,h){const group=new T.Group();group.position.set(x,y,z);root.add(group);for(let layer=0;layer<3;layer++){const geo=new T.SphereGeometry(1,16,24);const mat=new T.ShaderMaterial({uniforms:{time:{value:0},tint:{value:new T.Color([0xff6e12,0xffbd39,0xfff1b1][layer])},alpha:{value:[.26,.55,.9][layer]},height:{value:h*(1-layer*.2)}},vertexShader:`varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec3 vP;uniform float time,alpha,height;uniform vec3 tint;float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}void main(){float y=vP.y/height;vec3 q=vP*vec3(8.,3.,8.)-vec3(0.,time*2.8,0.);float n=noise(q)*.65+noise(q*2.3)*.35;float a=smoothstep(.17+y*.2,.65,n)*(1.-smoothstep(.8,1.,y))*alpha;gl_FragColor=vec4(tint*(1.3+n),a);}`,transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide});const f=mesh(geo,mat,0,0,0,group);f.castShadow=false;fires.push({f,base:geo.attributes.position.array.slice(),r:r*(1-layer*.25),h:h*(1-layer*.2),seed:fires.length*.71});}return group;}
 function tank(x,y,z,r,h,light=false){cylinder(M.dark,x,y+.10,z,r*1.10,.20);for(const dy of [.25,h*.3,h*.7,h-.22]){cylinder(M.brass,x,y+dy,z,r*1.07,.13);torus(gold,x,y+dy+.08,z,r*1.08,.035).rotation.x=Math.PI/2;}const pane=mesh(new T.CylinderGeometry(r,r,h-.55,40,1,true),glass,x,y+h/2,z,root);pane.castShadow=false;
 for(let i=0;i<8;i++){const a=i*Math.PI/4;rod(M.brass,[x+Math.cos(a)*r,y+.2,z+Math.sin(a)*r],[x+Math.cos(a)*r,y+h-.2,z+Math.sin(a)*r],.035);for(const dy of [.25,h-.25])cylinder(gold,x+Math.cos(a)*r,y+dy,z+Math.sin(a)*r,.065,.2);}
 cylinder(M.brass,x,y+h,z,r*1.14,.18);const cap=mesh(new T.SphereGeometry(r*1.1,32,12,0,Math.PI*2,0,Math.PI/2),M.brass,x,y+h+.09,z);cap.scale.y=.6;rod(gold,[x,y+h+.3,z],[x,y+h+r*.9,z],.035);flame(x,y+.35,z,r*.68,h-.7);
 if(light){const l=new T.PointLight(0xffad48,18,r*6,2);l.position.set(x,y+h*.5,z);root.add(l);lights.push(l);} }
 function gear(x,y,z,r,n){const g=new T.Group();g.position.set(x,y,z);root.add(g);torus(M.brass,0,0,0,r*.8,r*.13,g);torus(gold,0,0,.05,r*.54,.025,g);const profile=new T.Shape();for(let i=0;i<n;i++)for(let k=0;k<8;k++){const a=(i+k/8)*Math.PI*2/n,rr=r*([.87,.87,.93,1.06,1.06,.93,.87,.87][k]);if(i===0&&k===0)profile.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);else profile.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}profile.closePath();const hole=new T.Path();hole.absarc(0,0,r*.60,0,Math.PI*2,true);profile.holes.push(hole);mesh(new T.ExtrudeGeometry(profile,{depth:.14,bevelEnabled:true,bevelSize:r*.016,bevelThickness:.012,bevelSegments:2}),M.brass,0,0,-.07,g);torus(M.dark,x,y,z-.11,r*.25,.065);for(let i=0;i<6;i++){const a=i*Math.PI/3;rod(M.brass,[0,0,0],[Math.cos(a)*r*.8,Math.sin(a)*r*.8,0],r*.07,g);}const hub=cylinder(gold,0,0,.04,r*.22,.25,g);hub.rotation.x=Math.PI/2;gears.push(g);}
 function railing(a,b,y){rod(M.brass,[a[0],y+.46,a[1]],[b[0],y+.46,b[1]],.026);rod(M.brass,[a[0],y+.15,a[1]],[b[0],y+.15,b[1]],.018);const len=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let i=0;i<=Math.ceil(len/.30);i++){const t=i/Math.ceil(len/.30);rod(M.brass,[T.MathUtils.lerp(a[0],b[0],t),y,a[1]+(b[1]-a[1])*t],[T.MathUtils.lerp(a[0],b[0],t),y+.48,a[1]+(b[1]-a[1])*t],.018);}}
 // Heavy foundation, paving and a supported approach bridge.
 box(M.dark,0,-.48,0,24,.8,16);box(M.stone,0,0,0,23,.35,13);
 for(let i=-17;i<=17;i++)for(let j=-8;j<=8;j++)box(M.stone,i*.65,.20,j*.65,.63,.07,.63);
 box(M.stone,0,-.05,9,4.8,.45,7);for(let i=0;i<10;i++)box(M.stone,0,-.07-i*.055,12.2+i*.20,5+i*.10,.18,.28);
 for(const s of [-1,1]){railing([s*2.28,6],[s*2.28,12.1],.2);for(const z of [6.5,9,11.5]){masonry(s*2,-1.3,z,.55,1.5,.65);tank(s*2.30,.3,z,.14,.75);}}
 // Central drum has a full back, lateral walls and a real open front aperture.
 masonry(0,.25,-4.25,10.2,8.9,.65,shell);for(const s of [-1,1])masonry(s*4.7,.25,-.6,.8,8.9,7.0,shell);
 // Front circular vault rings, thick stone arch and flanking load-bearing pylons.
 for(const s of [-1,1]){masonry(s*4.12,.25,3.1,1.55,9.1,1.55);for(const y of [.6,3,6.8,9.1])box(M.stone,s*4.12,y,3.1,1.9,.2,1.85);box(banner,s*4.12,6.6,4.0,.69,3.25,.035);for(const xx of [-.36,.36])rod(gold,[s*4.12+xx,5,4.03],[s*4.12+xx,8.24,4.03],.012);torus(gold,s*4.12,6.1,4.05,.20,.025);tank(s*4.12,9.3,3.1,.43,2.2,true);}
 arch(0,4.35,2.7,3.72,.65,.75);
 for(let k=0;k<5;k++){const radius=3.60-k*.19,z=3.6-k*.20;torus(k%2?gold:M.dark,0,4.35,z,radius,.14);torus(M.brass,0,4.35,z+.07,radius+.12,.035);}
 for(let i=0;i<64;i++){const a=i*Math.PI/32;const o=box(M.brass,Math.cos(a)*3.56,4.35+Math.sin(a)*3.56,3.73,.16,.25,.15);o.rotation.z=a-Math.PI/2;mesh(new T.SphereGeometry(.038,8,6),gold,Math.cos(a)*3.56,4.35+Math.sin(a)*3.56,3.84);}
 for(let i=0;i<12;i++){const a=i*Math.PI/6;gear(Math.cos(a)*3.23,4.35+Math.sin(a)*3.23,3.82,.22,i%2?12:16);const g=new T.Group();g.position.set(Math.cos(a)*2.91,4.35+Math.sin(a)*2.91,3.35);g.rotation.z=a;root.add(g);box(M.dark,0,0,0,.46,.20,.37,g);box(gold,-.18,0,.20,.08,.16,.07,g);locks.push({g,a});}
 // Inner furnace, stacked chambers and service galleries visible through the vault.
 tank(0,.42,-.6,1.10,7.3,true);
 for(const s of [-1,1])for(const z of [-2.8,.5]){tank(s*2.65,.45,z,.40,2.25);tank(s*2.65,3.3,z,.40,2.25);tank(s*2.65,6.1,z,.40,2.15);}
 for(const y of [3,5.85,8.45]){for(const s of [-1,1]){box(M.dark,s*2.55,y,-1.2,1.25,.16,5.4);railing([s*1.94,-3.9],[s*1.94,1.5],y+.1);}box(M.dark,0,y,-3.5,4,.16,.75);railing([-2,-3.08],[2,-3.08],y+.1);for(const s of [-1,1])rod(M.brass,[s*2.3,y-.65,-3.5],[s*1.95,y,-3.5],.065);}
 for(const s of [-1,1]){for(let i=0;i<34;i++)rod(M.brass,[s*3.8,.45+i*.23,-2],[s*3.8,.45+i*.23,-1.5],.025);for(const z of [-2,-1.5])rod(M.brass,[s*3.8,.4,z],[s*3.8,8.4,z],.035);}
 // Side halls: masonry arcades surround separate flame silos.
 for(const s of [-1,1]){for(let j=0;j<3;j++){const x=s*(5.75+j*1.75);masonry(x,.25,-2.4,1.7,5.55,.5);for(const dx of [-.84,.84])masonry(x+dx,.25,.65,.30,4.05,.95);arch(x,4.25,.2,.69,.20,.75);tank(x,.4,-.05,.49,3.8,j===1);box(M.stone,x,5.3,-.6,1.86,.22,4);}
 masonry(s*10.7,.25,-.6,.6,5.4,4.1);for(const x of [s*5.0,s*10.6]){masonry(x,.3,.4,.65,6.0,.75);tank(x,6.4,.4,.29,1.45);}
 // Slate pitched wing roofs with continuous deck and individually laid tiles.
 for(const side of [-1,1]){const rr=new T.Group();rr.position.set(s*7.9,5.6,-.7);rr.rotation.x=side*.42;shell.add(rr);box(M.slate,0,0,side*1,5.5,.14,2.15,rr);for(let row=0;row<8;row++)for(let col=0;col<20;col++)box(M.slate,-2.65+col*.28,.09,side*(.1+row*.255),.275,.045,.30,rr);}
 pipe([[s*1.2,1,-.6],[s*1.7,1,-.8],[s*1.7,7.9,-.8],[s*6,7.9,-.8],[s*9.4,7.9,-.8],[s*9.4,4.7,-.8]],.14);
 // Horizontal glass energy conduit with metal flanges, flowing flame pulses.
 rod(M.dark,[s*5,7.8,-.7],[s*10,7.8,-.7],.26);rod(gold,[s*5,7.8,-.7],[s*10,7.8,-.7],.12);for(let j=0;j<12;j++){const x=s*(5+j*.44);const r=torus(M.brass,x,7.8,-.7,.29,.045);r.rotation.y=Math.PI/2;}for(let j=0;j<6;j++)flame(s*(5.3+j*.8),7.68,-.7,.12,.30);
 }
 // Monumental ribbed dome and lantern crown, with genuine rear geometry.
 cylinder(M.stone,0,9.0,-.7,4.72,.5,shell);const dome=mesh(new T.SphereGeometry(4.65,80,32,0,Math.PI*2,0,Math.PI/2),M.slate,0,9.2,-.7,shell);dome.scale.y=.60;
 for(let j=0;j<24;j++){const a=j*Math.PI/12,pts=[];for(let k=0;k<=24;k++){const b=k/24*Math.PI/2;pts.push([Math.cos(a)*Math.sin(b)*4.70,9.2+Math.cos(b)*2.80,-.7+Math.sin(a)*Math.sin(b)*4.70]);}pipe(pts,.037,shell,gold);}
 for(let row=1;row<14;row++){const b=row/14*Math.PI/2,r=Math.sin(b)*4.67;const ring=torus(M.brass,0,9.2+Math.cos(b)*2.80,-.7,r,.015,shell);ring.rotation.x=Math.PI/2;}
 cylinder(M.stone,0,12.08,-.7,.82,.32,shell);tank(0,12.25,-.7,.53,1.7,true);
 // Buttresses transfer the vault mass into the plinth; rear service machinery.
 for(const s of [-1,1])for(const z of [-3.5,-1,1.6]){box(M.stone,s*4.95,1.5,z,1.35,2.5,1);box(M.stone,s*4.85,3.6,z,.95,1.7,.8);box(M.stone,s*4.77,5.1,z,.65,1.3,.6);}
 for(const x of [-3,0,3]){masonry(x,.3,-4.8,.9,4,.8);pipe([[x,.6,-5.4],[x,3.5,-5.4],[x,4,-4.3]],.16);gear(x,2.1,-5.5,.38,16);}
 for(const s of [-1,1]){railing([s*3,5.4],[s*10.8,5.4],.26);for(const x of [3.4,6.7,10])tank(s*x,.34,5.4,.16,.9);}

 // Solid spandrel closes the stonework above the arch without blocking the opening.
 const sp=new T.Shape();sp.moveTo(-3.75,9.12);sp.lineTo(3.75,9.12);sp.lineTo(3.75,4.35);sp.absarc(0,4.35,3.75,0,Math.PI,false);sp.lineTo(-3.75,9.12);mesh(new T.ExtrudeGeometry(sp,{depth:.64,bevelEnabled:false}),M.stone,0,0,2.7);
 for(const side of [-1,1]){for(let row=0;row<25;row++)for(let j=0;j<11;j++)box(M.stone,side*5.15,.46+row*.34,-3.95+j*.64,.10,.322,.62,shell);
 for(const z of [-3.7,-1.3,1.1]){box(M.stone,side*5.25,5.1,z,.18,6.9,.27,shell);box(M.stone,side*5.28,8.7,z,.28,.23,.50,shell);}
 for(const z of [-2.7,-.3]){box(M.dark,side*5.22,6.7,z,.08,1.7,.62,shell);for(const dz of [-.34,.34])box(M.stone,side*5.3,6.7,z+dz,.22,1.9,.12,shell);for(const yy of [5.8,7.6])box(M.stone,side*5.3,yy,z,.26,.15,.80,shell);rod(gold,[side*5.33,5.9,z],[side*5.33,7.5,z],.027,shell);}
 }
 // Slate courses track the dome surface; overlapping edges create real relief.
 for(let row=0;row<19;row++){const b=.12+row*.075,count=Math.max(20,Math.floor(Math.sin(b)*125));for(let j=0;j<count;j++){const aa=(j+.5*(row%2))/count*Math.PI*2,g=new T.PlaneGeometry(1,1,1,1),p=g.attributes.position;for(let k=0;k<p.count;k++){const a=aa+p.getX(k)*Math.PI*2/count*.985,bb=b+p.getY(k)*.083;p.setXYZ(k,Math.cos(a)*Math.sin(bb)*4.685,9.2+Math.cos(bb)*2.816,-.7+Math.sin(a)*Math.sin(bb)*4.685);}g.computeVertexNormals();mesh(g,M.slate,0,0,0,shell);}}
 // Repeating cornice dentils and column flutes give human scale to the monumental shell.
 for(let j=0;j<43;j++)box(M.stone,-4.6+j*.22,9.02,3.28,.12,.21,.23);
 for(const side of [-1,1]){for(const dx of [-.62,.62]){rod(M.stone,[side*4.12+dx,.55,4.00],[side*4.12+dx,8.9,4.00],.10);for(const y of [.65,8.85])cylinder(M.brass,side*4.12+dx,y,4,.15,.10);}for(let j=0;j<18;j++)box(gold,side*4.12,4.75+j*.185,4.03,.07,.04,.025);}
 // Continuous foundation walls and arch-supported bridge communicate load paths.
 for(const side of [-1,1]){masonry(side*10.8,-1.1,.3,.65,1.2,11.5);for(const z of [6.3,8.8,11.3]){arch(0,-2.12,z,1.55,.28,.42);}}
 for(let row=0;row<27;row++)for(let j=0;j<8;j++)box(M.stone,-2.10+j*.59,.19,5.55+row*.25,.57,.07,.24);

 // Three independently phased rotary shutter cassettes with overlapping telescopic leaves.
 for(let layer=0;layer<3;layer++){
 const rotor=new T.Group();rotor.position.set(0,4.35,3.26-layer*.25);rotor.name='RotaryVaultLayer'+layer;root.add(rotor);
 torus(M.brass,0,0,0,3.02,.09,rotor);torus(gold,0,0,.10,3.12,.025,rotor);
 for(let j=0;j<96;j++){const a=j*Math.PI/48,o=box(M.brass,Math.cos(a)*3.09,Math.sin(a)*3.09,0,.065,.14,.14,rotor);o.rotation.z=a;}
 const leaves=[];for(let j=0;j<12;j++){
 const angle=j*Math.PI/6,geo=new T.BufferGeometry(),coords=[],indices=[];const n=8;
 for(let side=0;side<2;side++)for(let k=0;k<=n;k++)for(let edge=0;edge<2;edge++)coords.push(0,0,side*.14);
 const stride=(n+1)*2;for(let side=0;side<2;side++)for(let k=0;k<n;k++){let a=side*stride+k*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}for(let k=0;k<n;k++)for(let edge=0;edge<2;edge++){let a=k*2+edge;indices.push(a,a+2,a+stride,a+2,a+stride+2,a+stride);}for(const k of [0,n]){let a=k*2;indices.push(a,a+stride,a+1,a+1,a+stride,a+stride+1);}
 geo.setAttribute('position',new T.Float32BufferAttribute(coords,3));geo.setIndex(indices);const plateMat=(layer===1?M.brass:M.dark).clone();plateMat.side=T.DoubleSide;plateMat.color.setHex(layer===1?0x947143:0x46535c);plateMat.metalness=.8;plateMat.roughness=.36;const leaf=mesh(geo,plateMat,0,0,0,rotor);leaf.frustumCulled=false;const rib=box(M.brass,0,0,.155,1,.035,.035,rotor);const bolt=mesh(new T.SphereGeometry(.045,10,8),gold,0,0,.18,rotor);leaves.push({leaf,angle,n,stride,rib,bolt});
 const pin=cylinder(gold,Math.cos(angle)*2.99,Math.sin(angle)*2.99,.13,.048,.08,rotor);pin.rotation.x=Math.PI/2;
 }shutters.push({rotor,leaves,layer});
 }
 // Glazed control room is carried by the right-hand service gallery.
 const cx=2.62,cy=3.20,cz=.50;
 box(M.stone,cx,cy,cz,1.82,.22,2.0);box(M.dark,cx,cy+.06,cz,1.64,.05,1.83);
 for(const dx of [-.84,.84])for(const dz of [-.92,.92])rod(M.brass,[cx+dx,cy,cz+dz],[cx+dx,cy+1.65,cz+dz],.048);
 box(M.brass,cx,cy+1.67,cz,1.88,.13,2.08);
 for(const dz of [-.93,.93]){box(glass,cx,cy+.95,cz+dz,1.6,1.30,.025,root);rod(M.brass,[cx-.82,cy+.48,cz+dz],[cx+.82,cy+.48,cz+dz],.025);}
 box(M.dark,cx,cy+.4,cz+.35,1.40,.55,.55);const desk=box(M.brass,cx,cy+.72,cz+.35,1.48,.065,.65);desk.rotation.x=.18;
 for(let j=0;j<5;j++){const xx=cx-.54+j*.27;torus(gold,xx,cy+.83,cz+.62,.09,.012);const dial=mesh(new T.CircleGeometry(.077,24),M.stone,xx,cy+.83,cz+.615);rod(M.dark,[xx,cy+.83,cz+.64],[xx+.035,cy+.87,cz+.64],.006);rod(gold,[xx,cy+.77,cz+.33],[xx,cy+.95,cz+.28],.012);}
 const indicator=new T.MeshStandardMaterial({color:0xffc877,emissive:0xff9a28,emissiveIntensity:1.4});for(let i=0;i<6;i++)box(indicator,cx-.55+i*.22,cy+.82,cz+.05,.07,.035,.08);
 for(const z of [-.15,.1,.35])pipe([[3.35,3.5,z],[3.8,3.5,z],[3.8,1.2,z],[1.25,1.2,z]],.043);


 // Armoured perimeter and furnace exhausts are anchored into the foundations.
 for(const side of [-1,1]){
 for(const z of [-4.1,-1.4,1.3]){box(M.stone,side*10.9,1.7,z,1.15,3.3,1.25);box(M.dark,side*10.9,1.8,z,1.24,.22,1.34);box(M.stone,side*10.9,3.35,z,1.38,.24,1.45);}
 for(const z of [-3.1,.0]){masonry(side*11.0,.2,z,.7,2.5,1.7);for(let i=0;i<3;i++)box(M.stone,side*11,2.9,z-.55+i*.55,.86,.55,.30);}
 for(const z of [-3,-.8]){const x=side*5.6;cylinder(M.dark,x,6.4,z,.28,3.5);for(const yy of [4.9,5.6,7.3,8.1])cylinder(M.brass,x,yy,z,.35,.15);pipe([[side*3.3,2.2,z],[x,2.2,z],[x,4.9,z]],.21);steam.push({origin:new T.Vector3(x,8.25,z),seed:steam.length});}
 }
 // Soft volumetric-looking steam uses many independently drifting translucent puffs.
 const cvs=document.createElement('canvas');cvs.width=cvs.height=128;const ctx=cvs.getContext('2d'),grad=ctx.createRadialGradient(64,64,0,64,64,64);grad.addColorStop(0,'rgba(230,230,220,.45)');grad.addColorStop(.4,'rgba(220,226,228,.24)');grad.addColorStop(1,'rgba(200,215,230,0)');ctx.fillStyle=grad;ctx.fillRect(0,0,128,128);const smokeMap=new T.CanvasTexture(cvs),plumes=[];
 for(const emitter of steam)for(let i=0;i<15;i++){const mat=new T.MeshBasicMaterial({map:smokeMap,color:i%3?0xc0cbd4:0xffd09a,transparent:true,opacity:0,depthWrite:false});const puff=new T.Mesh(new T.PlaneGeometry(1,1),mat);puff.name='ContinuousFurnaceSteam';root.add(puff);plumes.push({puff,emitter,i});}


 // Closed lower spandrel: the circular portal is the only passage through the front wall.
 const sill=new T.Shape();sill.moveTo(-3.76,.24);sill.lineTo(3.76,.24);sill.lineTo(3.76,4.35);sill.absarc(0,4.35,3.76,0,-Math.PI,true);sill.lineTo(-3.76,.24);sill.closePath();
 mesh(new T.ExtrudeGeometry(sill,{depth:1.15,bevelEnabled:false}),M.stone,0,0,2.48);
 for(let row=0;row<11;row++){const y=.40+row*.34;for(let j=0;j<12;j++){const x=-3.5+j*.636;if(Math.hypot(x,y-4.35)>3.91)box(M.stone,x,y,3.67,.615,.32,.12);}}
 // Inner steel threshold seals against the lowest shutter cassette, with supported access steps.
 box(M.dark,0,.88,3.04,1.50,1.24,1.2);box(M.brass,0,1.51,3.15,1.58,.10,1.45);
 for(let i=0;i<7;i++){const h=.18*(7-i);box(M.stone,0,.24+h/2,3.95+i*.30,1.62,h,.32);box(M.brass,0,.24+h,3.96+i*.30,1.65,.035,.035);}
 for(const side of [-1,1]){rod(M.brass,[side*.88,1.98,3.8],[side*.88,.8,5.8],.035);for(let i=0;i<4;i++)rod(M.brass,[side*.88,1.45-i*.31,3.9+i*.55],[side*.88,1.98-i*.31,3.9+i*.55],.026);}

 // Batch opaque architectural pieces by material to keep the detailed scene practical.
 function batch(group){group.updateMatrixWorld(true);const groups=new Map();group.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);if(g.index) {const flat=g.toNonIndexed();g.dispose();groups.set(o.material,[...(groups.get(o.material)||[]),flat]);}else groups.set(o.material,[...(groups.get(o.material)||[]),g]);});group.clear();for(const [m,gs] of groups){const merged=mergeGeometries(gs,false);if(merged){const o=new T.Mesh(merged,m);o.castShadow=o.receiveShadow=true;group.add(o);}gs.forEach(g=>g.dispose());}}
 batch(staticParts);batch(shell);
 return {root,roof:shell,setOpen(v){shell.visible=!v;},setLock(v){target=v?0:1;},setEnergy(v){energy=T.MathUtils.clamp(v,.15,1.5);},tick(t,dt=.016,camera){open=T.MathUtils.damp(open,target,1.6,dt);
 for(const {puff,emitter,i} of plumes){const phase=(t*.105+i/15+emitter.seed*.17)%1,drift=Math.sin(phase*4+emitter.seed);if(camera)puff.quaternion.copy(camera.quaternion);puff.position.copy(emitter.origin).add(new T.Vector3(phase*1.2+drift*phase*.35,phase*5.5,phase*.45));puff.scale.setScalar(.32+phase*2.1);puff.material.opacity=Math.sin(Math.PI*phase)*.27*(.6+energy*.4);}

 for(const {rotor,leaves,layer} of shutters){const phase=T.MathUtils.smoothstep(open,layer*.12,.76+layer*.12);rotor.rotation.z=(layer%2?-1:1)*phase*1.15+layer*.15;const inner=phase*2.93;for(const {leaf,angle,n,stride,rib,bolt} of leaves){const rr=(inner+3.03)/2,aa=angle+.025;rib.position.set(Math.cos(aa)*rr,Math.sin(aa)*rr,.16);rib.rotation.z=aa;rib.scale.x=Math.max(.02,3.03-inner);bolt.position.set(Math.cos(aa)*(inner+.08),Math.sin(aa)*(inner+.08),.19);const p=leaf.geometry.attributes.position;for(let side=0;side<2;side++)for(let k=0;k<=n;k++)for(let edge=0;edge<2;edge++){const a=angle+k/n*(Math.PI/6+.006),r=edge?3.03:inner;p.setXYZ(side*stride+k*2+edge,Math.cos(a)*r,Math.sin(a)*r,side*.14);}p.needsUpdate=true;leaf.geometry.computeVertexNormals();}}
for(const {g,a} of locks)g.position.set(Math.cos(a)*(2.64+open*.27),4.35+Math.sin(a)*(2.64+open*.27),3.35);gears.forEach((g,i)=>g.rotation.z=(i%2?1:-1)*(1-open)*12);for(const {f,base,r,h,seed} of fires){f.material.uniforms.time.value=t+seed;const p=f.geometry.attributes.position;for(let i=0;i<p.count;i++){const yy=(base[i*3+1]+1)/2,taper=Math.pow(Math.sin(Math.PI*yy),.7)*(1-yy*.6);p.setXYZ(i,base[i*3]*r*taper+Math.sin(yy*8-t*4+seed)*r*.24*yy,yy*h*(.4+energy*.6),base[i*3+2]*r*taper+Math.cos(yy*11-t*3+seed)*r*.12*yy);}p.needsUpdate=true;}lights.forEach((l,i)=>l.intensity=(16+Math.sin(t*4+i)*1.5)*energy);},getStats(){return {flameLayers:fires.length,gears:gears.length,locks:locks.length,cutaway:!shell.visible,lockOpen:open,rotaryLayers:shutters.length,steamPuffs:plumes.length,energy};}};
}

