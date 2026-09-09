import * as T from 'three';

// Everything the typing run needs that the rush yard does not already give it:
// the word riding over each arrival, drawn on a little canvas of its own. The
// yard, the swarm, the pellets and the shadow all come from ../rush/model.js.

// One label: a sprite and the brush to repaint it. Repainted only when the
// word or the progress changes, never per frame.
export function makeLabel(){
 const c=document.createElement('canvas');c.width=320;c.height=88;
 const x=c.getContext('2d');
 const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
 // Words are for reading, not for atmosphere: no fog on them, whatever the
 // yard is doing behind.
 const sprite=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,depthWrite:false,fog:false}));
 sprite.scale.set(6.2,1.7,1);
 sprite.center.set(.5,0);
 function paint(word,done,mad){
  x.clearRect(0,0,320,88);
  x.font='600 40px Consolas,monospace';
  const w=x.measureText(word).width;
  const pad=18,bw=Math.min(312,w+pad*2),bx=(320-bw)/2;
  x.fillStyle=mad?'rgba(90,20,20,.78)':'rgba(10,17,19,.78)';
  x.beginPath();x.roundRect(bx,14,bw,62,10);x.fill();
  x.strokeStyle=mad?'#ff8f9c':'#ffffff2e';x.lineWidth=2;x.stroke();
  x.textBaseline='middle';
  const x0=(320-w)/2;
  const doneText=word.slice(0,done),rest=word.slice(done);
  x.fillStyle='#ffd79a';x.fillText(doneText,x0,47);
  x.fillStyle='#e9e5d9';x.fillText(rest,x0+x.measureText(doneText).width,47);
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
