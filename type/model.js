import * as T from 'three';

// Everything the typing run needs that the rush yard does not already give it:
// the word riding over each arrival, drawn on a little canvas of its own. The
// yard, the swarm, the pellets and the shadow all come from ../rush/model.js.

// One label: a sprite and the brush to repaint it. Repainted only when the
// word or the progress changes, never per frame.
export function makeLabel(){
 const c=document.createElement('canvas');c.width=384;c.height=120;
 const x=c.getContext('2d');
 const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
 // Words are for reading, not for atmosphere: no fog on them, whatever the
 // yard is doing behind.
 const sprite=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,depthWrite:false,fog:false}));
 sprite.scale.set(6.9,2.16,1);
 sprite.center.set(.5,0);
 // Two lines: the word as it is written, and under it the keys as they are
 // being struck — typed so far in amber, the cheapest way home in grey.
 function paint(disp,typed,rest,mad){
  x.clearRect(0,0,384,120);
  x.font='600 34px "Yu Gothic UI",Meiryo,sans-serif';
  const dw=x.measureText(disp).width;
  x.font='600 25px Consolas,monospace';
  const rw=x.measureText(typed+rest).width;
  const pad=18,bw=Math.min(378,Math.max(dw,rw)+pad*2),bx=(384-bw)/2;
  x.fillStyle=mad?'rgba(90,20,20,.8)':'rgba(10,17,19,.8)';
  x.beginPath();x.roundRect(bx,6,bw,108,10);x.fill();
  x.strokeStyle=mad?'#ff8f9c':'#ffffff2e';x.lineWidth=2;x.stroke();
  x.textBaseline='middle';
  x.font='600 34px "Yu Gothic UI",Meiryo,sans-serif';
  x.fillStyle='#e9e5d9';x.fillText(disp,(384-dw)/2,38);
  x.font='600 25px Consolas,monospace';
  const x0=(384-rw)/2;
  x.fillStyle='#ffd79a';x.fillText(typed,x0,86);
  x.fillStyle='#93a6ab';x.fillText(rest,x0+x.measureText(typed).width,86);
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
