import * as T from 'three';

// Everything the typing run needs that the rush yard does not already give it:
// the word riding over each arrival, drawn on a little canvas of its own. The
// yard, the swarm, the pellets and the shadow all come from ../rush/model.js.

// One label: a sprite and the brush to repaint it. Repainted only when the
// word or the progress changes, never per frame.
export function makeLabel(){
 const c=document.createElement('canvas');c.width=448;c.height=184;
 const x=c.getContext('2d');
 const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
 // Words are for reading, not for atmosphere: no fog on them, whatever the
 // yard is doing behind.
 const sprite=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,depthWrite:false,fog:false}));
 sprite.scale.set(10.6,4.35,1);
 sprite.center.set(.5,0);
 const KANJI=/[㐀-鿿々]/;
 // Up to three rows: the reading over the word where the word needs one, the
 // word itself, and under it the keys — typed in amber, the way home in grey.
 function paint(disp,kana,typed,rest,mad){
  x.clearRect(0,0,448,184);
  const ruby=KANJI.test(disp)?kana:'';
  const jpFont='600 52px "Yu Gothic UI",Meiryo,sans-serif';
  x.font=jpFont;
  let dw=x.measureText(disp).width;
  // A very long word gives up size before it gives up fitting on its card.
  const jpFit=dw>396?'600 40px "Yu Gothic UI",Meiryo,sans-serif':jpFont;
  x.font=jpFit;dw=x.measureText(disp).width;
  x.font='600 36px Consolas,monospace';
  const rw=x.measureText(typed+rest).width;
  x.font='500 24px "Yu Gothic UI",Meiryo,sans-serif';
  const bw2=Math.min(442,Math.max(dw,rw,x.measureText(ruby).width)+40),bx=(448-bw2)/2;
  x.fillStyle=mad?'rgba(90,20,20,.82)':'rgba(10,17,19,.82)';
  x.beginPath();x.roundRect(bx,4,bw2,176,13);x.fill();
  x.strokeStyle=mad?'#ff8f9c':'#ffffff2e';x.lineWidth=2;x.stroke();
  x.textBaseline='middle';
  if(ruby){
   x.font='500 24px "Yu Gothic UI",Meiryo,sans-serif';
   x.fillStyle='#a8bdc3';x.fillText(ruby,(448-x.measureText(ruby).width)/2,30);
  }
  x.font=jpFit;
  x.fillStyle='#e9e5d9';x.fillText(disp,(448-dw)/2,ruby?80:58);
  x.font='600 36px Consolas,monospace';
  const x0=(448-rw)/2,y=ruby?146:128;
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
