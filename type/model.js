import * as T from 'three';

// The typing run gets a floor of its own: not the courier yard, but a sealing
// ground — concentric engraving rings, a ring of kana worn faint by use, and
// eight lamp pillars. The words walk in over the writing they will become.
export const STAGE_R=34;
let POOL_TEX=null;
function lightPool(){
 if(POOL_TEX)return POOL_TEX;
 const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
 const g=x.createRadialGradient(64,64,4,64,64,64);
 g.addColorStop(0,'rgba(225,190,130,.5)');g.addColorStop(.45,'rgba(190,150,95,.14)');g.addColorStop(1,'rgba(0,0,0,0)');
 x.fillStyle=g;x.fillRect(0,0,128,128);
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return POOL_TEX=t;
}
function stageTex(){
 const c=document.createElement('canvas');c.width=c.height=1024;const x=c.getContext('2d');
 x.fillStyle='#0e151a';x.fillRect(0,0,1024,1024);
 for(let i=0;i<3200;i++){x.globalAlpha=.04+Math.random()*.05;x.fillStyle=i%4?'#0a0f13':'#22303a';x.fillRect(Math.random()*1024,Math.random()*1024,2,2);}
 x.globalAlpha=1;x.translate(512,512);
 // The engraving rings, finer between the strong ones.
 for(let r=64;r<=496;r+=27){
  x.beginPath();x.arc(0,0,r,0,Math.PI*2);
  const strong=(r-64)%108===0;
  x.strokeStyle=strong?'rgba(150,120,62,.4)':'rgba(120,100,60,.12)';
  x.lineWidth=strong?3.5:1.4;x.stroke();
 }
 // Spokes, stopping short of the middle so the centre stays a stage.
 for(let k=0;k<24;k++){
  const a=k*Math.PI/12;
  x.beginPath();x.moveTo(Math.cos(a)*96,Math.sin(a)*96);x.lineTo(Math.cos(a)*486,Math.sin(a)*486);
  x.strokeStyle='rgba(120,100,60,.09)';x.lineWidth=1.6;x.stroke();
 }
 // A ring of kana, worn faint: this floor has been typed on for a long time.
 const KANA='あかさたなはまやらわいきしちにひみりうくすつぬふむゆる';
 x.font='500 44px "Yu Gothic UI",Meiryo,sans-serif';x.textAlign='center';x.textBaseline='middle';
 for(let k=0;k<KANA.length;k++){
  const a=k*Math.PI*2/KANA.length;
  x.save();x.rotate(a);x.translate(0,-436);x.rotate(0);
  x.fillStyle='rgba(165,140,92,.26)';x.fillText(KANA[k],0,0);
  x.restore();
 }
 // The centre seal.
 x.beginPath();x.arc(0,0,64,0,Math.PI*2);x.strokeStyle='rgba(170,140,80,.5)';x.lineWidth=4;x.stroke();
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;
}
export function buildStage(){
 const group=new T.Group();
 const R=STAGE_R+2;
 const floor=new T.Mesh(new T.CircleGeometry(R,96),new T.MeshStandardMaterial({map:stageTex(),metalness:.08,roughness:.94}));
 floor.rotation.x=-Math.PI/2;group.add(floor);
 // The dais PIP works from.
 const dais=new T.Mesh(new T.CylinderGeometry(1.5,1.7,.3,40),new T.MeshStandardMaterial({color:0x2c3640,metalness:.3,roughness:.6}));
 dais.position.y=.15;group.add(dais);
 const daisRing=new T.Mesh(new T.TorusGeometry(1.52,.05,8,40),new T.MeshStandardMaterial({color:0xa7864b,metalness:.8,roughness:.3}));
 daisRing.rotation.x=Math.PI/2;daisRing.position.y=.3;group.add(daisRing);
 // The rim: a low dark wall with a lit lip, and eight lamp pillars.
 const wall=new T.Mesh(new T.CylinderGeometry(R+.8,R+.8,2.6,96,1,true),new T.MeshStandardMaterial({color:0x141d24,roughness:.95,side:T.BackSide}));
 wall.position.y=1.3;group.add(wall);
 const lip=new T.Mesh(new T.TorusGeometry(R+.8,.16,10,120),new T.MeshStandardMaterial({color:0xffc98a,emissive:0xff9b24,emissiveIntensity:.7,metalness:.6,roughness:.35}));
 lip.rotation.x=Math.PI/2;lip.position.y=2.6;group.add(lip);
 const poolTex=lightPool();
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4+Math.PI/8;
  const px=Math.cos(a)*(R-.6),pz=Math.sin(a)*(R-.6);
  const post=new T.Mesh(new T.BoxGeometry(.5,4.6,.5),new T.MeshStandardMaterial({color:0x212a31,roughness:.9}));
  post.position.set(px,2.3,pz);group.add(post);
  const cap=new T.Mesh(new T.BoxGeometry(.7,.16,.7),new T.MeshStandardMaterial({color:0xa7864b,metalness:.8,roughness:.3}));
  cap.position.set(px,4.7,pz);group.add(cap);
  const lamp=new T.Mesh(new T.SphereGeometry(.3,16,12),new T.MeshStandardMaterial({color:0xffdb8d,emissive:0xffa324,emissiveIntensity:2}));
  lamp.position.set(px,5.1,pz);group.add(lamp);
  const pool=new T.Mesh(new T.PlaneGeometry(17,17),new T.MeshBasicMaterial({map:poolTex,transparent:true,blending:T.AdditiveBlending,depthWrite:false}));
  pool.rotation.x=-Math.PI/2;pool.position.set(Math.cos(a)*(R-5),.06,Math.sin(a)*(R-5));group.add(pool);
 }
 return group;
}

// Everything the typing run needs that the rush yard does not already give it:
// the word riding over each arrival, drawn on a little canvas of its own. The
// yard, the swarm, the pellets and the shadow all come from ../rush/model.js.

// One label: a sprite and the brush to repaint it. Repainted only when the
// word or the progress changes, never per frame.
export function makeLabel(){
 const c=document.createElement('canvas');c.width=512;c.height=210;
 const x=c.getContext('2d');
 const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
 // Words are for reading, not for atmosphere: no fog on them, whatever the
 // yard is doing behind.
 const sprite=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,depthWrite:false,fog:false}));
 sprite.scale.set(13,5.33,1);
 sprite.center.set(.5,0);
 const KANJI=/[㐀-鿿々]/;
 // Up to three rows: the reading in kana over the word where the word needs
 // one, the word itself, and under it the keys — typed in amber, the way home
 // in grey.
 function paint(disp,kana,typed,rest,mad){
  x.clearRect(0,0,512,210);
  const ruby=KANJI.test(disp)?kana:'';
  const jpFont='600 62px "Yu Gothic UI",Meiryo,sans-serif';
  x.font=jpFont;
  let dw=x.measureText(disp).width;
  // A very long word gives up size before it gives up fitting on its card.
  const jpFit=dw>452?'600 48px "Yu Gothic UI",Meiryo,sans-serif':jpFont;
  x.font=jpFit;dw=x.measureText(disp).width;
  x.font='600 42px Consolas,monospace';
  const rw=x.measureText(typed+rest).width;
  x.font='500 29px "Yu Gothic UI",Meiryo,sans-serif';
  const bw2=Math.min(506,Math.max(dw,rw,x.measureText(ruby).width)+44),bx=(512-bw2)/2;
  x.fillStyle=mad?'rgba(90,20,20,.82)':'rgba(10,17,19,.82)';
  x.beginPath();x.roundRect(bx,4,bw2,202,15);x.fill();
  x.strokeStyle=mad?'#ff8f9c':'#ffffff2e';x.lineWidth=2;x.stroke();
  x.textBaseline='middle';
  if(ruby){
   x.font='500 29px "Yu Gothic UI",Meiryo,sans-serif';
   x.fillStyle='#a8bdc3';x.fillText(ruby,(512-x.measureText(ruby).width)/2,36);
  }
  x.font=jpFit;
  x.fillStyle='#e9e5d9';x.fillText(disp,(512-dw)/2,ruby?94:68);
  x.font='600 42px Consolas,monospace';
  const x0=(512-rw)/2,y=ruby?168:148;
  x.fillStyle='#ffd79a';x.fillText(typed,x0,y);
  x.fillStyle='#93a6ab';x.fillText(rest,x0+x.measureText(typed).width,y);
  tex.needsUpdate=true;
 }
 function dispose(){tex.dispose();sprite.material.dispose();}
 return {sprite,paint,dispose};
}

// The thrown volley: an amber streak from PIP to the word that was finished.
// Built once and reused; the run only sets its two ends.
export function buildStreak(){
 const m=new T.Mesh(new T.BoxGeometry(1,.14,.14),new T.MeshBasicMaterial({color:0xffd79a,transparent:true,opacity:.9,blending:T.AdditiveBlending,depthWrite:false}));
 m.visible=false;return m;
}
