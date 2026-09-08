import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { materials } from './materials.js';

// CARAKURI architectural fiction; catalogue names are illustrative, not legal records.
export const CATALOGUE = ['憲法原則', '権利と責任', '統治の記録', '審査の根拠', '公開と透明性'];
export function buildArchive() {
  const root = new T.Group(); root.name = 'CARAKURI_Constitutional_Archive';
  root.userData = { author: 'CORN', units: 'metres', description: 'Crystal public archive with rotating catalogue floors' };
  const architecture = new T.Group(), crystalShell = new T.Group();
  root.add(architecture, crystalShell);
  const M = materials(); M.stone.color.setHex(0xaca596); M.brass.roughness = .43;
  const gold = new T.MeshStandardMaterial({ color: 0xc0a15b, roughness: .30, metalness: .83 });
  const silver = new T.MeshStandardMaterial({ color: 0xbecbd2, roughness: .26, metalness: .75 });
  const paper = new T.MeshStandardMaterial({ color: 0xe3d5ae, roughness: .92 });
  const cool = new T.MeshStandardMaterial({ color: 0xb8e7ff, emissive: 0x8bbfff, emissiveIntensity: 2.4, roughness: .28 });
  const crystal = new T.MeshStandardMaterial({ color: 0xb5cbe6, metalness: 0, roughness: .18, transparent: true, opacity: .095, envMapIntensity: 0, side: T.FrontSide, depthWrite: false });// Standard, not Physical: the shell covers most of the frame
  const seamMat = new T.MeshBasicMaterial({ color: 0xb8c7ff, transparent: true, opacity: .46 });
  const libraryFloors = [], gears = [], seams = [], plasmaThreads = [], crystalTiers = [];
  const lift = new T.Group(); lift.name = 'Central_Index_Elevator'; root.add(lift);
  let time = 0, selected = -1, targetHeight = 9, arrived = false, shellVisible = true;
  let count = 0;

  function mesh(g, m, x = 0, y = 0, z = 0, p = architecture) {
    const o = new T.Mesh(g, m); o.name = `ArchivePart_${count++}`; o.position.set(x, y, z);
    o.castShadow = o.receiveShadow = !m.transparent; p.add(o); return o;
  }
  const box = (m, x, y, z, w, h, d, p = architecture) => mesh(new RoundedBoxGeometry(w, h, d, 1, Math.min(.045, w * .08, h * .08, d * .08)), m, x, y, z, p);
  const cyl = (m, x, y, z, r, h, p = architecture, rt = r, n = 32) => mesh(new T.CylinderGeometry(rt, r, h, n), m, x, y, z, p);
  function rod(m, a, b, r = .03, p = architecture) {
    const av = new T.Vector3(...a), v = new T.Vector3(...b).sub(av), o = cyl(m, 0, 0, 0, r, v.length(), p);
    o.position.copy(av).addScaledVector(v, .5); o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), v.normalize()); return o;
  }
  function pipe(points, r, m, p = architecture) { return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(v => new T.Vector3(...v))), points.length * 3, r, 8, false), m, 0, 0, 0, p); }
  function ring(r, y, m, thick = .04, p = architecture) { const o = mesh(new T.TorusGeometry(r, thick, 8, 96), m, 0, y, 0, p); o.rotation.x = Math.PI / 2; return o; }
  function annulus(ro, ri, y, h, m, p = architecture) {
    const shape = new T.Shape(); shape.absarc(0, 0, ro, 0, Math.PI * 2, false);
    const hole = new T.Path(); hole.absarc(0, 0, ri, 0, Math.PI * 2, true); shape.holes.push(hole);
    const o = mesh(new T.ExtrudeGeometry(shape, { depth: h, steps: 1, curveSegments: 64, bevelEnabled: false }), m, 0, y, 0, p); o.rotation.x = -Math.PI / 2; return o;
  }
  function radialBox(m, a, r, y, w, h, d, p = architecture) { const o = box(m, Math.sin(a) * r, y, Math.cos(a) * r, w, h, d, p); o.rotation.y = a; return o; }
  function rail(r, y, p = architecture, start = 0, end = Math.PI * 2) {
    const pts = []; for (let i = 0; i <= 64; i++) { const a = start + (end - start) * i / 64; pts.push([Math.sin(a) * r, y + .53, Math.cos(a) * r]); }
    pipe(pts, .022, gold, p);
    for (let i = 0; i <= 80; i++) { const a = start + (end - start) * i / 80; rod(M.brass, [Math.sin(a) * r, y, Math.cos(a) * r], [Math.sin(a) * r, y + .55, Math.cos(a) * r], .016, p); }
  }
  function gear(r, n, p, x, y, z, horizontal = true) {
    const s = new T.Shape();
    for (let i = 0; i < n; i++) for (let k = 0; k < 6; k++) {
      const a = (i + k / 6) * Math.PI * 2 / n, rr = r * ([.90, .90, 1.04, 1.04, .90, .90][k]);
      if (!i && !k) s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); else s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    s.closePath(); const h = new T.Path(); h.absarc(0, 0, r * .62, 0, Math.PI * 2, true); s.holes.push(h);
    const g = new T.Group(); g.position.set(x, y, z); p.add(g);
    const wheel = mesh(new T.ExtrudeGeometry(s, { depth: .12, bevelEnabled: true, bevelThickness: .009, bevelSize: .008, bevelSegments: 1 }), M.brass, 0, 0, 0, g);
    if (horizontal) wheel.rotation.x = Math.PI / 2;
    const hub = cyl(gold, 0, 0, 0, r * .20, .23, g); if (!horizontal) hub.rotation.x = Math.PI / 2;
    for (let j = 0; j < 8; j++) { const a = j * Math.PI / 4; rod(gold, [0, 0, 0], horizontal ? [Math.sin(a) * r * .85, 0, Math.cos(a) * r * .85] : [Math.sin(a) * r * .85, Math.cos(a) * r * .85, 0], r * .035, g); }
    gears.push({ g, horizontal }); return g;
  }
  // Compact repeated components are instanced; each tier remains independently movable.
  function instances(geo, mat, transforms, parent) {
    const obj = new T.InstancedMesh(geo, mat, transforms.length), dummy = new T.Object3D();
    transforms.forEach((t, i) => { dummy.position.set(...t.p); dummy.rotation.set(0, t.a || 0, 0); dummy.scale.set(...(t.s || [1, 1, 1])); dummy.updateMatrix(); obj.setMatrixAt(i, dummy.matrix); if (t.c) obj.setColorAt(i, new T.Color(t.c)); });
    obj.castShadow = obj.receiveShadow = true; parent.add(obj); return obj;
  }
  function batch(parent) {
    parent.updateMatrixWorld(true); const inv = parent.matrixWorld.clone().invert(), grouped = new Map();
    for (const o of [...parent.children]) {
      if (!o.isMesh || o.isInstancedMesh || o.material.transparent || !o.visible) continue;
      let geo = o.geometry.clone(); geo.applyMatrix4(inv.clone().multiply(o.matrixWorld)); if (geo.index) geo = geo.toNonIndexed();
      const list = grouped.get(o.material) || []; list.push(geo); grouped.set(o.material, list); parent.remove(o);
    }
    for (const [mat, geos] of grouped) { const o = new T.Mesh(mergeGeometries(geos, false), mat); o.castShadow = o.receiveShadow = true; parent.add(o); geos.forEach(g => g.dispose()); }
  }

  // Eightfold stone civic hall with open windows; no solid backing behind glazing.
  cyl(M.dark, 0, -.35, 0, 9.15, .7, architecture, 9.15, 64);
  cyl(M.stone, 0, .1, 0, 8.95, .3, architecture, 8.95, 64);
  const paving = [];
  for (let x = -8.5; x <= 8.5; x += .55) for (let z = -8.5; z <= 8.5; z += .55) if (Math.hypot(x, z) < 8.6) paving.push({ p: [x, .28, z] });
  instances(new T.BoxGeometry(.53, .07, .53), M.stone, paving, architecture);
  const blocks = [];
  for (let j = 0; j < 24; j++) {
    const a = j * Math.PI / 12, r = 7.95;
    if(j!==0){for (let row = 0; row < 17; row++) blocks.push({ p: [Math.sin(a) * r, .48 + row * .32, Math.cos(a) * r], a, s: [1, 1, 1] });
    radialBox(M.stone, a, r, .45, .86, .24, 1.1); radialBox(M.stone, a, r, 5.7, 1.0, .22, 1.15);}
    const next = a + Math.PI / 24, ww = 1.45;
    if (j !== 0 && j !== 23) {
      radialBox(M.stone, next, r, 1.0, ww, 1.35, .5);
      radialBox(crystal, next, r, 3.28, ww, 3.0, .035, crystalShell);
      radialBox(M.stone, next, r, 5.24, ww, .83, .5);
      for (const off of [-.50, 0, .50]) { const x = Math.sin(next) * r + Math.cos(next) * off, z = Math.cos(next) * r - Math.sin(next) * off; rod(gold, [x, 1.7, z], [x, 4.85, z], .022); }
      const archPts = []; for (let k = 0; k <= 20; k++) { const u = -1 + k / 10, xx = u * .72, yy = 4.30 + (1 - Math.abs(u)) * .8; archPts.push([Math.sin(next) * r + Math.cos(next) * xx, yy, Math.cos(next) * r - Math.sin(next) * xx]); } pipe(archPts, .05, M.stone);
    }
  }
  instances(new RoundedBoxGeometry(.48, .305, .86, 1, .025), M.stone, blocks, architecture);
  for (const y of [.4, 5.53, 5.88]) annulus(8.3, 7.55, y, .16, M.stone);
  for (let i = 0; i < 10; i++) box(M.stone, 0, -.27 + (10 - i) * .055, 8.4 + i * .25, 3.5 + i * .12, .18, .29);
  for (let j = 1; j < 12; j++) {
    const a = j * Math.PI / 6; radialBox(M.stone, a, 8.3, 2.4, .48, 4.2, .8);
    radialBox(M.stone, a, 8.5, .9, .85, 1.35, 1.1);
    gear(.29, 16, architecture, Math.sin(a) * 8.42, 3.1, Math.cos(a) * 8.42, false).rotation.y = a;
  }

  // Illustrated spine atlas: all titles face radially outward and remain physical books.
  const titleSet = ['CONSTITUTION','PUBLIC RECORD','RIGHTS','REVIEW','CHARTER','PRINCIPLES','EVIDENCE','OPEN ARCHIVE'];
  const atlas = document.createElement('canvas'); atlas.width = 1024; atlas.height = 1024;
  const ctx = atlas.getContext('2d');
  for (let i = 0; i < 8; i++) { const x = i * 128; ctx.fillStyle = ['#493629','#253a42','#56302e','#414334'][i % 4]; ctx.fillRect(x, 0, 128, 1024); ctx.fillStyle = '#b39758'; for (const y of [35, 65, 940, 972]) ctx.fillRect(x + 8, y, 112, 5); ctx.save(); ctx.translate(x + 64, 510); ctx.rotate(-Math.PI / 2); ctx.font = 'bold 34px Georgia'; ctx.textAlign = 'center'; ctx.fillText(titleSet[i], 0, 0); ctx.font = '24px Georgia'; ctx.fillText('ARCHIVE · ' + (i + 1), 0, 40); ctx.restore(); }
  const tex = new T.CanvasTexture(atlas); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 8;
  const spineM = new T.MeshStandardMaterial({ map: tex, roughness: .8 });
  let bookCount = 0;
  for (let level = 0; level < 5; level++) {
    const y = 7 + level * 4.5, r = 7.15 - level * 1.01;
    const tier = new T.Group(); tier.position.y = y; tier.name = `Rotating_Archive_Floor_${level + 1}`; root.add(tier);
    annulus(r + .20, 1.32, 0, .24, M.dark, tier); ring(r + .24, .20, gold, .045, tier); ring(r - .1, -.20, M.brass, .11, tier);
    annulus(r + .14, r - .05, -.28, .10, gold, tier);
    const teeth = []; for (let i = 0; i < 180; i++) { const a = i * Math.PI / 90; teeth.push({ p: [Math.sin(a) * (r + .14), -.27, Math.cos(a) * (r + .14)], a }); }
    instances(new T.BoxGeometry(.085, .13, .15), M.brass, teeth, tier);
    for (let j = 0; j < 12; j++) { const a = j * Math.PI / 6; rod(M.brass, [Math.sin(a) * 1.4, -.13, Math.cos(a) * 1.4], [Math.sin(a) * r, -.13, Math.cos(a) * r], .05, tier); gear(.40, 18, tier, Math.sin(a) * (r - .5), -.34, Math.cos(a) * (r - .5)); }
    const titles = Array.from({ length: 8 }, () => []), bookBodies = [];
    for (let row = 0; row < 4; row++) {
      const rr = r - .34 - row * .12, sy = .49 + row * .69;
      annulus(rr + .21, rr - .48, sy - .12, .07, M.wood, tier);
      ring(rr + .22, sy - .08, gold, .016, tier);
      for (let bay = 0; bay < 24; bay++) {
        // Leave one radial retrieval aisle aligned with the central index platform.
        if (bay === 0) continue;
        const a = bay * Math.PI / 12;
        radialBox(M.wood, a, rr - .10, sy + .23, .055, .66, .62, tier);
        const n = Math.max(4, Math.floor(rr * .2618 / .115));
        for (let j = 0; j < n; j++) {
          const aa = a + .017 + (j + .5) / n * .23, h = .48 + .08 * Math.sin(j * 4 + bay + level), width = rr * .22 / n * .87;
          bookBodies.push({ p: [Math.sin(aa) * rr, sy + h / 2, Math.cos(aa) * rr], a: aa, s: [width, h, .41], c: ['#514133', '#3f3632', '#253a43', '#584336'][(bay + j) % 4] });
          titles[(bay + j) % 8].push({ p: [Math.sin(aa) * (rr + .208), sy + h / 2, Math.cos(aa) * (rr + .208)], a: aa, s: [width, h, 1] }); bookCount++;
        }
      }
    }
    instances(new T.BoxGeometry(1, 1, 1), new T.MeshStandardMaterial({ color: 0xffffff, roughness: .9 }), bookBodies, tier);
    titles.forEach((items, i) => { const geo = new T.PlaneGeometry(1, 1); const uv = geo.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setX(k, (uv.getX(k) + i) / 8); instances(geo, spineM, items, tier); });
    rail(1.38, .27, tier, .18, Math.PI * 2 - .18);
    box(M.wood, 0, .3, (r + 1.32) / 2, .7, .10, r - 1.32, tier);
    for (const x of [-.39, .39]) rod(gold, [x, .78, 1.38], [x, .78, r - .42], .018, tier);
    const selectedBook = box(cool, .16, 1.10, r - .12, .11, .56, .43, tier); selectedBook.visible = false;
    for(let j=0;j<8;j++){const a=j*Math.PI/4;const lamp=cyl(gold,Math.sin(a)*(r-.18),3.36,Math.cos(a)*(r-.18),.095,.12,tier);mesh(new T.SphereGeometry(.065,10,8),new T.MeshBasicMaterial({color:0xffcc85}),lamp.position.x,3.25,lamp.position.z,tier);}
    const floorLight=new T.PointLight(0xffc98b,12,8,2);floorLight.position.set(0,y+3.4,2);root.add(floorLight);
    batch(tier); libraryFloors.push({ tier, y, r, selectedBook, angle: level * .24 });
  }

  // Upright cylindrical panel courses step inward at each storey and rotate independently.
  const sections = [[5.98, 8.10, 10.95, 7.05], [10.95, 7.05, 15.45, 6.04], [15.45, 6.04, 19.95, 5.03], [19.95, 5.03, 24.45, 4.02], [24.45, 4.02, 29.7, 2.62], [29.7, 2.62, 33.5, 1.63]];
  for (const [y0, r0, y1, r1] of sections) {
    const shellTier=new T.Group();shellTier.name=`Rotating_Crystal_Course_${crystalTiers.length+1}`;crystalShell.add(shellTier);crystalTiers.push(shellTier);
    for (let j = 0; j < 24; j++) {
      const a = j * Math.PI / 12, b = (j + 1) * Math.PI / 12;
      // Curvature runs around the circumference only; every vertical edge is plumb.
      const vertices=[],indices=[],nu=8,nv=12,stride=(nu+1)*(nv+1);
      for(let skin=0;skin<2;skin++)for(let v=0;v<=nv;v++)for(let u=0;u<=nu;u++){
        const U=u/nu,V=v/nv,theta=a+(b-a)*U;
        const radius=r0-skin*.065;
        vertices.push(Math.sin(theta)*radius,T.MathUtils.lerp(y0,y1,V),Math.cos(theta)*radius);
      }
      for(let skin=0;skin<2;skin++)for(let v=0;v<nv;v++)for(let u=0;u<nu;u++){const q=skin*stride+v*(nu+1)+u,n=q+nu+1;indices.push(...(skin?[q,n,q+1,q+1,n,n+1]:[q,q+1,n,q+1,n+1,n]));}
      const edge=[];for(let u=0;u<=nu;u++)edge.push(u);for(let v=1;v<=nv;v++)edge.push(v*(nu+1)+nu);for(let u=nu-1;u>=0;u--)edge.push(nv*(nu+1)+u);for(let v=nv-1;v>0;v--)edge.push(v*(nu+1));for(let k=0;k<edge.length;k++){const q=edge[k],n=edge[(k+1)%edge.length];indices.push(q,q+stride,n,n,q+stride,n+stride);}
      const geo = new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();mesh(geo,crystal,0,0,0,shellTier);
      const path = []; for (let k = 0; k <= 12; k++) { const t = k / 12; path.push([Math.sin(a) * r0, T.MathUtils.lerp(y0,y1,t), Math.cos(a) * r0]); }
      const seam = pipe(path, .021, seamMat, shellTier); seam.userData.live = true; seams.push({ seam, base: seam.geometry.attributes.position.array.slice(), seed: j });
    }
    ring(r0, y0, cool, .027, shellTier);ring(r0,y1,cool,.021,shellTier);
    annulus(r0,r1,y1-.045,.045,crystal,shellTier);
  }
  // Central guides are inside the tower; the lift has no facade-mounted shaft.
  const pillarMat=crystal.clone();pillarMat.opacity=.22;
  sections.forEach(([y0,r0,y1],i)=>{for(let j=0;j<12;j++){const a=j*Math.PI/6;rod(pillarMat,[Math.sin(a)*r0,y0,Math.cos(a)*r0],[Math.sin(a)*r0,y1,Math.cos(a)*r0],.07,crystalTiers[i]);}});
  for(let j=0;j<12;j++){const a=j*Math.PI/6;rod(M.brass,[Math.sin(a)*1.6,5.7,Math.cos(a)*1.6],[Math.sin(a)*1.6,29,Math.cos(a)*1.6],.053);}
  for (let j = 0; j < 6; j++) { const a = j * Math.PI / 3; rod(silver, [Math.sin(a)*1.17,5.2,Math.cos(a)*1.17],[Math.sin(a)*1.17,33.8,Math.cos(a)*1.17],.028); }
  for (const {y} of libraryFloors) { ring(1.22,y+.3,gold,.04); ring(1.16,y+.35,cool,.018); }
  cyl(M.dark,0,0,0,1.05,.16,lift,1.05,6); cyl(gold,0,-.14,0,.94,.12,lift,.75,6); ring(.97,.12,cool,.024,lift);
  for (let j=0;j<6;j++) { const a=j*Math.PI/3;rod(gold,[Math.sin(a),.1,Math.cos(a)],[Math.sin(a),1.75,Math.cos(a)],.025,lift); }
  cyl(crystal,0,.85,0,1,1.5,lift,1,6); ring(1,1.75,gold,.04,lift);
  box(M.wood,0,.55,-.15,1.22,.8,.48,lift);box(gold,0,.99,-.15,1.35,.06,.62,lift);
  for(let j=0;j<5;j++)box(cool,-.4+j*.2,1.07,-.1,.12,.012,.16,lift);
  const display=mesh(new T.TorusGeometry(.30,.012,8,48),cool,0,1.45,-.22,lift);
  for(let j=0;j<3;j++)rod(cool,[-.24,1.37+j*.08,-.21],[.24,1.37+j*.08,-.21],.008,lift);
  batch(lift);

  // Foundation codex, page curvature and readable illustrated page texture.
  cyl(M.stone,0,.52,0,2.0,.42);cyl(M.dark,0,.90,0,1.10,.5);cyl(gold,0,1.24,0,1.3,.17);
  box(M.wood,0,1.47,0,2.8,.22,1.95);box(gold,0,1.37,0,2.92,.07,2.05);
  const cv=document.createElement('canvas');cv.width=1024;cv.height=1024;const c=cv.getContext('2d');c.fillStyle='#e4d4aa';c.fillRect(0,0,1024,1024);c.fillStyle='#514332';c.textAlign='center';c.font='46px Georgia';c.fillText('CONSTITUTION',512,130);c.font='22px Georgia';c.fillText('CARAKURI · PUBLIC ARCHIVE',512,180);for(let j=0;j<26;j++){c.fillStyle=j%5===0?'#9b814f':'#75644c';c.fillRect(100,240+j*24,820-(j%4)*55,3);}const pt=new T.CanvasTexture(cv);pt.colorSpace=T.SRGBColorSpace;const pageM=new T.MeshStandardMaterial({map:pt,roughness:.95,side:T.DoubleSide});
  for(const side of [-1,1]){for(let i=0;i<7;i++)box(paper,side*.69,1.59+i*.014,0,1.34,.018,1.89);const geo=new T.PlaneGeometry(1.35,1.9,18,1),p=geo.attributes.position;for(let k=0;k<p.count;k++){const x=p.getX(k);p.setXYZ(k,side*(x+.68),1.75+Math.sin((x+.675)/1.35*Math.PI)*.16,p.getY(k));}geo.computeVertexNormals();mesh(geo,pageM);}
  const barriers=[];for(let j=0;j<3;j++){const m=new T.MeshBasicMaterial({color:0xa1b9ff,transparent:true,opacity:.06,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending});const wall=mesh(new T.CylinderGeometry(2.3+j*.22,2.3+j*.22,3.5,64,1,true),m,0,2.25,0);wall.userData.live=true;barriers.push(wall);ring(2.3+j*.22,.5,cool,.024);ring(2.3+j*.22,4.0,cool,.016);}

  // Crown without horns: a low stabiliser cradle supports a floating plasma light.
  const crownRotor=new T.Group();crownRotor.name='Plasma_Levitation_Turntable';root.add(crownRotor);
  cyl(M.dark,0,33.6,0,1.60,.3,crownRotor);ring(1.65,33.8,gold,.09,crownRotor);ring(1.56,34.04,cool,.035,crownRotor);
  for(let j=0;j<12;j++){const a=j*Math.PI/6;rod(gold,[Math.sin(a)*1.5,33.6,Math.cos(a)*1.5],[Math.sin(a)*1.1,34.15,Math.cos(a)*1.1],.05,crownRotor);}
  // A separate octagonal levitation engine gives the crown an architectural silhouette.
  cyl(M.dark,0,30.1,0,2.36,.48,architecture,2.36,8);
  cyl(M.brass,0,30.38,0,2.54,.16,architecture,2.54,8);
  for(let j=0;j<8;j++){
    const a=j*Math.PI/4;
    rod(M.brass,[Math.sin(a)*2.13,30.4,Math.cos(a)*2.13],[Math.sin(a)*2.13,33.35,Math.cos(a)*2.13],.085);
    radialBox(M.dark,a,2.13,30.78,.44,.54,.48);
    radialBox(gold,a,2.13,33.12,.48,.24,.52);
    pipe([[Math.sin(a)*1.65,29.7,Math.cos(a)*1.65],[Math.sin(a)*2.06,30.5,Math.cos(a)*2.06],[Math.sin(a)*2.06,31.8,Math.cos(a)*2.06],[Math.sin(a)*.52,31.8,Math.cos(a)*.52]],.052,gold);
  }
  cyl(crystal,0,31.7,0,2.15,2.5,crystalShell,2.15,8);
  cyl(M.dark,0,33.38,0,2.55,.27,crownRotor,2.55,8);
  cyl(M.brass,0,33.56,0,2.68,.12,crownRotor,2.68,8);
  ring(2.34,33.72,gold,.09,crownRotor);ring(2.08,33.90,silver,.065,crownRotor);
  for(let j=0;j<48;j++){const a=j*Math.PI/24;radialBox(gold,a,2.47,33.47,.09,.17,.15,crownRotor);}
  // Enclosed bearing bed and supported parallel shafts: no loose facade gears.
  annulus(2.58,.54,32.14,.16,M.dark);ring(2.52,32.31,gold,.045);
  cyl(silver,0,31.70,0,.27,2.95);for(const y of [30.45,32.27,33.16]){cyl(M.dark,0,y,0,.49,.18);ring(.44,y+.09,gold,.03);}
  const drive=gear(1.80,96,architecture,0,32.63,0);drive.name='Crown_Main_Drive';drive.userData.speed=.045;
  for(let j=0;j<8;j++){
    const a=j*Math.PI/4,x=Math.sin(a)*2.10,z=Math.cos(a)*2.10;
    cyl(silver,x,32.70,z,.065,1.05);
    for(const y of [32.34,33.13]){box(M.dark,x,y,z,.27,.14,.27);cyl(gold,x,y+.07,z,.11,.045);}
    const pinion=gear(.30,16,architecture,x,32.63,z);pinion.userData.speed=-.27;pinion.rotation.y=Math.PI/16;
    rod(M.brass,[x,33.13,z],[Math.sin(a)*2.55,33.13,Math.cos(a)*2.55],.055);
    for(const off of [-.10,.10])mesh(new T.SphereGeometry(.025,8,6),silver,x+off,32.42,z);
  }
  // Roller thrust bearing underneath the rotating upper plate.
  ring(1.88,33.10,M.dark,.055);ring(1.88,33.23,silver,.045);
  for(let j=0;j<48;j++){const a=j*Math.PI/24;mesh(new T.SphereGeometry(.060,10,8),silver,Math.sin(a)*1.88,33.17,Math.cos(a)*1.88);}
  batch(crownRotor);
  const plasmaGroup=new T.Group();plasmaGroup.position.y=36.75;root.add(plasmaGroup);
  const plasmaMat=new T.ShaderMaterial({uniforms:{time:{value:0}},vertexShader:`varying vec3 p;varying vec3 n;void main(){p=position;n=normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec3 p;varying vec3 n;uniform float time;void main(){float v=sin(p.x*8.+sin(p.y*7.+time)*2.+time)*sin(p.z*9.-time*1.3+p.y*4.);float f=pow(abs(v),5.);vec3 col=mix(vec3(.15,.22,.65),vec3(.8,.95,1.),f);gl_FragColor=vec4(col*(1.3+f*2.),.18+f*.50);}`,transparent:true,depthWrite:false,blending:T.AdditiveBlending});
  mesh(new T.SphereGeometry(1.85,64,40),plasmaMat,0,0,0,plasmaGroup);
  mesh(new T.SphereGeometry(.32,24,16),new T.MeshBasicMaterial({color:0xe7eaff}),0,0,0,plasmaGroup);
  for(let j=0;j<13;j++){const pts=[];for(let k=0;k<=96;k++){const a=k/96*Math.PI*2,rr=1.55+.19*Math.sin(a*5+j);pts.push([Math.cos(a)*rr,Math.sin(a)*rr,Math.sin(a*3+j)*.27]);}const thread=pipe(pts,.012,new T.MeshBasicMaterial({color:j%2?0xa2cfff:0xbaaaff}),plasmaGroup);thread.rotation.set(j*.64,j*.92,0);plasmaThreads.push(thread);}
  const light=new T.PointLight(0x9bc6ff,130,65,2);light.position.y=36.75;root.add(light);
  const foundationLight=new T.PointLight(0xffd79a,7,10,2);foundationLight.position.set(0,4.0,1);root.add(foundationLight);
  // Carved masonry courses, layered window archivolts and a continuous circulation plant.
  const detailBlocks=[],bolts=[];
  const pos=(a,r,y)=>[Math.sin(a)*r,y,Math.cos(a)*r];
  const ornamental=crystal.clone();ornamental.opacity=.24;ornamental.roughness=.055;
  const circulation=[];
  function flange(a,r,y){const g=new T.Group();g.position.set(...pos(a,r,y));g.rotation.y=a;architecture.add(g);const disk=cyl(gold,0,0,0,.15,.065,g);disk.rotation.x=Math.PI/2;for(let k=0;k<6;k++){const t=k*Math.PI/3;mesh(new T.SphereGeometry(.019,8,6),M.dark,Math.cos(t)*.115,Math.sin(t)*.115,.047,g);}batch(g);}
  for(let j=0;j<24;j++){
    const a=(j+.5)*Math.PI/12;
    if(j===0||j===23)continue;
    for(const [low,high] of [[.36,1.56],[4.95,5.60]])for(let y=low;y<high;y+=.22)for(let k=0;k<6;k++){const aa=a+(k-2.5)*.028;detailBlocks.push({p:pos(aa,8.235,y),a:aa});}
    for(const r of [8.08,8.20,8.32]){const pts=[];for(let k=0;k<=24;k++){const u=k/12-1,aa=a+u*.091;pts.push(pos(aa,r,4.12+.98*(1-Math.pow(Math.abs(u),1.25))));}pipe(pts,.035,M.stone);}
    for(const side of [-1,1]){const aa=a+side*.098;rod(M.stone,pos(aa,8.22,1.55),pos(aa,8.22,4.15),.065);for(const y of [1.59,4.13]){const o=cyl(M.stone,...pos(aa,8.22,y),.11,.11);}}
    radialBox(M.stone,a,8.20,1.62,1.56,.14,.40);radialBox(M.stone,a,8.22,5.44,1.64,.14,.28);
  }
  instances(new RoundedBoxGeometry(.215,.205,.09,1,.012),M.stone,detailBlocks,architecture);
  for(const y of [.58,.84,5.18,5.40]){
    // Interrupted at the entrance: the feed and return manifolds never block access.
    const pts=[];for(let k=0;k<=128;k++)pts.push(pos(.23+k/128*(Math.PI*2-.46),8.65,y));pipe(pts,.072,gold);
  }
  for(let j=1;j<12;j++){
    const a=j*Math.PI/6,x=Math.sin(a)*9.03,z=Math.cos(a)*9.03;
    radialBox(M.dark,a,8.91,2.5,.72,2.8,.16);
    const mounting=new T.Group();mounting.position.set(x,2.15,z);mounting.rotation.y=a;architecture.add(mounting);
    gear(.32,24,mounting,0,0,.05,false).userData.speed=.10;gear(.16,12,mounting,.43,0,.05,false).userData.speed=-.20;gear(.21,16,mounting,.43,.35,.05,false).userData.speed=.15;
    for(const dy of [-.48,.73])box(gold,0,dy,-.05,.68,.09,.17,mounting);
    rod(M.brass,[-.25,-.48,-.02],[-.25,.73,-.02],.028,mounting);
    cyl(gold,x,3.70,z,.19,.65);for(const y of [3.35,3.60,4.02])cyl(gold,x,y,z,.24,.08);
    cyl(ornamental,x,3.68,z,.205,.47,crystalShell);
    const core=cyl(cool,x,3.67,z,.055,.35);circulation.push(core);
    for(const off of [-.043,.043]){const aa=a+off;pipe([pos(aa,8.65,.84),pos(aa,8.90,1.25),pos(aa,8.90,3.5),pos(a,8.70,4.15),pos(a,8.65,5.18)],.046,gold);for(const y of [1.3,2.9,4.6])flange(aa,8.9,y);}
    const dial=new T.Group();dial.position.set(...pos(a,8.99,4.43));dial.rotation.y=a;architecture.add(dial);const face=cyl(paper,0,0,0,.14,.055,dial);face.rotation.x=Math.PI/2;const rim=mesh(new T.TorusGeometry(.145,.025,8,24),gold,0,0,.04,dial);for(let k=0;k<12;k++){const t=k*Math.PI/6;rod(M.dark,[Math.sin(t)*.10,Math.cos(t)*.10,.06],[Math.sin(t)*.12,Math.cos(t)*.12,.06],.004,dial);}rod(M.dark,[0,0,.07],[.06,.065,.07],.008,dial);batch(dial);
    for(const y of [1.1,4.85])radialBox(M.stone,a,8.45,y,.92,.18,.85);
  }
  // Quiet integral edges follow the crystal envelope; no freestanding loop ornaments.
  for(const [y,r] of [[5.98,8.10],[10.95,7.05],[15.45,6.04],[19.95,5.03],[24.45,4.02]]){
    ring(r+.012,y+.018,ornamental,.045,crystalShell);
  }
  // Deep radial piers, ashlar towers and a separate monumental entrance hall.
  const fortressStone=M.stone.clone();fortressStone.color.setHex(0x88877f);
  const pierCourses=[];
  for(let j=1;j<12;j++){
    const a=j*Math.PI/6;
    radialBox(M.mortar,a,8.05,3.03,1.08,5.55,1.45);
    const sideFaces=new T.Group();sideFaces.position.set(...pos(a,8.05,0));sideFaces.rotation.y=a;architecture.add(sideFaces);
    for(const side of [-1,1])for(let row=0;row<18;row++)for(let k=0;k<4;k++)box(fortressStone,side*.554,.46+row*.30,-.55+k*.365,.08,.284,.348,sideFaces);batch(sideFaces);
    for(let row=0;row<18;row++)for(const side of [-1,1]){
      const rr=side>0?8.83:7.30;
      for(let k=0;k<2;k++){const aa=a+(k-.5)*.059;pierCourses.push({p:pos(aa,rr,.46+row*.30),a:aa});}
    }
    for(const y of [.51,1.35,4.95,5.65,6.10])radialBox(fortressStone,a,8.05,y,1.30,.20,1.72);
    for(const side of [-1,1]){const aa=a+side*.065;rod(fortressStone,pos(aa,8.74,1.4),pos(aa,8.74,5.52),.105);}
    radialBox(fortressStone,a,8.07,6.30,.85,.50,1.0);
    const roof=mesh(new T.ConeGeometry(.71,1.13,4),M.slate,...pos(a,8.07,7.10));roof.rotation.y=a+Math.PI/4;
    rod(gold,pos(a,8.07,7.60),pos(a,8.07,7.88),.026);
    // The interior pier carries radial ceiling vaults into the central chamber.
    const pts=[];for(let k=0;k<=20;k++){const t=k/20;pts.push(pos(a,7.35*(1-t)+3.0*t,5.15+Math.sin(Math.PI*t)*.55));}pipe(pts,.105,fortressStone);
  }
  instances(new RoundedBoxGeometry(.46,.284,.13,1,.016),fortressStone,pierCourses,architecture);
  annulus(8.36,7.0,5.63,.35,fortressStone);
  annulus(8.45,7.0,6.0,.18,fortressStone);
  // Deep entrance jambs flank the visible protected codex; nothing obstructs the centre.
  for(const side of [-1,1]){
    box(M.mortar,side*1.58,2.88,7.92,.65,5.22,1.9);
    for(let row=0;row<17;row++)box(fortressStone,side*1.58,.46+row*.30,8.92,.70,.284,.14);
    for(const face of [-1,1])for(let row=0;row<17;row++)for(let k=0;k<5;k++)box(fortressStone,side*1.58+face*.34,.46+row*.30,7.14+k*.38,.08,.284,.36);
    for(const x of [side*1.23,side*1.94])rod(fortressStone,[x,.4,8.76],[x,5.49,8.76],.095);
    box(fortressStone,side*1.58,.56,8.05,1.04,.40,2.2);box(fortressStone,side*1.58,5.64,8.05,1.04,.28,2.2);
  }
  const gateArch=[];for(let k=0;k<=40;k++){const a=k/40*Math.PI;gateArch.push([Math.cos(a)*1.6,5.32+Math.sin(a)*1.07,8.78]);}pipe(gateArch,.14,fortressStone);
  for(let j=0;j<25;j++){const a=(j+.5)/25*Math.PI,o=box(fortressStone,Math.cos(a)*1.62,5.32+Math.sin(a)*1.10,8.90,.20,.29,.25);o.rotation.z=a-Math.PI/2;}
  for(let i=0;i<10;i++){const h=.10+(10-i)*.058;box(fortressStone,0,-.65+h/2,8.55+i*.28,3.75+i*.13,h,.31);}
  for(let j=0;j<96;j++){const a=j*Math.PI/48;radialBox(M.stone,a,8.2,5.79,.13,.21,.20);}
  batch(architecture);
  const clips=libraryFloors.map(({tier},i)=>{const duration=90+i*10,values=[];for(let k=0;k<=4;k++){const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),k*Math.PI/2*(i%2?-1:1));values.push(q.x,q.y,q.z,q.w);}return new T.AnimationClip(`ArchiveRotation${i+1}`,duration,[new T.QuaternionKeyframeTrack(`${tier.name}.quaternion`,[0,duration/4,duration/2,duration*3/4,duration],values)]);});
  // A second inhabited stone storey carries the original sanctuary and the entire archive.
  const extensionHeight=5.8,elevated=new T.Group();elevated.name='Upper_Sanctuary_And_Archive';
  const existing=[...root.children];root.add(elevated);existing.forEach(o=>elevated.add(o));elevated.position.y=extensionHeight;
  const lowerHall=new T.Group();lowerHall.name='Lower_Energy_And_Records_Hall';root.add(lowerHall);
  cyl(M.dark,0,-.36,0,9.35,.70,lowerHall,9.35,64);cyl(fortressStone,0,.10,0,9.2,.25,lowerHall,9.2,64);
  for(const y of [.38,1.4,5.28,5.58])annulus(9.10,7.0,y,.20,fortressStone,lowerHall);
  const lowerBlocks=[];
  for(let j=0;j<24;j++){
    const a=j*Math.PI/12,mid=a+Math.PI/24;
    radialBox(M.mortar,a,8.25,2.95,.68,5.25,1.45,lowerHall);
    for(let row=0;row<17;row++)radialBox(fortressStone,a,9.0,.56+row*.30,.72,.285,.15,lowerHall);
    for(const y of [.64,1.45,5.20])radialBox(fortressStone,a,8.35,y,1.02,.22,1.70,lowerHall);
    radialBox(M.mortar,mid,8.25,2.95,1.5,5.25,.75,lowerHall);
    for(let row=0;row<17;row++)for(let k=0;k<5;k++){const aa=mid+(k-2)*.032;lowerBlocks.push({p:[Math.sin(aa)*8.67,.56+row*.30,Math.cos(aa)*8.67],a:aa});}
    // Deep inset records windows with stone reveals and protective bronze grilles.
    radialBox(M.dark,mid,8.78,3.25,.96,2.18,.12,lowerHall);
    const windowMat=new T.MeshStandardMaterial({color:0x6b5841,emissive:0xd88f42,emissiveIntensity:.23,roughness:.5});
    radialBox(windowMat,mid,8.85,3.25,.76,1.93,.035,lowerHall);
    for(const off of [-.053,.053])rod(fortressStone,[Math.sin(mid+off)*8.91,2.05,Math.cos(mid+off)*8.91],[Math.sin(mid+off)*8.91,4.45,Math.cos(mid+off)*8.91],.078,lowerHall);
    for(const y of [2.08,4.43])radialBox(fortressStone,mid,8.90,y,1.18,.17,.34,lowerHall);
    for(const off of [-.025,0,.025])rod(gold,[Math.sin(mid+off)*8.94,2.18,Math.cos(mid+off)*8.94],[Math.sin(mid+off)*8.94,4.32,Math.cos(mid+off)*8.94],.022,lowerHall);
    if(j%2===0){radialBox(fortressStone,a,8.60,2.4,1.02,3.9,1.15,lowerHall);radialBox(fortressStone,a,8.70,.8,1.40,1.15,1.48,lowerHall);}
  }
  instances(new RoundedBoxGeometry(.27,.285,.10,1,.013),fortressStone,lowerBlocks,lowerHall);
  for(const y of [1.35,4.93])ring(8.97,y,gold,.065,lowerHall);
  // Broad supported ceremonial stair connects the ground to the raised sanctuary entrance.
  for(let j=0;j<34;j++){const h=(34-j)*extensionHeight/34;box(fortressStone,0,-.65+h/2,9.4+j*.25,4.5+j*.035,h,.27,lowerHall);}
  for(const side of [-1,1]){rod(M.brass,[side*2.38,6.0,9.3],[side*2.90,.6,17.75],.05,lowerHall);for(let j=0;j<12;j++){const t=j/11,x=side*(2.38+t*.52),z=9.3+t*8.45,y=5.4*(1-t);rod(M.brass,[x,y,z],[x,y+.6,z],.03,lowerHall);}}
  batch(lowerHall);
  return {
    root, clips, crystalShell,
    setShell(v){shellVisible=v;crystalShell.visible=v;},
    selectFloor(i){selected=i;targetHeight=libraryFloors[i].y+.42;arrived=false;},
    setAuto(){selected=-1;arrived=false;},
    tick(dt,camDist){time+=dt;
      for(let i=0;i<libraryFloors.length;i++){const f=libraryFloors[i];if(selected===i){const target=Math.round(f.angle/(Math.PI*2))*Math.PI*2;f.angle=T.MathUtils.damp(f.angle,target,1.3,dt);}else f.angle+=dt*(i%2?-.035:.028);f.tier.rotation.y=f.angle;f.selectedBook.visible=selected===i;}
      if(selected<0)targetHeight=16.3+Math.sin(time*.13)*8.8;
      lift.position.y=T.MathUtils.damp(lift.position.y,targetHeight,selected<0?.8:1.5,dt);
      arrived=selected>=0&&Math.abs(lift.position.y-targetHeight)<.04&&Math.abs(Math.sin(libraryFloors[selected].angle/2))<.01;
      crownRotor.rotation.y=time*.045;
      crystalTiers.forEach((tier,i)=>tier.rotation.y=time*(i%2?-.018:.022)/(1+i*.12));
      gears.forEach(({g,horizontal},i)=>{if(horizontal)g.rotation.y=time*(g.userData.speed??(i%2?-.19:.19));else g.rotation.z=time*(g.userData.speed??.1);});
      circulation.forEach((o,i)=>o.scale.y=.9+Math.sin(time*2+i*.7)*.1);
      // vertex ripples are invisible from afar: skip the rewrite and re-upload
      if(!(camDist>150))seams.forEach(({seam,base,seed})=>{const p=seam.geometry.attributes.position;for(let k=0;k<p.count;k++){const yy=base[k*3+1];p.setX(k,base[k*3]+Math.sin(yy*9-time*2+seed)*.009);p.setZ(k,base[k*3+2]+Math.cos(yy*7-time*2+seed)*.009);}p.needsUpdate=true;});
      plasmaMat.uniforms.time.value=time;plasmaThreads.forEach((p,i)=>p.rotation.y+=dt*.035*(i%2?-1:1));light.intensity=125+Math.sin(time*2)*8;
      barriers.forEach((b,i)=>b.material.opacity=.05+Math.sin(time+i)*.012);
    },
    stats(){return {bookCount,floors:libraryFloors.length,selected,arrived,liftHeight:lift.position.y,angles:libraryFloors.map(f=>f.angle),crystalAngles:crystalTiers.map(t=>t.rotation.y),shellVisible};}
  };
}
